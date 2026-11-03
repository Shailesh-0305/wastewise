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

// Enforce required security environment configuration
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace_with_a_long_random_secret') {
  console.error('❌ [Security Configuration Error]: JWT_SECRET is missing or set to placeholder in server/.env.');
  console.error('ℹ️ Please define a private, secure JWT_SECRET in server/.env before launching WasteWise.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration supporting local Vite and production clients
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/routes', routeOptimizationRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'WasteWise Smart Waste Management Platform',
    version: '1.0.0',
    database: 'MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});

// Start Server after verifying database connection
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 [WasteWise Express Server]: Running on http://localhost:${PORT}`);
    console.log(`📡 [API Health Check]: http://localhost:${PORT}/api/health`);
  });
};

startServer();
