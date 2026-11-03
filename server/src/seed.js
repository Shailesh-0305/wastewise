import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import WasteReport from './models/WasteReport.js';
import RecyclingCentre from './models/RecyclingCentre.js';
import CollectionSchedule from './models/CollectionSchedule.js';
import { initialReports, initialCentres, initialSchedules } from './store/inMemoryStore.js';

dotenv.config();

/**
 * Safe, idempotent seeding script for WasteWise.
 * 
 * Safety invariants:
 * 1. NEVER calls deleteMany() — existing collections and user data are strictly preserved.
 * 2. Requires an explicitly configured ADMIN_PASSWORD in environment (refuses default 'admin123').
 * 3. Idempotent: checks for existing unique identifiers (email, trackingId, name+city, title) before inserting.
 * 4. Only uses verified Coimbatore, Tamil Nadu demo records clearly labeled as demo data.
 */
export const seed = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri === 'your_mongodb_atlas_connection_string') {
    console.error('❌ MONGODB_URI is missing or unconfigured in server/.env');
    process.exit(1);
  }

  // Enforce strong, explicit administrator password configuration
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass || adminPass.trim() === '' || adminPass === 'admin123') {
    console.error('❌ Safe Seed Aborted: ADMIN_PASSWORD environment variable must be explicitly configured and cannot be default "admin123".');
    process.exit(1);
  }

  const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');

  try {
    console.log(`Connecting to MongoDB at ${maskedUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ MongoDB connected for safe administrative seeding.');

    // 1. Seed Administrator and Demo Accounts (Idempotent - checks if email exists)
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@wastewise.org').toLowerCase().trim();
    const adminName = process.env.ADMIN_NAME || 'Coimbatore Municipal Supervisor';

    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash(adminPass, salt);
    const hashedCitizenPassword = await bcrypt.hash('citizen123', salt);
    const hashedDriverPassword = await bcrypt.hash('driver123', salt);

    const demoUsers = [
      {
        name: adminName,
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin',
        phone: '+91 422 230 0100',
        address: {
          street: 'CCMC Headquarters, Big Bazaar St',
          locality: 'Town Hall',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          zip: '641001'
        },
        ecoPoints: 0,
        co2SavedKg: 0,
        ecoLevel: 'Municipal Admin',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
      },
      {
        name: 'Demo Citizen (Coimbatore)',
        email: 'citizen.demo@wastewise.org',
        password: hashedCitizenPassword,
        role: 'citizen',
        phone: '+91 98765 43210',
        address: {
          street: '42 Cross Cut Road',
          locality: 'Gandhipuram',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          zip: '641001'
        },
        ecoPoints: 0,
        co2SavedKg: 0,
        ecoLevel: 'Eco Starter',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      },
      {
        name: 'Demo Driver (Coimbatore West)',
        email: 'driver.demo@wastewise.org',
        password: hashedDriverPassword,
        role: 'driver',
        phone: '+91 94431 82910',
        address: {
          street: 'Central Fleet Depot, Big Bazaar St',
          locality: 'Town Hall',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          zip: '641001'
        },
        ecoPoints: 0,
        co2SavedKg: 0,
        ecoLevel: 'Fleet Driver',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
      }
    ];

    let usersInserted = 0;
    let usersSkipped = 0;
    for (const u of demoUsers) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        await User.create(u);
        usersInserted++;
      } else {
        usersSkipped++;
      }
    }

    // 2. Seed Recycling Centres (Idempotent - checks if name and city exist)
    let centresInserted = 0;
    let centresSkipped = 0;
    for (const c of initialCentres) {
      const existing = await RecyclingCentre.findOne({ name: c.name, city: 'Coimbatore' });
      if (!existing) {
        await RecyclingCentre.create({ ...c, _id: undefined });
        centresInserted++;
      } else {
        centresSkipped++;
      }
    }

    // 3. Seed Collection Schedules (Idempotent - checks if title exists)
    let schedulesInserted = 0;
    let schedulesSkipped = 0;
    for (const s of initialSchedules) {
      const existing = await CollectionSchedule.findOne({ title: s.title });
      if (!existing) {
        await CollectionSchedule.create({
          ...s,
          _id: undefined,
          date: new Date(s.date || Date.now())
        });
        schedulesInserted++;
      } else {
        schedulesSkipped++;
      }
    }

    // 4. Seed Demo Waste Reports (Idempotent - checks if trackingId exists)
    let reportsInserted = 0;
    let reportsSkipped = 0;
    for (const r of initialReports) {
      const existing = await WasteReport.findOne({ trackingId: r.trackingId });
      if (!existing) {
        await WasteReport.create({
          ...r,
          _id: undefined,
          pointsAwarded: false,
          preferredSlot: {
            ...r.preferredSlot,
            date: new Date(r.preferredSlot?.date || Date.now())
          },
          timeline: (r.timeline || []).map(t => ({
            ...t,
            timestamp: new Date(t.timestamp || Date.now())
          })),
          createdAt: new Date(r.createdAt || Date.now())
        });
        reportsInserted++;
      } else {
        reportsSkipped++;
      }
    }

    console.log('🌱 [Safe Seeding Report]:');
    console.log(`   - Users: ${usersInserted} added, ${usersSkipped} already existed`);
    console.log(`   - Centres: ${centresInserted} added, ${centresSkipped} already existed`);
    console.log(`   - Schedules: ${schedulesInserted} added, ${schedulesSkipped} already existed`);
    console.log(`   - Reports: ${reportsInserted} added, ${reportsSkipped} already existed`);
    console.log('   (No existing database records were deleted).');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Safe seeding error:', error.message);
    process.exit(1);
  }
};

// Only execute when directly invoked via CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seed();
}
