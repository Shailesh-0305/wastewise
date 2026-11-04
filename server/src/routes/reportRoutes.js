import express from 'express';
import {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  updateReportStatus,
  assignDriver,
  deleteReport
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createReport)
  .get(protect, getAllReports);

router.get('/all', protect, getAllReports);

router.route('/:id')
  .get(protect, getReportById)
  .put(protect, updateReport)
  .delete(protect, authorize('admin'), deleteReport);

router.route('/:id/status')
  .patch(protect, updateReportStatus)
  .put(protect, updateReportStatus);

router.route('/:id/assign')
  .patch(protect, authorize('admin'), assignDriver)
  .put(protect, authorize('admin'), assignDriver);

export default router;
