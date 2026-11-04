import express from 'express';
import {
  getAllUsersAdmin,
  getUserDetailsAdmin,
  updateUserStatusOrRoleAdmin,
  getAuditLogs,
  rejectAuditLogMutation,
  getSystemSettings,
  updateSystemSettings
} from '../controllers/adminSystemController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

// Module 18: User Management
router.get('/users', getAllUsersAdmin);
router.get('/users/:id', getUserDetailsAdmin);
router.patch('/users/:id', updateUserStatusOrRoleAdmin);
router.put('/users/:id', updateUserStatusOrRoleAdmin);

// Module 19: Administrative Audit Logs (Strictly Append-Only)
router.get('/audit-logs', getAuditLogs);
router.delete('/audit-logs', rejectAuditLogMutation);
router.delete('/audit-logs/:id', rejectAuditLogMutation);
router.put('/audit-logs/:id', rejectAuditLogMutation);
router.patch('/audit-logs/:id', rejectAuditLogMutation);

// Module 20: System Settings
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);
router.patch('/settings', updateSystemSettings);

export default router;
