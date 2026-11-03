import React from 'react';
import { 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Truck,
  Radio
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Icons
const citizenIcon = new L.DivIcon({
  className: 'custom-pin-citizen',
  html: `<div style="background:#166534; color:white; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 4px 12px rgba(22,101,52,0.35);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34]
});

const truckIcon = new L.DivIcon({
  className: 'custom-pin-truck',
  html: `<div style="background:#15803d; color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2.5px solid white; box-shadow:0 4px 14px rgba(21,128,61,0.4);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const TIMELINE_STEPS = [
  'Reported',
  'Confirmed',
  'Assigned',
  'In Progress',
  'Collected',
  'Recycled'
];

export default function LiveTrackingCard({ activeReport }) {
  if (!activeReport) return null;

  const citizenCoords = [
    activeReport.location?.coordinates?.lat || 11.0055,
    activeReport.location?.coordinates?.lng || 76.9661
  ];

  const hasDriverAssigned = Boolean(
    activeReport.assignedDriver?.name &&
    activeReport.assignedDriver.name !== 'Awaiting Driver Assignment' &&
    ['Assigned', 'In Progress', 'Collected', 'Recycled'].includes(activeReport.status)
  );

  // Live driver tracking: only render driver marker if genuine live location streaming is active
  const hasLiveDriverLocation = Boolean(
    hasDriverAssigned &&
    activeReport.assignedDriver?.currentLocation?.lat &&
    activeReport.assignedDriver?.currentLocation?.lng &&
    activeReport.assignedDriver?.isLiveStreaming
  );

  const driverCoords = hasLiveDriverLocation
    ? [activeReport.assignedDriver.currentLocation.lat, activeReport.assignedDriver.currentLocation.lng]
    : null;

  const currentStepIdx = Math.max(0, TIMELINE_STEPS.indexOf(activeReport.status));

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1.5px solid var(--border-light)' }}>
      {/* Interactive Map Header */}
      <div style={{ height: 260, position: 'relative', background: '#e2ece4' }}>
        <MapContainer
          center={citizenCoords}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={citizenCoords} icon={citizenIcon}>
            <Popup>
              <strong>Pickup Location</strong><br />
              {activeReport.location?.address}
            </Popup>
          </Marker>

          {hasLiveDriverLocation && driverCoords && (
            <>
              <Marker position={driverCoords} icon={truckIcon}>
                <Popup>
                  <strong>Collection Driver</strong><br />
                  {activeReport.assignedDriver.name}
                  {activeReport.assignedDriver.vehiclePlate ? ` (${activeReport.assignedDriver.vehiclePlate})` : ''}
                </Popup>
              </Marker>
              <Polyline
                positions={[driverCoords, citizenCoords]}
                pathOptions={{
                  color: '#166534',
                  weight: 3.5,
                  dashArray: '6, 8',
                  opacity: 0.8
                }}
              />
            </>
          )}
        </MapContainer>

        {/* Floating Tracking Badge */}
        <div style={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(8px)',
          borderRadius: 999,
          padding: '6px 14px',
          boxShadow: '0 4px 12px rgba(22, 101, 52, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'var(--primary-forest)'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary-green)' }} />
          <span>Tracking ID: {activeReport.trackingId}</span>
        </div>
      </div>

      {/* Driver & Status Sheet */}
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-text)' }}>
              {hasDriverAssigned ? 'Collection Driver Assigned' : 'Pickup Request Logged'}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary-text)', fontSize: '0.82rem', marginTop: 3 }}>
              <MapPin size={14} color="var(--secondary-green)" />
              <span>{activeReport.location?.address}</span>
            </div>
          </div>
          <span className={`badge badge-${activeReport.status.toLowerCase().replace(/\s+/g, '')}`} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            {activeReport.status}
          </span>
        </div>

        {/* Driver / Assignment Card */}
        {hasDriverAssigned ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--very-light-mint)',
            padding: '14px 18px',
            borderRadius: 18,
            border: '1.5px solid var(--border-light)',
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--pale-green-section)',
                border: '2px solid var(--soft-leaf-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-forest)'
              }}>
                <Truck size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--primary-text)', fontSize: '0.96rem' }}>
                  {activeReport.assignedDriver.name}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--secondary-text)' }}>
                  {activeReport.assignedDriver.driverIdCode ? `ID: ${activeReport.assignedDriver.driverIdCode} • ` : ''}
                  {activeReport.assignedDriver.vehiclePlate ? `Vehicle: ${activeReport.assignedDriver.vehiclePlate}` : 'Municipal Fleet'}
                </div>
              </div>
            </div>

            {activeReport.assignedDriver.phone && (
              <a
                href={`tel:${activeReport.assignedDriver.phone}`}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '1.5px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-forest)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}
                title="Call Driver"
              >
                <Phone size={16} />
              </a>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--very-light-mint)',
            padding: '12px 16px',
            borderRadius: 16,
            border: '1px solid var(--border-light)',
            marginBottom: 16
          }}>
            <Clock size={20} color="var(--secondary-green)" />
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                Awaiting Driver Assignment
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>
                Your request is recorded. Municipal fleet dispatch will assign a driver according to the collection round.
              </div>
            </div>
          </div>
        )}

        {/* Live location availability indicator */}
        {hasDriverAssigned && !hasLiveDriverLocation && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            background: 'var(--very-light-mint)',
            border: '1.5px solid var(--border-light)',
            borderRadius: 14,
            padding: '12px 14px',
            marginBottom: 16
          }}>
            <Radio size={16} color="var(--secondary-green)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-text)' }}>
                Live location not available
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--secondary-text)', marginTop: 2, lineHeight: 1.4 }}>
                Live tracking activates only when the collection worker starts their round and grants location permission. Your pickup destination is pinned on the map.
              </div>
            </div>
          </div>
        )}

        {/* 6-Step Visual Timeline */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '5%',
              right: '5%',
              height: 2,
              background: 'var(--border-light)',
              transform: 'translateY(-50%)',
              zIndex: 0
            }} />

            {TIMELINE_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step} style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--primary-forest)' : isPast ? 'var(--secondary-green)' : '#ffffff',
                    border: isCurrent || isPast ? '2px solid #ffffff' : '2px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 10,
                    boxShadow: isCurrent ? '0 0 0 3px rgba(22,101,52,0.2)' : 'none'
                  }}>
                    {isPast ? <CheckCircle2 size={12} /> : idx + 1}
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? 'var(--primary-forest)' : 'var(--secondary-text)',
                    marginTop: 6
                  }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
