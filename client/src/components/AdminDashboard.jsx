import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, PackageCheck, HardHat, Truck, MapPinned, Calendar, Route,
  Recycle, ShieldAlert, MessageSquareWarning, Megaphone, BarChart3, Flame,
  Trophy, Gauge, Users, ShieldCheck, Settings, PanelLeftClose, PanelLeftOpen,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { useToast, ToastContainer } from './admin/AdminSharedUI';
import OverviewModule from './admin/OverviewModule';
import PickupManagementModule from './admin/PickupManagementModule';
import FleetAndWorkersModule from './admin/FleetAndWorkersModule';
import WardManagementModule from './admin/WardManagementModule';
import ScheduleAndRoutesModule from './admin/ScheduleAndRoutesModule';
import FacilitiesModule from './admin/FacilitiesModule';
import CommunityModule from './admin/CommunityModule';
import AnalyticsReportsModule from './admin/AnalyticsReportsModule';
import SystemAdminModule from './admin/SystemAdminModule';

const SIDEBAR_GROUPS = [
  {
    group: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    group: 'OPERATIONS',
    items: [
      { id: 'pickups', label: 'Pickup Requests', icon: PackageCheck },
      { id: 'workers', label: 'Collection Workers', icon: HardHat },
      { id: 'vehicles', label: 'Fleet & Vehicles', icon: Truck },
      { id: 'wards', label: 'Ward Management', icon: MapPinned },
      { id: 'schedules', label: 'Collection Schedules', icon: Calendar },
      { id: 'routes', label: 'Route Optimisation', icon: Route }
    ]
  },
  {
    group: 'FACILITIES',
    items: [
      { id: 'recycling-centres', label: 'Recycling Centres', icon: Recycle },
      { id: 'disposal-facilities', label: 'Disposal Facilities', icon: ShieldAlert }
    ]
  },
  {
    group: 'COMMUNITY',
    items: [
      { id: 'complaints', label: 'Complaints & Issues', icon: MessageSquareWarning },
      { id: 'campaigns', label: 'Campaigns & Notices', icon: Megaphone }
    ]
  },
  {
    group: 'INSIGHTS',
    items: [
      { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
      { id: 'cleanliness-map', label: 'Ward Cleanliness Map', icon: Flame },
      { id: 'ward-performance', label: 'Ward Scorecards', icon: Trophy },
      { id: 'capacity', label: 'Vehicle Capacity Monitor', icon: Gauge }
    ]
  },
  {
    group: 'SYSTEM',
    items: [
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck },
      { id: 'settings', label: 'System Settings', icon: Settings }
    ]
  }
];

export default function AdminDashboard({ onRefreshNeeded }) {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [overviewAnalytics, setOverviewAnalytics] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const { toasts, showToast, toast, removeToast } = useToast();

  const fetchOverviewData = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const data = await api.getAnalyticsOverview();
      setOverviewAnalytics(data);
    } catch (err) {
      showToast(err.message || 'Failed to load operations overview', 'error');
    } finally {
      setOverviewLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const handleGlobalRefresh = useCallback(() => {
    fetchOverviewData();
    if (onRefreshNeeded) onRefreshNeeded();
  }, [fetchOverviewData, onRefreshNeeded]);

  const handleNavigate = (moduleId) => {
    setActiveModule(moduleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <OverviewModule
            analytics={overviewAnalytics}
            loading={overviewLoading}
            onRefresh={fetchOverviewData}
            onNavigate={handleNavigate}
          />
        );
      case 'pickups':
        return (
          <PickupManagementModule
            showToast={showToast}
            toast={toast}
            onGlobalRefresh={handleGlobalRefresh}
          />
        );
      case 'workers':
        return (
          <FleetAndWorkersModule
            initialSubTab="workers"
            showToast={showToast}
            toast={toast}
            onGlobalRefresh={handleGlobalRefresh}
          />
        );
      case 'vehicles':
        return (
          <FleetAndWorkersModule
            initialSubTab="vehicles"
            showToast={showToast}
            toast={toast}
            onGlobalRefresh={handleGlobalRefresh}
          />
        );
      case 'capacity':
        return (
          <FleetAndWorkersModule
            initialSubTab="capacity"
            showToast={showToast}
            toast={toast}
            onGlobalRefresh={handleGlobalRefresh}
          />
        );
      case 'wards':
        return (
          <WardManagementModule
            initialView="wards"
            showToast={showToast}
            toast={toast}
          />
        );
      case 'cleanliness-map':
        return (
          <WardManagementModule
            initialView="cleanliness-map"
            showToast={showToast}
            toast={toast}
          />
        );
      case 'ward-performance':
        return (
          <WardManagementModule
            initialView="ward-performance"
            showToast={showToast}
            toast={toast}
          />
        );
      case 'schedules':
        return (
          <ScheduleAndRoutesModule
            initialMode="schedules"
            showToast={showToast}
            toast={toast}
            onGlobalRefresh={handleGlobalRefresh}
          />
        );
      case 'routes':
        return (
          <ScheduleAndRoutesModule
            initialMode="routes"
            showToast={showToast}
            toast={toast}
            onGlobalRefresh={handleGlobalRefresh}
          />
        );
      case 'recycling-centres':
        return <FacilitiesModule initialTab="recycling-centres" toast={toast} showToast={showToast} />;
      case 'disposal-facilities':
        return <FacilitiesModule initialTab="disposal-facilities" toast={toast} showToast={showToast} />;
      case 'complaints':
        return <CommunityModule initialTab="complaints" toast={toast} showToast={showToast} />;
      case 'campaigns':
        return <CommunityModule initialTab="campaigns" toast={toast} showToast={showToast} />;
      case 'analytics':
        return <AnalyticsReportsModule toast={toast} showToast={showToast} />;
      case 'users':
        return <SystemAdminModule initialTab="users" toast={toast} showToast={showToast} />;
      case 'audit-logs':
        return <SystemAdminModule initialTab="audit-logs" toast={toast} showToast={showToast} />;
      case 'settings':
        return <SystemAdminModule initialTab="settings" toast={toast} showToast={showToast} />;
      default:
        return (
          <OverviewModule
            analytics={overviewAnalytics}
            loading={overviewLoading}
            onRefresh={fetchOverviewData}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6 items-start">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Left Command Centre Sidebar */}
      <aside
        className={`bg-white border border-slate-200/90 rounded-2xl shadow-xs transition-all duration-200 shrink-0 w-full ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-68'
        } lg:sticky lg:top-20 overflow-hidden print:hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-950 text-white">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center shrink-0">
                <Building2 size={17} className="text-emerald-200" />
              </div>
              <div className="truncate">
                <div className="text-xs font-extrabold tracking-tight">CCMC COMMAND</div>
                <div className="text-[10px] text-emerald-300 font-medium truncate">
                  Coimbatore Operations
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 transition-colors mx-auto lg:mx-0"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        {/* Mobile Horizontal Pill Selector */}
        <div className="flex lg:hidden overflow-x-auto gap-1.5 p-3 border-b border-slate-100 bg-slate-50/60">
          {SIDEBAR_GROUPS.flatMap((g) => g.items).map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  active
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200/80'
                }`}
              >
                <Icon size={13} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Desktop Grouped Navigation */}
        <div className="hidden lg:block p-3 space-y-4 max-h-[calc(100vh-175px)] overflow-y-auto">
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.group} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.2 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-950'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon size={16} className={active ? 'text-emerald-200 shrink-0' : 'text-slate-500 shrink-0'} />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Module Workspace */}
      <div className="flex-1 min-w-0 w-full">
        {renderActiveModule()}
      </div>
    </div>
  );
}
