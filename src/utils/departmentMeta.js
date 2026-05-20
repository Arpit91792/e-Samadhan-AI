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

export const isSuperAdmin = (user) =>
      user?.role === 'admin' && (!user?.adminLevel || user.adminLevel === 'super_admin');
