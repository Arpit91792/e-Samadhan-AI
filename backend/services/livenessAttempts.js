import LivenessAttempt from '../models/LivenessAttempt.js';
import LivenessSession from '../models/LivenessSession.js';
import ApiError from '../utils/ApiError.js';

export const MAX_LIVENESS_ATTEMPTS = 5;
export const COOLDOWN_MS = 5 * 60 * 1000;

const isDevBypass = () =>
      process.env.NODE_ENV === 'development' &&
      (process.env.DISABLE_LIVENESS_RATE_LIMIT === 'true' ||
            process.env.AUTO_RESET_LIVENESS === 'true');

function normalizeEmail(email) {
      return email?.toLowerCase()?.trim() || '';
}

export async function getOrCreateAttemptRecord(email, userId = null) {
      const key = normalizeEmail(email);
      if (!key) return null;

      let record = await LivenessAttempt.findOne({ email: key });
      if (!record) {
            record = await LivenessAttempt.create({
                  email: key,
                  userId: userId || null,
                  attempts: 0,
                  blockedUntil: null,
            });
      }
      return record;
}

/** If cooldown expired, reset attempts and unblock */
export async function refreshAttemptRecord(record) {
      if (!record) return record;

      const now = Date.now();
      if (record.blockedUntil && record.blockedUntil.getTime() <= now) {
            console.log('[liveness] Cooldown expired — resetting attempts for', record.email);
            record.attempts = 0;
            record.blockedUntil = null;
            await record.save();
      }
      return record;
}

export function getRetryAfterSeconds(blockedUntil) {
      if (!blockedUntil) return 0;
      return Math.max(0, Math.ceil((blockedUntil.getTime() - Date.now()) / 1000));
}

export function formatBlockedMessage(retryAfterSeconds) {
      const mins = Math.ceil(retryAfterSeconds / 60);
      return `You have reached the maximum attempts (${MAX_LIVENESS_ATTEMPTS}). Please retry after ${mins} minute${mins === 1 ? '' : 's'}.`;
}

/**
 * Throws ApiError 429 if user is temporarily blocked.
 * Returns refreshed attempt record.
 */
export async function assertCanAttemptLiveness(email, userId = null) {
      if (isDevBypass()) {
            console.log('[liveness] Dev bypass — rate limit disabled');
            return null;
      }

      const record = await refreshAttemptRecord(await getOrCreateAttemptRecord(email, userId));
      if (!record) return null;

      console.log('[liveness] Attempt check:', {
            email: record.email,
            attempts: record.attempts,
            blockedUntil: record.blockedUntil,
      });

      if (record.blockedUntil && record.blockedUntil.getTime() > Date.now()) {
            const retryAfterSeconds = getRetryAfterSeconds(record.blockedUntil);
            throw new ApiError(
                  formatBlockedMessage(retryAfterSeconds),
                  429,
                  'LIVENESS_RATE_LIMITED',
                  { retryAfterSeconds, blockedUntil: record.blockedUntil, attempts: record.attempts }
            );
      }

      if (record.attempts >= MAX_LIVENESS_ATTEMPTS) {
            record.blockedUntil = new Date(Date.now() + COOLDOWN_MS);
            await record.save();
            const retryAfterSeconds = getRetryAfterSeconds(record.blockedUntil);
            console.log('[liveness] Max attempts reached — blocked until', record.blockedUntil);
            throw new ApiError(
                  formatBlockedMessage(retryAfterSeconds),
                  429,
                  'LIVENESS_RATE_LIMITED',
                  { retryAfterSeconds, blockedUntil: record.blockedUntil, attempts: record.attempts }
            );
      }

      return record;
}

/** Record a failed verification attempt */
export async function recordLivenessFailure(email, userId = null) {
      if (isDevBypass()) return null;

      const record = await refreshAttemptRecord(await getOrCreateAttemptRecord(email, userId));
      if (!record) return null;

      record.attempts += 1;
      record.lastAttemptAt = new Date();
      console.log('[liveness] Verification failed — attempts:', record.attempts);

      if (record.attempts >= MAX_LIVENESS_ATTEMPTS) {
            record.blockedUntil = new Date(Date.now() + COOLDOWN_MS);
            console.log('[liveness] User blocked until', record.blockedUntil);
      }

      await record.save();
      return record;
}

/** Clear attempts after successful verification */
export async function resetLivenessAttempts(email) {
      const key = normalizeEmail(email);
      if (!key) return;

      await LivenessAttempt.findOneAndUpdate(
            { email: key },
            { attempts: 0, blockedUntil: null, lastAttemptAt: null },
            { upsert: false }
      );
      console.log('[liveness] Attempts reset after success for', key);
}

/** Dev / admin: full reset for an email */
export async function forceResetLivenessAttempts(email) {
      const key = normalizeEmail(email);
      if (!key) return { deletedSessions: 0 };

      await LivenessAttempt.findOneAndDelete({ email: key });
      const del = await LivenessSession.deleteMany({ email: key });
      console.log('[liveness] Force reset for', key, 'sessions deleted:', del.deletedCount);
      return { deletedSessions: del.deletedCount };
}

export async function getLivenessAttemptStatus(email) {
      if (isDevBypass()) {
            return { attempts: 0, maxAttempts: MAX_LIVENESS_ATTEMPTS, blocked: false, retryAfterSeconds: 0 };
      }

      const record = await refreshAttemptRecord(await getOrCreateAttemptRecord(email));
      if (!record) {
            return { attempts: 0, maxAttempts: MAX_LIVENESS_ATTEMPTS, blocked: false, retryAfterSeconds: 0 };
      }

      const blocked = Boolean(record.blockedUntil && record.blockedUntil.getTime() > Date.now());
      return {
            attempts: record.attempts,
            maxAttempts: MAX_LIVENESS_ATTEMPTS,
            blocked,
            blockedUntil: record.blockedUntil,
            retryAfterSeconds: blocked ? getRetryAfterSeconds(record.blockedUntil) : 0,
            message: blocked ? formatBlockedMessage(getRetryAfterSeconds(record.blockedUntil)) : null,
      };
}

/** Remove expired sessions and stale attempt blocks */
export async function cleanupLivenessData() {
      const now = new Date();

      const expiredSessions = await LivenessSession.deleteMany({
            expiresAt: { $lt: now },
            verificationStatus: { $ne: 'verified' },
      });

      const unblocked = await LivenessAttempt.updateMany(
            { blockedUntil: { $lte: now } },
            { $set: { attempts: 0, blockedUntil: null } }
      );

      const oldAttempts = await LivenessAttempt.deleteMany({
            blockedUntil: null,
            attempts: 0,
            updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });

      if (expiredSessions.deletedCount || unblocked.modifiedCount) {
            console.log('[liveness] Cleanup:', {
                  expiredSessions: expiredSessions.deletedCount,
                  unblocked: unblocked.modifiedCount,
                  oldRecords: oldAttempts.deletedCount,
            });
      }
}

/** Reset all attempt blocks on server start (dev only) */
export async function autoResetOnStartup() {
      if (process.env.AUTO_RESET_LIVENESS !== 'true') return;
      const r = await LivenessAttempt.updateMany({}, { attempts: 0, blockedUntil: null });
      console.log('[liveness] AUTO_RESET_LIVENESS — cleared', r.modifiedCount, 'attempt records');
}
