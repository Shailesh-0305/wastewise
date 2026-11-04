import express from 'express';
import {
  getOptimizedRoute,
  dispatchRoute,
  getAllRoutes,
  updateRouteStatus
} from '../controllers/routeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'driver'), getAllRoutes);
router.get('/collection-route', protect, authorize('admin', 'driver'), getOptimizedRoute);
router.post('/optimize-preview', protect, authorize('admin'), getOptimizedRoute);
router.post('/dispatch', protect, authorize('admin'), dispatchRoute);
router.patch('/:id/status', protect, authorize('admin', 'driver'), updateRouteStatus);

export default router;
