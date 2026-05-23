import api from './axios';
import { readStoredOfficerToken } from '../utils/authStorage';

/** Config that forces officer token — never uses admin/citizen token */
const officerConfig = (extra = {}) => ({
      silent: true,
      ...extra,
      headers: {
            Authorization: `Bearer ${readStoredOfficerToken() || ''}`,
            ...(extra.headers || {}),
      },
});

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

export const getOfficerProfile = () => api.get('/officer/profile', officerConfig());

export const getOfficerDashboard = () => api.get('/officer/dashboard', officerConfig());

/** Department queue — all unaccepted pending complaints for officer's department */
export const getDepartmentQueue = (params) =>
      api.get('/officer/queue', officerConfig({ params }));

/** Officer picks up a complaint from the shared department queue */
export const selfAssignComplaint = (id) =>
      api.put(`/officer/complaints/${id}/self-assign`, {}, officerConfig());

export const getOfficerComplaints = (params) => api.get('/officer/complaints', officerConfig({ params }));

export const acceptComplaint = (id) => api.put(`/officer/complaints/${id}/accept`, {}, officerConfig());

export const updateOfficerComplaintStatus = (id, status, note = '') =>
      api.put(`/officer/complaints/${id}/status`, { status, note }, officerConfig());

export const addOfficerNote = (id, note) => api.post(`/officer/complaints/${id}/note`, { note }, officerConfig());

export const getOfficerPerformance = () => api.get('/officer/performance', officerConfig());
