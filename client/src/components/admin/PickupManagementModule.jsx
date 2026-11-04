import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RotateCw,
  Edit3,
  Trash2,
  Eye,
  UserPlus,
  X,
  MapPin,
  AlertTriangle,
  History
} from 'lucide-react';
import { api } from '../../services/api';
import {
  AdminPageHeader,
  StatusBadge,
  ConfirmModal,
  LoadingState,
  EmptyState,
  PaginationBar,
  WASTE_CATEGORIES,
  PICKUP_STATUSES,
  VALID_STATUS_TRANSITIONS,
  formatISTDate
} from './AdminSharedUI';

export default function PickupManagementModule({ showToast, onGlobalRefresh }) {
  const [reports, setReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Priority Queue
  const [priorityTab, setPriorityTab] = useState('all'); // 'all' | 'overdue' | 'unassigned' | 'hazardous'
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [workerFilter, setWorkerFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [selectedReport, setSelectedReport] = useState(null);
  const [residentHistory, setResidentHistory] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [assignModalReport, setAssignModalReport] = useState(null);
  const [assignForm, setAssignForm] = useState({ workerId: '', vehicleId: '', note: '' });

  const [rejectModalReport, setRejectModalReport] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [editModalReport, setEditModalReport] = useState(null);
  const [editForm, setEditForm] = useState({
    category: 'Plastic',
    subCategory: '',
    quantity: 1,
    unit: 'bags',
    ward: '',
    locality: '',
    address: '',
    priority: 'Normal',
    specialHandling: false,
    notes: ''
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchPickupData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        search: search.trim() || undefined,
        ward: wardFilter !== 'All' ? wardFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        workerId: workerFilter !== 'All' ? workerFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        overdueOnly: priorityTab === 'overdue' ? 'true' : undefined,
        unassignedOnly: priorityTab === 'unassigned' ? 'true' : undefined,
        hazardousOnly: priorityTab === 'hazardous' ? 'true' : undefined
      };

      const [repRes, wrkRes, vehRes, wrdRes] = await Promise.all([
        api.getReports(params),
        api.getWorkers(),
        api.getVehicles(),
        api.getWards()
      ]);

      if (repRes.success) {
        setReports(repRes.reports || []);
        setTotalPages(repRes.totalPages || 1);
        setTotalCount(repRes.totalCount ?? (repRes.reports || []).length);
      }
      if (wrkRes.success) setWorkers(wrkRes.workers || []);
      if (vehRes.success) setVehicles(vehRes.vehicles || []);
      if (wrdRes.success) setWards(wrdRes.wards || []);
    } catch (e) {
      showToast(e.message || 'Failed to load pickup requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, wardFilter, categoryFilter, statusFilter, workerFilter, dateFrom, dateTo, priorityTab, showToast]);

  useEffect(() => {
    fetchPickupData();
  }, [fetchPickupData]);

  const handleOpenDetail = async (report) => {
    setSelectedReport(report);
    setResidentHistory([]);
    setLoadingDetail(true);
    try {
      const res = await api.getReportById(report._id || report.trackingId);
      if (res.success) {
        setSelectedReport(res.report);
        setResidentHistory(res.residentPreviousRequests || []);
      }
    } catch {
      // keep existing report view
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTransitionStatus = async (report, nextStatus) => {
    if (nextStatus === 'Rejected') {
      setRejectModalReport(report);
      setRejectionReason('');
      return;
    }

    const res = await api.updateReportStatus(
      report._id || report.trackingId,
      nextStatus,
      `Status transitioned from ${report.status} to ${nextStatus} by Municipal Admin`
    );
    if (res.success) {
      showToast(`Pickup ${report.trackingId} updated to ${nextStatus}`);
      fetchPickupData();
      if (onGlobalRefresh) onGlobalRefresh();
      if (selectedReport && (selectedReport._id === report._id || selectedReport.trackingId === report.trackingId)) {
        setSelectedReport(res.report);
      }
    } else {
      showToast(res.message || 'Invalid status transition', 'error');
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalReport) return;
    if (!rejectionReason.trim()) {
      showToast('Please enter a reason for rejecting this request.', 'warning');
      return;
    }
    const res = await api.updateReportStatus(
      rejectModalReport._id || rejectModalReport.trackingId,
      'Rejected',
      rejectionReason.trim(),
      rejectionReason.trim()
    );
    if (res.success) {
      showToast(`Pickup ${rejectModalReport.trackingId} rejected.`);
      setRejectModalReport(null);
      fetchPickupData();
      if (onGlobalRefresh) onGlobalRefresh();
    } else {
      showToast(res.message || 'Failed to reject request', 'error');
    }
  };

  const handleOpenAssign = (report) => {
    setAssignModalReport(report);
    setAssignForm({
      workerId: report.assignedDriver?.driverId || '',
      vehicleId: report.assignedDriver?.vehicleId || '',
      note: ''
    });
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalReport) return;
    if (!assignForm.workerId) {
      showToast('Please select a collection worker to assign.', 'warning');
      return;
    }
    const res = await api.assignDriver(assignModalReport._id || assignModalReport.trackingId, assignForm);
    if (res.success) {
      showToast(`Assigned ${assignModalReport.trackingId} to ${res.report?.assignedDriver?.name || 'worker'}`);
      setAssignModalReport(null);
      fetchPickupData();
      if (onGlobalRefresh) onGlobalRefresh();
    } else {
      showToast(res.message || 'Assignment failed', 'error');
    }
  };

  const handleOpenEdit = (report) => {
    setEditModalReport(report);
    setEditForm({
      category: report.category || 'Plastic',
      subCategory: report.subCategory || '',
      quantity: report.quantity || 1,
      unit: report.unit || 'bags',
      ward: report.ward || report.location?.ward || '',
      locality: report.locality || report.location?.locality || '',
      address: report.location?.address || '',
      priority: report.priority || 'Normal',
      specialHandling: Boolean(report.specialHandling),
      notes: report.notes || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModalReport) return;
    const res = await api.updateReport(editModalReport._id || editModalReport.trackingId, editForm);
    if (res.success) {
      showToast(`Pickup ${editModalReport.trackingId} updated successfully`);
      setEditModalReport(null);
      fetchPickupData();
      if (onGlobalRefresh) onGlobalRefresh();
    } else {
      showToast(res.message || 'Failed to update report', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await api.deleteReport(deleteTarget._id || deleteTarget.trackingId);
    if (res.success) {
      showToast(`Pickup ${deleteTarget.trackingId} deleted from database`);
      setDeleteTarget(null);
      fetchPickupData();
      if (onGlobalRefresh) onGlobalRefresh();
    } else {
      showToast(res.message || 'Failed to delete report', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <AdminPageHeader
        breadcrumb="Operations • Pickup Requests"
        title="Pickup Request Management & Dispatch Queue"
        subtitle="Manage citizen doorstep pickup requests across Coimbatore wards, enforce collection lifecycle transitions, and assign workers and vehicles."
        actions={
          <button
            type="button"
            onClick={fetchPickupData}
            className="btn-secondary"
            style={{ padding: '9px 16px', fontSize: '0.84rem' }}
          >
            <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Queue</span>
          </button>
        }
      />

      {/* Priority Queue Tabs */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Pickup Requests' },
          { id: 'overdue', label: 'Overdue Queue' },
          { id: 'unassigned', label: 'Waiting for Assignment' },
          { id: 'hazardous', label: 'Hazardous & Special Handling' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setPriorityTab(tab.id);
              setPage(1);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              background: priorityTab === tab.id ? 'var(--primary-forest)' : '#ffffff',
              color: priorityTab === tab.id ? '#ffffff' : 'var(--primary-text)',
              border: '1.5px solid var(--border-light)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--main-background)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '7px 12px' }}>
            <Search size={14} color="var(--secondary-green)" />
            <input
              type="text"
              placeholder="ID, resident, address..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', width: '100%', outline: 'none' }}
            />
          </div>

          <select
            value={wardFilter}
            onChange={(e) => { setWardFilter(e.target.value); setPage(1); }}
            style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.8rem', background: '#ffffff' }}
          >
            <option value="All">All Wards & Localities</option>
            {wards.map(w => (
              <option key={w._id} value={w.wardNumber}>{w.wardNumber} - {w.wardName}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.8rem', background: '#ffffff' }}
          >
            <option value="All">All Waste Categories</option>
            {WASTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.8rem', background: '#ffffff' }}
          >
            <option value="All">All Statuses</option>
            {PICKUP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={workerFilter}
            onChange={(e) => { setWorkerFilter(e.target.value); setPage(1); }}
            style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.8rem', background: '#ffffff' }}
          >
            <option value="All">All Assigned Workers</option>
            {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            title="From Date"
            style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.78rem' }}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            title="To Date"
            style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: '0.78rem' }}
          />
        </div>
      </div>

      {/* Pickup Table */}
      {loading ? (
        <LoadingState label="Loading pickup requests..." />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Pickup Requests Found"
          subtitle="No pickup requests match the selected ward, status, category, or priority filters."
        />
      ) : (
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-light)', color: 'var(--secondary-text)' }}>
                  <th style={{ padding: '10px 12px' }}>Tracking ID</th>
                  <th style={{ padding: '10px 12px' }}>Resident</th>
                  <th style={{ padding: '10px 12px' }}>Address / Ward</th>
                  <th style={{ padding: '10px 12px' }}>Waste & Qty</th>
                  <th style={{ padding: '10px 12px' }}>Preferred Slot</th>
                  <th style={{ padding: '10px 12px' }}>Worker / Vehicle</th>
                  <th style={{ padding: '10px 12px' }}>Lifecycle Status</th>
                  <th style={{ padding: '10px 12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => {
                  const allowedNext = VALID_STATUS_TRANSITIONS[r.status] || [];
                  const hasCoords = r.location?.coordinates?.lat !== undefined && r.location?.coordinates?.lng !== undefined;
                  return (
                    <tr key={r._id || r.trackingId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--primary-forest)' }}>{r.trackingId}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {r.isOverdue && <StatusBadge status="Overdue" />}
                          {(['Electronic', 'Medical'].includes(r.category) || r.priority === 'Hazardous') && (
                            <StatusBadge status="Hazardous" />
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-text)' }}>{r.citizen?.name}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--secondary-text)' }}>{r.citizen?.phone || r.citizen?.email}</div>
                      </td>

                      <td style={{ padding: '12px', maxWidth: 220 }}>
                        <div style={{ color: 'var(--primary-text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.location?.address}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          {r.ward && <span>{r.ward}</span>}
                          <span style={{ color: hasCoords ? '#15803d' : '#94a3b8', fontWeight: 700 }}>
                            {hasCoords ? '• GPS Verified' : '• Address Only'}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <StatusBadge status={r.category} />
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary-text)', marginTop: 4 }}>
                          {r.quantity} {r.unit} <span style={{ color: 'var(--secondary-text)', fontWeight: 500 }}>({r.estimatedWeightKg ?? 4} kg est.)</span>
                        </div>
                      </td>

                      <td style={{ padding: '12px', fontSize: '0.76rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-text)' }}>{formatISTDate(r.preferredSlot?.date)}</div>
                        <div style={{ color: 'var(--secondary-text)' }}>{r.preferredSlot?.timeSlot}</div>
                      </td>

                      <td style={{ padding: '12px', fontSize: '0.76rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-text)' }}>
                          {r.assignedDriver?.name || 'Awaiting Assignment'}
                        </div>
                        {r.assignedDriver?.vehiclePlate && (
                          <div style={{ color: 'var(--primary-forest)', fontWeight: 700 }}>
                            {r.assignedDriver.vehiclePlate}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <StatusBadge status={r.status} />
                          {allowedNext.length > 0 && (
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) handleTransitionStatus(r, e.target.value);
                              }}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 8,
                                border: '1px solid var(--border-light)',
                                fontSize: '0.73rem',
                                fontWeight: 700,
                                color: 'var(--primary-forest)',
                                background: '#ffffff',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">Transition Status...</option>
                              {allowedNext.map(nextSt => (
                                <option key={nextSt} value={nextSt}>→ {nextSt}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(r)}
                            title="Inspect Details, Timeline & Resident History"
                            style={{ padding: 6, borderRadius: 8, background: 'var(--pale-green-section)', border: 'none', color: 'var(--primary-forest)', cursor: 'pointer' }}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAssign(r)}
                            title="Assign Worker & Vehicle"
                            style={{ padding: 6, borderRadius: 8, background: '#e0f2fe', border: 'none', color: '#0369a1', cursor: 'pointer' }}
                          >
                            <UserPlus size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            title="Edit Request Details"
                            style={{ padding: 6, borderRadius: 8, background: '#f1f5f9', border: 'none', color: '#334155', cursor: 'pointer' }}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(r)}
                            title="Delete Pickup Request"
                            style={{ padding: 6, borderRadius: 8, background: '#fef2f2', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Inspect Pickup Details, Status Timeline & Resident History Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 680, width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: '24px 28px', borderRadius: 22 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                    Pickup Request {selectedReport.trackingId}
                  </h3>
                  <StatusBadge status={selectedReport.status} />
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', marginTop: 2 }}>
                  Submitted on {formatISTDate(selectedReport.createdAt, true)}
                </p>
              </div>
              <button onClick={() => setSelectedReport(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="grid-2" style={{ gap: 14, marginBottom: 16 }}>
              <div style={{ padding: 14, borderRadius: 14, background: 'var(--main-background)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Resident Information</div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', marginTop: 4 }}>{selectedReport.citizen?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginTop: 2 }}>Phone: {selectedReport.citizen?.phone || 'Not provided'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Email: {selectedReport.citizen?.email || 'Not provided'}</div>
              </div>

              <div style={{ padding: 14, borderRadius: 14, background: 'var(--main-background)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Waste & Collection Slot</div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', marginTop: 4 }}>
                  {selectedReport.category} — {selectedReport.quantity} {selectedReport.unit} ({selectedReport.estimatedWeightKg ?? 4} kg est.)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginTop: 2 }}>
                  Preferred: {formatISTDate(selectedReport.preferredSlot?.date)} ({selectedReport.preferredSlot?.timeSlot})
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
                  Assigned: <strong>{selectedReport.assignedDriver?.name || 'Unassigned'}</strong> {selectedReport.assignedDriver?.vehiclePlate ? `(${selectedReport.assignedDriver.vehiclePlate})` : ''}
                </div>
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: 14, background: 'var(--main-background)', border: '1px solid var(--border-light)', marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Pickup Location & Coordinates</div>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', marginTop: 4 }}>{selectedReport.location?.address}</div>
              {selectedReport.ward && <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>Ward: {selectedReport.ward}</div>}
              <div style={{ fontSize: '0.78rem', color: 'var(--primary-forest)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} />
                {selectedReport.location?.coordinates?.lat !== undefined && selectedReport.location?.coordinates?.lng !== undefined
                  ? `Actual GPS Attached: ${selectedReport.location.coordinates.lat}, ${selectedReport.location.coordinates.lng}`
                  : 'No GPS coordinates attached by resident (Address-only request)'}
              </div>
              {selectedReport.notes && (
                <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', marginTop: 6 }}>
                  <strong>Resident Notes:</strong> {selectedReport.notes}
                </div>
              )}
              {selectedReport.rejectionReason && (
                <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: 6 }}>
                  <strong>Rejection Reason:</strong> {selectedReport.rejectionReason}
                </div>
              )}
            </div>

            {/* Complete Status History Timeline */}
            <div style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-text)', marginBottom: 10 }}>
                Complete Status Lifecycle History
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(selectedReport.timeline || []).map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border-light)', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StatusBadge status={t.status} />
                      <span style={{ color: 'var(--primary-text)', fontWeight: 600 }}>{t.note}</span>
                    </div>
                    <span style={{ color: 'var(--secondary-text)', fontSize: '0.72rem' }}>{formatISTDate(t.timestamp, true)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous Requests from Same Resident */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <History size={15} color="var(--primary-forest)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                  Previous Requests from {selectedReport.citizen?.name}
                </h4>
              </div>
              {loadingDetail ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>Loading resident history...</div>
              ) : residentHistory.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>No other pickup requests found for this resident.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {residentHistory.map(prev => (
                    <div key={prev._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 8, background: 'var(--main-background)', fontSize: '0.76rem' }}>
                      <span><strong>{prev.trackingId}</strong> • {prev.category} ({prev.quantity} {prev.unit})</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--secondary-text)' }}>{formatISTDate(prev.createdAt)}</span>
                        <StatusBadge status={prev.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Worker & Vehicle Modal */}
      {assignModalReport && (
        <div className="modal-overlay" onClick={() => setAssignModalReport(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, width: '100%', padding: '24px', borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                Assign Worker & Vehicle ({assignModalReport.trackingId})
              </h3>
              <button onClick={() => setAssignModalReport(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                  SELECT REGISTERED COLLECTION WORKER *
                </label>
                <select
                  required
                  value={assignForm.workerId}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, workerId: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border-light)', fontSize: '0.84rem' }}
                >
                  <option value="">-- Choose Collection Worker --</option>
                  {workers.filter(w => w.isActive !== false && !['On Leave', 'Inactive'].includes(w.operationalStatus)).map(w => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.employeeId || 'Driver'}) — {w.assignedWard || 'All Wards'} [{w.operationalStatus}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                  SELECT AVAILABLE FLEET VEHICLE
                </label>
                <select
                  value={assignForm.vehicleId}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border-light)', fontSize: '0.84rem' }}
                >
                  <option value="">-- Use Worker Default or Select Vehicle --</option>
                  {vehicles.filter(v => v.isActive && !['Under Maintenance', 'Out of Service', 'Deactivated'].includes(v.operationalStatus)).map(v => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} ({v.vehicleType}) — Rem. Cap: {v.remainingCapacityKg ?? v.carryingCapacity} kg
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                  DISPATCH INSTRUCTIONS / NOTES
                </label>
                <input
                  type="text"
                  value={assignForm.note}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Optional instructions for collection worker..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border-light)', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setAssignModalReport(null)} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Request Modal */}
      {rejectModalReport && (
        <div className="modal-overlay" onClick={() => setRejectModalReport(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, width: '100%', padding: '24px', borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', marginBottom: 10 }}>
              <AlertTriangle size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Reject Pickup {rejectModalReport.trackingId}</h3>
            </div>
            <form onSubmit={handleConfirmReject} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary-text)' }}>
                Provide a clear rejection reason for the resident *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Construction debris requires bulk industrial clearance..."
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid var(--border-light)', fontSize: '0.84rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setRejectModalReport(null)} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: 999, background: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  Reject Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Request Details Modal */}
      {editModalReport && (
        <div className="modal-overlay" onClick={() => setEditModalReport(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, width: '100%', padding: '24px', borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                Edit Request Details ({editModalReport.trackingId})
              </h3>
              <button onClick={() => setEditModalReport(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>CATEGORY</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm(p => ({ ...p, category: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    {WASTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>PRIORITY</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm(p => ({ ...p, priority: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    {['Normal', 'High', 'Urgent', 'Hazardous'].map(pr => <option key={pr} value={pr}>{pr}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>QUANTITY (1-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={editForm.quantity}
                    onChange={(e) => setEditForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>UNIT</label>
                  <select
                    value={editForm.unit}
                    onChange={(e) => setEditForm(p => ({ ...p, unit: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  >
                    <option value="bags">bags</option>
                    <option value="kg">kg</option>
                    <option value="items">items</option>
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>WARD</label>
                  <input
                    type="text"
                    value={editForm.ward}
                    onChange={(e) => setEditForm(p => ({ ...p, ward: e.target.value }))}
                    placeholder="e.g., Ward 24"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>LOCALITY</label>
                  <input
                    type="text"
                    value={editForm.locality}
                    onChange={(e) => setEditForm(p => ({ ...p, locality: e.target.value }))}
                    placeholder="e.g., Peelamedu"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>PICKUP ADDRESS</label>
                <input
                  type="text"
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm(p => ({ ...p, address: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>NOTES</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-light)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setEditModalReport(null)} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Pickup Request"
        message={`Are you sure you want to permanently delete pickup request ${deleteTarget?.trackingId}? This action is logged in the administrative audit trail.`}
        confirmLabel="Delete Request"
        danger={true}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

