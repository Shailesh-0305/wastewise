import express from 'express';
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule
} from '../controllers/scheduleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAllSchedules)
  .post(protect, createSchedule);

router.route('/:id')
  .put(protect, updateSchedule)
  .delete(protect, deleteSchedule);

export default router;
