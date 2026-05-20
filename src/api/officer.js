import api from './axios';

export const getOfficerDashboard = () => api.get('/officer/dashboard', { silent: true });

export const getOfficerComplaints = (params) => api.get('/officer/complaints', { params });

export const acceptComplaint = (id) => api.put(`/officer/complaints/${id}/accept`);

export const updateOfficerComplaintStatus = (id, status, note = '') =>
      api.put(`/officer/complaints/${id}/status`, { status, note });

export const addOfficerNote = (id, note) => api.post(`/officer/complaints/${id}/note`, { note });

export const getOfficerPerformance = () => api.get('/officer/performance', { silent: true });
