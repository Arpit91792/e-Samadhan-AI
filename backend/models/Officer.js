import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const officerSchema = new mongoose.Schema({
  // ── Identity ────────────────────────────────────────────────────────────────
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  employeeId: { type: String, required: true, unique: true, trim: true },
  password: { type: String, select: false },

  // ── Department ──────────────────────────────────────────────────────────────
  department: {
    type: String,
    required: true,
    enum: ['police', 'electricity', 'water_supply', 'roads_transport', 'healthcare', 'municipal', 'sanitation', 'education'],
    lowercase: true,
  },

  // ── Admin reference ─────────────────────────────────────────────────────────
  createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Status ──────────────────────────────────────────────────────────────────
  banned: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'busy', 'offline', 'suspended'], default: 'offline' },
  isActive: { type: Boolean, default: true },
  // ── Block information (admin actions) ──────────────────────────────────────
  isBlocked: { type: Boolean, default: false },
  blockedAt: { type: Date, default: null },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  blockReason: { type: String, trim: true, default: '' },

  // ── Performance stats (auto-calculated) ─────────────────────────────────────
  complaintsSolved: { type: Number, default: 0 },
  complaintsPending: { type: Number, default: 0 },
  complaintsInProgress: { type: Number, default: 0 },
  complaintsAssigned: { type: Number, default: 0 },
  resolutionRate: { type: Number, default: 0 },   // percentage 0-100

  // ── Activity tracking ────────────────────────────────────────────────────────
  lastActive: { type: Date },
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },

  // ── Login history ─────────────────────────────────────────────────────────
  loginHistory: [
    {
      loginTime: { type: Date, default: Date.now },
      ipAddress: { type: String, default: '' },
      device: { type: String, default: '' },
      browser: { type: String, default: '' },
    },
  ],

  // ── Active JWT session ────────────────────────────────────────────────────
  activeSession: {
    token: { type: String, default: null },
    loginAt: { type: Date, default: null },
  },

  // ── Profile ──────────────────────────────────────────────────────────────────
  profileImage: { type: String, default: null },
  bio: { type: String, trim: true },

}, { timestamps: true });

// ── Hash password ─────────────────────────────────────────────────────────────
officerSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Compare password ──────────────────────────────────────────────────────────
officerSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// ── Generate JWT ──────────────────────────────────────────────────────────────
officerSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: 'officer',
      department: this.department,
      employeeId: this.employeeId,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// ── Recalculate resolution rate ───────────────────────────────────────────────
officerSchema.methods.recalcStats = async function () {
  const Complaint = mongoose.model('Complaint');
  const [assigned, resolved, pending, inProgress] = await Promise.all([
    Complaint.countDocuments({ assignedOfficer: this._id }),
    Complaint.countDocuments({ assignedOfficer: this._id, status: 'resolved' }),
    Complaint.countDocuments({ assignedOfficer: this._id, status: { $in: ['pending', 'assigned'] } }),
    Complaint.countDocuments({ assignedOfficer: this._id, status: 'in_progress' }),
  ]);
  this.complaintsAssigned = assigned;
  this.complaintsSolved = resolved;
  this.complaintsPending = pending;
  this.complaintsInProgress = inProgress;
  this.resolutionRate = assigned > 0 ? Math.round((resolved / assigned) * 100) : 0;
  await this.save({ validateBeforeSave: false });
};

const Officer = mongoose.model('Officer', officerSchema);
export default Officer;
