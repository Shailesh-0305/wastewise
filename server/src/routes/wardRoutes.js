import express from 'express';
import {
  getAllWards,
  getWardById,
  createWard,
  updateWard
} from '../controllers/wardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllWards);
router.get('/:id', protect, authorize('admin'), getWardById);
router.post('/', protect, authorize('admin'), createWard);
router.put('/:id', protect, authorize('admin'), updateWard);
router.patch('/:id', protect, authorize('admin'), updateWard);

export default router;

