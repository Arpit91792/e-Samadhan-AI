/**
 * AI Liveness Detection — face-api.js landmarks (browser)
 * Anti-spoof: motion variance, single face, live challenge completion
 */
import * as faceapi from '@vladmandic/face-api';
import { retry } from '../utils/retry';
import {
      getModelsBaseUrl,
      validateModelsWithRetry,
      formatMissingModelsError,
} from '../utils/faceModelLoader';

export const LIVENESS_TASKS = {
      BLINK: 'blink',
      TURN_LEFT: 'turn_left',
      TURN_RIGHT: 'turn_right',
};

export const TASK_LABELS = {
      [LIVENESS_TASKS.BLINK]: 'Blink once naturally',
      [LIVENESS_TASKS.TURN_LEFT]: 'Turn your head left',
      [LIVENESS_TASKS.TURN_RIGHT]: 'Turn your head right',
};

const TASK_POOL = Object.values(LIVENESS_TASKS);
const LOAD_TIMEOUT_MS = 60000;
const MIN_DETECTION_SCORE = 0.5;
/** Smaller input = much faster realtime inference (~3–4× vs 416) */
const REALTIME_INPUT_SIZE = 224;
const REALTIME_SCORE_THRESHOLD = 0.4;
const BLINK_BASELINE_FRAMES = 5;
const BLINK_EAR_HISTORY = 8;

let modelsLoaded = false;
let loadPromise = null;

const detectorOptions = (fast = false) =>
      new faceapi.TinyFaceDetectorOptions({
            inputSize: fast ? REALTIME_INPUT_SIZE : 416,
            scoreThreshold: fast ? REALTIME_SCORE_THRESHOLD : MIN_DETECTION_SCORE,
      });

function dist(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Eye Aspect Ratio — blink when EAR drops then recovers */
export function getEyeAspectRatio(landmarks) {
      const left = [36, 37, 38, 39, 40, 41].map((i) => landmarks.positions[i]);
      const right = [42, 43, 44, 45, 46, 47].map((i) => landmarks.positions[i]);
      const ear = (eye) => {
            const v1 = dist(eye[1], eye[5]);
            const v2 = dist(eye[2], eye[4]);
            const h = dist(eye[0], eye[3]);
            return h > 0 ? (v1 + v2) / (2 * h) : 0;
      };
      return { left: ear(left), right: ear(right), avg: (ear(left) + ear(right)) / 2 };
}

/** Head pose: nose offset vs face box center (mirrored webcam) */
export function getHeadPoseOffset(detection) {
      const box = detection.detection.box;
      const nose = detection.landmarks.positions[30];
      const centerX = box.x + box.width / 2;
      return (nose.x - centerX) / box.width;
}

export function pickRandomTasks(count = 3) {
      const shuffled = [...TASK_POOL].sort(() => Math.random() - 0.5);
      const tasks = shuffled.slice(0, Math.min(count, TASK_POOL.length));
      if (!tasks.includes(LIVENESS_TASKS.BLINK)) {
            tasks[tasks.length - 1] = LIVENESS_TASKS.BLINK;
      }
      return [...new Set(tasks)];
}

export const isLivenessModelsLoaded = () => modelsLoaded;

export const loadLivenessModels = async (onProgress) => {
      if (modelsLoaded) return;
      if (loadPromise) return loadPromise;

      loadPromise = (async () => {
            const baseUrl = getModelsBaseUrl();
            onProgress?.('Checking AI models...');
            const validation = await validateModelsWithRetry(2, 400);
            if (!validation.valid) {
                  throw new Error(formatMissingModelsError(validation.missing, validation.baseUrl));
            }
            onProgress?.('Loading liveness AI...');
            await Promise.race([
                  retry(
                        () =>
                              Promise.all([
                                    faceapi.nets.tinyFaceDetector.loadFromUri(baseUrl),
                                    faceapi.nets.faceLandmark68Net.loadFromUri(baseUrl),
                              ]),
                        { retries: 3, baseDelayMs: 1000 }
                  ),
                  new Promise((_, rej) =>
                        setTimeout(() => rej(new Error('Model load timeout')), LOAD_TIMEOUT_MS)
                  ),
            ]);
            modelsLoaded = true;
            onProgress?.('AI ready');
      })().catch((err) => {
            loadPromise = null;
            throw err;
      });

      return loadPromise;
};

export async function detectFaceWithLandmarks(videoOrImage, { fast = false } = {}) {
      if (!modelsLoaded) await loadLivenessModels();
      const detections = await faceapi
            .detectAllFaces(videoOrImage, detectorOptions(fast))
            .withFaceLandmarks();

      if (!detections.length) return { error: 'NO_FACE' };
      if (detections.length > 1) return { error: 'MULTIPLE_FACES', count: detections.length };

      const det = detections[0];
      const scoreMin = fast ? REALTIME_SCORE_THRESHOLD : MIN_DETECTION_SCORE;
      if ((det.detection?.score ?? 0) < scoreMin) {
            return { error: 'LOW_QUALITY' };
      }
      return { detection: det };
}

/** Motion variance anti-spoof — static photo fails */
export function createMotionTracker(maxSamples = 40) {
      const samples = [];
      return {
            push(nosePoint) {
                  if (nosePoint) samples.push({ x: nosePoint.x, y: nosePoint.y, t: Date.now() });
                  if (samples.length > maxSamples) samples.shift();
            },
            getVariance() {
                  if (samples.length < 8) return 0;
                  const mx = samples.reduce((s, p) => s + p.x, 0) / samples.length;
                  const my = samples.reduce((s, p) => s + p.y, 0) / samples.length;
                  const v =
                        samples.reduce((s, p) => s + (p.x - mx) ** 2 + (p.y - my) ** 2, 0) /
                        samples.length;
                  return Math.sqrt(v);
            },
            reset() {
                  samples.length = 0;
            },
      };
}

export class LivenessChallengeRunner {
      constructor(task, { onProgress } = {}) {
            this.task = task;
            this.onProgress = onProgress;
            this._resetBlinkState();
            this.motion = createMotionTracker();
            this.frameCount = 0;
            this.startTime = Date.now();
      }

      _resetBlinkState() {
            this.blinkPhase = 'calibrate';
            this.earBaseline = null;
            this.baselineSamples = 0;
            this.prevEar = null;
            this.earHistory = [];
      }

      evaluate(detection) {
            this.frameCount++;
            const nose = detection.landmarks.positions[30];
            this.motion.push(nose);

            if (this.frameCount > 18 && this.motion.getVariance() < 1.2) {
                  return { passed: false, reason: 'STATIC_IMAGE', message: 'No live movement detected. Use your live camera, not a photo.' };
            }

            switch (this.task) {
                  case LIVENESS_TASKS.BLINK:
                        return this._evalBlink(detection);
                  case LIVENESS_TASKS.TURN_LEFT:
                        return this._evalTurn(detection, 'left');
                  case LIVENESS_TASKS.TURN_RIGHT:
                        return this._evalTurn(detection, 'right');
                  default:
                        return { passed: false };
            }
      }

      _evalBlink(detection) {
            const { left, right, avg } = getEyeAspectRatio(detection.landmarks);
            const ear = avg;
            const eyesClosed =
                  avg < (this.earBaseline ?? avg) * 0.72 ||
                  (left > 0 && right > 0 && Math.min(left, right) < (this.earBaseline ?? avg) * 0.7);

            if (this.blinkPhase === 'calibrate') {
                  if (ear > 0.12) {
                        this.baselineSamples += 1;
                        this.earBaseline =
                              this.earBaseline == null ? ear : this.earBaseline * 0.75 + ear * 0.25;
                  }
                  if (this.baselineSamples >= BLINK_BASELINE_FRAMES) {
                        this.blinkPhase = 'watching';
                        this.prevEar = ear;
                        this.earHistory = [ear];
                  }
                  return { passed: false, hint: 'Look at the camera, then blink once' };
            }

            const baseline = Math.max(this.earBaseline, 0.1);
            const closedThresh = baseline * 0.7;
            const openThresh = baseline * 0.88;

            this.earHistory.push(ear);
            if (this.earHistory.length > BLINK_EAR_HISTORY) this.earHistory.shift();

            if (ear >= openThresh * 0.9) {
                  this.earBaseline = baseline * 0.92 + ear * 0.08;
            }

            const peak = this.earHistory.length ? Math.max(...this.earHistory) : ear;
            const trough = this.earHistory.length ? Math.min(...this.earHistory) : ear;
            const windowDrop = peak - trough;

            if (this.blinkPhase === 'watching') {
                  const frameDrop = this.prevEar != null && this.prevEar - ear > baseline * 0.16;
                  if (eyesClosed || ear < closedThresh || frameDrop || windowDrop > baseline * 0.22) {
                        this.blinkPhase = 'closed';
                  }
            } else if (this.blinkPhase === 'closed') {
                  if (ear >= openThresh || (windowDrop > baseline * 0.2 && ear >= baseline * 0.84)) {
                        return { passed: true, confidence: 95 };
                  }
            }

            this.prevEar = ear;
            return { passed: false, hint: 'Blink once naturally' };
      }

      _evalTurn(detection, direction) {
            const offset = getHeadPoseOffset(detection);
            const threshold = 0.1;
            if (direction === 'left' && offset > threshold) {
                  return { passed: true, confidence: 88 };
            }
            if (direction === 'right' && offset < -threshold) {
                  return { passed: true, confidence: 88 };
            }
            return {
                  passed: false,
                  hint: direction === 'left' ? 'Turn your head to the left' : 'Turn your head to the right',
            };
      }

}
