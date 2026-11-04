import express from 'express';
import {
  getAllWorkers,
  getWorkerById,
  createWorker,
  updateWorker
} from '../controllers/workerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/')
  .get(getAllWorkers)
  .post(createWorker);

router.route('/:id')
  .get(getWorkerById)
  .put(updateWorker)
  .patch(updateWorker);

export default router;
