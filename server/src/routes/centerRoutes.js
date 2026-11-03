import express from 'express';
import {
  getAllCentres,
  getCentreById,
  createCentre,
  updateCentre,
  deleteCentre
} from '../controllers/centerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAllCentres)
  .post(protect, authorize('admin'), createCentre);

router.route('/:id')
  .get(getCentreById)
  .put(protect, authorize('admin'), updateCentre)
  .delete(protect, authorize('admin'), deleteCentre);

export default router;
