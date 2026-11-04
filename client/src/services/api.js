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
      return {
        success: false,
        status: res.status,
        message: data.message || `Request failed with status ${res.status}`,
        conflicts: data.conflicts || undefined
      };
    }
    return data;
  } catch (err) {
    return { success: false, status: res.status, message: err.message || `HTTP ${res.status} error` };
  }
};

const cleanQueryParams = (params = {}) => {
  const cleaned = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      cleaned[k] = v;
    }
  });
  return new URLSearchParams(cleaned).toString();
};

export const api = {
  getBaseUrl: () => API_BASE,

  // ==========================================================
  // AUTHENTICATION
  // ==========================================================
  register: async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        signal: AbortSignal.timeout(8000)
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
    const normEmail = credentials.email?.toLowerCase().trim();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        signal: AbortSignal.timeout(8000)
      });
      const data = await parseResponse(res);
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
      }
      // If server responded with explicit auth failure (401/403), return server response directly
      if (res.status === 401 || res.status === 403 || res.status === 400) {
        return data;
      }
    } catch {
      // Only fall through to offline demo session if the backend server is unreachable
    }

    if (normEmail === 'citizen.demo@wastewise.org' || normEmail === 'aarav@example.com') {
      const demoUser = {
        id: 'demo-citizen-1',
        name: 'Aarav Sundaram (Coimbatore)',
        email: normEmail,
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
        ecoLevel: 'Eco Starter'
      };
      const demoToken = 'demo-jwt-token-coimbatore-citizen';
      localStorage.setItem('token', demoToken);
      localStorage.setItem('user', JSON.stringify(demoUser));
      return { success: true, token: demoToken, user: demoUser, isOfflineFallback: true };
    }

    if (normEmail === 'admin@wastewise.org') {
      const adminUser = {
        id: 'demo-admin-1',
        name: 'Coimbatore Municipal Supervisor',
        email: 'admin@wastewise.org',
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
        ecoLevel: 'Municipal Admin'
      };
      const demoToken = 'demo-jwt-token-coimbatore-admin';
      localStorage.setItem('token', demoToken);
      localStorage.setItem('user', JSON.stringify(adminUser));
      return { success: true, token: demoToken, user: adminUser, isOfflineFallback: true };
    }

    return { success: false, message: 'Unable to reach authentication server.' };
  },

  getMe: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, message: 'No session token' };

      if (token.startsWith('demo-jwt-token-')) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          return { success: true, user: JSON.parse(storedUser) };
        }
      }

      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(6000)
      });
      const data = await parseResponse(res);
      if (data.success) return data;
      return data;
    } catch {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return { success: true, user: JSON.parse(storedUser), isOfflineFallback: true };
      }
      return { success: false, message: 'Authentication check failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // ==========================================================
  // MODULE 4: PICKUP REQUEST MANAGEMENT
  // ==========================================================
  getReports: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/reports${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      const data = await parseResponse(res);
      if (data.success && Array.isArray(data.reports)) {
        return data;
      }
      return data;
    } catch (e) {
      return { success: false, reports: [], message: e.message || 'Unable to load pickup requests' };
    }
  },

  getReportById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(6000)
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
        signal: AbortSignal.timeout(8000)
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

  updateReportStatus: async (id, status, note = '', rejectionReason = '') => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ status, note, rejectionReason }),
        signal: AbortSignal.timeout(6000)
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
        signal: AbortSignal.timeout(6000)
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
        signal: AbortSignal.timeout(6000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to delete report' };
    }
  },

  // ==========================================================
  // MODULE 5: COLLECTION WORKER MANAGEMENT
  // ==========================================================
  getWorkers: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/workers${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, workers: [], message: e.message || 'Failed to load workers' };
    }
  },

  getWorkerById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/workers/${id}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(6000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to load worker details' };
    }
  },

  createWorker: async (workerData) => {
    try {
      const res = await fetch(`${API_BASE}/workers`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(workerData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to register worker' };
    }
  },

  updateWorker: async (id, updateData) => {
    try {
      const res = await fetch(`${API_BASE}/workers/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(updateData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update worker' };
    }
  },

  // ==========================================================
  // MODULES 6 & 16: VEHICLE & FLEET + CAPACITY MONITORING
  // ==========================================================
  getVehicles: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/vehicles${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, vehicles: [], message: e.message || 'Failed to load fleet vehicles' };
    }
  },

  createVehicle: async (vehicleData) => {
    try {
      const res = await fetch(`${API_BASE}/vehicles`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(vehicleData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to register vehicle' };
    }
  },

  updateVehicle: async (id, updateData) => {
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(updateData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update vehicle' };
    }
  },

  // ==========================================================
  // MODULE 7: COIMBATORE WARD MANAGEMENT
  // ==========================================================
  getWards: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/wards${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, wards: [], message: e.message || 'Failed to load wards' };
    }
  },

  getWardById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/wards/${id}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to load ward overview' };
    }
  },

  createWard: async (wardData) => {
    try {
      const res = await fetch(`${API_BASE}/wards`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(wardData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to create ward' };
    }
  },

  updateWard: async (id, updateData) => {
    try {
      const res = await fetch(`${API_BASE}/wards/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(updateData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update ward' };
    }
  },

  // ==========================================================
  // MODULE 8: COLLECTION SCHEDULE MANAGEMENT
  // ==========================================================
  getSchedules: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/schedules${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      const data = await parseResponse(res);
      if (data.success && Array.isArray(data.schedules)) {
        return data;
      }
      return data;
    } catch (e) {
      return { success: false, schedules: [], message: e.message || 'Failed to load collection schedules' };
    }
  },

  createSchedule: async (scheduleData) => {
    try {
      const res = await fetch(`${API_BASE}/schedules`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(scheduleData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to create schedule' };
    }
  },

  updateSchedule: async (id, updateData) => {
    try {
      const res = await fetch(`${API_BASE}/schedules/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(updateData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update schedule' };
    }
  },

  deleteSchedule: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/schedules/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true),
        signal: AbortSignal.timeout(6000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to delete schedule' };
    }
  },

  // ==========================================================
  // MODULES 9 & 10: RECYCLING CENTRES & DISPOSAL FACILITIES
  // ==========================================================
  getCentres: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/centers${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      const data = await parseResponse(res);
      if (data.success && Array.isArray(data.centres)) {
        return data;
      }
      return data;
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
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to create recycling centre' };
    }
  },

  updateCentre: async (id, updateData) => {
    try {
      const res = await fetch(`${API_BASE}/centers/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(updateData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update centre' };
    }
  },

  deleteCentre: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/centers/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true),
        signal: AbortSignal.timeout(6000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to delete centre' };
    }
  },

  // ==========================================================
  // MODULE 11: ROUTE OPTIMISATION & DISPATCH
  // ==========================================================
  getOptimizedRoute: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/routes/collection-route${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to compute optimized route' };
    }
  },

  previewOptimizedRoute: async (payload = {}) => {
    try {
      const res = await fetch(`${API_BASE}/routes/optimize-preview`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to preview route' };
    }
  },

  dispatchRoute: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/routes/dispatch`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to dispatch route' };
    }
  },

  getRoutes: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/routes${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, routes: [], message: e.message || 'Failed to load dispatched routes' };
    }
  },

  updateRouteStatus: async (id, payload) => {
    try {
      const res = await fetch(`${API_BASE}/routes/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update route status' };
    }
  },

  // ==========================================================
  // MODULES 3, 12, 15, 17: ANALYTICS, HEATMAP, SCORECARDS
  // ==========================================================
  getAnalytics: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/analytics/overview${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to load analytics' };
    }
  },

  getWardScorecards: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/analytics/ward-scorecards${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, scorecards: [], message: e.message || 'Failed to load ward scorecards' };
    }
  },

  getCleanlinessHeatmap: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/analytics/cleanliness-heatmap${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, locationPoints: [], wardIndicators: [], message: e.message || 'Failed to load cleanliness heatmap' };
    }
  },

  // ==========================================================
  // MODULE 13: COMMUNITY COMPLAINTS & ISSUE MANAGEMENT
  // ==========================================================
  getComplaints: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/complaints${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, complaints: [], message: e.message || 'Failed to load complaints' };
    }
  },

  createComplaint: async (complaintData) => {
    try {
      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(complaintData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to submit complaint' };
    }
  },

  updateComplaint: async (id, updateData) => {
    try {
      const res = await fetch(`${API_BASE}/complaints/${id}`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify(updateData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update complaint' };
    }
  },

  // ==========================================================
  // MODULE 14: COMMUNITY CAMPAIGNS & ANNOUNCEMENTS
  // ==========================================================
  getCampaigns: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/campaigns${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, campaigns: [], message: e.message || 'Failed to load campaigns' };
    }
  },

  createCampaign: async (campaignData) => {
    try {
      const res = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(campaignData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to create campaign' };
    }
  },

  updateCampaign: async (id, updateData) => {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(updateData),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update campaign' };
    }
  },

  deleteCampaign: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true),
        signal: AbortSignal.timeout(6000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to delete campaign' };
    }
  },

  // ==========================================================
  // MODULES 18, 19, 20: USER MANAGEMENT, AUDIT LOGS, SETTINGS
  // ==========================================================
  getAdminUsers: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/admin/users${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, users: [], message: e.message || 'Failed to load users' };
    }
  },

  getAdminUserDetails: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(6000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to load user details' };
    }
  },

  updateAdminUser: async (id, updateData) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify(updateData),
        signal: AbortSignal.timeout(6000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update user account' };
    }
  },

  getAuditLogs: async (params = {}) => {
    try {
      const query = cleanQueryParams(params);
      const res = await fetch(`${API_BASE}/admin/audit-logs${query ? `?${query}` : ''}`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(8000)
      });
      return await parseResponse(res);
    } catch (e) {
      return { success: false, logs: [], message: e.message || 'Failed to load audit logs' };
    }
  },

  getSystemSettings: async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        headers: getHeaders(true),
        signal: AbortSignal.timeout(6000)
      });
      const data = await parseResponse(res);
      return data.settings || data;
    } catch (e) {
      return { success: false, message: e.message || 'Failed to load system settings' };
    }
  },

  updateSystemSettings: async (settingsData) => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(settingsData),
        signal: AbortSignal.timeout(8000)
      });
      const data = await parseResponse(res);
      return data.settings || data;
    } catch (e) {
      return { success: false, message: e.message || 'Failed to save system settings' };
    }
  },

  // Convenience aliases for modular admin components
  getAnalyticsOverview: async (params = {}) => {
    const res = await api.getAnalytics(params);
    return res?.stats || res?.analytics || res;
  },

  getAllReports: async (params = {}) => {
    const res = await api.getReports(params);
    return res?.reports || res;
  },

  getCenters: async (params = {}) => {
    const res = await api.getCentres(params);
    return res?.centres || res?.centers || [];
  },

  createCenter: async (centreData) => {
    const payload = {
      ...centreData,
      materials: centreData.acceptedMaterials || centreData.materials || [],
      phone: centreData.contactPhone || centreData.phone || '',
      hours: centreData.operatingHours || centreData.hours || '9:00 AM - 6:00 PM'
    };
    const res = await api.createCentre(payload);
    if (res && res.success === false) throw new Error(res.message || 'Failed to create facility');
    return res?.centre || res;
  },

  updateCenter: async (id, updateData) => {
    const payload = {
      ...updateData,
      materials: updateData.acceptedMaterials || updateData.materials,
      phone: updateData.contactPhone ?? updateData.phone,
      hours: updateData.operatingHours ?? updateData.hours
    };
    const res = await api.updateCentre(id, payload);
    if (res && res.success === false) throw new Error(res.message || 'Failed to update facility');
    return res?.centre || res;
  },

  toggleCenterActive: async (id) => {
    const res = await api.deleteCentre(id);
    if (res && res.success === false) throw new Error(res.message || 'Failed to toggle facility status');
    return res;
  },

  cancelCampaign: async (id) => {
    const res = await api.deleteCampaign(id);
    if (res && res.success === false) throw new Error(res.message || 'Failed to cancel campaign');
    return res;
  },

  getUsersAdmin: async (params = {}) => {
    const res = await api.getAdminUsers(params);
    return res?.users || [];
  },

  getUserDetailsAdmin: async (id) => {
    const res = await api.getAdminUserDetails(id);
    if (res && res.success === false) throw new Error(res.message || 'Failed to load user details');
    return res;
  },

  updateUserAdmin: async (id, updateData) => {
    const res = await api.updateAdminUser(id, updateData);
    if (res && res.success === false) throw new Error(res.message || 'Failed to update user');
    return res?.user || res;
  }
};
