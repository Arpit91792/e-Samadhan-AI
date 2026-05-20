import { isDbConnected, getDbStateLabel } from '../config/db.js';
import mongoose from '../config/mongooseSetup.js';
import ApiError from '../utils/ApiError.js';

/**
 * Block DB operations when MongoDB is not connected (avoids buffering timeouts).
 */
export const requireDb = (req, res, next) => {
      if (isDbConnected()) return next();

      const state = getDbStateLabel();
      console.error(`[requireDb] Rejected ${req.method} ${req.originalUrl} — DB state: ${state} (readyState=${mongoose.connection.readyState})`);

      return next(
            new ApiError(
                  503,
                  'Database connection failed. Please try again after the server has connected to MongoDB.',
                  'DATABASE_UNAVAILABLE'
            )
      );
};

export default requireDb;
