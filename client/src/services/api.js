const API_BASE = 'http://localhost:5000/api';

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
  }
];

export const api = {
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1200) });
      return await res.json();
    } catch {
      return { status: 'offline' };
    }
  },

  getReports: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/reports?${query}`, { signal: AbortSignal.timeout(1200) });
      if (res.ok) return await res.json();
    } catch (e) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch (e) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }

    const r = mockReports.find(x => x._id === id || x.trackingId === id);
    if (r) r.status = status;
    return { success: true, report: r };
  },

  deleteReport: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }

    mockReports = mockReports.filter(x => x._id !== id && x.trackingId !== id);
    return { success: true, message: 'Deleted' };
  },

  getCentres: async () => {
    try {
      const res = await fetch(`${API_BASE}/centers`, { signal: AbortSignal.timeout(1200) });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, centres: mockCentres };
  },

  getSchedules: async () => {
    try {
      const res = await fetch(`${API_BASE}/schedules`, { signal: AbortSignal.timeout(1200) });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, schedules: mockSchedules };
  },

  getAnalytics: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/overview`, { signal: AbortSignal.timeout(1200) });
      if (res.ok) return await res.json();
    } catch {}

    return {
      success: true,
      stats: {
        totalRequests: mockReports.length + 184,
        activePickups: mockReports.filter(r => ['Reported', 'Assigned', 'In Progress'].includes(r.status)).length,
        collectedPickups: 168,
        totalWasteKg: 4280,
        co2SavedKg: 3081,
        ecoPointsTotal: 48500,
        recyclingRate: 88.4,
        categoryDistribution: [
          { category: 'Plastic', percentage: 38 },
          { category: 'Organic', percentage: 24 },
          { category: 'Electronic', percentage: 14 },
          { category: 'Recyclable', percentage: 12 },
          { category: 'Glass', percentage: 7 },
          { category: 'Metal', percentage: 5 }
        ],
        monthlyTrends: [
          { month: 'May', collectedKg: 2840, recycledKg: 2410 },
          { month: 'Jun', collectedKg: 3120, recycledKg: 2780 },
          { month: 'Jul', collectedKg: 3590, recycledKg: 3150 },
          { month: 'Aug', collectedKg: 3940, recycledKg: 3520 },
          { month: 'Sep', collectedKg: 4210, recycledKg: 3840 },
          { month: 'Oct', collectedKg: 4280, recycledKg: 3800 }
        ]
      }
    };
  },

  getOptimizedRoute: async () => {
    try {
      const res = await fetch(`${API_BASE}/routes/collection-route`, { signal: AbortSignal.timeout(1200) });
      if (res.ok) return await res.json();
    } catch {}

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
