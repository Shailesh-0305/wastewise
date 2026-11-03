import express from 'express';
import {
  createReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  assignDriver,
  deleteReport
} from '../controllers/reportController.js';
import { protect, optionalAuth, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(optionalAuth, createReport)
  .get(getAllReports);

router.route('/:id')
  .get(getReportById)
  .put(protect, authorize('admin', 'driver'), updateReportStatus)
  .delete(protect, authorize('admin'), deleteReport);

router.route('/:id/status')
  .patch(protect, updateReportStatus);

router.route('/:id/assign')
  .patch(protect, authorize('admin', 'driver'), assignDriver);

export default router;
