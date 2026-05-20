import express from 'express';
import {
      getOfficerDashboard, getAssignedComplaints,
      acceptComplaint, updateComplaintStatus, addNote, getPerformance,
} from '../controllers/officerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All officer routes require auth + officer role
router.use(protect, authorize('officer', 'admin'));

router.get('/dashboard', getOfficerDashboard);
router.get('/complaints', getAssignedComplaints);
router.put('/complaints/:id/accept', acceptComplaint);
router.put('/complaints/:id/status', updateComplaintStatus);
router.post('/complaints/:id/note', addNote);
router.get('/performance', getPerformance);

export default router;
