const API_BASE = 'http://localhost:5000/api';

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

export const api = {
  // Health
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await handleResponse(res);
    } catch (e) {
      console.warn('API health check error:', e);
      return { status: 'offline' };
    }
  },

  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await handleResponse(res);
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`);
    return await handleResponse(res);
  },

  // Reports / Pickups CRUD
  getReports: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reports?${query}`);
    return await handleResponse(res);
  },

  getReportById: async (id) => {
    const res = await fetch(`${API_BASE}/reports/${id}`);
    return await handleResponse(res);
  },

  createReport: async (reportData) => {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    return await handleResponse(res);
  },

  updateReportStatus: async (id, status, note = '') => {
    const res = await fetch(`${API_BASE}/reports/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note })
    });
    return await handleResponse(res);
  },

  assignDriver: async (id, driverData) => {
    const res = await fetch(`${API_BASE}/reports/${id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driverData)
    });
    return await handleResponse(res);
  },

  deleteReport: async (id) => {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'DELETE'
    });
    return await handleResponse(res);
  },

  // Recycling Centres CRUD
  getCentres: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/centers?${query}`);
    return await handleResponse(res);
  },

  createCentre: async (centreData) => {
    const res = await fetch(`${API_BASE}/centers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(centreData)
    });
    return await handleResponse(res);
  },

  // Collection Schedules CRUD
  getSchedules: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/schedules?${query}`);
    return await handleResponse(res);
  },

  createSchedule: async (scheduleData) => {
    const res = await fetch(`${API_BASE}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    return await handleResponse(res);
  },

  // Waste Analytics
  getAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    return await handleResponse(res);
  },

  // Route Optimization
  getOptimizedRoute: async () => {
    const res = await fetch(`${API_BASE}/routes/collection-route`);
    return await handleResponse(res);
  }
};
