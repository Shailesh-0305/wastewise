import express from 'express';
import {
  getAnalyticsOverview,
  getWardScorecards,
  getCleanlinessHeatmapData
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/overview', protect, authorize('admin'), getAnalyticsOverview);
router.get('/ward-scorecards', protect, authorize('admin'), getWardScorecards);
router.get('/cleanliness-heatmap', protect, authorize('admin'), getCleanlinessHeatmapData);

export default router;
