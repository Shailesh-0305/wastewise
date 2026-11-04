import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';

// Ensure DNS resolution for MongoDB Atlas SRV on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Use system defaults
}

dotenv.config({ path: 'server/.env' });

import User from '../models/User.js';
import WasteReport from '../models/WasteReport.js';
import CollectionVehicle from '../models/CollectionVehicle.js';
import Ward from '../models/Ward.js';
import CollectionSchedule from '../models/CollectionSchedule.js';
import CollectionRoute from '../models/CollectionRoute.js';
import RecyclingCentre from '../models/RecyclingCentre.js';
import Complaint from '../models/Complaint.js';
import Campaign from '../models/Campaign.js';
import AuditLog from '../models/AuditLog.js';
import SystemSettings from '../models/SystemSettings.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in server/.env');
  process.exit(1);
}

const daysAgo = (days, hoursOffset = 0) => {
  const d = new Date(Date.now() - days * 86400000 + hoursOffset * 3600000);
  return d;
};

const daysFromNow = (days, hoursOffset = 0) => {
  const d = new Date(Date.now() + days * 86400000 + hoursOffset * 3600000);
  return d;
};

export async function seedRealisticData() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 12000 });
  console.log('✅ Connected to MongoDB Atlas successfully.');

  const salt = await bcrypt.genSalt(10);
  const adminPass = process.env.ADMIN_PASSWORD || 'adminPass123!';
  const hashedAdminPassword = await bcrypt.hash(adminPass, salt);
  const hashedCitizenPassword = await bcrypt.hash('citizen123', salt);
  const hashedDriverPassword = await bcrypt.hash('driver123', salt);

  // --------------------------------------------------------------------------
  // 1. SYSTEM SETTINGS
  // --------------------------------------------------------------------------
  console.log('1/10 Configuring System Settings...');
  await SystemSettings.findOneAndUpdate(
    { settingKey: 'global_municipal_settings' },
    {
      $set: {
        settingKey: 'global_municipal_settings',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        country: 'India',
        countryCallingCode: '+91',
        postalTerminology: 'PIN code',
        timezone: 'Asia/Kolkata',
        vehicleCapacityDefaults: {
          minCapacityKg: 250,
          defaultCapacityKg: 1000,
          warningThresholdPercent: 85,
          maxThresholdPercent: 100,
          bagWeightKgEstimate: 4.0,
          itemWeightKgEstimate: 1.5
        },
        routeOptimizationSettings: {
          defaultDepotName: 'CCMC Central Fleet Depot, Town Hall',
          defaultDepotAddress: 'Big Bazaar Street, Town Hall, Coimbatore 641001',
          defaultDepotCoordinates: { lat: 11.0018, lng: 76.9628 },
          roadTortuosityFactor: 1.32,
          avgUrbanSpeedKmh: 22,
          stopServiceTimeMin: 5,
          preventOverCapacityDispatch: true
        },
        cleanlinessHeatmapThresholds: {
          warningPendingCount: 2,
          criticalPendingCount: 4,
          warningOverdueCount: 1,
          criticalOverdueCount: 2,
          warningComplaintCount: 1,
          criticalComplaintCount: 3
        },
        wardPerformanceWeights: {
          pickupCompletionWeight: 35,
          complaintResolutionWeight: 25,
          recyclingRateWeight: 20,
          timelinessWeight: 20
        }
      }
    },
    { upsert: true, new: true }
  );

  // --------------------------------------------------------------------------
  // 2. USERS (1 Admin, 8 Citizens, 6 Drivers)
  // --------------------------------------------------------------------------
  console.log('2/10 Seeding Users (Admin, Citizens, Collection Drivers)...');
  const usersData = [
    // Municipal Administrator
    {
      name: process.env.ADMIN_NAME || 'Coimbatore Municipal Supervisor',
      email: (process.env.ADMIN_EMAIL || 'admin@wastewise.org').toLowerCase().trim(),
      password: hashedAdminPassword,
      role: 'admin',
      phone: '+91 422 230 0100',
      address: {
        street: 'CCMC Headquarters, Big Bazaar St',
        locality: 'Town Hall',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641001',
        coordinates: { lat: 11.0018, lng: 76.9628 }
      },
      ecoPoints: 9999,
      co2SavedKg: 850.0,
      ecoLevel: 'City Guardian Master',
      isActive: true
    },
    // Primary Demo Citizen
    {
      name: 'Aarav Sundaram',
      email: 'citizen.demo@wastewise.org',
      password: hashedCitizenPassword,
      role: 'citizen',
      phone: '+91 98765 43210',
      address: {
        street: '42 Cross Cut Road',
        locality: 'Gandhipuram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641012',
        coordinates: { lat: 11.0183, lng: 76.9691 }
      },
      ecoPoints: 640,
      co2SavedKg: 54.2,
      ecoLevel: 'Eco Champion Gold',
      isActive: true
    },
    {
      name: 'Priya Ramasamy',
      email: 'priya.r@example.com',
      password: hashedCitizenPassword,
      role: 'citizen',
      phone: '+91 97890 12345',
      address: {
        street: '15 DB Road',
        locality: 'RS Puram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641002',
        coordinates: { lat: 11.0086, lng: 76.9497 }
      },
      ecoPoints: 495,
      co2SavedKg: 41.0,
      ecoLevel: 'Eco Champion Silver',
      isActive: true
    },
    {
      name: 'Manoj Kumar',
      email: 'manoj.kumar@example.com',
      password: hashedCitizenPassword,
      role: 'citizen',
      phone: '+91 94432 98765',
      address: {
        street: '88 Avinashi Road',
        locality: 'Peelamedu',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641004',
        coordinates: { lat: 11.0285, lng: 77.0028 }
      },
      ecoPoints: 410,
      co2SavedKg: 35.8,
      ecoLevel: 'Eco Enthusiast',
      isActive: true
    },
    {
      name: 'Kavitha Subramaniam',
      email: 'kavitha.s@example.com',
      password: hashedCitizenPassword,
      role: 'citizen',
      phone: '+91 99441 55667',
      address: {
        street: '24 NSR Road',
        locality: 'Saibaba Colony',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641011',
        coordinates: { lat: 11.0252, lng: 76.9421 }
      },
      ecoPoints: 360,
      co2SavedKg: 29.4,
      ecoLevel: 'Green Steward',
      isActive: true
    },
    {
      name: 'Dinesh Balaji',
      email: 'dinesh.b@example.com',
      password: hashedCitizenPassword,
      role: 'citizen',
      phone: '+91 96002 33445',
      address: {
        street: '102 Trichy Road',
        locality: 'Singanallur',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641005',
        coordinates: { lat: 10.9995, lng: 77.0267 }
      },
      ecoPoints: 285,
      co2SavedKg: 23.1,
      ecoLevel: 'Green Steward',
      isActive: true
    },
    {
      name: 'Meenakshi Sundaram',
      email: 'meenakshi.s@example.com',
      password: hashedCitizenPassword,
      role: 'citizen',
      phone: '+91 98422 77889',
      address: {
        street: '19 Race Course Scheme Road',
        locality: 'Race Course',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641018',
        coordinates: { lat: 11.0036, lng: 76.9762 }
      },
      ecoPoints: 520,
      co2SavedKg: 46.5,
      ecoLevel: 'Eco Champion Gold',
      isActive: true
    },
    {
      name: 'Vigneshwaran N',
      email: 'vignesh.n@example.com',
      password: hashedCitizenPassword,
      role: 'citizen',
      phone: '+91 97911 22334',
      address: {
        street: '55 Sathy Road',
        locality: 'Saravanampatti',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641035',
        coordinates: { lat: 11.0764, lng: 77.0012 }
      },
      ecoPoints: 230,
      co2SavedKg: 19.8,
      ecoLevel: 'Eco Starter',
      isActive: true
    },
    {
      name: 'Lakshmi Narayanan',
      email: 'lakshmi.n@example.com',
      password: hashedCitizenPassword,
      role: 'citizen',
      phone: '+91 95008 66778',
      address: {
        street: '74 Pollachi Main Road',
        locality: 'Podanur',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641023',
        coordinates: { lat: 10.9622, lng: 76.9765 }
      },
      ecoPoints: 315,
      co2SavedKg: 26.2,
      ecoLevel: 'Green Steward',
      isActive: true
    },
    // Collection Drivers / Field Workers
    {
      name: 'Karthik Raja',
      email: 'driver.demo@wastewise.org',
      password: hashedDriverPassword,
      role: 'driver',
      phone: '+91 98422 11001',
      employeeId: 'CBE-DRV-101',
      assignedWard: 'Ward 24',
      assignedZone: 'West Zone',
      assignedShift: 'Morning (06:00 AM - 02:00 PM)',
      assignedVehiclePlate: 'TN-38-BZ-4921',
      operationalStatus: 'On Duty',
      address: {
        street: '12 Lawley Road',
        locality: 'RS Puram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641002'
      },
      isActive: true
    },
    {
      name: 'Senthil Nathan',
      email: 'senthil.driver@wastewise.org',
      password: hashedDriverPassword,
      role: 'driver',
      phone: '+91 98422 11002',
      employeeId: 'CBE-DRV-102',
      assignedWard: 'Ward 32',
      assignedZone: 'Central Zone',
      assignedShift: 'Morning (06:00 AM - 02:00 PM)',
      assignedVehiclePlate: 'TN-38-CX-1102',
      operationalStatus: 'Assigned',
      address: {
        street: '8 Tatabad 3rd Street',
        locality: 'Gandhipuram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641012'
      },
      isActive: true
    },
    {
      name: 'Murugan K',
      email: 'murugan.driver@wastewise.org',
      password: hashedDriverPassword,
      role: 'driver',
      phone: '+91 98422 11003',
      employeeId: 'CBE-DRV-103',
      assignedWard: 'Ward 38',
      assignedZone: 'East Zone',
      assignedShift: 'Morning (06:00 AM - 02:00 PM)',
      assignedVehiclePlate: 'TN-38-DF-7823',
      operationalStatus: 'On Duty',
      address: {
        street: '45 Hope College Junction',
        locality: 'Peelamedu',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641004'
      },
      isActive: true
    },
    {
      name: 'Rajesh Kannan',
      email: 'rajesh.driver@wastewise.org',
      password: hashedDriverPassword,
      role: 'driver',
      phone: '+91 98422 11004',
      employeeId: 'CBE-DRV-104',
      assignedWard: 'Ward 45',
      assignedZone: 'West Zone',
      assignedShift: 'Afternoon (02:00 PM - 10:00 PM)',
      assignedVehiclePlate: 'TN-38-EA-3341',
      operationalStatus: 'Available',
      address: {
        street: '19 Alagesan Road',
        locality: 'Saibaba Colony',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641011'
      },
      isActive: true
    },
    {
      name: 'Anitha Devi',
      email: 'anitha.driver@wastewise.org',
      password: hashedDriverPassword,
      role: 'driver',
      phone: '+91 98422 11005',
      employeeId: 'CBE-DRV-105',
      assignedWard: 'Ward 54',
      assignedZone: 'East Zone',
      assignedShift: 'Morning (06:00 AM - 02:00 PM)',
      assignedVehiclePlate: 'TN-38-HAZ-009',
      operationalStatus: 'Available',
      address: {
        street: '33 Kamaraj Road',
        locality: 'Singanallur',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641005'
      },
      isActive: true
    },
    {
      name: 'Prakash Velu',
      email: 'prakash.driver@wastewise.org',
      password: hashedDriverPassword,
      role: 'driver',
      phone: '+91 98422 11006',
      employeeId: 'CBE-DRV-106',
      assignedWard: 'Ward 81',
      assignedZone: 'South Zone',
      assignedShift: 'Morning (06:00 AM - 02:00 PM)',
      assignedVehiclePlate: 'TN-38-MRF-5510',
      operationalStatus: 'On Duty',
      address: {
        street: '14 Sungam Bypass Road',
        locality: 'Ukkadam',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641001'
      },
      isActive: true
    }
  ];

  const createdUsers = {};
  for (const u of usersData) {
    const userDoc = await User.findOneAndUpdate(
      { email: u.email },
      { $set: u },
      { upsert: true, new: true }
    );
    createdUsers[u.email] = userDoc;
  }

  const adminUser = createdUsers[(process.env.ADMIN_EMAIL || 'admin@wastewise.org').toLowerCase().trim()];
  const demoCitizen = createdUsers['citizen.demo@wastewise.org'];
  const priyaCitizen = createdUsers['priya.r@example.com'];
  const manojCitizen = createdUsers['manoj.kumar@example.com'];
  const kavithaCitizen = createdUsers['kavitha.s@example.com'];
  const dineshCitizen = createdUsers['dinesh.b@example.com'];
  const meenakshiCitizen = createdUsers['meenakshi.s@example.com'];
  const vigneshCitizen = createdUsers['vignesh.n@example.com'];
  const lakshmiCitizen = createdUsers['lakshmi.n@example.com'];

  const driver1 = createdUsers['driver.demo@wastewise.org'];
  const driver2 = createdUsers['senthil.driver@wastewise.org'];
  const driver3 = createdUsers['murugan.driver@wastewise.org'];
  const driver4 = createdUsers['rajesh.driver@wastewise.org'];
  const driver5 = createdUsers['anitha.driver@wastewise.org'];
  const driver6 = createdUsers['prakash.driver@wastewise.org'];

  // --------------------------------------------------------------------------
  // 3. COLLECTION VEHICLES (6 TN-38 Municipal Vehicles)
  // --------------------------------------------------------------------------
  console.log('3/10 Seeding Fleet Vehicles & Maintenance Logs...');
  const vehiclesData = [
    {
      registrationNumber: 'TN-38-BZ-4921',
      vehicleType: 'Compactor Truck',
      vehicleCategory: 'Heavy Duty',
      carryingCapacity: 4500,
      capacityUnit: 'kg',
      currentAssignedLoadKg: 2950,
      assignedWorkerId: driver1._id,
      assignedWorkerName: driver1.name,
      assignedWard: 'Ward 24',
      operationalStatus: 'In Service',
      lastMaintenanceDate: daysAgo(18),
      nextMaintenanceDate: daysFromNow(42),
      maintenanceRecords: [
        {
          date: daysAgo(18),
          type: 'Hydraulic Compactor Servicing',
          description: 'Replaced high-pressure hydraulic seals and verified rear tailgate safety lock.',
          technician: 'R. Balasubramaniam (CCMC Central Workshop)',
          status: 'Completed'
        },
        {
          date: daysAgo(75),
          type: 'Scheduled Inspection',
          description: 'Routine 10,000 km brake pad, emission, and GPS transponder check.',
          technician: 'S. Venkatesh',
          status: 'Completed'
        }
      ],
      notes: 'Primary West Zone heavy compactor serving RS Puram and DB Road commercial belt.',
      isActive: true
    },
    {
      registrationNumber: 'TN-38-CX-1102',
      vehicleType: 'Mini Tipper',
      vehicleCategory: 'Light Commercial',
      carryingCapacity: 1500,
      capacityUnit: 'kg',
      currentAssignedLoadKg: 1180,
      assignedWorkerId: driver2._id,
      assignedWorkerName: driver2.name,
      assignedWard: 'Ward 32',
      operationalStatus: 'Assigned',
      lastMaintenanceDate: daysAgo(12),
      nextMaintenanceDate: daysFromNow(48),
      maintenanceRecords: [
        {
          date: daysAgo(12),
          type: 'Dual-Compartment Partition Check',
          description: 'Inspected wet/dry segregation partition and hydraulic tipping cylinder.',
          technician: 'K. Arulmozhi',
          status: 'Completed'
        }
      ],
      notes: 'Dual-compartment doorstep collection tipper for Gandhipuram & Cross Cut Road.',
      isActive: true
    },
    {
      registrationNumber: 'TN-38-DF-7823',
      vehicleType: 'Organic Collection Truck',
      vehicleCategory: 'Medium Duty',
      carryingCapacity: 3000,
      capacityUnit: 'kg',
      currentAssignedLoadKg: 2680,
      assignedWorkerId: driver3._id,
      assignedWorkerName: driver3.name,
      assignedWard: 'Ward 38',
      operationalStatus: 'In Service',
      lastMaintenanceDate: daysAgo(25),
      nextMaintenanceDate: daysFromNow(15),
      maintenanceRecords: [
        {
          date: daysAgo(25),
          type: 'Leachate Tank Seal & Bio-Filter',
          description: 'Cleaned leachate containment sump and sanitized organic drum.',
          technician: 'R. Balasubramaniam',
          status: 'Completed'
        }
      ],
      notes: 'Dedicated biodegradable & market organic transit truck for Peelamedu & Avinashi Road.',
      isActive: true
    },
    {
      registrationNumber: 'TN-38-EA-3341',
      vehicleType: 'E-Cart / Battery Trike',
      vehicleCategory: 'Electric Utility',
      carryingCapacity: 600,
      capacityUnit: 'kg',
      currentAssignedLoadKg: 240,
      assignedWorkerId: driver4._id,
      assignedWorkerName: driver4.name,
      assignedWard: 'Ward 45',
      operationalStatus: 'Available',
      lastMaintenanceDate: daysAgo(7),
      nextMaintenanceDate: daysFromNow(53),
      maintenanceRecords: [
        {
          date: daysAgo(7),
          type: 'Lithium Battery Pack Diagnostics',
          description: 'Cell balancing and regenerative braking check completed at 98% SoH.',
          technician: 'M. Gowtham (EV Fleet Unit)',
          status: 'Completed'
        }
      ],
      notes: 'Zero-emission narrow-lane residential collector for Saibaba Colony.',
      isActive: true
    },
    {
      registrationNumber: 'TN-38-HAZ-009',
      vehicleType: 'Hazardous Waste Van',
      vehicleCategory: 'Specialised Hazmat',
      carryingCapacity: 1200,
      capacityUnit: 'kg',
      currentAssignedLoadKg: 420,
      assignedWorkerId: driver5._id,
      assignedWorkerName: driver5.name,
      assignedWard: 'Ward 54',
      operationalStatus: 'Available',
      lastMaintenanceDate: daysAgo(10),
      nextMaintenanceDate: daysFromNow(20),
      maintenanceRecords: [
        {
          date: daysAgo(10),
          type: 'Hazmat Containment & Spill Kit Audit',
          description: 'Verified UN-certified battery drums, fire suppression unit, and PPE kit.',
          technician: 'Dr. P. Natarajan (Safety Inspector)',
          status: 'Completed'
        }
      ],
      notes: 'Enclosed hazardous, biomedical, and e-waste transfer van.',
      isActive: true
    },
    {
      registrationNumber: 'TN-38-MRF-5510',
      vehicleType: 'Roll-Off Container Truck',
      vehicleCategory: 'Heavy Duty',
      carryingCapacity: 6000,
      capacityUnit: 'kg',
      currentAssignedLoadKg: 3100,
      assignedWorkerId: driver6._id,
      assignedWorkerName: driver6.name,
      assignedWard: 'Ward 81',
      operationalStatus: 'In Service',
      lastMaintenanceDate: daysAgo(30),
      nextMaintenanceDate: daysFromNow(30),
      maintenanceRecords: [
        {
          date: daysAgo(30),
          type: 'Winch Cable & Hook-Lift Inspection',
          description: 'Lubricated hook-lift boom and load-tested 6-tonne container lock.',
          technician: 'S. Venkatesh',
          status: 'Completed'
        }
      ],
      notes: 'Bulk secondary transfer truck linking Ukkadam MRF and Vellalore Integrated Plant.',
      isActive: true
    }
  ];

  const createdVehicles = {};
  for (const v of vehiclesData) {
    const vehDoc = await CollectionVehicle.findOneAndUpdate(
      { registrationNumber: v.registrationNumber },
      { $set: v },
      { upsert: true, new: true }
    );
    createdVehicles[v.registrationNumber] = vehDoc;
  }

  // --------------------------------------------------------------------------
  // 4. WARDS (10 Coimbatore Municipal Wards with Assigned Workers & Vehicles)
  // --------------------------------------------------------------------------
  console.log('4/10 Seeding 10 Coimbatore Municipal Wards...');
  const wardsData = [
    {
      wardNumber: 'Ward 24',
      wardName: 'RS Puram',
      zone: 'West Zone',
      localities: ['RS Puram', 'DB Road', 'Lawley Road', 'Lokamanya Street', 'TV Swamy Road'],
      collectionArea: 'RS Puram Commercial & Residential Grid (DB Road, East/West Periasamy Road)',
      boundaryAvailable: false,
      referenceCoordinates: { lat: 11.0086, lng: 76.9497 },
      assignedWorkers: [
        {
          workerId: driver1._id,
          name: driver1.name,
          phone: driver1.phone,
          shift: driver1.assignedShift
        }
      ],
      assignedVehicles: [
        {
          vehicleId: createdVehicles['TN-38-BZ-4921']._id,
          registrationNumber: 'TN-38-BZ-4921',
          vehicleType: 'Compactor Truck'
        }
      ],
      operationalStatus: 'Active',
      notes: 'High-compliance source segregation ward with daily commercial wet-waste rounds.'
    },
    {
      wardNumber: 'Ward 32',
      wardName: 'Gandhipuram',
      zone: 'Central Zone',
      localities: ['Gandhipuram', 'Cross Cut Road', '100 Feet Road', 'Tatabad', 'Ram Nagar'],
      collectionArea: 'Central Bus Terminus, Cross Cut Commercial Hub & Ram Nagar Residential Blocks',
      boundaryAvailable: false,
      referenceCoordinates: { lat: 11.0183, lng: 76.9691 },
      assignedWorkers: [
        {
          workerId: driver2._id,
          name: driver2.name,
          phone: driver2.phone,
          shift: driver2.assignedShift
        }
      ],
      assignedVehicles: [
        {
          vehicleId: createdVehicles['TN-38-CX-1102']._id,
          registrationNumber: 'TN-38-CX-1102',
          vehicleType: 'Mini Tipper'
        }
      ],
      operationalStatus: 'Active',
      notes: 'High-density commercial transit hub; twice-daily bin clearance scheduled.'
    },
    {
      wardNumber: 'Ward 38',
      wardName: 'Peelamedu',
      zone: 'East Zone',
      localities: ['Peelamedu', 'Hope College', 'Avinashi Road', 'PSG Tech Campus', 'Nava India'],
      collectionArea: 'Avinashi Road Corridor, Hope College Institutional Belt & Peelamedu Housing',
      boundaryAvailable: false,
      referenceCoordinates: { lat: 11.0285, lng: 77.0028 },
      assignedWorkers: [
        {
          workerId: driver3._id,
          name: driver3.name,
          phone: driver3.phone,
          shift: driver3.assignedShift
        }
      ],
      assignedVehicles: [
        {
          vehicleId: createdVehicles['TN-38-DF-7823']._id,
          registrationNumber: 'TN-38-DF-7823',
          vehicleType: 'Organic Collection Truck'
        }
      ],
      operationalStatus: 'Active',
      notes: 'Major institutional and residential ward with active e-waste and organic recovery.'
    },
    {
      wardNumber: 'Ward 45',
      wardName: 'Saibaba Colony',
      zone: 'West Zone',
      localities: ['Saibaba Colony', 'NSR Road', 'Alagesan Road', 'KK Pudur', 'Bharathi Park'],
      collectionArea: 'NSR Road Market, Bharathi Park & KK Pudur Residential Layouts',
      boundaryAvailable: false,
      referenceCoordinates: { lat: 11.0252, lng: 76.9421 },
      assignedWorkers: [
        {
          workerId: driver4._id,
          name: driver4.name,
          phone: driver4.phone,
          shift: driver4.assignedShift
        }
      ],
      assignedVehicles: [
        {
          vehicleId: createdVehicles['TN-38-EA-3341']._id,
          registrationNumber: 'TN-38-EA-3341',
          vehicleType: 'E-Cart / Battery Trike'
        }
      ],
      operationalStatus: 'Active',
      notes: 'Served by electric micro-collection fleet for quiet residential streets.'
    },
    {
      wardNumber: 'Ward 54',
      wardName: 'Singanallur',
      zone: 'East Zone',
      localities: ['Singanallur', 'Trichy Road', 'Kamaraj Road', 'Ondipudur West', 'Varadharajapuram'],
      collectionArea: 'Trichy Road Corridor, Singanallur Bus Stand & Farmers Market Cluster',
      boundaryAvailable: false,
      referenceCoordinates: { lat: 10.9995, lng: 77.0267 },
      assignedWorkers: [
        {
          workerId: driver5._id,
          name: driver5.name,
          phone: driver5.phone,
          shift: driver5.assignedShift
        }
      ],
      assignedVehicles: [
        {
          vehicleId: createdVehicles['TN-38-HAZ-009']._id,
          registrationNumber: 'TN-38-HAZ-009',
          vehicleType: 'Hazardous Waste Van'
        }
      ],
      operationalStatus: 'Active',
      notes: 'Includes Uzhavar Sandhai organic stream and Singanallur Lake eco-buffer zone.'
    },
    {
      wardNumber: 'Ward 62',
      wardName: 'Race Course',
      zone: 'Central Zone',
      localities: ['Race Course', 'Thomas Park', 'Collectorate', 'Gopalapuram', 'Red Fields'],
      collectionArea: 'Race Course Circular Walkway, Civic Institutional Zone & Gopalapuram',
      boundaryAvailable: false,
      referenceCoordinates: { lat: 11.0036, lng: 76.9762 },
      assignedWorkers: [
        {
          workerId: driver2._id,
          name: driver2.name,
          phone: driver2.phone,
          shift: driver2.assignedShift
        }
      ],
      assignedVehicles: [
        {
          vehicleId: createdVehicles['TN-38-CX-1102']._id,
          registrationNumber: 'TN-38-CX-1102',
          vehicleType: 'Mini Tipper'
        }
      ],
      operationalStatus: 'Active',
      notes: 'Model green corridor with zero-litter boulevard monitoring and leaf composting.'
    },
    {
      wardNumber: 'Ward 72',
      wardName: 'Town Hall',
      zone: 'Central Zone',
      localities: ['Town Hall', 'Big Bazaar Street', 'Raja Street', 'Oppanakara Street', 'Kempatty Colony'],
      collectionArea: 'Heritage Market Core, Big Bazaar Street & CCMC Headquarters Precinct',
      boundaryAvailable: false,
      referenceCoordinates: { lat: 11.0018, lng: 76.9628 },
      assignedWorkers: [
        {
          workerId: driver1._id,
          name: driver1.name,
          phone: driver1.phone,
          shift: driver1.assignedShift
        }
      ],
      assignedVehicles: [
        {
          vehicleId: createdVehicles['TN-38-BZ-4921']._id,
          registrationNumber: 'TN-38-BZ-4921',
          vehicleType: 'Compactor Truck'
        }
      ],
      operationalStatus: 'Active',
      notes: 'High-volume packaging, cardboard, and textile market waste stream.'
    },
    {
      wardNumber: 'Ward 81',
      wardName: 'Ukkadam',
      zone: 'South Zone',
      localities: ['Ukkadam', 'Valankulam Lake', 'Sungam Bypass', 'Karumbukadai', 'Kottaimedu'],
      collectionArea: 'Ukkadam Wholesale Market, Valankulam Lakefront & Sungam Transfer Point',
      boundaryAvailable: false,
      referenceCoordinates: { lat: 10.9905, lng: 76.9614 },
      assignedWorkers: [
        {
          workerId: driver6._id,
          name: driver6.name,
          phone: driver6.phone,
          shift: driver6.assignedShift
        }
      ],
      assignedVehicles: [
        {
          vehicleId: createdVehicles['TN-38-MRF-5510']._id,
          registrationNumber: 'TN-38-MRF-5510',
          vehicleType: 'Roll-Off Container Truck'
        }
      ],
      operationalStatus: 'Active',
      notes: 'Wholesale vegetable & fish market organic recovery and MRF sorting hub.'
    },
    {
      wardNumber: 'Ward 90',
      wardName: 'Podanur',
      zone: 'South Zone',
      localities: ['Podanur', 'Kurichi', 'Sundarapuram', 'Pollachi Main Road', 'GD Tank'],
      collectionArea: 'Podanur Railway Colony, Sundarapuram Junction & Kurichi Industrial Cluster',
      boundaryAvailable: false,
      referenceCoordinates: { lat: 10.9622, lng: 76.9765 },
      assignedWorkers: [
        {
          workerId: driver6._id,
          name: driver6.name,
          phone: driver6.phone,
          shift: driver6.assignedShift
        }
      ],
      assignedVehicles: [
        {
          vehicleId: createdVehicles['TN-38-MRF-5510']._id,
          registrationNumber: 'TN-38-MRF-5510',
          vehicleType: 'Roll-Off Container Truck'
        }
      ],
      operationalStatus: 'Active',
      notes: 'Southern municipal gateway covering residential layouts and small foundry units.'
    },
    {
      wardNumber: 'Ward 18',
      wardName: 'Saravanampatti',
      zone: 'North Zone',
      localities: ['Saravanampatti', 'Kalapatti', 'CHIL SEZ IT Park', 'Sathy Road', 'Chinnavedampatti'],
      collectionArea: 'Sathy Road IT Corridor, CHIL SEZ Tech Parks & High-Rise Gated Communities',
      boundaryAvailable: false,
      referenceCoordinates: { lat: 11.0764, lng: 77.0012 },
      assignedWorkers: [
        {
          workerId: driver3._id,
          name: driver3.name,
          phone: driver3.phone,
          shift: driver3.assignedShift
        }
      ],
      assignedVehicles: [
        {
          vehicleId: createdVehicles['TN-38-DF-7823']._id,
          registrationNumber: 'TN-38-DF-7823',
          vehicleType: 'Organic Collection Truck'
        }
      ],
      operationalStatus: 'Active',
      notes: 'Rapidly growing IT & residential hub with bulk apartment recyclable pickups.'
    }
  ];

  const createdWards = {};
  for (const w of wardsData) {
    const wardDoc = await Ward.findOneAndUpdate(
      { wardNumber: w.wardNumber },
      { $set: w },
      { upsert: true, new: true }
    );
    createdWards[w.wardNumber] = wardDoc;
  }

  // --------------------------------------------------------------------------
  // 5. RECYCLING CENTRES & DISPOSAL FACILITIES (8 Verified Facilities)
  // --------------------------------------------------------------------------
  console.log('5/10 Seeding Recycling Centres & Safe Disposal Facilities...');
  const facilitiesData = [
    {
      name: 'Vellalore Integrated Solid Waste & Bio-Compost Plant',
      address: 'Chettipalayam Road, Vellalore, Coimbatore, Tamil Nadu 641111',
      locality: 'Vellalore',
      ward: 'Ward 90',
      centreType: 'Composting',
      facilityCategory: 'Disposal Facility',
      isDisposalFacility: true,
      acceptedMaterials: ['Organic', 'Plastic', 'Paper', 'Glass', 'Metal'],
      materials: ['Organic', 'Plastic', 'Recyclable', 'Metal', 'Glass'],
      operatingHours: '06:00 AM - 10:00 PM (Daily)',
      hours: '06:00 AM - 10:00 PM (Daily)',
      contactPhone: '+91 422 267 4100',
      phone: '+91 422 267 4100',
      contactPerson: 'Er. K. Sivakumar (Chief Plant Engineer)',
      email: 'vellalore.plant@ccmc.gov.in',
      verificationStatus: 'Verified Municipal Facility',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 650,
      handlingNotes: 'Central CCMC windrow composting, vermicomposting, and RDF recovery plant.',
      location: { type: 'Point', coordinates: [77.0124, 10.9612] },
      coordinates: { lat: 10.9612, lng: 77.0124 },
      rating: 4.8,
      verified: true,
      isActive: true
    },
    {
      name: 'RS Puram Micro-Composting & Dry Waste Centre (DWCC)',
      address: '72 Cowley Brown Road, RS Puram, Coimbatore, Tamil Nadu 641002',
      locality: 'RS Puram',
      ward: 'Ward 24',
      centreType: 'Dry Waste Collection Centre',
      facilityCategory: 'Recycling Centre',
      isDisposalFacility: false,
      acceptedMaterials: ['Plastic', 'Paper', 'Glass', 'Metal', 'Organic'],
      materials: ['Plastic', 'Recyclable', 'Glass', 'Metal', 'Organic'],
      operatingHours: '07:00 AM - 07:00 PM (Mon-Sat)',
      hours: '07:00 AM - 07:00 PM (Mon-Sat)',
      contactPhone: '+91 422 254 8812',
      phone: '+91 422 254 8812',
      contactPerson: 'Smt. Banumathi R (Ward Supervisor)',
      email: 'rspuram.dwcc@wastewise.org',
      verificationStatus: 'Verified Municipal Facility',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 18,
      handlingNotes: 'Accepts clean dry recyclables and operates 12 aerobic organic compost pits.',
      location: { type: 'Point', coordinates: [76.9497, 11.0086] },
      coordinates: { lat: 11.0086, lng: 76.9497 },
      rating: 4.9,
      verified: true,
      isActive: true
    },
    {
      name: 'Peelamedu E-Waste & Battery SafeDrop Facility',
      address: '410 Avinashi Road, Near Hope College, Peelamedu, Coimbatore 641004',
      locality: 'Peelamedu',
      ward: 'Ward 38',
      centreType: 'E-Waste',
      facilityCategory: 'Disposal Facility',
      isDisposalFacility: true,
      acceptedMaterials: ['E-Waste', 'Battery', 'Metal', 'Glass'],
      materials: ['Electronic', 'Metal', 'Glass'],
      operatingHours: '09:00 AM - 06:30 PM (Mon-Sat)',
      hours: '09:00 AM - 06:30 PM (Mon-Sat)',
      contactPhone: '+91 422 257 3390',
      phone: '+91 422 257 3390',
      contactPerson: 'Arunachalam P (TNPCB Authorised Handler)',
      email: 'ewaste.peelamedu@wastewise.org',
      verificationStatus: 'Authorised Partner',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 12,
      handlingNotes: 'TNPCB-certified dismantling of circuit boards, lithium batteries, and CRT/LED monitors.',
      location: { type: 'Point', coordinates: [77.0028, 11.0285] },
      coordinates: { lat: 11.0285, lng: 77.0028 },
      rating: 4.7,
      verified: true,
      isActive: true
    },
    {
      name: 'Ukkadam Material Recovery Facility (MRF)',
      address: 'Sungam Bypass Road, Near Valankulam, Ukkadam, Coimbatore 641001',
      locality: 'Ukkadam',
      ward: 'Ward 81',
      centreType: 'Material Recovery Facility',
      facilityCategory: 'Recycling Centre',
      isDisposalFacility: false,
      acceptedMaterials: ['Plastic', 'Paper', 'Glass', 'Metal', 'Textiles'],
      materials: ['Plastic', 'Recyclable', 'Glass', 'Metal'],
      operatingHours: '06:30 AM - 08:00 PM (Daily)',
      hours: '06:30 AM - 08:00 PM (Daily)',
      contactPhone: '+91 422 239 5501',
      phone: '+91 422 239 5501',
      contactPerson: 'M. Ibrahim (MRF Operations Lead)',
      email: 'ukkadam.mrf@ccmc.gov.in',
      verificationStatus: 'Verified Municipal Facility',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 45,
      handlingNotes: 'Conveyor sorting and hydraulic baling for PET, HDPE, corrugated cardboard, and scrap metal.',
      location: { type: 'Point', coordinates: [76.9614, 10.9905] },
      coordinates: { lat: 10.9905, lng: 76.9614 },
      rating: 4.6,
      verified: true,
      isActive: true
    },
    {
      name: 'Saibaba Colony Polymer & Plastic Recovery Unit',
      address: '18 Mettupalayam Road Service Lane, Saibaba Colony, Coimbatore 641011',
      locality: 'Saibaba Colony',
      ward: 'Ward 45',
      centreType: 'Plastic Recovery Unit',
      facilityCategory: 'Recycling Centre',
      isDisposalFacility: false,
      acceptedMaterials: ['Plastic', 'Paper', 'Metal'],
      materials: ['Plastic', 'Recyclable', 'Metal'],
      operatingHours: '08:00 AM - 06:00 PM (Mon-Sat)',
      hours: '08:00 AM - 06:00 PM (Mon-Sat)',
      contactPhone: '+91 422 244 7120',
      phone: '+91 422 244 7120',
      contactPerson: 'G. Shanmugam',
      email: 'saibaba.polymer@wastewise.org',
      verificationStatus: 'Authorised Partner',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 15,
      handlingNotes: 'Washing, flaking, and pelletizing of segregated household plastics.',
      location: { type: 'Point', coordinates: [76.9421, 11.0252] },
      coordinates: { lat: 11.0252, lng: 76.9421 },
      rating: 4.7,
      verified: true,
      isActive: true
    },
    {
      name: 'Singanallur Hazardous & Bio-Medical Safe Treatment Unit',
      address: 'Neelikonampalayam Link Road, Singanallur, Coimbatore 641005',
      locality: 'Singanallur',
      ward: 'Ward 54',
      centreType: 'Medical Waste Collection',
      facilityCategory: 'Disposal Facility',
      isDisposalFacility: true,
      acceptedMaterials: ['Medical', 'Hazardous', 'Battery'],
      materials: ['Medical', 'Electronic'],
      operatingHours: '08:00 AM - 08:00 PM (Daily)',
      hours: '08:00 AM - 08:00 PM (Daily)',
      contactPhone: '+91 422 259 1900',
      phone: '+91 422 259 1900',
      contactPerson: 'Dr. R.jayakumar (Bio-Safety Officer)',
      email: 'hazmat.singanallur@wastewise.org',
      verificationStatus: 'Verified Municipal Facility',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 10,
      handlingNotes: 'Autoclave sterilization and safe hazardous chemical/sanitary encapsulation.',
      location: { type: 'Point', coordinates: [77.0267, 10.9995] },
      coordinates: { lat: 10.9995, lng: 77.0267 },
      rating: 4.8,
      verified: true,
      isActive: true
    },
    {
      name: 'Gandhipuram Central Paper, Glass & Metal Aggregator',
      address: '100 Feet Road, 6th Cross, Gandhipuram, Coimbatore 641012',
      locality: 'Gandhipuram',
      ward: 'Ward 32',
      centreType: 'Paper & Glass Drop-off',
      facilityCategory: 'Recycling Centre',
      isDisposalFacility: false,
      acceptedMaterials: ['Paper', 'Glass', 'Metal', 'Plastic'],
      materials: ['Recyclable', 'Glass', 'Metal', 'Plastic'],
      operatingHours: '08:30 AM - 07:30 PM (Mon-Sat)',
      hours: '08:30 AM - 07:30 PM (Mon-Sat)',
      contactPhone: '+91 422 249 6621',
      phone: '+91 422 249 6621',
      contactPerson: 'S. Natarajan',
      email: 'gandhipuram.recycle@wastewise.org',
      verificationStatus: 'Authorised Partner',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 22,
      handlingNotes: 'Weigh-and-reward drop-off point for office paper, carton boxes, glass cullet, and tin cans.',
      location: { type: 'Point', coordinates: [76.9691, 11.0183] },
      coordinates: { lat: 11.0183, lng: 76.9691 },
      rating: 4.6,
      verified: true,
      isActive: true
    },
    {
      name: 'Saravanampatti IT Corridor E-Waste & Battery Recovery Hub',
      address: 'CHIL SEZ Road, Saravanampatti, Coimbatore 641035',
      locality: 'Saravanampatti',
      ward: 'Ward 18',
      centreType: 'Battery Disposal',
      facilityCategory: 'Disposal Facility',
      isDisposalFacility: true,
      acceptedMaterials: ['E-Waste', 'Battery', 'Metal', 'Plastic'],
      materials: ['Electronic', 'Metal', 'Plastic'],
      operatingHours: '09:00 AM - 06:00 PM (Mon-Sat)',
      hours: '09:00 AM - 06:00 PM (Mon-Sat)',
      contactPhone: '+91 422 266 8400',
      phone: '+91 422 266 8400',
      contactPerson: 'Deepak Krishnan',
      email: 'saravanampatti.ewaste@wastewise.org',
      verificationStatus: 'Authorised Partner',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 14,
      handlingNotes: 'Specialised IT park e-waste, UPS battery, and server rack recycling facility.',
      location: { type: 'Point', coordinates: [77.0012, 11.0764] },
      coordinates: { lat: 11.0764, lng: 77.0012 },
      rating: 4.8,
      verified: true,
      isActive: true
    }
  ];

  const createdCentres = {};
  for (const f of facilitiesData) {
    const centreDoc = await RecyclingCentre.findOneAndUpdate(
      { name: f.name },
      { $set: f },
      { upsert: true, new: true }
    );
    createdCentres[f.name] = centreDoc;
  }

  // --------------------------------------------------------------------------
  // 6. COLLECTION SCHEDULES (6 Zone & Ward Curbside Schedules)
  // --------------------------------------------------------------------------
  console.log('6/10 Seeding Municipal Curbside Collection Schedules...');
  const schedulesData = [
    {
      title: 'West Zone Morning Wet & Dry Curbside Sweep (RS Puram)',
      zone: 'West Zone (RS Puram & DB Road)',
      ward: 'Ward 24',
      collectionType: 'Organic & Recyclable',
      wasteTypes: ['Organic', 'Recyclable', 'Plastic'],
      categories: ['Organic', 'Recyclable', 'Plastic'],
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      date: daysFromNow(1),
      startTime: '06:30',
      endTime: '09:30',
      timeWindow: '06:30 AM - 09:30 AM (IST)',
      driverId: driver1._id,
      driverName: driver1.name,
      assignedDriver: driver1.name,
      vehicleObjectId: createdVehicles['TN-38-BZ-4921']._id,
      vehiclePlate: 'TN-38-BZ-4921',
      vehicleId: 'TN-38-BZ-4921',
      status: 'Upcoming',
      isPublished: true,
      notes: 'Keep green (wet) and blue (dry) bins separated at household gate before 06:30 AM.'
    },
    {
      title: 'Central Zone Commercial & Residential Round (Gandhipuram & Race Course)',
      zone: 'Central Zone (Gandhipuram & Race Course)',
      ward: 'Ward 32',
      collectionType: 'Plastic, Paper & Packaging',
      wasteTypes: ['Plastic', 'Recyclable', 'Glass', 'Metal'],
      categories: ['Plastic', 'Recyclable', 'Glass', 'Metal'],
      days: ['Monday', 'Wednesday', 'Friday'],
      date: daysFromNow(1),
      startTime: '07:00',
      endTime: '10:30',
      timeWindow: '07:00 AM - 10:30 AM (IST)',
      driverId: driver2._id,
      driverName: driver2.name,
      assignedDriver: driver2.name,
      vehicleObjectId: createdVehicles['TN-38-CX-1102']._id,
      vehiclePlate: 'TN-38-CX-1102',
      vehicleId: 'TN-38-CX-1102',
      status: 'Upcoming',
      isPublished: true,
      notes: 'Covers Cross Cut Road commercial establishments and Race Course residential avenues.'
    },
    {
      title: 'East Zone Avinashi Road & Peelamedu Biodegradable Collection',
      zone: 'East Zone (Peelamedu & Hope College)',
      ward: 'Ward 38',
      collectionType: 'Organic & Garden Waste',
      wasteTypes: ['Organic', 'Recyclable'],
      categories: ['Organic', 'Recyclable'],
      days: ['Tuesday', 'Thursday', 'Saturday'],
      date: daysFromNow(2),
      startTime: '06:00',
      endTime: '09:00',
      timeWindow: '06:00 AM - 09:00 AM (IST)',
      driverId: driver3._id,
      driverName: driver3.name,
      assignedDriver: driver3.name,
      vehicleObjectId: createdVehicles['TN-38-DF-7823']._id,
      vehiclePlate: 'TN-38-DF-7823',
      vehicleId: 'TN-38-DF-7823',
      status: 'Upcoming',
      isPublished: true,
      notes: 'Direct transfer to Vellalore Bio-Compost facility.'
    },
    {
      title: 'Saibaba Colony Zero-Emission EV Residential Sweep',
      zone: 'West Zone (Saibaba Colony & KK Pudur)',
      ward: 'Ward 45',
      collectionType: 'Segregated Household Waste',
      wasteTypes: ['Organic', 'Plastic', 'Recyclable', 'Glass'],
      categories: ['Organic', 'Plastic', 'Recyclable', 'Glass'],
      days: ['Monday', 'Wednesday', 'Friday'],
      date: daysFromNow(2),
      startTime: '14:30',
      endTime: '17:30',
      timeWindow: '02:30 PM - 05:30 PM (IST)',
      driverId: driver4._id,
      driverName: driver4.name,
      assignedDriver: driver4.name,
      vehicleObjectId: createdVehicles['TN-38-EA-3341']._id,
      vehiclePlate: 'TN-38-EA-3341',
      vehicleId: 'TN-38-EA-3341',
      status: 'Upcoming',
      isPublished: true,
      notes: 'Electric trike door-to-door collection for interior residential lanes.'
    },
    {
      title: 'East & North Zone Special E-Waste & Hazardous Safe Pickup',
      zone: 'East Zone (Singanallur & Saravanampatti)',
      ward: 'Ward 54',
      collectionType: 'E-Waste & Domestic Hazardous',
      wasteTypes: ['Electronic', 'Medical', 'Metal'],
      categories: ['Electronic', 'Medical', 'Metal'],
      days: ['Saturday'],
      date: daysFromNow(3),
      startTime: '09:00',
      endTime: '13:00',
      timeWindow: '09:00 AM - 01:00 PM (IST)',
      driverId: driver5._id,
      driverName: driver5.name,
      assignedDriver: driver5.name,
      vehicleObjectId: createdVehicles['TN-38-HAZ-009']._id,
      vehiclePlate: 'TN-38-HAZ-009',
      vehicleId: 'TN-38-HAZ-009',
      status: 'Upcoming',
      isPublished: true,
      notes: 'Hand over batteries, expired medicines, and electronics in sealed bags directly to hazmat crew.'
    },
    {
      title: 'South Zone Bulk Market & MRF Recovery Sweep (Ukkadam & Podanur)',
      zone: 'South Zone (Ukkadam & Podanur)',
      ward: 'Ward 81',
      collectionType: 'Bulk Organic & Recyclables',
      wasteTypes: ['Organic', 'Plastic', 'Recyclable', 'Metal'],
      categories: ['Organic', 'Plastic', 'Recyclable', 'Metal'],
      days: ['Tuesday', 'Thursday', 'Saturday'],
      date: daysFromNow(1),
      startTime: '06:00',
      endTime: '10:00',
      timeWindow: '06:00 AM - 10:00 AM (IST)',
      driverId: driver6._id,
      driverName: driver6.name,
      assignedDriver: driver6.name,
      vehicleObjectId: createdVehicles['TN-38-MRF-5510']._id,
      vehiclePlate: 'TN-38-MRF-5510',
      vehicleId: 'TN-38-MRF-5510',
      status: 'Upcoming',
      isPublished: true,
      notes: 'High-capacity container collection from Ukkadam market and Podanur junction.'
    }
  ];

  for (const s of schedulesData) {
    await CollectionSchedule.findOneAndUpdate(
      { title: s.title },
      { $set: s },
      { upsert: true, new: true }
    );
  }

  // --------------------------------------------------------------------------
  // 7. WASTE REPORTS / PICKUP REQUESTS (22 Reports across 6 Months & All 10 Wards)
  // --------------------------------------------------------------------------
  console.log('7/10 Seeding 22 Pickup Requests across 6 months, 7 categories & 10 wards...');
  const reportsData = [
    // --- CURRENT MONTH ACTIVE & COMPLETED REQUESTS ---
    {
      trackingId: 'WW-CBE-2001',
      citizen: { userId: demoCitizen._id, name: demoCitizen.name, phone: demoCitizen.phone, email: demoCitizen.email },
      category: 'Plastic',
      wasteCategory: 'Plastic',
      subCategory: 'PET Bottles & Rigid Containers',
      quantity: 18,
      unit: 'kg',
      estimatedWeightKg: 18,
      description: 'Clean, rinsed PET water bottles and HDPE detergent containers bundled for recycling.',
      ward: 'Ward 32',
      locality: 'Gandhipuram',
      location: {
        address: '42 Cross Cut Road, Gandhipuram, Coimbatore 641012',
        ward: 'Ward 32',
        locality: 'Gandhipuram',
        coordinates: { lat: 11.0183, lng: 76.9691 }
      },
      scheduledDate: daysAgo(1),
      timeSlot: '09:00 AM - 12:00 PM',
      status: 'Recycled',
      priority: 'Normal',
      assignedDriver: {
        driverId: driver2._id,
        name: driver2.name,
        phone: driver2.phone,
        vehicleId: createdVehicles['TN-38-CX-1102']._id,
        vehiclePlate: 'TN-38-CX-1102'
      },
      ecoPointsAwarded: 270,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(0, -2),
      completedAt: daysAgo(0, -2),
      createdAt: daysAgo(1, -5),
      timeline: [
        { status: 'Reported', timestamp: daysAgo(1, -5), note: 'Submitted via Citizen Portal' },
        { status: 'Confirmed', timestamp: daysAgo(1, -4), note: 'Verified by CCMC Supervisor' },
        { status: 'Assigned', timestamp: daysAgo(1, -3), note: 'Assigned to Senthil Nathan (TN-38-CX-1102)' },
        { status: 'Collected', timestamp: daysAgo(0, -3), note: 'Weighed 18 kg at doorstep; 270 Eco-Points awarded' },
        { status: 'Recycled', timestamp: daysAgo(0, -2), note: 'Processed at Gandhipuram Central Aggregator' }
      ]
    },
    {
      trackingId: 'WW-CBE-2002',
      citizen: { userId: priyaCitizen._id, name: priyaCitizen.name, phone: priyaCitizen.phone, email: priyaCitizen.email },
      category: 'Organic',
      wasteCategory: 'Organic',
      subCategory: 'Kitchen & Garden Foliage',
      quantity: 26,
      unit: 'kg',
      estimatedWeightKg: 26,
      description: 'Segregated vegetable trimmings, coconut shells, and pruned garden leaves.',
      ward: 'Ward 24',
      locality: 'RS Puram',
      location: {
        address: '15 DB Road, RS Puram, Coimbatore 641002',
        ward: 'Ward 24',
        locality: 'RS Puram',
        coordinates: { lat: 11.0086, lng: 76.9497 }
      },
      scheduledDate: daysAgo(0),
      timeSlot: '06:30 AM - 09:30 AM',
      status: 'Collected',
      priority: 'Normal',
      assignedDriver: {
        driverId: driver1._id,
        name: driver1.name,
        phone: driver1.phone,
        vehicleId: createdVehicles['TN-38-BZ-4921']._id,
        vehiclePlate: 'TN-38-BZ-4921'
      },
      ecoPointsAwarded: 260,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(0, -1),
      completedAt: daysAgo(0, -1),
      createdAt: daysAgo(1, -2),
      timeline: [
        { status: 'Reported', timestamp: daysAgo(1, -2), note: 'Morning wet-waste request logged' },
        { status: 'Confirmed', timestamp: daysAgo(1, -1), note: 'Confirmed for Ward 24 morning sweep' },
        { status: 'Collected', timestamp: daysAgo(0, -1), note: 'Collected 26 kg by Karthik Raja; delivered to RS Puram DWCC' }
      ]
    },
    {
      trackingId: 'WW-CBE-2003',
      citizen: { userId: manojCitizen._id, name: manojCitizen.name, phone: manojCitizen.phone, email: manojCitizen.email },
      category: 'Electronic',
      wasteCategory: 'Electronic',
      subCategory: 'Old Monitors, UPS & Circuit Boards',
      quantity: 14,
      unit: 'kg',
      estimatedWeightKg: 14,
      description: '2 decommissioned LED monitors, 1 desktop UPS unit, and assorted power cables.',
      ward: 'Ward 38',
      locality: 'Peelamedu',
      location: {
        address: '88 Avinashi Road, Peelamedu, Coimbatore 641004',
        ward: 'Ward 38',
        locality: 'Peelamedu',
        coordinates: { lat: 11.0285, lng: 77.0028 }
      },
      scheduledDate: daysFromNow(1),
      timeSlot: '09:00 AM - 12:00 PM',
      status: 'In Progress',
      priority: 'High',
      assignedDriver: {
        driverId: driver3._id,
        name: driver3.name,
        phone: driver3.phone,
        vehicleId: createdVehicles['TN-38-DF-7823']._id,
        vehiclePlate: 'TN-38-DF-7823'
      },
      ecoPointsAwarded: 0,
      pointsAwarded: false,
      createdAt: daysAgo(0, -6),
      timeline: [
        { status: 'Reported', timestamp: daysAgo(0, -6), note: 'E-waste safe pickup requested' },
        { status: 'Confirmed', timestamp: daysAgo(0, -5), note: 'Approved for Peelamedu E-Waste SafeDrop transfer' },
        { status: 'Assigned', timestamp: daysAgo(0, -4), note: 'Assigned to Murugan K (TN-38-DF-7823)' },
        { status: 'In Progress', timestamp: daysAgo(0, -1), note: 'Collection crew en route on Avinashi Road' }
      ]
    },
    {
      trackingId: 'WW-CBE-2004',
      citizen: { userId: kavithaCitizen._id, name: kavithaCitizen.name, phone: kavithaCitizen.phone, email: kavithaCitizen.email },
      category: 'Glass',
      wasteCategory: 'Glass',
      subCategory: 'Clean Glass Jars & Bottles',
      quantity: 12,
      unit: 'kg',
      estimatedWeightKg: 12,
      description: 'Sorted amber and clear glass condiment jars packed safely in crate.',
      ward: 'Ward 45',
      locality: 'Saibaba Colony',
      location: {
        address: '24 NSR Road, Saibaba Colony, Coimbatore 641011',
        ward: 'Ward 45',
        locality: 'Saibaba Colony',
        coordinates: { lat: 11.0252, lng: 76.9421 }
      },
      scheduledDate: daysFromNow(1),
      timeSlot: '02:00 PM - 05:00 PM',
      status: 'Assigned',
      priority: 'Normal',
      assignedDriver: {
        driverId: driver4._id,
        name: driver4.name,
        phone: driver4.phone,
        vehicleId: createdVehicles['TN-38-EA-3341']._id,
        vehiclePlate: 'TN-38-EA-3341'
      },
      ecoPointsAwarded: 0,
      pointsAwarded: false,
      createdAt: daysAgo(0, -8),
      timeline: [
        { status: 'Reported', timestamp: daysAgo(0, -8), note: 'Submitted via Citizen Portal' },
        { status: 'Confirmed', timestamp: daysAgo(0, -6), note: 'Verified glass batch' },
        { status: 'Assigned', timestamp: daysAgo(0, -3), note: 'Assigned to Rajesh Kannan (TN-38-EA-3341)' }
      ]
    },
    {
      trackingId: 'WW-CBE-2005',
      citizen: { userId: dineshCitizen._id, name: dineshCitizen.name, phone: dineshCitizen.phone, email: dineshCitizen.email },
      category: 'Medical',
      wasteCategory: 'Medical',
      subCategory: 'Domestic Sanitary & Expired Medicines',
      quantity: 6,
      unit: 'kg',
      estimatedWeightKg: 6,
      description: 'Sealed yellow/red domestic biomedical pouch containing expired blister packs.',
      ward: 'Ward 54',
      locality: 'Singanallur',
      location: {
        address: '102 Trichy Road, Singanallur, Coimbatore 641005',
        ward: 'Ward 54',
        locality: 'Singanallur',
        coordinates: { lat: 10.9995, lng: 77.0267 }
      },
      scheduledDate: daysFromNow(1),
      timeSlot: '09:00 AM - 12:00 PM',
      status: 'Confirmed',
      priority: 'Urgent',
      assignedDriver: {
        driverId: driver5._id,
        name: driver5.name,
        phone: driver5.phone,
        vehicleId: createdVehicles['TN-38-HAZ-009']._id,
        vehiclePlate: 'TN-38-HAZ-009'
      },
      ecoPointsAwarded: 0,
      pointsAwarded: false,
      createdAt: daysAgo(0, -4),
      timeline: [
        { status: 'Reported', timestamp: daysAgo(0, -4), note: 'Urgent domestic hazmat pickup logged' },
        { status: 'Confirmed', timestamp: daysAgo(0, -2), note: 'Cleared for Singanallur Hazmat Van TN-38-HAZ-009' }
      ]
    },
    {
      trackingId: 'WW-CBE-2006',
      citizen: { userId: meenakshiCitizen._id, name: meenakshiCitizen.name, phone: meenakshiCitizen.phone, email: meenakshiCitizen.email },
      category: 'Recyclable',
      wasteCategory: 'Recyclable',
      subCategory: 'Corrugated Cardboard & Office Paper',
      quantity: 22,
      unit: 'kg',
      estimatedWeightKg: 22,
      description: 'Flattened carton boxes and bundled newspapers from Race Course welfare association.',
      ward: 'Ward 62',
      locality: 'Race Course',
      location: {
        address: '19 Race Course Scheme Road, Coimbatore 641018',
        ward: 'Ward 62',
        locality: 'Race Course',
        coordinates: { lat: 11.0036, lng: 76.9762 }
      },
      scheduledDate: daysFromNow(1),
      timeSlot: '09:00 AM - 12:00 PM',
      status: 'Reported',
      priority: 'Normal',
      ecoPointsAwarded: 0,
      pointsAwarded: false,
      createdAt: daysAgo(0, -3),
      timeline: [
        { status: 'Reported', timestamp: daysAgo(0, -3), note: 'Awaiting dispatcher confirmation' }
      ]
    },
    {
      trackingId: 'WW-CBE-2007',
      citizen: { userId: vigneshCitizen._id, name: vigneshCitizen.name, phone: vigneshCitizen.phone, email: vigneshCitizen.email },
      category: 'Metal',
      wasteCategory: 'Metal',
      subCategory: 'Aluminium Cans & Mild Steel Scrap',
      quantity: 16,
      unit: 'kg',
      estimatedWeightKg: 16,
      description: 'Clean beverage cans, steel shelving brackets, and kitchen utensils.',
      ward: 'Ward 18',
      locality: 'Saravanampatti',
      location: {
        address: '55 Sathy Road, Saravanampatti, Coimbatore 641035',
        ward: 'Ward 18',
        locality: 'Saravanampatti',
        coordinates: { lat: 11.0764, lng: 77.0012 }
      },
      scheduledDate: daysFromNow(2),
      timeSlot: '10:00 AM - 01:00 PM',
      status: 'Confirmed',
      priority: 'Normal',
      ecoPointsAwarded: 0,
      pointsAwarded: false,
      createdAt: daysAgo(0, -5),
      timeline: [
        { status: 'Reported', timestamp: daysAgo(0, -5), note: 'Metal scrap pickup requested' },
        { status: 'Confirmed', timestamp: daysAgo(0, -2), note: 'Verified weight and location' }
      ]
    },
    // Overdue Request (scheduled 2 days ago, still in Confirmed state so Alert banner highlights it)
    {
      trackingId: 'WW-CBE-2008',
      citizen: { userId: demoCitizen._id, name: demoCitizen.name, phone: demoCitizen.phone, email: demoCitizen.email },
      category: 'Recyclable',
      wasteCategory: 'Recyclable',
      subCategory: 'Bulk Packaging Cartons',
      quantity: 30,
      unit: 'kg',
      estimatedWeightKg: 30,
      description: 'Commercial packaging cartons from Big Bazaar Street retail outlet.',
      ward: 'Ward 72',
      locality: 'Town Hall',
      location: {
        address: '112 Big Bazaar Street, Town Hall, Coimbatore 641001',
        ward: 'Ward 72',
        locality: 'Town Hall',
        coordinates: { lat: 11.0018, lng: 76.9628 }
      },
      scheduledDate: daysAgo(2),
      timeSlot: '09:00 AM - 12:00 PM',
      status: 'Confirmed',
      priority: 'High',
      ecoPointsAwarded: 0,
      pointsAwarded: false,
      createdAt: daysAgo(3),
      timeline: [
        { status: 'Reported', timestamp: daysAgo(3), note: 'Submitted for Town Hall commercial zone' },
        { status: 'Confirmed', timestamp: daysAgo(2, -4), note: 'Confirmed; awaiting compactor slot' }
      ]
    },
    {
      trackingId: 'WW-CBE-2009',
      citizen: { userId: lakshmiCitizen._id, name: lakshmiCitizen.name, phone: lakshmiCitizen.phone, email: lakshmiCitizen.email },
      category: 'Organic',
      wasteCategory: 'Organic',
      subCategory: 'Market Vegetable Residue',
      quantity: 40,
      unit: 'kg',
      estimatedWeightKg: 40,
      description: 'Segregated banana stems, flower waste, and leafy greens for composting.',
      ward: 'Ward 81',
      locality: 'Ukkadam',
      location: {
        address: '18 Sungam Bypass Road, Ukkadam, Coimbatore 641001',
        ward: 'Ward 81',
        locality: 'Ukkadam',
        coordinates: { lat: 10.9905, lng: 76.9614 }
      },
      scheduledDate: daysAgo(2),
      timeSlot: '06:30 AM - 09:30 AM',
      status: 'Recycled',
      priority: 'Normal',
      assignedDriver: {
        driverId: driver6._id,
        name: driver6.name,
        phone: driver6.phone,
        vehicleId: createdVehicles['TN-38-MRF-5510']._id,
        vehiclePlate: 'TN-38-MRF-5510'
      },
      ecoPointsAwarded: 400,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(2, 3),
      completedAt: daysAgo(2, 3),
      createdAt: daysAgo(2, -2),
      timeline: [
        { status: 'Reported', timestamp: daysAgo(2, -2), note: 'Logged from Ukkadam market cluster' },
        { status: 'Collected', timestamp: daysAgo(2, 2), note: 'Collected by Prakash Velu (TN-38-MRF-5510)' },
        { status: 'Recycled', timestamp: daysAgo(2, 3), note: 'Composted at Vellalore Integrated Plant' }
      ]
    },
    {
      trackingId: 'WW-CBE-2010',
      citizen: { userId: lakshmiCitizen._id, name: lakshmiCitizen.name, phone: lakshmiCitizen.phone, email: lakshmiCitizen.email },
      category: 'Plastic',
      wasteCategory: 'Plastic',
      subCategory: 'HDPE Milk Pouches & Wrappers',
      quantity: 15,
      unit: 'kg',
      estimatedWeightKg: 15,
      description: 'Clean, dry LDPE/HDPE pouches collected across Podanur railway quarters.',
      ward: 'Ward 90',
      locality: 'Podanur',
      location: {
        address: '74 Pollachi Main Road, Podanur, Coimbatore 641023',
        ward: 'Ward 90',
        locality: 'Podanur',
        coordinates: { lat: 10.9622, lng: 76.9765 }
      },
      scheduledDate: daysAgo(4),
      timeSlot: '09:00 AM - 12:00 PM',
      status: 'Recycled',
      priority: 'Normal',
      assignedDriver: {
        driverId: driver6._id,
        name: driver6.name,
        phone: driver6.phone,
        vehicleId: createdVehicles['TN-38-MRF-5510']._id,
        vehiclePlate: 'TN-38-MRF-5510'
      },
      ecoPointsAwarded: 225,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(4, 4),
      completedAt: daysAgo(4, 4),
      createdAt: daysAgo(4, -2),
      timeline: [
        { status: 'Reported', timestamp: daysAgo(4, -2), note: 'Podanur residential pickup' },
        { status: 'Recycled', timestamp: daysAgo(4, 4), note: 'Baled at Ukkadam MRF' }
      ]
    },

    // --- HISTORICAL REQUESTS SPANNING THE LAST 5 MONTHS (FOR RICH 6-MONTH TREND CHARTS) ---
    // 1 Month Ago (October)
    {
      trackingId: 'WW-CBE-1901',
      citizen: { userId: priyaCitizen._id, name: priyaCitizen.name, phone: priyaCitizen.phone, email: priyaCitizen.email },
      category: 'Organic',
      wasteCategory: 'Organic',
      subCategory: 'Compostable Kitchen Stream',
      quantity: 48,
      unit: 'kg',
      estimatedWeightKg: 48,
      description: 'Community apartment wet waste batch for RS Puram DWCC.',
      ward: 'Ward 24',
      locality: 'RS Puram',
      location: {
        address: '28 Lawley Road, RS Puram, Coimbatore 641002',
        ward: 'Ward 24',
        locality: 'RS Puram',
        coordinates: { lat: 11.0092, lng: 76.9482 }
      },
      scheduledDate: daysAgo(32),
      timeSlot: '06:30 AM - 09:30 AM',
      status: 'Recycled',
      priority: 'Normal',
      assignedDriver: { driverId: driver1._id, name: driver1.name, phone: driver1.phone, vehiclePlate: 'TN-38-BZ-4921' },
      ecoPointsAwarded: 480,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(32, 3),
      completedAt: daysAgo(32, 3),
      createdAt: daysAgo(32, -2)
    },
    {
      trackingId: 'WW-CBE-1902',
      citizen: { userId: manojCitizen._id, name: manojCitizen.name, phone: manojCitizen.phone, email: manojCitizen.email },
      category: 'Electronic',
      wasteCategory: 'Electronic',
      subCategory: 'IT Peripherals & Printers',
      quantity: 28,
      unit: 'kg',
      estimatedWeightKg: 28,
      description: 'Discarded laser printers and keyboards from Peelamedu office.',
      ward: 'Ward 38',
      locality: 'Peelamedu',
      location: {
        address: '120 Avinashi Road, Peelamedu, Coimbatore 641004',
        ward: 'Ward 38',
        locality: 'Peelamedu',
        coordinates: { lat: 11.0291, lng: 77.0041 }
      },
      scheduledDate: daysAgo(38),
      timeSlot: '10:00 AM - 01:00 PM',
      status: 'Recycled',
      priority: 'High',
      assignedDriver: { driverId: driver3._id, name: driver3.name, phone: driver3.phone, vehiclePlate: 'TN-38-DF-7823' },
      ecoPointsAwarded: 840,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(38, 4),
      completedAt: daysAgo(38, 4),
      createdAt: daysAgo(38, -3)
    },
    {
      trackingId: 'WW-CBE-1903',
      citizen: { userId: meenakshiCitizen._id, name: meenakshiCitizen.name, phone: meenakshiCitizen.phone, email: meenakshiCitizen.email },
      category: 'Plastic',
      wasteCategory: 'Plastic',
      subCategory: 'Recyclable Containers',
      quantity: 34,
      unit: 'kg',
      estimatedWeightKg: 34,
      description: 'Sorted plastic containers from Race Course club event.',
      ward: 'Ward 62',
      locality: 'Race Course',
      location: {
        address: '5 Thomas Park, Race Course, Coimbatore 641018',
        ward: 'Ward 62',
        locality: 'Race Course',
        coordinates: { lat: 11.0041, lng: 76.9755 }
      },
      scheduledDate: daysAgo(42),
      timeSlot: '09:00 AM - 12:00 PM',
      status: 'Collected',
      priority: 'Normal',
      assignedDriver: { driverId: driver2._id, name: driver2.name, phone: driver2.phone, vehiclePlate: 'TN-38-CX-1102' },
      ecoPointsAwarded: 510,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(42, 3),
      completedAt: daysAgo(42, 3),
      createdAt: daysAgo(42, -2)
    },

    // 2 Months Ago (September)
    {
      trackingId: 'WW-CBE-1801',
      citizen: { userId: demoCitizen._id, name: demoCitizen.name, phone: demoCitizen.phone, email: demoCitizen.email },
      category: 'Recyclable',
      wasteCategory: 'Recyclable',
      subCategory: 'Cardboard & Paper',
      quantity: 42,
      unit: 'kg',
      estimatedWeightKg: 42,
      description: 'Monthly carton bundle from Cross Cut Road merchants.',
      ward: 'Ward 32',
      locality: 'Gandhipuram',
      location: {
        address: '64 Cross Cut Road, Gandhipuram, Coimbatore 641012',
        ward: 'Ward 32',
        locality: 'Gandhipuram',
        coordinates: { lat: 11.0178, lng: 76.9685 }
      },
      scheduledDate: daysAgo(62),
      timeSlot: '09:00 AM - 12:00 PM',
      status: 'Recycled',
      priority: 'Normal',
      assignedDriver: { driverId: driver2._id, name: driver2.name, phone: driver2.phone, vehiclePlate: 'TN-38-CX-1102' },
      ecoPointsAwarded: 504,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(62, 3),
      completedAt: daysAgo(62, 3),
      createdAt: daysAgo(62, -2)
    },
    {
      trackingId: 'WW-CBE-1802',
      citizen: { userId: kavithaCitizen._id, name: kavithaCitizen.name, phone: kavithaCitizen.phone, email: kavithaCitizen.email },
      category: 'Metal',
      wasteCategory: 'Metal',
      subCategory: 'Scrap Iron & Aluminium',
      quantity: 25,
      unit: 'kg',
      estimatedWeightKg: 25,
      description: 'Window grilles and aluminium frames from home renovation.',
      ward: 'Ward 45',
      locality: 'Saibaba Colony',
      location: {
        address: '31 Alagesan Road, Saibaba Colony, Coimbatore 641011',
        ward: 'Ward 45',
        locality: 'Saibaba Colony',
        coordinates: { lat: 11.0248, lng: 76.9415 }
      },
      scheduledDate: daysAgo(68),
      timeSlot: '02:00 PM - 05:00 PM',
      status: 'Recycled',
      priority: 'Normal',
      assignedDriver: { driverId: driver4._id, name: driver4.name, phone: driver4.phone, vehiclePlate: 'TN-38-EA-3341' },
      ecoPointsAwarded: 500,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(68, 4),
      completedAt: daysAgo(68, 4),
      createdAt: daysAgo(68, -2)
    },

    // 3 Months Ago (August)
    {
      trackingId: 'WW-CBE-1701',
      citizen: { userId: dineshCitizen._id, name: dineshCitizen.name, phone: dineshCitizen.phone, email: dineshCitizen.email },
      category: 'Organic',
      wasteCategory: 'Organic',
      subCategory: 'Farmers Market Green Waste',
      quantity: 55,
      unit: 'kg',
      estimatedWeightKg: 55,
      description: 'Singanallur Uzhavar Sandhai segregated vegetable stalks.',
      ward: 'Ward 54',
      locality: 'Singanallur',
      location: {
        address: '89 Trichy Road, Singanallur, Coimbatore 641005',
        ward: 'Ward 54',
        locality: 'Singanallur',
        coordinates: { lat: 10.9988, lng: 77.0259 }
      },
      scheduledDate: daysAgo(94),
      timeSlot: '06:30 AM - 09:30 AM',
      status: 'Recycled',
      priority: 'Normal',
      assignedDriver: { driverId: driver5._id, name: driver5.name, phone: driver5.phone, vehiclePlate: 'TN-38-HAZ-009' },
      ecoPointsAwarded: 550,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(94, 3),
      completedAt: daysAgo(94, 3),
      createdAt: daysAgo(94, -2)
    },
    {
      trackingId: 'WW-CBE-1702',
      citizen: { userId: vigneshCitizen._id, name: vigneshCitizen.name, phone: vigneshCitizen.phone, email: vigneshCitizen.email },
      category: 'Glass',
      wasteCategory: 'Glass',
      subCategory: 'Sorted Beverage & Lab Glassware',
      quantity: 20,
      unit: 'kg',
      estimatedWeightKg: 20,
      description: 'Clean non-hazardous glass bottles from Saravanampatti tech campus cafeteria.',
      ward: 'Ward 18',
      locality: 'Saravanampatti',
      location: {
        address: 'CHIL SEZ Campus, Saravanampatti, Coimbatore 641035',
        ward: 'Ward 18',
        locality: 'Saravanampatti',
        coordinates: { lat: 11.0771, lng: 77.0019 }
      },
      scheduledDate: daysAgo(102),
      timeSlot: '10:00 AM - 01:00 PM',
      status: 'Collected',
      priority: 'Normal',
      assignedDriver: { driverId: driver3._id, name: driver3.name, phone: driver3.phone, vehiclePlate: 'TN-38-DF-7823' },
      ecoPointsAwarded: 280,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(102, 3),
      completedAt: daysAgo(102, 3),
      createdAt: daysAgo(102, -2)
    },

    // 4 Months Ago (July)
    {
      trackingId: 'WW-CBE-1601',
      citizen: { userId: priyaCitizen._id, name: priyaCitizen.name, phone: priyaCitizen.phone, email: priyaCitizen.email },
      category: 'Plastic',
      wasteCategory: 'Plastic',
      subCategory: 'Clean Packaging Film & Bottles',
      quantity: 36,
      unit: 'kg',
      estimatedWeightKg: 36,
      description: 'Segregated dry plastic stream from DB Road residents.',
      ward: 'Ward 24',
      locality: 'RS Puram',
      location: {
        address: '15 DB Road, RS Puram, Coimbatore 641002',
        ward: 'Ward 24',
        locality: 'RS Puram',
        coordinates: { lat: 11.0086, lng: 76.9497 }
      },
      scheduledDate: daysAgo(125),
      timeSlot: '09:00 AM - 12:00 PM',
      status: 'Recycled',
      priority: 'Normal',
      assignedDriver: { driverId: driver1._id, name: driver1.name, phone: driver1.phone, vehiclePlate: 'TN-38-BZ-4921' },
      ecoPointsAwarded: 540,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(125, 3),
      completedAt: daysAgo(125, 3),
      createdAt: daysAgo(125, -2)
    },
    {
      trackingId: 'WW-CBE-1602',
      citizen: { userId: lakshmiCitizen._id, name: lakshmiCitizen.name, phone: lakshmiCitizen.phone, email: lakshmiCitizen.email },
      category: 'Recyclable',
      wasteCategory: 'Recyclable',
      subCategory: 'Mixed Paper & Magazines',
      quantity: 28,
      unit: 'kg',
      estimatedWeightKg: 28,
      description: 'Bundled old newspapers and school notebooks from Podanur welfare drive.',
      ward: 'Ward 90',
      locality: 'Podanur',
      location: {
        address: '74 Pollachi Main Road, Podanur, Coimbatore 641023',
        ward: 'Ward 90',
        locality: 'Podanur',
        coordinates: { lat: 10.9622, lng: 76.9765 }
      },
      scheduledDate: daysAgo(132),
      timeSlot: '09:00 AM - 12:00 PM',
      status: 'Recycled',
      priority: 'Normal',
      assignedDriver: { driverId: driver6._id, name: driver6.name, phone: driver6.phone, vehiclePlate: 'TN-38-MRF-5510' },
      ecoPointsAwarded: 336,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(132, 3),
      completedAt: daysAgo(132, 3),
      createdAt: daysAgo(132, -2)
    },

    // 5 Months Ago (June)
    {
      trackingId: 'WW-CBE-1501',
      citizen: { userId: manojCitizen._id, name: manojCitizen.name, phone: manojCitizen.phone, email: manojCitizen.email },
      category: 'Organic',
      wasteCategory: 'Organic',
      subCategory: 'Hostel Canteen Wet Waste',
      quantity: 52,
      unit: 'kg',
      estimatedWeightKg: 52,
      description: 'Segregated food preparation waste for bio-composting.',
      ward: 'Ward 38',
      locality: 'Peelamedu',
      location: {
        address: '88 Avinashi Road, Peelamedu, Coimbatore 641004',
        ward: 'Ward 38',
        locality: 'Peelamedu',
        coordinates: { lat: 11.0285, lng: 77.0028 }
      },
      scheduledDate: daysAgo(155),
      timeSlot: '06:30 AM - 09:30 AM',
      status: 'Recycled',
      priority: 'Normal',
      assignedDriver: { driverId: driver3._id, name: driver3.name, phone: driver3.phone, vehiclePlate: 'TN-38-DF-7823' },
      ecoPointsAwarded: 520,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(155, 2),
      completedAt: daysAgo(155, 2),
      createdAt: daysAgo(155, -2)
    },
    {
      trackingId: 'WW-CBE-1502',
      citizen: { userId: meenakshiCitizen._id, name: meenakshiCitizen.name, phone: meenakshiCitizen.phone, email: meenakshiCitizen.email },
      category: 'Electronic',
      wasteCategory: 'Electronic',
      subCategory: 'Household Appliances & Cables',
      quantity: 19,
      unit: 'kg',
      estimatedWeightKg: 19,
      description: 'Old mixer grinder, stabilizer, and copper wiring.',
      ward: 'Ward 62',
      locality: 'Race Course',
      location: {
        address: '19 Race Course Scheme Road, Coimbatore 641018',
        ward: 'Ward 62',
        locality: 'Race Course',
        coordinates: { lat: 11.0036, lng: 76.9762 }
      },
      scheduledDate: daysAgo(162),
      timeSlot: '10:00 AM - 01:00 PM',
      status: 'Recycled',
      priority: 'Normal',
      assignedDriver: { driverId: driver5._id, name: driver5.name, phone: driver5.phone, vehiclePlate: 'TN-38-HAZ-009' },
      ecoPointsAwarded: 570,
      pointsAwarded: true,
      pointsAwardedAt: daysAgo(162, 3),
      completedAt: daysAgo(162, 3),
      createdAt: daysAgo(162, -2)
    }
  ];

  const createdReports = [];
  for (const r of reportsData) {
    const doc = await WasteReport.findOneAndUpdate(
      { trackingId: r.trackingId },
      { $set: r },
      { upsert: true, new: true }
    );
    createdReports.push(doc);
  }

  // --------------------------------------------------------------------------
  // 8. DISPATCHED COLLECTION ROUTES (2 TSP-Optimized Dispatched Routes)
  // --------------------------------------------------------------------------
  console.log('8/10 Seeding TSP-Optimized Collection Routes...');
  const routesData = [
    {
      routeCode: 'RT-CBE-101',
      title: 'West & Central Morning Compactor Dispatch (RS Puram → Gandhipuram → DWCC)',
      ward: 'Ward 24',
      zone: 'West Zone',
      assignedWorker: {
        workerId: driver1._id,
        name: driver1.name,
        phone: driver1.phone
      },
      assignedVehicle: {
        vehicleId: createdVehicles['TN-38-BZ-4921']._id,
        registrationNumber: 'TN-38-BZ-4921',
        vehicleType: 'Compactor Truck',
        capacityKg: 4500
      },
      depot: {
        name: 'CCMC Central Fleet Depot, Town Hall',
        address: 'Big Bazaar Street, Town Hall, Coimbatore 641001',
        coordinates: { lat: 11.0018, lng: 76.9628 }
      },
      destinationFacility: {
        facilityId: createdCentres['RS Puram Micro-Composting & Dry Waste Centre (DWCC)']._id,
        name: 'RS Puram Micro-Composting & Dry Waste Centre (DWCC)',
        address: '72 Cowley Brown Road, RS Puram, Coimbatore 641002',
        coordinates: { lat: 11.0086, lng: 76.9497 }
      },
      stops: [
        {
          stopOrder: 1,
          reportId: createdReports[7]._id,
          trackingId: 'WW-CBE-2008',
          citizenName: demoCitizen.name,
          address: '112 Big Bazaar Street, Town Hall, Coimbatore 641001',
          ward: 'Ward 72',
          category: 'Recyclable',
          estimatedWeightKg: 30,
          coordinates: { lat: 11.0018, lng: 76.9628 },
          distanceFromPrevKm: 0.4,
          status: 'Pending'
        },
        {
          stopOrder: 2,
          reportId: createdReports[1]._id,
          trackingId: 'WW-CBE-2002',
          citizenName: priyaCitizen.name,
          address: '15 DB Road, RS Puram, Coimbatore 641002',
          ward: 'Ward 24',
          category: 'Organic',
          estimatedWeightKg: 26,
          coordinates: { lat: 11.0086, lng: 76.9497 },
          distanceFromPrevKm: 2.1,
          status: 'Completed'
        }
      ],
      metrics: {
        stopCount: 2,
        totalLoadKg: 56,
        vehicleCapacityKg: 4500,
        capacityUtilizationPercent: 1.2,
        straightLineDistanceKm: 2.8,
        estimatedRoadDistanceKm: 3.7,
        roadTortuosityFactor: 1.32,
        estimatedDurationMinutes: 24,
        algorithmUsed: 'Nearest-Neighbour + 2-Opt Local Search'
      },
      routeGeometry: [
        [11.0018, 76.9628],
        [11.0086, 76.9497],
        [11.0086, 76.9497]
      ],
      status: 'In Progress',
      dispatchedAt: daysAgo(0, -3),
      createdBy: adminUser._id
    },
    {
      routeCode: 'RT-CBE-102',
      title: 'East Zone E-Waste & Recyclable Transit (Peelamedu → Singanallur → SafeDrop)',
      ward: 'Ward 38',
      zone: 'East Zone',
      assignedWorker: {
        workerId: driver3._id,
        name: driver3.name,
        phone: driver3.phone
      },
      assignedVehicle: {
        vehicleId: createdVehicles['TN-38-DF-7823']._id,
        registrationNumber: 'TN-38-DF-7823',
        vehicleType: 'Organic Collection Truck',
        capacityKg: 3000
      },
      depot: {
        name: 'CCMC Central Fleet Depot, Town Hall',
        address: 'Big Bazaar Street, Town Hall, Coimbatore 641001',
        coordinates: { lat: 11.0018, lng: 76.9628 }
      },
      destinationFacility: {
        facilityId: createdCentres['Peelamedu E-Waste & Battery SafeDrop Facility']._id,
        name: 'Peelamedu E-Waste & Battery SafeDrop Facility',
        address: '410 Avinashi Road, Peelamedu, Coimbatore 641004',
        coordinates: { lat: 11.0285, lng: 77.0028 }
      },
      stops: [
        {
          stopOrder: 1,
          reportId: createdReports[4]._id,
          trackingId: 'WW-CBE-2005',
          citizenName: dineshCitizen.name,
          address: '102 Trichy Road, Singanallur, Coimbatore 641005',
          ward: 'Ward 54',
          category: 'Medical',
          estimatedWeightKg: 6,
          coordinates: { lat: 10.9995, lng: 77.0267 },
          distanceFromPrevKm: 7.4,
          status: 'Pending'
        },
        {
          stopOrder: 2,
          reportId: createdReports[2]._id,
          trackingId: 'WW-CBE-2003',
          citizenName: manojCitizen.name,
          address: '88 Avinashi Road, Peelamedu, Coimbatore 641004',
          ward: 'Ward 38',
          category: 'Electronic',
          estimatedWeightKg: 14,
          coordinates: { lat: 11.0285, lng: 77.0028 },
          distanceFromPrevKm: 4.8,
          status: 'Pending'
        }
      ],
      metrics: {
        stopCount: 2,
        totalLoadKg: 20,
        vehicleCapacityKg: 3000,
        capacityUtilizationPercent: 0.7,
        straightLineDistanceKm: 9.2,
        estimatedRoadDistanceKm: 12.2,
        roadTortuosityFactor: 1.32,
        estimatedDurationMinutes: 46,
        algorithmUsed: 'Nearest-Neighbour + 2-Opt Local Search'
      },
      routeGeometry: [
        [11.0018, 76.9628],
        [10.9995, 77.0267],
        [11.0285, 77.0028]
      ],
      status: 'Dispatched',
      dispatchedAt: daysAgo(0, -1),
      createdBy: adminUser._id
    }
  ];

  for (const rt of routesData) {
    await CollectionRoute.findOneAndUpdate(
      { routeCode: rt.routeId },
      { $set: rt },
      { upsert: true, new: true }
    );
  }

  // --------------------------------------------------------------------------
  // 9. CIVIC COMPLAINTS (7 Sanitation Grievances across Wards & Statuses)
  // --------------------------------------------------------------------------
  console.log('9/10 Seeding Civic Sanitation Complaints & Community Campaigns...');
  const complaintsData = [
    {
      complaintId: 'CMP-CBE-101',
      title: 'Secondary Bin Overflow near Cross Cut Road 4th Street',
      citizen: { userId: demoCitizen._id, name: demoCitizen.name, email: demoCitizen.email, phone: demoCitizen.phone },
      category: 'Overflowing Public Bins',
      description: 'Commercial packaging waste overflowing from community green bin after evening market hours.',
      ward: 'Ward 32',
      locality: 'Gandhipuram',
      address: 'Cross Cut Road, 4th Street Junction, Gandhipuram, Coimbatore 641012',
      coordinates: { lat: 11.0188, lng: 76.9682 },
      priority: 'High',
      status: 'In Progress',
      assignedWorker: {
        workerId: driver2._id,
        name: driver2.name,
        phone: driver2.phone,
        department: 'Central Zone Sanitation'
      },
      internalNotes: [
        {
          note: 'Dispatched mini-tipper TN-38-CX-1102 for immediate secondary clearance.',
          authorName: adminUser.name,
          createdAt: daysAgo(0, -2)
        }
      ],
      createdAt: daysAgo(1)
    },
    {
      complaintId: 'CMP-CBE-102',
      title: 'Missed Morning Wet-Waste Collection on Alagesan Road',
      citizen: { userId: kavithaCitizen._id, name: kavithaCitizen.name, email: kavithaCitizen.email, phone: kavithaCitizen.phone },
      category: 'Missed Garbage Collection',
      description: 'E-cart did not reach Alagesan Road 2nd Lane during the morning slot due to road paving work.',
      ward: 'Ward 45',
      locality: 'Saibaba Colony',
      address: '24 Alagesan Road, Saibaba Colony, Coimbatore 641011',
      coordinates: { lat: 11.0256, lng: 76.9418 },
      priority: 'Normal',
      status: 'Resolved',
      assignedWorker: {
        workerId: driver4._id,
        name: driver4.name,
        phone: driver4.phone,
        department: 'West Zone EV Unit'
      },
      resolutionNotes: 'Afternoon backup round completed at 03:15 PM IST; all segregated bins cleared.',
      resolvedAt: daysAgo(1, 4),
      createdAt: daysAgo(2)
    },
    {
      complaintId: 'CMP-CBE-103',
      title: 'Construction & Plastic Dumping along Sungam Bypass Verge',
      citizen: { userId: lakshmiCitizen._id, name: lakshmiCitizen.name, email: lakshmiCitizen.email, phone: lakshmiCitizen.phone },
      category: 'Illegal Dumping',
      description: 'Unauthorised night-time dumping of mixed plastic sacks and debris near Valankulam bund.',
      ward: 'Ward 81',
      locality: 'Ukkadam',
      address: 'Sungam Bypass Road, Near Valankulam Bund, Ukkadam, Coimbatore 641001',
      coordinates: { lat: 10.9912, lng: 76.9625 },
      priority: 'Critical',
      status: 'Assigned',
      assignedWorker: {
        workerId: driver6._id,
        name: driver6.name,
        phone: driver6.phone,
        department: 'South Zone Bulk Clearance'
      },
      internalNotes: [
        {
          note: 'Roll-off container truck TN-38-MRF-5510 scheduled with JCB loader for morning clearance.',
          authorName: adminUser.name,
          createdAt: daysAgo(0, -4)
        }
      ],
      createdAt: daysAgo(1, -6)
    },
    {
      complaintId: 'CMP-CBE-104',
      title: 'Damaged Blue Recyclable Bin Lid at Hope College Bus Stop',
      citizen: { userId: manojCitizen._id, name: manojCitizen.name, email: manojCitizen.email, phone: manojCitizen.phone },
      category: 'Damaged Waste Collection Infrastructure',
      description: 'Hinge on the 240L blue dry-waste bin at Hope College bus shelter is broken, exposing paper to rain.',
      ward: 'Ward 38',
      locality: 'Peelamedu',
      address: 'Avinashi Road, Hope College Bus Shelter, Peelamedu, Coimbatore 641004',
      coordinates: { lat: 11.0281, lng: 77.0034 },
      priority: 'Low',
      status: 'Under Review',
      createdAt: daysAgo(2)
    },
    {
      complaintId: 'CMP-CBE-105',
      title: 'Leaf Litter Accumulation on Race Course Walking Track',
      citizen: { userId: meenakshiCitizen._id, name: meenakshiCitizen.name, email: meenakshiCitizen.email, phone: meenakshiCitizen.phone },
      category: 'Waste Left in Public Spaces',
      description: 'Heavy wind caused dry foliage accumulation near Thomas Park entrance; needs transfer to leaf compost pit.',
      ward: 'Ward 62',
      locality: 'Race Course',
      address: 'Race Course Circular Road, Near Thomas Park, Coimbatore 641018',
      coordinates: { lat: 11.0039, lng: 76.9768 },
      priority: 'Normal',
      status: 'Resolved',
      assignedWorker: {
        workerId: driver2._id,
        name: driver2.name,
        phone: driver2.phone,
        department: 'Central Zone Parks & Sanitation'
      },
      resolutionNotes: 'Swept and transferred 85 kg of dry leaves to Race Course aerobic leaf composter.',
      resolvedAt: daysAgo(3, 5),
      createdAt: daysAgo(4)
    },
    {
      complaintId: 'CMP-CBE-106',
      title: 'Discarded Fluorescent Tubes near Big Bazaar Lane',
      citizen: { userId: demoCitizen._id, name: demoCitizen.name, email: demoCitizen.email, phone: demoCitizen.phone },
      category: 'Uncollected Hazardous Waste',
      description: 'Box of broken fluorescent tube lights left beside commercial transformer; requires safe hazmat pickup.',
      ward: 'Ward 72',
      locality: 'Town Hall',
      address: 'Big Bazaar Street East Lane, Town Hall, Coimbatore 641001',
      coordinates: { lat: 11.0022, lng: 76.9635 },
      priority: 'High',
      status: 'Submitted',
      createdAt: daysAgo(0, -5)
    }
  ];

  for (const c of complaintsData) {
    await Complaint.findOneAndUpdate(
      { complaintId: c.complaintId },
      { $set: c },
      { upsert: true, new: true }
    );
  }

  // --------------------------------------------------------------------------
  // 10. COMMUNITY CAMPAIGNS & AUDIT LOGS
  // --------------------------------------------------------------------------
  const campaignsData = [
    {
      title: 'RS Puram Plastic-Free Sunday & Cloth Bag Exchange Drive',
      campaignType: 'Plastic-Free Campaign',
      description: 'Bring 2 kg of clean household plastic packaging to DB Road Municipal Kiosk and receive 2 handloom cotton shopping bags plus 100 bonus Eco-Points.',
      ward: 'Ward 24',
      locality: 'RS Puram',
      venue: 'DB Road Municipal Clock Tower Plaza, RS Puram',
      startDate: daysAgo(2),
      endDate: daysFromNow(12),
      startTime: '08:00 AM',
      endTime: '01:00 PM',
      targetAudience: 'RS Puram Residents & Shopkeepers',
      organizer: 'Coimbatore City Municipal Corporation (West Zone)',
      contactPhone: '+91 422 254 8812',
      status: 'Ongoing',
      isPublished: true
    },
    {
      title: 'Peelamedu & Saravanampatti Mega E-Waste SafeDrop Week',
      campaignType: 'E-Waste Collection Drive',
      description: 'Special certified collection drive for obsolete laptops, mobile phones, chargers, and inverter batteries across colleges and IT parks.',
      ward: 'Ward 38',
      locality: 'Peelamedu',
      venue: 'Peelamedu E-Waste SafeDrop Centre, Avinashi Road',
      startDate: daysFromNow(1),
      endDate: daysFromNow(10),
      startTime: '09:30 AM',
      endTime: '05:30 PM',
      targetAudience: 'Colleges, IT Parks & Households',
      organizer: 'CCMC & TNPCB Authorised Recyclers',
      contactPhone: '+91 422 257 3390',
      status: 'Published',
      isPublished: true
    },
    {
      title: 'Saibaba Colony Home Terrace Composting Workshop',
      campaignType: 'Composting Workshop',
      description: 'Hands-on demonstration of odour-free khamba pot and aerobic bin composting to convert kitchen wet waste into nutrient-rich garden manure.',
      ward: 'Ward 45',
      locality: 'Saibaba Colony',
      venue: 'Bharathi Park Community Hall, Saibaba Colony',
      startDate: daysFromNow(3),
      endDate: daysFromNow(4),
      startTime: '10:00 AM',
      endTime: '12:30 PM',
      targetAudience: 'Resident Welfare Associations (RWAs)',
      organizer: 'CCMC Solid Waste Management Wing',
      contactPhone: '+91 422 244 7120',
      status: 'Published',
      isPublished: true
    },
    {
      title: 'Valankulam & Singanallur Lakefront Clean-Up & Bird Habitat Restoration',
      campaignType: 'Clean-up Event',
      description: 'Join 300+ citizen volunteers and CCMC sanitation workers to clear plastic litter from the wetland shoreline.',
      ward: 'Ward 81',
      locality: 'Ukkadam',
      venue: 'Valankulam Lake Walkway Eastern Entrance, Ukkadam',
      startDate: daysAgo(1),
      endDate: daysFromNow(5),
      startTime: '06:30 AM',
      endTime: '09:30 AM',
      targetAudience: 'All Citizens, Students & Eco-Clubs',
      organizer: 'CCMC Smart City & Environmental Cell',
      contactPhone: '+91 422 239 5501',
      status: 'Ongoing',
      isPublished: true
    },
    {
      title: 'Race Course Green Schools Source Segregation Championship',
      campaignType: 'School Programme',
      description: 'Inter-school competition across 18 Coimbatore schools promoting 3-bin campus segregation and paper recovery.',
      ward: 'Ward 62',
      locality: 'Race Course',
      venue: 'Cosmopolitan Club Auditorium, Race Course',
      startDate: daysFromNow(5),
      endDate: daysFromNow(20),
      startTime: '09:00 AM',
      endTime: '03:00 PM',
      targetAudience: 'Schools & Student Eco-Ambassadors',
      organizer: 'CCMC Education & Sanitation Department',
      contactPhone: '+91 422 230 0100',
      status: 'Published',
      isPublished: true
    }
  ];

  for (const camp of campaignsData) {
    await Campaign.findOneAndUpdate(
      { title: camp.title },
      { $set: camp },
      { upsert: true, new: true }
    );
  }

  console.log('10/10 Seeding Administrative Audit Logs...');
  const auditLogsData = [
    {
      adminId: adminUser._id,
      adminName: adminUser.name,
      adminEmail: adminUser.email,
      action: 'UPDATE_SYSTEM_SETTINGS',
      entityType: 'SystemSettings',
      entityId: 'global_municipal_settings',
      summary: 'Configured Coimbatore CCMC regional parameters, road tortuosity factor (1.32), and fleet capacity thresholds.',
      timestamp: daysAgo(5)
    },
    {
      adminId: adminUser._id,
      adminName: adminUser.name,
      adminEmail: adminUser.email,
      action: 'REGISTER_VEHICLE',
      entityType: 'Vehicle',
      entityId: 'TN-38-BZ-4921',
      summary: 'Registered heavy compactor truck TN-38-BZ-4921 (4500 kg capacity) and assigned to Ward 24 (RS Puram).',
      timestamp: daysAgo(4)
    },
    {
      adminId: adminUser._id,
      adminName: adminUser.name,
      adminEmail: adminUser.email,
      action: 'CREATE_SCHEDULE',
      entityType: 'Schedule',
      entityId: 'Ward 24 Morning Sweep',
      summary: 'Published West Zone Morning Wet & Dry Curbside Sweep with conflict verification passed.',
      timestamp: daysAgo(3)
    },
    {
      adminId: adminUser._id,
      adminName: adminUser.name,
      adminEmail: adminUser.email,
      action: 'VERIFY_COLLECTION_AWARD_POINTS',
      entityType: 'PickupRequest',
      entityId: 'WW-CBE-2001',
      summary: 'Verified 18 kg Plastic collection for WW-CBE-2001 and awarded 270 Eco-Points to Aarav Sundaram.',
      timestamp: daysAgo(0, -2)
    },
    {
      adminId: adminUser._id,
      adminName: adminUser.name,
      adminEmail: adminUser.email,
      action: 'DISPATCH_ROUTE',
      entityType: 'Route',
      entityId: 'RT-CBE-101',
      summary: 'Optimized and dispatched route RT-CBE-101 (3.7 km road distance, 2 stops) to Karthik Raja (TN-38-BZ-4921).',
      timestamp: daysAgo(0, -3)
    },
    {
      adminId: adminUser._id,
      adminName: adminUser.name,
      adminEmail: adminUser.email,
      action: 'RESOLVE_COMPLAINT',
      entityType: 'Complaint',
      entityId: 'CMP-CBE-102',
      summary: 'Marked complaint CMP-CBE-102 (Alagesan Road missed collection) as Resolved after afternoon EV sweep.',
      timestamp: daysAgo(1, 4)
    }
  ];

  for (const log of auditLogsData) {
    await AuditLog.findOneAndUpdate(
      { action: log.action, entityId: log.entityId },
      { $set: log },
      { upsert: true, new: true }
    );
  }

  console.log('\n🎉 Realistic Coimbatore Municipal Data Seeded Successfully!');
  console.log('------------------------------------------------------------');
  console.log('Users:', await User.countDocuments());
  console.log('Wards:', await Ward.countDocuments());
  console.log('Fleet Vehicles:', await CollectionVehicle.countDocuments());
  console.log('Recycling & Disposal Facilities:', await RecyclingCentre.countDocuments());
  console.log('Collection Schedules:', await CollectionSchedule.countDocuments());
  console.log('Waste Reports (Pickups):', await WasteReport.countDocuments());
  console.log('Dispatched Routes:', await CollectionRoute.countDocuments());
  console.log('Civic Complaints:', await Complaint.countDocuments());
  console.log('Community Campaigns:', await Campaign.countDocuments());
  console.log('Audit Logs:', await AuditLog.countDocuments());
  console.log('------------------------------------------------------------');
}

seedRealisticData()
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error('❌ Seeding error:', err);
    mongoose.disconnect();
    process.exit(1);
  });
