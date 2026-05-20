/**
 * Face verification — @vladmandic/face-api (browser)
 * Models: public/models → /models/
 */
import * as faceapi from '@vladmandic/face-api';
import { retry } from '../utils/retry';
import {
      getModelsBaseUrl,
      validateModelsWithRetry,
      formatMissingModelsError,
} from '../utils/faceModelLoader';

const MATCH_THRESHOLD = 0.5;
const MIN_DETECTION_SCORE = 0.45;
const LOAD_TIMEOUT_MS = 60000;

let modelsLoaded = false;
let loadPromise = null;

const detectorOptions = () =>
      new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: MIN_DETECTION_SCORE });

function withTimeout(promise, ms, label) {
      return Promise.race([
            promise,
            new Promise((_, reject) =>
                  setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
            ),
      ]);
}

export const isModelsLoaded = () => modelsLoaded;

export const loadModels = async (onProgress) => {
      if (modelsLoaded) {
            onProgress?.('Models ready');
            return;
      }
      if (loadPromise) return loadPromise;

      loadPromise = (async () => {
            const baseUrl = getModelsBaseUrl();
            onProgress?.('Checking model files...');

            if (import.meta.env.DEV) {
                  console.info('[face-api] Models base URL:', baseUrl);
            }

            const validation = await validateModelsWithRetry(2, 400);
            if (!validation.valid) {
                  const err = new Error(formatMissingModelsError(validation.missing, validation.baseUrl));
                  err.code = 'MODELS_MISSING';
                  err.missing = validation.missing;
                  throw err;
            }

            onProgress?.('Loading AI models...');

            await withTimeout(
                  retry(
                        async () => {
                              await Promise.all([
                                    faceapi.nets.tinyFaceDetector.loadFromUri(baseUrl),
                                    faceapi.nets.faceLandmark68Net.loadFromUri(baseUrl),
                                    faceapi.nets.faceRecognitionNet.loadFromUri(baseUrl),
                              ]);
                        },
                        {
                              retries: 3,
                              baseDelayMs: 1200,
                              shouldRetry: () => true,
                        }
                  ),
                  LOAD_TIMEOUT_MS,
                  'Model loading'
            );

            modelsLoaded = true;
            onProgress?.('Models ready');
            if (import.meta.env.DEV) console.info('[face-api] All models loaded');
      })().catch((err) => {
            loadPromise = null;
            modelsLoaded = false;
            console.error('[face-api] Model load failed:', err);
            if (err.code === 'MODELS_MISSING') throw err;
            throw new Error(
                  'Failed to load face recognition models. Run: node scripts/downloadModels.js'
            );
      });

      return loadPromise;
};

export const loadImage = (src) =>
      new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = src;
      });

export const fileToImage = (file) =>
      new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => loadImage(e.target.result).then(resolve).catch(reject);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
      });

async function detectSingleFaceDescriptor(imageElement) {
      const detections = await faceapi
            .detectAllFaces(imageElement, detectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

      if (!detections?.length) return { error: 'NO_FACE' };
      if (detections.length > 1) return { error: 'MULTIPLE_FACES', count: detections.length };

      const det = detections[0];
      const score = det.detection?.score ?? 0;
      if (score < MIN_DETECTION_SCORE) {
            return { error: 'LOW_QUALITY', score };
      }

      return { detection: det, descriptor: det.descriptor, score };
}

export const getFaceDescriptor = async (imageElement) => {
      const result = await detectSingleFaceDescriptor(imageElement);
      if (result.error) return null;
      return result.detection;
};

export const compareFaces = (desc1, desc2) => {
      const distance = faceapi.euclideanDistance(desc1, desc2);
      const score = Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
      return {
            distance,
            score,
            matched: distance < MATCH_THRESHOLD,
            threshold: MATCH_THRESHOLD,
      };
};

function mapDetectionError(code, context) {
      switch (code) {
            case 'NO_FACE':
                  return context === 'document'
                        ? 'No face detected in the uploaded document. Use a clear photo ID with a visible face.'
                        : 'No face detected in your selfie. Use good lighting and look at the camera.';
            case 'MULTIPLE_FACES':
                  return 'Multiple faces detected. Only one person should be in the frame.';
            case 'LOW_QUALITY':
                  return 'Face image is too blurry or unclear. Please retake with better lighting.';
            default:
                  return 'Face detection failed.';
      }
}

export const verifyFaces = async ({ documentFile, selfieBase64, onStep }) => {
      onStep?.('Loading AI models...');
      await loadModels(onStep);

      onStep?.('Detecting face in document...');
      let docImage;
      try {
            docImage = await fileToImage(documentFile);
      } catch {
            throw new Error('Could not read document image. Upload a valid JPG or PNG.');
      }

      const docResult = await detectSingleFaceDescriptor(docImage);
      if (docResult.error) {
            throw new Error(mapDetectionError(docResult.error, 'document'));
      }

      onStep?.('Detecting face in selfie...');
      let selfieImage;
      try {
            selfieImage = await loadImage(selfieBase64);
      } catch {
            throw new Error('Could not process selfie image.');
      }

      const selfieResult = await detectSingleFaceDescriptor(selfieImage);
      if (selfieResult.error) {
            throw new Error(mapDetectionError(selfieResult.error, 'selfie'));
      }

      onStep?.('Comparing faces...');
      const result = compareFaces(docResult.descriptor, selfieResult.descriptor);

      return {
            matched: result.matched,
            score: result.score,
            distance: result.distance,
            threshold: result.threshold,
            docFaceBox: docResult.detection.detection.box,
            selfieFaceBox: selfieResult.detection.detection.box,
            message: result.matched
                  ? `Face matched! Confidence: ${result.score}%`
                  : `Face does not match document. Confidence: ${result.score}% (need ${Math.round((1 - MATCH_THRESHOLD) * 100)}%+)`,
      };
};

/** Live preview: detect face in video frame (no descriptor — faster) */
export const detectFaceInVideo = async (videoEl) => {
      if (!modelsLoaded) return null;
      const detections = await faceapi.detectAllFaces(videoEl, detectorOptions());
      return detections;
};

export const resetModels = () => {
      modelsLoaded = false;
      loadPromise = null;
};
