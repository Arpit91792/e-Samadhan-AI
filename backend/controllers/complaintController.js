import Complaint from '../models/Complaint.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import { validateComplaint, validateStatusUpdate } from '../validators/complaintValidator.js';
import { analyzeComplaint, buildAiPriorityReason, generateComplaintId } from '../services/aiService.js';
import { checkDuplicateCluster, mergePriorityWithDuplicate } from '../services/duplicateDetection.js';
import {
      notifyComplaintFiled,
      notifyComplaintAssigned,
      notifyStatusUpdate,
} from '../services/notificationService.js';
import { emitNewComplaintToDept, emitComplaintUpdate } from '../socket/index.js';

// @desc  File a new complaint
// @route POST /api/complaints
// @access Private (citizen)
export const fileComplaint = async (req, res, next) => {
      try {
            const { title, description, category, location } = req.body;

            const { isValid, errors } = validateComplaint({ title, description, category });
            if (!isValid) return res.status(400).json({ success: false, message: 'Validation failed', errors });

            // AI analysis — citizen cannot override priority
            const ai = analyzeComplaint(title, description);
            const finalCategory = category || ai.suggestedCategory;

            let parsedLocation = {};
            if (location) {
                  try { parsedLocation = typeof location === 'string' ? JSON.parse(location) : location; }
                  catch { /* ignore */ }
            }

            const duplicateResult = await checkDuplicateCluster({
                  category: finalCategory,
                  coordinates: parsedLocation?.coordinates,
            });
            const finalPriority = mergePriorityWithDuplicate(
                  ai.suggestedPriority,
                  duplicateResult,
                  ai.isEmergency
            );
            const aiPriorityReason = buildAiPriorityReason(ai, duplicateResult);

            // Find matching department
            const dept = await Department.findOne({ slug: finalCategory, isActive: true });

            const complaintId = await generateComplaintId(Complaint);
            const attachments = req.files?.map(f => ({
                  url: `/uploads/complaints/${f.filename}`,
                  filename: f.originalname,
                  mimetype: f.mimetype,
            })) || [];

            const complaint = await Complaint.create({
                  complaintId,
                  title: title.trim(),
                  description: description.trim(),
                  category: finalCategory,
                  priority: finalPriority,
                  isEmergency: ai.isEmergency || duplicateResult.boostPriority,
                  aiPriorityReason,
                  duplicateClusterCount: duplicateResult.duplicateCount,
                  citizen: req.user._id,
                  department: dept?._id || null,
                  location: parsedLocation,
                  attachments,
                  timeline: [{
                        status: 'pending',
                        note: 'Complaint filed by citizen',
                        updatedBy: req.user._id,
                  }],
            });

            // Update dept stats
            if (dept) {
                  await Department.findByIdAndUpdate(dept._id, { $inc: { 'stats.totalComplaints': 1, 'stats.pendingComplaints': 1 } });
            }

            // Notify citizen
            await notifyComplaintFiled(req.user._id, complaint._id, title);

            // Notify all officers in the department via socket
            emitNewComplaintToDept(finalCategory, complaint);

            res.status(201).json({
                  success: true,
                  message: `Complaint filed successfully! ID: ${complaintId}`,
                  complaint: {
                        _id: complaint._id,
                        complaintId: complaint.complaintId,
                        title: complaint.title,
                        status: complaint.status,
                        priority: complaint.priority,
                        category: complaint.category,
                        isEmergency: complaint.isEmergency,
                        aiPriorityReason: complaint.aiPriorityReason,
                        duplicateClusterCount: complaint.duplicateClusterCount,
                        aiAnalysis: { ...ai, finalPriority, duplicateResult },
                        createdAt: complaint.createdAt,
                  },
            });
      } catch (error) { next(error); }
};

// @desc  Get all complaints (with filters)
// @route GET /api/complaints
// @access Private
export const getComplaints = async (req, res, next) => {
      try {
            const { status, category, priority, page = 1, limit = 10, search } = req.query;
            const query = {};

            // Role-based filtering
            if (req.user.role === 'citizen') {
                  query.citizen = req.user._id;
            } else if (req.user.role === 'officer') {
                  const dept = await Department.findOne({ slug: req.user.department });
                  if (dept) query.department = dept._id;
            } else if (req.user.role === 'admin') {
                  const { getAdminScope, buildComplaintFilter } = await import('../utils/adminScope.js');
                  const scope = await getAdminScope(req.user);
                  Object.assign(query, await buildComplaintFilter(scope));
            }

            if (status) query.status = status;
            if (category) query.category = category;
            if (priority) query.priority = priority;
            if (search) query.$or = [
                  { title: { $regex: search, $options: 'i' } },
                  { description: { $regex: search, $options: 'i' } },
                  { complaintId: { $regex: search, $options: 'i' } },
            ];

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const total = await Complaint.countDocuments(query);

            const complaints = await Complaint.find(query)
                  .populate('citizen', 'name email phone profileImage')
                  .populate('assignedOfficer', 'name email department')
                  .populate('department', 'name slug color icon')
                  .sort({ createdAt: -1 })
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

// @desc  Get single complaint
// @route GET /api/complaints/:id
// @access Private
export const getComplaint = async (req, res, next) => {
      try {
            const complaint = await Complaint.findById(req.params.id)
                  .populate('citizen', 'name email phone address profileImage')
                  .populate('assignedOfficer', 'name email department phone')
                  .populate('department', 'name slug color icon contactEmail')
                  .populate('timeline.updatedBy', 'name role');

            if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

            // Citizens can only view their own
            if (req.user.role === 'citizen' && complaint.citizen._id.toString() !== req.user._id.toString()) {
                  return res.status(403).json({ success: false, message: 'Access denied' });
            }

            res.status(200).json({ success: true, complaint });
      } catch (error) { next(error); }
};

// @desc  Update complaint status (officer/admin)
// @route PUT /api/complaints/:id/status
// @access Private (officer, admin)
export const updateStatus = async (req, res, next) => {
      try {
            const { status, note } = req.body;
            const { isValid, errors } = validateStatusUpdate({ status });
            if (!isValid) return res.status(400).json({ success: false, errors });

            const complaint = await Complaint.findById(req.params.id).populate('citizen', 'name');
            if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

            const prevStatus = complaint.status;
            complaint.status = status;
            if (status === 'resolved') complaint.resolvedAt = new Date();

            complaint.timeline.push({
                  status,
                  note: note || `Status updated to ${status}`,
                  updatedBy: req.user._id,
            });

            await complaint.save();

            // Update dept stats
            if (complaint.department) {
                  const updates = {};
                  if (status === 'resolved' && prevStatus !== 'resolved') {
                        updates['stats.resolvedComplaints'] = 1;
                        updates['stats.pendingComplaints'] = -1;
                  }
                  if (Object.keys(updates).length) {
                        await Department.findByIdAndUpdate(complaint.department, { $inc: updates });
                  }
            }

            // Notify citizen
            await notifyStatusUpdate(complaint.citizen._id, complaint._id, complaint.title, status, complaint);

            res.status(200).json({ success: true, message: `Status updated to "${status}"`, complaint });
      } catch (error) { next(error); }
};

// @desc  Assign complaint to officer
// @route PUT /api/complaints/:id/assign
// @access Private (admin)
export const assignComplaint = async (req, res, next) => {
      try {
            const { officerId } = req.body;
            if (!officerId) return res.status(400).json({ success: false, message: 'Officer ID is required' });

            const officer = await User.findOne({ _id: officerId, role: 'officer', isActive: true });
            if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });

            const complaint = await Complaint.findByIdAndUpdate(
                  req.params.id,
                  {
                        assignedOfficer: officerId,
                        status: 'assigned',
                        $push: {
                              timeline: {
                                    status: 'assigned',
                                    note: `Assigned to officer ${officer.name}`,
                                    updatedBy: req.user._id,
                              },
                        },
                  },
                  { new: true }
            );

            if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

            await notifyComplaintAssigned(officerId, complaint._id, complaint.title);

            res.status(200).json({ success: true, message: 'Complaint assigned successfully', complaint });
      } catch (error) { next(error); }
};

// @desc  Upvote a complaint
// @route POST /api/complaints/:id/upvote
// @access Private (citizen)
export const upvoteComplaint = async (req, res, next) => {
      try {
            const complaint = await Complaint.findById(req.params.id);
            if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

            const alreadyVoted = complaint.upvotes.includes(req.user._id);
            if (alreadyVoted) {
                  complaint.upvotes.pull(req.user._id);
                  complaint.upvoteCount = Math.max(0, complaint.upvoteCount - 1);
            } else {
                  complaint.upvotes.push(req.user._id);
                  complaint.upvoteCount += 1;
            }
            await complaint.save();

            res.status(200).json({
                  success: true,
                  message: alreadyVoted ? 'Upvote removed' : 'Complaint upvoted',
                  upvoteCount: complaint.upvoteCount,
                  upvoted: !alreadyVoted,
            });
      } catch (error) { next(error); }
};

// @desc  Submit feedback after resolution
// @route POST /api/complaints/:id/feedback
// @access Private (citizen)
export const submitFeedback = async (req, res, next) => {
      try {
            const { rating, comment } = req.body;
            if (!rating || rating < 1 || rating > 5) {
                  return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
            }

            const complaint = await Complaint.findOne({ _id: req.params.id, citizen: req.user._id });
            if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
            if (complaint.status !== 'resolved') {
                  return res.status(400).json({ success: false, message: 'Feedback can only be submitted for resolved complaints' });
            }

            complaint.feedback = { rating, comment: comment?.trim(), givenAt: new Date() };
            await complaint.save();

            res.status(200).json({ success: true, message: 'Feedback submitted. Thank you!', feedback: complaint.feedback });
      } catch (error) { next(error); }
};

// @desc  Citizen dashboard stats
// @route GET /api/complaints/citizen/stats
// @access Private (citizen)
export const getCitizenStats = async (req, res, next) => {
      try {
            const citizenId = req.user._id;
            const base = { citizen: citizenId };

            const [total, pending, inProgress, resolved, emergency, recent] = await Promise.all([
                  Complaint.countDocuments(base),
                  Complaint.countDocuments({ ...base, status: 'pending' }),
                  Complaint.countDocuments({ ...base, status: { $in: ['assigned', 'in_progress'] } }),
                  Complaint.countDocuments({ ...base, status: { $in: ['resolved', 'closed'] } }),
                  Complaint.countDocuments({ ...base, isEmergency: true }),
                  Complaint.find(base)
                        .sort({ createdAt: -1 })
                        .limit(5)
                        .populate('department', 'name slug')
                        .select('complaintId title status priority category createdAt isEmergency'),
            ]);

            const stats = { total, pending, inProgress, resolved, emergency };

            res.status(200).json({
                  success: true,
                  total,
                  pending,
                  resolved,
                  inProgress,
                  emergency,
                  stats,
                  recent,
            });
      } catch (error) { next(error); }
};

// @desc  AI analyze complaint text (preview before submit)
// @route POST /api/complaints/analyze
// @access Private
export const analyzeComplaintText = async (req, res, next) => {
      try {
            const { title = '', description = '' } = req.body;
            const analysis = analyzeComplaint(title, description);
            res.status(200).json({ success: true, analysis });
      } catch (error) { next(error); }
};

// @desc  Get complaint analytics
// @route GET /api/complaints/analytics
// @access Private (officer, admin)
export const getAnalytics = async (req, res, next) => {
      try {
            const [statusStats, categoryStats, priorityStats, recentComplaints] = await Promise.all([
                  Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
                  Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
                  Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
                  Complaint.find().sort({ createdAt: -1 }).limit(5)
                        .populate('citizen', 'name').populate('department', 'name'),
            ]);

            const total = await Complaint.countDocuments();
            const resolved = await Complaint.countDocuments({ status: 'resolved' });
            const emergency = await Complaint.countDocuments({ isEmergency: true });

            res.status(200).json({
                  success: true,
                  analytics: {
                        total,
                        resolved,
                        pending: total - resolved,
                        emergency,
                        resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0,
                        byStatus: statusStats,
                        byCategory: categoryStats,
                        byPriority: priorityStats,
                        recentComplaints,
                  },
            });
      } catch (error) { next(error); }
};
