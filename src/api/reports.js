import api from './axios';

// Helper to manually set authorization headers based on the role to bypass axios-specific defaults
const getRoleConfig = (role) => {
      let token = '';
      if (role === 'officer') {
            token = localStorage.getItem('officerToken');
      } else if (role === 'admin') {
            token = localStorage.getItem('adminToken');
      } else {
            token = localStorage.getItem('citizenToken') || localStorage.getItem('token');
      }

      return {
            headers: {
                  Authorization: `Bearer ${token || ''}`
            }
      };
};

/** Officer generates AI report text preview based on resolution notes */
export const generateReportText = (complaintId, resolutionNotes) =>
      api.post(`/reports/generate/${complaintId}`, { resolutionNotes }, getRoleConfig('officer'));

/** Officer finalizes the resolution, saves everything, generates PDF, and sends citizen email */
export const finalizeResolutionAndSend = (complaintId, resolutionNotes, resolutionReport) =>
      api.post(`/reports/send/${complaintId}`, { resolutionNotes, resolutionReport }, getRoleConfig('officer'));

/** Citizen gets their own resolution reports */
export const getCitizenReports = () =>
      api.get('/reports/citizen', getRoleConfig('citizen'));

/** Citizen submits rating and feedback */
export const submitReportFeedback = (complaintId, rating, feedback) =>
      api.post(`/reports/rate/${complaintId}`, { rating, feedback }, getRoleConfig('citizen'));

/** Officer fetches their resolution statistics and ratings */
export const getOfficerReportAnalytics = () =>
      api.get('/reports/officer', getRoleConfig('officer'));

/** Admin fetches global AI governance reports and dynamic policy insights */
export const getAdminReportAnalytics = () =>
      api.get('/reports/admin', getRoleConfig('admin'));
