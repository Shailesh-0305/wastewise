const API_BASE = 'http://localhost:5000/api';

// Helper for HTTP headers with JWT Bearer token
const getHeaders = (includeAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

// Fallback Mock State for GitHub Pages standalone deployment
const mockCentres = [
  {
    _id: 'c1',
    name: 'Bronx Composting Station',
    address: '123 Main Street, New York, NY 10001',
    city: 'New York',
    coordinates: { lat: 40.8448, lng: -73.8648 },
    operatingHours: '00:00 - 23:59 (24/7)',
    phone: '+1 (212) 555-0143',
    acceptedMaterials: ['Organic', 'Plastic', 'Recyclable'],
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
    imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    distanceTimes: { walkMin: 30, bikeMin: 15, driveMin: 9 }
  }
];

const mockSchedules = [
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
    status: 'Upcoming'
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
    status: 'Upcoming'
  }
];

let mockReports = [
  {
    _id: 'r1',
    trackingId: 'WW-84920',
    citizen: { name: 'Alex Navillera', phone: '+1 (555) 234-5678' },
    category: 'Plastic',
    quantity: 2,
    unit: 'bags',
    location: {
      address: 'Lake Star Dist. No48, Buffalo, NY, USA',
      coordinates: { lat: 40.8448, lng: -73.8648 }
    },
    status: 'In Progress',
    assignedDriver: {
      name: 'Travis Jordan',
      phone: '+1 (587) 254-2365',
      driverIdCode: 'DRV-587-254-2365',
      vehiclePlate: 'NY-EV-7821',
      distanceKm: 3.4,
      etaMinutes: 8
    },
    createdAt: new Date().toISOString()
  },
  {
    _id: 'r2',
    trackingId: 'WW-67104',
    citizen: { name: 'Alex Navillera', phone: '+1 (555) 234-5678' },
    category: 'Electronic',
    quantity: 1,
    unit: 'bags',
    location: {
      address: 'Jackson Road Lane no 7, Buffalo, NY',
      coordinates: { lat: 40.8580, lng: -73.8610 }
    },
    status: 'Assigned',
    assignedDriver: {
      name: 'Elena Rostova',
      phone: '+1 (555) 782-9912',
      vehiclePlate: 'NY-EV-3310',
      distanceKm: 5.1,
      etaMinutes: 14
    },
    createdAt: new Date().toISOString()
  },
  {
    _id: 'r3',
    trackingId: 'WW-39211',
    citizen: { name: 'David Miller', phone: '+1 (555) 345-9821' },
    category: 'Organic',
    quantity: 5,
    unit: 'kg',
    location: {
      address: '24 Pine Street, Buffalo, NY',
      coordinates: { lat: 40.8390, lng: -73.8710 }
    },
    status: 'Collected',
    assignedDriver: {
      name: 'Muhammad Gilang Pratama',
      phone: '+1 (555) 431-8921',
      vehiclePlate: 'TRK-GREEN-08'
    },
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const api = {
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
      return await res.json();
    } catch {
      return { status: 'offline' };
    }
  },

  // Authentication
  register: async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        signal: AbortSignal.timeout(5000)
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (e) {
      return { success: false, message: e.message || 'Server connection failed' };
    }
  },

  login: async (credentials) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        signal: AbortSignal.timeout(5000)
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (e) {
      return { success: false, message: e.message || 'Server connection failed' };
    }
  },

  getMe: async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const saved = localStorage.getItem('user');
    return saved ? { success: true, user: JSON.parse(saved) } : { success: false };
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Waste Reports CRUD
  getReports: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/reports?${query}`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    let list = [...mockReports];
    if (params.category && params.category !== 'All') {
      list = list.filter(r => r.category.toLowerCase() === params.category.toLowerCase());
    }
    if (params.status && params.status !== 'All') {
      list = list.filter(r => r.status.toLowerCase() === params.status.toLowerCase());
    }
    return { success: true, count: list.length, reports: list };
  },

  createReport: async (reportData) => {
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(reportData),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const newReport = {
      _id: 'r_' + Date.now(),
      trackingId: 'WW-' + Math.floor(10000 + Math.random() * 90000),
      citizen: { name: 'Alex Navillera', phone: '+1 (555) 234-5678' },
      category: reportData.category,
      quantity: reportData.quantity,
      unit: reportData.unit || 'bags',
      location: {
        address: reportData.address,
        landmark: reportData.landmark || '',
        coordinates: { lat: reportData.lat || 40.8448, lng: reportData.lng || -73.8648 }
      },
      status: 'Reported',
      assignedDriver: {
        name: 'Travis Jordan',
        phone: '+1 (587) 254-2365',
        driverIdCode: 'DRV-587-254-2365',
        vehiclePlate: 'NY-EV-7821',
        distanceKm: 3.4,
        etaMinutes: 8
      },
      createdAt: new Date().toISOString()
    };
    mockReports.unshift(newReport);
    return { success: true, report: newReport };
  },

  updateReportStatus: async (id, status, note = '') => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ status, note }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const r = mockReports.find(x => x._id === id || x.trackingId === id);
    if (r) r.status = status;
    return { success: true, report: r };
  },

  assignDriver: async (id, driverData) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/assign`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify(driverData),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { success: true };
  },

  deleteReport: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    mockReports = mockReports.filter(x => x._id !== id && x.trackingId !== id);
    return { success: true, message: 'Deleted' };
  },

  // Recycling Centres
  getCentres: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/centers?${query}`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { success: true, count: mockCentres.length, centres: mockCentres };
  },

  // Schedules
  getSchedules: async () => {
    try {
      const res = await fetch(`${API_BASE}/schedules`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { success: true, schedules: mockSchedules };
  },

  // Analytics
  getAnalytics: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/overview`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    return {
      success: true,
      stats: {
        totalRequests: mockReports.length,
        activePickups: mockReports.filter(r => ['Reported', 'Assigned', 'In Progress'].includes(r.status)).length,
        completedPickups: mockReports.filter(r => ['Collected', 'Recycled'].includes(r.status)).length,
        totalWasteKg: 17,
        recyclingRate: 33.3,
        categoryDistribution: [
          { category: 'Plastic', count: 1, weightKg: 8, percentage: 47 },
          { category: 'Organic', count: 1, weightKg: 5, percentage: 29 },
          { category: 'Electronic', count: 1, weightKg: 4, percentage: 24 },
          { category: 'Medical', count: 0, weightKg: 0, percentage: 0 },
          { category: 'Recyclable', count: 0, weightKg: 0, percentage: 0 },
          { category: 'Metal', count: 0, weightKg: 0, percentage: 0 },
          { category: 'Glass', count: 0, weightKg: 0, percentage: 0 }
        ],
        monthlyTrends: [
          { month: 'Jun', collectedKg: 120, recycledKg: 105 },
          { month: 'Jul', collectedKg: 180, recycledKg: 160 },
          { month: 'Aug', collectedKg: 240, recycledKg: 210 },
          { month: 'Sep', collectedKg: 310, recycledKg: 280 },
          { month: 'Oct', collectedKg: 390, recycledKg: 350 },
          { month: 'Nov', collectedKg: 17, recycledKg: 5 }
        ],
        environmentalEstimates: {
          co2SavedKg: 12.2,
          treesPreserved: 0.6,
          kwhEnergySaved: 30.6,
          isEstimated: true,
          notice: 'Figures estimated using EPA carbon metrics.'
        }
      }
    };
  },

  // Route Optimization (TSP)
  getOptimizedRoute: async () => {
    try {
      const res = await fetch(`${API_BASE}/routes/collection-route`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    return {
      success: true,
      totalStops: mockReports.length,
      totalDistanceKm: 4.4,
      estimatedTimeMin: 27,
      fuelSavedPercent: 28.5,
      waypoints: [
        { name: 'Depot Start', type: 'depot', coordinates: { lat: 40.8520, lng: -73.8790 } },
        ...mockReports.map(r => ({ citizenName: r.citizen.name, category: r.category, coordinates: r.location.coordinates, type: 'pickup' })),
        { name: 'Bronx Composting Station', type: 'dropoff', coordinates: { lat: 40.8448, lng: -73.8648 } }
      ]
    };
  }
};
