import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, ShieldCheck, Settings, Search, RefreshCw, Eye, Power, Lock,
  Sliders, Award, X, Save
} from 'lucide-react';
import { api } from '../../services/api';
import {
  AdminPageHeader, StatusBadge, LoadingState, EmptyState, PaginationBar, formatISTDate
} from './AdminSharedUI';

const AUDIT_ENTITY_TYPES = [
  'All', 'PickupRequest', 'Worker', 'Vehicle', 'Ward', 'Schedule',
  'Route', 'RecyclingCentre', 'DisposalFacility', 'Complaint', 'Campaign', 'User', 'SystemSettings'
];

export default function SystemAdminModule({ initialTab = 'users', toast }) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalCount, setAuditTotalCount] = useState(0);
  const [auditFilters, setAuditFilters] = useState({
    admin: '',
    action: '',
    entityType: 'All',
    dateFrom: '',
    dateTo: ''
  });

  // Settings state
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (userSearch.trim()) params.search = userSearch.trim();
      if (roleFilter !== 'All') params.role = roleFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      const list = await api.getUsersAdmin(params);
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      toast?.error(err.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }, [userSearch, roleFilter, statusFilter, toast]);

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: auditPage, limit: 30 };
      if (auditFilters.admin.trim()) params.admin = auditFilters.admin.trim();
      if (auditFilters.action.trim()) params.action = auditFilters.action.trim();
      if (auditFilters.entityType !== 'All') params.entityType = auditFilters.entityType;
      if (auditFilters.dateFrom) params.dateFrom = auditFilters.dateFrom;
      if (auditFilters.dateTo) params.dateTo = auditFilters.dateTo;

      const res = await api.getAuditLogs(params);
      setAuditLogs(Array.isArray(res?.logs) ? res.logs : []);
      setAuditTotalPages(res?.totalPages || 1);
      setAuditTotalCount(res?.totalCount || 0);
    } catch (err) {
      toast?.error(err.message || 'Failed to load administrative audit logs');
    } finally {
      setLoading(false);
    }
  }, [auditPage, auditFilters, toast]);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const s = await api.getSystemSettings();
      setSettings(s);
    } catch (err) {
      toast?.error(err.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeSubTab === 'users') loadUsers();
    else if (activeSubTab === 'audit-logs') loadAuditLogs();
    else if (activeSubTab === 'settings') loadSettings();
  }, [activeSubTab, loadUsers, loadAuditLogs, loadSettings]);

  const handleInspectUser = async (user) => {
    setUserDetailLoading(true);
    try {
      const res = await api.getUserDetailsAdmin(user._id);
      setSelectedUserDetail(res);
    } catch (err) {
      toast?.error(err.message || 'Failed to load user details');
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const nextStatus = user.isActive === false;
      await api.updateUserAdmin(user._id, { isActive: nextStatus });
      toast?.success(`User account ${nextStatus ? 'reactivated' : 'deactivated'} and logged`);
      loadUsers();
      if (selectedUserDetail?.user?._id === user._id) {
        handleInspectUser(user);
      }
    } catch (err) {
      toast?.error(err.message || 'Failed to update user status');
    }
  };

  const handleChangeUserRole = async (user, newRole) => {
    try {
      await api.updateUserAdmin(user._id, { role: newRole });
      toast?.success(`User role updated to ${newRole}`);
      loadUsers();
    } catch (err) {
      toast?.error(err.message || 'Failed to update user role');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      const updated = await api.updateSystemSettings(settings);
      setSettings(updated);
      toast?.success('Municipal system settings saved and audit-logged');
    } catch (err) {
      toast?.error(err.message || 'Failed to save system settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={
          activeSubTab === 'audit-logs'
            ? 'Immutable Administrative Audit Logs'
            : activeSubTab === 'settings'
            ? 'Coimbatore Municipal System Configuration'
            : 'User & Role Directory Management'
        }
        subtitle={
          activeSubTab === 'audit-logs'
            ? 'Append-only compliance ledger recording every administrative action, status transition, dispatch, and configuration change.'
            : activeSubTab === 'settings'
            ? 'Configure Coimbatore regional parameters, route optimisation factors, heatmap thresholds, and ward scorecard weights.'
            : 'Manage citizen, field driver, and municipal administrator accounts, roles, and pickup histories.'
        }
        actions={
          <button
            onClick={() => {
              if (activeSubTab === 'users') loadUsers();
              else if (activeSubTab === 'audit-logs') loadAuditLogs();
              else loadSettings();
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'users' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={15} /> User Management
        </button>
        <button
          onClick={() => setActiveSubTab('audit-logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'audit-logs' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck size={15} /> Audit Logs (Append-Only)
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'settings' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings size={15} /> System Settings
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: USER MANAGEMENT                                   */}
      {/* ======================================================== */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name, email, phone, or locality..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50/60"
            >
              <option value="All">All Roles</option>
              <option value="citizen">Citizen</option>
              <option value="driver">Driver / Worker</option>
              <option value="admin">Administrator</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50/60"
            >
              <option value="All">All Account Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Deactivated">Deactivated Only</option>
            </select>
          </div>

          {loading ? (
            <LoadingState label="Loading registered accounts..." />
          ) : users.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80">
              <EmptyState
                icon={Users}
                title="No matching user accounts"
                description="Try clearing search filters."
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">User Profile</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Locality / Ward</th>
                      <th className="py-3.5 px-4">Eco-Points</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4">Joined (IST)</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {users.map((u) => (
                      <tr key={u._id} className={`hover:bg-slate-50/70 transition-colors ${u.isActive === false ? 'opacity-60 bg-slate-50/40' : ''}`}>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                          {u.phone && <div className="text-[11px] text-slate-400">{u.phone}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeUserRole(u, e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-800"
                          >
                            <option value="citizen">Citizen</option>
                            <option value="driver">Driver / Worker</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{u.address?.locality || u.assignedWard || 'Coimbatore'}</div>
                          {u.address?.pincode && <div className="text-[11px] text-slate-400">PIN: {u.address.pincode}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                            <Award size={13} /> {u.ecoPoints || 0} pts
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={u.isActive === false ? 'Deactivated' : 'Active'} />
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {formatISTDate(u.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleInspectUser(u)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs inline-flex items-center gap-1"
                            >
                              <Eye size={13} /> History
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`p-1.5 rounded-lg border ${
                                u.isActive === false
                                  ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                  : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                              }`}
                              title={u.isActive === false ? 'Reactivate Account' : 'Deactivate Account'}
                            >
                              <Power size={14} />
                            </button>
                          </div>
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

      {/* ======================================================== */}
      {/* TAB 2: ADMINISTRATIVE AUDIT LOGS (APPEND-ONLY)           */}
      {/* ======================================================== */}
      {activeSubTab === 'audit-logs' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <Lock size={15} className="text-emerald-800 shrink-0" />
              <span>
                <strong>Append-Only Security Guarantee:</strong> Administrative audit records cannot be edited or deleted via the UI or REST API (`PUT`/`DELETE` requests return HTTP 403).
              </span>
            </div>
            <span className="font-bold text-emerald-800 shrink-0">{auditTotalCount} Total Entries</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <input
              type="text"
              value={auditFilters.admin}
              onChange={(e) => { setAuditFilters({ ...auditFilters, admin: e.target.value }); setAuditPage(1); }}
              placeholder="Filter by Admin Name/Email..."
              className="px-3 py-2 rounded-xl border border-slate-200"
            />
            <input
              type="text"
              value={auditFilters.action}
              onChange={(e) => { setAuditFilters({ ...auditFilters, action: e.target.value }); setAuditPage(1); }}
              placeholder="Filter by Action (e.g. PICKUP_STATUS)..."
              className="px-3 py-2 rounded-xl border border-slate-200"
            />
            <select
              value={auditFilters.entityType}
              onChange={(e) => { setAuditFilters({ ...auditFilters, entityType: e.target.value }); setAuditPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              {AUDIT_ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{t === 'All' ? 'All Entity Types' : t}</option>
              ))}
            </select>
            <input
              type="date"
              value={auditFilters.dateFrom}
              onChange={(e) => { setAuditFilters({ ...auditFilters, dateFrom: e.target.value }); setAuditPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200"
            />
            <input
              type="date"
              value={auditFilters.dateTo}
              onChange={(e) => { setAuditFilters({ ...auditFilters, dateTo: e.target.value }); setAuditPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          {loading ? (
            <LoadingState label="Loading immutable audit trail..." />
          ) : auditLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80">
              <EmptyState
                icon={ShieldCheck}
                title="No audit log entries match your filter"
                description="Administrative actions will automatically appear here as operations are performed."
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4">Timestamp (IST)</th>
                      <th className="py-3.5 px-4">Administrator</th>
                      <th className="py-3.5 px-4">Action Code</th>
                      <th className="py-3.5 px-4">Target Entity</th>
                      <th className="py-3.5 px-4">Summary & State Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {formatISTDate(log.timestamp || log.createdAt, true)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{log.adminName || 'Municipal Admin'}</div>
                          <div className="text-[11px] text-slate-400">{log.adminEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px] font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-emerald-800">{log.entityType}</div>
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">{log.entityId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{log.summary}</div>
                          {(log.previousValue || log.updatedValue) && (
                            <div className="text-[10px] font-mono text-slate-500 mt-1 bg-slate-50 p-1.5 rounded border border-slate-100 max-w-md truncate">
                              {log.previousValue ? `Prev: ${JSON.stringify(log.previousValue)} → ` : ''}
                              {log.updatedValue ? `New: ${JSON.stringify(log.updatedValue)}` : ''}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 pb-3">
                <PaginationBar
                  page={auditPage}
                  totalPages={auditTotalPages}
                  totalCount={auditTotalCount}
                  onPageChange={setAuditPage}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SYSTEM SETTINGS                                   */}
      {/* ======================================================== */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          {loading || !settings ? (
            <LoadingState label="Loading Coimbatore municipal system configuration..." />
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
              {/* Regional & Localization Settings */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sliders size={16} className="text-emerald-700" />
                  1. Coimbatore Regional & Localization Defaults
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Municipality / City</label>
                    <input
                      type="text"
                      value={settings.city || 'Coimbatore'}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State & Country</label>
                    <input
                      type="text"
                      value={`${settings.state || 'Tamil Nadu'}, ${settings.country || 'India'}`}
                      disabled
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Operational Timezone</label>
                    <input
                      type="text"
                      value={settings.timezone || 'Asia/Kolkata'}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Route Optimisation & Fleet Capacity Settings */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  2. Route Optimisation & Fleet Capacity Thresholds
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Central Fleet Depot Name</label>
                    <input
                      type="text"
                      value={settings.routeOptimizationSettings?.defaultDepotName || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          routeOptimizationSettings: {
                            ...settings.routeOptimizationSettings,
                            defaultDepotName: e.target.value
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Road Tortuosity Multiplier (vs Straight-Line)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.0"
                      max="2.5"
                      value={settings.routeOptimizationSettings?.roadTortuosityFactor ?? 1.32}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          routeOptimizationSettings: {
                            ...settings.routeOptimizationSettings,
                            roadTortuosityFactor: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Capacity Warning Threshold (%)</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={settings.vehicleCapacityDefaults?.warningThresholdPercent ?? 85}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          vehicleCapacityDefaults: {
                            ...settings.vehicleCapacityDefaults,
                            warningThresholdPercent: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Ward Performance Scorecard Weights */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  3. Ward Performance Scorecard Formula Weights (Total = 100%)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pickup Completion (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.wardPerformanceWeights?.pickupCompletionWeight ?? 35}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          wardPerformanceWeights: {
                            ...settings.wardPerformanceWeights,
                            pickupCompletionWeight: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Complaint Resolution (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.wardPerformanceWeights?.complaintResolutionWeight ?? 25}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          wardPerformanceWeights: {
                            ...settings.wardPerformanceWeights,
                            complaintResolutionWeight: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Recycling Diversion (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.wardPerformanceWeights?.recyclingRateWeight ?? 20}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          wardPerformanceWeights: {
                            ...settings.wardPerformanceWeights,
                            recyclingRateWeight: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Timeliness / SLA (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.wardPerformanceWeights?.timelinessWeight ?? 20}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          wardPerformanceWeights: {
                            ...settings.wardPerformanceWeights,
                            timelinessWeight: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Cleanliness Heatmap Thresholds */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  4. Ward Cleanliness Heatmap Alert Thresholds
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Warning Pending Pickups</label>
                    <input
                      type="number"
                      min="1"
                      value={settings.cleanlinessHeatmapThresholds?.warningPendingCount ?? 3}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          cleanlinessHeatmapThresholds: {
                            ...settings.cleanlinessHeatmapThresholds,
                            warningPendingCount: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Critical Pending Pickups</label>
                    <input
                      type="number"
                      min="1"
                      value={settings.cleanlinessHeatmapThresholds?.criticalPendingCount ?? 6}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          cleanlinessHeatmapThresholds: {
                            ...settings.cleanlinessHeatmapThresholds,
                            criticalPendingCount: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Warning Overdue Count</label>
                    <input
                      type="number"
                      min="1"
                      value={settings.cleanlinessHeatmapThresholds?.warningOverdueCount ?? 1}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          cleanlinessHeatmapThresholds: {
                            ...settings.cleanlinessHeatmapThresholds,
                            warningOverdueCount: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Critical Overdue Count</label>
                    <input
                      type="number"
                      min="1"
                      value={settings.cleanlinessHeatmapThresholds?.criticalOverdueCount ?? 3}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          cleanlinessHeatmapThresholds: {
                            ...settings.cleanlinessHeatmapThresholds,
                            criticalOverdueCount: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={15} />
                  {savingSettings ? 'Saving Configuration...' : 'Save Municipal System Configuration'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* User Inspection & Pickup History Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedUserDetail.user?.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedUserDetail.user?.email} • Role: {selectedUserDetail.user?.role} • Eco-Points: {selectedUserDetail.user?.ecoPoints || 0}
                </p>
              </div>
              <button onClick={() => setSelectedUserDetail(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {userDetailLoading ? (
              <LoadingState label="Loading user pickup history..." />
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                <h4 className="font-bold text-slate-800">
                  Pickup Request History ({selectedUserDetail.pickupHistory?.length || 0})
                </h4>
                {!selectedUserDetail.pickupHistory?.length ? (
                  <p className="text-slate-500 py-4 text-center bg-slate-50 rounded-xl">
                    No pickup requests submitted by this account.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedUserDetail.pickupHistory.map((r) => (
                      <div key={r._id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">
                            {r.wasteCategory} ({r.quantity} {r.unit || 'kg'})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {r.address || r.locality || 'Coimbatore'} • {formatISTDate(r.createdAt, true)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.ecoPointsAwarded > 0 && (
                            <span className="text-[11px] font-bold text-emerald-700">+{r.ecoPointsAwarded} pts</span>
                          )}
                          <StatusBadge status={r.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
