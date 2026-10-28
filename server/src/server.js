import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import centerRoutes from './routes/centerRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import routeOptimizationRoutes from './routes/routeOptimizationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/routes', routeOptimizationRoutes);

// Root & Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'WasteWise Smart Waste Management Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 [WasteWise Server]: Running on http://localhost:${PORT}`);
    console.log(`📡 [API Endpoints]: http://localhost:${PORT}/api/health`);
  });
};

startServer();
