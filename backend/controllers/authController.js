import crypto from 'crypto';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import LivenessSession from '../models/LivenessSession.js';
import sendToken from '../utils/sendToken.js';
import sendEmail, { forgotPasswordEmail } from '../utils/sendEmail.js';
import { resolveDepartmentSlug } from '../utils/departmentResolve.js';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'ESAMADHAN_ADMIN_2025';

// @desc  Register
// @route POST /api/auth/register
export const register = async (req, res, next) => {
      try {
            const {
                  name, email, password, role, phone,
                  // citizen
                  address, city, state, govtIdType, govtIdNumber,
                  // officer
                  department, employeeId, governmentId,
                  // admin
                  adminSecretKey,
                  // otp
                  otpVerified,
            } = req.body;

            // Check duplicate
            const exists = await User.findOne({ email: email?.toLowerCase() });
            if (exists) {
                  return res.status(400).json({ success: false, message: 'An account with this email already exists' });
            }

            // Validate role
            const validRoles = ['citizen', 'officer', 'admin'];
            const userRole = validRoles.includes(role) ? role : 'citizen';

            if (userRole === 'officer') {
                  return res.status(400).json({
                        success: false,
                        message: 'Officer registration must be completed through /api/officer/register after your department admin creates your account.',
                        code: 'OFFICER_REGISTRATION_BLOCKED',
                  });
            }

            // Admin secret + department (required for department-based access)
            if (userRole === 'admin') {
                  if (!department?.trim()) {
                        return res.status(400).json({
                              success: false,
                              message: 'Please select department',
                              code: 'DEPARTMENT_REQUIRED',
                        });
                  }
                  const departmentSlug = resolveDepartmentSlug(department);
                  if (!departmentSlug) {
                        return res.status(400).json({
                              success: false,
                              message: 'Invalid department selected',
                              code: 'INVALID_DEPARTMENT',
                        });
                  }
                  if (adminSecretKey !== ADMIN_SECRET) {
                        return res.status(403).json({
                              success: false,
                              message: 'Invalid Admin Secret Key',
                              code: 'INVALID_SECRET',
                        });
                  }
                  req._adminDepartmentSlug = departmentSlug;
            }

            // ✅ MANDATORY: Citizens must pass AI liveness verification
            if (userRole === 'citizen') {
                  const { livenessSessionId } = req.body;
                  if (!livenessSessionId) {
                        return res.status(400).json({
                              success: false,
                              message: 'AI liveness verification is mandatory. Complete live face checks before registration.',
                        });
                  }
                  const liveness = await LivenessSession.findOne({
                        sessionId: livenessSessionId,
                        verificationStatus: 'verified',
                        livenessVerified: true,
                  });
                  if (!liveness) {
                        return res.status(400).json({
                              success: false,
                              message: 'Invalid or incomplete liveness verification. Please complete live verification again.',
                        });
                  }
                  if (liveness.email && liveness.email !== email?.toLowerCase()) {
                        return res.status(403).json({
                              success: false,
                              message: 'Liveness session does not match registration email.',
                        });
                  }
                  if (!req.files?.liveImage?.[0]) {
                        return res.status(400).json({
                              success: false,
                              message: 'Live capture image is required after liveness verification.',
                        });
                  }
            }

            // Build user data
            const userData = { name, email, password, role: userRole, phone };

            if (userRole === 'citizen') {
                  const { pincode, latitude, longitude, nearbyLocation, completeAddress, dob, gender } = req.body;
                  Object.assign(userData, {
                        nearbyLocation,
                        completeAddress,
                        address: completeAddress || req.body.address, // legacy fallback
                        city, state, pincode, latitude, longitude,
                        dob, gender,
                        govtIdType, govtIdNumber,
                  });
            }
            if (userRole === 'officer') {
                  Object.assign(userData, {
                        department,
                        employeeId,
                        governmentId,
                        officerStatus: 'pending',
                        isActive: false,
                  });
            }
            if (userRole === 'admin') {
                  userData.adminSecretVerified = true;
                  userData.adminLevel = 'department_admin';
                  userData.managedDepartment = req._adminDepartmentSlug || resolveDepartmentSlug(department) || '';
            }

            // File uploads
            if (req.files) {
                  if (req.files.profileImage?.[0]) {
                        userData.profileImage = `/uploads/profiles/${req.files.profileImage[0].filename}`;
                  }
                  if (req.files.govtIdImage?.[0]) {
                        userData.govtIdImage = `/uploads/profiles/${req.files.govtIdImage[0].filename}`;
                  }
                  if (req.files.liveImage?.[0]) {
                        userData.liveImage = `/uploads/profiles/${req.files.liveImage[0].filename}`;
                  }
            }

            // Mark OTP verified if confirmed
            if (otpVerified === 'true' || otpVerified === true) {
                  userData.otpVerified = true;
                  userData.isEmailVerified = true;
            }

            const user = await User.create(userData);
            sendToken(user, 201, res, `Welcome to e-Samadhan AI, ${user.name}!`);
      } catch (error) {
            next(error);
      }
};

// @desc  Login
// @route POST /api/auth/login
export const login = async (req, res, next) => {
      try {
            const { email, password } = req.body;
            if (!email || !password) {
                  return res.status(400).json({ success: false, message: 'Please provide email and password' });
            }

            const user = await User.findOne({ email }).select('+password');
            if (!user || !(await user.matchPassword(password))) {
                  return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
            if (!user.isActive) {
                  return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
            }

            user.lastLogin = new Date();
            await user.save({ validateBeforeSave: false });
            sendToken(user, 200, res, `Welcome back, ${user.name}!`);
      } catch (error) {
            next(error);
      }
};

// @desc  Logout
// @route POST /api/auth/logout
export const logout = async (req, res, next) => {
      try {
            res.cookie('token', 'none', { expires: new Date(Date.now() + 5000), httpOnly: true });
            res.status(200).json({ success: true, message: 'Logged out successfully' });
      } catch (error) { next(error); }
};

// @desc  Get me (citizen, officer, admin, or legacy user admin)
// @route GET /api/auth/me
export const getMe = async (req, res, next) => {
      try {
            const u = req.user;
            if (!u) {
                  return res.status(401).json({ success: false, message: 'Not authorized' });
            }
            const user = {
                  _id: u._id,
                  id: u._id || u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  phone: u.phone || u.mobile,
                  department: u.department,
                  managedDepartment: u.managedDepartment || u.department,
                  employeeId: u.employeeId,
                  adminLevel: u.adminLevel,
                  officerStatus: u.officerStatus,
                  profileImage: u.profileImage,
                  isEmailVerified: u.isEmailVerified,
                  createdAt: u.createdAt,
            };
            res.status(200).json({ success: true, user });
      } catch (error) { next(error); }
};

// @desc  Forgot password
// @route POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
      try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

            const user = await User.findOne({ email });
            if (!user) {
                  return res.status(200).json({ success: true, message: 'If that email exists, a reset link was sent.' });
            }

            const resetToken = user.getResetPasswordToken();
            await user.save({ validateBeforeSave: false });

            const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
            try {
                  await sendEmail({ to: user.email, subject: 'e-Samadhan AI — Password Reset', html: forgotPasswordEmail(user.name, resetUrl) });
                  res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
            } catch {
                  user.resetPasswordToken = undefined;
                  user.resetPasswordExpire = undefined;
                  await user.save({ validateBeforeSave: false });
                  res.status(500).json({ success: false, message: 'Email could not be sent.' });
            }
      } catch (error) { next(error); }
};

// @desc  Reset password
// @route POST /api/auth/reset-password/:token
export const resetPassword = async (req, res, next) => {
      try {
            const { password } = req.body;
            const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
            const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpire: { $gt: Date.now() } });
            if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token.' });

            user.password = password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            sendToken(user, 200, res, 'Password reset successful!');
      } catch (error) { next(error); }
};

// @desc  Update password
// @route PUT /api/auth/update-password
export const updatePassword = async (req, res, next) => {
      try {
            const { currentPassword, newPassword } = req.body;
            const user = await User.findById(req.user.id).select('+password');
            if (!(await user.matchPassword(currentPassword))) {
                  return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }
            user.password = newPassword;
            await user.save();
            sendToken(user, 200, res, 'Password updated successfully');
      } catch (error) { next(error); }
};
