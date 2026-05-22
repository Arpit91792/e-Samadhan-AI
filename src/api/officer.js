import api from './axios';

export const registerOfficer = (payload) => api.post('/officer/register', payload);

export const loginOfficer = (payload) => api.post('/officer/login', payload);

/**
 * Pre-flight check — validates employeeId (+ optional email/department).
 * Returns officer name, department, emailHint so the form can confirm before OTP.
 */
export const checkEmployeeId = (employeeId, email = '', department = '') =>
      api.get('/officer/check-employee-id', {
            params: { employeeId, ...(email ? { email } : {}), ...(department ? { department } : {}) },
            silent: true,
      });

export const getOfficerProfile = () => api.get('/officer/profile', { silent: true });

export const getOfficerDashboard = () => api.get('/officer/dashboard', { silent: true });

export const getOfficerComplaints = (params) => api.get('/officer/complaints', { params });

export const acceptComplaint = (id) => api.put(`/officer/complaints/${id}/accept`);

export const updateOfficerComplaintStatus = (id, status, note = '') =>
      api.put(`/officer/complaints/${id}/status`, { status, note });

export const addOfficerNote = (id, note) => api.post(`/officer/complaints/${id}/note`, { note });

export const getOfficerPerformance = () => api.get('/officer/performance', { silent: true });
