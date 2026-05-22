import User from '../models/User.js';
import { isSuperAdmin } from '../utils/adminScope.js';
import { resolveDepartmentSlug, getDepartmentLabel } from '../utils/departmentResolve.js';

// @desc  Department-based admin login (email + password + department required)
// @route POST /api/admin/login
// @access Public
export const adminLogin = async (req, res, next) => {
      try {
            const { email, password, department } = req.body;

            if (!email?.trim()) {
                  return res.status(400).json({
                        success: false,
                        message: 'Invalid email',
                        code: 'INVALID_EMAIL',
                  });
            }

            if (!password) {
                  return res.status(400).json({
                        success: false,
                        message: 'Invalid password',
                        code: 'INVALID_PASSWORD',
                  });
            }

            if (!department?.trim()) {
                  return res.status(400).json({
                        success: false,
                        message: 'Please select your department',
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

            const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

            if (!user || user.role !== 'admin') {
                  return res.status(401).json({
                        success: false,
                        message: 'Invalid email',
                        code: 'INVALID_EMAIL',
                  });
            }

            if (!user.isActive) {
                  return res.status(403).json({
                        success: false,
                        message: 'Unauthorized access. Account deactivated.',
                        code: 'UNAUTHORIZED',
                  });
            }

            const passwordOk = await user.matchPassword(password);
            if (!passwordOk) {
                  return res.status(401).json({
                        success: false,
                        message: 'Invalid password',
                        code: 'INVALID_PASSWORD',
                  });
            }

            const superAdmin = isSuperAdmin(user);
            const storedDept = user.managedDepartment || '';

            if (!superAdmin || storedDept) {
                  if (storedDept !== departmentSlug) {
                        return res.status(403).json({
                              success: false,
                              message: 'Department does not match your account',
                              code: 'DEPARTMENT_MISMATCH',
                        });
                  }
            }

            user.lastLogin = new Date();
            await user.save({ validateBeforeSave: false });

            const token = user.getSignedJwtToken();
            const deptName = getDepartmentLabel(departmentSlug);
            const effectiveDept = storedDept || departmentSlug;

            const cookieOptions = {
                  expires: new Date(
                        Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
                  ),
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            };

            const adminPayload = {
                  id: user._id.toString(),
                  _id: user._id.toString(),
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  adminLevel: user.adminLevel,
                  managedDepartment: effectiveDept,
                  department: effectiveDept,
            };

            res.status(200)
                  .cookie('token', token, cookieOptions)
                  .json({
                        success: true,
                        message: `Welcome to ${deptName} Admin Portal`,
                        token,
                        department: departmentSlug,
                        departmentName: deptName,
                        user: adminPayload,
                        admin: adminPayload,
                  });
      } catch (error) {
            next(error);
      }
};

const REGISTER_SECRET = process.env.ADMIN_REGISTER_SECRET || '';

// @desc  Register department admin (department required, stored on account)
// @route POST /api/admin/register
// @access Public (optional ADMIN_REGISTER_SECRET in .env)
export const adminRegister = async (req, res, next) => {
      try {
            const { name, email, mobile, password, department, registerSecret } = req.body;

            if (REGISTER_SECRET && registerSecret !== REGISTER_SECRET) {
                  return res.status(403).json({
                        success: false,
                        message: 'Invalid registration credentials',
                        code: 'INVALID_REGISTER_SECRET',
                  });
            }

            if (!name?.trim()) {
                  return res.status(400).json({ success: false, message: 'Full name is required', code: 'INVALID_NAME' });
            }

            if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
                  return res.status(400).json({ success: false, message: 'Valid email is required', code: 'INVALID_EMAIL' });
            }

            if (!mobile?.trim()) {
                  return res.status(400).json({ success: false, message: 'Mobile number is required', code: 'INVALID_MOBILE' });
            }

            if (!password || password.length < 8) {
                  return res.status(400).json({
                        success: false,
                        message: 'Password must be at least 8 characters',
                        code: 'INVALID_PASSWORD',
                  });
            }

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

            const exists = await User.findOne({ email: email.toLowerCase().trim() });
            if (exists) {
                  return res.status(400).json({
                        success: false,
                        message: 'An account with this email already exists',
                        code: 'DUPLICATE_EMAIL',
                  });
            }

            const user = await User.create({
                  name: name.trim(),
                  email: email.toLowerCase().trim(),
                  phone: String(mobile).replace(/\D/g, '').slice(-10),
                  password,
                  role: 'admin',
                  adminLevel: 'department_admin',
                  managedDepartment: departmentSlug,
                  adminSecretVerified: true,
                  isEmailVerified: true,
                  isActive: true,
            });

            const token = user.getSignedJwtToken();
            const deptName = getDepartmentLabel(departmentSlug);

            const cookieOptions = {
                  expires: new Date(
                        Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
                  ),
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            };

            const adminPayload = {
                  id: user._id.toString(),
                  _id: user._id.toString(),
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  adminLevel: user.adminLevel,
                  managedDepartment: departmentSlug,
                  department: departmentSlug,
            };

            res.status(201)
                  .cookie('token', token, cookieOptions)
                  .json({
                        success: true,
                        message: `Welcome to ${deptName} Admin Portal`,
                        token,
                        department: departmentSlug,
                        departmentName: deptName,
                        user: adminPayload,
                        admin: adminPayload,
                  });
      } catch (error) {
            if (error.code === 11000) {
                  return res.status(400).json({
                        success: false,
                        message: 'An account with this email already exists',
                        code: 'DUPLICATE_EMAIL',
                  });
            }
            next(error);
      }
};
