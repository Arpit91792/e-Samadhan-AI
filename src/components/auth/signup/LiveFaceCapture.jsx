import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import {
      Camera, RefreshCw, CheckCircle2, AlertTriangle, X, Loader2,
      Video, VideoOff, ZoomIn, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';

// ──────────────────────────────────────────────────────────────────────────────
// ENHANCED LIVE FACE CAPTURE WITH MANDATORY VERIFICATION
// ──────────────────────────────────────────────────────────────────────────────

const CAMERA_STATES = {
      IDLE: 'idle',
      REQUESTING: 'requesting',
      LOADING: 'loading',
      READY: 'ready',
      CAPTURED: 'captured',
      ERROR: 'error',
      DENIED: 'denied',
};

export default function LiveFaceCapture({
      onCapture,
      onConfirm,
      label = '📸 Live Face Verification',
      required = true,
      showIsMandatory = true
}) {
      const webcamRef = useRef(null);
      const [status, setStatus] = useState(CAMERA_STATES.IDLE);
      const [captured, setCaptured] = useState(null);
      const [confirmed, setConfirmed] = useState(false);
      const [error, setError] = useState('');
      const [loading, setLoading] = useState(false);
      const [cameraPermission, setCameraPermission] = useState(null);
      const [facingMode, setFacingMode] = useState('user');

      // ── Camera permission detection ────────────────────────────────────────
      useEffect(() => {
            if (navigator.permissions?.query) {
                  navigator.permissions.query({ name: 'camera' }).then(permissionStatus => {
                        setCameraPermission(permissionStatus.state);
                        permissionStatus.addEventListener('change', () => {
                              setCameraPermission(permissionStatus.state);
                        });
                  });
            }
      }, []);

      // ── Open camera ────────────────────────────────────────────────────────
      const openCamera = useCallback(() => {
            setError('');
            setStatus(CAMERA_STATES.REQUESTING);
            setCaptured(null);
            setConfirmed(false);
            setTimeout(() => setStatus(CAMERA_STATES.LOADING), 300);
      }, []);

      // ── Camera ready ───────────────────────────────────────────────────────
      const onCameraReady = useCallback(() => {
            setStatus(CAMERA_STATES.READY);
            setError('');
      }, []);

      // ── Camera error handler ───────────────────────────────────────────────
      const onCameraError = useCallback((err) => {
            console.error('Camera error:', err);
            let errorMessage = 'Camera access failed. Please check your device.';
            let newStatus = CAMERA_STATES.ERROR;

            if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
                  errorMessage = 'Camera permission denied. Please enable camera access in your browser settings.';
                  newStatus = CAMERA_STATES.DENIED;
            } else if (err?.name === 'NotFoundError') {
                  errorMessage = 'No camera found on your device.';
            } else if (err?.name === 'NotReadableError') {
                  errorMessage = 'Camera is already in use. Please close other apps using the camera.';
            }

            setError(errorMessage);
            setStatus(newStatus);
            toast.error(errorMessage);
      }, []);

      // ── Capture photo ──────────────────────────────────────────────────────
      const capturePhoto = useCallback(() => {
            if (!webcamRef.current) {
                  toast.error('Camera not ready. Please try again.');
                  return;
            }

            try {
                  setLoading(true);
                  const screenshot = webcamRef.current.getScreenshot({
                        width: 640,
                        height: 480,
                  });

                  if (!screenshot) {
                        toast.error('Failed to capture photo. Please try again.');
                        return;
                  }

                  setCaptured(screenshot);
                  setStatus(CAMERA_STATES.CAPTURED);
                  onCapture?.(screenshot);
                  toast.success('📸 Photo captured successfully!');
            } catch (err) {
                  console.error('Capture error:', err);
                  toast.error('Photo capture failed. Please try again.');
                  setError('Photo capture failed. Please try again.');
            } finally {
                  setLoading(false);
            }
      }, [onCapture]);

      // ── Retake photo ───────────────────────────────────────────────────────
      const retakePhoto = useCallback(() => {
            setCaptured(null);
            setConfirmed(false);
            setStatus(CAMERA_STATES.READY);
            setError('');
            onCapture?.(null);
            toast.success('Ready to capture again');
      }, [onCapture]);

      // ── Confirm photo ──────────────────────────────────────────────────────
      const confirmPhoto = useCallback(() => {
            setConfirmed(true);
            setStatus(CAMERA_STATES.IDLE);
            onConfirm?.(captured);
            toast.success('✅ Face verification complete!');
      }, [captured, onConfirm]);

      // ── Close camera ───────────────────────────────────────────────────────
      const closeCamera = useCallback(() => {
            setStatus(CAMERA_STATES.IDLE);
            setCaptured(null);
            setError('');
      }, []);

      // ── Toggle camera ──────────────────────────────────────────────────────
      const toggleCamera = useCallback(() => {
            setFacingMode(m => m === 'user' ? 'environment' : 'user');
            retakePhoto();
      }, [retakePhoto]);

      // ─────────────────────────────────────────────────────────────────────────
      // RENDER STATES
      // ─────────────────────────────────────────────────────────────────────────

      return (
            <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full"
            >
                  {/* ── Header ─────────────────────────────────────────────────────────── */}
                  <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <span className="text-lg">{label.split(' ')[0]}</span>
                                    {label.split(' ').slice(1).join(' ')}
                              </h3>
                              {confirmed && (
                                    <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-full flex items-center gap-1.5"
                                    >
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          <span className="text-xs font-bold text-emerald-700">Verified</span>
                                    </motion.div>
                              )}
                        </div>
                        {showIsMandatory && required && (
                              <p className="text-xs text-gray-500">
                                    <span className="text-red-500 font-bold">*</span> Mandatory for account verification
                              </p>
                        )}
                  </div>

                  <AnimatePresence mode="wait">
                        {/* ── IDLE STATE (No camera open) ────────────────────────────────── */}
                        {status === CAMERA_STATES.IDLE && !captured && (
                              <motion.div
                                    key="idle"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                              >
                                    {!confirmed ? (
                                          <button
                                                type="button"
                                                onClick={openCamera}
                                                className="w-full relative overflow-hidden group"
                                          >
                                                {/* Glassmorphism Background */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-violet-500/10 backdrop-blur-md rounded-2xl border border-white/30 group-hover:border-white/50 transition-all" />

                                                {/* Content */}
                                                <div className="relative px-6 py-12 flex flex-col items-center justify-center gap-4">
                                                      <motion.div
                                                            animate={{ y: [0, -10, 0] }}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                            className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center shadow-lg"
                                                      >
                                                            <Camera className="w-8 h-8 text-white" />
                                                      </motion.div>

                                                      <div className="text-center">
                                                            <p className="text-sm font-bold text-gray-900">Open Camera</p>
                                                            <p className="text-xs text-gray-600 mt-1">Click to capture your live selfie</p>
                                                      </div>

                                                      <motion.div
                                                            animate={{ opacity: [0.5, 1] }}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                            className="text-xs text-blue-600 font-semibold flex items-center gap-1.5"
                                                      >
                                                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                                                            Ready to capture
                                                      </motion.div>
                                                </div>

                                                {/* Hover Effect */}
                                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-white/0 to-violet-500/0 group-hover:from-blue-500/10 group-hover:via-white/10 group-hover:to-violet-500/10 transition-all" />
                                          </button>
                                    ) : (
                                          /* ── Confirmed State ────────────────────────────────────── */
                                          <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50"
                                          >
                                                <div className="relative">
                                                      <img
                                                            src={captured}
                                                            alt="Verified"
                                                            className="w-full h-auto rounded-2xl"
                                                      />
                                                      <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: 'spring', stiffness: 300 }}
                                                            className="absolute top-3 right-3 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                                                      >
                                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                                      </motion.div>
                                                </div>

                                                <div className="p-4 bg-white/80 backdrop-blur">
                                                      <p className="text-xs font-semibold text-emerald-700">Face verification complete! ✨</p>
                                                      <button
                                                            type="button"
                                                            onClick={retakePhoto}
                                                            className="mt-2 w-full py-2 text-xs font-semibold text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5"
                                                      >
                                                            <RefreshCw className="w-3 h-3" /> Change Photo
                                                      </button>
                                                </div>
                                          </motion.div>
                                    )}
                              </motion.div>
                        )}

                        {/* ── LOADING/REQUESTING STATE ──────────────────────────────────── */}
                        {(status === CAMERA_STATES.LOADING || status === CAMERA_STATES.REQUESTING) && (
                              <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-3"
                              >
                                    <div className="relative overflow-hidden rounded-2xl aspect-video bg-gray-900 flex items-center justify-center border border-gray-700">
                                          <motion.div
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="text-center"
                                          >
                                                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                                                <p className="text-xs text-gray-400">Requesting camera access...</p>
                                          </motion.div>
                                    </div>
                              </motion.div>
                        )}

                        {/* ── READY STATE (Camera active) ───────────────────────────────── */}
                        {status === CAMERA_STATES.READY && (
                              <motion.div
                                    key="ready"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-3"
                              >
                                    {/* Webcam Feed */}
                                    <div className="relative rounded-2xl overflow-hidden border-2 border-blue-300 shadow-lg bg-gray-900">
                                          <Webcam
                                                ref={webcamRef}
                                                audio={false}
                                                screenshotFormat="image/jpeg"
                                                facingMode={facingMode}
                                                videoConstraints={{
                                                      width: { ideal: 1280 },
                                                      height: { ideal: 720 },
                                                      facingMode: facingMode,
                                                }}
                                                onUserMediaError={onCameraError}
                                                onUserMedia={onCameraReady}
                                                className="w-full h-auto"
                                          />

                                          {/* Camera Guide Overlay */}
                                          <div className="absolute inset-0 pointer-events-none">
                                                <svg className="w-full h-full" viewBox="0 0 640 480" preserveAspectRatio="none">
                                                      {/* Face oval guide */}
                                                      <ellipse cx="320" cy="240" rx="120" ry="140"
                                                            fill="none" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2"
                                                            strokeDasharray="5,5" />
                                                      {/* Corners */}
                                                      <rect x="100" y="60" width="20" height="20" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" />
                                                      <rect x="520" y="60" width="20" height="20" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" />
                                                      <rect x="100" y="400" width="20" height="20" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" />
                                                      <rect x="520" y="400" width="20" height="20" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" />
                                                </svg>
                                          </div>

                                          {/* Status Label */}
                                          <div className="absolute top-3 left-3 px-3 py-1.5 bg-blue-500/90 text-white text-xs font-bold rounded-full flex items-center gap-1.5 backdrop-blur">
                                                <motion.div
                                                      animate={{ scale: [1, 1.2, 1] }}
                                                      transition={{ duration: 1, repeat: Infinity }}
                                                      className="w-2 h-2 rounded-full bg-white"
                                                />
                                                Recording
                                          </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex gap-2">
                                          <motion.button
                                                type="button"
                                                onClick={capturePhoto}
                                                disabled={loading}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                                          >
                                                {loading ? (
                                                      <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span>Capturing...</span>
                                                      </>
                                                ) : (
                                                      <>
                                                            <Camera className="w-5 h-5" />
                                                            <span>Capture Selfie</span>
                                                      </>
                                                )}
                                          </motion.button>

                                          <motion.button
                                                type="button"
                                                onClick={toggleCamera}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl flex items-center justify-center shadow-lg transition-all"
                                                title="Switch camera"
                                          >
                                                <Smartphone className="w-4 h-4" />
                                          </motion.button>

                                          <motion.button
                                                type="button"
                                                onClick={closeCamera}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-all"
                                          >
                                                <X className="w-4 h-4" />
                                          </motion.button>
                                    </div>
                              </motion.div>
                        )}

                        {/* ── CAPTURED STATE (Photo preview) ────────────────────────────── */}
                        {status === CAMERA_STATES.CAPTURED && captured && (
                              <motion.div
                                    key="captured"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-3"
                              >
                                    {/* Captured Image Preview */}
                                    <motion.div
                                          initial={{ scale: 0.9 }}
                                          animate={{ scale: 1 }}
                                          className="relative rounded-2xl overflow-hidden border-2 border-emerald-300 bg-gray-50 shadow-lg"
                                    >
                                          <img
                                                src={captured}
                                                alt="Captured selfie"
                                                className="w-full h-auto"
                                          />
                                          {/* Overlay */}
                                          <motion.div
                                                initial={{ y: '100%' }}
                                                animate={{ y: 0 }}
                                                transition={{ duration: 0.4 }}
                                                className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent flex items-end justify-center pb-4"
                                          >
                                                <motion.div
                                                      animate={{ scale: [1, 1.1, 1] }}
                                                      transition={{ duration: 1.5, repeat: Infinity }}
                                                      className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center"
                                                >
                                                      <CheckCircle2 className="w-6 h-6 text-white" />
                                                </motion.div>
                                          </motion.div>
                                    </motion.div>

                                    {/* Preview Info */}
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                          <p className="text-xs font-semibold text-emerald-700 mb-2">✅ Photo Captured</p>
                                          <p className="text-xs text-emerald-600">Please review and confirm your photo to proceed.</p>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-2">
                                          <motion.button
                                                type="button"
                                                onClick={confirmPhoto}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg"
                                          >
                                                <CheckCircle2 className="w-5 h-5" />
                                                <span>Confirm & Continue</span>
                                          </motion.button>

                                          <motion.button
                                                type="button"
                                                onClick={retakePhoto}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="flex-1 py-3 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                                          >
                                                <RefreshCw className="w-5 h-5" />
                                                <span>Retake Photo</span>
                                          </motion.button>
                                    </div>
                              </motion.div>
                        )}

                        {/* ── ERROR STATES ──────────────────────────────────────────────── */}
                        {(status === CAMERA_STATES.ERROR || status === CAMERA_STATES.DENIED) && (
                              <motion.div
                                    key="error"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-4 border-l-4 border-red-500 bg-red-50 rounded-lg"
                              >
                                    <div className="flex gap-3">
                                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                          <div className="flex-1">
                                                <p className="font-semibold text-red-800 text-sm">Camera Access Failed</p>
                                                <p className="text-xs text-red-700 mt-1">{error}</p>
                                                <button
                                                      type="button"
                                                      onClick={openCamera}
                                                      className="mt-3 text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                                                >
                                                      <RefreshCw className="w-3 h-3" />
                                                      Try Again
                                                </button>
                                          </div>
                                    </div>
                              </motion.div>
                        )}
                  </AnimatePresence>

                  {/* ── Mandatory Warning ──────────────────────────────────────────────── */}
                  {required && !confirmed && status === CAMERA_STATES.IDLE && (
                        <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                              className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 items-start"
                        >
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-800">
                                    <span className="font-bold">Note:</span> Live face verification is mandatory to complete your registration.
                              </p>
                        </motion.div>
                  )}
            </motion.div>
      );
}
