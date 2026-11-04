import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, PackageCheck, HardHat, Truck, MapPinned, Calendar, Route,
  Recycle, ShieldAlert, MessageSquareWarning, Megaphone, BarChart3, Flame,
  Trophy, Gauge, Users, ShieldCheck, Settings, PanelLeftClose, PanelLeftOpen,
  Building2, Grid, Server, ChevronRight
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

export const SIDEBAR_GROUPS = [
  {
    group: '1. COMMAND OVERVIEW',
    shortGroup: 'Overview',
    description: 'Real-time municipal KPIs, alerts & dispatch queue',
    items: [
      {
        id: 'dashboard',
        label: 'Operations Dashboard',
        desc: 'Live city-wide metrics, overdue alerts & quick dispatch',
        endpoint: 'GET /api/analytics/overview',
        icon: LayoutDashboard
      }
    ]
  },
  {
    group: '2. MUNICIPAL OPERATIONS',
    shortGroup: 'Operations & Fleet',
    description: 'Pickups, field workers, TN-38 fleet, wards, schedules & TSP routes',
    items: [
      {
        id: 'pickups',
        label: 'Pickup Requests',
        desc: 'Confirm, assign driver/vehicle, verify & award eco-points',
        endpoint: 'CRUD /api/reports',
        icon: PackageCheck
      },
      {
        id: 'workers',
        label: 'Collection Workers',
        desc: 'Manage driver staff, shifts, zones & active workloads',
        endpoint: 'CRUD /api/workers',
        icon: HardHat
      },
      {
        id: 'vehicles',
        label: 'Fleet & Vehicles',
        desc: 'Register TN-38 trucks, tippers, e-carts & maintenance logs',
        endpoint: 'CRUD /api/vehicles',
        icon: Truck
      },
      {
        id: 'wards',
        label: 'Ward Management',
        desc: 'Coimbatore wards, zones, localities & assigned resources',
        endpoint: 'CRUD /api/wards',
        icon: MapPinned
      },
      {
        id: 'schedules',
        label: 'Collection Schedules',
        desc: 'Curbside collection timetables & conflict detection',
        endpoint: 'CRUD /api/schedules',
        icon: Calendar
      },
      {
        id: 'routes',
        label: 'Route Optimisation',
        desc: 'TSP Nearest-Neighbour + 2-Opt route solver & dispatch',
        endpoint: 'POST /api/routes/dispatch',
        icon: Route
      }
    ]
  },
  {
    group: '3. INFRASTRUCTURE & FACILITIES',
    shortGroup: 'Facilities',
    description: 'Verified municipal recycling centres & hazardous disposal units',
    items: [
      {
        id: 'recycling-centres',
        label: 'Recycling Centres',
        desc: 'Dry waste collection centres (DWCC) & material recovery (MRF)',
        endpoint: 'CRUD /api/centers',
        icon: Recycle
      },
      {
        id: 'disposal-facilities',
        label: 'Disposal Facilities',
        desc: 'E-waste, battery, medical & hazardous treatment plants',
        endpoint: 'CRUD /api/centers',
        icon: ShieldAlert
      }
    ]
  },
  {
    group: '4. COMMUNITY & CIVIC',
    shortGroup: 'Community & Civic',
    description: 'Public sanitation grievance redressal & municipal drives',
    items: [
      {
        id: 'complaints',
        label: 'Complaints & Issues',
        desc: 'Resolve overflowing bins, illegal dumping & missed pickups',
        endpoint: 'CRUD /api/complaints',
        icon: MessageSquareWarning
      },
      {
        id: 'campaigns',
        label: 'Campaigns & Notices',
        desc: 'Publish ward clean-up drives, workshops & civic notices',
        endpoint: 'CRUD /api/campaigns',
        icon: Megaphone
      }
    ]
  },
  {
    group: '5. ANALYTICS & INSIGHTS',
    shortGroup: 'Analytics & Maps',
    description: 'Charts, geospatial heatmaps, ward scorecards & load telemetry',
    items: [
      {
        id: 'analytics',
        label: 'Analytics & Reports',
        desc: '8 operational charts, weight normalisation & CSV export',
        endpoint: 'GET /api/analytics/overview',
        icon: BarChart3
      },
      {
        id: 'cleanliness-map',
        label: 'Ward Cleanliness Map',
        desc: 'Geospatial hotspot map of pending pickups & complaints',
        endpoint: 'GET /api/analytics/cleanliness-heatmap',
        icon: Flame
      },
      {
        id: 'ward-performance',
        label: 'Ward Scorecards',
        desc: 'Weighted cleanliness & SLA rankings across Coimbatore wards',
        endpoint: 'GET /api/analytics/ward-scorecards',
        icon: Trophy
      },
      {
        id: 'capacity',
        label: 'Vehicle Capacity Monitor',
        desc: 'Live load bars, overload protection & fleet utilisation',
        endpoint: 'GET /api/vehicles',
        icon: Gauge
      }
    ]
  },
  {
    group: '6. SYSTEM & GOVERNANCE',
    shortGroup: 'System & Governance',
    description: 'Role-based user directory, immutable audit trail & global config',
    items: [
      {
        id: 'users',
        label: 'User Management',
        desc: 'Manage Citizen, Driver & Admin accounts and permissions',
        endpoint: 'PATCH /api/admin/users',
        icon: Users
      },
      {
        id: 'audit-logs',
        label: 'Audit Logs',
        desc: 'Immutable ledger of administrative actions & state changes',
        endpoint: 'GET /api/admin/audit-logs',
        icon: ShieldCheck
      },
      {
        id: 'settings',
        label: 'System Settings',
        desc: 'Configure depot coordinates, tortuosity, SLA & capacity rules',
        endpoint: 'PUT /api/admin/settings',
        icon: Settings
      }
    ]
  }
];

const ALL_MODULES = SIDEBAR_GROUPS.flatMap(g =>
  g.items.map(item => ({ ...item, groupTitle: g.group, shortGroup: g.shortGroup }))
);

export default function AdminDashboard({
  activeModule: propActiveModule,
  setActiveModule: propSetActiveModule,
  onRefreshNeeded
}) {
  const [internalModule, setInternalModule] = useState('dashboard');
  const activeModule = propActiveModule || internalModule;
  const setActiveModule = propSetActiveModule || setInternalModule;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showModuleDirectory, setShowModuleDirectory] = useState(false);
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
    setShowModuleDirectory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find current active group and item metadata
  const currentGroup = SIDEBAR_GROUPS.find(g => g.items.some(i => i.id === activeModule)) || SIDEBAR_GROUPS[0];
  const currentItem = ALL_MODULES.find(i => i.id === activeModule) || ALL_MODULES[0];

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
    <div className="admin-command-layout">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Left Command Centre Sidebar */}
      <aside
        className="admin-command-sidebar print-hidden"
        style={{
          width: sidebarCollapsed ? 74 : 276,
          minWidth: sidebarCollapsed ? 74 : 276,
          background: '#ffffff',
          border: '1.5px solid var(--border-light)',
          borderRadius: 22,
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          position: 'sticky',
          top: 82,
          transition: 'all 0.2s ease',
          flexShrink: 0
        }}
      >
        {/* Sidebar Header */}
        <div style={{
          padding: sidebarCollapsed ? '14px 10px' : '16px 18px',
          background: '#052e16',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #14532d'
        }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: '#166534',
                border: '1px solid #22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Building2 size={17} color="#86efac" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.4px', color: '#ffffff' }}>
                  ADMIN BACKEND
                </div>
                <div style={{ fontSize: '0.68rem', color: '#86efac', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  18 Municipal Modules
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            style={{
              padding: 6,
              borderRadius: 8,
              color: '#86efac',
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Grouped Backend Modules Navigation */}
        <div style={{
          padding: sidebarCollapsed ? '10px 8px' : '12px',
          maxHeight: 'calc(100vh - 165px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.group} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {!sidebarCollapsed && (
                <div style={{
                  padding: '4px 10px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: 'var(--secondary-text)'
                }}>
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
                    title={sidebarCollapsed ? `${item.label} (${item.endpoint})` : item.desc}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      gap: 10,
                      padding: sidebarCollapsed ? '10px 0' : '9px 12px',
                      borderRadius: 12,
                      fontSize: '0.8rem',
                      fontWeight: active ? 800 : 600,
                      color: active ? '#ffffff' : 'var(--primary-text)',
                      background: active ? 'var(--primary-forest)' : 'transparent',
                      boxShadow: active ? '0 4px 12px rgba(22, 101, 52, 0.22)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={16} color={active ? '#86efac' : 'var(--secondary-green)'} style={{ flexShrink: 0 }} />
                    {!sidebarCollapsed && (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Module Workspace */}
      <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Organized Backend Domain Sub-Navigation & All-Modules Directory Bar */}
        <div
          className="print-hidden"
          style={{
            background: '#ffffff',
            border: '1.5px solid var(--border-light)',
            borderRadius: 18,
            padding: '12px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            {/* Active Domain & Sibling Module Switcher Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#052e16',
                background: 'var(--pale-green-section)',
                border: '1px solid var(--soft-leaf-green)',
                padding: '4px 10px',
                borderRadius: 999
              }}>
                {currentGroup.shortGroup}
              </span>
              <ChevronRight size={14} color="var(--secondary-text)" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {currentGroup.items.map(subItem => {
                  const SubIcon = subItem.icon;
                  const isSubActive = subItem.id === activeModule;
                  return (
                    <button
                      key={subItem.id}
                      onClick={() => handleNavigate(subItem.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 13px',
                        borderRadius: 999,
                        fontSize: '0.78rem',
                        fontWeight: isSubActive ? 800 : 600,
                        background: isSubActive ? 'var(--primary-forest)' : 'var(--very-light-mint)',
                        color: isSubActive ? '#ffffff' : 'var(--primary-text)',
                        border: isSubActive ? '1px solid var(--primary-forest)' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <SubIcon size={13} color={isSubActive ? '#86efac' : 'var(--secondary-green)'} />
                      <span>{subItem.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Backend API Endpoint Pill + All 18 Modules Directory Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 11px',
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#0f172a'
              }}>
                <Server size={12} color="var(--primary-forest)" />
                <span>API: {currentItem.endpoint}</span>
              </div>

              <button
                onClick={() => setShowModuleDirectory(!showModuleDirectory)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: showModuleDirectory ? '#052e16' : '#ffffff',
                  color: showModuleDirectory ? '#86efac' : 'var(--primary-forest)',
                  border: '1.5px solid var(--primary-forest)',
                  cursor: 'pointer'
                }}
              >
                <Grid size={14} />
                <span>{showModuleDirectory ? 'Hide Backend Directory' : 'All 18 Backend Options'}</span>
              </button>
            </div>
          </div>

          {/* Collapsible 18-Module Backend Command Directory */}
          {showModuleDirectory && (
            <div style={{
              marginTop: 6,
              paddingTop: 14,
              borderTop: '1px solid var(--border-light)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 14
            }}>
              {SIDEBAR_GROUPS.map(group => (
                <div
                  key={group.group}
                  style={{
                    background: 'var(--very-light-mint)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary-forest)', textTransform: 'uppercase' }}>
                      {group.group}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--secondary-text)' }}>
                      {group.description}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {group.items.map(mod => {
                      const ModIcon = mod.icon;
                      const isModActive = mod.id === activeModule;
                      return (
                        <button
                          key={mod.id}
                          onClick={() => handleNavigate(mod.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            padding: '8px 10px',
                            borderRadius: 10,
                            background: isModActive ? 'var(--primary-forest)' : '#ffffff',
                            color: isModActive ? '#ffffff' : 'var(--primary-text)',
                            border: '1px solid var(--border-light)',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <ModIcon size={15} color={isModActive ? '#86efac' : 'var(--secondary-green)'} style={{ marginTop: 2, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>{mod.label}</div>
                            <div style={{ fontSize: '0.68rem', color: isModActive ? '#d1fae5' : 'var(--secondary-text)', lineHeight: 1.3 }}>
                              {mod.desc}
                            </div>
                            <div style={{ fontSize: '0.64rem', fontFamily: 'monospace', marginTop: 3, color: isModActive ? '#86efac' : '#0369a1', fontWeight: 700 }}>
                              {mod.endpoint}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Admin Module View */}
        <div>
          {renderActiveModule()}
        </div>
      </div>
    </div>
  );
}
