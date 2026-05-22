import express from 'express';
import {
  registerAdmin,
  loginAdmin,
  createOfficer,
  getOfficers,
  banOfficer,
  getAdminProfile,
  getAdminAnalytics,
  getAdminComplaints,
  assignOfficerToComplaint,
  updateComplaintStatus,
  getEmergencyComplaints,
  getOfficerDetail,
  toggleBlockOfficer,
  updateOfficerStatus,
  getOfficerAnalytics,
} from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public — Admin auth
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// Protected — all routes below require admin auth
router.use(protectAdmin);

router.get('/session-check', (req, res) => {
  res.status(200).json({ success: true, admin: req.admin });
});

// Profile & analytics
router.get('/profile', getAdminProfile);
router.get('/analytics', getAdminAnalytics);
router.get('/officer-analytics', getOfficerAnalytics);

// Complaints
router.get('/complaints', getAdminComplaints);
router.get('/emergencies', getEmergencyComplaints);
router.put('/assign-officer', assignOfficerToComplaint);
router.put('/update-status', updateComplaintStatus);

// Officers
router.post('/create-officer', createOfficer);
router.get('/officers', getOfficers);
router.get('/officers/:id', getOfficerDetail);
router.put('/ban-officer/:id', banOfficer);
router.put('/officers/:id/toggle-block', toggleBlockOfficer);
router.put('/officers/:id/status', updateOfficerStatus);

export default router;
