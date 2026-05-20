import express from 'express';
import {
      fileComplaint, getComplaints, getComplaint,
      updateStatus, assignComplaint, upvoteComplaint,
      submitFeedback, getAnalytics, analyzeComplaintText,
} from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/auth.js';
import { complaintUpload } from '../services/uploadService.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Analytics (officer + admin only) — must be before /:id
router.get('/analytics', authorize('officer', 'admin'), getAnalytics);
router.post('/analyze', analyzeComplaintText);

// CRUD
router.post('/', authorize('citizen'), complaintUpload.array('attachments', 5), fileComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaint);

// Status & assignment
router.put('/:id/status', authorize('officer', 'admin'), updateStatus);
router.put('/:id/assign', authorize('admin'), assignComplaint);

// Citizen actions
router.post('/:id/upvote', authorize('citizen'), upvoteComplaint);
router.post('/:id/feedback', authorize('citizen'), submitFeedback);

export default router;
