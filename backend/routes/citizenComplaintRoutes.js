import express from 'express';
import { getCitizenStats } from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/stats', authorize('citizen'), getCitizenStats);

export default router;
