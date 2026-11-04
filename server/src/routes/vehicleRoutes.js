import express from 'express';
import {
  getAllVehicles,
  createVehicle,
  updateVehicle
} from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/')
  .get(getAllVehicles)
  .post(createVehicle);

router.route('/:id')
  .put(updateVehicle)
  .patch(updateVehicle);

export default router;
