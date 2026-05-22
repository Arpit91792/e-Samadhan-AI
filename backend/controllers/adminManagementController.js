import User from '../models/User.js';
import Officer from '../models/Officer.js';
import Complaint from '../models/Complaint.js';
import Department from '../models/Department.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import {
      getAdminScope,
      buildComplaintFilter,
      buildOfficerFilter,
      assertComplaintAccess,
      isSuperAdmin,
      DEPT_SLUGS,
} from '../utils/adminScope.js';
import { generateEmployeeId } from '../utils/employeeId.js';
import { sendOfficerWelcomeEmail } from '../utils/officerEmail.js';
import { emitAdminAlert } from '../socket/index.js';
import crypto from 'crypto';

// @desc  Department-scoped complaints
// @route GET /api/admin/complaints
export const getAdminComplaints = async (req, res, next) => {
      try {
            const scope = req.adminScope || await getAdminScope(req.user);
            const { status, priority, page = 1, limit = 20, search, emergency } = req.query;
            const filter = await buildComplaintFilter(scope);

            if (status) filter.status = status;
            if (priority) filter.priority = priority;
            if (emergency === 'true') filter.isEmergency = true;
            if (search) {
                  filter.$or = [
                        { title: { $regex: search, $options: 'i' } },
                        { complaintId: { $regex: search, $options: 'i' } },
                  ];
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const total = await Complaint.countDocuments(filter);
            const complaints = await Complaint.find(filter)
                  .populate('citizen', 'name email phone')
                  .populate('assignedOfficer', 'name email employeeId department')
                  .populate('department', 'name slug color')
                  .sort({ isEmergency: -1, createdAt: -1 })
                  .skip(skip)
                  .limit(parseInt(limit));

            res.status(200).json({
                  success: true,
                  total,
                  page: parseInt(page),
                  totalPages: Math.ceil(total / parseInt(limit)),
                  complaints,
            });
      } catch (error) { next(error); }
};

// @desc  Department-scoped officers
// @route GET /api/admin/officers
export const getAdminOfficers = async (req, res, next) => {
      try {
            const scope = req.adminScope || await getAdminScope(req.user);
            const { status, page = 1, limit = 20, search } = req.query;
            const filter = buildOfficerFilter(scope);

            if (status) filter.officerStatus = status;
            if (search) {
                  filter.$or = [
                        { name: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } },
                        { employeeId: { $regex: search, $options: 'i' } },
                  ];
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const total = await User.countDocuments(filter);
            const officers = await User.find(filter)
                  .select('-password -govtIdNumber')
                  .sort({ createdAt: -1 })
                  .skip(skip)
                  .limit(parseInt(limit));

            res.status(200).json({
                  success: true,
                  total,
                  page: parseInt(page),
                  totalPages: Math.ceil(total / parseInt(limit)),
                  officers,
            });
      } catch (error) { next(error); }
};

// @desc  Assign complaint to officer (department-scoped)
// @route PUT /api/admin/assign-officer
export const assignOfficerToComplaint = async (req, res, next) => {
      try {
            const scope = req.adminScope || await getAdminScope(req.user);
            const { complaintId, officerId } = req.body;
            if (!complaintId || !officerId) {
                  return res.status(400).json({ success: false, message: 'complaintId and officerId are required' });
            }

            const complaint = await Complaint.findById(complaintId);
            if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
            if (!(await assertComplaintAccess(scope, complaint))) {
                  return res.status(403).json({ success: false, message: 'Complaint is outside your department' });
            }

            const officer = await User.findOne({
                  _id: officerId,
                  role: 'officer',
                  officerStatus: 'approved',
                  isActive: true,
            });
            if (!officer) return res.status(404).json({ success: false, message: 'Approved officer not found' });

            if (!scope.isSuper && officer.department !== scope.departmentSlug) {
                  return res.status(403).json({ success: false, message: 'Officer belongs to a different department' });
            }

            complaint.assignedOfficer = officerId;
            complaint.status = 'assigned';
            complaint.timeline.push({
                  status: 'assigned',
                  note: `Assigned to ${officer.name} (${officer.employeeId || 'officer'})`,
                  updatedBy: req.user._id,
            });
            await complaint.save();

            officer.performanceStats.complaintsAssigned = (officer.performanceStats?.complaintsAssigned || 0) + 1;
            await officer.save({ validateBeforeSave: false });

            await Notification.create({
                  recipient: officerId,
                  title: 'New complaint assigned',
                  message: `You have been assigned: ${complaint.title}`,
                  type: 'complaint_assigned',
                  complaint: complaint._id,
            });

            emitAdminAlert(complaint.category, {
                  type: 'complaint_assigned',
                  complaintId: complaint.complaintId,
                  title: complaint.title,
                  status: complaint.status,
            });

            res.status(200).json({ success: true, message: 'Officer assigned', complaint });
      } catch (error) { next(error); }
};

// @desc  Update complaint status (department-scoped)
// @route PUT /api/admin/update-status
export const updateComplaintStatusAdmin = async (req, res, next) => {
      try {
            const scope = req.adminScope || await getAdminScope(req.user);
            const { complaintId, status, note } = req.body;
            const valid = ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'];
            if (!complaintId || !valid.includes(status)) {
                  return res.status(400).json({ success: false, message: 'Valid complaintId and status required' });
            }

            const complaint = await Complaint.findById(complaintId);
            if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
            if (!(await assertComplaintAccess(scope, complaint))) {
                  return res.status(403).json({ success: false, message: 'Complaint is outside your department' });
            }

            complaint.status = status;
            if (status === 'resolved') complaint.resolvedAt = new Date();
            complaint.timeline.push({
                  status,
                  note: note || `Status updated to ${status} by admin`,
                  updatedBy: req.user._id,
            });
            await complaint.save();

            if (status === 'resolved' && complaint.assignedOfficer) {
                  await User.findByIdAndUpdate(complaint.assignedOfficer, {
                        $inc: { 'performanceStats.complaintsResolved': 1 },
                  });
            }

            emitAdminAlert(complaint.category, {
                  type: 'status_updated',
                  complaintId: complaint.complaintId,
                  title: complaint.title,
                  status: complaint.status,
            });

            res.status(200).json({ success: true, message: 'Status updated', complaint });
      } catch (error) { next(error); }
};

// @desc  Create department admin (super admin only)
// @route POST /api/admin/create-department-admin
export const createDepartmentAdmin = async (req, res, next) => {
      try {
            const { name, email, password, department } = req.body;
            if (!name || !email || !password || !department) {
                  return res.status(400).json({ success: false, message: 'name, email, password, and department are required' });
            }
            if (!DEPT_SLUGS.includes(department)) {
                  return res.status(400).json({ success: false, message: 'Invalid department' });
            }

            const exists = await User.findOne({ email: email.toLowerCase() });
            if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

            const admin = await User.create({
                  name,
                  email,
                  password,
                  role: 'admin',
                  adminLevel: 'department_admin',
                  managedDepartment: department,
                  adminSecretVerified: true,
                  isEmailVerified: true,
                  isActive: true,
            });

            await AuditLog.create({
                  action: 'admin_action',
                  performedBy: req.user._id,
                  targetModel: 'User',
                  targetId: admin._id,
                  details: { action: 'create_department_admin', department },
                  ipAddress: req.ip,
            });

            res.status(201).json({
                  success: true,
                  message: 'Department admin created',
                  admin: {
                        _id: admin._id,
                        name: admin.name,
                        email: admin.email,
                        adminLevel: admin.adminLevel,
                        managedDepartment: admin.managedDepartment,
                  },
            });
      } catch (error) { next(error); }
};

// @desc  Remove department admin
// @route DELETE /api/admin/department-admins/:id
export const removeDepartmentAdmin = async (req, res, next) => {
      try {
            const admin = await User.findById(req.params.id);
            if (!admin || admin.role !== 'admin' || admin.adminLevel !== 'department_admin') {
                  return res.status(404).json({ success: false, message: 'Department admin not found' });
            }

            admin.isActive = false;
            await admin.save({ validateBeforeSave: false });

            res.status(200).json({ success: true, message: 'Department admin deactivated' });
      } catch (error) { next(error); }
};

// @desc  List department admins
// @route GET /api/admin/department-admins
export const getDepartmentAdmins = async (req, res, next) => {
      try {
            const admins = await User.find({
                  role: 'admin',
                  adminLevel: 'department_admin',
            }).select('name email managedDepartment isActive createdAt');

            res.status(200).json({ success: true, admins });
      } catch (error) { next(error); }
};

// @desc  Create officer account (admin) — generates Employee ID + welcome email
// @route POST /api/admin/create-officer
export const createOfficer = async (req, res, next) => {
      try {
            const scope = req.adminScope || await getAdminScope(req.user);
            const { name, email, mobile } = req.body;
            const department = req.admin?.department || req.user?.department || scope.departmentSlug;
            const deptSlug = scope.isSuper ? department : (scope.departmentSlug || department);

            if (!name || !email || !mobile) {
                  return res.status(400).json({
                        success: false,
                        message: 'name, email, and mobile are required',
                  });
            }
            if (!deptSlug || !DEPT_SLUGS.includes(deptSlug)) {
                  return res.status(400).json({ success: false, message: 'Invalid or missing department' });
            }
            if (!scope.isSuper && deptSlug !== scope.departmentSlug) {
                  return res.status(403).json({ success: false, message: 'Cannot create officer outside your department' });
            }

            const exists = await User.findOne({ email: email.toLowerCase() });
            if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

            const employeeId = await generateEmployeeId(deptSlug);
            const tempPassword = crypto.randomBytes(6).toString('hex') + 'A1!';

            const officer = await User.create({
                  name: name.trim(),
                  email: email.toLowerCase().trim(),
                  phone: mobile.trim(),
                  password: tempPassword,
                  role: 'officer',
                  department: deptSlug,
                  employeeId,
                  officerStatus: 'approved',
                  isActive: true,
                  isEmailVerified: true,
            });

            const dept = await Department.findOne({ slug: deptSlug });
            if (dept && !dept.officers.includes(officer._id)) {
                  dept.officers.push(officer._id);
                  await dept.save();
            }

            try {
                  await sendOfficerWelcomeEmail(officer);
            } catch (mailErr) {
                  console.warn('Officer welcome email failed:', mailErr.message);
            }

            res.status(201).json({
                  success: true,
                  message: 'Officer created. Welcome email sent with Employee ID.',
                  officer: {
                        _id: officer._id,
                        name: officer.name,
                        email: officer.email,
                        phone: officer.phone,
                        employeeId: officer.employeeId,
                        department: officer.department,
                  },
            });
      } catch (error) { next(error); }
};

// @desc  Approve officer
// @route PUT /api/admin/officers/:id/approve
export const approveOfficer = async (req, res, next) => {
      try {
            const scope = req.adminScope || await getAdminScope(req.user);
            const officer = await User.findOne({ _id: req.params.id, role: 'officer' });
            if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });

            if (!scope.isSuper && officer.department !== scope.departmentSlug) {
                  return res.status(403).json({ success: false, message: 'Officer is outside your department' });
            }

            if (!officer.employeeId) {
                  officer.employeeId = await generateEmployeeId(officer.department);
            }

            officer.officerStatus = 'approved';
            officer.isActive = true;
            await officer.save({ validateBeforeSave: false });

            const dept = await Department.findOne({ slug: officer.department });
            if (dept && !dept.officers.includes(officer._id)) {
                  dept.officers.push(officer._id);
                  await dept.save();
            }

            try {
                  await sendOfficerWelcomeEmail(officer);
            } catch (mailErr) {
                  console.warn('Officer approval email failed:', mailErr.message);
            }

            res.status(200).json({ success: true, message: 'Officer approved. Welcome email sent.', officer });
      } catch (error) { next(error); }
};

// @desc  Reject officer
// @route PUT /api/admin/officers/:id/reject
export const rejectOfficer = async (req, res, next) => {
      try {
            const scope = req.adminScope || await getAdminScope(req.user);
            const officer = await User.findOne({ _id: req.params.id, role: 'officer' });
            if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });

            if (!scope.isSuper && officer.department !== scope.departmentSlug) {
                  return res.status(403).json({ success: false, message: 'Officer is outside your department' });
            }

            officer.officerStatus = 'rejected';
            officer.isActive = false;
            await officer.save({ validateBeforeSave: false });

            res.status(200).json({ success: true, message: 'Officer rejected' });
      } catch (error) { next(error); }
};

// @desc  Generate employee ID
// @route POST /api/admin/officers/:id/generate-id
export const generateOfficerEmployeeId = async (req, res, next) => {
      try {
            const scope = req.adminScope || await getAdminScope(req.user);
            const officer = await User.findOne({ _id: req.params.id, role: 'officer' });
            if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });

            if (!scope.isSuper && officer.department !== scope.departmentSlug) {
                  return res.status(403).json({ success: false, message: 'Officer is outside your department' });
            }

            officer.employeeId = await generateEmployeeId(officer.department);
            await officer.save({ validateBeforeSave: false });

            res.status(200).json({ success: true, message: 'Employee ID generated', employeeId: officer.employeeId });
      } catch (error) { next(error); }
};

// @desc  Block officer
// @route PUT /api/admin/officers/:id/block
export const blockOfficer = async (req, res, next) => {
      try {
            const scope = req.adminScope || await getAdminScope(req.user);
            const officer = await User.findOne({ _id: req.params.id, role: 'officer' });
            if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });

            if (!scope.isSuper && officer.department !== scope.departmentSlug) {
                  return res.status(403).json({ success: false, message: 'Officer is outside your department' });
            }

            // ── Update User collection ──────────────────────────────────────────────
            officer.isActive = false;
            await officer.save({ validateBeforeSave: false });

            // ── Update Officer collection (sync status) ──────────────────────────────
            try {
                  const officerRecord = await Officer.findOne({ email: officer.email, employeeId: officer.employeeId });
                  if (officerRecord) {
                        officerRecord.isBlocked = true;
                        officerRecord.isActive = false;
                        officerRecord.blockedAt = new Date();
                        officerRecord.blockedBy = req.user._id;
                        await officerRecord.save({ validateBeforeSave: false });
                        console.log('[blockOfficer] ✓ Officer collection updated:', officer.employeeId);
                  }
            } catch (officerErr) {
                  console.error('[blockOfficer] ⚠️ Failed to update Officer collection:', officerErr.message);
            }

            res.status(200).json({ success: true, message: 'Officer blocked successfully' });
      } catch (error) { next(error); }
};

// @desc  Unblock officer
// @route PUT /api/admin/officers/:id/unblock
export const unblockOfficer = async (req, res, next) => {
      try {
            const scope = req.adminScope || await getAdminScope(req.user);
            const officer = await User.findOne({ _id: req.params.id, role: 'officer' });
            if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });

            if (!scope.isSuper && officer.department !== scope.departmentSlug) {
                  return res.status(403).json({ success: false, message: 'Officer is outside your department' });
            }

            // ── Update User collection ───────────────────────────────────────────────────
            officer.isActive = true;
            await officer.save({ validateBeforeSave: false });

            // ── Update Officer collection (sync status) ─────────────────────────────────
            try {
                  const officerRecord = await Officer.findOne({ email: officer.email, employeeId: officer.employeeId });
                  if (officerRecord) {
                        officerRecord.isBlocked = false;
                        officerRecord.isActive = true;
                        officerRecord.blockedAt = null;
                        officerRecord.blockedBy = null;
                        officerRecord.blockReason = '';
                        await officerRecord.save({ validateBeforeSave: false });
                        console.log('[unblockOfficer] ✓ Officer collection updated:', officer.employeeId);
                  }
            } catch (officerErr) {
                  console.error('[unblockOfficer] ⚠️ Failed to update Officer collection:', officerErr.message);
            }

            res.status(200).json({ success: true, message: 'Officer unblocked successfully' });
      } catch (error) { next(error); }
};

// @desc  Emergency complaints (scoped)
// @route GET /api/admin/emergencies
export const getEmergencyComplaints = async (req, res, next) => {
      try {
            const scope = req.adminScope || await getAdminScope(req.user);
            const filter = { ...(await buildComplaintFilter(scope)), isEmergency: true };

            const complaints = await Complaint.find(filter)
                  .populate('citizen', 'name phone')
                  .populate('department', 'name slug')
                  .sort({ createdAt: -1 })
                  .limit(50);

            res.status(200).json({ success: true, complaints });
      } catch (error) { next(error); }
};

// @desc  Send notification to department officers
// @route POST /api/admin/notifications
export const sendDepartmentNotification = async (req, res, next) => {
      try {
            const scope = req.adminScope || await getAdminScope(req.user);
            const { title, message } = req.body;
            if (!title || !message) {
                  return res.status(400).json({ success: false, message: 'title and message are required' });
            }

            const officerFilter = buildOfficerFilter(scope, { officerStatus: 'approved', isActive: true });
            const officers = await User.find(officerFilter).select('_id');

            await Promise.all(officers.map((o) => Notification.create({
                  recipient: o._id,
                  title,
                  message,
                  type: 'admin_broadcast',
            })));

            res.status(200).json({ success: true, message: `Sent to ${officers.length} officers` });
      } catch (error) { next(error); }
};
