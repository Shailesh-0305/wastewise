import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';

// Ensure DNS resolution for MongoDB Atlas SRV
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

export async function seedRealisticData() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('✅ Connected to MongoDB Atlas successfully.');

  const salt = await bcrypt.genSalt(10);
  const adminPass = process.env.ADMIN_PASSWORD || 'adminPass123!';
  const hashedAdminPassword = await bcrypt.hash(adminPass, salt);
  const hashedCitizenPassword = await bcrypt.hash('citizen123', salt);
  const hashedDriverPassword = await bcrypt.hash('driver123', salt);

  // --------------------------------------------------------------------------
  // 1. SYSTEM SETTINGS
  // --------------------------------------------------------------------------
  console.log('Configuring System Settings...');
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
          warningPendingCount: 3,
          criticalPendingCount: 6,
          warningOverdueCount: 1,
          criticalOverdueCount: 3,
          warningComplaintCount: 2,
          criticalComplaintCount: 5
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
  // 2. WARDS (Coimbatore Municipal Wards)
  // --------------------------------------------------------------------------
  console.log('Seeding Coimbatore Wards...');
  const wardsData = [
    {
      wardNumber: 'Ward 24',
      wardName: 'Ward 24 - RS Puram',
      zone: 'West Zone',
      localities: ['RS Puram', 'DB Road', 'Cowley Brown Road', 'Sukrawarpet'],
      populationEstimate: 38500,
      householdsEstimate: 9800,
      areaSqKm: 4.8,
      referenceCoordinates: { lat: 11.0086, lng: 76.9497 },
      operationalStatus: 'Active'
    },
    {
      wardNumber: 'Ward 32',
      wardName: 'Ward 32 - Gandhipuram',
      zone: 'Central Zone',
      localities: ['Gandhipuram', 'Cross Cut Road', '100 Feet Road', 'Ram Nagar'],
      populationEstimate: 42000,
      householdsEstimate: 10500,
      areaSqKm: 5.2,
      referenceCoordinates: { lat: 11.0183, lng: 76.9691 },
      operationalStatus: 'Active'
    },
    {
      wardNumber: 'Ward 38',
      wardName: 'Ward 38 - Peelamedu',
      zone: 'East Zone',
      localities: ['Peelamedu', 'Hope College', 'PSG Tech Campus', 'Nava India'],
      populationEstimate: 51000,
      householdsEstimate: 13200,
      areaSqKm: 6.5,
      referenceCoordinates: { lat: 11.0285, lng: 77.0028 },
      operationalStatus: 'Active'
    },
    {
      wardNumber: 'Ward 45',
      wardName: 'Ward 45 - Saibaba Colony',
      zone: 'West Zone',
      localities: ['Saibaba Colony', 'NSR Road', 'Alagesan Road', 'Kavundampalayam South'],
      populationEstimate: 36000,
      householdsEstimate: 9100,
      areaSqKm: 4.1,
      referenceCoordinates: { lat: 11.0252, lng: 76.9421 },
      operationalStatus: 'Active'
    },
    {
      wardNumber: 'Ward 54',
      wardName: 'Ward 54 - Singanallur',
      zone: 'East Zone',
      localities: ['Singanallur', 'Trichy Road', 'Kamraj Road', 'Ondipudur West'],
      populationEstimate: 48000,
      householdsEstimate: 12400,
      areaSqKm: 5.9,
      referenceCoordinates: { lat: 10.9995, lng: 77.0267 },
      operationalStatus: 'Active'
    },
    {
      wardNumber: 'Ward 62',
      wardName: 'Ward 62 - Race Course',
      zone: 'Central Zone',
      localities: ['Race Course', 'Trichy Road', 'Collectorate', 'Thomas Park'],
      populationEstimate: 29000,
      householdsEstimate: 7400,
      areaSqKm: 3.9,
      referenceCoordinates: { lat: 11.0025, lng: 76.9734 },
      operationalStatus: 'Active'
    },
    {
      wardNumber: 'Ward 72',
      wardName: 'Ward 72 - Town Hall',
      zone: 'Central Zone',
      localities: ['Town Hall', 'Big Bazaar Street', 'Oppanakara Street', 'Ukkadam North'],
      populationEstimate: 44000,
      householdsEstimate: 11200,
      areaSqKm: 4.4,
      referenceCoordinates: { lat: 11.0018, lng: 76.9628 },
      operationalStatus: 'Active'
    },
    {
      wardNumber: 'Ward 81',
      wardName: 'Ward 81 - Ukkadam',
      zone: 'South Zone',
      localities: ['Ukkadam', 'Sungam Bypass', 'Karumbukkadai', 'Fish Market'],
      populationEstimate: 46000,
      householdsEstimate: 11800,
      areaSqKm: 5.1,
      referenceCoordinates: { lat: 10.9880, lng: 76.9630 },
      operationalStatus: 'Active'
    },
    {
      wardNumber: 'Ward 90',
      wardName: 'Ward 90 - Podanur',
      zone: 'South Zone',
      localities: ['Podanur', 'Chettipalayam Road', 'Railway Colony', 'Vellalore North'],
      populationEstimate: 39000,
      householdsEstimate: 9900,
      areaSqKm: 6.2,
      referenceCoordinates: { lat: 10.9650, lng: 76.9850 },
      operationalStatus: 'Active'
    },
    {
      wardNumber: 'Ward 18',
      wardName: 'Ward 18 - Saravanampatti',
      zone: 'North Zone',
      localities: ['Saravanampatti', 'Sathy Road', 'CHIL SEZ IT Park', 'Sivanandapuram'],
      populationEstimate: 54000,
      householdsEstimate: 14000,
      areaSqKm: 7.1,
      referenceCoordinates: { lat: 11.0820, lng: 76.9950 },
      operationalStatus: 'Active'
    }
  ];

  const createdWards = {};
  for (const w of wardsData) {
    const wardDoc = await Ward.findOneAndUpdate(
      { wardNumber: w.wardNumber },
      { $set: w },
      { upsert: true, new: true }
    );
    createdWards[w.wardName] = wardDoc;
  }

  // --------------------------------------------------------------------------
  // 3. USERS (Admin, Citizens, Drivers)
  // --------------------------------------------------------------------------
  console.log('Seeding Users...');
  const usersData = [
    // Administrator
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
        zip: '641001'
      },
      ecoPoints: 9999,
      co2SavedKg: 850.0,
      ecoLevel: 'City Guardian Master',
      isActive: true
    },
    // Primary Demo Citizen (default credentials in auth modal)
    {
      name: 'Aarav Sundaram (Demo Citizen)',
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
      ecoPoints: 480,
      co2SavedKg: 42.5,
      ecoLevel: 'Eco Champion Gold',
      isActive: true
    },
    // Other Citizens
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
      ecoPoints: 310,
      co2SavedKg: 28.0,
      ecoLevel: 'Eco Enthusiast',
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
      ecoPoints: 195,
      co2SavedKg: 16.5,
      ecoLevel: 'Eco Starter',
      isActive: true
    },
    {
      name: 'Kavitha Selvam',
      email: 'kavitha.s@example.com',
      password: hashedCitizenPassword,
      role: 'citizen',
      phone: '+91 98940 55432',
      address: {
        street: '24 NSR Road',
        locality: 'Saibaba Colony',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641011',
        coordinates: { lat: 11.0252, lng: 76.9421 }
      },
      ecoPoints: 540,
      co2SavedKg: 49.0,
      ecoLevel: 'Eco Champion Gold',
      isActive: true
    },
    {
      name: 'Dinesh Balaji',
      email: 'dinesh.b@example.com',
      password: hashedCitizenPassword,
      role: 'citizen',
      phone: '+91 94862 11223',
      address: {
        street: '102 Trichy Road',
        locality: 'Singanallur',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641005',
        coordinates: { lat: 10.9995, lng: 77.0267 }
      },
      ecoPoints: 230,
      co2SavedKg: 19.5,
      ecoLevel: 'Eco Enthusiast',
      isActive: true
    },
    // Drivers / Collection Workers
    {
      name: 'Karthik Raja',
      email: 'driver.demo@wastewise.org',
      password: hashedDriverPassword,
      role: 'driver',
      phone: '+91 94431 82910',
      employeeId: 'CBE-DRV-101',
      assignedWard: 'Ward 24 - RS Puram',
      assignedShift: 'Morning (06:00 - 14:00)',
      operationalStatus: 'Available',
      address: {
        street: 'Central Fleet Depot, Big Bazaar St',
        locality: 'Town Hall',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641001'
      },
      isActive: true
    },
    {
      name: 'Senthil Kumar',
      email: 'senthil.driver@wastewise.org',
      password: hashedDriverPassword,
      role: 'driver',
      phone: '+91 94420 55123',
      employeeId: 'CBE-DRV-102',
      assignedWard: 'Ward 38 - Peelamedu',
      assignedShift: 'Morning (06:00 - 14:00)',
      operationalStatus: 'On Duty',
      address: {
        street: 'Peelamedu Ward Yard',
        locality: 'Peelamedu',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641004'
      },
      isActive: true
    },
    {
      name: 'Muruganandam M.',
      email: 'murugan.driver@wastewise.org',
      password: hashedDriverPassword,
      role: 'driver',
      phone: '+91 98422 66789',
      employeeId: 'CBE-DRV-103',
      assignedWard: 'Ward 32 - Gandhipuram',
      assignedShift: 'Afternoon (14:00 - 22:00)',
      operationalStatus: 'Available',
      address: {
        street: 'Gandhipuram Transit Yard',
        locality: 'Gandhipuram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641012'
      },
      isActive: true
    },
    {
      name: 'Rajesh Kannan',
      email: 'rajesh.driver@wastewise.org',
      password: hashedDriverPassword,
      role: 'driver',
      employeeId: 'CBE-DRV-104',
      assignedWard: 'Ward 54 - Singanallur',
      assignedShift: 'Morning (06:00 - 14:00)',
      operationalStatus: 'Available',
      address: {
        street: 'Singanallur Corporation Depot',
        locality: 'Singanallur',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641005'
      },
      isActive: true
    },
    {
      name: 'Anitha Velusamy',
      email: 'anitha.driver@wastewise.org',
      password: hashedDriverPassword,
      role: 'driver',
      employeeId: 'CBE-DRV-105',
      assignedWard: 'Ward 45 - Saibaba Colony',
      assignedShift: 'Flexible',
      operationalStatus: 'Available',
      address: {
        street: 'West Zone Depot, Kavundampalayam',
        locality: 'Saibaba Colony',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        zip: '641011'
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

  // --------------------------------------------------------------------------
  // 4. COLLECTION VEHICLES (TN-38)
  // --------------------------------------------------------------------------
  console.log('Seeding Collection Vehicles...');
  const vehiclesData = [
    {
      registrationNumber: 'TN-38-BZ-4921',
      vehicleName: 'CCMC Compactor Alpha-01',
      vehicleType: 'Compactor Truck',
      vehicleCategory: 'Heavy Duty',
      carryingCapacity: 2500,
      capacityUnit: 'kg',
      assignedWorkerId: createdUsers['driver.demo@wastewise.org']._id,
      assignedWorkerName: 'Karthik Raja',
      assignedWard: 'Ward 24 - RS Puram',
      operationalStatus: 'Available',
      notes: 'Equipped with hydraulic lifter for curbside green/blue bins.'
    },
    {
      registrationNumber: 'TN-38-CX-1102',
      vehicleName: 'Peelamedu Mini Tipper 02',
      vehicleType: 'Mini Tipper',
      vehicleCategory: 'Light Commercial',
      carryingCapacity: 1200,
      capacityUnit: 'kg',
      assignedWorkerId: createdUsers['senthil.driver@wastewise.org']._id,
      assignedWorkerName: 'Senthil Kumar',
      assignedWard: 'Ward 38 - Peelamedu',
      operationalStatus: 'In Service',
      notes: 'Dual compartment tipper for segregated dry and wet collection.'
    },
    {
      registrationNumber: 'TN-38-DF-7823',
      vehicleName: 'Gandhipuram E-Cart Trike 03',
      vehicleType: 'E-Cart / Battery Trike',
      vehicleCategory: 'Electric Utility',
      carryingCapacity: 450,
      capacityUnit: 'kg',
      assignedWorkerId: createdUsers['murugan.driver@wastewise.org']._id,
      assignedWorkerName: 'Muruganandam M.',
      assignedWard: 'Ward 32 - Gandhipuram',
      operationalStatus: 'Available',
      notes: 'Zero-emission electric vehicle for narrow street collection.'
    },
    {
      registrationNumber: 'TN-38-EA-3341',
      vehicleName: 'Singanallur Organic Transit 04',
      vehicleType: 'Organic Collection Truck',
      vehicleCategory: 'Medium Duty',
      carryingCapacity: 1800,
      capacityUnit: 'kg',
      assignedWorkerId: createdUsers['rajesh.driver@wastewise.org']._id,
      assignedWorkerName: 'Rajesh Kannan',
      assignedWard: 'Ward 54 - Singanallur',
      operationalStatus: 'Available',
      notes: 'Airtight compactor bed for odour-free organic collection.'
    },
    {
      registrationNumber: 'TN-38-HAZ-009',
      vehicleName: 'Kovai Hazardous & E-Waste Van',
      vehicleType: 'Hazardous Waste Van',
      vehicleCategory: 'Specialised Hazmat',
      carryingCapacity: 800,
      capacityUnit: 'kg',
      assignedWorkerId: createdUsers['anitha.driver@wastewise.org']._id,
      assignedWorkerName: 'Anitha Velusamy',
      assignedWard: 'Ward 45 - Saibaba Colony',
      operationalStatus: 'Available',
      notes: 'Certified containment vehicle for domestic hazardous & biomedical waste.'
    }
  ];

  const createdVehicles = {};
  for (const v of vehiclesData) {
    const vDoc = await CollectionVehicle.findOneAndUpdate(
      { registrationNumber: v.registrationNumber },
      { $set: v },
      { upsert: true, new: true }
    );
    createdVehicles[v.registrationNumber] = vDoc;

    // Link vehicle to user record
    if (v.assignedWorkerId) {
      await User.findByIdAndUpdate(v.assignedWorkerId, {
        $set: {
          assignedVehicleId: vDoc._id,
          assignedVehiclePlate: vDoc.registrationNumber
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // 5. RECYCLING CENTRES & DISPOSAL FACILITIES
  // --------------------------------------------------------------------------
  console.log('Seeding Recycling & Disposal Facilities...');
  const facilitiesData = [
    {
      name: 'Vellalore Integrated Solid Waste Management Facility',
      address: 'Vellalore Road, Podanur Post, Coimbatore, Tamil Nadu 641111',
      locality: 'Podanur',
      ward: 'Ward 90 - Podanur',
      centreType: 'Composting Unit',
      facilityCategory: 'Integrated Facility',
      isDisposalFacility: true,
      acceptedMaterials: ['Organic', 'Plastic', 'Recyclable', 'Glass', 'Metal'],
      location: {
        type: 'Point',
        coordinates: [77.0125, 10.9634] // [lng, lat]
      },
      operatingHours: '06:00 AM - 06:00 PM',
      contactPhone: '+91 422 241 0125',
      contactPerson: 'Mr. V. Natarajan (Executive Engineer)',
      email: 'vellalore.plant@ccmc.gov.in',
      verificationStatus: 'Verified Municipal Facility',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 450,
      handlingNotes: 'Central processing hub with mechanized MRF, windrow composting, and RDF processing.',
      isActive: true
    },
    {
      name: 'RS Puram Dry Waste Collection Centre',
      address: '12 Diwan Bahadur Road, RS Puram West, Coimbatore, Tamil Nadu 641002',
      locality: 'RS Puram',
      ward: 'Ward 24 - RS Puram',
      centreType: 'Dry Waste Collection Centre',
      facilityCategory: 'Recycling Centre',
      isDisposalFacility: false,
      acceptedMaterials: ['Plastic', 'Paper', 'Glass', 'Metal', 'Recyclable'],
      location: {
        type: 'Point',
        coordinates: [76.9497, 11.0086]
      },
      operatingHours: '07:00 AM - 07:00 PM',
      contactPhone: '+91 422 254 0199',
      contactPerson: 'K. Meenakshi (Sanitary Inspector)',
      email: 'rspuram.mrf@ccmc.gov.in',
      verificationStatus: 'Verified Municipal Facility',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 25,
      handlingNotes: 'Neighbourhood drop-off hub with baling machines for clean plastics and paper.',
      isActive: true
    },
    {
      name: 'Peelamedu E-Waste & Electronics SafeDrop',
      address: 'Avinashi Road, Near PSG Tech, Peelamedu, Coimbatore, Tamil Nadu 641004',
      locality: 'Peelamedu',
      ward: 'Ward 38 - Peelamedu',
      centreType: 'E-Waste',
      facilityCategory: 'Disposal Facility',
      isDisposalFacility: true,
      acceptedMaterials: ['Electronic', 'Battery', 'Metal'],
      location: {
        type: 'Point',
        coordinates: [77.0028, 11.0285]
      },
      operatingHours: '09:00 AM - 06:00 PM',
      contactPhone: '+91 422 257 0188',
      contactPerson: 'S. Ramachandran (Authorised Partner)',
      email: 'peelamedu.ewaste@greencoimbatore.org',
      verificationStatus: 'Authorised Partner',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 10,
      handlingNotes: 'TNPCB authorized e-waste dismantling and battery neutralisation depot.',
      isActive: true
    },
    {
      name: 'Ukkadam Secondary Resource Recovery Centre',
      address: 'Sungam Bypass Road, Ukkadam, Coimbatore, Tamil Nadu 641001',
      locality: 'Ukkadam',
      ward: 'Ward 81 - Ukkadam',
      centreType: 'Material Recovery Facility',
      facilityCategory: 'Recycling Centre',
      isDisposalFacility: false,
      acceptedMaterials: ['Plastic', 'Paper', 'Metal', 'Recyclable'],
      location: {
        type: 'Point',
        coordinates: [76.9630, 10.9880]
      },
      operatingHours: '08:00 AM - 05:30 PM',
      contactPhone: '+91 422 230 0245',
      contactPerson: 'M. Hakkim (Centre Coordinator)',
      email: 'ukkadam.recovery@ccmc.gov.in',
      verificationStatus: 'Verified Municipal Facility',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 35,
      handlingNotes: 'Heavy sorting conveyor system handling bulk non-biodegradable waste from South Zone.',
      isActive: true
    },
    {
      name: 'Saibaba Colony Plastic Recovery Unit',
      address: 'NSR Road, Opposite Uzhavar Sandhai, Saibaba Colony, Coimbatore, Tamil Nadu 641011',
      locality: 'Saibaba Colony',
      ward: 'Ward 45 - Saibaba Colony',
      centreType: 'Plastic Recovery Unit',
      facilityCategory: 'Recycling Centre',
      isDisposalFacility: false,
      acceptedMaterials: ['Plastic', 'Recyclable'],
      location: {
        type: 'Point',
        coordinates: [76.9421, 11.0252]
      },
      operatingHours: '08:00 AM - 06:00 PM',
      contactPhone: '+91 422 244 5566',
      contactPerson: 'P. Anandhan (Unit Officer)',
      email: 'saibaba.plastic@ccmc.gov.in',
      verificationStatus: 'Verified Municipal Facility',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 15,
      handlingNotes: 'Plastic shredding and granule preparation for eco-paver block manufacturing.',
      isActive: true
    },
    {
      name: 'Singanallur Special Recovery & Hazardous Facility',
      address: 'Kamraj Road, Near Old Bus Stand, Singanallur, Coimbatore, Tamil Nadu 641005',
      locality: 'Singanallur',
      ward: 'Ward 54 - Singanallur',
      centreType: 'Hazardous Waste',
      facilityCategory: 'Disposal Facility',
      isDisposalFacility: true,
      acceptedMaterials: ['Hazardous', 'Medical', 'Battery'],
      location: {
        type: 'Point',
        coordinates: [77.0267, 10.9995]
      },
      operatingHours: '09:00 AM - 05:00 PM',
      contactPhone: '+91 422 259 8811',
      contactPerson: 'Dr. T. Murugesan (Hazmat Officer)',
      email: 'singanallur.hazmat@ccmc.gov.in',
      verificationStatus: 'Authorised Partner',
      operationalStatus: 'Operational',
      capacityTonnesPerDay: 8,
      handlingNotes: 'Certified quarantine and safe disposal centre for domestic biomedical waste and chemical containers.',
      isActive: true
    }
  ];

  for (const f of facilitiesData) {
    await RecyclingCentre.findOneAndUpdate(
      { name: f.name },
      { $set: f },
      { upsert: true, new: true }
    );
  }

  // --------------------------------------------------------------------------
  // 6. COLLECTION SCHEDULES
  // --------------------------------------------------------------------------
  console.log('Seeding Collection Schedules...');
  const today = new Date();
  const schedulesData = [
    {
      title: 'Ward 24 (RS Puram) - Curbside Organic & Wet Waste Morning Sweep',
      zone: 'West Zone',
      ward: 'Ward 24 - RS Puram',
      wardId: createdWards['Ward 24 - RS Puram']?._id,
      date: new Date(today.getTime() + 86400000), // Tomorrow
      dayOfWeek: 'Tomorrow',
      timeWindow: '06:30 AM - 09:30 AM (IST)',
      startTime: '06:30',
      endTime: '09:30',
      categories: ['Organic'],
      driverId: createdUsers['driver.demo@wastewise.org']._id,
      driverName: 'Karthik Raja',
      vehicleObjectId: createdVehicles['TN-38-BZ-4921']._id,
      vehicleId: 'TN-38-BZ-4921',
      vehiclePlate: 'TN-38-BZ-4921',
      status: 'Upcoming',
      isPublished: true,
      notes: 'Keep segregated green bins at doorstep by 06:30 AM.'
    },
    {
      title: 'Ward 38 (Peelamedu) - Dry Recyclables & Plastic Handover',
      zone: 'East Zone',
      ward: 'Ward 38 - Peelamedu',
      wardId: createdWards['Ward 38 - Peelamedu']?._id,
      date: new Date(today.getTime() + 2 * 86400000), // Day after tomorrow
      dayOfWeek: 'Friday',
      timeWindow: '08:30 AM - 12:30 PM (IST)',
      startTime: '08:30',
      endTime: '12:30',
      categories: ['Plastic', 'Recyclable', 'Paper', 'Glass'],
      driverId: createdUsers['senthil.driver@wastewise.org']._id,
      driverName: 'Senthil Kumar',
      vehicleObjectId: createdVehicles['TN-38-CX-1102']._id,
      vehicleId: 'TN-38-CX-1102',
      vehiclePlate: 'TN-38-CX-1102',
      status: 'Upcoming',
      isPublished: true,
      notes: 'Rinse plastic containers and bundle clean cardboard before handover.'
    },
    {
      title: 'Ward 32 (Gandhipuram) - Special Electronic & Hazardous Waste Drive',
      zone: 'Central Zone',
      ward: 'Ward 32 - Gandhipuram',
      wardId: createdWards['Ward 32 - Gandhipuram']?._id,
      date: new Date(today.getTime() + 3 * 86400000),
      dayOfWeek: 'Saturday',
      timeWindow: '09:00 AM - 02:00 PM (IST)',
      startTime: '09:00',
      endTime: '14:00',
      categories: ['Electronic', 'Medical'],
      driverId: createdUsers['murugan.driver@wastewise.org']._id,
      driverName: 'Muruganandam M.',
      vehicleObjectId: createdVehicles['TN-38-DF-7823']._id,
      vehicleId: 'TN-38-DF-7823',
      vehiclePlate: 'TN-38-DF-7823',
      status: 'Upcoming',
      isPublished: true,
      notes: 'Drop-off station open for discarded gadgets, charging wires, and batteries.'
    },
    {
      title: 'Ward 54 (Singanallur) - Commercial & Domestic Organic Collection',
      zone: 'East Zone',
      ward: 'Ward 54 - Singanallur',
      wardId: createdWards['Ward 54 - Singanallur']?._id,
      date: new Date(today.getTime() + 4 * 86400000),
      dayOfWeek: 'Sunday',
      timeWindow: '06:30 AM - 09:30 AM (IST)',
      startTime: '06:30',
      endTime: '09:30',
      categories: ['Organic'],
      driverId: createdUsers['rajesh.driver@wastewise.org']._id,
      driverName: 'Rajesh Kannan',
      vehicleObjectId: createdVehicles['TN-38-EA-3341']._id,
      vehicleId: 'TN-38-EA-3341',
      vehiclePlate: 'TN-38-EA-3341',
      status: 'Upcoming',
      isPublished: true,
      notes: 'Morning curbside organic collection for households and eateries along Trichy Road.'
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
  // 7. WASTE REPORTS (Pickup Requests with Realistic Statuses & Locations)
  // --------------------------------------------------------------------------
  console.log('Seeding Waste Reports...');
  const reportsData = [
    // 1. In Progress (Active on route)
    {
      trackingId: 'WW-84920',
      citizen: {
        userId: createdUsers['citizen.demo@wastewise.org']._id,
        name: 'Aarav Sundaram (Demo Citizen)',
        email: 'citizen.demo@wastewise.org',
        phone: '+91 98765 43210'
      },
      category: 'Plastic',
      subCategory: 'Clean PET bottles & containers',
      quantity: 3,
      unit: 'bags',
      location: {
        address: '42 Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu 641012',
        landmark: 'Opposite VOC Park Entrance',
        locality: 'Gandhipuram',
        ward: 'Ward 32 - Gandhipuram',
        coordinates: { lat: 11.0183, lng: 76.9691 }
      },
      ward: 'Ward 32 - Gandhipuram',
      locality: 'Gandhipuram',
      priority: 'Normal',
      status: 'In Progress',
      assignedDriver: {
        driverId: createdUsers['driver.demo@wastewise.org']._id,
        name: 'Karthik Raja',
        phone: '+91 94431 82910',
        driverIdCode: 'CBE-DRV-101',
        vehicleId: createdVehicles['TN-38-BZ-4921']._id,
        vehiclePlate: 'TN-38-BZ-4921'
      },
      pointsAwarded: false,
      createdAt: new Date(today.getTime() - 3 * 3600 * 1000)
    },
    // 2. Assigned (Ready for collection)
    {
      trackingId: 'WW-67104',
      citizen: {
        userId: createdUsers['priya.r@example.com']._id,
        name: 'Priya Ramasamy',
        email: 'priya.r@example.com',
        phone: '+91 97890 12345'
      },
      category: 'Electronic',
      subCategory: 'Dead Batteries, Laptop Charger & Broken Tablet',
      quantity: 2,
      unit: 'items',
      location: {
        address: '15 DB Road, RS Puram, Coimbatore, Tamil Nadu 641002',
        landmark: 'Near Flower Market Junction',
        locality: 'RS Puram',
        ward: 'Ward 24 - RS Puram',
        coordinates: { lat: 11.0086, lng: 76.9497 }
      },
      ward: 'Ward 24 - RS Puram',
      locality: 'RS Puram',
      priority: 'Normal',
      status: 'Assigned',
      assignedDriver: {
        driverId: createdUsers['anitha.driver@wastewise.org']._id,
        name: 'Anitha Velusamy',
        phone: '+91 98422 66789',
        driverIdCode: 'CBE-DRV-105',
        vehicleId: createdVehicles['TN-38-HAZ-009']._id,
        vehiclePlate: 'TN-38-HAZ-009'
      },
      pointsAwarded: false,
      createdAt: new Date(today.getTime() - 6 * 3600 * 1000)
    },
    // 3. Reported (Newly submitted pending review)
    {
      trackingId: 'WW-91240',
      citizen: {
        userId: createdUsers['manoj.kumar@example.com']._id,
        name: 'Manoj Kumar',
        email: 'manoj.kumar@example.com',
        phone: '+91 94432 98765'
      },
      category: 'Organic',
      subCategory: 'Garden cuttings & compostable kitchen scrap',
      quantity: 8,
      unit: 'kg',
      location: {
        address: '88 Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu 641004',
        landmark: 'Near PSG Tech Main Gate',
        locality: 'Peelamedu',
        ward: 'Ward 38 - Peelamedu',
        coordinates: { lat: 11.0285, lng: 77.0028 }
      },
      ward: 'Ward 38 - Peelamedu',
      locality: 'Peelamedu',
      priority: 'Normal',
      status: 'Reported',
      pointsAwarded: false,
      createdAt: new Date(today.getTime() - 2 * 3600 * 1000)
    },
    // 4. Confirmed (Verified by zone supervisor)
    {
      trackingId: 'WW-55319',
      citizen: {
        userId: createdUsers['kavitha.s@example.com']._id,
        name: 'Kavitha Selvam',
        email: 'kavitha.s@example.com',
        phone: '+91 98940 55432'
      },
      category: 'Recyclable',
      subCategory: 'Corrugated cartons and cardboard packaging',
      quantity: 5,
      unit: 'kg',
      location: {
        address: '24 NSR Road, Saibaba Colony, Coimbatore, Tamil Nadu 641011',
        landmark: 'Opposite Uzhavar Sandhai',
        locality: 'Saibaba Colony',
        ward: 'Ward 45 - Saibaba Colony',
        coordinates: { lat: 11.0252, lng: 76.9421 }
      },
      ward: 'Ward 45 - Saibaba Colony',
      locality: 'Saibaba Colony',
      priority: 'Normal',
      status: 'Confirmed',
      pointsAwarded: false,
      createdAt: new Date(today.getTime() - 12 * 3600 * 1000)
    },
    // 5. Collected & Recycled (Completed yesterday, points awarded)
    {
      trackingId: 'WW-39211',
      citizen: {
        userId: createdUsers['citizen.demo@wastewise.org']._id,
        name: 'Aarav Sundaram (Demo Citizen)',
        email: 'citizen.demo@wastewise.org',
        phone: '+91 98765 43210'
      },
      category: 'Organic',
      subCategory: 'Kitchen waste & vegetable peels',
      quantity: 12,
      unit: 'kg',
      location: {
        address: '42 Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu 641012',
        landmark: 'Opposite VOC Park Entrance',
        locality: 'Gandhipuram',
        ward: 'Ward 32 - Gandhipuram',
        coordinates: { lat: 11.0183, lng: 76.9691 }
      },
      ward: 'Ward 32 - Gandhipuram',
      locality: 'Gandhipuram',
      priority: 'Normal',
      status: 'Recycled',
      pointsAwarded: true,
      pointsAwardedAt: new Date(today.getTime() - 24 * 3600 * 1000),
      completedAt: new Date(today.getTime() - 24 * 3600 * 1000),
      aiClassification: {
        detectedCategory: 'Organic',
        confidence: 0.98,
        ecoPointsEarned: 120
      },
      assignedDriver: {
        driverId: createdUsers['driver.demo@wastewise.org']._id,
        name: 'Karthik Raja',
        phone: '+91 94431 82910',
        driverIdCode: 'CBE-DRV-101',
        vehicleId: createdVehicles['TN-38-BZ-4921']._id,
        vehiclePlate: 'TN-38-BZ-4921'
      },
      createdAt: new Date(today.getTime() - 48 * 3600 * 1000)
    },
    // 6. Collected (Singanallur)
    {
      trackingId: 'WW-44182',
      citizen: {
        userId: createdUsers['dinesh.b@example.com']._id,
        name: 'Dinesh Balaji',
        email: 'dinesh.b@example.com',
        phone: '+91 94862 11223'
      },
      category: 'Glass',
      subCategory: 'Clean glass sauce & juice bottles',
      quantity: 6,
      unit: 'kg',
      location: {
        address: '102 Trichy Road, Singanallur, Coimbatore, Tamil Nadu 641005',
        landmark: 'Near Singanallur Signal',
        locality: 'Singanallur',
        ward: 'Ward 54 - Singanallur',
        coordinates: { lat: 10.9995, lng: 77.0267 }
      },
      ward: 'Ward 54 - Singanallur',
      locality: 'Singanallur',
      priority: 'Normal',
      status: 'Collected',
      pointsAwarded: true,
      pointsAwardedAt: new Date(today.getTime() - 18 * 3600 * 1000),
      completedAt: new Date(today.getTime() - 18 * 3600 * 1000),
      aiClassification: {
        detectedCategory: 'Glass',
        confidence: 0.95,
        ecoPointsEarned: 90
      },
      assignedDriver: {
        driverId: createdUsers['rajesh.driver@wastewise.org']._id,
        name: 'Rajesh Kannan',
        phone: '+91 94862 11223',
        driverIdCode: 'CBE-DRV-104',
        vehicleId: createdVehicles['TN-38-EA-3341']._id,
        vehiclePlate: 'TN-38-EA-3341'
      },
      createdAt: new Date(today.getTime() - 36 * 3600 * 1000)
    },
    // 7. Metal Scrap (Peelamedu - Assigned)
    {
      trackingId: 'WW-78901',
      citizen: {
        userId: createdUsers['manoj.kumar@example.com']._id,
        name: 'Manoj Kumar',
        email: 'manoj.kumar@example.com',
        phone: '+91 94432 98765'
      },
      category: 'Metal',
      subCategory: 'Tin food cans & aluminum foils',
      quantity: 4,
      unit: 'kg',
      location: {
        address: '112 Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu 641004',
        landmark: 'Near Fun Republic Mall',
        locality: 'Peelamedu',
        ward: 'Ward 38 - Peelamedu',
        coordinates: { lat: 11.0298, lng: 77.0112 }
      },
      ward: 'Ward 38 - Peelamedu',
      locality: 'Peelamedu',
      priority: 'Normal',
      status: 'Assigned',
      assignedDriver: {
        driverId: createdUsers['senthil.driver@wastewise.org']._id,
        name: 'Senthil Kumar',
        phone: '+91 94420 55123',
        driverIdCode: 'CBE-DRV-102',
        vehicleId: createdVehicles['TN-38-CX-1102']._id,
        vehiclePlate: 'TN-38-CX-1102'
      },
      pointsAwarded: false,
      createdAt: new Date(today.getTime() - 8 * 3600 * 1000)
    },
    // 8. Plastic Bags (RS Puram - Reported)
    {
      trackingId: 'WW-23419',
      citizen: {
        userId: createdUsers['priya.r@example.com']._id,
        name: 'Priya Ramasamy',
        email: 'priya.r@example.com',
        phone: '+91 97890 12345'
      },
      category: 'Plastic',
      subCategory: 'LDPE packaging & clean grocery wraps',
      quantity: 2,
      unit: 'bags',
      location: {
        address: '56 Cowley Brown Road, RS Puram, Coimbatore, Tamil Nadu 641002',
        landmark: 'Near West Club',
        locality: 'RS Puram',
        ward: 'Ward 24 - RS Puram',
        coordinates: { lat: 11.0112, lng: 76.9450 }
      },
      ward: 'Ward 24 - RS Puram',
      locality: 'RS Puram',
      priority: 'Normal',
      status: 'Reported',
      pointsAwarded: false,
      createdAt: new Date(today.getTime() - 1 * 3600 * 1000)
    }
  ];

  for (const r of reportsData) {
    await WasteReport.findOneAndUpdate(
      { trackingId: r.trackingId },
      { $set: r },
      { upsert: true, new: true }
    );
  }

  // --------------------------------------------------------------------------
  // 8. CIVIC COMPLAINTS (Sanitation & Cleanliness Issues)
  // --------------------------------------------------------------------------
  console.log('Seeding Civic Complaints...');
  const complaintsData = [
    {
      title: 'Overflowing community bin near DB Road junction',
      category: 'Overflowing Public Bins',
      description: 'The green municipal bin on DB Road is completely full and garbage is spilling onto the footpath.',
      address: 'DB Road & 4th Cross Corner, RS Puram, Coimbatore',
      locality: 'RS Puram',
      ward: 'Ward 24 - RS Puram',
      priority: 'High',
      status: 'Assigned',
      citizen: {
        userId: createdUsers['priya.r@example.com']._id,
        name: 'Priya Ramasamy',
        email: 'priya.r@example.com',
        phone: '+91 97890 12345'
      },
      assignedWorker: {
        workerId: createdUsers['driver.demo@wastewise.org']._id,
        name: 'Karthik Raja',
        phone: '+91 94431 82910'
      },
      assignedDepartment: 'Solid Waste Management - West Zone',
      coordinates: { lat: 11.0086, lng: 76.9497 },
      createdAt: new Date(today.getTime() - 5 * 3600 * 1000)
    },
    {
      title: 'Missed door-to-door morning sweep on 7th Cross',
      category: 'Missed Garbage Collection',
      description: 'The regular sanitation trike did not visit odd-numbered houses on 7th cross today morning.',
      address: '7th Cross, Gandhipuram, Coimbatore',
      locality: 'Gandhipuram',
      ward: 'Ward 32 - Gandhipuram',
      priority: 'Medium',
      status: 'Under Review',
      citizen: {
        userId: createdUsers['citizen.demo@wastewise.org']._id,
        name: 'Aarav Sundaram (Demo Citizen)',
        email: 'citizen.demo@wastewise.org',
        phone: '+91 98765 43210'
      },
      assignedDepartment: 'Solid Waste Management - Central Zone',
      coordinates: { lat: 11.0183, lng: 76.9691 },
      createdAt: new Date(today.getTime() - 8 * 3600 * 1000)
    },
    {
      title: 'Illegal dumping of construction & garden waste on bypass',
      category: 'Illegal Dumping',
      description: 'Unauthorized dumping of tree trunks and broken cement blocks on the service lane.',
      address: 'Sungam Bypass Road, Near Ukkadam Lake Bund, Coimbatore',
      locality: 'Ukkadam',
      ward: 'Ward 81 - Ukkadam',
      priority: 'High',
      status: 'In Progress',
      citizen: {
        userId: createdUsers['dinesh.b@example.com']._id,
        name: 'Dinesh Balaji',
        email: 'dinesh.b@example.com',
        phone: '+91 94862 11223'
      },
      assignedDepartment: 'Enforcement & Debris Squad',
      assignedWorker: {
        workerId: createdUsers['rajesh.driver@wastewise.org']._id,
        name: 'Rajesh Kannan',
        phone: '+91 94862 11223'
      },
      coordinates: { lat: 10.9880, lng: 76.9630 },
      createdAt: new Date(today.getTime() - 14 * 3600 * 1000)
    },
    {
      title: 'Damaged community waste bin lid on Alagesan Road',
      category: 'Damaged Waste Collection Infrastructure',
      description: 'The heavy steel lid of the blue recyclables bin is broken, causing rain water to enter.',
      address: 'Alagesan Road, Saibaba Colony, Coimbatore',
      locality: 'Saibaba Colony',
      ward: 'Ward 45 - Saibaba Colony',
      priority: 'Low',
      status: 'Resolved',
      citizen: {
        userId: createdUsers['kavitha.s@example.com']._id,
        name: 'Kavitha Selvam',
        email: 'kavitha.s@example.com',
        phone: '+91 98940 55432'
      },
      resolutionNotes: 'Bin lid repaired and re-hinged by maintenance squad on 03-Nov.',
      assignedDepartment: 'Mechanical Workshop Depot',
      coordinates: { lat: 11.0252, lng: 76.9421 },
      createdAt: new Date(today.getTime() - 36 * 3600 * 1000)
    }
  ];

  for (const c of complaintsData) {
    await Complaint.findOneAndUpdate(
      { title: c.title },
      { $set: c },
      { upsert: true, new: true }
    );
  }

  // --------------------------------------------------------------------------
  // 9. COMMUNITY CAMPAIGNS & ANNOUNCEMENTS
  // --------------------------------------------------------------------------
  console.log('Seeding Community Campaigns...');
  const campaignsData = [
    {
      title: 'Namma Kovai Plastic-Free Sunday Drive',
      campaignType: 'Plastic-Free Campaign',
      description: 'Exchange single-use plastic covers for complimentary reusable cloth bags (Manjapai). Joint initiative with Coimbatore Resident Welfare Associations.',
      ward: 'Ward 24 - RS Puram',
      locality: 'RS Puram',
      venue: 'DB Road Pedestrian Plaza, RS Puram',
      startDate: new Date(today.getTime() + 86400000),
      endDate: new Date(today.getTime() + 3 * 86400000),
      startTime: '07:00 AM',
      endTime: '11:00 AM',
      targetAudience: 'Residents, Traders, and Shoppers',
      organizer: 'Coimbatore City Municipal Corporation & NGO Partners',
      contactPhone: '+91 422 239 0261',
      status: 'Published',
      isPublished: true
    },
    {
      title: 'Peelamedu Electronic & Battery SafeDrop Camp',
      campaignType: 'E-Waste Collection Drive',
      description: 'Special weekend drop-off camp for discarded computer cords, mobile batteries, keyboards, and fluorescent tubes. Earn double Eco-Points!',
      ward: 'Ward 38 - Peelamedu',
      locality: 'Peelamedu',
      venue: 'PSG Tech Open Auditorium Quadrangle',
      startDate: new Date(today.getTime() + 2 * 86400000),
      endDate: new Date(today.getTime() + 4 * 86400000),
      startTime: '09:00 AM',
      endTime: '04:00 PM',
      targetAudience: 'College Students, IT Employees, and Residents',
      organizer: 'CCMC East Zone & TNPCB Authorised Recyclers',
      contactPhone: '+91 422 257 0188',
      status: 'Published',
      isPublished: true
    },
    {
      title: 'Zero-Waste Home Composting Workshop',
      campaignType: 'Composting Workshop',
      description: 'Learn simple terracotta pot composting techniques to convert everyday kitchen scraps into nutrient-rich organic soil booster.',
      ward: 'Ward 45 - Saibaba Colony',
      locality: 'Saibaba Colony',
      venue: 'Community Hall, NSR Road',
      startDate: new Date(today.getTime() + 5 * 86400000),
      endDate: new Date(today.getTime() + 5 * 86400000),
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      targetAudience: 'Homeowners and Apartment Residents',
      organizer: 'CCMC Solid Waste Management Team',
      contactPhone: '+91 422 244 5566',
      status: 'Published',
      isPublished: true
    },
    {
      title: 'Singanallur Lake Bund Environmental Clean-up',
      campaignType: 'Clean-up Event',
      description: 'Volunteer weekend cleanliness and lake conservation drive to protect the biodiversity of Singanallur lake sanctuary.',
      ward: 'Ward 54 - Singanallur',
      locality: 'Singanallur',
      venue: 'Singanallur Lake Boat House Entrance',
      startDate: new Date(today.getTime() + 7 * 86400000),
      endDate: new Date(today.getTime() + 7 * 86400000),
      startTime: '06:30 AM',
      endTime: '09:30 AM',
      targetAudience: 'Volunteers, Youth Groups, and Environmental Enthusiasts',
      organizer: 'Coimbatore Corporation Environmental Wing',
      contactPhone: '+91 422 259 8811',
      status: 'Published',
      isPublished: true
    }
  ];

  for (const cmp of campaignsData) {
    await Campaign.findOneAndUpdate(
      { title: cmp.title },
      { $set: cmp },
      { upsert: true, new: true }
    );
  }

  // --------------------------------------------------------------------------
  // 10. ADMINISTRATIVE AUDIT LOGS
  // --------------------------------------------------------------------------
  console.log('Seeding Administrative Audit Trail...');
  const auditLogsData = [
    {
      adminId: createdUsers[process.env.ADMIN_EMAIL || 'admin@wastewise.org']._id,
      adminName: 'Coimbatore Municipal Supervisor',
      adminEmail: process.env.ADMIN_EMAIL || 'admin@wastewise.org',
      action: 'SYSTEM_INITIALIZED',
      entityType: 'SystemSettings',
      entityId: 'global_municipal_settings',
      summary: 'Initialized Coimbatore municipal operations platform with Asia/Kolkata timezone and regional fleet parameters.',
      timestamp: new Date(today.getTime() - 24 * 3600 * 1000)
    },
    {
      adminId: createdUsers[process.env.ADMIN_EMAIL || 'admin@wastewise.org']._id,
      adminName: 'Coimbatore Municipal Supervisor',
      adminEmail: process.env.ADMIN_EMAIL || 'admin@wastewise.org',
      action: 'SCHEDULE_PUBLISHED',
      entityType: 'Schedule',
      entityId: 'Ward 24 (RS Puram) - Curbside Organic',
      summary: 'Published morning organic curbside collection schedule for Ward 24 with assigned driver Karthik Raja.',
      timestamp: new Date(today.getTime() - 12 * 3600 * 1000)
    },
    {
      adminId: createdUsers[process.env.ADMIN_EMAIL || 'admin@wastewise.org']._id,
      adminName: 'Coimbatore Municipal Supervisor',
      adminEmail: process.env.ADMIN_EMAIL || 'admin@wastewise.org',
      action: 'PICKUP_ASSIGNED',
      entityType: 'PickupRequest',
      entityId: 'WW-84920',
      summary: 'Assigned pickup request WW-84920 (Plastic, 3 bags) to driver Karthik Raja (TN-38-BZ-4921).',
      timestamp: new Date(today.getTime() - 3 * 3600 * 1000)
    }
  ];

  for (const a of auditLogsData) {
    await AuditLog.create(a);
  }

  console.log('✅ Realistic Coimbatore municipal data populated successfully!');
  await mongoose.disconnect();
}

if (process.argv[1] && process.argv[1].includes('seedRealisticData.js')) {
  seedRealisticData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
