import express from 'express';

import rateLimit from 'express-rate-limit';

import {

      startLiveness,

      verifyLiveness,

      getLivenessStatus,

      getAttemptStatus,

      devResetLiveness,

} from '../controllers/livenessController.js';

import requireDb from '../middleware/requireDb.js';



const router = express.Router();



router.use(requireDb);



/** Global IP limiter — relaxed; per-email limits are enforced in livenessAttempts service */

const skipRateLimit =

      process.env.NODE_ENV === 'development' &&

      (process.env.DISABLE_LIVENESS_RATE_LIMIT === 'true' ||

            process.env.AUTO_RESET_LIVENESS === 'true');



const livenessLimiter = rateLimit({

      windowMs: 15 * 60 * 1000,

      max: skipRateLimit ? 1000 : 120,

      standardHeaders: true,

      legacyHeaders: false,

      skip: () => skipRateLimit,

      message: {

            success: false,

            message: 'Too many requests from this device. Please wait a moment and try again.',

            code: 'LIVENESS_IP_LIMIT',

      },

});



router.use(livenessLimiter);



router.get('/attempt-status', getAttemptStatus);

router.post('/dev-reset', devResetLiveness);

router.post('/start-liveness', startLiveness);

router.post('/verify-liveness', verifyLiveness);

router.get('/status/:sessionId', getLivenessStatus);



export default router;


