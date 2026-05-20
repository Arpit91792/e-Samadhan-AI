import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import {
      Camera, CheckCircle2, XCircle, Loader2, RefreshCw,
      AlertTriangle, ScanFace, VideoOff, Zap,
} from 'lucide-react';
import {
      verifyFaces,
      loadModels,
      detectFaceInVideo,
      isModelsLoaded,
} from '../../../services/faceVerification';
import { validateModelsExist, getModelsBaseUrl } from '../../../utils/faceModelLoader';

const PHASE = {
      MODELS_LOADING: 'models_loading',
      MODELS_ERROR: 'models_error',
      IDLE: 'idle',
      CAMERA: 'camera',
      CAPTURED: 'captured',
      VERIFYING: 'verifying',
      MATCHED: 'matched',
      FAILED: 'failed',
      NO_FACE: 'no_face',
      CAM_ERROR: 'cam_error',
};

const CENTERED_FRAMES_NEEDED = 12;

export default function FaceVerifier({ documentFile, onVerified, onReset }) {
      const webcamRef = useRef(null);
      const detectIntervalRef = useRef(null);
      const centeredCountRef = useRef(0);
      const [phase, setPhase] = useState(PHASE.MODELS_LOADING);
      const [modelStatus, setModelStatus] = useState('Checking AI models...');
      const [modelError, setModelError] = useState('');
      const [selfie, setSelfie] = useState(null);
      const [result, setResult] = useState(null);
      const [step, setStep] = useState('');
      const [progress, setProgress] = useState(0);
      const [faceAligned, setFaceAligned] = useState(false);
      const [livenessHint, setLivenessHint] = useState('Position your face in the oval');

      const preloadModels = useCallback(async () => {
            setPhase(PHASE.MODELS_LOADING);
            setModelError('');
            try {
                  const check = await validateModelsExist();
                  if (!check.valid) {
                        setModelError(
                              `Missing: ${check.missing.slice(0, 2).join(', ')}${check.missing.length > 2 ? '...' : ''}. Run: npm run download-models`
                        );
                        setPhase(PHASE.MODELS_ERROR);
                        return;
                  }
                  await loadModels((msg) => setModelStatus(msg));
                  setPhase(PHASE.IDLE);
            } catch (err) {
                  setModelError(err.message || 'Failed to load models');
                  setPhase(PHASE.MODELS_ERROR);
            }
      }, []);

      useEffect(() => {
            preloadModels();
      }, [preloadModels]);

      const stopDetection = useCallback(() => {
            if (detectIntervalRef.current) {
                  clearInterval(detectIntervalRef.current);
                  detectIntervalRef.current = null;
            }
            centeredCountRef.current = 0;
            setFaceAligned(false);
      }, []);

      const reset = () => {
            stopDetection();
            setPhase(isModelsLoaded() ? PHASE.IDLE : PHASE.MODELS_LOADING);
            setSelfie(null);
            setResult(null);
            setStep('');
            setProgress(0);
            onReset?.();
            if (!isModelsLoaded()) preloadModels();
      };

      const openCamera = () => {
            if (!isModelsLoaded()) {
                  preloadModels();
                  return;
            }
            setSelfie(null);
            setResult(null);
            setLivenessHint('Position your face in the oval');
            setPhase(PHASE.CAMERA);
      };

      const onCamError = () => setPhase(PHASE.CAM_ERROR);

      const capture = useCallback(() => {
            const img = webcamRef.current?.getScreenshot({ width: 640, height: 480 });
            if (img) {
                  stopDetection();
                  setSelfie(img);
                  setPhase(PHASE.CAPTURED);
            }
      }, [stopDetection]);

      const retake = () => {
            setSelfie(null);
            setPhase(PHASE.CAMERA);
      };

      // Live face detection + liveness + auto-capture
      useEffect(() => {
            if (phase !== PHASE.CAMERA || !isModelsLoaded()) return;

            detectIntervalRef.current = setInterval(async () => {
                  const video = webcamRef.current?.video;
                  if (!video || video.readyState < 2) return;

                  try {
                        const detections = await detectFaceInVideo(video);
                        if (!detections?.length) {
                              centeredCountRef.current = 0;
                              setFaceAligned(false);
                              setLivenessHint('No face detected — move closer');
                              return;
                        }
                        if (detections.length > 1) {
                              setFaceAligned(false);
                              setLivenessHint('Only one face allowed in frame');
                              return;
                        }

                        const box = detections[0].box;
                        const vw = video.videoWidth;
                        const vh = video.videoHeight;
                        const cx = box.x + box.width / 2;
                        const cy = box.y + box.height / 2;
                        const inCenter =
                              cx > vw * 0.3 && cx < vw * 0.7 &&
                              cy > vh * 0.25 && cy < vh * 0.65 &&
                              box.width > vw * 0.2 && box.width < vw * 0.55;

                        if (inCenter) {
                              centeredCountRef.current += 1;
                              setFaceAligned(true);
                              setLivenessHint('Hold still — capturing soon...');

                              if (centeredCountRef.current >= CENTERED_FRAMES_NEEDED) {
                                    capture();
                              }
                        } else {
                              centeredCountRef.current = 0;
                              setFaceAligned(false);
                              setLivenessHint('Center your face in the oval');
                        }
                  } catch {
                        /* ignore frame errors */
                  }
            }, 200);

            return stopDetection;
      }, [phase, capture, stopDetection]);

      const runVerification = async () => {
            if (!documentFile || !selfie) return;
            setPhase(PHASE.VERIFYING);
            setProgress(0);
            const steps = ['Loading AI models...', 'Detecting face in document...', 'Detecting face in selfie...', 'Comparing faces...'];
            let stepIdx = 0;
            const onStep = (msg) => {
                  setStep(msg);
                  stepIdx++;
                  setProgress(Math.round((stepIdx / steps.length) * 100));
            };

            try {
                  const res = await verifyFaces({ documentFile, selfieBase64: selfie, onStep });
                  setResult(res);
                  setProgress(100);
                  if (res.matched) {
                        setPhase(PHASE.MATCHED);
                        onVerified?.({ selfie, score: res.score, distance: res.distance });
                  } else {
                        setPhase(PHASE.FAILED);
                  }
            } catch (err) {
                  const msg = err.message || 'Verification failed';
                  setResult({ matched: false, score: 0, message: msg });
                  setPhase(msg.toLowerCase().includes('no face') || msg.includes('Multiple') ? PHASE.NO_FACE : PHASE.FAILED);
            }
      };

      const scoreColor = (s) => (s >= 70 ? 'text-emerald-600' : s >= 50 ? 'text-amber-500' : 'text-red-500');

      return (
            <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                              <ScanFace className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-bold text-blue-700">AI Face Matching</span>
                        </div>
                        {phase === PHASE.MATCHED && (
                              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full text-xs font-black text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> MATCHED
                              </span>
                        )}
                        {(phase === PHASE.FAILED || phase === PHASE.NO_FACE) && (
                              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 border border-red-200 rounded-full text-xs font-black text-red-600">
                                    <XCircle className="w-3.5 h-3.5" /> NOT MATCHED
                              </span>
                        )}
                  </motion.div>

                  <AnimatePresence mode="wait">
                        {phase === PHASE.MODELS_LOADING && (
                              <motion.div key="ml" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="p-6 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col items-center gap-3">
                                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                    <p className="text-sm font-semibold text-blue-800">{modelStatus}</p>
                                    <p className="text-xs text-blue-500">Loading from {getModelsBaseUrl()}</p>
                              </motion.div>
                        )}

                        {phase === PHASE.MODELS_ERROR && (
                              <motion.div key="me" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="p-5 bg-red-50 border-2 border-red-200 rounded-2xl space-y-3">
                                    <div className="flex items-start gap-3">
                                          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                          <motion.div>
                                                <p className="text-sm font-bold text-red-800">Failed to load face recognition models</p>
                                                <p className="text-xs text-red-600 mt-1">{modelError}</p>
                                          </motion.div>
                                    </div>
                                    <motion.button type="button" onClick={preloadModels}
                                          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm">
                                          <RefreshCw className="w-4 h-4" /> Retry Loading Models
                                    </motion.button>
                                    <p className="text-xs text-gray-500 text-center">
                                          Or run in terminal: <code className="bg-gray-100 px-1 rounded">npm run download-models</code>
                                    </p>
                              </motion.div>
                        )}

                        {phase === PHASE.IDLE && (
                              <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="p-4 bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-200 rounded-2xl space-y-4">
                                    <p className="text-xs text-blue-600 leading-relaxed">
                                          AI compares your live selfie with the face on your uploaded ID. Models are loaded and ready.
                                    </p>
                                    {!documentFile ? (
                                          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                                Verify your government document first.
                                          </div>
                                    ) : (
                                          <motion.button type="button" onClick={openCamera}
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm shadow-lg">
                                                <Camera className="w-4 h-4" /> Start Face Verification
                                          </motion.button>
                                    )}
                              </motion.div>
                        )}

                        {phase === PHASE.CAMERA && (
                              <motion.div key="cam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                    <div className={`relative rounded-2xl overflow-hidden border-2 shadow-xl transition-colors ${faceAligned ? 'border-emerald-400' : 'border-blue-400'}`}>
                                          <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full"
                                                videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                                                onUserMediaError={onCamError} />
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className={`w-40 h-52 border-4 rounded-full transition-colors ${faceAligned ? 'border-emerald-400' : 'border-blue-400/80'}`} />
                                          </div>
                                          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                                                <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs font-semibold">
                                                      {livenessHint}
                                                </div>
                                          </div>
                                    </div>
                                    <div className="flex gap-2">
                                          <motion.button type="button" onClick={capture}
                                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm">
                                                <Camera className="w-4 h-4" /> Capture Now
                                          </motion.button>
                                          <button type="button" onClick={reset} className="px-4 py-3.5 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm">Cancel</button>
                                    </div>
                              </motion.div>
                        )}

                        {phase === PHASE.CAPTURED && selfie && (
                              <motion.div key="cap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                    <img src={selfie} alt="Selfie" className="w-full rounded-2xl border-2 border-amber-400 max-h-56 object-cover" />
                                    <div className="flex gap-2">
                                          <motion.button type="button" onClick={runVerification}
                                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm">
                                                <Zap className="w-4 h-4" /> Verify Face with AI
                                          </motion.button>
                                          <button type="button" onClick={retake} className="px-4 py-3.5 bg-gray-100 rounded-xl text-sm font-semibold">
                                                <RefreshCw className="w-4 h-4 inline" /> Retake
                                          </button>
                                    </div>
                              </motion.div>
                        )}

                        {phase === PHASE.VERIFYING && (
                              <motion.div key="ver" className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                                    <motion.div className="flex items-center gap-2">
                                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                          <span className="text-sm font-semibold text-blue-800">{step}</span>
                                          <span className="ml-auto font-bold text-blue-600">{progress}%</span>
                                    </motion.div>
                                    <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                                          <motion.div animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-blue-500 to-violet-500" />
                                    </div>
                              </motion.div>
                        )}

                        {phase === PHASE.MATCHED && result && (
                              <motion.div key="ok" className="space-y-3">
                                    <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                                          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                          <div>
                                                <p className="font-black text-emerald-800">✅ Face Verified — MATCHED</p>
                                                <p className={`text-2xl font-black ${scoreColor(result.score)}`}>{result.score}% confidence</p>
                                                <p className="text-xs text-emerald-600">Distance: {result.distance?.toFixed(3)} (threshold: {result.threshold})</p>
                                          </div>
                                    </div>
                                    <button type="button" onClick={reset} className="w-full py-2.5 text-sm border rounded-xl text-gray-500 flex items-center justify-center gap-2">
                                          <RefreshCw className="w-3.5 h-3.5" /> Retake
                                    </button>
                              </motion.div>
                        )}

                        {(phase === PHASE.FAILED || phase === PHASE.NO_FACE) && result && (
                              <motion.div key="fail" className="space-y-3">
                                    <motion.div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                                          <p className="font-black text-red-800">❌ NOT MATCHED</p>
                                          <p className="text-xs text-red-600 mt-1">{result.message}</p>
                                    </motion.div>
                                    <button type="button" onClick={openCamera}
                                          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                                          <RefreshCw className="w-4 h-4" /> Try Again
                                    </button>
                              </motion.div>
                        )}

                        {phase === PHASE.CAM_ERROR && (
                              <motion.div key="cerr" className="p-5 bg-red-50 border-2 border-red-200 rounded-2xl space-y-3">
                                    <VideoOff className="w-8 h-8 text-red-500" />
                                    <p className="text-sm font-bold text-red-800">Camera permission denied</p>
                                    <p className="text-xs text-red-600">Allow camera in browser settings, then retry.</p>
                                    <button type="button" onClick={openCamera} className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm">Try Again</button>
                              </motion.div>
                        )}
                  </AnimatePresence>
            </motion.div>
      );
}
