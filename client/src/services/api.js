const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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

// Safe JSON parser for HTTP responses
const parseResponse = async (res) => {
  try {
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || `Request failed with status ${res.status}` };
    }
    return data;
  } catch (err) {
    return { success: false, message: err.message || `HTTP ${res.status} error` };
  }
};

export const api = {
  getBaseUrl: () => API_BASE,

  // Authentication
  register: async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        signal: AbortSignal.timeout(6000)
      });
      const data = await parseResponse(res);
      if (data.success && data.token) {
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
        signal: AbortSignal.timeout(6000)
      });
      const data = await parseResponse(res);
      if (data.success && data.token) {
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
      const token = localStorage.getItem('token');
      if (!token) return { success: false, message: 'No session token' };

      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(4000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Authentication check failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Waste Reports Full CRUD
  getReports: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/reports?${query}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(6000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, reports: [], message: e.message || 'Failed to load reports from server' };
    }
  },

  getReportById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(5000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to fetch report' };
    }
  },

  createReport: async (reportData) => {
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(reportData),
        signal: AbortSignal.timeout(7000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to submit report to server' };
    }
  },

  updateReport: async (id, updateData) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(updateData),
        signal: AbortSignal.timeout(6000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update report' };
    }
  },

  updateReportStatus: async (id, status, note = '') => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ status, note }),
        signal: AbortSignal.timeout(5000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update status' };
    }
  },

  assignDriver: async (id, driverData) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/assign`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify(driverData),
        signal: AbortSignal.timeout(5000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to assign driver' };
    }
  },

  deleteReport: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true),
        signal: AbortSignal.timeout(5000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to delete report' };
    }
  },

  // Recycling Centres
  getCentres: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/centers?${query}`, {
        headers: getHeaders(false),
        signal: AbortSignal.timeout(5000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, centres: [], message: e.message || 'Failed to load recycling centres' };
    }
  },

  createCentre: async (centreData) => {
    try {
      const res = await fetch(`${API_BASE}/centers`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(centreData),
        signal: AbortSignal.timeout(6000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to create recycling centre' };
    }
  },

  // Collection Schedules
  getSchedules: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/schedules?${query}`, {
        headers: getHeaders(false),
        signal: AbortSignal.timeout(5000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, schedules: [], message: e.message || 'Failed to load schedules' };
    }
  },

  // Analytics Overview
  getAnalytics: async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/overview`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(6000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to load analytics' };
    }
  },

  // Route Optimization (TSP)
  getOptimizedRoute: async () => {
    try {
      const res = await fetch(`${API_BASE}/routes/collection-route`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(6000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to compute optimized route' };
    }
  }
};
