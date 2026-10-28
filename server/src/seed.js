import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import WasteReport from './models/WasteReport.js';
import RecyclingCentre from './models/RecyclingCentre.js';
import CollectionSchedule from './models/CollectionSchedule.js';
import { initialUsers, initialReports, initialCentres, initialSchedules } from './store/inMemoryStore.js';

dotenv.config();

const seed = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wastewise';

  try {
    console.log(`Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
    console.log('MongoDB connected for seeding!');

    await User.deleteMany();
    await WasteReport.deleteMany();
    await RecyclingCentre.deleteMany();
    await CollectionSchedule.deleteMany();

    await User.insertMany(initialUsers);
    await WasteReport.insertMany(initialReports);
    await RecyclingCentre.insertMany(initialCentres);
    await CollectionSchedule.insertMany(initialSchedules);

    console.log('🌱 Seed successful! Created demo users, reports, recycling centres, and schedules.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seed();
