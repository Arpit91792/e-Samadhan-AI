import Department from '../models/Department.js';

const DEPT_SLUGS = [
      'electricity', 'water_supply', 'roads_transport', 'sanitation',
      'police', 'healthcare', 'municipal', 'education',
];

export { DEPT_SLUGS };

export function isSuperAdmin(user) {
      return user?.role === 'admin' && (!user.adminLevel || user.adminLevel === 'super_admin');
}

export async function getAdminScope(user) {
      if (!user || user.role !== 'admin') {
            return { isSuper: false, departmentSlug: null, departmentId: null, department: null };
      }

      if (isSuperAdmin(user)) {
            return { isSuper: true, departmentSlug: null, departmentId: null, department: null };
      }

      const departmentSlug = user.managedDepartment || '';
      const department = departmentSlug
            ? await Department.findOne({ slug: departmentSlug })
            : null;

      return {
            isSuper: false,
            departmentSlug,
            departmentId: department?._id || null,
            department,
      };
}

export async function buildComplaintFilter(scope) {
      if (!scope || scope.isSuper) return {};
      if (scope.departmentId) return { department: scope.departmentId };
      if (scope.departmentSlug) return { category: scope.departmentSlug };
      return { _id: null };
}

export function buildOfficerFilter(scope, extra = {}) {
      const base = { role: 'officer', ...extra };
      if (!scope || scope.isSuper) return base;
      if (scope.departmentSlug) return { ...base, department: scope.departmentSlug };
      return { ...base, _id: null };
}

export const attachAdminScope = async (req, res, next) => {
      try {
            req.adminScope = await getAdminScope(req.user);
            next();
      } catch (error) {
            next(error);
      }
};

export async function assertComplaintAccess(scope, complaint) {
      if (!complaint) return false;
      if (scope.isSuper) return true;
      if (scope.departmentId && complaint.department?.toString() === scope.departmentId.toString()) return true;
      if (scope.departmentSlug && complaint.category === scope.departmentSlug) return true;
      return false;
}
