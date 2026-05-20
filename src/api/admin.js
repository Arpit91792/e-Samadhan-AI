import api from './axios';

export const getAdminDashboard = () => api.get('/admin/dashboard', { silent: true });

export const getAdminAnalytics = () => api.get('/admin/analytics', { silent: true });

export const getAdminComplaints = (params) => api.get('/admin/complaints', { params });

export const getAdminOfficers = (params) => api.get('/admin/officers', { params });

export const assignOfficer = (complaintId, officerId) =>
      api.put('/admin/assign-officer', { complaintId, officerId });

export const updateComplaintStatus = (complaintId, status, note = '') =>
      api.put('/admin/update-status', { complaintId, status, note });

export const getEmergencyComplaints = () => api.get('/admin/emergencies');

export const createOfficer = (data) => api.post('/admin/create-officer', data);

export const approveOfficer = (id) => api.put(`/admin/officers/${id}/approve`);

export const rejectOfficer = (id) => api.put(`/admin/officers/${id}/reject`);

export const generateEmployeeId = (id) => api.post(`/admin/officers/${id}/generate-id`);

export const blockOfficer = (id) => api.put(`/admin/officers/${id}/block`);

export const getDepartmentAdmins = () => api.get('/admin/department-admins');

export const createDepartmentAdmin = (data) => api.post('/admin/create-department-admin', data);

export const removeDepartmentAdmin = (id) => api.delete(`/admin/department-admins/${id}`);

export const getDepartments = () => api.get('/admin/departments');

export const sendDepartmentNotification = (title, message) =>
      api.post('/admin/notifications', { title, message });

export const getAdminUsers = (params) => api.get('/admin/users', { params });
