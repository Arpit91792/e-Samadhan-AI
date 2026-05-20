import { isSuperAdmin } from '../utils/adminScope.js';

export const requireSuperAdmin = (req, res, next) => {
      if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      if (!isSuperAdmin(req.user)) {
            return res.status(403).json({
                  success: false,
                  message: 'Super Admin access required for this action',
            });
      }
      next();
};

export const requireDepartmentAccess = (departmentSlug) => (req, res, next) => {
      if (isSuperAdmin(req.user)) return next();
      if (req.user?.managedDepartment === departmentSlug) return next();
      return res.status(403).json({
            success: false,
            message: 'You can only access your own department',
      });
};
