import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Compass,
  Plus,
  Edit3,
  Trash2,
  Send,
  RotateCw,
  X,
  AlertTriangle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../../services/api';
import {
  AdminPageHeader,
  StatusBadge,
  LoadingState,
  EmptyState,
  WASTE_CATEGORIES,
  COIMBATORE_ZONES,
  formatISTDate
} from './AdminSharedUI';

const depotIcon = new L.DivIcon({
  className: 'custom-depot-pin',
  html: `<div style="background:#166534; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; font-size:11px; font-weight:800;">HQ</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const pickupIcon = new L.DivIcon({
  className: 'custom-pickup-pin',
  html: `<div style="background:#0284c7; color:white; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; font-size:11px; font-weight:700;">📦</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const dropoffIcon = new L.DivIcon({
  className: 'custom-dropoff-pin',
  html: `<div style="background:#15803d; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; font-size:12px; font-weight:800;">♻️</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

export default function ScheduleAndRoutesModule({ initialMode = 'schedules', showToast, onGlobalRefresh }) {
  const [mode, setMode] = useState(initialMode); // 'schedules' | 'routes'
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [wards, setWards] = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Schedule View & Filters
  const [calendarView, setCalendarView] = useState('monthly'); // 'monthly' | 'weekly' | 'daily'
  const [schedWardFilter, setSchedWardFilter] = useState('All');
  const [schedWorkerFilter, setSchedWorkerFilter] = useState('All');
  const [schedVehicleFilter, setSchedVehicleFilter] = useState('All');
  const [schedCatFilter, setSchedCatFilter] = useState('All');
  const [conflictErrors, setConflictErrors] = useState([]);

  // Schedule Modal
  const [isSchedModalOpen, setIsSchedModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [schedForm, setSchedForm] = useState({
    title: '',
    zone: 'Central Zone',
    ward: '',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '06:30',
    endTime: '09:30',
    timeWindow: '06:30 AM - 09:30 AM (IST)',
    categories: ['Organic'],
    driverId: '',
    driverName: '',
    vehicleObjectId: '',
    vehiclePlate: '',
    status: 'Upcoming',
    isPublished: true,
    notes: 'Please place segregated bins at doorstep before scheduled time'
  });

  // Route Creation Workflow State
  const [routeConfig, setRouteConfig] = useState({
    title: '',
    ward: 'All',
    selectedReportIds: [],
    workerId: '',
    vehicleId: '',
    depotName: 'CCMC Central Fleet Depot, Town Hall',
    depotAddress: 'Big Bazaar Street, Town Hall, Coimbatore 641001',
    depotLat: 11.0018,
    depotLng: 76.9628,
    destinationFacilityId: ''
  });
  const [routePreview, setRoutePreview] = useState(null);
  const [previewingRoute, setPreviewingRoute] = useState(false);
  const [dispatchingRoute, setDispatchingRoute] = useState(false);

  const loadScheduleAndRouteData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, rtRes, repRes, wRes, vRes, wrdRes, cRes] = await Promise.all([
        api.getSchedules(),
        api.getRoutes(),
        api.getReports(),
        api.getWorkers(),
        api.getVehicles(),
        api.getWards(),
        api.getCentres()
      ]);

      if (sRes.success) setSchedules(sRes.schedules || []);
      if (rtRes.success) setRoutes(rtRes.routes || []);
      if (repRes.success) {
        const pending = (repRes.reports || []).filter(r => ['Reported', 'Confirmed', 'Assigned'].includes(r.status));
        setPendingReports(pending);
      }
      if (wRes.success) setWorkers(wRes.workers || []);
      if (vRes.success) setVehicles(vRes.vehicles || []);
      if (wrdRes.success) setWards(wrdRes.wards || []);
      if (cRes.success) setCentres(cRes.centres || []);
    } catch (e) {
      showToast(e.message || 'Failed to load schedules and routes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadScheduleAndRouteData();
  }, [loadScheduleAndRouteData]);

  // Schedule Handlers
  const handleOpenScheduleModal = (sched = null) => {
    setConflictErrors([]);
    setEditingSchedule(sched);
    if (sched) {
      setSchedForm({
        title: sched.title || '',
        zone: sched.zone || 'Central Zone',
        ward: sched.ward || '',
        date: sched.date ? new Date(sched.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: sched.startTime || '06:30',
        endTime: sched.endTime || '09:30',
        timeWindow: sched.timeWindow || '06:30 AM - 09:30 AM (IST)',
        categories: Array.isArray(sched.categories) && sched.categories.length > 0 ? sched.categories : ['Organic'],
        driverId: sched.driverId || '',
        driverName: sched.driverName || '',
        vehicleObjectId: sched.vehicleObjectId || '',
        vehiclePlate: sched.vehiclePlate || sched.vehicleId || '',
        status: sched.status || 'Upcoming',
        isPublished: sched.isPublished !== false,
        notes: sched.notes || ''
      });
    } else {
      setSchedForm({
        title: '',
        zone: 'Central Zone',
        ward: '',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        startTime: '06:30',
        endTime: '09:30',
        timeWindow: '06:30 AM - 09:30 AM (IST)',
        categories: ['Organic'],
        driverId: '',
        driverName: '',
        vehicleObjectId: '',
        vehiclePlate: '',
        status: 'Upcoming',
        isPublished: true,
        notes: 'Please keep segregated bins ready at doorstep before collection window'
      });
    }
    setIsSchedModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setConflictErrors([]);

    const payload = {
      ...schedForm,
      timeWindow: `${schedForm.startTime} - ${schedForm.endTime} (IST)`
    };

    const res = editingSchedule
      ? await api.updateSchedule(editingSchedule._id, payload)
      : await api.createSchedule(payload);

    if (res.success) {
      showToast(editingSchedule ? 'Schedule updated successfully' : 'Collection schedule published');
      setIsSchedModalOpen(false);
      loadScheduleAndRouteData();
      if (onGlobalRefresh) onGlobalRefresh();
    } else {
      if (res.conflicts && res.conflicts.length > 0) {
        setConflictErrors(res.conflicts);
      }
      showToast(res.message || 'Scheduling conflict detected', 'error');
    }
  };

  const handleCancelSchedule = async (sched) => {
    const res = await api.updateSchedule(sched._id, { status: 'Cancelled', isPublished: false });
    if (res.success) {
      showToast(`Cancelled schedule '${sched.title}'`);
      loadScheduleAndRouteData();
    } else {
      showToast(res.message || 'Failed to cancel schedule', 'error');
    }
  };

  const handleDeleteSchedule = async (sched) => {
    const res = await api.deleteSchedule(sched._id);
    if (res.success) {
      showToast('Deleted collection schedule');
      loadScheduleAndRouteData();
    } else {
      showToast(res.message || 'Failed to delete schedule', 'error');
    }
  };

  // Route Workflow Handlers
  const toggleReportSelection = (reportId) => {
    setRouteConfig(prev => {
      const exists = prev.selectedReportIds.includes(reportId);
      const nextIds = exists
        ? prev.selectedReportIds.filter(id => id !== reportId)
        : [...prev.selectedReportIds, reportId];
      return { ...prev, selectedReportIds: nextIds };
    });
  };

  const handlePreviewRoute = async () => {
    setPreviewingRoute(true);
    try {
      const res = await api.previewOptimizedRoute({
        ward: routeConfig.ward !== 'All' ? routeConfig.ward : undefined,
        reportIds: routeConfig.selectedReportIds.length > 0 ? routeConfig.selectedReportIds : undefined,
        workerId: routeConfig.workerId || undefined,
        vehicleId: routeConfig.vehicleId || undefined,
        depotName: routeConfig.depotName,
        depotAddress: routeConfig.depotAddress,
        depotLat: routeConfig.depotLat,
        depotLng: routeConfig.depotLng,
        destinationFacilityId: routeConfig.destinationFacilityId || undefined
      });
      if (res.success) {
        setRoutePreview(res);
        // Auto-select stops from preview if user hadn't manually checked specific IDs
        if (routeConfig.selectedReportIds.length === 0 && Array.isArray(res.stops)) {
          setRouteConfig(p => ({ ...p, selectedReportIds: res.stops.map(s => s.reportId) }));
        }
        showToast(`Generated optimised route across ${res.totalStops} stop(s)`);
      } else {
        showToast(res.message || 'Failed to generate route preview', 'error');
      }
    } finally {
      setPreviewingRoute(false);
    }
  };

  const handleDispatchRoute = async () => {
    if (!routeConfig.workerId || !routeConfig.vehicleId) {
      showToast('Please select both an available collection worker and an available fleet vehicle before dispatching.', 'warning');
      return;
    }
    if (routeConfig.selectedReportIds.length === 0) {
      showToast('Please select at least one pending pickup request to dispatch.', 'warning');
      return;
    }

    setDispatchingRoute(true);
    try {
      const res = await api.dispatchRoute({
        title: routeConfig.title || `${routeConfig.ward === 'All' ? 'Coimbatore' : routeConfig.ward} Optimised Dispatch`,
        ward: routeConfig.ward,
        reportIds: routeConfig.selectedReportIds,
        workerId: routeConfig.workerId,
        vehicleId: routeConfig.vehicleId,
        destinationFacilityId: routeConfig.destinationFacilityId || undefined,
        depot: {
          name: routeConfig.depotName,
          address: routeConfig.depotAddress,
          coordinates: { lat: Number(routeConfig.depotLat), lng: Number(routeConfig.depotLng) }
        }
      });

      if (res.success) {
        showToast(res.message || `Route ${res.route?.routeCode} approved and dispatched!`);
        setRoutePreview(null);
        setRouteConfig(p => ({ ...p, selectedReportIds: [], title: '' }));
        loadScheduleAndRouteData();
        if (onGlobalRefresh) onGlobalRefresh();
      } else {
        showToast(res.message || 'Route dispatch failed', 'error');
      }
    } finally {
      setDispatchingRoute(false);
    }
  };

  const handleUpdateRouteStatus = async (route, nextStatus) => {
    const res = await api.updateRouteStatus(route._id, {
      status: nextStatus,
      cancelReason: nextStatus === 'Cancelled' ? 'Cancelled by administrator in Route Command Centre' : undefined
    });
    if (res.success) {
      showToast(`Route ${route.routeCode} updated to ${nextStatus}`);
      loadScheduleAndRouteData();
      if (onGlobalRefresh) onGlobalRefresh();
    } else {
      showToast(res.message || 'Failed to update route', 'error');
    }
  };

  // Filtered Schedules
  const filteredSchedules = schedules.filter(s => {
    if (schedWardFilter !== 'All' && !(s.ward || s.zone || '').toLowerCase().includes(schedWardFilter.toLowerCase())) return false;
    if (schedWorkerFilter !== 'All' && !(s.driverName || '').toLowerCase().includes(schedWorkerFilter.toLowerCase())) return false;
    if (schedVehicleFilter !== 'All' && !(s.vehiclePlate || s.vehicleId || '').toLowerCase().includes(schedVehicleFilter.toLowerCase())) return false;
    if (schedCatFilter !== 'All' && !(s.categories || []).includes(schedCatFilter)) return false;

    const d = new Date(s.date);
    const now = new Date();
    if (calendarView === 'daily') {
      return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    }
    if (calendarView === 'weekly') {
      const diffDays = (d.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays >= -1 && diffDays <= 7;
    }
    return true;
  });

  // Filtered Pending Reports for Route Builder
  const wardPendingReports = pendingReports.filter(r => {
    if (routeConfig.ward === 'All') return true;
    const rw = (r.ward || r.location?.ward || r.location?.address || '').toLowerCase();
    return rw.includes(routeConfig.ward.toLowerCase());
  });

  const selectedVehicleDoc = vehicles.find(v => String(v._id) === String(routeConfig.vehicleId));
  const selectedStopsWeightKg = wardPendingReports
    .filter(r => routeConfig.selectedReportIds.includes(r._id))
    .reduce((sum, r) => sum + (r.estimatedWeightKg || 4), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <AdminPageHeader
        breadcrumb="Operations • Schedules & Route Dispatch"
        title={mode === 'schedules' ? 'Collection Schedule Management (IST)' : 'Route Optimisation & Fleet Dispatch'}
        subtitle={
          mode === 'schedules'
            ? 'Manage monthly, weekly, and daily ward collection schedules with automated worker/vehicle conflict detection.'
            : 'Generate Nearest-Neighbour TSP collection routes, validate vehicle carrying capacity, and dispatch drivers.'
        }
        actions={
          <>
            <button
              type="button"
              onClick={loadScheduleAndRouteData}
              className="btn-secondary"
              style={{ padding: '9px 14px', fontSize: '0.82rem' }}
            >
              <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            {mode === 'schedules' && (
              <button
                type="button"
                onClick={() => handleOpenScheduleModal(null)}
                className="btn-primary"
                style={{ padding: '9px 18px', fontSize: '0.84rem' }}
              >
                <Plus size={15} />
                <span>Create Schedule</span>
              </button>
            )}
          </>
        }
      />

      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setMode('schedules')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 18px',
            borderRadius: 999,
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: mode === 'schedules' ? 'var(--primary-forest)' : '#ffffff',
            color: mode === 'schedules' ? '#ffffff' : 'var(--primary-text)',
            border: '1.5px solid var(--border-light)'
          }}
        >
          <Calendar size={15} />
          <span>Collection Schedules ({schedules.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('routes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 18px',
            borderRadius: 999,
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: mode === 'routes' ? 'var(--primary-forest)' : '#ffffff',
            color: mode === 'routes' ? '#ffffff' : 'var(--primary-text)',
            border: '1.5px solid var(--border-light)'
          }}
        >
          <Compass size={15} />
          <span>Route Optimisation & Dispatch ({routes.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingState label="Loading schedules and route dispatch data..." />
      ) : mode === 'schedules' ? (
        /* ================= MODULE 8: COLLECTION SCHEDULE MANAGEMENT ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            {/* Calendar View Toggle */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'monthly', label: 'Monthly Calendar' },
                { id: 'weekly', label: 'Weekly View (Next 7 Days)' },
                { id: 'daily', label: "Today's Schedule (IST)" }
              ].map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setCalendarView(v.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: calendarView === v.id ? 'var(--pale-green-section)' : 'transparent',
                    color: calendarView === v.id ? 'var(--primary-forest)' : 'var(--secondary-text)',
                    border: calendarView === v.id ? '1px solid var(--soft-leaf-green)' : '1px solid transparent'
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                value={schedWardFilter}
                onChange={(e) => setSchedWardFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.78rem' }}
              >
                <option value="All">All Wards</option>
                {wards.map(w => <option key={w._id} value={w.wardNumber}>{w.wardNumber} ({w.wardName})</option>)}
              </select>

              <select
                value={schedWorkerFilter}
                onChange={(e) => setSchedWorkerFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.78rem' }}
              >
                <option value="All">All Workers</option>
                {workers.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}
              </select>

              <select
                value={schedVehicleFilter}
                onChange={(e) => setSchedVehicleFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.78rem' }}
              >
                <option value="All">All Vehicles</option>
                {vehicles.map(v => <option key={v._id} value={v.registrationNumber}>{v.registrationNumber}</option>)}
              </select>

              <select
                value={schedCatFilter}
                onChange={(e) => setSchedCatFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.78rem' }}
              >
                <option value="All">All Categories</option>
                {WASTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {filteredSchedules.length === 0 ? (
            <EmptyState
              title="No Collection Schedules Found"
              subtitle="No schedules match the selected calendar view or filter criteria."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              {filteredSchedules.map(s => (
                <div key={s._id} className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-green)', textTransform: 'uppercase' }}>
                          {s.ward || s.zone}
                        </span>
                        <h4 style={{ fontSize: '1.0rem', fontWeight: 800, color: 'var(--primary-text)', marginTop: 2 }}>
                          {s.title}
                        </h4>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', marginTop: 8 }}>
                      <div><strong>Date (IST):</strong> {formatISTDate(s.date)} ({s.dayOfWeek})</div>
                      <div><strong>Window:</strong> {s.timeWindow}</div>
                      <div><strong>Worker:</strong> {s.driverName || 'Unassigned'} • <strong>Vehicle:</strong> {s.vehiclePlate || s.vehicleId || 'Unassigned'}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                      {(s.categories || []).map(cat => (
                        <StatusBadge key={cat} status={cat} />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: s.isPublished !== false ? '#166534' : '#64748b' }}>
                      {s.isPublished !== false ? 'Published to Citizen Portal' : 'Internal Draft / Cancelled'}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleOpenScheduleModal(s)}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      {s.status !== 'Cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleCancelSchedule(s)}
                          style={{ padding: '4px 10px', fontSize: '0.74rem', borderRadius: 999, background: '#fef3c7', color: '#92400e', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule(s)}
                        style={{ padding: 5, borderRadius: 8, background: '#fef2f2', color: '#dc2626', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ================= MODULE 11: ROUTE OPTIMISATION & DISPATCH ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Step-by-Step Route Creation Panel */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: 4 }}>
              Step-by-Step Route Creation & TSP Optimisation Workflow
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: 16 }}>
              1. Select Ward → 2. Select Pending Pickups → 3. Select Worker & Vehicle → 4. Choose Depot & Destination Facility → 5. Generate Route → 6. Review & Dispatch
            </p>

            <div className="grid-3" style={{ gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                  1. WARD / COLLECTION AREA
                </label>
                <select
                  value={routeConfig.ward}
                  onChange={(e) => setRouteConfig(p => ({ ...p, ward: e.target.value, selectedReportIds: [] }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.82rem' }}
                >
                  <option value="All">All Wards (City-Wide)</option>
                  {wards.map(w => <option key={w._id} value={w.wardNumber}>{w.wardNumber} ({w.wardName})</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                  3. AVAILABLE COLLECTION WORKER
                </label>
                <select
                  value={routeConfig.workerId}
                  onChange={(e) => setRouteConfig(p => ({ ...p, workerId: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.82rem' }}
                >
                  <option value="">-- Select Available Worker --</option>
                  {workers.filter(w => w.isActive !== false && !['On Leave', 'Inactive'].includes(w.operationalStatus)).map(w => (
                    <option key={w._id} value={w._id}>{w.name} ({w.assignedWard || 'All Wards'}) [{w.operationalStatus}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                  4. AVAILABLE FLEET VEHICLE
                </label>
                <select
                  value={routeConfig.vehicleId}
                  onChange={(e) => setRouteConfig(p => ({ ...p, vehicleId: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.82rem' }}
                >
                  <option value="">-- Select Available Vehicle --</option>
                  {vehicles.filter(v => v.isActive && !['Under Maintenance', 'Out of Service', 'Deactivated'].includes(v.operationalStatus)).map(v => (
                    <option key={v._id} value={v._id}>{v.registrationNumber} ({v.vehicleType}, Cap: {v.capacityInKg ?? v.carryingCapacity} kg)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                  5. STARTING DEPOT
                </label>
                <input
                  type="text"
                  value={routeConfig.depotName}
                  onChange={(e) => setRouteConfig(p => ({ ...p, depotName: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                  6. DESTINATION RECYCLING / DISPOSAL FACILITY
                </label>
                <select
                  value={routeConfig.destinationFacilityId}
                  onChange={(e) => setRouteConfig(p => ({ ...p, destinationFacilityId: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.82rem' }}
                >
                  <option value="">Auto-Select Nearest Facility to Final Stop</option>
                  {centres.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.centreType || 'Facility'})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Select Pending Pickup Requests */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                  2. SELECT PENDING PICKUP REQUESTS ({routeConfig.selectedReportIds.length} selected • Est. Load: {selectedStopsWeightKg} kg)
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setRouteConfig(p => ({ ...p, selectedReportIds: wardPendingReports.map(r => r._id) }))}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                  >
                    Select All ({wardPendingReports.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouteConfig(p => ({ ...p, selectedReportIds: [] }))}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {selectedVehicleDoc && selectedStopsWeightKg > (selectedVehicleDoc.capacityInKg || selectedVehicleDoc.carryingCapacity) && (
                <div style={{ padding: '8px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.78rem', fontWeight: 700, marginBottom: 10 }}>
                  ⚠️ Selected stops load ({selectedStopsWeightKg} kg) exceeds vehicle {selectedVehicleDoc.registrationNumber} capacity ({selectedVehicleDoc.capacityInKg || selectedVehicleDoc.carryingCapacity} kg)!
                </div>
              )}

              {wardPendingReports.length === 0 ? (
                <div style={{ padding: 14, borderRadius: 10, background: 'var(--main-background)', fontSize: '0.78rem', color: 'var(--secondary-text)' }}>
                  No pending pickup requests available in the selected ward.
                </div>
              ) : (
                <div style={{ maxHeight: 190, overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 12, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {wardPendingReports.map(r => {
                    const checked = routeConfig.selectedReportIds.includes(r._id);
                    const hasGps = r.location?.coordinates?.lat !== undefined && r.location?.coordinates?.lng !== undefined;
                    return (
                      <label
                        key={r._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: 8,
                          background: checked ? 'var(--pale-green-section)' : 'var(--main-background)',
                          cursor: 'pointer',
                          fontSize: '0.78rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleReportSelection(r._id)}
                          />
                          <strong>{r.trackingId}</strong>
                          <span>{r.citizen?.name} — {r.location?.address}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{r.category} ({r.quantity} {r.unit} • {r.estimatedWeightKg ?? 4} kg est.)</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: hasGps ? '#15803d' : '#94a3b8' }}>
                            {hasGps ? 'GPS Verified' : 'No GPS'}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={previewingRoute}
                onClick={handlePreviewRoute}
                className="btn-secondary"
                style={{ padding: '10px 20px', fontSize: '0.84rem' }}
              >
                <Compass size={16} />
                <span>{previewingRoute ? 'Generating TSP Route...' : '7. Generate Optimised Route Preview'}</span>
              </button>
              <button
                type="button"
                disabled={dispatchingRoute || !routePreview}
                onClick={handleDispatchRoute}
                className="btn-primary"
                style={{ padding: '10px 22px', fontSize: '0.84rem', opacity: routePreview ? 1 : 0.6 }}
              >
                <Send size={16} />
                <span>{dispatchingRoute ? 'Dispatching...' : '9. Approve & Dispatch Route'}</span>
              </button>
            </div>
          </div>

          {/* Step 8: Route Preview & Transparent Distance Metrics */}
          {routePreview && (
            <div className="card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--secondary-green)', textTransform: 'uppercase' }}>
                    8. Review Generated Route Solution
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                    {routePreview.depot?.name} → {routePreview.totalStops} Stops → {routePreview.dropoff?.name}
                  </h3>
                </div>

                {/* Transparent Distance & Load Metrics */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--pale-green-section)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--secondary-text)' }}>Straight-Line (Haversine)</div>
                    <div style={{ fontSize: '1.0rem', fontWeight: 900, color: 'var(--primary-forest)' }}>{routePreview.straightLineDistanceKm} km</div>
                  </div>
                  <div style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--pale-green-section)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--secondary-text)' }}>Est. Road Distance (1.32x)</div>
                    <div style={{ fontSize: '1.0rem', fontWeight: 900, color: '#0369a1' }}>{routePreview.estimatedRoadDistanceKm} km</div>
                  </div>
                  <div style={{ padding: '8px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--secondary-text)' }}>Actual GPS-Tracked</div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#64748b' }}>Awaiting Telemetry</div>
                  </div>
                  <div style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--pale-green-section)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--secondary-text)' }}>Est. Duration</div>
                    <div style={{ fontSize: '1.0rem', fontWeight: 900, color: 'var(--primary-forest)' }}>{routePreview.estimatedTimeMin} min</div>
                  </div>
                  <div style={{ padding: '8px 14px', borderRadius: 12, background: routePreview.isOverCapacity ? '#fef2f2' : 'var(--pale-green-section)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--secondary-text)' }}>Est. Load / Capacity</div>
                    <div style={{ fontSize: '1.0rem', fontWeight: 900, color: routePreview.isOverCapacity ? '#dc2626' : 'var(--primary-forest)' }}>
                      {routePreview.totalEstimatedLoadKg} / {routePreview.vehicleCapacityKg} kg
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid var(--border-light)', fontSize: '0.76rem', color: 'var(--secondary-text)' }}>
                <strong>Methodology Disclosure:</strong> {routePreview.metadata?.estimatedRoadNote} {routePreview.metadata?.coordinatesNotice}
              </div>

              {/* Interactive Route Map */}
              <div style={{ height: 360, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                <MapContainer center={[11.0055, 76.9661]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {(routePreview.waypoints || [])
                    .filter(w => w.coordinates?.lat !== undefined && w.coordinates?.lng !== undefined)
                    .map((w, idx) => {
                      const icon = w.type === 'depot' ? depotIcon : w.type === 'dropoff' ? dropoffIcon : pickupIcon;
                      return (
                        <Marker key={idx} position={[w.coordinates.lat, w.coordinates.lng]} icon={icon}>
                          <Popup>
                            <div style={{ fontSize: 12 }}>
                              <strong>{w.name || w.citizenName}</strong>
                              <div>{w.address}</div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  {routePreview.routePolyline && routePreview.routePolyline.length > 1 && (
                    <Polyline
                      positions={routePreview.routePolyline}
                      pathOptions={{ color: '#166534', weight: 4, dashArray: '6, 8' }}
                    />
                  )}
                </MapContainer>
              </div>

              {/* Ordered Stops Table */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 8 }}>Ordered Collection Stops ({routePreview.stops?.length || 0})</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--secondary-text)' }}>
                        <th style={{ padding: 8 }}>Order</th>
                        <th style={{ padding: 8 }}>Request ID</th>
                        <th style={{ padding: 8 }}>Resident & Address</th>
                        <th style={{ padding: 8 }}>Category & Qty</th>
                        <th style={{ padding: 8 }}>GPS Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(routePreview.stops || []).map(st => (
                        <tr key={st.order} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 8, fontWeight: 800 }}>Stop #{st.order}</td>
                          <td style={{ padding: 8, fontWeight: 700, color: 'var(--primary-forest)' }}>{st.trackingId}</td>
                          <td style={{ padding: 8 }}>{st.citizenName} — {st.address}</td>
                          <td style={{ padding: 8 }}>{st.category} ({st.quantity} {st.unit} • {st.estimatedWeightKg} kg est.)</td>
                          <td style={{ padding: 8 }}>
                            {st.hasActualCoordinates
                              ? `${st.coordinates.lat}, ${st.coordinates.lng}`
                              : 'Address-Only (No GPS attached)'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Dispatched Routes Management Table */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, marginBottom: 12 }}>
              Dispatched & Historical Collection Routes ({routes.length})
            </h3>
            {routes.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', padding: 16, textAlign: 'center' }}>
                No collection routes have been dispatched yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--border-light)', color: 'var(--secondary-text)' }}>
                      <th style={{ padding: 10 }}>Route Code</th>
                      <th style={{ padding: 10 }}>Title & Ward</th>
                      <th style={{ padding: 10 }}>Worker & Vehicle</th>
                      <th style={{ padding: 10 }}>Stops & Load</th>
                      <th style={{ padding: 10 }}>Distances (Straight / Est. Road)</th>
                      <th style={{ padding: 10 }}>Status</th>
                      <th style={{ padding: 10 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map(rt => (
                      <tr key={rt._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: 10, fontWeight: 800, color: 'var(--primary-forest)' }}>{rt.routeCode}</td>
                        <td style={{ padding: 10 }}>
                          <div style={{ fontWeight: 700 }}>{rt.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>{rt.ward}</div>
                        </td>
                        <td style={{ padding: 10 }}>
                          <div style={{ fontWeight: 700 }}>{rt.assignedWorker?.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--primary-forest)' }}>{rt.assignedVehicle?.registrationNumber}</div>
                        </td>
                        <td style={{ padding: 10 }}>
                          <strong>{rt.totalStops} stops</strong> • {rt.totalEstimatedLoadKg} / {rt.vehicleCapacityKg} kg ({rt.capacityUtilizationPercent}%)
                        </td>
                        <td style={{ padding: 10 }}>
                          {rt.straightLineDistanceKm} km straight / <strong>{rt.estimatedRoadDistanceKm} km est. road</strong>
                        </td>
                        <td style={{ padding: 10 }}>
                          <StatusBadge status={rt.status} />
                        </td>
                        <td style={{ padding: 10 }}>
                          {!['Completed', 'Cancelled'].includes(rt.status) && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateRouteStatus(rt, 'Completed')}
                                style={{ padding: '4px 10px', borderRadius: 999, background: '#dcfce7', color: '#166534', border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Complete
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateRouteStatus(rt, 'Cancelled')}
                                style={{ padding: '4px 10px', borderRadius: 999, background: '#fee2e2', color: '#991b1b', border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Schedule Modal */}
      {isSchedModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSchedModalOpen(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: '24px', borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                {editingSchedule ? 'Edit Collection Schedule' : 'Create Municipal Collection Schedule (IST)'}
              </h3>
              <button onClick={() => setIsSchedModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {conflictErrors.length > 0 && (
              <div style={{ padding: 12, borderRadius: 12, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b', fontSize: '0.78rem', marginBottom: 12 }}>
                <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={15} /> Scheduling Conflict Detected:
                </div>
                {conflictErrors.map((c, idx) => (
                  <div key={idx} style={{ marginTop: 4 }}>• {c.message}</div>
                ))}
              </div>
            )}

            <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>SCHEDULE TITLE *</label>
                <input
                  type="text"
                  required
                  value={schedForm.title}
                  onChange={(e) => setSchedForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Ward 24 (Peelamedu) - Morning Wet Waste Round"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                />
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>ZONE</label>
                  <select
                    value={schedForm.zone}
                    onChange={(e) => setSchedForm(p => ({ ...p, zone: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    {COIMBATORE_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>ASSIGNED WARD *</label>
                  <input
                    type="text"
                    required
                    value={schedForm.ward}
                    onChange={(e) => setSchedForm(p => ({ ...p, ward: e.target.value }))}
                    placeholder="e.g., Ward 24 (Peelamedu)"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div className="grid-3" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>COLLECTION DATE *</label>
                  <input
                    type="date"
                    required
                    value={schedForm.date}
                    onChange={(e) => setSchedForm(p => ({ ...p, date: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>START TIME (IST)</label>
                  <input
                    type="time"
                    value={schedForm.startTime}
                    onChange={(e) => setSchedForm(p => ({ ...p, startTime: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>END TIME (IST)</label>
                  <input
                    type="time"
                    value={schedForm.endTime}
                    onChange={(e) => setSchedForm(p => ({ ...p, endTime: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>ASSIGNED WORKER</label>
                  <select
                    value={schedForm.driverName}
                    onChange={(e) => {
                      const matched = workers.find(w => w.name === e.target.value);
                      setSchedForm(p => ({ ...p, driverName: e.target.value, driverId: matched?._id || '' }));
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    <option value="">-- Select Worker --</option>
                    {workers.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>ASSIGNED VEHICLE</label>
                  <select
                    value={schedForm.vehiclePlate}
                    onChange={(e) => {
                      const matched = vehicles.find(v => v.registrationNumber === e.target.value);
                      setSchedForm(p => ({ ...p, vehiclePlate: e.target.value, vehicleObjectId: matched?._id || '' }));
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map(v => <option key={v._id} value={v.registrationNumber}>{v.registrationNumber}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>ACCEPTED WASTE CATEGORIES</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {WASTE_CATEGORIES.map(cat => {
                    const checked = schedForm.categories.includes(cat);
                    return (
                      <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', padding: '4px 10px', borderRadius: 999, background: checked ? 'var(--pale-green-section)' : '#f8fafc', border: '1px solid var(--border-light)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSchedForm(p => {
                              const next = checked ? p.categories.filter(c => c !== cat) : [...p.categories, cat];
                              return { ...p, categories: next.length > 0 ? next : ['Organic'] };
                            });
                          }}
                        />
                        <span>{cat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setIsSchedModalOpen(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>
                  {editingSchedule ? 'Update Schedule' : 'Publish Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
