import express from 'express';
import {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint
} from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAllComplaints)
  .post(protect, createComplaint);

router.route('/:id')
  .get(protect, getComplaintById)
  .patch(protect, authorize('admin'), updateComplaint)
  .put(protect, authorize('admin'), updateComplaint);

export default router;

