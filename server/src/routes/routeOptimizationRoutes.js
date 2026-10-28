import express from 'express';
import { getOptimizedRoute } from '../controllers/routeController.js';

const router = express.Router();

router.get('/collection-route', getOptimizedRoute);

export default router;
