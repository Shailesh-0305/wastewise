import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import WasteReport from './models/WasteReport.js';
import RecyclingCentre from './models/RecyclingCentre.js';
import CollectionSchedule from './models/CollectionSchedule.js';
import { initialUsers, initialReports, initialCentres, initialSchedules } from './store/inMemoryStore.js';

dotenv.config();

const seed = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri === 'your_mongodb_atlas_connection_string') {
    console.error('❌ MONGODB_URI is missing or unconfigured in server/.env');
    process.exit(1);
  }

  const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');

  try {
    console.log(`Connecting to MongoDB at ${maskedUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ MongoDB connected for administrative seeding.');

    await User.deleteMany();
    await WasteReport.deleteMany();
    await RecyclingCentre.deleteMany();
    await CollectionSchedule.deleteMany();

    // Prepare seeded users with bcrypt password hashing
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@wastewise.org').toLowerCase().trim();
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin Supervisor';

    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash(adminPass, salt);
    const hashedCitizenPassword = await bcrypt.hash('citizen123', salt);
    const hashedDriverPassword = await bcrypt.hash('driver123', salt);

    const usersToInsert = [
      {
        name: adminName,
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin',
        phone: '+1 (555) 999-0000',
        address: { street: 'City Municipal HQ', city: 'Buffalo', state: 'NY' },
        ecoPoints: 9999,
        co2SavedKg: 850.0,
        ecoLevel: 'City Guardian Master',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
      },
      {
        name: 'Alex Navillera',
        email: 'alex@example.com',
        password: hashedCitizenPassword,
        role: 'citizen',
        phone: '+1 (555) 234-5678',
        address: { street: 'Lake Star Dist. No48', city: 'Buffalo', state: 'NY', zip: '14201', coordinates: { lat: 40.8448, lng: -73.8648 } },
        ecoPoints: 1250,
        co2SavedKg: 24.8,
        ecoLevel: 'Level Eco Green 82',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      },
      {
        name: 'Travis Jordan',
        email: 'travis@wastewise.org',
        password: hashedDriverPassword,
        role: 'driver',
        phone: '+1 (587) 254-2365',
        address: { street: 'Depot 4 - Station North', city: 'Buffalo', state: 'NY' },
        ecoPoints: 4800,
        co2SavedKg: 182.5,
        ecoLevel: 'Eco Champion Gold',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
      }
    ];

    await User.insertMany(usersToInsert);

    // Format reports dates as Date objects for MongoDB persistence
    const reportsToInsert = initialReports.map(r => ({
      ...r,
      _id: undefined,
      preferredSlot: {
        ...r.preferredSlot,
        date: new Date(r.preferredSlot?.date || Date.now())
      },
      timeline: (r.timeline || []).map(t => ({
        ...t,
        timestamp: new Date(t.timestamp || Date.now())
      })),
      createdAt: new Date(r.createdAt || Date.now())
    }));
    await WasteReport.insertMany(reportsToInsert);

    const centresToInsert = initialCentres.map(c => ({ ...c, _id: undefined }));
    await RecyclingCentre.insertMany(centresToInsert);

    const schedulesToInsert = initialSchedules.map(s => ({
      ...s,
      _id: undefined,
      date: new Date(s.date || Date.now())
    }));
    await CollectionSchedule.insertMany(schedulesToInsert);

    console.log('🌱 [Database Seeded]: Successfully populated MongoDB Atlas with collections:');
    console.log(`   - Users: ${usersToInsert.length} (Admin: ${adminEmail})`);
    console.log(`   - Reports: ${reportsToInsert.length}`);
    console.log(`   - Centres: ${centresToInsert.length}`);
    console.log(`   - Schedules: ${schedulesToInsert.length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seed();
