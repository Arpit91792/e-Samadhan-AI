import api from './axios';

// ── File a complaint ──────────────────────────────────────────────────────────
export const fileComplaint = (formData) =>
      api.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ── Get complaints (with optional filters) ────────────────────────────────────
export const getComplaints = (params = {}) =>
      api.get('/complaints', { params });

// ── Get single complaint ──────────────────────────────────────────────────────
export const getComplaint = (id) =>
      api.get(`/complaints/${id}`);

// ── Update status (officer/admin) ─────────────────────────────────────────────
export const updateComplaintStatus = (id, status, note = '') =>
      api.put(`/complaints/${id}/status`, { status, note });

// ── Assign to officer (admin) ─────────────────────────────────────────────────
export const assignComplaint = (id, officerId) =>
      api.put(`/complaints/${id}/assign`, { officerId });

// ── Upvote ────────────────────────────────────────────────────────────────────
export const upvoteComplaint = (id) =>
      api.post(`/complaints/${id}/upvote`);

// ── Submit feedback ───────────────────────────────────────────────────────────
export const submitFeedback = (id, rating, comment) =>
      api.post(`/complaints/${id}/feedback`, { rating, comment });

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getComplaintAnalytics = () =>
      api.get('/complaints/analytics');

export const getCitizenStats = () =>
      api.get('/complaints/citizen/stats', { silent: true });

export const analyzeComplaint = (title, description) =>
      api.post('/complaints/analyze', { title, description });
