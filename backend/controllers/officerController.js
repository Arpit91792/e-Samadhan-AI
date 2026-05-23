import Officer from '../models/Officer.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import AuditLog from '../models/AuditLog.js';
import Session from '../models/Session.js';
import OTP from '../models/OTP.js';
import Department from '../models/Department.js';
import crypto from 'crypto';
import { resolveDepartmentSlug } from '../utils/departmentResolve.js';
import {
  emitComplaintAcceptedToDept,
  emitComplaintUpdate,
} from '../socket/index.js';

// ── Helper: silently update officer lastActive ────────────────────────────────
async function touchLastActive(officerId) {
  try {
    await Officer.findByIdAndUpdate(officerId, { lastActive: new Date() });
  } catch {
    // non-fatal
  }
}

// ── Register officer (set password for first time) ────────────────────────────
// Validates: employeeId + email + department must ALL match the record created by admin.
export const registerOfficer = async (req, res, next) => {
  try {
    const { employeeId, email, password, confirmPassword, department } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!employeeId?.trim())
      return res.status(400).json({ success: false, message: 'Employee ID is required', code: 'MISSING_EMPLOYEE_ID' });
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ success: false, message: 'Valid email is required', code: 'INVALID_EMAIL' });
    if (!department?.trim())
      return res.status(400).json({ success: false, message: 'Department is required', code: 'MISSING_DEPARTMENT' });
    if (!password || password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' });
    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: 'Passwords do not match', code: 'PASSWORD_MISMATCH' });

    const deptSlug = resolveDepartmentSlug(department);
    if (!deptSlug)
      return res.status(400).json({ success: false, message: 'Invalid department selected', code: 'INVALID_DEPARTMENT' });

    const normalEmail = email.toLowerCase().trim();
    const normalEmpId = employeeId.trim().toUpperCase();

    // ── Step 1: Find by employeeId only first (to give precise error messages) ─
    const byEmpId = await Officer.findOne({ employeeId: normalEmpId });
    if (!byEmpId) {
      return res.status(404).json({
        success: false,
        message: 'Employee ID not found. Contact your department admin.',
        code: 'EMPLOYEE_ID_NOT_FOUND',
      });
    }

    // ── Step 2: Department must match ─────────────────────────────────────────
    if (byEmpId.department !== deptSlug) {
      return res.status(403).json({
        success: false,
        message: 'This Employee ID does not belong to the selected department.',
        code: 'DEPARTMENT_MISMATCH',
      });
    }

    // ── Step 3: Email must match ──────────────────────────────────────────────
    if (byEmpId.email.toLowerCase() !== normalEmail) {
      return res.status(403).json({
        success: false,
        message: 'Email does not match the record for this Employee ID.',
        code: 'EMAIL_MISMATCH',
      });
    }

    // ── Step 4: Already registered? ───────────────────────────────────────────
    if (byEmpId.password) {
      return res.status(400).json({
        success: false,
        message: 'This officer account is already registered. Please login instead.',
        code: 'ALREADY_REGISTERED',
      });
    }

    // ── Step 5: Blocked? ──────────────────────────────────────────────────────
    if (byEmpId.isBlocked || byEmpId.banned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by the department admin.',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    // ── Step 6: OTP verified for this email? ──────────────────────────────────
    const otpRecord = await OTP.findOne({
      email: normalEmail,
      purpose: 'register',
      verified: true,
    });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email with OTP before registering.',
        code: 'OTP_NOT_VERIFIED',
      });
    }

    // All checks passed — set password and activate
    byEmpId.password = password;   // hashed by pre-save hook
    byEmpId.status = 'active';
    byEmpId.isActive = true;
    byEmpId.lastActive = new Date();
    byEmpId.lastLogin = new Date();
    byEmpId.loginCount = (byEmpId.loginCount || 0) + 1;
    byEmpId.loginHistory.push({
      loginTime: new Date(),
      ipAddress: req.ip || '',
      device: req.headers['user-agent'] || '',
      browser: req.headers['user-agent'] || '',
    });
    await byEmpId.save();

    // ── Create corresponding User record ──────────────────────────────────────
    try {
      const existingUser = await User.findOne({ email: normalEmail });
      if (!existingUser) {
        await User.create({
          name: byEmpId.name,
          email: normalEmail,
          password: password,
          role: 'officer',
          phone: byEmpId.mobile,
          department: byEmpId.department,
          employeeId: byEmpId.employeeId,
          governmentId: byEmpId.employeeId,
          officerStatus: 'approved',
          isEmailVerified: true,
          otpVerified: true,
          isActive: true,
          lastLogin: new Date(),
        });
        console.log('[registerOfficer] ✓ User record created:', normalEmail);
      } else {
        console.log('[registerOfficer] ℹ User record already exists:', normalEmail);
      }
    } catch (userErr) {
      console.error('[registerOfficer] ⚠️ User creation failed:', userErr.message);
      // Don't fail registration if user creation fails
    }

    // Clean up used OTP
    await OTP.deleteMany({ email: normalEmail, purpose: 'register' });

    const token = byEmpId.getSignedJwtToken();

    // ── Audit log for registration ────────────────────────────────────────────
    try {
      await AuditLog.create({
        action: 'officer_register',
        performedBy: byEmpId._id,
        performedByModel: 'Officer',
        role: 'officer',
        employeeId: byEmpId.employeeId,
        department: byEmpId.department,
        details: { registeredAt: new Date(), ipAddress: req.ip },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (auditErr) {
      console.error('[registerOfficer] ⚠️ Audit log failed:', auditErr.message);
    }

    // ── Store session ─────────────────────────────────────────────────────────
    try {
      await Session.create({
        userId: byEmpId._id,
        roleModel: 'Officer',
        role: 'officer',
        employeeId: byEmpId.employeeId,
        department: byEmpId.department,
        token,
        loginAt: new Date(),
        ipAddress: req.ip || '',
        device: req.headers['user-agent'] || '',
      });
    } catch (sessionErr) {
      console.error('[registerOfficer] ⚠️ Session store failed:', sessionErr.message);
    }

    console.log('[registerOfficer] Registration complete:', byEmpId.employeeId, byEmpId.department);

    res.status(200).json({
      success: true,
      message: `Registration successful! Welcome to e-Samadhan AI, ${byEmpId.name}.`,
      token,
      officer: buildOfficerResponse(byEmpId),
      user: buildOfficerResponse(byEmpId),
    });
  } catch (err) { next(err); }
};

// ── Login officer ─────────────────────────────────────────────────────────────
export const loginOfficer = async (req, res, next) => {
  try {
    const { employeeId, email, password, department } = req.body;

    if (!employeeId?.trim())
      return res.status(400).json({ success: false, message: 'Employee ID is required', code: 'MISSING_EMPLOYEE_ID' });
    if (!email?.trim())
      return res.status(400).json({ success: false, message: 'Email is required', code: 'MISSING_EMAIL' });
    if (!password)
      return res.status(400).json({ success: false, message: 'Password is required', code: 'MISSING_PASSWORD' });
    if (!department?.trim())
      return res.status(400).json({ success: false, message: 'Department is required', code: 'MISSING_DEPARTMENT' });

    const deptSlug = resolveDepartmentSlug(department);
    if (!deptSlug)
      return res.status(400).json({ success: false, message: 'Invalid department selected', code: 'INVALID_DEPARTMENT' });

    const normalEmail = email.toLowerCase().trim();
    const normalEmpId = employeeId.trim().toUpperCase();

    // Find by employeeId (include password for comparison)
    const officer = await Officer.findOne({ employeeId: normalEmpId }).select('+password');

    // Use generic message for security — don't reveal which field is wrong
    const INVALID_CREDS = { success: false, message: 'Invalid credentials. Check your Employee ID, email, department and password.', code: 'INVALID_CREDENTIALS' };

    if (!officer) return res.status(401).json(INVALID_CREDS);

    // Department check
    if (officer.department !== deptSlug)
      return res.status(401).json({ success: false, message: 'Invalid department selected for this Employee ID.', code: 'DEPARTMENT_MISMATCH' });

    // Email check
    if (officer.email.toLowerCase() !== normalEmail)
      return res.status(401).json(INVALID_CREDS);

    // Must have registered (set password)
    if (!officer.password)
      return res.status(401).json({
        success: false,
        message: 'Account not yet registered. Please complete registration first.',
        code: 'NOT_REGISTERED',
      });

    // Block checks
    if (officer.isBlocked)
      return res.status(403).json({
        success: false,
        message: 'Your officer account has been blocked by the department admin.',
        code: 'ACCOUNT_BLOCKED',
      });
    if (officer.banned)
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact your department admin.',
        code: 'ACCOUNT_SUSPENDED',
      });
    if (!officer.isActive)
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Contact your department admin.',
        code: 'ACCOUNT_INACTIVE',
      });

    // Password check
    const isMatch = await officer.matchPassword(password);
    if (!isMatch) return res.status(401).json(INVALID_CREDS);

    // ── Generate JWT ──────────────────────────────────────────────────────────
    const token = officer.getSignedJwtToken();

    // ── Collect request metadata ──────────────────────────────────────────────
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // ── Update officer activity fields ────────────────────────────────────────
    const loginTime = new Date();
    officer.lastLogin = loginTime;
    officer.lastActive = loginTime;
    officer.loginCount = (officer.loginCount || 0) + 1;
    officer.status = 'active';

    // Append to login history (keep last 50 entries)
    officer.loginHistory.push({
      loginTime,
      ipAddress,
      device: userAgent,
      browser: userAgent,
    });
    if (officer.loginHistory.length > 50) {
      officer.loginHistory = officer.loginHistory.slice(-50);
    }

    // Store active JWT session
    officer.activeSession = {
      token,
      loginAt: loginTime,
    };

    await officer.save({ validateBeforeSave: false });
    console.log('[loginOfficer] ✅ Officer login successful:', officer.employeeId, officer.department);

    // ── Create audit log entry ────────────────────────────────────────────────
    try {
      await AuditLog.create({
        action: 'officer_login',
        performedBy: officer._id,
        performedByModel: 'Officer',
        role: 'officer',
        employeeId: officer.employeeId,
        department: officer.department,
        details: {
          loginTime,
          ipAddress,
          userAgent,
          loginCount: officer.loginCount,
        },
        ipAddress,
        userAgent,
      });
      console.log('[loginOfficer] ✅ Audit log created for:', officer.employeeId);
    } catch (auditErr) {
      // Non-fatal — log but don't block login
      console.error('[loginOfficer] ⚠️ Audit log failed:', auditErr.message);
    }

    // ── Store session in sessions collection ──────────────────────────────────
    try {
      await Session.create({
        userId: officer._id,
        roleModel: 'Officer',
        role: 'officer',
        employeeId: officer.employeeId,
        department: officer.department,
        token,
        loginAt: loginTime,
        ipAddress,
        device: userAgent,
      });
      console.log('[loginOfficer] ✅ Session stored for:', officer.employeeId);
    } catch (sessionErr) {
      // Non-fatal — log but don't block login
      console.error('[loginOfficer] ⚠️ Session store failed:', sessionErr.message);
    }

    console.log('[loginOfficer] ✅ Last active updated:', officer.lastActive);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${officer.name}!`,
      token,
      officer: buildOfficerResponse(officer),
      // Also expose as `user` so the frontend AuthContext works with both keys
      user: buildOfficerResponse(officer),
    });
  } catch (err) { next(err); }
};

// ── Officer dashboard stats ───────────────────────────────────────────────────
export const getOfficerDashboard = async (req, res, next) => {
  try {
    const officerId = req.officer.id;
    const officer = await Officer.findById(officerId);
    if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });

    await officer.recalcStats();

    const recentComplaints = await Complaint.find({ assignedOfficer: officerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status priority createdAt complaintId');

    res.status(200).json({
      success: true,
      stats: {
        assigned: officer.complaintsAssigned,
        resolved: officer.complaintsSolved,
        pending: officer.complaintsPending,
        inProgress: officer.complaintsInProgress,
        resolutionRate: officer.resolutionRate,
      },
      officer: buildOfficerResponse(officer),
      recentComplaints,
    });
  } catch (err) { next(err); }
};

// ── Get assigned complaints ───────────────────────────────────────────────────
export const getAssignedComplaints = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { assignedOfficer: req.officer.id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate('citizen', 'name phone email address')
      .sort({ isEmergency: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Update lastActive
    await touchLastActive(req.officer.id);

    res.status(200).json({ success: true, total, data: complaints });
  } catch (err) { next(err); }
};

// ── Update complaint status ───────────────────────────────────────────────────
export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, note = '' } = req.body;
    const allowed = ['in_progress', 'resolved', 'pending'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (complaint.assignedOfficer?.toString() !== req.officer.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this complaint' });
    }

    complaint.status = status;
    if (status === 'resolved') complaint.resolvedAt = new Date();
    complaint.timeline.push({
      status,
      note: note || `Status updated to ${status} by officer`,
      updatedBy: req.officer.id,
      updatedAt: new Date(),
    });
    await complaint.save();

    // Recalc officer stats + update lastActive
    const officer = await Officer.findById(req.officer.id);
    if (officer) {
      await officer.recalcStats();
      officer.lastActive = new Date();
      await officer.save({ validateBeforeSave: false });
    }

    // Audit log for complaint status update
    try {
      await AuditLog.create({
        action: 'officer_complaint_update',
        performedBy: req.officer.id,
        performedByModel: 'Officer',
        role: 'officer',
        employeeId: req.officer.employeeId,
        department: req.officer.department,
        targetModel: 'Complaint',
        targetId: complaint._id,
        details: { status, note, complaintId: complaint.complaintId },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (auditErr) {
      console.error('[updateComplaintStatus] ⚠️ Audit log failed:', auditErr.message);
    }

    console.log('[updateComplaintStatus] ✅ Last active updated for officer:', req.officer.employeeId);
    res.status(200).json({ success: true, message: 'Status updated', data: complaint });
  } catch (err) { next(err); }
};

// ── Accept complaint ──────────────────────────────────────────────────────────
export const acceptComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (complaint.assignedOfficer?.toString() !== req.officer.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this complaint' });
    }
    if (complaint.status !== 'pending' && complaint.status !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Complaint cannot be accepted in current state' });
    }

    complaint.status = 'in_progress';
    complaint.timeline.push({
      status: 'in_progress',
      note: 'Complaint accepted and being worked on by officer',
      updatedBy: req.officer.id,
      updatedAt: new Date(),
    });
    await complaint.save();

    const officer = await Officer.findById(req.officer.id);
    if (officer) {
      await officer.recalcStats();
      officer.lastActive = new Date();
      officer.status = 'busy';
      await officer.save({ validateBeforeSave: false });
    }

    // Audit log for complaint accept
    try {
      await AuditLog.create({
        action: 'officer_complaint_accept',
        performedBy: req.officer.id,
        performedByModel: 'Officer',
        role: 'officer',
        employeeId: req.officer.employeeId,
        department: req.officer.department,
        targetModel: 'Complaint',
        targetId: complaint._id,
        details: { complaintId: complaint.complaintId },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (auditErr) {
      console.error('[acceptComplaint] ⚠️ Audit log failed:', auditErr.message);
    }

    console.log('[acceptComplaint] ✅ Last active updated for officer:', req.officer.employeeId);
    res.status(200).json({ success: true, message: 'Complaint accepted', data: complaint });
  } catch (err) { next(err); }
};

// ── Add note to complaint ─────────────────────────────────────────────────────
export const addOfficerNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ success: false, message: 'Note is required' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (complaint.assignedOfficer?.toString() !== req.officer.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this complaint' });
    }

    complaint.timeline.push({
      status: complaint.status,
      note: note.trim(),
      updatedBy: req.officer.id,
      updatedAt: new Date(),
    });
    await complaint.save();

    await Officer.findByIdAndUpdate(req.officer.id, { lastActive: new Date() });

    // Audit log for note
    try {
      await AuditLog.create({
        action: 'officer_note_added',
        performedBy: req.officer.id,
        performedByModel: 'Officer',
        role: 'officer',
        employeeId: req.officer.employeeId,
        department: req.officer.department,
        targetModel: 'Complaint',
        targetId: complaint._id,
        details: { note: note.trim(), complaintId: complaint.complaintId },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (auditErr) {
      console.error('[addOfficerNote] ⚠️ Audit log failed:', auditErr.message);
    }

    console.log('[addOfficerNote] ✅ Last active updated for officer:', req.officer.employeeId);
    res.status(200).json({ success: true, message: 'Note added', data: complaint });
  } catch (err) { next(err); }
};

// ── Officer performance analytics ─────────────────────────────────────────────
export const getOfficerPerformance = async (req, res, next) => {
  try {
    const officerId = req.officer.id;
    const officer = await Officer.findById(officerId);
    if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });

    await officer.recalcStats();

    // Calculate average resolution time (hours)
    const resolvedComplaints = await Complaint.find({
      assignedOfficer: officerId,
      status: 'resolved',
      resolvedAt: { $exists: true },
    }).select('createdAt resolvedAt');

    let avgResolutionHrs = 0;
    if (resolvedComplaints.length > 0) {
      const totalMs = resolvedComplaints.reduce((sum, c) => {
        return sum + (new Date(c.resolvedAt) - new Date(c.createdAt));
      }, 0);
      avgResolutionHrs = Math.round(totalMs / resolvedComplaints.length / 3600000);
    }

    // Monthly stats for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Complaint.aggregate([
      {
        $match: {
          assignedOfficer: officer._id,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = monthlyData.map((m) => ({
      month: monthNames[m._id.month - 1],
      assigned: m.total,
      resolved: m.resolved,
    }));

    res.status(200).json({
      success: true,
      performance: {
        assigned: officer.complaintsAssigned,
        resolved: officer.complaintsSolved,
        pending: officer.complaintsPending,
        inProgress: officer.complaintsInProgress,
        resolutionRate: officer.resolutionRate,
        avgResolutionHrs,
        lastActive: officer.lastActive,
        lastLogin: officer.lastLogin,
        loginCount: officer.loginCount,
        chartData,
      },
    });
  } catch (err) { next(err); }
};

// ── Get officer profile (self) ────────────────────────────────────────────────
export const getOfficerProfile = async (req, res, next) => {
  try {
    const officer = await Officer.findById(req.officer.id).select('-password');
    if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });
    await officer.recalcStats();
    res.status(200).json({ success: true, data: buildOfficerResponse(officer) });
  } catch (err) { next(err); }
};

// ── Admin: Block Officer ──────────────────────────────────────────────────────
// @route PATCH /api/officers/block/:id
// @desc  Block an officer from accessing the system
export const blockOfficer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.admin?.id || req.user?._id;

    const officer = await Officer.findById(id);
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found', code: 'OFFICER_NOT_FOUND' });
    }

    // Department-based security: verify admin can block this officer
    if (req.admin?.department && officer.department !== req.admin.department) {
      return res.status(403).json({ success: false, message: 'Cannot block officer from another department', code: 'DEPARTMENT_MISMATCH' });
    }

    // Block the officer
    officer.isBlocked = true;
    officer.blockedAt = new Date();
    officer.blockedBy = adminId;
    officer.blockReason = reason || 'Blocked by department admin';
    officer.status = 'suspended';
    officer.isActive = false;
    await officer.save();

    // ── Also update User collection (sync) ─────────────────────────────────────
    try {
      await User.updateOne(
        { email: officer.email, role: 'officer' },
        {
          isActive: false,
          officerStatus: 'approved',
          lastLogin: new Date()
        }
      );
    } catch (userErr) {
      console.error('[blockOfficer] ⚠️ User sync failed:', userErr.message);
    }

    // ── Invalidate active sessions ────────────────────────────────────────────
    try {
      await Session.deleteMany({
        userId: officer._id,
        role: 'officer'
      });
      console.log('[blockOfficer] ✓ Sessions cleared for:', officer.employeeId);
    } catch (sessionErr) {
      console.error('[blockOfficer] ⚠️ Session clear failed:', sessionErr.message);
    }

    // ── Create audit log ──────────────────────────────────────────────────────
    try {
      await AuditLog.create({
        action: 'officer_blocked',
        performedBy: adminId,
        performedByModel: 'User',
        role: 'admin',
        targetId: officer._id,
        targetModel: 'Officer',
        employeeId: officer.employeeId,
        department: officer.department,
        details: {
          blockedOfficer: officer.name,
          reason: officer.blockReason,
          blockedAt: officer.blockedAt
        },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
      console.log('[blockOfficer] ✓ Audit log created');
    } catch (auditErr) {
      console.error('[blockOfficer] ⚠️ Audit log failed:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Officer ${officer.name} has been blocked successfully`,
      data: {
        officerId: officer._id,
        employeeId: officer.employeeId,
        name: officer.name,
        isBlocked: officer.isBlocked,
        blockedAt: officer.blockedAt,
        blockReason: officer.blockReason,
      }
    });
  } catch (err) { next(err); }
};

// ── Admin: Unblock Officer ────────────────────────────────────────────────────
// @route PATCH /api/officers/unblock/:id
// @desc  Unblock an officer to restore system access
export const unblockOfficer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id || req.user?._id;

    const officer = await Officer.findById(id);
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found', code: 'OFFICER_NOT_FOUND' });
    }

    // Department-based security: verify admin can unblock this officer
    if (req.admin?.department && officer.department !== req.admin.department) {
      return res.status(403).json({ success: false, message: 'Cannot unblock officer from another department', code: 'DEPARTMENT_MISMATCH' });
    }

    // Unblock the officer
    officer.isBlocked = false;
    officer.blockedAt = null;
    officer.blockedBy = null;
    officer.blockReason = '';
    officer.status = 'offline';
    officer.isActive = true;
    await officer.save();

    // ── Also update User collection (sync) ─────────────────────────────────────
    try {
      await User.updateOne(
        { email: officer.email, role: 'officer' },
        { isActive: true }
      );
    } catch (userErr) {
      console.error('[unblockOfficer] ⚠️ User sync failed:', userErr.message);
    }

    // ── Create audit log ──────────────────────────────────────────────────────
    try {
      await AuditLog.create({
        action: 'officer_unblocked',
        performedBy: adminId,
        performedByModel: 'User',
        role: 'admin',
        targetId: officer._id,
        targetModel: 'Officer',
        employeeId: officer.employeeId,
        department: officer.department,
        details: {
          unblockedOfficer: officer.name,
          unblockedAt: new Date()
        },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
      console.log('[unblockOfficer] ✓ Audit log created');
    } catch (auditErr) {
      console.error('[unblockOfficer] ⚠️ Audit log failed:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Officer ${officer.name} has been unblocked successfully and can now login`,
      data: {
        officerId: officer._id,
        employeeId: officer.employeeId,
        name: officer.name,
        isBlocked: officer.isBlocked,
        status: officer.status,
      }
    });
  } catch (err) { next(err); }
};

// ── Department complaint queue (unassigned complaints for officer's dept) ─────
// @route GET /api/officer/queue
// @desc  Returns all pending, unaccepted complaints for the officer's department.
//        Officers see this shared queue and can self-assign from it.
export const getDepartmentQueue = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, priority } = req.query;
    const deptSlug = req.officer.department;

    // Resolve department ObjectId from slug
    const dept = await Department.findOne({ slug: deptSlug });
    if (!dept) {
      // Fallback: query by category slug directly (handles cases where dept doc missing)
      const filter = {
        category: deptSlug,
        isAccepted: false,
        status: 'pending',
      };
      if (priority) filter.priority = priority;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [total, complaints] = await Promise.all([
        Complaint.countDocuments(filter),
        Complaint.find(filter)
          .populate('citizen', 'name phone email')
          .sort({ isEmergency: -1, priority: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
      ]);
      return res.status(200).json({ success: true, total, queue: complaints });
    }

    const filter = {
      department: dept._id,
      isAccepted: false,
      status: 'pending',
    };
    if (priority) filter.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [total, complaints] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.find(filter)
        .populate('citizen', 'name phone email')
        .sort({ isEmergency: -1, priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
    ]);

    await touchLastActive(req.officer.id);

    res.status(200).json({ success: true, total, queue: complaints });
  } catch (err) { next(err); }
};

// ── Self-assign complaint from department queue ───────────────────────────────
// @route PUT /api/officer/complaints/:id/self-assign
// @desc  Officer picks up an unaccepted complaint from the shared department queue.
//        Uses findOneAndUpdate with atomic check to prevent race conditions.
export const selfAssignComplaint = async (req, res, next) => {
  try {
    const officerId = req.officer.id;
    const deptSlug = req.officer.department;

    // Resolve department ObjectId
    const dept = await Department.findOne({ slug: deptSlug });

    // Atomic update — only succeeds if complaint is still unaccepted
    // This prevents two officers from accepting the same complaint simultaneously
    const departmentFilter = dept
      ? { department: dept._id }
      : { category: deptSlug };

    const complaint = await Complaint.findOneAndUpdate(
      {
        _id: req.params.id,
        ...departmentFilter,
        isAccepted: false,
        status: 'pending',
      },
      {
        $set: {
          isAccepted: true,
          acceptedBy: officerId,
          acceptedAt: new Date(),
          assignedOfficer: officerId,
          status: 'assigned',
        },
        $push: {
          timeline: {
            status: 'assigned',
            note: `Accepted by officer ${req.officer.employeeId} from department queue`,
            updatedBy: officerId,
            updatedAt: new Date(),
          },
        },
      },
      { new: true }
    ).populate('citizen', 'name phone email');

    if (!complaint) {
      // Either not found, wrong dept, or already accepted by another officer
      const existing = await Complaint.findById(req.params.id).select('isAccepted acceptedBy');
      if (existing?.isAccepted) {
        return res.status(409).json({
          success: false,
          message: 'This complaint has already been accepted by another officer.',
          code: 'ALREADY_ACCEPTED',
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not available in your department queue.',
        code: 'NOT_FOUND',
      });
    }

    // Update officer stats + status
    const officer = await Officer.findById(officerId);
    if (officer) {
      officer.lastActive = new Date();
      officer.status = 'busy';
      await officer.save({ validateBeforeSave: false });
    }

    // Notify all dept officers via socket — remove from their queues
    emitComplaintAcceptedToDept(deptSlug, complaint._id.toString(), req.officer.employeeId);

    // Notify citizen via socket
    emitComplaintUpdate(complaint.citizen?._id, complaint, {
      message: `Your complaint has been accepted by an officer`,
    });

    // Audit log
    try {
      await AuditLog.create({
        action: 'officer_complaint_accept',
        performedBy: officerId,
        performedByModel: 'Officer',
        role: 'officer',
        employeeId: req.officer.employeeId,
        department: deptSlug,
        targetModel: 'Complaint',
        targetId: complaint._id,
        details: { complaintId: complaint.complaintId, source: 'department_queue' },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (auditErr) {
      console.error('[selfAssignComplaint] ⚠️ Audit log failed:', auditErr.message);
    }

    console.log('[selfAssignComplaint] ✅ Complaint', complaint.complaintId, 'accepted by', req.officer.employeeId);

    res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaintId} accepted successfully`,
      data: complaint,
    });
  } catch (err) { next(err); }
};

// ── Helper ────────────────────────────────────────────────────────────────────
function buildOfficerResponse(officer) {
  return {
    id: officer._id,
    name: officer.name,
    email: officer.email,
    mobile: officer.mobile,
    department: officer.department,
    employeeId: officer.employeeId,
    role: 'officer',
    status: officer.status,
    banned: officer.banned,
    isActive: officer.isActive,
    isBlocked: officer.isBlocked,
    blockedAt: officer.blockedAt,
    blockedBy: officer.blockedBy,
    blockReason: officer.blockReason,
    complaintsSolved: officer.complaintsSolved,
    complaintsPending: officer.complaintsPending,
    complaintsInProgress: officer.complaintsInProgress,
    complaintsAssigned: officer.complaintsAssigned,
    resolutionRate: officer.resolutionRate,
    lastActive: officer.lastActive,
    lastLogin: officer.lastLogin,
    loginCount: officer.loginCount,
    createdAt: officer.createdAt,
  };
}
