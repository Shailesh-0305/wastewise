import express from 'express';
import {
  createReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  assignDriver,
  deleteReport
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createReport)
  .get(getAllReports);

router.route('/:id')
  .get(getReportById)
  .put(protect, updateReportStatus)
  .delete(protect, deleteReport);

router.route('/:id/status')
  .patch(protect, updateReportStatus);

router.route('/:id/assign')
  .patch(protect, assignDriver);

export default router;
