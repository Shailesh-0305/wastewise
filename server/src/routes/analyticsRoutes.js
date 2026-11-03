import express from 'express';
import { getAnalyticsOverview } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/overview', protect, authorize('admin'), getAnalyticsOverview);

export default router;
