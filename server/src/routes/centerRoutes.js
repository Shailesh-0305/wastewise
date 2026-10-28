import express from 'express';
import {
  getAllCentres,
  getCentreById,
  createCentre,
  updateCentre,
  deleteCentre
} from '../controllers/centerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAllCentres)
  .post(protect, createCentre);

router.route('/:id')
  .get(getCentreById)
  .put(protect, updateCentre)
  .delete(protect, deleteCentre);

export default router;
