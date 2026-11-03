import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Filter, 
  Search, 
  Compass, 
  Leaf, 
  RotateCw,
  Edit3,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { ForestSilhouettes, FloatingLeaf } from './NatureDecorations';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const ALL_CATEGORIES = ['All', 'Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass'];
const CANONICAL_CATEGORIES = ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass'];
const ALL_STATUSES = ['All', 'Reported', 'Confirmed', 'Assigned', 'In Progress', 'Collected', 'Recycled', 'Cancelled'];

// Custom waypoint pin icons
const depotIcon = new L.DivIcon({
  className: 'custom-depot-pin',
  html: `<div style="background:#166534; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2.5px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.3); font-size:12px; font-weight:800;">HQ</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const pickupIcon = new L.DivIcon({
  className: 'custom-pickup-pin',
  html: `<div style="background:#0284c7; color:white; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.25); font-size:11px; font-weight:700;">📦</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const dropoffIcon = new L.DivIcon({
  className: 'custom-dropoff-pin',
  html: `<div style="background:#15803d; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2.5px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.3); font-size:12px; font-weight:800;">♻️</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

export default function AdminDashboard({ onRefreshNeeded }) {
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  // Edit Report Modal State (Full CRUD Edit)
  const [editingReport, setEditingReport] = useState(null);
  const [editFormData, setEditFormData] = useState({
    category: 'Plastic',
    subCategory: '',
    quantity: 1,
    unit: 'bags',
    address: '',
    notes: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setAnalyticsError('');
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;

      const [reportsRes, analyticsRes] = await Promise.all([
        api.getReports(params),
        api.getAnalytics()
      ]);

      if (reportsRes.success && Array.isArray(reportsRes.reports)) {
        setReports(reportsRes.reports);
      }
      if (analyticsRes.success && analyticsRes.stats) {
        setAnalytics(analyticsRes.stats);
      } else {
        setAnalyticsError(analyticsRes.message || 'Analytics currently unavailable.');
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
      setAnalyticsError(e.message || 'Error loading dashboard records.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      const res = await api.updateReportStatus(reportId, newStatus, `Municipal supervisor updated status to ${newStatus}`);
      if (res.success) {
        loadData();
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        alert(res.message || 'Failed to update status');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this pickup record? (CRUD Delete from MongoDB)')) {
      try {
        const res = await api.deleteReport(reportId);
        if (res.success) {
          loadData();
          if (onRefreshNeeded) onRefreshNeeded();
        } else {
          alert(res.message || 'Failed to delete record');
        }
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleOpenEdit = (report) => {
    setEditingReport(report);
    setEditFormData({
      category: report.category || 'Plastic',
      subCategory: report.subCategory || '',
      quantity: report.quantity || 1,
      unit: report.unit || 'bags',
      address: report.location?.address || '',
      notes: report.notes || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingReport) return;

    try {
      setIsSavingEdit(true);
      const reportId = editingReport._id || editingReport.trackingId;
      const res = await api.updateReport(reportId, editFormData);
      if (res.success) {
        setEditingReport(null);
        loadData();
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        alert(res.message || 'Failed to update report');
      }
    } catch (err) {
      alert(err.message || 'Update failed');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOptimizeRoute = async () => {
    try {
      setOptimizing(true);
      const res = await api.getOptimizedRoute();
      if (res.success) {
        setOptimizedRoute(res);
      } else {
        alert(res.message || 'Failed to compute route optimization.');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setOptimizing(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const s = search.toLowerCase();
    const tracking = (r.trackingId || '').toLowerCase();
    const citizen = (r.citizen?.name || '').toLowerCase();
    const addr = (r.location?.address || '').toLowerCase();
    return tracking.includes(s) || citizen.includes(s) || addr.includes(s);
  });

  // Chart 1: Category Distribution Doughnut
  const hasCategoryData = analytics?.categoryDistribution && analytics.categoryDistribution.some(c => (c.weightKg || c.count) > 0);
  const categoryLabels = analytics?.categoryDistribution?.map(c => c.category) || CANONICAL_CATEGORIES;
  const categoryCounts = analytics?.categoryDistribution?.map(c => c.weightKg || c.count) || [0, 0, 0, 0, 0, 0, 0];
  const doughnutData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryCounts,
        backgroundColor: [
          '#0284c7', // Plastic
          '#15803d', // Organic
          '#b45309', // Electronic
          '#be123c', // Medical
          '#059669', // Recyclable
          '#475569', // Metal
          '#0d9488'  // Glass
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Chart 2: Monthly Trends Bar Chart
  const hasMonthlyData = analytics?.monthlyTrends && analytics.monthlyTrends.some(m => (m.collectedKg || m.recycledKg) > 0);
  const monthlyLabels = analytics?.monthlyTrends?.map(m => m.month) || [];
  const monthlyCollected = analytics?.monthlyTrends?.map(m => m.collectedKg) || [];
  const monthlyRecycled = analytics?.monthlyTrends?.map(m => m.recycledKg) || [];
  const barData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Collected Waste (kg)',
        data: monthlyCollected,
        backgroundColor: '#166534',
        borderRadius: 6
      },
      {
        label: 'Recycled / Diverted (kg)',
        data: monthlyRecycled,
        backgroundColor: '#86efac',
        borderRadius: 6
      }
    ]
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 26 }}>
      {/* Top Municipal Stats Header */}
      <div 
        className="pale-green-box"
        style={{
          padding: '30px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20
        }}
      >
        <ForestSilhouettes opacity={0.15} height={140} />
        <FloatingLeaf size={32} top={16} right={24} rotate={25} opacity={0.22} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 660 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#ffffff',
            border: '1.5px solid var(--soft-leaf-green)',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: '0.76rem',
            fontWeight: 700,
            color: 'var(--primary-forest)',
            marginBottom: 8
          }}>
            <BarChart3 size={14} color="var(--secondary-green)" />
            <span>Database-Driven Municipal Management</span>
          </div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--primary-text)', letterSpacing: '-0.4px' }}>
            WasteWise Analytics & Fleet Dispatch
          </h2>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.88rem', marginTop: 4 }}>
            Direct MongoDB CRUD operations, category metrics, and Traveling Salesperson (TSP) collection route optimization.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
          <button
            onClick={loadData}
            className="btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.86rem' }}
            title="Refresh database records"
          >
            <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOptimizeRoute}
            disabled={optimizing}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.88rem' }}
          >
            <Compass size={16} />
            <span>{optimizing ? 'Calculating TSP Path...' : 'Optimize Collection Route'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4">
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--secondary-text)', fontSize: '0.78rem', fontWeight: 700 }}>
            <span>TOTAL REPORTS</span>
            <span style={{ color: 'var(--primary-forest)' }}>CRUD</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--primary-text)', marginTop: 4 }}>
            {analytics?.totalRequests ?? reports.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--secondary-text)', marginTop: 4 }}>
            Citizen requests logged
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--secondary-text)', fontSize: '0.78rem', fontWeight: 700 }}>
            <span>ACTIVE / PENDING</span>
            <Clock size={16} color="#b45309" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#b45309', marginTop: 4 }}>
            {analytics?.pendingPickups ?? reports.filter(r => ['Reported', 'Confirmed', 'Assigned', 'In Progress'].includes(r.status)).length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--secondary-text)', marginTop: 4 }}>
            Pending collection rounds
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--secondary-text)', fontSize: '0.78rem', fontWeight: 700 }}>
            <span>COLLECTED / RECYCLED</span>
            <CheckCircle size={16} color="var(--secondary-green)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--secondary-green)', marginTop: 4 }}>
            {analytics?.completedPickups ?? reports.filter(r => ['Collected', 'Recycled'].includes(r.status)).length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--secondary-text)', marginTop: 4 }}>
            Diverted to recycling centres
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--secondary-text)', fontSize: '0.78rem', fontWeight: 700 }}>
            <span>TOTAL WASTE MASS</span>
            <span style={{ color: 'var(--primary-forest)' }}>kg</span>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--primary-forest)', marginTop: 4 }}>
            {analytics?.totalWasteKg ?? 0} <span style={{ fontSize: '1rem', fontWeight: 700 }}>kg</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--secondary-text)', marginTop: 4 }}>
            Recycling Rate: <strong>{analytics?.recyclingRate ?? 0}%</strong>
          </div>
        </div>
      </div>

      {/* Illustrative Environmental Estimates Section */}
      <div style={{
        background: 'var(--very-light-mint)',
        border: '1.5px solid var(--soft-leaf-green)',
        borderRadius: 20,
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'var(--pale-green-section)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-forest)'
          }}>
            <Leaf size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                Illustrative Environmental Estimates
              </h4>
              <span style={{
                background: '#ffffff',
                border: '1px solid var(--soft-leaf-green)',
                padding: '1px 8px',
                borderRadius: 999,
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--secondary-green)'
              }}>
                Indicative Heuristic Model
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--secondary-text)', marginTop: 2 }}>
              Illustrative figures calculated on recorded diverted waste (approx. 0.72 kg CO₂ saved / kg waste; 1 tree absorbs ~22 kg CO₂/yr; 1.8 kWh energy saved/kg). Values represent indicative models, not certified laboratory measurements.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>
              CO₂ Diverted (Est.)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
              {analytics?.environmentalEstimates?.co2SavedKg ?? 0} kg
            </div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1.5px solid var(--border-light)', paddingLeft: 18 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>
              Tree Eq. Preserved (Est.)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--secondary-green)' }}>
              {analytics?.environmentalEstimates?.treesPreserved ?? 0} trees
            </div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1.5px solid var(--border-light)', paddingLeft: 18 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--secondary-text)', fontWeight: 700, textTransform: 'uppercase' }}>
              Energy Conserved (Est.)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#b45309' }}>
              {analytics?.environmentalEstimates?.kwhEnergySaved ?? 0} kWh
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      {analyticsError && !analytics ? (
        <div style={{ textAlign: 'center', padding: '30px', background: '#ffffff', borderRadius: 18, border: '1.5px solid var(--border-light)' }}>
          <AlertCircle size={24} color="#b45309" style={{ margin: '0 auto 8px' }} />
          <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--primary-text)' }}>Analytics Unavailable</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', marginTop: 4 }}>{analyticsError}</p>
        </div>
      ) : (
        <div className="grid-2">
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                  Waste by Category Breakdown
                </h4>
                <p style={{ fontSize: '0.76rem', color: 'var(--secondary-text)' }}>
                  Aggregated from recorded database reports
                </p>
              </div>
            </div>
            {hasCategoryData ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
              </div>
            ) : (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-text)', fontSize: '0.84rem' }}>
                No category records available to plot.
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                  Monthly Collection & Recycling Trends
                </h4>
                <p style={{ fontSize: '0.76rem', color: 'var(--secondary-text)' }}>
                  Last 6 months recorded municipal weights
                </p>
              </div>
            </div>
            {hasMonthlyData ? (
              <div style={{ height: 260 }}>
                <Bar data={barData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
              </div>
            ) : (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-text)', fontSize: '0.84rem' }}>
                No monthly collection records recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TSP Route Optimization Interactive Map Section */}
      {optimizedRoute && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--secondary-green)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Compass size={15} />
                <span>TSP Shortest-Path Heuristic Solution</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-text)', marginTop: 2 }}>
                Optimized Multi-Stop Fleet Collection Route
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
                Depot Origin → Sequential Pickups → Nearest Recycling Terminal ({optimizedRoute.dropoff?.name || 'Recycling Drop-Off'})
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ background: 'var(--pale-green-section)', padding: '6px 14px', borderRadius: 12, border: '1px solid var(--soft-leaf-green)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--secondary-text)', fontWeight: 700 }}>Total Distance</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-forest)' }}>{optimizedRoute.totalDistanceKm} km</div>
              </div>
              <div style={{ background: 'var(--pale-green-section)', padding: '6px 14px', borderRadius: 12, border: '1px solid var(--soft-leaf-green)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--secondary-text)', fontWeight: 700 }}>Est. Time</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-forest)' }}>{optimizedRoute.estimatedTimeMin} min</div>
              </div>
              <div style={{ background: 'var(--pale-green-section)', padding: '6px 14px', borderRadius: 12, border: '1px solid var(--soft-leaf-green)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--secondary-text)', fontWeight: 700 }}>Est. Distance Reduction</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--secondary-green)' }}>{optimizedRoute.fuelSavedPercent}%</div>
              </div>
            </div>
          </div>

          {/* Interactive Route Leaflet Map */}
          <div style={{ height: 380, borderRadius: 16, overflow: 'hidden', border: '1.5px solid var(--border-light)', marginBottom: 16 }}>
            <MapContainer
              center={optimizedRoute.waypoints[0]?.coordinates ? [optimizedRoute.waypoints[0].coordinates.lat, optimizedRoute.waypoints[0].coordinates.lng] : [11.0055, 76.9661]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {optimizedRoute.waypoints.map((w, idx) => {
                const icon = w.type === 'depot' ? depotIcon : w.type === 'dropoff' ? dropoffIcon : pickupIcon;
                return (
                  <Marker
                    key={idx}
                    position={[w.coordinates.lat, w.coordinates.lng]}
                    icon={icon}
                  >
                    <Popup>
                      <div style={{ padding: 4 }}>
                        <strong>Stop {idx + 1}: {w.name || w.citizenName || 'Pickup Stop'}</strong>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                          {w.type === 'depot' ? 'Depot Start' : w.type === 'dropoff' ? 'Recycling Drop-Off' : `Waste: ${w.category}`}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              <Polyline
                positions={optimizedRoute.routePolyline || optimizedRoute.waypoints.map(w => [w.coordinates.lat, w.coordinates.lng])}
                pathOptions={{
                  color: '#166534',
                  weight: 4,
                  opacity: 0.9,
                  dashArray: '6, 8'
                }}
              />
            </MapContainer>
          </div>

          {/* Stop-by-Stop Waypoint Sequence */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
            {optimizedRoute.waypoints.map((w, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 14px',
                  borderRadius: 12,
                  background: idx === 0 ? 'var(--pale-green-section)' : idx === optimizedRoute.waypoints.length - 1 ? '#dcfce7' : '#ffffff',
                  border: idx === 0 ? '1.5px solid var(--soft-leaf-green)' : '1px solid var(--border-light)',
                  fontSize: '0.78rem',
                  flexShrink: 0
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--primary-text)' }}>
                  Stop {idx + 1}: {w.name || w.citizenName || 'Pickup Stop'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--secondary-text)' }}>
                  {w.type === 'depot' ? 'Depot Origin' : w.type === 'dropoff' ? 'Dropoff Centre' : w.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Full CRUD Management Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-text)' }}>
              Pickup Reports Management (Full CRUD)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>
              Filter by category, search by tracking ID, edit pickup records, update lifecycle status, and delete entries.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1.5px solid var(--border-light)', borderRadius: 999, padding: '6px 14px' }}>
              <Search size={14} color="var(--secondary-green)" />
              <input
                type="text"
                placeholder="Search ID, name, address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.82rem', width: 170, color: 'var(--primary-text)' }}
              />
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1.5px solid var(--border-light)', borderRadius: 999, padding: '4px 12px' }}>
              <Filter size={13} color="var(--secondary-green)" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-text)' }}
              >
                {ALL_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1.5px solid var(--border-light)', borderRadius: 999, padding: '4px 12px' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-text)' }}
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border-light)', color: 'var(--secondary-text)' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Tracking ID</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Citizen</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Category</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Quantity</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Location</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map(r => (
                  <tr key={r._id || r.trackingId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--primary-forest)' }}>
                      {r.trackingId}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary-text)' }}>{r.citizen?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>{r.citizen?.phone}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge badge-${(r.category || 'plastic').toLowerCase()}`}>
                        {r.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--primary-text)' }}>
                      {r.quantity} {r.unit}
                    </td>
                    <td style={{ padding: '12px 14px', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <div style={{ color: 'var(--primary-text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.location?.address}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r._id || r.trackingId, e.target.value)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 999,
                          border: '1.5px solid var(--border-light)',
                          background: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: r.status === 'Collected' || r.status === 'Recycled' ? 'var(--primary-forest)' : '#b45309',
                          cursor: 'pointer'
                        }}
                      >
                        {ALL_STATUSES.slice(1).map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => handleOpenEdit(r)}
                          title="Edit Pickup Record (CRUD Update)"
                          style={{
                            color: 'var(--primary-forest)',
                            padding: 6,
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(r._id || r.trackingId)}
                          title="Delete Record (CRUD Delete)"
                          style={{
                            color: '#ef4444',
                            padding: 6,
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--secondary-text)' }}>
                    No reports found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full CRUD Report Edit Modal */}
      {editingReport && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 520,
            width: '100%',
            padding: '24px 28px',
            border: '1.5px solid var(--border-light)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                  Edit Pickup Record
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>
                  Tracking ID: {editingReport.trackingId}
                </p>
              </div>
              <button
                onClick={() => setEditingReport(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                  WASTE CATEGORY
                </label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border-light)', fontSize: '0.86rem' }}
                >
                  {CANONICAL_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                  SUB-CATEGORY / DESCRIPTION
                </label>
                <input
                  type="text"
                  value={editFormData.subCategory}
                  onChange={(e) => setEditFormData({ ...editFormData, subCategory: e.target.value })}
                  placeholder="e.g. Clean PET water bottles"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border-light)', fontSize: '0.86rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                    QUANTITY
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({ ...editFormData, quantity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border-light)', fontSize: '0.86rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                    UNIT
                  </label>
                  <select
                    value={editFormData.unit}
                    onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border-light)', fontSize: '0.86rem' }}
                  >
                    <option value="bags">bags</option>
                    <option value="kg">kg</option>
                    <option value="items">items</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                  PICKUP ADDRESS
                </label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border-light)', fontSize: '0.86rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: 4 }}>
                  INSTRUCTIONS / NOTES
                </label>
                <textarea
                  rows="2"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border-light)', fontSize: '0.86rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.84rem' }}
                >
                  <Save size={15} />
                  <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
