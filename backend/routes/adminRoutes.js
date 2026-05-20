import express from 'express';
import {
      getDashboard, getAllUsers, toggleUserStatus,
      getDepartments, updateDepartment,
      getAuditLogs, getPlatformAnalytics,
} from '../controllers/adminController.js';
import {
      getAdminComplaints, getAdminOfficers, assignOfficerToComplaint,
      updateComplaintStatusAdmin, createDepartmentAdmin, removeDepartmentAdmin,
      getDepartmentAdmins, createOfficer, approveOfficer, rejectOfficer, generateOfficerEmployeeId,
      blockOfficer, getEmergencyComplaints, sendDepartmentNotification,
} from '../controllers/adminManagementController.js';
import { protect, authorize } from '../middleware/auth.js';
import { attachAdminScope } from '../utils/adminScope.js';
import { requireSuperAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'), attachAdminScope);

// Dashboard & analytics
router.get('/dashboard', getDashboard);
router.get('/analytics', getPlatformAnalytics);

// Complaints & officers (department-scoped)
router.get('/complaints', getAdminComplaints);
router.get('/officers', getAdminOfficers);
router.put('/assign-officer', assignOfficerToComplaint);
router.put('/update-status', updateComplaintStatusAdmin);
router.get('/emergencies', getEmergencyComplaints);

// Officer workflow
router.post('/create-officer', createOfficer);
router.put('/officers/:id/approve', approveOfficer);
router.put('/officers/:id/reject', rejectOfficer);
router.post('/officers/:id/generate-id', generateOfficerEmployeeId);
router.put('/officers/:id/block', blockOfficer);

// Notifications
router.post('/notifications', sendDepartmentNotification);

// Super admin only
router.post('/create-department-admin', requireSuperAdmin, createDepartmentAdmin);
router.get('/department-admins', requireSuperAdmin, getDepartmentAdmins);
router.delete('/department-admins/:id', requireSuperAdmin, removeDepartmentAdmin);

// Users & departments
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/departments', getDepartments);
router.put('/departments/:id', requireSuperAdmin, updateDepartment);
router.get('/audit-logs', requireSuperAdmin, getAuditLogs);

export default router;
