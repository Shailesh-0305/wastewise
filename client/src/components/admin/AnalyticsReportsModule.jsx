import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Download, Printer, RefreshCw, Filter, Info
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { api } from '../../services/api';
import {
  AdminPageHeader, StatusBadge, LoadingState, EmptyState, formatISTDate,
  COIMBATORE_WARDS, WASTE_CATEGORIES
} from './AdminSharedUI';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AnalyticsReportsModule({ toast }) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    month: '',
    year: '',
    ward: '',
    category: '',
    status: ''
  });

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const cleanParams = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) cleanParams[k] = v;
      });
      const [analyticsRes, reportsRes] = await Promise.all([
        api.getAnalyticsOverview(cleanParams),
        api.getAllReports({ ...cleanParams, limit: 250 })
      ]);
      setAnalytics(analyticsRes);
      const list = Array.isArray(reportsRes) ? reportsRes : reportsRes?.reports || [];
      setReports(list);
    } catch (err) {
      toast?.error(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportCSV = () => {
    if (!reports.length) {
      toast?.info('No filtered records to export');
      return;
    }
    const headers = [
      'Tracking ID', 'Citizen Name', 'Category', 'Quantity', 'Unit', 'Estimated Weight (kg)',
      'Status', 'Priority', 'Ward', 'Locality', 'Assigned Driver', 'Assigned Vehicle',
      'Eco Points', 'Created At (IST)', 'Completed At (IST)'
    ];
    const rows = reports.map((r) => [
      r.trackingId || r._id,
      `"${(r.citizen?.name || 'Citizen').replace(/"/g, '""')}"`,
      r.category || r.wasteCategory,
      r.quantity,
      r.unit || 'bags',
      r.estimatedWeightKg ?? r.quantity,
      r.status,
      r.priority || 'Normal',
      `"${(r.ward || r.location?.ward || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(r.locality || r.location?.locality || '').replace(/"/g, '""')}"`,
      `"${(r.assignedDriver?.name || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(r.assignedDriver?.vehiclePlate || '').replace(/"/g, '""')}"`,
      r.aiClassification?.ecoPointsEarned || 0,
      formatISTDate(r.createdAt, true),
      r.completedAt ? formatISTDate(r.completedAt, true) : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wastewise-coimbatore-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.success('CSV report downloaded');
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      month: '',
      year: '',
      ward: '',
      category: '',
      status: ''
    });
  };

  // Prepare 8 Chart Datasets from real backend response
  const monthlyTrends = analytics?.monthlyTrends || [];
  const monthlyChartData = {
    labels: monthlyTrends.length ? monthlyTrends.map((m) => m.month || m.label) : ['No Data'],
    datasets: [
      {
        label: 'Reported (kg est.)',
        data: monthlyTrends.length ? monthlyTrends.map((m) => m.reportedKg ?? m.totalKg ?? 0) : [0],
        backgroundColor: '#86EFAC',
        borderRadius: 6
      },
      {
        label: 'Collected (kg est.)',
        data: monthlyTrends.length ? monthlyTrends.map((m) => m.collectedKg ?? 0) : [0],
        backgroundColor: '#166534',
        borderRadius: 6
      }
    ]
  };

  const catList = Array.isArray(analytics?.categoryDistribution) ? analytics.categoryDistribution : [];
  const categoryChartData = {
    labels: catList.length ? catList.map((c) => c.category) : ['No Records'],
    datasets: [
      {
        data: catList.length ? catList.map((c) => c.weightKg || c.count || 0) : [1],
        backgroundColor: ['#166534', '#15803D', '#22C55E', '#86EFAC', '#0D9488', '#D97706', '#E11D48', '#6366F1'],
        borderWidth: 1
      }
    ]
  };

  const wardList = Array.isArray(analytics?.wardWasteVolume) ? analytics.wardWasteVolume.slice(0, 10) : [];
  const wardChartData = {
    labels: wardList.length ? wardList.map((w) => w.ward) : ['No Wards'],
    datasets: [
      {
        label: 'Total Volume (kg est.)',
        data: wardList.length ? wardList.map((w) => w.totalKg ?? 0) : [0],
        backgroundColor: '#15803D',
        borderRadius: 6
      },
      {
        label: 'Collected Volume (kg est.)',
        data: wardList.length ? wardList.map((w) => w.collectedKg ?? 0) : [0],
        backgroundColor: '#86EFAC',
        borderRadius: 6
      }
    ]
  };

  const statusList = Array.isArray(analytics?.statusDistribution) ? analytics.statusDistribution : [];
  const statusChartData = {
    labels: statusList.length ? statusList.map((s) => s.status) : ['No Data'],
    datasets: [
      {
        data: statusList.length ? statusList.map((s) => s.count) : [1],
        backgroundColor: ['#F59E0B', '#3B82F6', '#6366F1', '#0284C7', '#166534', '#15803D', '#EF4444', '#94A3B8'],
        borderWidth: 1
      }
    ]
  };

  const recycledKg = analytics?.totalRecycledWasteKg ?? 0;
  const nonRecycledKg = analytics?.nonRecycledCollectedKg ?? Math.max(0, (analytics?.totalCollectedWasteKg || 0) - recycledKg);
  const recyclingChartData = {
    labels: ['Recyclable / Diverted Stream (kg)', 'Non-Recycled / Residual Stream (kg)'],
    datasets: [
      {
        data: [recycledKg, nonRecycledKg],
        backgroundColor: ['#166534', '#CBD5E1'],
        borderWidth: 1
      }
    ]
  };

  const workerWorkload = Array.isArray(analytics?.workerWorkload) ? analytics.workerWorkload : [];
  const workerChartData = {
    labels: workerWorkload.length ? workerWorkload.map((w) => w.name) : ['No Assigned Pickups'],
    datasets: [
      {
        label: 'Completed Pickups',
        data: workerWorkload.length ? workerWorkload.map((w) => w.completedPickups ?? w.completed ?? 0) : [0],
        backgroundColor: '#166534',
        borderRadius: 6
      },
      {
        label: 'Active / Assigned',
        data: workerWorkload.length ? workerWorkload.map((w) => w.activePickups ?? w.active ?? 0) : [0],
        backgroundColor: '#93C5FD',
        borderRadius: 6
      }
    ]
  };

  const complaintDist = Array.isArray(analytics?.complaintStatusBreakdown) ? analytics.complaintStatusBreakdown : [];
  const complaintChartData = {
    labels: complaintDist.length ? complaintDist.map((c) => c.status) : ['No Complaints'],
    datasets: [
      {
        label: 'Civic Complaints',
        data: complaintDist.length ? complaintDist.map((c) => c.count) : [0],
        backgroundColor: ['#F59E0B', '#3B82F6', '#6366F1', '#166534', '#EF4444'],
        borderRadius: 6
      }
    ]
  };

  const vehicleUtil = Array.isArray(analytics?.vehicleUtilisation) ? analytics.vehicleUtilisation : [];
  const vehicleChartData = {
    labels: vehicleUtil.length ? vehicleUtil.map((v) => v.registrationNumber) : ['No Fleet Data'],
    datasets: [
      {
        label: 'Load Utilisation (%)',
        data: vehicleUtil.length ? vehicleUtil.map((v) => v.utilizationPercent ?? v.utilisationPercent ?? 0) : [0],
        backgroundColor: '#0D9488',
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <AdminPageHeader
        title="Municipal Waste Analytics & Executive Reports"
        subtitle="Real-time operational metrics, diversion rates, ward volumes, and exportable compliance reports derived from MongoDB records."
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={loadAnalytics}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={handlePrintSummary}
              className="px-4 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Printer size={14} /> Print / PDF Summary
            </button>
          </div>
        }
      />

      {/* Multi-Dimensional Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 print:hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Filter size={14} className="text-emerald-700" /> Filter Analytics Dataset
          </span>
          <button onClick={resetFilters} className="text-xs font-semibold text-emerald-700 hover:underline">
            Reset All Filters
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Month</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">All Months</option>
              {[
                [1, 'Jan'], [2, 'Feb'], [3, 'Mar'], [4, 'Apr'], [5, 'May'], [6, 'Jun'],
                [7, 'Jul'], [8, 'Aug'], [9, 'Sep'], [10, 'Oct'], [11, 'Nov'], [12, 'Dec']
              ].map(([num, label]) => (
                <option key={num} value={num}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Year</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ward</label>
            <select
              value={filters.ward}
              onChange={(e) => setFilters({ ...filters, ward: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">All Wards</option>
              {COIMBATORE_WARDS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">All Categories</option>
              {WASTE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">All Statuses</option>
              {['Reported', 'Confirmed', 'Assigned', 'In Progress', 'Collected', 'Recycled', 'Rejected', 'Cancelled'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estimation Disclosure Notice */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-950">
        <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <strong>Data Integrity & Weight Normalisation Note:</strong> Quantities submitted directly in <code className="font-mono bg-white px-1 rounded">kg</code> are exact. Where citizens reported quantities in <code className="font-mono bg-white px-1 rounded">bags</code> or <code className="font-mono bg-white px-1 rounded">items</code> ({analytics?.estimatedRecordCount ?? 0} records), weight totals apply documented conversion factors (`1 bag = 4.0 kg est.`, `1 item = 1.5 kg est.`).
        </div>
      </div>

      {loading ? (
        <LoadingState label="Computing Coimbatore waste analytics..." />
      ) : (
        <>
          {/* 8 Main KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Total Waste Reported</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {analytics?.totalWasteKg ?? 0} <span className="text-xs font-semibold text-slate-500">kg (est.)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Across {analytics?.totalRequests ?? 0} total requests
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Total Waste Collected</span>
              <div className="text-2xl font-extrabold text-emerald-800 mt-1">
                {analytics?.totalCollectedWasteKg ?? 0} <span className="text-xs font-semibold text-slate-500">kg (est.)</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                {analytics?.completedPickups ?? 0} verified collections
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Awaiting Collection</span>
              <div className="text-2xl font-extrabold text-amber-700 mt-1">
                {analytics?.awaitingCollectionWasteKg ?? 0} <span className="text-xs font-semibold text-slate-500">kg (est.)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {analytics?.activePickups ?? 0} active pickups
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Recycled / Diverted</span>
              <div className="text-2xl font-extrabold text-teal-800 mt-1">
                {analytics?.totalRecycledWasteKg ?? 0} <span className="text-xs font-semibold text-slate-500">kg (est.)</span>
              </div>
              <div className="text-[11px] text-teal-700 font-medium mt-1">
                Recycling Rate: {analytics?.recyclingRate ?? 0}%
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Completion Rate</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {analytics?.pickupCompletionRate ?? 0}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Collected vs Total Requests
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Missed / Overdue Rate</span>
              <div className="text-2xl font-extrabold text-rose-700 mt-1">
                {analytics?.missedPickupRate ?? 0}%
              </div>
              <div className="text-[11px] text-rose-600 mt-1">
                {analytics?.overdueRequests ?? 0} overdue requests
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Avg Turnaround Time</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {analytics?.avgCompletionTimeHours != null ? `${analytics.avgCompletionTimeHours} hrs` : 'N/A'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Request submission to collection
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Civic Complaints</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {analytics?.resolvedComplaints ?? 0} / {analytics?.totalComplaints ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Resolved ({analytics?.unresolvedComplaints ?? 0} open)
              </div>
            </div>
          </div>

          {/* 8 Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">1. Monthly Collection Trends (Coimbatore)</h3>
              <p className="text-[11px] text-slate-500 mb-4">Estimated weight reported vs verified collected by month</p>
              <div className="h-64">
                <Bar data={monthlyChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">2. Waste Category Distribution</h3>
              <p className="text-[11px] text-slate-500 mb-4">Proportional volume by waste stream (Estimated kg)</p>
              <div className="h-64 flex items-center justify-center">
                <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">3. Ward-Wise Waste Volume</h3>
              <p className="text-[11px] text-slate-500 mb-4">Top Coimbatore wards by reported and collected volume</p>
              <div className="h-64">
                <Bar data={wardChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">4. Pickup Status Distribution</h3>
              <p className="text-[11px] text-slate-500 mb-4">Current lifecycle breakdown of pickup requests</p>
              <div className="h-64 flex items-center justify-center">
                <Doughnut data={statusChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">5. Recycling & Recovery vs Residual Stream</h3>
              <p className="text-[11px] text-slate-500 mb-4">Collected recyclable/organic stream vs residual waste</p>
              <div className="h-64 flex items-center justify-center">
                <Doughnut data={recyclingChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">6. Collection Worker Workload Distribution</h3>
              <p className="text-[11px] text-slate-500 mb-4">Completed vs active assigned pickups per field worker</p>
              <div className="h-64">
                <Bar data={workerChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">7. Civic Complaint Resolution Breakdown</h3>
              <p className="text-[11px] text-slate-500 mb-4">Public sanitation complaints by lifecycle resolution stage</p>
              <div className="h-64">
                <Bar data={complaintChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">8. Fleet Capacity Utilisation (%)</h3>
              <p className="text-[11px] text-slate-500 mb-4">Current load percentage across registered collection vehicles</p>
              <div className="h-64">
                <Bar data={vehicleChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          {/* Filtered Records Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Filtered Operational Records ({reports.length})
              </h3>
              <span className="text-xs text-slate-500">All timestamps in Asia/Kolkata (IST)</span>
            </div>
            {reports.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No records match the selected analytics filters"
                subtitle="Adjust the date range, ward, or category filters above."
              />
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Date (IST)</th>
                      <th className="py-3 px-4">Citizen</th>
                      <th className="py-3 px-4">Ward & Locality</th>
                      <th className="py-3 px-4">Category & Quantity</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assigned Worker</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {reports.slice(0, 50).map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 text-slate-600">{formatISTDate(r.createdAt, true)}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{r.citizen?.name || 'Citizen'}</td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {r.ward || r.location?.ward || 'Unassigned'} {r.locality ? `(${r.locality})` : ''}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">
                          {r.category} • {r.quantity} {r.unit || 'bags'} ({r.estimatedWeightKg ?? r.quantity} kg est.)
                        </td>
                        <td className="py-2.5 px-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {r.assignedDriver?.name || 'Unassigned'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
