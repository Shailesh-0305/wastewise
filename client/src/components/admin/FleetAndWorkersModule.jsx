import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Truck,
  Gauge,
  Search,
  Edit3,
  Eye,
  Wrench,
  Power,
  X,
  RotateCw,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';
import {
  AdminPageHeader,
  StatusBadge,
  LoadingState,
  EmptyState,
  formatISTDate
} from './AdminSharedUI';

const SHIFTS = [
  'Morning (06:00 - 14:00)',
  'Afternoon (14:00 - 22:00)',
  'Night (22:00 - 06:00)',
  'Flexible'
];

const WORKER_STATUSES = ['Available', 'On Duty', 'Assigned', 'Off Duty', 'On Leave', 'Inactive'];
const VEHICLE_TYPES = [
  'Compactor Truck',
  'Mini Tipper',
  'E-Cart / Battery Trike',
  'Hazardous Waste Van',
  'Roll-Off Container Truck',
  'Organic Collection Truck'
];
const VEHICLE_CATEGORIES = ['Light Commercial', 'Medium Duty', 'Heavy Duty', 'Electric Utility', 'Specialised Hazmat'];
const VEHICLE_STATUSES = ['Available', 'Assigned', 'In Service', 'Under Maintenance', 'Out of Service', 'Deactivated'];

export default function FleetAndWorkersModule({ initialSubTab = 'workers', showToast, onGlobalRefresh }) {
  const [subTab, setSubTab] = useState(initialSubTab); // 'workers' | 'vehicles' | 'capacity'
  const [workers, setWorkers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [wards, setWards] = useState([]);
  const [conversionInfo, setConversionInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [includeInactive, setIncludeInactive] = useState(true);

  // Worker Modals
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    employeeId: '',
    assignedWard: '',
    assignedShift: SHIFTS[0],
    assignedVehicleId: '',
    operationalStatus: 'Available'
  });
  const [inspectWorker, setInspectWorker] = useState(null);

  // Vehicle Modals
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: '',
    vehicleType: 'Mini Tipper',
    vehicleCategory: 'Light Commercial',
    carryingCapacity: 1000,
    capacityUnit: 'kg',
    assignedWorkerId: '',
    assignedWard: '',
    operationalStatus: 'Available',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    notes: ''
  });
  const [maintenanceModalVehicle, setMaintenanceModalVehicle] = useState(null);
  const [maintenanceEntry, setMaintenanceEntry] = useState({
    type: 'Scheduled Inspection',
    description: '',
    technician: '',
    status: 'Completed'
  });

  const loadFleetAndWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, vRes, wrdRes] = await Promise.all([
        api.getWorkers({ includeInactive: includeInactive ? 'true' : 'false' }),
        api.getVehicles({ includeInactive: includeInactive ? 'true' : 'false' }),
        api.getWards()
      ]);
      if (wRes.success) setWorkers(wRes.workers || []);
      if (vRes.success) {
        setVehicles(vRes.vehicles || []);
        if (vRes.conversionAssumptions) setConversionInfo(vRes.conversionAssumptions);
      }
      if (wrdRes.success) setWards(wrdRes.wards || []);
    } catch (e) {
      showToast(e.message || 'Failed to load fleet and worker records', 'error');
    } finally {
      setLoading(false);
    }
  }, [includeInactive, showToast]);

  useEffect(() => {
    loadFleetAndWorkers();
  }, [loadFleetAndWorkers]);

  // Worker handlers
  const handleOpenWorkerModal = (worker = null) => {
    setEditingWorker(worker);
    if (worker) {
      setWorkerForm({
        name: worker.name || '',
        phone: worker.phone || '',
        email: worker.email || '',
        password: '',
        employeeId: worker.employeeId || '',
        assignedWard: worker.assignedWard || '',
        assignedShift: worker.assignedShift || SHIFTS[0],
        assignedVehicleId: worker.assignedVehicleId || '',
        operationalStatus: worker.operationalStatus || 'Available'
      });
    } else {
      setWorkerForm({
        name: '',
        phone: '+91 ',
        email: '',
        password: '',
        employeeId: '',
        assignedWard: '',
        assignedShift: SHIFTS[0],
        assignedVehicleId: '',
        operationalStatus: 'Available'
      });
    }
    setIsWorkerModalOpen(true);
  };

  const handleSaveWorker = async (e) => {
    e.preventDefault();
    const res = editingWorker
      ? await api.updateWorker(editingWorker._id, workerForm)
      : await api.createWorker(workerForm);

    if (res.success) {
      showToast(editingWorker ? `Updated worker ${res.worker.name}` : `Registered driver account for ${res.worker.name}`);
      setIsWorkerModalOpen(false);
      loadFleetAndWorkers();
      if (onGlobalRefresh) onGlobalRefresh();
    } else {
      showToast(res.message || 'Failed to save worker', 'error');
    }
  };

  const handleToggleWorkerActive = async (worker) => {
    const nextActive = worker.isActive === false;
    const res = await api.updateWorker(worker._id, {
      isActive: nextActive,
      operationalStatus: nextActive ? 'Available' : 'Inactive'
    });
    if (res.success) {
      showToast(`Worker ${worker.name} ${nextActive ? 'reactivated' : 'deactivated'}`);
      loadFleetAndWorkers();
      if (onGlobalRefresh) onGlobalRefresh();
    } else {
      showToast(res.message || 'Failed to update worker status', 'error');
    }
  };

  const handleInspectWorker = async (worker) => {
    setInspectWorker(worker);
    const res = await api.getWorkerById(worker._id);
    if (res.success) {
      setInspectWorker(res.worker);
    }
  };

  // Vehicle handlers
  const handleOpenVehicleModal = (vehicle = null) => {
    setEditingVehicle(vehicle);
    if (vehicle) {
      setVehicleForm({
        registrationNumber: vehicle.registrationNumber || '',
        vehicleType: vehicle.vehicleType || 'Mini Tipper',
        vehicleCategory: vehicle.vehicleCategory || 'Light Commercial',
        carryingCapacity: vehicle.carryingCapacity || 1000,
        capacityUnit: vehicle.capacityUnit || 'kg',
        assignedWorkerId: vehicle.assignedWorkerId || '',
        assignedWard: vehicle.assignedWard || '',
        operationalStatus: vehicle.operationalStatus || 'Available',
        lastMaintenanceDate: vehicle.lastMaintenanceDate ? new Date(vehicle.lastMaintenanceDate).toISOString().split('T')[0] : '',
        nextMaintenanceDate: vehicle.nextMaintenanceDate ? new Date(vehicle.nextMaintenanceDate).toISOString().split('T')[0] : '',
        notes: vehicle.notes || ''
      });
    } else {
      setVehicleForm({
        registrationNumber: 'TN-38-',
        vehicleType: 'Mini Tipper',
        vehicleCategory: 'Light Commercial',
        carryingCapacity: 1000,
        capacityUnit: 'kg',
        assignedWorkerId: '',
        assignedWard: '',
        operationalStatus: 'Available',
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        notes: ''
      });
    }
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    const res = editingVehicle
      ? await api.updateVehicle(editingVehicle._id, vehicleForm)
      : await api.createVehicle(vehicleForm);

    if (res.success) {
      showToast(editingVehicle ? `Updated vehicle ${res.vehicle.registrationNumber}` : `Registered vehicle ${res.vehicle.registrationNumber}`);
      setIsVehicleModalOpen(false);
      loadFleetAndWorkers();
      if (onGlobalRefresh) onGlobalRefresh();
    } else {
      showToast(res.message || 'Failed to save vehicle', 'error');
    }
  };

  const handleAddMaintenanceRecord = async (e) => {
    e.preventDefault();
    if (!maintenanceModalVehicle) return;
    const res = await api.updateVehicle(maintenanceModalVehicle._id, {
      newMaintenanceRecord: maintenanceEntry
    });
    if (res.success) {
      showToast(`Maintenance log added for ${maintenanceModalVehicle.registrationNumber}`);
      setMaintenanceModalVehicle(res.vehicle);
      setMaintenanceEntry({ type: 'Scheduled Inspection', description: '', technician: '', status: 'Completed' });
      loadFleetAndWorkers();
    } else {
      showToast(res.message || 'Failed to add maintenance record', 'error');
    }
  };

  const handleToggleVehicleActive = async (vehicle) => {
    const nextActive = !vehicle.isActive || vehicle.operationalStatus === 'Deactivated';
    const res = await api.updateVehicle(vehicle._id, {
      isActive: nextActive,
      operationalStatus: nextActive ? 'Available' : 'Deactivated'
    });
    if (res.success) {
      showToast(`Vehicle ${vehicle.registrationNumber} ${nextActive ? 'reactivated' : 'deactivated'}`);
      loadFleetAndWorkers();
    } else {
      showToast(res.message || 'Failed to update vehicle', 'error');
    }
  };

  const filteredWorkers = workers.filter(w => {
    if (statusFilter !== 'All' && w.operationalStatus !== statusFilter) return false;
    const q = search.toLowerCase();
    return (
      (w.name || '').toLowerCase().includes(q) ||
      (w.employeeId || '').toLowerCase().includes(q) ||
      (w.phone || '').toLowerCase().includes(q) ||
      (w.assignedWard || '').toLowerCase().includes(q) ||
      (w.assignedVehiclePlate || '').toLowerCase().includes(q)
    );
  });

  const filteredVehicles = vehicles.filter(v => {
    if (statusFilter !== 'All' && v.operationalStatus !== statusFilter) return false;
    const q = search.toLowerCase();
    return (
      (v.registrationNumber || '').toLowerCase().includes(q) ||
      (v.vehicleType || '').toLowerCase().includes(q) ||
      (v.assignedWorkerName || '').toLowerCase().includes(q) ||
      (v.assignedWard || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <AdminPageHeader
        breadcrumb="Operations • Fleet & Workers"
        title="Collection Workforce, Fleet Vehicles & Capacity Monitoring"
        subtitle="Manage Coimbatore driver-role worker accounts, municipal collection vehicles, maintenance records, and route load capacity limits."
        actions={
          <>
            <button
              type="button"
              onClick={loadFleetAndWorkers}
              className="btn-secondary"
              style={{ padding: '9px 14px', fontSize: '0.82rem' }}
            >
              <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenWorkerModal(null)}
              className="btn-secondary"
              style={{ padding: '9px 16px', fontSize: '0.84rem' }}
            >
              <UserPlus size={15} />
              <span>Register Worker</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenVehicleModal(null)}
              className="btn-primary"
              style={{ padding: '9px 18px', fontSize: '0.84rem' }}
            >
              <Truck size={15} />
              <span>Register Vehicle</span>
            </button>
          </>
        }
      />

      {/* Module Sub-Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'workers', label: `Collection Workers (${workers.length})`, icon: UserPlus },
            { id: 'vehicles', label: `Fleet Vehicles (${vehicles.length})`, icon: Truck },
            { id: 'capacity', label: 'Vehicle Capacity & Load Monitor', icon: Gauge }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { setSubTab(t.id); setStatusFilter('All'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 18px',
                  borderRadius: 999,
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: subTab === t.id ? 'var(--primary-forest)' : '#ffffff',
                  color: subTab === t.id ? '#ffffff' : 'var(--primary-text)',
                  border: '1.5px solid var(--border-light)'
                }}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 999, padding: '6px 14px' }}>
            <Search size={14} color="var(--secondary-green)" />
            <input
              type="text"
              placeholder="Search name, plate, ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', outline: 'none', width: 170 }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary-text)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            <span>Show Deactivated</span>
          </label>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading workforce and fleet records..." />
      ) : subTab === 'workers' ? (
        /* ================= SUB-TAB 1: COLLECTION WORKER MANAGEMENT ================= */
        filteredWorkers.length === 0 ? (
          <EmptyState
            title="No Collection Workers Registered"
            subtitle="Register a municipal collection worker to create a driver-role account and assign wards, shifts, and vehicles."
            action={
              <button type="button" onClick={() => handleOpenWorkerModal(null)} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
                <UserPlus size={15} /> Register First Worker
              </button>
            }
          />
        ) : (
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border-light)', color: 'var(--secondary-text)' }}>
                    <th style={{ padding: '10px 12px' }}>Staff ID & Name</th>
                    <th style={{ padding: '10px 12px' }}>Contact</th>
                    <th style={{ padding: '10px 12px' }}>Assigned Ward</th>
                    <th style={{ padding: '10px 12px' }}>Shift</th>
                    <th style={{ padding: '10px 12px' }}>Assigned Vehicle</th>
                    <th style={{ padding: '10px 12px' }}>Workload</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map(w => (
                    <tr key={w._id} style={{ borderBottom: '1px solid var(--border-light)', opacity: w.isActive === false ? 0.65 : 1 }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--primary-text)' }}>{w.name}</div>
                        <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--primary-forest)' }}>
                          {w.employeeId || 'CBE-DRV'} • Role: {w.role}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{w.phone || '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>{w.email}</div>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>
                        {w.assignedWard || 'All Wards'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.76rem', color: 'var(--secondary-text)' }}>
                        {w.assignedShift || 'Morning (06:00 - 14:00)'}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary-forest)' }}>
                        {w.assignedVehiclePlate || 'Unassigned'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.78rem' }}>
                        <div><strong>{w.currentWorkloadCount ?? 0}</strong> active</div>
                        <div style={{ color: 'var(--secondary-text)', fontSize: '0.72rem' }}>{w.completedCollectionsCount ?? 0} completed</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <StatusBadge status={w.isActive === false ? 'Inactive' : (w.operationalStatus || 'Available')} />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            type="button"
                            onClick={() => handleInspectWorker(w)}
                            title="View Workload & Assignment History"
                            style={{ padding: 6, borderRadius: 8, background: 'var(--pale-green-section)', border: 'none', color: 'var(--primary-forest)', cursor: 'pointer' }}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenWorkerModal(w)}
                            title="Edit Worker Details"
                            style={{ padding: 6, borderRadius: 8, background: '#f1f5f9', border: 'none', color: '#334155', cursor: 'pointer' }}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleWorkerActive(w)}
                            title={w.isActive === false ? 'Reactivate Worker' : 'Deactivate Worker'}
                            style={{ padding: 6, borderRadius: 8, background: w.isActive === false ? '#dcfce7' : '#fef2f2', border: 'none', color: w.isActive === false ? '#166534' : '#dc2626', cursor: 'pointer' }}
                          >
                            <Power size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : subTab === 'vehicles' ? (
        /* ================= SUB-TAB 2: VEHICLE & FLEET MANAGEMENT ================= */
        filteredVehicles.length === 0 ? (
          <EmptyState
            title="No Fleet Vehicles Registered"
            subtitle="Register Coimbatore municipal collection vehicles to manage routes, workers, capacity, and maintenance logs."
            action={
              <button type="button" onClick={() => handleOpenVehicleModal(null)} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
                <Truck size={15} /> Register First Vehicle
              </button>
            }
          />
        ) : (
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border-light)', color: 'var(--secondary-text)' }}>
                    <th style={{ padding: '10px 12px' }}>Registration No.</th>
                    <th style={{ padding: '10px 12px' }}>Type & Category</th>
                    <th style={{ padding: '10px 12px' }}>Carrying Capacity</th>
                    <th style={{ padding: '10px 12px' }}>Assigned Worker</th>
                    <th style={{ padding: '10px 12px' }}>Assigned Ward</th>
                    <th style={{ padding: '10px 12px' }}>Maintenance Schedule</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map(v => (
                    <tr key={v._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: 'var(--primary-forest)' }}>
                        {v.registrationNumber}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700 }}>{v.vehicleType}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>{v.vehicleCategory}</div>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>
                        {v.carryingCapacity} {v.capacityUnit}
                        <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>
                          Load: {v.currentAssignedLoadKg ?? 0} kg ({v.utilizationPercent ?? 0}%)
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>
                        {v.assignedWorkerName || 'Unassigned'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {v.assignedWard || 'General Fleet'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.75rem' }}>
                        <div>Last: {formatISTDate(v.lastMaintenanceDate)}</div>
                        <div style={{ color: 'var(--secondary-text)' }}>Next: {formatISTDate(v.nextMaintenanceDate)}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <StatusBadge status={v.operationalStatus} />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            type="button"
                            onClick={() => setMaintenanceModalVehicle(v)}
                            title="Maintenance Records & Logs"
                            style={{ padding: 6, borderRadius: 8, background: '#fef3c7', border: 'none', color: '#92400e', cursor: 'pointer' }}
                          >
                            <Wrench size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenVehicleModal(v)}
                            title="Edit Vehicle"
                            style={{ padding: 6, borderRadius: 8, background: '#f1f5f9', border: 'none', color: '#334155', cursor: 'pointer' }}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleVehicleActive(v)}
                            title={v.operationalStatus === 'Deactivated' ? 'Reactivate Vehicle' : 'Deactivate Vehicle'}
                            style={{ padding: 6, borderRadius: 8, background: v.operationalStatus === 'Deactivated' ? '#dcfce7' : '#fef2f2', border: 'none', color: v.operationalStatus === 'Deactivated' ? '#166534' : '#dc2626', cursor: 'pointer' }}
                          >
                            <Power size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* ================= SUB-TAB 3: MODULE 16 - VEHICLE CAPACITY & LOAD MONITORING ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            padding: '14px 18px',
            borderRadius: 16,
            background: 'var(--very-light-mint)',
            border: '1.5px solid var(--soft-leaf-green)',
            fontSize: '0.8rem',
            color: 'var(--primary-text)'
          }}>
            <strong>Capacity & Load Calculation Disclosure:</strong>{' '}
            {conversionInfo?.notice || 'Assigned vehicle load is estimated from active route and pickup assignments using documented unit conversions (1 standard bag = 4.0 kg est., 1 item = 1.5 kg est., kg = direct weight). Physical axle weight telemetry requires hardware sensors.'}
          </div>

          {filteredVehicles.length === 0 ? (
            <EmptyState title="No Vehicles Available for Capacity Monitoring" subtitle="Register vehicles in the Fleet Vehicles tab to monitor load capacity." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {filteredVehicles.map(v => {
                const pct = v.utilizationPercent ?? 0;
                const barColor = v.isOverCapacity ? '#dc2626' : v.isNearCapacity ? '#d97706' : '#166534';
                return (
                  <div key={v._id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
                          {v.registrationNumber}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--secondary-text)' }}>
                          {v.vehicleType} • {v.vehicleCategory}
                        </div>
                      </div>
                      <StatusBadge status={v.operationalStatus} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>
                        <span>Assigned Load: {v.currentAssignedLoadKg ?? 0} kg (Est.)</span>
                        <span style={{ color: barColor }}>{pct}% of {v.capacityInKg ?? v.carryingCapacity} kg</span>
                      </div>
                      <div style={{ width: '100%', height: 10, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: barColor, borderRadius: 999 }} />
                      </div>
                    </div>

                    {(v.isNearCapacity || v.isOverCapacity) && (
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: v.isOverCapacity ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${v.isOverCapacity ? '#fecaca' : '#fde68a'}`,
                        color: v.isOverCapacity ? '#991b1b' : '#92400e',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <AlertTriangle size={14} />
                        <span>
                          {v.isOverCapacity
                            ? 'WARNING: Assigned load exceeds configured vehicle capacity!'
                            : 'CAUTION: Vehicle is approaching maximum carrying capacity (≥85%).'}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.76rem', background: 'var(--main-background)', padding: 10, borderRadius: 10 }}>
                      <div>
                        <span style={{ color: 'var(--secondary-text)' }}>Remaining Cap:</span>{' '}
                        <strong>{v.remainingCapacityKg ?? v.carryingCapacity} kg</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--secondary-text)' }}>Assigned Stops:</span>{' '}
                        <strong>{v.assignedStopCount ?? 0}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--secondary-text)' }}>Worker:</span>{' '}
                        <strong>{v.assignedWorkerName || 'Unassigned'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--secondary-text)' }}>Active Route:</span>{' '}
                        <strong>{v.activeRouteCode || 'None'}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Register / Edit Worker Modal */}
      {isWorkerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsWorkerModalOpen(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, width: '100%', padding: '24px', borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                {editingWorker ? `Edit Worker: ${editingWorker.name}` : 'Register Collection Worker (Driver Account)'}
              </h3>
              <button onClick={() => setIsWorkerModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveWorker} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>FULL NAME *</label>
                  <input
                    type="text"
                    required
                    value={workerForm.name}
                    onChange={(e) => setWorkerForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Senthil Kumar"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>EMPLOYEE / STAFF ID</label>
                  <input
                    type="text"
                    value={workerForm.employeeId}
                    onChange={(e) => setWorkerForm(p => ({ ...p, employeeId: e.target.value }))}
                    placeholder="Auto-generated if blank (CBE-DRV-...)"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>CONTACT PHONE (+91) *</label>
                  <input
                    type="text"
                    required
                    value={workerForm.phone}
                    onChange={(e) => setWorkerForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 94431 82910"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>EMAIL (DRIVER LOGIN)</label>
                  <input
                    type="email"
                    value={workerForm.email}
                    onChange={(e) => setWorkerForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="driver@wastewise.org"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              {!editingWorker && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>INITIAL PASSWORD (MIN 6 CHARS)</label>
                  <input
                    type="password"
                    value={workerForm.password}
                    onChange={(e) => setWorkerForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Defaults to driverPass123! if left blank"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
              )}

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>ASSIGNED WARD</label>
                  <input
                    type="text"
                    list="ward-options-worker"
                    value={workerForm.assignedWard}
                    onChange={(e) => setWorkerForm(p => ({ ...p, assignedWard: e.target.value }))}
                    placeholder="e.g., Ward 24 (Peelamedu)"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                  <datalist id="ward-options-worker">
                    {wards.map(w => <option key={w._id} value={`${w.wardNumber} (${w.wardName})`} />)}
                  </datalist>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>ASSIGNED SHIFT</label>
                  <select
                    value={workerForm.assignedShift}
                    onChange={(e) => setWorkerForm(p => ({ ...p, assignedShift: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>ASSIGNED VEHICLE</label>
                  <select
                    value={workerForm.assignedVehicleId}
                    onChange={(e) => setWorkerForm(p => ({ ...p, assignedVehicleId: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    <option value="">-- Unassigned --</option>
                    {vehicles.filter(v => v.isActive && !['Under Maintenance', 'Out of Service', 'Deactivated'].includes(v.operationalStatus)).map(v => (
                      <option key={v._id} value={v._id}>{v.registrationNumber} ({v.vehicleType})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>OPERATIONAL STATUS</label>
                  <select
                    value={workerForm.operationalStatus}
                    onChange={(e) => setWorkerForm(p => ({ ...p, operationalStatus: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    {WORKER_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setIsWorkerModalOpen(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>
                  {editingWorker ? 'Save Changes' : 'Register Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Worker Workload & Assignment History Modal */}
      {inspectWorker && (
        <div className="modal-overlay" onClick={() => setInspectWorker(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '24px', borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                  {inspectWorker.name} ({inspectWorker.employeeId || 'Driver'})
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>
                  Ward: {inspectWorker.assignedWard || 'All Wards'} • Shift: {inspectWorker.assignedShift} • Vehicle: {inspectWorker.assignedVehiclePlate || 'None'}
                </p>
              </div>
              <button onClick={() => setInspectWorker(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 12, background: 'var(--pale-green-section)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-text)' }}>ACTIVE ASSIGNED PICKUPS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-forest)' }}>{inspectWorker.currentWorkloadCount ?? 0}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, background: 'var(--pale-green-section)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-text)' }}>COMPLETED COLLECTIONS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--secondary-green)' }}>{inspectWorker.completedCollectionsCount ?? 0}</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: 8 }}>Assignment History</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {(inspectWorker.assignmentHistory || []).length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>No assignment history entries recorded yet.</div>
              ) : (
                (inspectWorker.assignmentHistory || []).slice().reverse().map((h, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--main-background)', fontSize: '0.76rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>{h.action}:</strong> {h.details}</span>
                    <span style={{ color: 'var(--secondary-text)' }}>{formatISTDate(h.timestamp, true)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Register / Edit Vehicle Modal */}
      {isVehicleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsVehicleModalOpen(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, width: '100%', padding: '24px', borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                {editingVehicle ? `Edit Vehicle: ${editingVehicle.registrationNumber}` : 'Register Municipal Fleet Vehicle'}
              </h3>
              <button onClick={() => setIsVehicleModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>REGISTRATION NUMBER *</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.registrationNumber}
                    onChange={(e) => setVehicleForm(p => ({ ...p, registrationNumber: e.target.value.toUpperCase() }))}
                    placeholder="TN-38-BZ-4921"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>OPERATIONAL STATUS</label>
                  <select
                    value={vehicleForm.operationalStatus}
                    onChange={(e) => setVehicleForm(p => ({ ...p, operationalStatus: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    {VEHICLE_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>VEHICLE TYPE</label>
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={(e) => setVehicleForm(p => ({ ...p, vehicleType: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>VEHICLE CATEGORY</label>
                  <select
                    value={vehicleForm.vehicleCategory}
                    onChange={(e) => setVehicleForm(p => ({ ...p, vehicleCategory: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    {VEHICLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>CARRYING CAPACITY *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={vehicleForm.carryingCapacity}
                    onChange={(e) => setVehicleForm(p => ({ ...p, carryingCapacity: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>CAPACITY UNIT</label>
                  <select
                    value={vehicleForm.capacityUnit}
                    onChange={(e) => setVehicleForm(p => ({ ...p, capacityUnit: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    <option value="kg">kg</option>
                    <option value="tonnes">tonnes</option>
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>ASSIGNED WORKER</label>
                  <select
                    value={vehicleForm.assignedWorkerId}
                    onChange={(e) => setVehicleForm(p => ({ ...p, assignedWorkerId: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    <option value="">-- Unassigned --</option>
                    {workers.filter(w => w.isActive !== false).map(w => (
                      <option key={w._id} value={w._id}>{w.name} ({w.employeeId || 'Driver'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>ASSIGNED WARD</label>
                  <input
                    type="text"
                    value={vehicleForm.assignedWard}
                    onChange={(e) => setVehicleForm(p => ({ ...p, assignedWard: e.target.value }))}
                    placeholder="e.g., Ward 24"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>LAST MAINTENANCE DATE</label>
                  <input
                    type="date"
                    value={vehicleForm.lastMaintenanceDate}
                    onChange={(e) => setVehicleForm(p => ({ ...p, lastMaintenanceDate: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>NEXT MAINTENANCE DATE</label>
                  <input
                    type="date"
                    value={vehicleForm.nextMaintenanceDate}
                    onChange={(e) => setVehicleForm(p => ({ ...p, nextMaintenanceDate: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>NOTES</label>
                <input
                  type="text"
                  value={vehicleForm.notes}
                  onChange={(e) => setVehicleForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional fleet notes..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setIsVehicleModalOpen(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>
                  {editingVehicle ? 'Save Changes' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Maintenance Records Modal */}
      {maintenanceModalVehicle && (
        <div className="modal-overlay" onClick={() => setMaintenanceModalVehicle(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '24px', borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                Maintenance Records — {maintenanceModalVehicle.registrationNumber}
              </h3>
              <button onClick={() => setMaintenanceModalVehicle(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMaintenanceRecord} style={{ padding: 14, borderRadius: 12, background: 'var(--main-background)', border: '1px solid var(--border-light)', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-text)' }}>Log New Maintenance Entry</div>
              <div className="grid-2" style={{ gap: 8 }}>
                <input
                  type="text"
                  required
                  placeholder="Service Type (e.g., Hydraulic Check)"
                  value={maintenanceEntry.type}
                  onChange={(e) => setMaintenanceEntry(p => ({ ...p, type: e.target.value }))}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  placeholder="Technician / Workshop"
                  value={maintenanceEntry.technician}
                  onChange={(e) => setMaintenanceEntry(p => ({ ...p, technician: e.target.value }))}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.8rem' }}
                />
              </div>
              <input
                type="text"
                required
                placeholder="Description of work performed..."
                value={maintenanceEntry.description}
                onChange={(e) => setMaintenanceEntry(p => ({ ...p, description: e.target.value }))}
                style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.8rem' }}
              />
              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '6px 14px', fontSize: '0.78rem' }}>
                Add Maintenance Record
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(maintenanceModalVehicle.maintenanceRecords || []).length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', textAlign: 'center', padding: 16 }}>
                  No maintenance logs recorded for this vehicle yet.
                </div>
              ) : (
                (maintenanceModalVehicle.maintenanceRecords || []).slice().reverse().map((m, idx) => (
                  <div key={idx} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>{m.type} {m.technician ? `(${m.technician})` : ''}</span>
                      <span style={{ color: 'var(--secondary-text)' }}>{formatISTDate(m.date)}</span>
                    </div>
                    <div style={{ color: 'var(--secondary-text)', marginTop: 3 }}>{m.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

