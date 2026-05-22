import { getDepartmentLabel } from '../utils/departmentResolve.js';

export const requireDepartmentAccess = (departmentSlug) => (req, res, next) => {
      if (req.admin?.department !== departmentSlug) {
            return res.status(403).json({
                  success: false,
                  message: 'You can only access your own department',
            });
      }
      next();
};
