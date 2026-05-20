import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Department from '../models/Department.js';
import AuditLog from '../models/AuditLog.js';
import { buildComplaintFilter, buildOfficerFilter } from '../utils/adminScope.js';

// @desc  Get dashboard stats (scoped by department for dept admins)
// @route GET /api/admin/dashboard
// @access Private (admin)
export const getDashboard = async (req, res, next) => {
      try {
            const scope = req.adminScope;
            const complaintFilter = await buildComplaintFilter(scope);
            const officerFilter = buildOfficerFilter(scope, { officerStatus: 'approved', isActive: true });

            const [
                  totalComplaints,
                  resolvedComplaints,
                  pendingComplaints,
                  inProgressComplaints,
                  emergencyComplaints,
                  escalatedComplaints,
                  activeOfficers,
                  pendingOfficers,
                  departments,
                  recentComplaints,
                  recentUsers,
            ] = await Promise.all([
                  Complaint.countDocuments(complaintFilter),
                  Complaint.countDocuments({ ...complaintFilter, status: { $in: ['resolved', 'closed'] } }),
                  Complaint.countDocuments({ ...complaintFilter, status: 'pending' }),
                  Complaint.countDocuments({ ...complaintFilter, status: { $in: ['assigned', 'in_progress'] } }),
                  Complaint.countDocuments({ ...complaintFilter, isEmergency: true }),
                  Complaint.countDocuments({
                        ...complaintFilter,
                        status: { $nin: ['resolved', 'closed', 'rejected'] },
                        createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                  }),
                  User.countDocuments(officerFilter),
                  User.countDocuments(buildOfficerFilter(scope, { officerStatus: 'pending' })),
                  scope.isSuper
                        ? Department.find({ isActive: true }).select('name slug stats color icon')
                        : Department.find({ slug: scope.departmentSlug }).select('name slug stats color icon'),
                  Complaint.find(complaintFilter).sort({ createdAt: -1 }).limit(10)
                        .populate('citizen', 'name email')
                        .populate('department', 'name slug'),
                  scope.isSuper
                        ? User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt')
                        : User.find(buildOfficerFilter(scope)).sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
            ]);

            const dept = scope.department || departments[0] || null;

            res.status(200).json({
                  success: true,
                  scope: {
                        isSuper: scope.isSuper,
                        departmentSlug: scope.departmentSlug,
                        departmentName: dept?.name || 'Platform',
                  },
                  dashboard: {
                        complaints: {
                              total: totalComplaints,
                              resolved: resolvedComplaints,
                              pending: pendingComplaints,
                              inProgress: inProgressComplaints,
                              emergency: emergencyComplaints,
                              escalated: escalatedComplaints,
                              resolutionRate: totalComplaints > 0
                                    ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : 0,
                        },
                        officers: { active: activeOfficers, pendingApproval: pendingOfficers },
                        departments,
                        recentComplaints,
                        recentUsers,
                  },
            });
      } catch (error) { next(error); }
};

// @desc  Get all users
// @route GET /api/admin/users
// @access Private (admin)
export const getAllUsers = async (req, res, next) => {
      try {
            const { role, page = 1, limit = 20, search, isActive } = req.query;
            const query = {};
            if (role) query.role = role;
            if (isActive !== undefined) query.isActive = isActive === 'true';
            if (search) query.$or = [
                  { name: { $regex: search, $options: 'i' } },
                  { email: { $regex: search, $options: 'i' } },
            ];

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const total = await User.countDocuments(query);
            const users = await User.find(query)
                  .select('-password -aadhaarNumber -govtIdNumber -resetPasswordToken')
                  .sort({ createdAt: -1 })
                  .skip(skip)
                  .limit(parseInt(limit));

            res.status(200).json({
                  success: true, total,
                  page: parseInt(page),
                  totalPages: Math.ceil(total / parseInt(limit)),
                  users,
            });
      } catch (error) { next(error); }
};

// @desc  Toggle user active status
// @route PUT /api/admin/users/:id/toggle
// @access Private (admin)
export const toggleUserStatus = async (req, res, next) => {
      try {
            const scope = req.adminScope;
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot deactivate admin accounts' });
            if (!scope.isSuper && user.role === 'officer' && user.department !== scope.departmentSlug) {
                  return res.status(403).json({ success: false, message: 'Officer is outside your department' });
            }

            user.isActive = !user.isActive;
            await user.save({ validateBeforeSave: false });

            await AuditLog.create({
                  action: 'admin_action',
                  performedBy: req.user._id,
                  targetModel: 'User',
                  targetId: user._id,
                  details: { action: user.isActive ? 'activated' : 'deactivated', targetEmail: user.email },
                  ipAddress: req.ip,
            });

            res.status(200).json({
                  success: true,
                  message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
                  isActive: user.isActive,
            });
      } catch (error) { next(error); }
};

// @desc  Get all departments
// @route GET /api/admin/departments
// @access Private (admin)
export const getDepartments = async (req, res, next) => {
      try {
            const scope = req.adminScope;
            const query = scope.isSuper ? {} : { slug: scope.departmentSlug };
            const departments = await Department.find(query)
                  .populate('headOfficer', 'name email')
                  .sort({ name: 1 });
            res.status(200).json({ success: true, departments });
      } catch (error) { next(error); }
};

// @desc  Update department
// @route PUT /api/admin/departments/:id
// @access Private (admin)
export const updateDepartment = async (req, res, next) => {
      try {
            const { name, description, slaHours, contactEmail, contactPhone, isActive } = req.body;
            const dept = await Department.findByIdAndUpdate(
                  req.params.id,
                  { name, description, slaHours, contactEmail, contactPhone, isActive },
                  { new: true, runValidators: true }
            );
            if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
            res.status(200).json({ success: true, message: 'Department updated', department: dept });
      } catch (error) { next(error); }
};

// @desc  Get audit logs
// @route GET /api/admin/audit-logs
// @access Private (admin)
export const getAuditLogs = async (req, res, next) => {
      try {
            const { page = 1, limit = 20 } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const total = await AuditLog.countDocuments();
            const logs = await AuditLog.find()
                  .populate('performedBy', 'name email role')
                  .sort({ createdAt: -1 })
                  .skip(skip)
                  .limit(parseInt(limit));

            res.status(200).json({
                  success: true, total,
                  page: parseInt(page),
                  totalPages: Math.ceil(total / parseInt(limit)),
                  logs,
            });
      } catch (error) { next(error); }
};

// @desc  Get platform analytics
// @route GET /api/admin/analytics
// @access Private (admin)
export const getPlatformAnalytics = async (req, res, next) => {
      try {
            const scope = req.adminScope;
            const complaintFilter = await buildComplaintFilter(scope);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const matchStage = { ...complaintFilter, createdAt: { $gte: thirtyDaysAgo } };

            const [
                  complaintsByDay,
                  complaintsByCategory,
                  complaintsByStatus,
                  avgResolutionTime,
                  topDepts,
            ] = await Promise.all([
                  Complaint.aggregate([
                        { $match: matchStage },
                        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                        { $sort: { _id: 1 } },
                  ]),
                  Complaint.aggregate([
                        { $match: complaintFilter },
                        { $group: { _id: '$category', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                  ]),
                  Complaint.aggregate([
                        { $match: complaintFilter },
                        { $group: { _id: '$status', count: { $sum: 1 } } },
                  ]),
                  Complaint.aggregate([
                        { $match: { ...complaintFilter, status: 'resolved', resolvedAt: { $exists: true } } },
                        { $project: { hours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] } } },
                        { $group: { _id: null, avgHours: { $avg: '$hours' } } },
                  ]),
                  scope.isSuper
                        ? Department.find({ isActive: true }).select('name stats color').sort({ 'stats.resolvedComplaints': -1 }).limit(8)
                        : Department.find({ slug: scope.departmentSlug }).select('name stats color'),
            ]);

            res.status(200).json({
                  success: true,
                  analytics: {
                        complaintsByDay,
                        complaintsByCategory,
                        complaintsByStatus,
                        avgResolutionHours: avgResolutionTime[0]?.avgHours?.toFixed(1) || 0,
                        topDepartments: topDepts,
                  },
            });
      } catch (error) { next(error); }
};
