import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Officer from '../models/Officer.js';
import { resolveDepartmentSlug } from '../utils/departmentResolve.js';

function attachReqUser(req, payload) {
      req.user = payload;
}

// ── Protect: verify JWT (User, Admin, or Officer) ─────────────────────────────
export const protect = async (req, res, next) => {
      let token;

      if (req.cookies?.token) {
            token = req.cookies.token;
      } else if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
      }

      try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.role === 'officer') {
                  const officer = await Officer.findById(decoded.id).select('-password');
                  if (!officer) {
                        return res.status(401).json({ success: false, message: 'Officer account no longer exists.' });
                  }
                  if (officer.banned) {
                        return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
                  }
                  attachReqUser(req, {
                        _id: officer._id,
                        id: officer._id,
                        name: officer.name,
                        email: officer.email,
                        phone: officer.mobile,
                        mobile: officer.mobile,
                        role: 'officer',
                        department: officer.department,
                        employeeId: officer.employeeId,
                        isActive: true,
                  });
                  return next();
            }

            if (decoded.role === 'admin') {
                  const admin = await Admin.findById(decoded.id).select('name email mobile department');
                  if (admin) {
                        const dept = resolveDepartmentSlug(admin.department) || admin.department;
                        attachReqUser(req, {
                              _id: admin._id,
                              id: admin._id,
                              name: admin.name,
                              email: admin.email,
                              phone: admin.mobile,
                              mobile: admin.mobile,
                              role: 'admin',
                              department: dept,
                              managedDepartment: dept,
                              adminLevel: 'department_admin',
                              isActive: true,
                        });
                        return next();
                  }

                  const userAdmin = await User.findById(decoded.id).select('-password -aadhaarNumber -govtIdNumber');
                  if (userAdmin?.role === 'admin' && userAdmin.isActive !== false) {
                        const dept = resolveDepartmentSlug(userAdmin.managedDepartment) || userAdmin.managedDepartment;
                        attachReqUser(req, {
                              ...userAdmin.toObject(),
                              id: userAdmin._id,
                              managedDepartment: dept || userAdmin.managedDepartment,
                        });
                        return next();
                  }

                  return res.status(401).json({ success: false, message: 'Admin account no longer exists.' });
            }

            const user = await User.findById(decoded.id).select('-password -aadhaarNumber -govtIdNumber');
            if (!user) {
                  return res.status(401).json({ success: false, message: 'User account no longer exists.' });
            }
            if (!user.isActive) {
                  return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
            }

            attachReqUser(req, { ...user.toObject(), id: user._id });
            next();
      } catch (err) {
            return res.status(401).json({
                  success: false,
                  message: err.name === 'TokenExpiredError'
                        ? 'Session expired. Please log in again.'
                        : 'Invalid token. Please log in again.',
            });
      }
};

// ── Authorize: role-based access ──────────────────────────────────────────────
export const authorize = (...roles) => (req, res, next) => {
      if (!roles.includes(req.user?.role)) {
            return res.status(403).json({
                  success: false,
                  message: `Access denied. This resource requires: ${roles.join(' or ')} role.`,
            });
      }
      next();
};

// ── Optional auth: attach user if token present, don't fail if not ────────────
export const optionalAuth = async (req, res, next) => {
      let token = req.cookies?.token
            || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

      if (!token) return next();

      try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role === 'officer') {
                  req.user = await Officer.findById(decoded.id).select('-password');
                  if (req.user) req.user = { ...req.user.toObject(), role: 'officer', id: req.user._id };
            } else {
                  req.user = await User.findById(decoded.id).select('-password');
                  if (req.user) req.user = { ...req.user.toObject(), id: req.user._id };
            }
      } catch {
            // ignore
      }
      next();
};
