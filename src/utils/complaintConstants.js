export const DEPARTMENTS = [
      { value: 'electricity', label: 'Electricity', icon: '⚡' },
      { value: 'water_supply', label: 'Water Supply', icon: '💧' },
      { value: 'police', label: 'Police', icon: '🚔' },
      { value: 'roads_transport', label: 'Roads & Transport', icon: '🛣️' },
      { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
      { value: 'municipal', label: 'Municipal Services', icon: '🏛️' },
      { value: 'sanitation', label: 'Sanitation', icon: '🗑️' },
      { value: 'education', label: 'Education', icon: '📚' },
      { value: 'other', label: 'Other', icon: '📋' },
];

export const PRIORITIES = [
      { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
      { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
      { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
      { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-700' },
];

export const STATUS_CONFIG = {
      pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      assigned: { label: 'Assigned', color: 'bg-violet-100 text-violet-800 border-violet-200' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700 border-slate-200' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
};

export const deptLabel = (slug) =>
      DEPARTMENTS.find((d) => d.value === slug)?.label || slug?.replace(/_/g, ' ') || 'General';
