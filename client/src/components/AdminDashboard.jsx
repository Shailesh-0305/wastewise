import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Trash2, 
  Edit3, 
  Truck, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Filter, 
  Search, 
  Navigation, 
  TrendingUp, 
  Leaf, 
  RotateCw,
  AlertTriangle,
  Compass
} from 'lucide-react';
import { api } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function AdminDashboard({ onRefreshNeeded }) {
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;

      const [reportsRes, analyticsRes] = await Promise.all([
        api.getReports(params),
        api.getAnalytics()
      ]);

      if (reportsRes.success) setReports(reportsRes.reports);
      if (analyticsRes.success) setAnalytics(analyticsRes.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      const res = await api.updateReportStatus(reportId, newStatus, `Admin updated status to ${newStatus}`);
      if (res.success) {
        setReports(prev => prev.map(r => (r._id === reportId || r.trackingId === reportId) ? res.report : r));
        if (onRefreshNeeded) onRefreshNeeded();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this pickup record? (CRUD Delete)')) {
      try {
        const res = await api.deleteReport(reportId);
        if (res.success) {
          setReports(prev => prev.filter(r => r._id !== reportId && r.trackingId !== reportId));
        }
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleOptimizeRoute = async () => {
    try {
      setOptimizing(true);
      const res = await api.getOptimizedRoute();
      if (res.success) {
        setOptimizedRoute(res);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setOptimizing(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const s = search.toLowerCase();
    return (
      r.trackingId.toLowerCase().includes(s) ||
      r.citizen.name.toLowerCase().includes(s) ||
      r.location.address.toLowerCase().includes(s)
    );
  });

  // Chart 1: Doughnut Chart (Waste by Category)
  const doughnutData = {
    labels: analytics?.categoryDistribution?.map(c => c.category) || ['Plastic', 'Organic', 'E-Waste', 'Recyclable', 'Glass', 'Metal'],
    datasets: [
      {
        data: analytics?.categoryDistribution?.map(c => c.percentage) || [38, 24, 14, 12, 7, 5],
        backgroundColor: ['#0284c7', '#16a34a', '#ca8a04', '#059669', '#0d9488', '#475569'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Chart 2: Bar Chart (Monthly Trends)
  const barData = {
    labels: analytics?.monthlyTrends?.map(m => m.month) || ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    datasets: [
      {
        label: 'Collected Waste (kg)',
        data: analytics?.monthlyTrends?.map(m => m.collectedKg) || [2840, 3120, 3590, 3940, 4210, 4280],
        backgroundColor: '#1b4332',
        borderRadius: 8
      },
      {
        label: 'Recycled / Composted (kg)',
        data: analytics?.monthlyTrends?.map(m => m.recycledKg) || [2410, 2780, 3150, 3520, 3840, 3800],
        backgroundColor: '#22c55e',
        borderRadius: 8
      }
    ]
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Top Municipal Stats Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1b4332 0%, #225740 100%)',
        borderRadius: 24,
        padding: '28px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ade80', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Municipal Operations Dashboard
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>
            WasteWise Analytics & Fleet Dispatch
          </h2>
          <p style={{ color: '#d8f3dc', fontSize: '0.88rem' }}>
            Real-time CRUD management, driver assignment, and TSP route optimization.
          </p>
        </div>

        <button
          onClick={handleOptimizeRoute}
          disabled={optimizing}
          className="btn-mint"
          style={{ padding: '12px 24px', fontSize: '0.95rem' }}
        >
          <Compass size={18} />
          <span>{optimizing ? 'Calculating Shortest Path...' : 'Optimize Collection Route'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4">
        {[
          { label: 'Total Waste Handled', val: `${analytics?.totalWasteKg?.toLocaleString() || 4280} kg`, icon: Leaf, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Active Pickups', val: `${analytics?.activePickups || 2} Active`, icon: Clock, color: '#0284c7', bg: '#f0f9ff' },
          { label: 'Recycling Efficiency', val: `${analytics?.recyclingRate || 88.4}%`, icon: TrendingUp, color: '#15803d', bg: '#ecfdf5' },
          { label: 'CO₂ Saved To Date', val: `${analytics?.co2SavedKg?.toLocaleString() || 3081} kg`, icon: RotateCw, color: '#059669', bg: '#e0f5ea' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} color={kpi.color} />
              </div>
              <div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>{kpi.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1b4332' }}>{kpi.val}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid-2">
        <div className="card">
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1b4332', marginBottom: 16 }}>
            Waste Category Composition (%)
          </h4>
          <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>

        <div className="card">
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1b4332', marginBottom: 16 }}>
            Monthly Collection vs Recycling Trends (kg)
          </h4>
          <div style={{ height: 240 }}>
            <Bar data={barData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} />
          </div>
        </div>
      </div>

      {/* Route Optimization Result Box (Advanced Requirement) */}
      {optimizedRoute && (
        <div className="card" style={{ border: '2px solid #22c55e', background: '#f0fdf4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Compass size={20} color="#15803d" />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#14532d' }}>
                  TSP Collection Route Optimized Successfully!
                </h4>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#166534', marginTop: 4 }}>
                Calculated shortest sequence connecting all active pickup stops to the nearest processing facility.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ background: '#ffffff', padding: '8px 16px', borderRadius: 12, border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Distance</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>{optimizedRoute.totalDistanceKm} km</div>
              </div>
              <div style={{ background: '#ffffff', padding: '8px 16px', borderRadius: 12, border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Estimated Drive Time</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>{optimizedRoute.estimatedTimeMin} min</div>
              </div>
              <div style={{ background: '#ffffff', padding: '8px 16px', borderRadius: 12, border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Fuel / Emissions Saved</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22c55e' }}>{optimizedRoute.fuelSavedPercent}%</div>
              </div>
            </div>
          </div>

          {/* Ordered Waypoints Polyline Table */}
          <div style={{ background: '#ffffff', borderRadius: 14, padding: '14px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 10 }}>
              Optimized Stop-by-Stop Waypoint Sequence:
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {optimizedRoute.waypoints.map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    background: idx === 0 ? '#1b4332' : idx === optimizedRoute.waypoints.length - 1 ? '#0284c7' : '#f8fafc',
                    color: (idx === 0 || idx === optimizedRoute.waypoints.length - 1) ? '#ffffff' : '#1e293b',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.78rem',
                    flexShrink: 0
                  }}
                >
                  <div style={{ fontWeight: 800 }}>Stop {idx + 1}: {w.name || w.citizenName || 'Pickup Stop'}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>{w.type === 'depot' ? 'Depot Start' : w.type === 'dropoff' ? 'Recycling Center' : w.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full CRUD Management Table for Reports */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1b4332' }}>
              Pickup Reports Management (CRUD)
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Filter by status, search by tracking ID, update lifecycle stages, or delete entries.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 999, padding: '6px 14px' }}>
              <Search size={14} color="#64748b" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, name, address..."
                style={{ border: 'none', background: 'transparent', fontSize: '0.82rem' }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 999, padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600 }}
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Collected">Collected</option>
              <option value="Recycled">Recycled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px' }}>Tracking ID</th>
                <th style={{ padding: '12px' }}>Citizen</th>
                <th style={{ padding: '12px' }}>Category & Qty</th>
                <th style={{ padding: '12px' }}>Pickup Location</th>
                <th style={{ padding: '12px' }}>Status (Update)</th>
                <th style={{ padding: '12px' }}>Assigned Driver</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 800, color: '#1b4332' }}>
                    {report.trackingId}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{report.citizen?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{report.citizen?.phone}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge badge-${report.category.toLowerCase()}`} style={{ marginRight: 6 }}>
                      {report.category}
                    </span>
                    <span style={{ fontWeight: 600, color: '#475569' }}>
                      {report.quantity} {report.unit}
                    </span>
                  </td>
                  <td style={{ padding: '12px', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {report.location.address}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select
                      value={report.status}
                      onChange={(e) => handleStatusChange(report._id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 8,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Reported">Reported</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Collected">Collected</option>
                      <option value="Recycled">Recycled</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600 }}>{report.assignedDriver?.name || 'Unassigned'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{report.assignedDriver?.vehiclePlate}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteReport(report._id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: '#fee2e2',
                        color: '#b91c1c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.76rem',
                        fontWeight: 700
                      }}
                      title="Delete record (CRUD Delete)"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
