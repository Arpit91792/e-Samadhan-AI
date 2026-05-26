import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ── User collection ───────────────────────────────────────────────────────────
// Stored in: esamadhan.users
const userSchema = new mongoose.Schema(
      {
            name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
            email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
            password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
            role: { type: String, enum: ['citizen', 'officer', 'admin'], default: 'citizen' },
            phone: { type: String, trim: true },

            // ── Citizen fields ──────────────────────────────────────────────────────
            nearbyLocation: { type: String, trim: true },
            completeAddress: { type: String, trim: true },
            address: { type: String, trim: true },        // legacy fallback
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            pincode: { type: String, trim: true },
            latitude: { type: String, trim: true },
            longitude: { type: String, trim: true },
            dob: { type: String, trim: true },
            gender: { type: String, trim: true },
            govtIdType: { type: String, enum: ['aadhaar', 'pan', 'voter_id', 'driving_license', 'passport', ''], default: '' },
            govtIdNumber: { type: String, trim: true, select: false },
            govtIdImage: { type: String, default: null },

            // ── Officer fields ──────────────────────────────────────────────────────
            department: {
                  type: String,
                  enum: ['electricity', 'water_supply', 'roads_transport', 'sanitation', 'police', 'healthcare', 'municipal', 'education', 'general', ''],
                  default: '',
            },
            employeeId: { type: String, trim: true },
            governmentId: { type: String, trim: true },

            // ── Admin fields ────────────────────────────────────────────────────────
            adminSecretVerified: { type: Boolean, default: false },
            adminLevel: {
                  type: String,
                  enum: ['super_admin', 'department_admin'],
                  default: 'super_admin',
            },
            managedDepartment: {
                  type: String,
                  enum: ['electricity', 'water_supply', 'roads_transport', 'sanitation', 'police', 'healthcare', 'municipal', 'education', ''],
                  default: '',
            },

            // ── Officer workflow ────────────────────────────────────────────────────
            officerStatus: {
                  type: String,
                  enum: ['pending', 'approved', 'rejected'],
                  default: 'approved',
            },
            assignedArea: { type: String, trim: true, default: '' },
            performanceStats: {
                  complaintsResolved: { type: Number, default: 0 },
                  complaintsAssigned: { type: Number, default: 0 },
                  avgRating: { type: Number, default: 0 },
            },

            // ── Shared ──────────────────────────────────────────────────────────────
            profileImage: { type: String, default: null },
            liveImage: { type: String, default: null },   // webcam selfie
            otpVerified: { type: Boolean, default: false },
            isEmailVerified: { type: Boolean, default: false },
            isActive: { type: Boolean, default: true },

            resetPasswordToken: String,
            resetPasswordExpire: Date,
            emailVerificationToken: String,
            emailVerificationExpire: Date,
            lastLogin: Date,
      },
      { timestamps: true }
);

// Hash password
userSchema.pre('save', async function (next) {
      if (!this.isModified('password')) return next();
      this.password = await bcrypt.hash(this.password, 12);
      next();
});

userSchema.methods.matchPassword = async function (entered) {
      return bcrypt.compare(entered, this.password);
};

userSchema.methods.getSignedJwtToken = function () {
      const payload = {
            id: this._id.toString(),
            role: this.role,
            email: this.email,
            name: this.name,
            adminLevel: this.adminLevel,
            managedDepartment: this.managedDepartment,
      };
      if (this.role === 'admin' && this.managedDepartment) {
            payload.department = this.managedDepartment;
      }
      return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

userSchema.methods.getResetPasswordToken = function () {
      const token = crypto.randomBytes(32).toString('hex');
      this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
      this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
      return token;
};

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

const User = mongoose.model('User', userSchema);
export default User;
