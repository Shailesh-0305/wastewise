import express from 'express';
import {
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign
} from '../controllers/campaignController.js';
import { protect, optionalAuth, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getAllCampaigns)
  .post(protect, authorize('admin'), createCampaign);

router.route('/:id')
  .put(protect, authorize('admin'), updateCampaign)
  .patch(protect, authorize('admin'), updateCampaign)
  .delete(protect, authorize('admin'), deleteCampaign);

export default router;

