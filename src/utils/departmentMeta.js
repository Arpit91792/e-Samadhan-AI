import { DEPARTMENTS } from './complaintConstants';

export const deptLabel = (slug) =>
      DEPARTMENTS.find((d) => d.value === slug)?.label || slug?.replace(/_/g, ' ') || 'Department';

export const deptTheme = (slug) => {
      const themes = {
            police: { gradient: 'from-blue-700 to-indigo-800', accent: 'text-blue-300' },
            electricity: { gradient: 'from-amber-500 to-orange-600', accent: 'text-amber-300' },
            water_supply: { gradient: 'from-cyan-500 to-blue-600', accent: 'text-cyan-300' },
            roads_transport: { gradient: 'from-slate-600 to-gray-800', accent: 'text-slate-300' },
            healthcare: { gradient: 'from-rose-500 to-red-600', accent: 'text-rose-300' },
            municipal: { gradient: 'from-violet-600 to-purple-700', accent: 'text-violet-300' },
            sanitation: { gradient: 'from-emerald-500 to-green-600', accent: 'text-emerald-300' },
            education: { gradient: 'from-orange-500 to-amber-600', accent: 'text-orange-300' },
      };
      return themes[slug] || { gradient: 'from-blue-600 to-violet-700', accent: 'text-blue-300' };
};

export const isSuperAdmin = () => false; // No super admin in this system

/** Department login dropdown — spec order, no "other" */
export const ADMIN_LOGIN_DEPARTMENTS = [
      { value: 'police', label: 'Police' },
      { value: 'electricity', label: 'Electricity' },
      { value: 'water_supply', label: 'Water Supply' },
      { value: 'healthcare', label: 'Healthcare' },
      { value: 'roads_transport', label: 'Roads & Transport' },
      { value: 'municipal', label: 'Municipal Services' },
      { value: 'sanitation', label: 'Sanitation' },
      { value: 'education', label: 'Education' },
];

const ADMIN_DEPT_SLUGS = new Set(ADMIN_LOGIN_DEPARTMENTS.map((d) => d.value));

/** Department dashboard URL, e.g. /admin/police/dashboard */
export const getAdminDashboardPath = (departmentSlug) => {
      if (!departmentSlug || !ADMIN_DEPT_SLUGS.has(departmentSlug)) {
            return '/admin/dashboard';
      }
      return `/admin/${departmentSlug}/dashboard`;
};

export const isValidAdminDepartment = (slug) => ADMIN_DEPT_SLUGS.has(slug);
