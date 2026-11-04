import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Edit3,
  Eye,
  Award,
  Layers,
  ArrowLeft,
  RotateCw,
  X,
  Info
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { api } from '../../services/api';
import {
  AdminPageHeader,
  StatusBadge,
  LoadingState,
  EmptyState,
  COIMBATORE_ZONES,
  WASTE_CATEGORIES,
  formatISTDate
} from './AdminSharedUI';

export default function WardManagementModule({ initialView = 'wards', showToast }) {
  const [viewMode, setViewMode] = useState(initialView); // 'wards' | 'cleanliness-map' | 'ward-performance'
  const [wards, setWards] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [scorecards, setScorecards] = useState([]);
  const [scorecardWeights, setScorecardWeights] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selected Ward Detail Page
  const [selectedWardDetail, setSelectedWardDetail] = useState(null);
  const [loadingWardDetail, setLoadingWardDetail] = useState(false);

  // Filters
  const [zoneFilter, setZoneFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [mapLayer, setMapLayer] = useState('all'); // 'all' | 'pending' | 'overdue' | 'complaints' | 'wards'
  const [mapWardFilter, setMapWardFilter] = useState('All');

  // Create / Edit Ward Modal
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const [wardForm, setWardForm] = useState({
    wardNumber: '',
    wardName: '',
    zone: 'Central Zone',
    localities: '',
    collectionArea: '',
    referenceLat: '',
    referenceLng: '',
    assignedWorkerIds: [],
    assignedVehicleIds: [],
    operationalStatus: 'Active',
    notes: ''
  });

  useEffect(() => {
    setViewMode(initialView);
    setSelectedWardDetail(null);
  }, [initialView]);

  const loadWardModuleData = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, wrkRes, vehRes, scRes, hmRes] = await Promise.all([
        api.getWards({ includeInactive: 'true' }),
        api.getWorkers(),
        api.getVehicles(),
        api.getWardScorecards({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
        api.getCleanlinessHeatmap({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          ward: mapWardFilter !== 'All' ? mapWardFilter : undefined
        })
      ]);

      if (wRes.success) setWards(wRes.wards || []);
      if (wrkRes.success) setWorkers(wrkRes.workers || []);
      if (vehRes.success) setVehicles(vehRes.vehicles || []);
      if (scRes.success) {
        setScorecards(scRes.scorecards || []);
        setScorecardWeights(scRes.weightsUsed || null);
      }
      if (hmRes.success) setHeatmapData(hmRes);
    } catch (e) {
      showToast(e.message || 'Failed to load ward management data', 'error');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, mapWardFilter, showToast]);

  useEffect(() => {
    loadWardModuleData();
  }, [loadWardModuleData]);

  const handleOpenWardDetail = async (wardIdOrNumber) => {
    if (!wardIdOrNumber) return;
    setLoadingWardDetail(true);
    try {
      const res = await api.getWardById(wardIdOrNumber);
      if (res.success && res.ward) {
        setSelectedWardDetail(res.ward);
      } else {
        showToast(res.message || 'Ward record not registered in Ward Directory yet', 'warning');
      }
    } catch (e) {
      showToast(e.message || 'Failed to load ward detail overview', 'error');
    } finally {
      setLoadingWardDetail(false);
    }
  };

  const handleOpenWardModal = (ward = null) => {
    setEditingWard(ward);
    if (ward) {
      setWardForm({
        wardNumber: ward.wardNumber || '',
        wardName: ward.wardName || '',
        zone: ward.zone || 'Central Zone',
        localities: (ward.localities || []).join(', '),
        collectionArea: ward.collectionArea || '',
        referenceLat: ward.referenceCoordinates?.lat ?? '',
        referenceLng: ward.referenceCoordinates?.lng ?? '',
        assignedWorkerIds: (ward.assignedWorkers || []).map(w => w.workerId),
        assignedVehicleIds: (ward.assignedVehicles || []).map(v => v.vehicleId),
        operationalStatus: ward.operationalStatus || 'Active',
        notes: ward.notes || ''
      });
    } else {
      setWardForm({
        wardNumber: 'Ward ',
        wardName: '',
        zone: 'Central Zone',
        localities: '',
        collectionArea: '',
        referenceLat: '',
        referenceLng: '',
        assignedWorkerIds: [],
        assignedVehicleIds: [],
        operationalStatus: 'Active',
        notes: ''
      });
    }
    setIsWardModalOpen(true);
  };

  const handleSaveWard = async (e) => {
    e.preventDefault();
    const res = editingWard
      ? await api.updateWard(editingWard._id, wardForm)
      : await api.createWard(wardForm);

    if (res.success) {
      showToast(editingWard ? `Updated ${res.ward.wardNumber}` : `Created ${res.ward.wardNumber} (${res.ward.wardName})`);
      setIsWardModalOpen(false);
      loadWardModuleData();
      if (selectedWardDetail && editingWard && selectedWardDetail._id === editingWard._id) {
        handleOpenWardDetail(editingWard._id);
      }
    } else {
      showToast(res.message || 'Failed to save ward', 'error');
    }
  };

  // ================= WARD DETAIL PAGE VIEW =================
  if (selectedWardDetail) {
    const wd = selectedWardDetail;
    const sum = wd.pickupSummary || {};
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <AdminPageHeader
          breadcrumb={`Ward Directory • ${wd.wardNumber}`}
          title={`${wd.wardNumber}: ${wd.wardName} (${wd.zone})`}
          subtitle={wd.boundaryNotice || 'Official Municipal Polygon Boundary Unavailable (Manual Record)'}
          actions={
            <>
              <button
                type="button"
                onClick={() => setSelectedWardDetail(null)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                <ArrowLeft size={15} />
                <span>Back to Wards</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenWardModal(wd)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                <Edit3 size={15} />
                <span>Edit Ward & Assignments</span>
              </button>
            </>
          }
        />

        {/* Summary KPIs */}
        <div className="grid-4">
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-text)' }}>PICKUP REQUESTS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-forest)', marginTop: 4 }}>{sum.total ?? 0}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--secondary-text)' }}>Est. Volume: {sum.totalWasteKg ?? 0} kg</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-text)' }}>COMPLETED COLLECTIONS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803d', marginTop: 4 }}>{sum.completed ?? 0}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--secondary-text)' }}>
              Completion Rate: {sum.completionRate !== null && sum.completionRate !== undefined ? `${sum.completionRate}%` : 'N/A'}
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-text)' }}>PENDING / OVERDUE</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#b45309', marginTop: 4 }}>
              {sum.pending ?? 0} / <span style={{ color: '#dc2626' }}>{sum.overdue ?? 0}</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--secondary-text)' }}>Active queue</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-text)' }}>WARD COMPLAINTS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-text)', marginTop: 4 }}>{(wd.complaints || []).length}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--secondary-text)' }}>
              Localities: {(wd.localities || []).join(', ') || 'None specified'}
            </div>
          </div>
        </div>

        {/* Workers, Vehicles & Category Distribution */}
        <div className="grid-2">
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 800, marginBottom: 10 }}>Assigned Workers & Fleet Vehicles</h4>
            <div style={{ fontSize: '0.8rem', marginBottom: 12 }}>
              <strong>Workers ({(wd.workers || []).length}):</strong>
              {(wd.workers || []).length === 0 ? (
                <div style={{ color: 'var(--secondary-text)', marginTop: 4 }}>No collection workers assigned to this ward.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  {wd.workers.map(w => (
                    <div key={w._id} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--main-background)', display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>{w.name}</strong> ({w.phone})</span>
                      <StatusBadge status={w.operationalStatus} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.8rem' }}>
              <strong>Vehicles ({(wd.vehicles || []).length}):</strong>
              {(wd.vehicles || []).length === 0 ? (
                <div style={{ color: 'var(--secondary-text)', marginTop: 4 }}>No fleet vehicles assigned to this ward.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  {wd.vehicles.map(v => (
                    <div key={v._id} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--main-background)', display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>{v.registrationNumber}</strong> ({v.vehicleType})</span>
                      <StatusBadge status={v.operationalStatus} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 800, marginBottom: 10 }}>Waste Category Distribution in {wd.wardNumber}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(wd.categoryDistribution || []).map(cat => (
                <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '6px 10px', background: 'var(--main-background)', borderRadius: 8 }}>
                  <span style={{ fontWeight: 700 }}>{cat.category}</span>
                  <span>{cat.count} requests • <strong>{cat.weightKg} kg est.</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ward Pickup Requests & Schedules & Complaints */}
        <div className="grid-2">
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 800, marginBottom: 10 }}>Ward Pickup Requests ({(wd.pickupRequests || []).length})</h4>
            {(wd.pickupRequests || []).length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>No pickup requests recorded in this ward.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {wd.pickupRequests.slice(0, 8).map(r => (
                  <div key={r._id} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--main-background)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <div>
                      <strong>{r.trackingId}</strong> — {r.citizen?.name} ({r.category}, {r.quantity} {r.unit})
                      <div style={{ color: 'var(--secondary-text)', fontSize: '0.72rem' }}>{r.location?.address}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 800, marginBottom: 10 }}>Ward Schedules & Complaint History</h4>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--secondary-text)', marginBottom: 6 }}>COLLECTION SCHEDULES ({(wd.schedules || []).length})</div>
              {(wd.schedules || []).length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>No schedules assigned to this ward.</div>
              ) : (
                wd.schedules.slice(0, 4).map(s => (
                  <div key={s._id} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--main-background)', fontSize: '0.76rem', marginBottom: 6 }}>
                    <strong>{s.title}</strong> ({s.timeWindow}) — {s.driverName}
                  </div>
                ))
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--secondary-text)', marginBottom: 6 }}>COMPLAINT HISTORY ({(wd.complaints || []).length})</div>
              {(wd.complaints || []).length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>No civic complaints recorded for this ward.</div>
              ) : (
                wd.complaints.slice(0, 4).map(c => (
                  <div key={c._id} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--main-background)', fontSize: '0.76rem', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>{c.complaintId}:</strong> {c.category}</span>
                    <StatusBadge status={c.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <AdminPageHeader
        breadcrumb="Operations & Insights • Coimbatore Wards"
        title="Coimbatore Ward Management, Cleanliness Map & Performance Scorecards"
        subtitle="Manage Coimbatore municipal wards and localities, inspect location-based cleanliness indicators, and compare transparent ward performance scorecards."
        actions={
          <>
            <button
              type="button"
              onClick={loadWardModuleData}
              className="btn-secondary"
              style={{ padding: '9px 14px', fontSize: '0.82rem' }}
            >
              <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenWardModal(null)}
              className="btn-primary"
              style={{ padding: '9px 18px', fontSize: '0.84rem' }}
            >
              <Plus size={15} />
              <span>Create Ward Record</span>
            </button>
          </>
        }
      />

      {/* Sub-Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'wards', label: `Ward Directory (${wards.length})`, icon: MapPin },
            { id: 'cleanliness-map', label: 'Ward Cleanliness Map', icon: Layers },
            { id: 'ward-performance', label: 'Ward Performance Scorecards', icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewMode(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 18px',
                  borderRadius: 999,
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: viewMode === tab.id ? 'var(--primary-forest)' : '#ffffff',
                  color: viewMode === tab.id ? '#ffffff' : 'var(--primary-text)',
                  border: '1.5px solid var(--border-light)'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="Filter From Date"
            style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.78rem' }}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="Filter To Date"
            style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.78rem' }}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading Coimbatore ward records and metrics..." />
      ) : viewMode === 'wards' ? (
        /* ================= SUB-VIEW 1: WARD DIRECTORY ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            padding: '12px 16px',
            borderRadius: 14,
            background: '#f8fafc',
            border: '1px solid var(--border-light)',
            fontSize: '0.78rem',
            color: 'var(--secondary-text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Info size={16} color="var(--primary-forest)" />
            <span>
              <strong>Geographic Boundary Policy:</strong> Official municipal GeoJSON ward boundary polygons are not fabricated. Administrators can create and manage ward records manually; polygon boundaries are explicitly labelled as unavailable until official GIS datasets are imported.
            </span>
          </div>

          {wards.length === 0 ? (
            <EmptyState
              title="No Coimbatore Wards Registered Yet"
              subtitle="Create manual ward records (e.g., Ward 24 - Peelamedu, Ward 58 - RS Puram, Ward 72 - Gandhipuram) to organise workers, vehicles, schedules, and performance tracking."
              action={
                <button type="button" onClick={() => handleOpenWardModal(null)} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
                  <Plus size={15} /> Create First Ward Record
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {wards.filter(w => zoneFilter === 'All' || w.zone === zoneFilter).map(w => (
                <div key={w._id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-green)', textTransform: 'uppercase' }}>
                          {w.zone}
                        </span>
                        <h3 style={{ fontSize: '1.12rem', fontWeight: 900, color: 'var(--primary-text)' }}>
                          {w.wardNumber} — {w.wardName}
                        </h3>
                      </div>
                      <StatusBadge status={w.operationalStatus} />
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--secondary-text)', marginTop: 6 }}>
                      <strong>Localities:</strong> {(w.localities || []).join(', ') || 'Not specified'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                      Boundary: <em>{w.boundaryAvailable ? 'Verified GeoJSON' : 'Polygon Unavailable'}</em>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12, padding: 10, borderRadius: 10, background: 'var(--main-background)', fontSize: '0.75rem' }}>
                      <div>
                        <div style={{ color: 'var(--secondary-text)' }}>Pickups</div>
                        <strong>{w.stats?.totalRequests ?? 0}</strong> ({w.stats?.pendingRequests ?? 0} open)
                      </div>
                      <div>
                        <div style={{ color: 'var(--secondary-text)' }}>Volume</div>
                        <strong>{w.stats?.totalWasteKg ?? 0} kg</strong>
                      </div>
                      <div>
                        <div style={{ color: 'var(--secondary-text)' }}>Complaints</div>
                        <strong>{w.stats?.totalComplaints ?? 0}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--secondary-text)' }}>
                      {w.stats?.assignedWorkersCount ?? 0} workers • {w.stats?.assignedVehiclesCount ?? 0} vehicles
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleOpenWardModal(w)}
                        className="btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        disabled={loadingWardDetail}
                        onClick={() => handleOpenWardDetail(w._id)}
                        className="btn-primary"
                        style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                      >
                        <Eye size={13} /> Detail Page
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'cleanliness-map' ? (
        /* ================= SUB-VIEW 2: MODULE 15 - WARD CLEANLINESS HEATMAP ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--secondary-green)', textTransform: 'uppercase' }}>
                {heatmapData?.mapMode || 'Location-Based Operational View (Official Ward Polygons Unavailable)'}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', marginTop: 2 }}>
                Plots actual GPS-verified pickup requests, civic sanitation complaints, and ward operational status across Coimbatore.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={mapLayer}
                onChange={(e) => setMapLayer(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <option value="all">Layer: All Operational Markers</option>
                <option value="pending">Layer: Pending Pickup Requests</option>
                <option value="overdue">Layer: Overdue Pickups</option>
                <option value="complaints">Layer: Civic Complaints</option>
                <option value="wards">Layer: Ward Operational Summary</option>
              </select>

              <select
                value={mapWardFilter}
                onChange={(e) => setMapWardFilter(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.8rem' }}
              >
                <option value="All">All Wards</option>
                {(heatmapData?.wardIndicators || []).map((wi, idx) => (
                  <option key={idx} value={wi.wardNumber}>{wi.wardNumber}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transparent Threshold Legend */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', padding: '6px 14px', borderRadius: 999, border: '1px solid var(--border-light)' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              <strong>Green (Normal):</strong> Below warning thresholds
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', padding: '6px 14px', borderRadius: 999, border: '1px solid var(--border-light)' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#eab308', display: 'inline-block' }} />
              <strong>Yellow (Attention Required):</strong> ≥{heatmapData?.thresholds?.warningPendingCount ?? 3} pending or ≥{heatmapData?.thresholds?.warningOverdueCount ?? 1} overdue
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', padding: '6px 14px', borderRadius: 999, border: '1px solid var(--border-light)' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
              <strong>Red (High Unresolved Issues):</strong> ≥{heatmapData?.thresholds?.criticalPendingCount ?? 6} pending or ≥{heatmapData?.thresholds?.criticalOverdueCount ?? 3} overdue
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div style={{ height: 430, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
              <MapContainer center={[11.0055, 76.9661]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Plot individual GPS-verified records */}
                {mapLayer !== 'wards' && (heatmapData?.locationPoints || [])
                  .filter(pt => {
                    if (mapLayer === 'pending') return pt.recordType === 'PickupRequest' && pt.isPending;
                    if (mapLayer === 'overdue') return pt.recordType === 'PickupRequest' && pt.isOverdue;
                    if (mapLayer === 'complaints') return pt.recordType === 'Complaint';
                    return true;
                  })
                  .map((pt, i) => {
                    const color = pt.severity === 'Red' ? '#dc2626' : pt.severity === 'Yellow' ? '#d97706' : '#16a34a';
                    return (
                      <CircleMarker
                        key={`pt-${i}`}
                        center={[pt.coordinates.lat, pt.coordinates.lng]}
                        radius={9}
                        pathOptions={{ color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 0.88 }}
                      >
                        <Popup>
                          <div style={{ fontSize: 12 }}>
                            <strong>{pt.recordType}: {pt.recordId}</strong>
                            <div>Category: {pt.category}</div>
                            <div>Status: <strong>{pt.status}</strong></div>
                            <div>Ward: {pt.ward}</div>
                            <div style={{ color: '#475569', marginTop: 2 }}>{pt.address}</div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}

                {/* Plot Ward Indicator Centroids when available */}
                {(heatmapData?.wardIndicators || [])
                  .filter(wi => wi.displayCoordinates?.lat && wi.displayCoordinates?.lng)
                  .map((wi, idx) => {
                    const color = wi.statusColor === 'Red' ? '#dc2626' : wi.statusColor === 'Yellow' ? '#eab308' : '#16a34a';
                    return (
                      <CircleMarker
                        key={`ward-${idx}`}
                        center={[wi.displayCoordinates.lat, wi.displayCoordinates.lng]}
                        radius={16}
                        pathOptions={{ color, weight: 3, fillColor: color, fillOpacity: 0.25 }}
                      >
                        <Popup>
                          <div style={{ fontSize: 12 }}>
                            <strong>{wi.wardNumber} ({wi.wardName})</strong>
                            <div>Status: <strong>{wi.statusLabel}</strong></div>
                            <div>Pending Pickups: {wi.pendingPickups} | Overdue: {wi.overduePickups}</div>
                            <div>Unresolved Complaints: {wi.unresolvedComplaints}</div>
                            <div>Completion Rate: {wi.completionRate}%</div>
                            {wi.wardId && (
                              <button
                                type="button"
                                onClick={() => handleOpenWardDetail(wi.wardId)}
                                style={{ marginTop: 6, padding: '3px 8px', borderRadius: 6, background: '#166534', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11 }}
                              >
                                Open Ward Detail
                              </button>
                            )}
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
              </MapContainer>
            </div>
          </div>

          {/* Ward Cleanliness Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {(heatmapData?.wardIndicators || []).map((wi, idx) => (
              <div key={idx} className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary-text)' }}>{wi.wardNumber}</strong>
                  <StatusBadge status={wi.statusColor} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>{wi.statusLabel}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '0.75rem', background: 'var(--main-background)', padding: 8, borderRadius: 8 }}>
                  <span>Pending: <strong>{wi.pendingPickups}</strong></span>
                  <span>Overdue: <strong style={{ color: wi.overduePickups > 0 ? '#dc2626' : 'inherit' }}>{wi.overduePickups}</strong></span>
                  <span>Complaints: <strong>{wi.unresolvedComplaints}</strong></span>
                  <span>Volume: <strong>{wi.wasteVolumeKg} kg</strong></span>
                </div>
                {wi.wardId && (
                  <button
                    type="button"
                    onClick={() => handleOpenWardDetail(wi.wardId)}
                    style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--primary-forest)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Drill Down into Ward →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ================= SUB-VIEW 3: MODULE 17 - WARD PERFORMANCE SCORECARD ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            padding: '14px 18px',
            borderRadius: 16,
            background: 'var(--very-light-mint)',
            border: '1.5px solid var(--soft-leaf-green)',
            fontSize: '0.8rem',
            color: 'var(--primary-text)'
          }}>
            <strong>Transparent Scorecard Formula:</strong>{' '}
            Weighted composite score of Pickup Completion Rate ({scorecardWeights?.pickupCompletionWeight ?? 35}%), Complaint Resolution Rate ({scorecardWeights?.complaintResolutionWeight ?? 25}%), Recycling Rate ({scorecardWeights?.recyclingRateWeight ?? 20}%), and On-Time Collection Rate ({scorecardWeights?.timelinessWeight ?? 20}%). Wards with zero recorded requests or complaints are marked N/A rather than assigned arbitrary rankings.
          </div>

          {scorecards.length === 0 ? (
            <EmptyState title="No Ward Scorecard Data Available" subtitle="Create wards or submit pickup requests to compare ward operational performance." />
          ) : (
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--border-light)', color: 'var(--secondary-text)' }}>
                      <th style={{ padding: '10px' }}>Ward</th>
                      <th style={{ padding: '10px' }}>Requests (Done / Open / Overdue)</th>
                      <th style={{ padding: '10px' }}>Completion Rate</th>
                      <th style={{ padding: '10px' }}>Complaints (Resolved Rate)</th>
                      <th style={{ padding: '10px' }}>Waste Collected & Recycling %</th>
                      <th style={{ padding: '10px' }}>Avg Completion Time</th>
                      <th style={{ padding: '10px' }}>Performance Score</th>
                      <th style={{ padding: '10px' }}>Drill-Down</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorecards.map((sc, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--primary-text)' }}>{sc.wardNumber}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>{sc.wardName}</div>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <strong>{sc.totalPickupRequests}</strong> total ({sc.completedCollections} done / {sc.pendingCollections} open / <span style={{ color: sc.overdueRequests > 0 ? '#dc2626' : 'inherit' }}>{sc.overdueRequests} overdue</span>)
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: 700 }}>
                          {sc.pickupCompletionRate !== null ? `${sc.pickupCompletionRate}%` : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          {sc.totalComplaints} total ({sc.missedCollectionComplaints} missed) •{' '}
                          <strong>{sc.complaintResolutionRate !== null ? `${sc.complaintResolutionRate}%` : 'N/A'}</strong>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <strong>{sc.wasteCollectedKg} kg</strong> ({sc.recyclingRate !== null ? `${sc.recyclingRate}% recycled` : 'N/A'})
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          {sc.averageCompletionTimeHours !== null ? `${sc.averageCompletionTimeHours} hrs` : '—'}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          {sc.performanceScore !== null ? (
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontWeight: 900,
                              background: sc.performanceScore >= 75 ? '#dcfce7' : sc.performanceScore >= 50 ? '#fef3c7' : '#fee2e2',
                              color: sc.performanceScore >= 75 ? '#166534' : sc.performanceScore >= 50 ? '#92400e' : '#991b1b'
                            }}>
                              {sc.performanceScore} / 100
                            </span>
                          ) : (
                            <span style={{ color: 'var(--secondary-text)', fontSize: '0.75rem' }}>N/A (No Activity)</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          {sc.wardId ? (
                            <button
                              type="button"
                              onClick={() => handleOpenWardDetail(sc.wardId)}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                            >
                              Inspect
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>Unregistered</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Ward Modal */}
      {isWardModalOpen && (
        <div className="modal-overlay" onClick={() => setIsWardModalOpen(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: '24px', borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                {editingWard ? `Edit ${editingWard.wardNumber}` : 'Create Coimbatore Municipal Ward Record'}
              </h3>
              <button onClick={() => setIsWardModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveWard} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>WARD NUMBER / ID *</label>
                  <input
                    type="text"
                    required
                    value={wardForm.wardNumber}
                    onChange={(e) => setWardForm(p => ({ ...p, wardNumber: e.target.value }))}
                    placeholder="e.g., Ward 24"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>WARD NAME *</label>
                  <input
                    type="text"
                    required
                    value={wardForm.wardName}
                    onChange={(e) => setWardForm(p => ({ ...p, wardName: e.target.value }))}
                    placeholder="e.g., Peelamedu"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>MUNICIPAL ZONE</label>
                  <select
                    value={wardForm.zone}
                    onChange={(e) => setWardForm(p => ({ ...p, zone: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    {COIMBATORE_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>OPERATIONAL STATUS</label>
                  <select
                    value={wardForm.operationalStatus}
                    onChange={(e) => setWardForm(p => ({ ...p, operationalStatus: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>LOCALITIES (COMMA-SEPARATED)</label>
                <input
                  type="text"
                  value={wardForm.localities}
                  onChange={(e) => setWardForm(p => ({ ...p, localities: e.target.value }))}
                  placeholder="Peelamedu, Hopes College, PSG Tech Area"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                />
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>REF. LATITUDE (OPTIONAL)</label>
                  <input
                    type="number"
                    step="any"
                    value={wardForm.referenceLat}
                    onChange={(e) => setWardForm(p => ({ ...p, referenceLat: e.target.value }))}
                    placeholder="e.g., 11.0285"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>REF. LONGITUDE (OPTIONAL)</label>
                  <input
                    type="number"
                    step="any"
                    value={wardForm.referenceLng}
                    onChange={(e) => setWardForm(p => ({ ...p, referenceLng: e.target.value }))}
                    placeholder="e.g., 77.0028"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setIsWardModalOpen(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>
                  {editingWard ? 'Save Ward' : 'Create Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
