import React from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Users,
  UserCheck,
  AlertTriangle,
  MapPin,
  Calendar,
  MessageSquareWarning,
  ArrowUpRight,
  RotateCw,
  Compass,
  Activity
} from 'lucide-react';
import { AdminPageHeader, StatusBadge, LoadingState, EmptyState, formatISTDate } from './AdminSharedUI';

export default function OverviewModule({
  analytics,
  loading,
  onRefresh,
  onNavigate
}) {
  if (loading && !analytics) {
    return <LoadingState label="Loading Coimbatore Municipal Operations Overview..." />;
  }

  const stats = analytics || {};
  const alerts = stats.alerts || [];
  const attentionList = stats.requestsRequiringAttention || [];
  const wardOverview = stats.wardWasteVolume || [];
  const workerList = stats.workerWorkload || [];
  const vehicleList = stats.vehicleUtilisation || [];
  const upcomingSchedules = stats.upcomingSchedules || [];
  const recentComplaints = stats.recentComplaints || [];
  const recentActivity = stats.recentActivity || [];

  const metricCards = [
    {
      label: 'Total Pickup Requests',
      value: stats.totalRequests ?? 0,
      sub: `${stats.totalWasteKg ?? 0} kg est. volume`,
      icon: Package,
      color: '#166534',
      target: 'pickups'
    },
    {
      label: 'Pending (Reported)',
      value: stats.reportedRequests ?? 0,
      sub: 'Awaiting confirmation',
      icon: Clock,
      color: '#b45309',
      target: 'pickups'
    },
    {
      label: 'Confirmed Requests',
      value: stats.confirmedRequests ?? 0,
      sub: 'Ready for dispatch',
      icon: CheckCircle2,
      color: '#0369a1',
      target: 'pickups'
    },
    {
      label: 'Assigned / In Progress',
      value: stats.assignedRequests ?? 0,
      sub: 'Active driver rounds',
      icon: Truck,
      color: '#0284c7',
      target: 'pickups'
    },
    {
      label: 'Completed Today',
      value: stats.collectionsCompletedToday ?? 0,
      sub: `${stats.completedPickups ?? 0} total collected`,
      icon: CheckCircle2,
      color: '#15803d',
      target: 'pickups'
    },
    {
      label: 'Overdue Requests',
      value: stats.overdueRequests ?? 0,
      sub: 'Past scheduled slot',
      icon: AlertTriangle,
      color: (stats.overdueRequests || 0) > 0 ? '#dc2626' : '#64748b',
      target: 'pickups'
    },
    {
      label: 'Registered Citizens',
      value: stats.registeredCitizens ?? 0,
      sub: 'Coimbatore households',
      icon: Users,
      color: '#166534',
      target: 'users'
    },
    {
      label: 'Collection Workers',
      value: stats.registeredWorkers ?? 0,
      sub: 'Driver-role staff',
      icon: UserCheck,
      color: '#0f766e',
      target: 'workers'
    },
    {
      label: 'Active Fleet Vehicles',
      value: stats.activeVehicles ?? 0,
      sub: `of ${stats.totalVehicles ?? 0} registered`,
      icon: Truck,
      color: '#15803d',
      target: 'vehicles'
    },
    {
      label: 'Recycling & Facilities',
      value: stats.registeredRecyclingCentres ?? 0,
      sub: `${stats.disposalFacilitiesCount ?? 0} special disposal`,
      icon: MapPin,
      color: '#166534',
      target: 'recycling-centres'
    }
  ];

  const completionPct = stats.pickupCompletionRate ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminPageHeader
        breadcrumb="Overview • Dashboard"
        title="Coimbatore Municipal Waste Management Command Centre"
        subtitle="Real-time database-backed operational summary across Coimbatore wards, fleet vehicles, collection workers, and civic facilities."
        actions={
          <>
            <button
              type="button"
              onClick={onRefresh}
              className="btn-secondary"
              style={{ padding: '9px 16px', fontSize: '0.84rem' }}
            >
              <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Data</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('routes')}
              className="btn-primary"
              style={{ padding: '9px 18px', fontSize: '0.84rem' }}
            >
              <Compass size={15} />
              <span>Route Dispatch</span>
            </button>
          </>
        }
      />

      {/* 10 Summary Metric Cards (Each links to its management module) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: 14
      }}>
        {metricCards.map((m, idx) => {
          const Icon = m.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onNavigate(m.target)}
              className="card"
              style={{
                padding: '16px 18px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s, border-color 0.15s',
                border: '1.5px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '0.73rem', fontWeight: 800, color: 'var(--secondary-text)', textTransform: 'uppercase' }}>
                  {m.label}
                </span>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'var(--pale-green-section)',
                  color: m.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: m.color, marginTop: 8 }}>
                {m.value}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, fontSize: '0.74rem', color: 'var(--secondary-text)' }}>
                <span>{m.sub}</span>
                <ArrowUpRight size={13} color="var(--secondary-green)" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Attention & Operational Alert Panel */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color={alerts.length > 0 ? '#dc2626' : '#166534'} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-text)' }}>
              Operational Attention & Alert Panel
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-text)' }}>
            Derived from active database records
          </span>
        </div>

        {alerts.length === 0 ? (
          <div style={{
            padding: '14px 18px',
            borderRadius: 14,
            background: 'var(--very-light-mint)',
            border: '1px solid var(--soft-leaf-green)',
            color: 'var(--primary-forest)',
            fontSize: '0.84rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <CheckCircle2 size={18} />
            <span>No active operational alerts. All scheduled pickups, vehicles, and complaints are within normal thresholds.</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {alerts.map(alert => {
              const isCrit = alert.severity === 'critical';
              return (
                <div
                  key={alert.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    background: isCrit ? '#fef2f2' : '#fffbeb',
                    border: `1.5px solid ${isCrit ? '#fecaca' : '#fde68a'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: isCrit ? '#991b1b' : '#92400e' }}>
                        {alert.title}
                      </span>
                      <StatusBadge status={isCrit ? 'Critical' : 'Pending'} />
                    </div>
                    <p style={{ fontSize: '0.78rem', color: isCrit ? '#7f1d1d' : '#78350f', marginTop: 4, lineHeight: 1.4 }}>
                      {alert.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(alert.targetModule)}
                    style={{
                      alignSelf: 'flex-start',
                      background: '#ffffff',
                      border: `1px solid ${isCrit ? '#fca5a5' : '#fcd34d'}`,
                      color: isCrit ? '#991b1b' : '#92400e',
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Inspect & Resolve →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collection Progress & Ward-Wise Collection Overview */}
      <div className="grid-2">
        {/* Collection Progress & Workforce/Fleet Availability */}
        <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                Collection Progress & Resource Availability
              </h3>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                {completionPct}% Overall Completion
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 10,
              background: '#e2e8f0',
              borderRadius: 999,
              overflow: 'hidden',
              marginTop: 8
            }}>
              <div style={{
                width: `${Math.min(100, completionPct)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #166534, #15803d)',
                borderRadius: 999
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--secondary-text)', marginTop: 6 }}>
              <span>Collected: <strong>{stats.totalCollectedWasteKg ?? 0} kg</strong></span>
              <span>Awaiting Collection: <strong>{stats.awaitingCollectionWasteKg ?? 0} kg</strong></span>
              <span>Recycled Rate: <strong>{stats.recyclingRate ?? 0}%</strong></span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                Current Worker Availability ({workerList.length})
              </span>
              <button
                type="button"
                onClick={() => onNavigate('workers')}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-forest)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Manage Workers →
              </button>
            </div>
            {workerList.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>No collection workers registered yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {workerList.slice(0, 4).map(w => (
                  <div key={w.workerId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 10px', background: 'var(--main-background)', borderRadius: 10 }}>
                    <div>
                      <strong style={{ color: 'var(--primary-text)' }}>{w.name}</strong>
                      <span style={{ color: 'var(--secondary-text)', marginLeft: 6, fontSize: '0.74rem' }}>({w.assignedWard})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--secondary-text)' }}>{w.activeAssignments} active</span>
                      <StatusBadge status={w.operationalStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                Fleet Vehicle Availability ({vehicleList.length})
              </span>
              <button
                type="button"
                onClick={() => onNavigate('vehicles')}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-forest)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Manage Fleet →
              </button>
            </div>
            {vehicleList.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>No fleet vehicles registered yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {vehicleList.slice(0, 4).map(v => (
                  <div key={v.vehicleId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 10px', background: 'var(--main-background)', borderRadius: 10 }}>
                    <div>
                      <strong style={{ color: 'var(--primary-forest)' }}>{v.registrationNumber}</strong>
                      <span style={{ color: 'var(--secondary-text)', marginLeft: 6, fontSize: '0.74rem' }}>{v.vehicleType}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--secondary-text)' }}>{v.currentLoadKg}/{v.capacityKg} kg</span>
                      <StatusBadge status={v.operationalStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ward-Wise Collection Overview */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                Ward-Wise Collection Overview
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--secondary-text)' }}>
                Aggregated pickup volume and pending status across Coimbatore wards
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('wards')}
              className="btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.76rem' }}
            >
              Ward Directory →
            </button>
          </div>

          {wardOverview.length === 0 ? (
            <EmptyState
              title="No Ward Activity Recorded"
              subtitle="Create wards or submit pickup requests to view ward-level operational breakdowns."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border-light)', color: 'var(--secondary-text)' }}>
                    <th style={{ padding: '8px 10px' }}>Ward</th>
                    <th style={{ padding: '8px 10px' }}>Requests</th>
                    <th style={{ padding: '8px 10px' }}>Pending</th>
                    <th style={{ padding: '8px 10px' }}>Completed</th>
                    <th style={{ padding: '8px 10px' }}>Est. Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {wardOverview.slice(0, 7).map((w, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '9px 10px', fontWeight: 700, color: 'var(--primary-text)' }}>{w.label}</td>
                      <td style={{ padding: '9px 10px' }}>{w.totalRequests}</td>
                      <td style={{ padding: '9px 10px', color: w.pendingRequests > 0 ? '#b45309' : 'var(--secondary-text)', fontWeight: 700 }}>
                        {w.pendingRequests}
                      </td>
                      <td style={{ padding: '9px 10px', color: '#15803d', fontWeight: 700 }}>{w.completedRequests}</td>
                      <td style={{ padding: '9px 10px', fontWeight: 700 }}>{w.totalWeightKg} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pickup Requests Requiring Attention & Upcoming Schedules */}
      <div className="grid-2">
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                Pickup Requests Requiring Attention
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--secondary-text)' }}>
                Overdue or unassigned citizen pickup requests
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('pickups')}
              className="btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.76rem' }}
            >
              All Requests →
            </button>
          </div>

          {attentionList.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--secondary-text)', fontSize: '0.82rem' }}>
              All pickup requests are currently assigned and on schedule.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attentionList.slice(0, 5).map(r => (
                <div
                  key={r._id || r.trackingId}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border-light)',
                    background: 'var(--main-background)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: '0.82rem', color: 'var(--primary-forest)' }}>{r.trackingId}</strong>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-text)' }}>{r.citizen?.name}</span>
                      <StatusBadge status={r.category} />
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--secondary-text)', marginTop: 2 }}>
                      {r.location?.address} • {r.quantity} {r.unit}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Collection Schedules & Recent Complaints */}
        <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} color="var(--primary-forest)" />
                <h3 style={{ fontSize: '1.0rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                  Upcoming Collection Schedules
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('schedules')}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-forest)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Manage Schedules →
              </button>
            </div>
            {upcomingSchedules.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>No upcoming collection schedules configured.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingSchedules.slice(0, 3).map(s => (
                  <div key={s._id} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--main-background)', border: '1px solid var(--border-light)', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-text)' }}>{s.title}</div>
                    <div style={{ color: 'var(--secondary-text)', fontSize: '0.73rem', marginTop: 2 }}>
                      {formatISTDate(s.date)} • {s.timeWindow} • {s.driverName || 'Unassigned'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquareWarning size={16} color="#b45309" />
                <h3 style={{ fontSize: '1.0rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                  Recent Civic Complaints ({stats.totalComplaints ?? 0})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('complaints')}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-forest)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Review Complaints →
              </button>
            </div>
            {recentComplaints.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>No civic sanitation complaints submitted.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentComplaints.slice(0, 3).map(c => (
                  <div key={c._id} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--main-background)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--primary-text)' }}>{c.complaintId}: {c.category}</div>
                      <div style={{ color: 'var(--secondary-text)', fontSize: '0.72rem' }}>{c.address}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Administrative Activity Feed */}
      <div className="card" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={17} color="var(--primary-forest)" />
            <h3 style={{ fontSize: '1.0rem', fontWeight: 800, color: 'var(--primary-text)' }}>
              Recent Administrative Audit Activity
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('audit-logs')}
            style={{ background: 'transparent', border: 'none', color: 'var(--primary-forest)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
          >
            View Full Audit Trail →
          </button>
        </div>
        {recentActivity.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
            No administrative actions logged yet in this session.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {recentActivity.slice(0, 6).map(log => (
              <div key={log._id} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--main-background)', border: '1px solid var(--border-light)', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary-forest)', fontSize: '0.72rem' }}>{log.action}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--secondary-text)' }}>{formatISTDate(log.timestamp, true)}</span>
                </div>
                <div style={{ color: 'var(--primary-text)', fontWeight: 600, marginTop: 4 }}>{log.summary}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
