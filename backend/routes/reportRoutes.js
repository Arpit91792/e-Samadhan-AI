import express from 'express';
import {
      generateReportText,
      finalizeResolutionAndSendReport,
      getCitizenReports,
      submitReportFeedback,
      getOfficerAnalytics,
      getAdminAnalytics
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Officer analytics
router.get('/officer', authorize('officer'), getOfficerAnalytics);

// Admin global analytics
router.get('/admin', authorize('admin'), getAdminAnalytics);

// Citizen reports list
router.get('/citizen', authorize('citizen'), getCitizenReports);

// AI Report Generation (Preview)
router.post('/generate/:complaintId', authorize('officer', 'admin'), generateReportText);

// Approve & Send Report
router.post('/send/:complaintId', authorize('officer', 'admin'), finalizeResolutionAndSendReport);

// Citizen Rate & Feedback
router.post('/rate/:complaintId', authorize('citizen'), submitReportFeedback);

export default router;
