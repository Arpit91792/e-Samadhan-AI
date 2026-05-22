import jwt from 'jsonwebtoken';
import {
      findAdminByAuthClaims,
      resolveDepartmentForAdmin,
      toReqAdmin,
      isAdminJwt,
} from '../utils/adminAuth.js';

export const protectAdmin = async (req, res, next) => {
      let token;

      if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
      } else if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.slice(6).trim();
      } else if (req.cookies?.token) {
            token = req.cookies.token;
      }

      if (!token) {
            console.warn('[protectAdmin] No token found in request');
            return res.status(401).json({
                  success: false,
                  message: 'Not authorized. Please log in.',
                  code: 'NO_TOKEN',
            });
      }

      try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (process.env.NODE_ENV !== 'production') {
                  console.log('TOKEN:', token ? `${token.slice(0, 24)}...` : 'missing');
            }
            console.log('DECODED:', {
                  id: decoded.id,
                  email: decoded.email,
                  role: decoded.role,
                  department: decoded.department,
                  managedDepartment: decoded.managedDepartment,
                  adminLevel: decoded.adminLevel,
            });

            if (!isAdminJwt(decoded)) {
                  console.warn('[protectAdmin] Invalid admin JWT:', decoded);
                  return res.status(403).json({
                        success: false,
                        message: 'Access denied. Admin role required.',
                        code: 'INVALID_ROLE',
                  });
            }

            const found = await findAdminByAuthClaims(decoded);
            const department = resolveDepartmentForAdmin(found?.doc, decoded, req);

            console.log('ADMIN_LOOKUP:', {
                  found: found ? 'yes' : 'no',
                  source: found?.source,
                  doc: found?.doc ? { _id: found.doc._id, email: found.doc.email } : null,
                  department: found?.doc?.department || found?.doc?.managedDepartment,
            });

            if (!department) {
                  console.warn('[protectAdmin] Department missing for admin:', decoded.email);
                  return res.status(403).json({
                        success: false,
                        message: 'Department missing. Log out and sign in again with your department.',
                        code: 'ADMIN_DEPARTMENT_MISSING',
                  });
            }

            req.admin = toReqAdmin(found?.doc, decoded, department);

            if (!req.admin.id) {
                  console.error('[protectAdmin] Admin ID missing after toReqAdmin:', req.admin);
                  return res.status(401).json({
                        success: false,
                        message: 'Invalid admin session. Please log in again.',
                        code: 'INVALID_ADMIN_ID',
                  });
            }

            // Stale JWT id but valid email — use current DB id so MongoDB refs work
            if (found?.doc?._id && String(found.doc._id) !== String(decoded.id || '')) {
                  console.log('[protectAdmin] Synced admin id from DB:', found.doc._id.toString());
                  req.admin.id = found.doc._id.toString();
                  req.admin._id = req.admin.id;
            }

            console.log('[protectAdmin] Admin authenticated:', {
                  id: req.admin.id,
                  email: req.admin.email,
                  department: req.admin.department,
                  source: found?.source || 'token',
            });

            return next();
      } catch (error) {
            console.error('[protectAdmin] JWT verification error:', {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
            });
            const msg = error.name === 'TokenExpiredError'
                  ? 'Session expired. Please log in again.'
                  : 'Invalid token. Please log in again.';
            return res.status(401).json({ success: false, message: msg, code: 'INVALID_TOKEN' });
      }
};
