import api from './axios';
import { readStoredToken, readStoredAuth } from '../utils/authStorage';

/** Attach Bearer token + never wipe session on admin API errors */
const adminConfig = (extra = {}) => {
      const stored = readStoredAuth();
      const dept =
            stored?.managedDepartment
            || stored?.department
            || sessionStorage.getItem('adminDepartment')
            || '';

      return {
            silent: true,
            skipSessionClear: true,
            headers: dept ? { 'X-Admin-Department': dept } : {},
            ...extra,
            headers: {
                  ...(dept ? { 'X-Admin-Department': dept } : {}),
                  ...(extra.headers || {}),
            },
      };
};

const adminGet = (url, config = {}) => api.get(url, adminConfig(config));

const adminMutate = (method, url, data, config = {}) =>
      api.request({
            method,
            url,
            data,
            ...adminConfig(config),
      });

export const registerAdmin = (payload) =>
      api.post('/admin/register', payload, adminConfig());

export const adminLogin = (email, password, department) =>
      api.post('/admin/login', { email, password, department }, adminConfig());

export const getAdminProfile = () => adminGet('/admin/profile');

/** Confirms token + admin are valid before opening officer UI */
export const verifyAdminSession = () => adminGet('/admin/session-check');

export const getAdminDashboard = () => adminGet('/admin/dashboard');

export const getAdminAnalytics = () => adminGet('/admin/analytics');

export const getAdminComplaints = (params) => adminGet('/admin/complaints', { params });

export const getAdminOfficers = (params) => adminGet('/admin/officers', { params });

export const assignOfficer = (complaintId, officerId) =>
      adminMutate('put', '/admin/assign-officer', { complaintId, officerId });

export const updateComplaintStatus = (complaintId, status, note = '') =>
      adminMutate('put', '/admin/update-status', { complaintId, status, note });

export const getEmergencyComplaints = () => adminGet('/admin/emergencies');

export const createOfficer = (data) => adminMutate('post', '/admin/create-officer', data);

export const banOfficer = (officerId) => adminMutate('put', `/admin/ban-officer/${officerId}`);

export const getOfficerDetail = (id) => adminGet(`/admin/officers/${id}`);

export const toggleBlockOfficer = (id, reason) => adminMutate('put', `/admin/officers/${id}/toggle-block`, reason ? { reason } : {});

export const updateOfficerStatus = (id, status) => adminMutate('put', `/admin/officers/${id}/status`, { status });

export const getOfficerAnalytics = () => adminGet('/admin/officer-analytics');

export const approveOfficer = (id) => adminMutate('put', `/admin/officers/${id}/approve`);

export const rejectOfficer = (id) => adminMutate('put', `/admin/officers/${id}/reject`);

export const generateEmployeeId = (id) => adminMutate('post', `/admin/officers/${id}/generate-id`);

export const blockOfficer = (id) => adminMutate('put', `/admin/officers/${id}/block`);

export const getDepartmentAdmins = () => adminGet('/admin/department-admins');

export const createDepartmentAdmin = (data) => adminMutate('post', '/admin/create-department-admin', data);

export const removeDepartmentAdmin = (id) => adminMutate('delete', `/admin/department-admins/${id}`);

export const getDepartments = () => adminGet('/admin/departments');

export const sendDepartmentNotification = (title, message) =>
      adminMutate('post', '/admin/notifications', { title, message });

export const getAdminUsers = (params) => adminGet('/admin/users', { params });
