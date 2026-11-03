import express from 'express';
import { getOptimizedRoute } from '../controllers/routeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/collection-route', protect, authorize('admin', 'driver'), getOptimizedRoute);

export default router;
