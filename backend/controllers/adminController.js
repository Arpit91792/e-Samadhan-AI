import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Officer from '../models/Officer.js';
import Complaint from '../models/Complaint.js';
import AuditLog from '../models/AuditLog.js';
import { resolveDepartmentSlug, getDepartmentLabel } from '../utils/departmentResolve.js';
import { generateOfficerEmployeeId } from '../utils/officerEmployeeId.js';
import { sendOfficerWelcomeEmail } from '../utils/officerEmail.js';

const VALID_DEPARTMENTS = new Set([
  'police',
  'electricity',
  'water_supply',
  'roads_transport',
  'healthcare',
  'municipal',
  'sanitation',
  'education',
]);

const DEPARTMENT_LABELS = {
  police: 'Police',
  electricity: 'Electricity',
  water_supply: 'Water Supply',
  roads_transport: 'Roads & Transport',
  healthcare: 'Healthcare',
  municipal: 'Municipal Services',
  sanitation: 'Sanitation',
  education: 'Education',
};

const convertDeptToSlug = (dept) => {
  if (!dept) return '';
  const normalized = String(dept).trim();
  const mapping = {
    Police: 'police',
    Electricity: 'electricity',
    'Water Supply': 'water_supply',
    'Roads & Transport': 'roads_transport',
    Healthcare: 'healthcare',
    'Municipal Services': 'municipal',
    Sanitation: 'sanitation',
    Education: 'education',
    police: 'police',
    electricity: 'electricity',
    water_supply: 'water_supply',
    roads_transport: 'roads_transport',
    healthcare: 'healthcare',
    municipal: 'municipal',
    sanitation: 'sanitation',
    education: 'education',
  };
  return mapping[normalized] || normalized.toLowerCase().replace(/\s+/g, '_');
};

const getDeptLabel = (departmentSlug) => DEPARTMENT_LABELS[departmentSlug] || getDepartmentLabel(departmentSlug) || departmentSlug;

const createAuthToken = (admin) =>
  admin.getSignedJwtToken();

export const registerAdmin = async (req, res) => {
  try {
    const { name, mobile, email, department, password, confirmPassword, otpVerified } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required', code: 'INVALID_NAME' });
    }
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required', code: 'INVALID_EMAIL' });
    }
    if (!mobile?.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required', code: 'INVALID_MOBILE' });
    }
    if (!department?.trim()) {
      return res.status(400).json({ success: false, message: 'Please select department', code: 'DEPARTMENT_REQUIRED' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters', code: 'INVALID_PASSWORD' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match', code: 'PASSWORD_MISMATCH' });
    }
    if (otpVerified !== true && otpVerified !== 'true') {
      return res.status(400).json({ success: false, message: 'Please verify your email with OTP', code: 'OTP_REQUIRED' });
    }

    const departmentSlug = convertDeptToSlug(department);
    if (!VALID_DEPARTMENTS.has(departmentSlug)) {
      return res.status(400).json({ success: false, message: 'Invalid department selected', code: 'INVALID_DEPARTMENT' });
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists', code: 'DUPLICATE_EMAIL' });
    }

    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
      password,
      department: departmentSlug,
    });

    const token = createAuthToken(admin);
    const responseUser = {
      id: admin._id.toString(),
      _id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      mobile: admin.mobile,
      department: admin.department,
      managedDepartment: admin.department,
      role: 'admin',
      createdAt: admin.createdAt,
    };

    res.status(201).json({
      success: true,
      message: `Welcome to ${getDeptLabel(departmentSlug)} Admin Portal`,
      token,
      user: responseUser,
      admin: responseUser,
      department: departmentSlug,
      departmentName: getDeptLabel(departmentSlug),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists', code: 'DUPLICATE_EMAIL' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendAdminLoginResponse = (res, { token, responseUser, departmentSlug }) => {
  console.log('Admin Login Success:', responseUser.email, departmentSlug);
  return res.status(200).json({
    success: true,
    message: `Welcome to ${getDeptLabel(departmentSlug)} Admin Portal`,
    token,
    user: responseUser,
    admin: responseUser,
    department: departmentSlug,
    departmentName: getDeptLabel(departmentSlug),
  });
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password, department } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid email', code: 'INVALID_EMAIL' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Invalid password', code: 'INVALID_PASSWORD' });
    }
    if (!department?.trim()) {
      return res.status(400).json({ success: false, message: 'Please select your department', code: 'DEPARTMENT_REQUIRED' });
    }

    const departmentSlug = convertDeptToSlug(department);
    if (!VALID_DEPARTMENTS.has(departmentSlug)) {
      return res.status(400).json({ success: false, message: 'Invalid department selected', code: 'INVALID_DEPARTMENT' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');
    if (admin) {
      const passwordOk = await admin.matchPassword(password);
      if (!passwordOk) {
        return res.status(401).json({ success: false, message: 'Invalid password', code: 'INVALID_PASSWORD' });
      }
      if (admin.department !== departmentSlug) {
        return res.status(403).json({ success: false, message: 'Invalid department selected', code: 'DEPARTMENT_MISMATCH' });
      }

      const responseUser = {
        id: admin._id.toString(),
        _id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        department: admin.department,
        managedDepartment: admin.department,
        role: 'admin',
        createdAt: admin.createdAt,
      };

      return sendAdminLoginResponse(res, {
        token: createAuthToken(admin),
        responseUser,
        departmentSlug: admin.department,
      });
    }

    // Legacy accounts created via User-based admin register
    const legacyUser = await User.findOne({ email: normalizedEmail, role: 'admin' }).select('+password');
    if (!legacyUser || legacyUser.isActive === false) {
      return res.status(401).json({ success: false, message: 'Invalid email', code: 'INVALID_EMAIL' });
    }

    const legacyPasswordOk = await legacyUser.matchPassword(password);
    if (!legacyPasswordOk) {
      return res.status(401).json({ success: false, message: 'Invalid password', code: 'INVALID_PASSWORD' });
    }

    const legacyDept = legacyUser.managedDepartment || legacyUser.department || '';
    if (legacyDept && legacyDept !== departmentSlug) {
      return res.status(403).json({ success: false, message: 'Invalid department selected', code: 'DEPARTMENT_MISMATCH' });
    }

    const effectiveDept = legacyDept || departmentSlug;
    const responseUser = {
      id: legacyUser._id.toString(),
      _id: legacyUser._id.toString(),
      name: legacyUser.name,
      email: legacyUser.email,
      mobile: legacyUser.phone,
      department: effectiveDept,
      managedDepartment: effectiveDept,
      role: 'admin',
      adminLevel: legacyUser.adminLevel,
      createdAt: legacyUser.createdAt,
    };

    return sendAdminLoginResponse(res, {
      token: legacyUser.getSignedJwtToken(),
      responseUser,
      departmentSlug: effectiveDept,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    if (!req.admin?.id) {
      return res.status(401).json({ success: false, message: 'Not authorized', code: 'NO_ADMIN' });
    }

    let admin = await Admin.findById(req.admin.id);
    if (!admin) {
      const userAdmin = await User.findById(req.admin.id).select('name email phone role managedDepartment department createdAt');
      if (userAdmin?.role === 'admin') {
        const department = userAdmin.managedDepartment || userAdmin.department || req.admin.department;
        return res.status(200).json({
          success: true,
          data: {
            id: userAdmin._id,
            name: userAdmin.name,
            email: userAdmin.email,
            mobile: userAdmin.phone,
            department,
            createdAt: userAdmin.createdAt,
          },
        });
      }
      // Middleware attached admin from JWT when DB row was cleared
      return res.status(200).json({
        success: true,
        data: {
          id: req.admin.id,
          name: req.admin.name,
          email: req.admin.email,
          mobile: '',
          department: req.admin.department,
        },
      });
    }
    res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        department: admin.department,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOfficer = async (req, res) => {
  try {
    const { name, mobile, email } = req.body;

    // Verify admin is properly authenticated
    if (!req.admin?.id) {
      console.error('[createOfficer] req.admin.id missing:', req.admin);
      return res.status(401).json({
        success: false,
        message: 'Admin authentication failed. Please log in again.',
        code: 'NO_ADMIN_ID',
      });
    }

    if (!req.admin?.department) {
      console.error('[createOfficer] req.admin.department missing:', req.admin);
      return res.status(403).json({
        success: false,
        message: 'Admin department is missing. Please log in again with your department.',
        code: 'ADMIN_DEPARTMENT_MISSING',
      });
    }

    // Department always from logged-in admin — never from request body
    const department = resolveDepartmentSlug(req.admin?.department);

    console.log('[createOfficer] Admin context:', {
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      adminDept: req.admin.department,
      normalizedDept: department,
    });

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Officer name is required', code: 'INVALID_NAME' });
    }
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid officer email is required', code: 'INVALID_EMAIL' });
    }
    if (!mobile?.trim()) {
      return res.status(400).json({ success: false, message: 'Officer mobile number is required', code: 'INVALID_MOBILE' });
    }
    if (!department || !VALID_DEPARTMENTS.has(department)) {
      return res.status(403).json({
        success: false,
        message: 'Admin department is invalid. Sign in again with your department.',
        code: 'ADMIN_DEPARTMENT_MISSING',
      });
    }

    const existingOfficer = await Officer.findOne({ email: email.toLowerCase().trim() });
    if (existingOfficer) {
      return res.status(400).json({ success: false, message: 'An officer with this email already exists', code: 'DUPLICATE_EMAIL' });
    }

    const employeeId = await generateOfficerEmployeeId(department);

    const officerData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
      department,
      employeeId,
    };

    if (req.admin?.id && mongoose.Types.ObjectId.isValid(String(req.admin.id))) {
      const adminExists = await Admin.findById(req.admin.id).select('_id');
      if (adminExists) {
        officerData.createdByAdmin = adminExists._id;
      } else {
        console.warn('[createOfficer] Admin ID in JWT not found in Admin collection:', req.admin.id);
      }
    }

    console.log('[createOfficer] Creating officer:', officerData);

    const officer = await Officer.create(officerData);
    console.log('[createOfficer] Officer created:', {
      _id: officer._id,
      employeeId: officer.employeeId,
      department: officer.department,
    });

    try {
      await sendOfficerWelcomeEmail(officer);
    } catch (err) {
      console.warn('[createOfficer] Officer welcome email failed:', err.message || err);
    }

    res.status(201).json({
      success: true,
      message: 'Officer Created Successfully',
      data: {
        _id: officer._id,
        name: officer.name,
        email: officer.email,
        mobile: officer.mobile,
        employeeId: officer.employeeId,
        department: officer.department,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOfficers = async (req, res) => {
  try {
    // Verify admin is properly authenticated
    if (!req.admin?.id) {
      console.error('[getOfficers] req.admin.id missing:', req.admin);
      return res.status(401).json({
        success: false,
        message: 'Admin authentication failed. Please log in again.',
        code: 'NO_ADMIN_ID',
      });
    }

    if (!req.admin?.department) {
      console.error('[getOfficers] req.admin.department missing:', req.admin);
      return res.status(403).json({
        success: false,
        message: 'Admin department is missing. Please log in again with your department.',
        code: 'ADMIN_DEPARTMENT_MISSING',
      });
    }

    const department = req.admin.department;
    console.log('[getOfficers] Fetching officers for admin:', {
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      department: department,
    });

    const officers = await Officer.find({ department }).sort({ createdAt: -1 });

    const officersWithStats = await Promise.all(
      officers.map(async (officer) => {
        const oid = officer._id;
        const complaintsSolved = await Complaint.countDocuments({
          assignedOfficer: oid,
          status: 'resolved',
          category: department,
        });
        const complaintsPending = await Complaint.countDocuments({
          assignedOfficer: oid,
          status: { $in: ['pending', 'assigned', 'in_progress'] },
          category: department,
        });
        return {
          ...officer.toObject(),
          complaintsSolved,
          complaintsPending,
        };
      })
    );

    console.log('[getOfficers] Found officers:', officersWithStats.length);

    res.status(200).json({ success: true, data: officersWithStats, officers: officersWithStats });
  } catch (error) {
    console.error('[getOfficers] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const banOfficer = async (req, res) => {
  try {
    const officerId = req.params.id;
    const department = req.admin.department;

    const officer = await Officer.findOne({ _id: officerId, department });
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found in your department' });
    }

    officer.banned = !officer.banned;
    await officer.save();

    res.status(200).json({
      success: true,
      message: `Officer ${officer.banned ? 'banned' : 'unbanned'} successfully`,
      data: officer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminAnalytics = async (req, res) => {
  try {
    const department = req.admin.department;

    const totalComplaints = await Complaint.countDocuments({ category: department });
    const resolvedComplaints = await Complaint.countDocuments({ category: department, status: 'resolved' });
    const pendingComplaints = await Complaint.countDocuments({ category: department, status: { $in: ['pending', 'assigned', 'in_progress'] } });
    const totalOfficers = await Officer.countDocuments({ department, banned: false });

    res.status(200).json({
      success: true,
      data: {
        totalComplaints,
        resolvedComplaints,
        pendingComplaints,
        totalOfficers,
        resolutionRate: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminComplaints = async (req, res) => {
  try {
    const department = req.admin.department;
    const { status, search, emergency, limit = 50, page = 1 } = req.query;
    const filter = { category: department };

    if (status) filter.status = status;
    if (emergency === 'true') filter.isEmergency = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { complaintId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const complaints = await Complaint.find(filter)
      .sort({ isEmergency: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Complaint.countDocuments(filter);
    res.status(200).json({
      success: true,
      complaints,
      data: complaints,
      total,
      department,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignOfficerToComplaint = async (req, res) => {
  try {
    const department = req.admin.department;
    const { complaintId, officerId } = req.body;

    if (!complaintId || !officerId) {
      return res.status(400).json({ success: false, message: 'complaintId and officerId are required' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    if (complaint.category !== department) {
      return res.status(403).json({ success: false, message: 'Complaint is outside your department' });
    }

    const officer = await Officer.findOne({ _id: officerId, department, banned: false });
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found in your department' });
    }

    complaint.assignedOfficer = officer._id;
    complaint.status = 'assigned';
    complaint.timeline.push({
      status: 'assigned',
      note: `Assigned to ${officer.name} (${officer.employeeId})`,
      updatedBy: req.admin.id,
      updatedAt: new Date(),
    });
    await complaint.save();

    res.status(200).json({ success: true, message: 'Officer assigned', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const department = req.admin.department;
    const { complaintId, status, note = '' } = req.body;
    const allowedStatuses = ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'];

    if (!complaintId || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid complaintId and status are required' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    if (complaint.category !== department) {
      return res.status(403).json({ success: false, message: 'Complaint is outside your department' });
    }

    const prevStatus = complaint.status;
    complaint.status = status;
    if (status === 'resolved') complaint.resolvedAt = new Date();
    complaint.timeline.push({
      status,
      note: note || `Status updated to ${status} by admin`,
      updatedBy: req.admin.id,
      updatedAt: new Date(),
    });
    await complaint.save();

    if (status === 'resolved' && complaint.assignedOfficer) {
      await Officer.findByIdAndUpdate(complaint.assignedOfficer, {
        $inc: { complaintsSolved: 1 },
      });
    }

    res.status(200).json({ success: true, message: 'Status updated', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmergencyComplaints = async (req, res) => {
  try {
    const department = req.admin.department;
    const complaints = await Complaint.find({ category: department, isEmergency: true }).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single officer detail with full stats + all assigned complaints
// @route GET /api/admin/officers/:id
export const getOfficerDetail = async (req, res) => {
  try {
    const department = req.admin.department;
    const officer = await Officer.findOne({ _id: req.params.id, department }).select('-password');
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found in your department' });
    }

    // Recalc live stats from Complaint collection
    await officer.recalcStats();

    // ── Monthly chart data (last 6 months) ──────────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Complaint.aggregate([
      { $match: { assignedOfficer: officer._id, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
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

    // ── All assigned complaints with full citizen + location data ────────────
    const assignedComplaints = await Complaint.find({ assignedOfficer: officer._id })
      .sort({ isEmergency: -1, createdAt: -1 })
      .limit(100)
      .populate('citizen', 'name phone email address city state')
      .lean();

    // ── Avg resolution time ──────────────────────────────────────────────────
    const resolvedList = await Complaint.find({
      assignedOfficer: officer._id,
      status: 'resolved',
      resolvedAt: { $exists: true },
    }).select('createdAt resolvedAt').lean();

    let avgResolutionHrs = 0;
    if (resolvedList.length > 0) {
      const totalMs = resolvedList.reduce((s, c) => s + (new Date(c.resolvedAt) - new Date(c.createdAt)), 0);
      avgResolutionHrs = Math.round(totalMs / resolvedList.length / 3600000);
    }

    // ── Extra counts ─────────────────────────────────────────────────────────
    const emergencyCount = await Complaint.countDocuments({ assignedOfficer: officer._id, isEmergency: true });
    const aiPriorityCount = await Complaint.countDocuments({ assignedOfficer: officer._id, aiPriorityReason: { $nin: ['', null] } });
    const currentActive = await Complaint.countDocuments({ assignedOfficer: officer._id, status: { $in: ['assigned', 'in_progress'] } });

    // ── Activity logs (safe — skip if collection empty) ──────────────────────
    let activityLogs = [];
    try {
      activityLogs = await AuditLog.find({ targetId: officer._id })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
    } catch (_) { /* AuditLog may be empty in dev */ }

    // ── Performance score ────────────────────────────────────────────────────
    const performanceScore = Math.min(100, Math.round(
      (officer.resolutionRate * 0.6) +
      (Math.min(officer.complaintsAssigned, 50) / 50 * 30) +
      (officer.status === 'active' ? 10 : 0)
    ));

    res.status(200).json({
      success: true,
      data: {
        ...officer.toObject(),
        chartData,
        assignedComplaints,
        avgResolutionHrs,
        emergencyCount,
        aiPriorityCount,
        currentActive,
        activityLogs,
        performanceScore,
      },
    });
  } catch (error) {
    console.error('[getOfficerDetail] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Block / Unblock officer (toggle)
// @route PUT /api/admin/officers/:id/toggle-block
export const toggleBlockOfficer = async (req, res) => {
  try {
    const department = req.admin.department;
    const officer = await Officer.findOne({ _id: req.params.id, department });
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found in your department' });
    }
    const now = new Date();
    const wasBlocked = officer.isBlocked;

    if (!officer.isBlocked) {
      // ── Block ──────────────────────────────────────────────────────────────
      officer.isBlocked = true;
      officer.blockedAt = now;
      officer.blockedBy = req.admin.id;
      officer.blockReason = req.body.reason || 'Blocked by admin';
      officer.banned = true;
      officer.isActive = false;
      officer.status = 'suspended';

      // Clear active JWT session so existing tokens stop working immediately
      officer.activeSession = { token: null, loginAt: null };
    } else {
      // ── Unblock ────────────────────────────────────────────────────────────
      officer.isBlocked = false;
      officer.blockedAt = null;
      officer.blockedBy = null;
      officer.blockReason = '';
      officer.banned = false;
      officer.isActive = true;
      officer.status = 'offline';
    }
    await officer.save({ validateBeforeSave: false });

    // ── Invalidate sessions in sessions collection when blocking ──────────────
    if (!wasBlocked) {
      try {
        const Session = (await import('../models/Session.js')).default;
        await Session.deleteMany({ userId: officer._id, role: 'officer' });
        console.log('[toggleBlockOfficer] ✓ Sessions cleared for:', officer.employeeId);
      } catch (sessionErr) {
        console.error('[toggleBlockOfficer] ⚠️ Session clear failed:', sessionErr.message);
      }
    }

    // ── Audit log ─────────────────────────────────────────────────────────────
    try {
      await AuditLog.create({
        action: officer.isBlocked ? 'officer_blocked' : 'officer_unblocked',
        performedBy: req.admin.id,
        performedByModel: 'User',
        role: 'admin',
        targetModel: 'Officer',
        targetId: officer._id,
        employeeId: officer.employeeId,
        department: officer.department,
        details: {
          action: officer.isBlocked ? 'block_officer' : 'unblock_officer',
          reason: officer.blockReason,
          officerName: officer.name,
        },
        ipAddress: req.ip,
      });
    } catch (e) { console.warn('[toggleBlockOfficer] AuditLog failed:', e?.message); }

    res.status(200).json({
      success: true,
      message: `Officer ${officer.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: {
        isBlocked: officer.isBlocked,
        blockedAt: officer.blockedAt,
        blockedBy: officer.blockedBy,
        blockReason: officer.blockReason,
        status: officer.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update officer status
// @route PUT /api/admin/officers/:id/status
export const updateOfficerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['active', 'busy', 'offline', 'suspended'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const department = req.admin.department;
    const officer = await Officer.findOne({ _id: req.params.id, department });
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found in your department' });
    }

    officer.status = status;
    if (status === 'suspended') { officer.banned = true; officer.isActive = false; }
    else if (status === 'active') { officer.banned = false; officer.isActive = true; }
    await officer.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Officer status updated', data: officer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get full officer analytics for admin dashboard
// @route GET /api/admin/officer-analytics
export const getOfficerAnalytics = async (req, res) => {
  try {
    const department = req.admin.department;
    const officers = await Officer.find({ department }).select('-password');

    // Recalc all officers
    await Promise.all(officers.map((o) => o.recalcStats()));

    const totalOfficers = officers.length;
    const activeOfficers = officers.filter((o) => !o.banned && o.status === 'active').length;
    const blockedOfficers = officers.filter((o) => o.banned).length;
    const totalAssigned = officers.reduce((s, o) => s + o.complaintsAssigned, 0);
    const totalResolved = officers.reduce((s, o) => s + o.complaintsSolved, 0);
    const avgResolutionRate = totalOfficers > 0
      ? Math.round(officers.reduce((s, o) => s + o.resolutionRate, 0) / totalOfficers)
      : 0;

    const topPerformers = [...officers]
      .sort((a, b) => b.resolutionRate - a.resolutionRate)
      .slice(0, 5)
      .map((o) => ({
        _id: o._id,
        name: o.name,
        employeeId: o.employeeId,
        resolutionRate: o.resolutionRate,
        complaintsSolved: o.complaintsSolved,
        complaintsAssigned: o.complaintsAssigned,
        status: o.status,
        banned: o.banned,
      }));

    res.status(200).json({
      success: true,
      data: {
        totalOfficers,
        activeOfficers,
        blockedOfficers,
        totalAssigned,
        totalResolved,
        avgResolutionRate,
        topPerformers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
