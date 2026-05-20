import crypto from 'crypto';
import LivenessSession from '../models/LivenessSession.js';
import { isDbConnected } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import {
      assertCanAttemptLiveness,
      recordLivenessFailure,
      resetLivenessAttempts,
      forceResetLivenessAttempts,
      getLivenessAttemptStatus,
      MAX_LIVENESS_ATTEMPTS,
} from '../services/livenessAttempts.js';

const TASK_POOL = ['blink', 'turn_left', 'turn_right'];

function pickTasks(count = 3) {
      const shuffled = [...TASK_POOL].sort(() => Math.random() - 0.5);
      const tasks = shuffled.slice(0, count);
      if (!tasks.includes('blink')) tasks[tasks.length - 1] = 'blink';
      return [...new Set(tasks)];
}

function assertDatabaseReady() {
      if (!isDbConnected()) {
            throw new ApiError(
                  'Database connection failed. Cannot save liveness session.',
                  503,
                  'DATABASE_UNAVAILABLE'
            );
      }
}

// POST /api/liveness/start-liveness
export const startLiveness = async (req, res, next) => {
      try {
            assertDatabaseReady();

            const { email, govtIdType, userId } = req.body;

            if (!email && !userId) {
                  return res.status(400).json({
                        success: false,
                        message: 'Email is required to start liveness verification.',
                        code: 'EMAIL_REQUIRED',
                  });
            }

            await assertCanAttemptLiveness(email, userId);
            const status = await getLivenessAttemptStatus(email);

            const tasks = pickTasks(3);
            console.log('[liveness] Verification started', { email: email?.toLowerCase(), attempts: status.attempts });

            const session = await LivenessSession.create({
                  email: email?.toLowerCase(),
                  userId: userId || null,
                  govtIdType: govtIdType || '',
                  tasks,
                  verificationStatus: 'pending',
                  attempts: status.attempts,
                  blockedUntil: status.blockedUntil || null,
                  expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            });

            console.log('[liveness] Session created:', session.sessionId);

            res.status(201).json({
                  success: true,
                  sessionId: session.sessionId,
                  tasks,
                  expiresAt: session.expiresAt,
                  attempts: status.attempts,
                  maxAttempts: MAX_LIVENESS_ATTEMPTS,
                  message: 'Liveness verification started. Complete all live actions on camera.',
            });
      } catch (err) {
            if (err.name === 'MongooseError' && /buffering timed out/i.test(err.message)) {
                  return next(
                        new ApiError(
                              'Database connection failed. Please ensure MongoDB is running and restart the server.',
                              503,
                              'DATABASE_UNAVAILABLE'
                        )
                  );
            }
            console.error('[liveness] start-liveness error:', err.message);
            next(err);
      }
};

// POST /api/liveness/verify-liveness
export const verifyLiveness = async (req, res, next) => {
      try {
            assertDatabaseReady();

            const {
                  sessionId,
                  completedActions,
                  confidenceScore,
                  fraudFlags = [],
                  email,
            } = req.body;

            if (!sessionId) {
                  return res.status(400).json({
                        success: false,
                        message: 'Session ID is required.',
                        code: 'SESSION_REQUIRED',
                  });
            }

            const sessionEmail = email?.toLowerCase();
            await assertCanAttemptLiveness(sessionEmail || email, null);

            console.log('[liveness] Verifying session:', sessionId);

            const session = await LivenessSession.findOne({ sessionId });

            if (!session) {
                  return res.status(404).json({
                        success: false,
                        message: 'Liveness session not found or expired.',
                        code: 'SESSION_NOT_FOUND',
                  });
            }

            const failAndCount = async (payload) => {
                  await recordLivenessFailure(session.email || sessionEmail);
                  const status = await getLivenessAttemptStatus(session.email || sessionEmail);
                  return res.status(payload.status).json({
                        ...payload.body,
                        attempts: status.attempts,
                        maxAttempts: MAX_LIVENESS_ATTEMPTS,
                        retryAfterSeconds: status.retryAfterSeconds,
                        blocked: status.blocked,
                  });
            };

            if (session.expiresAt < new Date()) {
                  session.verificationStatus = 'expired';
                  await session.save();
                  return failAndCount({
                        status: 400,
                        body: {
                              success: false,
                              message: 'Liveness session expired. Please start again.',
                              code: 'SESSION_EXPIRED',
                        },
                  });
            }

            if (sessionEmail && session.email && session.email !== sessionEmail) {
                  return res.status(403).json({
                        success: false,
                        message: 'Session does not match this email.',
                        code: 'SESSION_MISMATCH',
                  });
            }

            const completed = Array.isArray(completedActions) ? completedActions : [];
            const missing = session.tasks.filter((t) => !completed.includes(t));

            if (missing.length > 0) {
                  session.verificationStatus = 'failed';
                  session.fraudFlags = [...fraudFlags, 'INCOMPLETE_TASKS'];
                  await session.save();
                  console.log('[liveness] Verification failed — incomplete tasks');
                  return failAndCount({
                        status: 400,
                        body: {
                              success: false,
                              message: `Incomplete liveness actions: ${missing.join(', ')}`,
                              code: 'INCOMPLETE_LIVENESS',
                              missingTasks: missing,
                        },
                  });
            }

            if (fraudFlags.length > 0) {
                  session.verificationStatus = 'failed';
                  session.fraudFlags = fraudFlags;
                  await session.save();
                  console.log('[liveness] Verification failed — spoof flags');
                  return failAndCount({
                        status: 400,
                        body: {
                              success: false,
                              message: 'Liveness verification failed. Possible spoof attempt detected.',
                              code: 'SPOOF_DETECTED',
                              fraudFlags,
                        },
                  });
            }

            const score = Math.min(100, Math.max(0, Number(confidenceScore) || 85));

            session.completedActions = completed;
            session.livenessVerified = true;
            session.verificationStatus = 'verified';
            session.confidenceScore = score;
            session.liveCaptureHash = crypto
                  .createHash('sha256')
                  .update(`${sessionId}-${Date.now()}`)
                  .digest('hex');
            await session.save();

            await resetLivenessAttempts(session.email);
            console.log('[liveness] Verification successful:', sessionId);

            res.status(200).json({
                  success: true,
                  livenessVerified: true,
                  verificationStatus: 'verified',
                  confidenceScore: score,
                  sessionId: session.sessionId,
                  message: 'Liveness verification successful. You are physically present.',
            });
      } catch (err) {
            console.error('[liveness] verify-liveness error:', err.message);
            next(err);
      }
};

export const getLivenessStatus = async (req, res, next) => {
      try {
            assertDatabaseReady();

            const { sessionId } = req.params;
            const session = await LivenessSession.findOne({ sessionId }).select('-liveCaptureHash');
            if (!session) {
                  return res.status(404).json({ success: false, message: 'Session not found' });
            }
            res.json({ success: true, session });
      } catch (err) {
            next(err);
      }
};

// GET /api/liveness/attempt-status?email=
export const getAttemptStatus = async (req, res, next) => {
      try {
            assertDatabaseReady();
            const { email } = req.query;
            if (!email) {
                  return res.status(400).json({ success: false, message: 'email query param required' });
            }
            const status = await getLivenessAttemptStatus(email);
            res.json({ success: true, ...status });
      } catch (err) {
            next(err);
      }
};

// POST /api/liveness/dev-reset — development only
export const devResetLiveness = async (req, res, next) => {
      try {
            if (process.env.NODE_ENV === 'production') {
                  return res.status(404).json({ success: false, message: 'Not found' });
            }

            assertDatabaseReady();
            const { email } = req.body;
            if (!email) {
                  return res.status(400).json({ success: false, message: 'email is required' });
            }

            const result = await forceResetLivenessAttempts(email);
            res.json({
                  success: true,
                  message: 'Liveness session and attempts reset.',
                  ...result,
            });
      } catch (err) {
            next(err);
      }
};
