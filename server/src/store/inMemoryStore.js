// In-memory data store for WasteWise with realistic pre-populated data matching the UI images

export const initialCentres = [
  {
    _id: 'c1',
    name: 'Bronx Composting Station',
    address: '123 Main Street, New York, NY 10001',
    city: 'New York',
    coordinates: { lat: 40.8448, lng: -73.8648 },
    operatingHours: '00:00 - 23:59 (24/7)',
    phone: '+1 (212) 555-0143',
    acceptedMaterials: ['Organic', 'Plastic', 'Recyclable'],
    materialSpecs: 'Compost, Food Scraps, Yard Waste, Biodegradable Bags',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    distanceTimes: { walkMin: 20, bikeMin: 10, driveMin: 5 }
  },
  {
    _id: 'c2',
    name: 'Bronx Battery & E-Waste Station',
    address: '8 Main Street, New York, NY 10301',
    city: 'New York',
    coordinates: { lat: 40.8520, lng: -73.8790 },
    operatingHours: '08:00 - 18:00',
    phone: '+1 (212) 555-0188',
    acceptedMaterials: ['Electronic', 'Batteries', 'Metal'],
    materialSpecs: 'AA, Lithium-Ion, NiMH, Laptops, Circuit Boards, Cables',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    distanceTimes: { walkMin: 25, bikeMin: 12, driveMin: 6 }
  },
  {
    _id: 'c3',
    name: 'Manhattan Plastic & Glass Recovery',
    address: '135 Main Street, New York, NY 10001',
    city: 'New York',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    operatingHours: '07:00 - 20:00',
    phone: '+1 (212) 555-0199',
    acceptedMaterials: ['Plastic', 'Glass', 'Recyclable'],
    materialSpecs: 'PET, HDPE, LDPE, Clear/Colored Glass Bottles, Jars',
    imageUrl: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    distanceTimes: { walkMin: 15, bikeMin: 8, driveMin: 4 }
  },
  {
    _id: 'c4',
    name: 'Brooklyn Medical & Hazardous SafeDrop',
    address: '42 Atlantic Ave, Brooklyn, NY 11201',
    city: 'New York',
    coordinates: { lat: 40.6925, lng: -73.9904 },
    operatingHours: '09:00 - 17:00',
    phone: '+1 (718) 555-0245',
    acceptedMaterials: ['Medical'],
    materialSpecs: 'Expired Medicines, Safe Sharps Containers, Bio-PPE',
    imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    distanceTimes: { walkMin: 30, bikeMin: 15, driveMin: 9 }
  }
];

export const initialSchedules = [
  {
    _id: 's1',
    title: 'Zone North - Organic & Composting Round',
    zone: 'District 4 - Metro North',
    date: new Date(Date.now() + 86400000).toISOString(),
    dayOfWeek: 'Tomorrow (Thu)',
    timeWindow: '07:00 AM - 09:00 AM',
    categories: ['Organic', 'General'],
    driverName: 'Muhammad Gilang Pratama',
    vehicleId: 'TRK-GREEN-08',
    status: 'Upcoming',
    notes: 'Please place organic food scraps and green bins at the curb by 6:45 AM'
  },
  {
    _id: 's2',
    title: 'Zone Central - Plastic & Recyclables Drive',
    zone: 'District 2 - Central Ward',
    date: new Date(Date.now() + 172800000).toISOString(),
    dayOfWeek: 'Friday',
    timeWindow: '09:00 AM - 12:00 PM',
    categories: ['Recycling', 'Plastic', 'Metal', 'Glass'],
    driverName: 'Travis Jordan',
    vehicleId: 'TRK-RECYCLE-12',
    status: 'Upcoming',
    notes: 'Rinse plastic bottles and crush cartons before setting out'
  },
  {
    _id: 's3',
    title: 'Zone East - Electronics & Hazardous Special Drop',
    zone: 'District 7 - East Borough',
    date: new Date(Date.now() + 259200000).toISOString(),
    dayOfWeek: 'Saturday',
    timeWindow: '10:00 AM - 02:00 PM',
    categories: ['Electronic', 'Medical'],
    driverName: 'Elena Rostova',
    vehicleId: 'VAN-HAZMAT-03',
    status: 'Upcoming',
    notes: 'Safely box old laptops, lithium batteries, and electronics'
  }
];

export const initialReports = [
  {
    _id: 'r1',
    trackingId: 'WW-84920',
    citizen: {
      userId: 'u1',
      name: 'Alex Navillera',
      email: 'alex@example.com',
      phone: '+1 (555) 234-5678'
    },
    category: 'Plastic',
    subCategory: 'PETE 1 Plastic Bottles & Food Containers',
    quantity: 2,
    unit: 'bags',
    location: {
      address: 'Lake Star Dist. No48, Buffalo, NY, USA',
      landmark: 'Near Central Green Park Entrance',
      coordinates: { lat: 40.8448, lng: -73.8648 }
    },
    imageUrl: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=600&q=80',
    aiClassification: {
      detectedCategory: 'Plastic',
      confidence: 0.96,
      estimatedCO2Grams: 120,
      ecoPointsEarned: 25
    },
    preferredSlot: {
      date: new Date(Date.now() + 86400000).toISOString(),
      dayName: 'Tomorrow',
      timeSlot: '07:00 AM - 09:00 AM'
    },
    status: 'In Progress',
    assignedDriver: {
      driverId: 'd1',
      name: 'Travis Jordan',
      phone: '+1 (587) 254-2365',
      driverIdCode: 'DRV-587-254-2365',
      vehiclePlate: 'NY-EV-7821',
      currentLocation: { lat: 40.8520, lng: -73.8720 },
      distanceKm: 3.4,
      etaMinutes: 8
    },
    notes: 'Bottles crushed and packed in recyclable paper bag as per GreenCove guide.',
    timeline: [
      { status: 'Reported', timestamp: new Date(Date.now() - 7200000).toISOString(), note: 'Citizen submitted waste pickup request' },
      { status: 'Confirmed', timestamp: new Date(Date.now() - 5400000).toISOString(), note: 'Pickup verified by WasteWise Smart System' },
      { status: 'Assigned', timestamp: new Date(Date.now() - 3600000).toISOString(), note: 'Assigned to Courier Travis Jordan (EV-7821)' },
      { status: 'In Progress', timestamp: new Date(Date.now() - 1200000).toISOString(), note: 'Driver is on the way to pickup location' }
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    _id: 'r2',
    trackingId: 'WW-67104',
    citizen: {
      userId: 'u1',
      name: 'Alex Navillera',
      email: 'alex@example.com',
      phone: '+1 (555) 234-5678'
    },
    category: 'Electronic',
    subCategory: 'Dead AA Batteries & Old Monitor',
    quantity: 1,
    unit: 'bags',
    location: {
      address: 'Jackson Road Lane no 7, Buffalo, NY',
      landmark: 'Green Bin Recycle Booth #4',
      coordinates: { lat: 40.8580, lng: -73.8610 }
    },
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80',
    aiClassification: {
      detectedCategory: 'Electronic',
      confidence: 0.92,
      estimatedCO2Grams: 450,
      ecoPointsEarned: 50
    },
    preferredSlot: {
      date: new Date(Date.now() + 172800000).toISOString(),
      dayName: 'Friday',
      timeSlot: '10:00 AM - 12:00 PM'
    },
    status: 'Assigned',
    assignedDriver: {
      name: 'Elena Rostova',
      phone: '+1 (555) 782-9912',
      driverIdCode: 'DRV-782-991',
      vehiclePlate: 'NY-EV-3310',
      currentLocation: { lat: 40.8600, lng: -73.8600 },
      distanceKm: 5.1,
      etaMinutes: 14
    },
    notes: 'Safe container used for lithium batteries.',
    timeline: [
      { status: 'Reported', timestamp: new Date(Date.now() - 14400000).toISOString(), note: 'E-waste report received' },
      { status: 'Confirmed', timestamp: new Date(Date.now() - 10800000).toISOString(), note: 'Scheduled for specialized recycling facility' },
      { status: 'Assigned', timestamp: new Date(Date.now() - 7200000).toISOString(), note: 'Assigned to driver Elena Rostova' }
    ],
    createdAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    _id: 'r3',
    trackingId: 'WW-39211',
    citizen: {
      userId: 'u2',
      name: 'David Miller',
      email: 'david@example.com',
      phone: '+1 (555) 345-9821'
    },
    category: 'Organic',
    subCategory: 'Compostable Vegetable & Fruit Scraps',
    quantity: 5,
    unit: 'kg',
    location: {
      address: '24 Pine Street, Buffalo, NY',
      landmark: 'Next to Community Garden',
      coordinates: { lat: 40.8390, lng: -73.8710 }
    },
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
    aiClassification: {
      detectedCategory: 'Organic',
      confidence: 0.98,
      estimatedCO2Grams: 300,
      ecoPointsEarned: 35
    },
    preferredSlot: {
      date: new Date().toISOString(),
      dayName: 'Today',
      timeSlot: '02:00 PM - 05:00 PM'
    },
    status: 'Collected',
    assignedDriver: {
      name: 'Muhammad Gilang Pratama',
      phone: '+1 (555) 431-8921',
      driverIdCode: 'DRV-431-892',
      vehiclePlate: 'TRK-GREEN-08'
    },
    notes: 'Collected and transported to Bronx Composting Station.',
    timeline: [
      { status: 'Reported', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'Reported by citizen' },
      { status: 'Confirmed', timestamp: new Date(Date.now() - 72000000).toISOString(), note: 'Confirmed' },
      { status: 'Assigned', timestamp: new Date(Date.now() - 54000000).toISOString(), note: 'Assigned' },
      { status: 'In Progress', timestamp: new Date(Date.now() - 36000000).toISOString(), note: 'Driver en route' },
      { status: 'Collected', timestamp: new Date(Date.now() - 18000000).toISOString(), note: 'Waste successfully picked up' },
      { status: 'Recycled', timestamp: new Date(Date.now() - 9000000).toISOString(), note: 'Composted at Bronx facility' }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const initialUsers = [
  {
    _id: 'u1',
    name: 'Alex Navillera',
    email: 'alex@example.com',
    password: '$2a$10$hashedpasswordplaceholder',
    role: 'citizen',
    phone: '+1 (555) 234-5678',
    address: {
      street: 'Lake Star Dist. No48',
      city: 'Buffalo',
      state: 'NY',
      zip: '14201',
      coordinates: { lat: 40.8448, lng: -73.8648 }
    },
    ecoPoints: 1250,
    co2SavedKg: 24.8,
    ecoLevel: 'Level Eco Green 82',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  {
    _id: 'u2',
    name: 'Travis Jordan',
    email: 'travis@wastewise.org',
    role: 'driver',
    phone: '+1 (587) 254-2365',
    address: { street: 'Depot 4 - Station North', city: 'Buffalo', state: 'NY' },
    ecoPoints: 4800,
    co2SavedKg: 182.5,
    ecoLevel: 'Eco Champion Gold',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    _id: 'u3',
    name: 'Admin Supervisor',
    email: 'admin@wastewise.org',
    role: 'admin',
    phone: '+1 (555) 999-0000',
    address: { street: 'City Municipal HQ', city: 'Buffalo', state: 'NY' },
    ecoPoints: 9999,
    co2SavedKg: 850.0,
    ecoLevel: 'City Guardian Master',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
  }
];

// In-Memory state holder
export const inMemoryDB = {
  users: [...initialUsers],
  reports: [...initialReports],
  centres: [...initialCentres],
  schedules: [...initialSchedules]
};
