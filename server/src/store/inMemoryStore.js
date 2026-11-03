// In-memory data store for WasteWise localised for Coimbatore, Tamil Nadu, India

export const initialCentres = [
  {
    _id: 'c1',
    name: 'Vellalore Integrated Solid Waste Management Facility',
    address: 'Vellalore Road, Podanur Post',
    city: 'Coimbatore',
    coordinates: { lat: 10.9634, lng: 77.0125 },
    operatingHours: '06:00 - 18:00 (IST)',
    phone: '+91 422 241 0125',
    acceptedMaterials: ['Organic', 'Plastic', 'Recyclable'],
    materialSpecs: 'Wet Kitchen Waste, Compost, Yard Trimmings, Clean Segregated Plastics',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    distanceTimes: { walkMin: 35, bikeMin: 18, driveMin: 10 }
  },
  {
    _id: 'c2',
    name: 'Peelamedu E-Waste & Electronics SafeDrop',
    address: 'Avinashi Road, Near PSG Tech, Peelamedu',
    city: 'Coimbatore',
    coordinates: { lat: 11.0285, lng: 77.0028 },
    operatingHours: '09:00 - 18:00 (IST)',
    phone: '+91 422 257 0188',
    acceptedMaterials: ['Electronic', 'Batteries', 'Metal'],
    materialSpecs: 'Computer Peripherals, Lithium/Lead-Acid Batteries, Copper Cables, PCB Units',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    distanceTimes: { walkMin: 20, bikeMin: 10, driveMin: 5 }
  },
  {
    _id: 'c3',
    name: 'RS Puram Plastic & Glass Segregation Station',
    address: 'Diwan Bahadur Road, RS Puram West',
    city: 'Coimbatore',
    coordinates: { lat: 11.0086, lng: 76.9497 },
    operatingHours: '07:00 - 19:00 (IST)',
    phone: '+91 422 254 0199',
    acceptedMaterials: ['Plastic', 'Glass', 'Recyclable'],
    materialSpecs: 'PET Bottles, HDPE Drums, LDPE Wraps, Beverage & Pickle Glass Jars',
    imageUrl: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    distanceTimes: { walkMin: 15, bikeMin: 8, driveMin: 4 }
  },
  {
    _id: 'c4',
    name: 'Ukkadam Secondary Resource Recovery Centre',
    address: 'Sungam Bypass Road, Ukkadam',
    city: 'Coimbatore',
    coordinates: { lat: 10.9880, lng: 76.9630 },
    operatingHours: '08:00 - 17:30 (IST)',
    phone: '+91 422 230 0245',
    acceptedMaterials: ['Medical', 'Metal', 'Recyclable'],
    materialSpecs: 'Sanitary Waste, Safe Sharps Containers, Metal Scraps & Tin Cans',
    imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    distanceTimes: { walkMin: 25, bikeMin: 12, driveMin: 7 }
  }
];

export const initialSchedules = [
  {
    _id: 's1',
    title: 'Ward 24 (Peelamedu) - Curbside Organic & Wet Waste Round',
    zone: 'East Zone - Ward 24, Peelamedu',
    date: new Date(Date.now() + 86400000).toISOString(),
    dayOfWeek: 'Tomorrow',
    timeWindow: '06:30 AM - 09:30 AM (IST)',
    categories: ['Organic'],
    driverName: 'Senthil Kumar',
    vehicleId: 'TN-38-BZ-4921',
    status: 'Upcoming',
    notes: 'Please keep green wet-waste bins segregated at doorstep by 06:30 AM'
  },
  {
    _id: 's2',
    title: 'Ward 58 (RS Puram) - Dry Recyclables & Plastic Collection',
    zone: 'West Zone - Ward 58, RS Puram',
    date: new Date(Date.now() + 172800000).toISOString(),
    dayOfWeek: 'Friday',
    timeWindow: '08:30 AM - 12:30 PM (IST)',
    categories: ['Recycling', 'Plastic', 'Metal', 'Glass'],
    driverName: 'Karthik Raja',
    vehicleId: 'TN-38-CX-1102',
    status: 'Upcoming',
    notes: 'Rinse milk pouches, plastic bottles, and paper cartons before handover'
  },
  {
    _id: 's3',
    title: 'Ward 72 (Gandhipuram & Town Hall) - Hazardous & E-Waste Drive',
    zone: 'Central Zone - Ward 72, Gandhipuram',
    date: new Date(Date.now() + 259200000).toISOString(),
    dayOfWeek: 'Saturday',
    timeWindow: '09:00 AM - 02:00 PM (IST)',
    categories: ['Electronic', 'Medical'],
    driverName: 'Muruganandam',
    vehicleId: 'TN-38-HAZ-04',
    status: 'Upcoming',
    notes: 'Safely box old cellphones, computer cords, tube lights and household batteries'
  }
];

export const initialReports = [
  {
    _id: 'r1',
    trackingId: 'WW-84920',
    citizen: {
      userId: 'u1',
      name: 'Aarav Sundaram',
      email: 'aarav@example.com',
      phone: '+91 98765 43210'
    },
    category: 'Plastic',
    subCategory: 'PETE 1 Water & Beverage Bottles',
    quantity: 2,
    unit: 'bags',
    location: {
      address: '42 Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu',
      landmark: 'Opposite VOC Park Entrance',
      coordinates: { lat: 11.0183, lng: 76.9691 }
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
    status: 'Assigned',
    assignedDriver: {
      driverId: 'd1',
      name: 'Karthik Raja',
      phone: '+91 94431 82910',
      driverIdCode: 'CBE-DRV-104',
      vehiclePlate: 'TN-38-BZ-4921',
      isLiveStreaming: false,
      currentLocation: null,
      distanceKm: null,
      etaMinutes: null
    },
    notes: 'Plastic bottles sorted and compacted in recyclable bags.',
    timeline: [
      { status: 'Reported', timestamp: new Date(Date.now() - 7200000).toISOString(), note: 'Citizen submitted waste pickup request' },
      { status: 'Confirmed', timestamp: new Date(Date.now() - 5400000).toISOString(), note: 'Pickup verified by Coimbatore Municipal Smart System' },
      { status: 'Assigned', timestamp: new Date(Date.now() - 3600000).toISOString(), note: 'Assigned to Municipal Courier Karthik Raja (TN-38-BZ-4921)' }
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    _id: 'r2',
    trackingId: 'WW-67104',
    citizen: {
      userId: 'u1',
      name: 'Aarav Sundaram',
      email: 'aarav@example.com',
      phone: '+91 98765 43210'
    },
    category: 'Electronic',
    subCategory: 'Dead Batteries & Old Computer Keyboard',
    quantity: 1,
    unit: 'bags',
    location: {
      address: '15 DB Road, RS Puram, Coimbatore, Tamil Nadu',
      landmark: 'Near Flower Market',
      coordinates: { lat: 11.0086, lng: 76.9497 }
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
      timeSlot: '09:00 AM - 12:00 PM'
    },
    status: 'Reported',
    assignedDriver: {
      name: 'Awaiting Driver Assignment',
      phone: '+91 94431 82910',
      driverIdCode: 'CBE-DRV-101',
      vehiclePlate: 'TN-38-BZ-4921',
      isLiveStreaming: false,
      currentLocation: null,
      distanceKm: null,
      etaMinutes: null
    },
    notes: 'Safe container used for household batteries.',
    timeline: [
      { status: 'Reported', timestamp: new Date(Date.now() - 14400000).toISOString(), note: 'E-waste request logged in Coimbatore West Zone' }
    ],
    createdAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    _id: 'r3',
    trackingId: 'WW-39211',
    citizen: {
      userId: 'u2',
      name: 'Priya Ramasamy',
      email: 'priya@example.com',
      phone: '+91 97890 12345'
    },
    category: 'Organic',
    subCategory: 'Compostable Fruit & Vegetable Peels',
    quantity: 4,
    unit: 'kg',
    location: {
      address: '88 Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu',
      landmark: 'Opposite PSG Tech Main Gate',
      coordinates: { lat: 11.0285, lng: 77.0028 }
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
      timeSlot: '07:00 AM - 09:00 AM'
    },
    status: 'Collected',
    assignedDriver: {
      name: 'Senthil Kumar',
      phone: '+91 94420 55123',
      driverIdCode: 'CBE-DRV-088',
      vehiclePlate: 'TN-38-CX-1102',
      isLiveStreaming: false,
      currentLocation: null
    },
    notes: 'Collected and transported to Vellalore Integrated Waste Facility.',
    timeline: [
      { status: 'Reported', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'Reported by resident' },
      { status: 'Confirmed', timestamp: new Date(Date.now() - 72000000).toISOString(), note: 'Verified by zone supervisor' },
      { status: 'Assigned', timestamp: new Date(Date.now() - 54000000).toISOString(), note: 'Assigned to driver Senthil Kumar' },
      { status: 'Collected', timestamp: new Date(Date.now() - 18000000).toISOString(), note: 'Waste collected from curbside' },
      { status: 'Recycled', timestamp: new Date(Date.now() - 9000000).toISOString(), note: 'Processed at Vellalore Composting Facility' }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const initialUsers = [
  {
    _id: 'u1',
    name: 'Aarav Sundaram',
    email: 'aarav@example.com',
    password: '$2a$10$.Q4S33Cx3PdZ2GeCcM43PuF8NDHzV0D/wa8C/qOI2bGUjB0qlbUqu',
    role: 'citizen',
    phone: '+91 98765 43210',
    address: {
      street: '42 Cross Cut Road',
      locality: 'Gandhipuram',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      zip: '641001',
      coordinates: { lat: 11.0183, lng: 76.9691 }
    },
    ecoPoints: 1250,
    co2SavedKg: 24.8,
    ecoLevel: 'Level Eco Green 82',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  {
    _id: 'u2',
    name: 'Karthik Raja',
    email: 'karthik@wastewise.org',
    password: '$2a$10$SbtmOigOzLQYCjEniP28bOdq.ql3kMYV4STJ.RjdMkEWK8z5qHmwe',
    role: 'driver',
    phone: '+91 94431 82910',
    address: { 
      street: 'Central Fleet Depot, Town Hall', 
      locality: 'Town Hall',
      city: 'Coimbatore', 
      state: 'Tamil Nadu',
      zip: '641001' 
    },
    ecoPoints: 4800,
    co2SavedKg: 182.5,
    ecoLevel: 'Eco Champion Gold',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    _id: 'u3',
    name: 'Coimbatore Municipal Supervisor',
    email: 'admin@wastewise.org',
    password: '$2a$10$2U/JWMhZq2JQ4yWalegGxuI08YsQ0gWFkY/HrDMYSgfXHOzkErWJq',
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
