import express from 'express';
import jwt from 'jsonwebtoken';
import Officer from '../models/Officer.js';
import { protectAdmin } from '../middleware/authMiddleware.js';
import {
  registerOfficer,
  loginOfficer,
  getOfficerDashboard,
  getAssignedComplaints,
  getDepartmentQueue,
  selfAssignComplaint,
  updateComplaintStatus,
  acceptComplaint,
  addOfficerNote,
  getOfficerPerformance,
  getOfficerProfile,
  blockOfficer,
  unblockOfficer,
} from '../controllers/officerController.js';

const router = express.Router();

// ── Officer auth middleware ────────────────────────────────────────────────────
const protectOfficer = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token', code: 'NO_TOKEN' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'officer') {
      return res.status(403).json({ success: false, message: 'Not authorized as officer', code: 'WRONG_ROLE' });
    }

    // Re-check DB on every request — catches blocks that happened after token was issued
    const officerDoc = await Officer.findById(decoded.id).select('isBlocked isActive banned employeeId department');
    if (!officerDoc) {
      return res.status(401).json({ success: false, message: 'Officer account not found', code: 'NOT_FOUND' });
    }
    if (officerDoc.isBlocked || officerDoc.banned) {
      return res.status(403).json({
        success: false,
        message: 'Your officer account has been blocked by the department admin.',
        code: 'ACCOUNT_BLOCKED',
      });
    }
    if (!officerDoc.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is inactive', code: 'ACCOUNT_INACTIVE' });
    }

    req.officer = decoded; // { id, department, role, employeeId }
    next();
  } catch (error) {
    const msg = error.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Not authorized, token failed';
    return res.status(401).json({ success: false, message: msg, code: 'INVALID_TOKEN' });
  }
};

// ── Public routes ─────────────────────────────────────────────────────────────

/**
 * @route  GET /api/officer/check-employee-id
 * @desc   Pre-flight check — returns officer name + department for a given employeeId
 *         so the registration form can show a confirmation before the user sets a password.
 * @access Public
 */
router.get('/check-employee-id', async (req, res) => {
  try {
    const { employeeId, email, department } = req.query;
    if (!employeeId?.trim()) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    const officer = await Officer.findOne({ employeeId: employeeId.trim().toUpperCase() })
      .select('name email department employeeId password isBlocked banned');

    if (!officer) {
      return res.status(404).json({ success: false, message: 'Employee ID not found', code: 'NOT_FOUND' });
    }

    // If email provided, validate it
    if (email && officer.email.toLowerCase() !== email.toLowerCase().trim()) {
      return res.status(403).json({ success: false, message: 'Email does not match this Employee ID', code: 'EMAIL_MISMATCH' });
    }

    // If department provided, validate it
    if (department && officer.department !== department) {
      return res.status(403).json({ success: false, message: 'Department does not match this Employee ID', code: 'DEPARTMENT_MISMATCH' });
    }

    if (officer.isBlocked || officer.banned) {
      return res.status(403).json({ success: false, message: 'This account has been blocked', code: 'ACCOUNT_BLOCKED' });
    }

    if (officer.password) {
      return res.status(400).json({ success: false, message: 'This officer is already registered. Please login.', code: 'ALREADY_REGISTERED' });
    }

    res.status(200).json({
      success: true,
      data: {
        name: officer.name,
        department: officer.department,
        employeeId: officer.employeeId,
        // Never expose email in full — just confirm it matches
        emailHint: officer.email.replace(/(.{2}).+(@.+)/, '$1***$2'),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/register', registerOfficer);
router.post('/login', loginOfficer);

// ── Protected routes (Officer only) ──────────────────────────────────────────
router.use(protectOfficer);

router.get('/profile', getOfficerProfile);
router.get('/dashboard', getOfficerDashboard);
router.get('/performance', getOfficerPerformance);
router.get('/queue', getDepartmentQueue);
router.get('/complaints', getAssignedComplaints);
router.put('/complaints/:id/self-assign', selfAssignComplaint);
router.put('/complaints/:id/status', updateComplaintStatus);
router.put('/complaints/:id/accept', acceptComplaint);
router.post('/complaints/:id/note', addOfficerNote);

// ── Admin routes (block/unblock officers) ────────────────────────────────────
// These are protected by admin auth middleware
router.patch('/block/:id', protectAdmin, blockOfficer);
router.patch('/unblock/:id', protectAdmin, unblockOfficer);

export default router;
