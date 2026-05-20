import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import {
      ShieldCheck, Camera, CheckCircle2, XCircle, Loader2, RefreshCw,
      AlertTriangle, ScanFace, VideoOff, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
      loadLivenessModels,
      detectFaceWithLandmarks,
      LivenessChallengeRunner,
      TASK_LABELS,
      isLivenessModelsLoaded,
} from '../../../services/livenessDetection';
import {
      startLivenessSession,
      verifyLivenessSession,
      getLivenessAttemptStatus,
      devResetLiveness,
} from '../../../api/liveness';

const PHASE = {
      MODELS: 'models',
      MODELS_ERROR: 'models_error',
      READY: 'ready',
      CAMERA: 'camera',
      CHALLENGE: 'challenge',
      VERIFYING: 'verifying',
      SUCCESS: 'success',
      FAILED: 'failed',
      CAM_ERROR: 'cam_error',
};

export default function LivenessVerifier({ email, govtIdType, docVerified, onVerified, onReset }) {
      const webcamRef = useRef(null);
      const loopRef = useRef(null);
      const runnerRef = useRef(null);
      const completedRef = useRef([]);
      const taskIndexRef = useRef(0);
      const DETECT_MIN_GAP_MS = 16;
      const sessionStartingRef = useRef(false);

      const [phase, setPhase] = useState(PHASE.MODELS);
      const [modelStatus, setModelStatus] = useState('Initializing AI...');
      const [modelError, setModelError] = useState('');
      const [sessionId, setSessionId] = useState(null);
      const [tasks, setTasks] = useState([]);
      const [taskIndex, setTaskIndex] = useState(0);
      const [completed, setCompleted] = useState([]);
      const [hint, setHint] = useState('');
      const [confidence, setConfidence] = useState(0);
      const [capture, setCapture] = useState(null);
      const [errorMsg, setErrorMsg] = useState('');
      const [sessionLoading, setSessionLoading] = useState(false);
      const [cooldownSeconds, setCooldownSeconds] = useState(0);
      const [attemptInfo, setAttemptInfo] = useState(null);

      const currentTask = tasks[taskIndex];
      const isBlocked = cooldownSeconds > 0;

      const refreshAttemptStatus = useCallback(async () => {
            if (!email) return;
            try {
                  const status = await getLivenessAttemptStatus(email);
                  setAttemptInfo(status);
                  if (status.blocked && status.retryAfterSeconds > 0) {
                        setCooldownSeconds(status.retryAfterSeconds);
                        setErrorMsg(
                              status.message ||
                                    `You have reached maximum attempts. Please retry after ${Math.ceil(status.retryAfterSeconds / 60)} minutes.`
                        );
                  } else {
                        setCooldownSeconds(0);
                        if (phase === PHASE.READY) setErrorMsg('');
                  }
            } catch {
                  /* ignore status check errors */
            }
      }, [email, phase]);

      useEffect(() => {
            if (email && phase === PHASE.READY) refreshAttemptStatus();
      }, [email, phase, refreshAttemptStatus]);

      useEffect(() => {
            if (cooldownSeconds <= 0) return undefined;
            const t = setInterval(() => {
                  setCooldownSeconds((s) => {
                        if (s <= 1) {
                              refreshAttemptStatus();
                              return 0;
                        }
                        return s - 1;
                  });
            }, 1000);
            return () => clearInterval(t);
      }, [cooldownSeconds, refreshAttemptStatus]);

      const preload = useCallback(async () => {
            setPhase(PHASE.MODELS);
            setModelError('');
            try {
                  await loadLivenessModels((m) => setModelStatus(m));
                  setPhase(PHASE.READY);
            } catch (e) {
                  setModelError(e.message);
                  setPhase(PHASE.MODELS_ERROR);
            }
      }, []);

      useEffect(() => {
            preload();
            return () => {
                  if (loopRef.current) clearTimeout(loopRef.current);
            };
      }, [preload]);

      const startSession = async () => {
            if (sessionStartingRef.current || sessionLoading || isBlocked) return;
            if (!email) {
                  toast.error('Enter your email in step 1 before liveness check.', { id: 'liveness-email' });
                  return;
            }
            if (!docVerified) {
                  toast.error('Verify your government ID first.', { id: 'liveness-doc' });
                  return;
            }

            sessionStartingRef.current = true;
            setSessionLoading(true);
            setErrorMsg('');
            try {
                  const data = await startLivenessSession({ email, govtIdType });
                  setSessionId(data.sessionId);
                  setTasks(data.tasks);
                  setTaskIndex(0);
                  setCompleted([]);
                  setPhase(PHASE.CAMERA);
                  toast.success('Follow the on-screen instructions', { id: 'liveness-start-ok' });
            } catch (err) {
                  const retryAfter = err.response?.data?.retryAfterSeconds;
                  const msg =
                        err.response?.data?.message ||
                        (err.code === 'ECONNABORTED'
                              ? 'Server timed out. Check that MongoDB is connected and restart the backend.'
                              : 'Could not start liveness session. Ensure the backend is running.');
                  if (retryAfter > 0) setCooldownSeconds(retryAfter);
                  setErrorMsg(msg);
                  setPhase(PHASE.READY);
                  toast.error(msg, { id: 'liveness-start-error' });
            } finally {
                  sessionStartingRef.current = false;
                  setSessionLoading(false);
            }
      };

      const handleDevReset = async () => {
            if (!email) return;
            try {
                  await devResetLiveness(email);
                  setCooldownSeconds(0);
                  setErrorMsg('');
                  setAttemptInfo(null);
                  toast.success('Liveness session reset', { id: 'liveness-dev-reset' });
                  refreshAttemptStatus();
            } catch (err) {
                  toast.error(err.response?.data?.message || 'Reset failed', { id: 'liveness-dev-reset-err' });
            }
      };

      const beginChallenges = () => {
            if (!tasks.length) return;
            taskIndexRef.current = 0;
            completedRef.current = [];
            setPhase(PHASE.CHALLENGE);
            setHint(TASK_LABELS[tasks[0]] || 'Follow the instruction');
            runnerRef.current = new LivenessChallengeRunner(tasks[0]);
      };

      useEffect(() => {
            if (phase !== PHASE.CHALLENGE || !tasks.length) return;

            let active = true;
            let lastRunAt = 0;
            let loopTimer = null;

            const scheduleNext = (delay = 0) => {
                  if (!active) return;
                  loopTimer = setTimeout(runTick, delay);
                  loopRef.current = loopTimer;
            };

            const runTick = async () => {
                  if (!active) return;

                  const video = webcamRef.current?.video;
                  if (!video || video.readyState < 2) {
                        scheduleNext(32);
                        return;
                  }

                  const idx = taskIndexRef.current;
                  const task = tasks[idx];
                  if (!task) return;

                  if (!runnerRef.current || runnerRef.current.task !== task) {
                        runnerRef.current = new LivenessChallengeRunner(task);
                  }

                  const now = performance.now();
                  const wait = Math.max(0, DETECT_MIN_GAP_MS - (now - lastRunAt));
                  if (wait > 0) {
                        scheduleNext(wait);
                        return;
                  }

                  lastRunAt = now;
                  try {
                        const result = await detectFaceWithLandmarks(video, { fast: true });
                        if (!active) return;

                        if (result.error === 'NO_FACE') {
                              setHint('No face detected — center your face in the oval');
                        } else if (result.error === 'MULTIPLE_FACES') {
                              setErrorMsg('Multiple faces detected. Only one person allowed.');
                              setPhase(PHASE.FAILED);
                              active = false;
                              return;
                        } else if (result.error === 'LOW_QUALITY') {
                              setHint('Move closer and improve lighting');
                        } else {
                              const evalResult = runnerRef.current.evaluate(result.detection);
                              if (evalResult.reason === 'STATIC_IMAGE') {
                                    setErrorMsg(evalResult.message);
                                    setPhase(PHASE.FAILED);
                                    active = false;
                                    return;
                              }
                              if (evalResult.passed) {
                                    if (!completedRef.current.includes(task)) {
                                          completedRef.current = [...completedRef.current, task];
                                          setCompleted([...completedRef.current]);
                                          setConfidence((c) => Math.max(c, evalResult.confidence || 85));
                                          toast.success('✓ Action verified!');
                                    }

                                    if (idx + 1 < tasks.length) {
                                          taskIndexRef.current = idx + 1;
                                          setTaskIndex(idx + 1);
                                          setHint(TASK_LABELS[tasks[idx + 1]]);
                                          runnerRef.current = new LivenessChallengeRunner(tasks[idx + 1]);
                                    } else {
                                          const img = webcamRef.current?.getScreenshot({ width: 640, height: 480 });
                                          setCapture(img);
                                          active = false;
                                          finishVerification([...completedRef.current], evalResult.confidence || 90, img);
                                          return;
                                    }
                              } else {
                                    setHint(evalResult.hint || TASK_LABELS[task]);
                              }
                        }
                  } catch {
                        /* frame skip */
                  }

                  scheduleNext(0);
            };

            runTick();
            return () => {
                  active = false;
                  if (loopTimer) clearTimeout(loopTimer);
            };
      }, [phase, tasks]);

      const finishVerification = async (actionsCompleted, score, selfie) => {
            setPhase(PHASE.VERIFYING);
            try {
                  const res = await verifyLivenessSession({
                        sessionId,
                        email,
                        completedActions: actionsCompleted,
                        confidenceScore: score,
                        fraudFlags: [],
                  });
                  setConfidence(res.confidenceScore || score);
                  setPhase(PHASE.SUCCESS);
                  onVerified?.({
                        sessionId,
                        selfie,
                        score: res.confidenceScore,
                        completedActions: actionsCompleted,
                  });
                  toast.success('🎉 Liveness verified — you are physically present!', { id: 'liveness-verify-ok' });
            } catch (err) {
                  const retryAfter = err.response?.data?.retryAfterSeconds;
                  const msg = err.response?.data?.message || 'Server verification failed';
                  if (retryAfter > 0) setCooldownSeconds(retryAfter);
                  setErrorMsg(msg);
                  setPhase(PHASE.FAILED);
                  toast.error(msg, { id: 'liveness-verify-error' });
                  refreshAttemptStatus();
            }
      };

      const resetAll = () => {
            if (loopRef.current) clearTimeout(loopRef.current);
            setSessionId(null);
            setTasks([]);
            setTaskIndex(0);
            setCompleted([]);
            setCapture(null);
            setErrorMsg('');
            setPhase(isLivenessModelsLoaded() ? PHASE.READY : PHASE.MODELS);
            onReset?.();
      };

      const progress = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;

      return (
            <div className="glass rounded-2xl border border-white/50 shadow-xl overflow-hidden">
                  <motion.div
                        className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-5 py-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                  >
                        <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                    <h3 className="text-white font-black text-sm">AI Liveness Detection</h3>
                                    <p className="text-blue-100 text-xs">Government eKYC — anti-spoof verification</p>
                              </div>
                        </div>
                  </motion.div>

                  <div className="p-5 space-y-4">
                        <AnimatePresence mode="wait">
                              {phase === PHASE.MODELS && (
                                    <motion.div key="m" className="flex flex-col items-center py-8 gap-3">
                                          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                          <p className="text-sm font-semibold text-slate-700">{modelStatus}</p>
                                    </motion.div>
                              )}

                              {phase === PHASE.MODELS_ERROR && (
                                    <motion.div key="me" className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                                          <p className="text-sm text-red-700">{modelError}</p>
                                          <button type="button" onClick={preload} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold">
                                                Retry
                                          </button>
                                    </motion.div>
                              )}

                              {phase === PHASE.READY && (
                                    <motion.div key="r" className="space-y-4">
                                          {errorMsg && (
                                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                                                      {errorMsg}
                                                      {isBlocked && (
                                                            <p className="mt-2 font-bold text-red-800">
                                                                  Retry in {Math.floor(cooldownSeconds / 60)}:{String(cooldownSeconds % 60).padStart(2, '0')}
                                                            </p>
                                                      )}
                                                </div>
                                          )}
                                          {attemptInfo && !isBlocked && attemptInfo.attempts > 0 && (
                                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                                      Attempts used: {attemptInfo.attempts} / {attemptInfo.maxAttempts}
                                                </p>
                                          )}
                                          <div className="p-4 bg-blue-50/80 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed">
                                                <Sparkles className="w-4 h-4 inline mr-1" />
                                                Prove you are physically present. You will be asked to blink and turn your head left or right — not a photo or screen replay.
                                          </div>
                                          <button
                                                type="button"
                                                onClick={startSession}
                                                disabled={!docVerified || sessionLoading || isBlocked}
                                                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                          >
                                                {sessionLoading ? (
                                                      <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                      <Camera className="w-4 h-4" />
                                                )}
                                                {isBlocked
                                                      ? `Wait ${Math.ceil(cooldownSeconds / 60)} min to retry`
                                                      : sessionLoading
                                                        ? 'Starting…'
                                                        : 'Start Liveness Verification'}
                                          </button>
                                          {import.meta.env.DEV && (
                                                <button
                                                      type="button"
                                                      onClick={handleDevReset}
                                                      className="w-full py-2 text-xs font-semibold text-slate-500 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50"
                                                >
                                                      Reset Liveness Session (dev)
                                                </button>
                                          )}
                                    </motion.div>
                              )}

                              {(phase === PHASE.CAMERA || phase === PHASE.CHALLENGE || phase === PHASE.VERIFYING) && (
                                    <motion.div key="cam" className="space-y-3">
                                          {tasks.length > 0 && (
                                                <motion.div className="space-y-2">
                                                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                                                            <span>Progress</span>
                                                            <span>{completed.length}/{tasks.length} actions</span>
                                                      </div>
                                                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                  animate={{ width: `${progress}%` }}
                                                                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                                                            />
                                                      </div>
                                                      <div className="flex flex-wrap gap-1.5">
                                                            {tasks.map((t, i) => (
                                                                  <span
                                                                        key={t}
                                                                        className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                                                                              completed.includes(t)
                                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                                    : i === taskIndex
                                                                                      ? 'bg-blue-100 text-blue-700 animate-pulse'
                                                                                      : 'bg-slate-100 text-slate-400'
                                                                        }`}
                                                                  >
                                                                        {completed.includes(t) ? '✓' : i + 1}. {TASK_LABELS[t]}
                                                                  </span>
                                                            ))}
                                                      </div>
                                                </motion.div>
                                          )}

                                          <div className="relative rounded-2xl overflow-hidden border-2 border-blue-400 shadow-lg">
                                                <Webcam
                                                      ref={webcamRef}
                                                      screenshotFormat="image/jpeg"
                                                      className="w-full"
                                                      videoConstraints={{ facingMode: 'user', width: 480, height: 360 }}
                                                      onUserMedia={() => phase === PHASE.CAMERA && beginChallenges()}
                                                      onUserMediaError={() => setPhase(PHASE.CAM_ERROR)}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                      <motion.div
                                                            animate={{ borderColor: ['#3b82f6', '#8b5cf6', '#3b82f6'] }}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                            className="w-44 h-56 border-4 border-dashed rounded-[50%] opacity-80"
                                                      />
                                                </div>
                                                {phase === PHASE.CHALLENGE && (
                                                      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4">
                                                            <p className="text-white text-center font-bold text-sm">{hint}</p>
                                                      </div>
                                                )}
                                                {phase === PHASE.VERIFYING && (
                                                      <motion.div className="absolute inset-0 bg-blue-900/60 flex items-center justify-center">
                                                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                                                      </motion.div>
                                                )}
                                          </div>

                                          {phase === PHASE.CAMERA && (
                                                <p className="text-xs text-center text-slate-500">Allow camera access to begin live checks...</p>
                                          )}
                                    </motion.div>
                              )}

                              {phase === PHASE.SUCCESS && (
                                    <motion.div key="ok" initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="text-center space-y-4 py-4">
                                          <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring' }}
                                                className="w-20 h-20 mx-auto rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200"
                                          >
                                                <CheckCircle2 className="w-10 h-10 text-white" />
                                          </motion.div>
                                          <div>
                                                <p className="text-lg font-black text-emerald-800">Liveness Verified</p>
                                                <p className="text-sm text-emerald-600">Confidence: {confidence}%</p>
                                                <p className="text-xs text-slate-500 mt-1">Anti-spoof checks passed</p>
                                          </div>
                                    </motion.div>
                              )}

                              {phase === PHASE.FAILED && (
                                    <motion.div key="fail" className="p-4 bg-red-50 border-2 border-red-200 rounded-xl space-y-3">
                                          <div className="flex gap-2">
                                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                <div>
                                                      <p className="font-bold text-red-800">Verification Failed</p>
                                                      <p className="text-xs text-red-600 mt-1">{errorMsg || 'Could not confirm live presence.'}</p>
                                                </div>
                                          </div>
                                          <button type="button" onClick={resetAll} className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm">
                                                <RefreshCw className="w-4 h-4 inline mr-1" /> Try Again
                                          </button>
                                    </motion.div>
                              )}

                              {phase === PHASE.CAM_ERROR && (
                                    <motion.div key="ce" className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                                          <VideoOff className="w-8 h-8 text-red-500 mx-auto" />
                                          <p className="text-sm text-center text-red-700 font-semibold">Camera access denied</p>
                                          <button type="button" onClick={() => setPhase(PHASE.READY)} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold">
                                                Retry
                                          </button>
                                    </motion.div>
                              )}
                        </AnimatePresence>

                        {phase === PHASE.SUCCESS && (
                              <button type="button" onClick={resetAll} className="w-full py-2 text-xs text-slate-500 border rounded-lg">
                                    Restart verification
                              </button>
                        )}
                  </div>
            </div>
      );
}
