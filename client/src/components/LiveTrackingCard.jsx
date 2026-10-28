import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Clock, 
  Navigation2, 
  CheckCircle2, 
  RotateCw,
  Share2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Icons
const citizenIcon = new L.DivIcon({
  className: 'custom-pin-citizen',
  html: `<div style="background:#1b4332; color:white; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 4px 12px rgba(0,0,0,0.35);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34]
});

const truckIcon = new L.DivIcon({
  className: 'custom-pin-truck',
  html: `<div style="background:#22c55e; color:#0f291e; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 4px 14px rgba(34,197,94,0.5);">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

const TIMELINE_STEPS = [
  'Reported',
  'Confirmed',
  'Assigned',
  'In Progress',
  'Collected',
  'Recycled'
];

export default function LiveTrackingCard({ activeReport, onStatusUpdate }) {
  if (!activeReport) return null;

  const citizenCoords = [
    activeReport.location.coordinates?.lat || 40.8448,
    activeReport.location.coordinates?.lng || -73.8648
  ];

  // Driver simulated position slightly away
  const driverCoords = [
    (activeReport.assignedDriver?.currentLocation?.lat || citizenCoords[0] + 0.009),
    (activeReport.assignedDriver?.currentLocation?.lng || citizenCoords[1] - 0.007)
  ];

  // Route Polyline
  const routePoints = [
    driverCoords,
    [driverCoords[0] - 0.003, driverCoords[1] + 0.002],
    [driverCoords[0] - 0.006, driverCoords[1] + 0.005],
    citizenCoords
  ];

  const currentStepIdx = Math.max(0, TIMELINE_STEPS.indexOf(activeReport.status));

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      {/* Interactive Map Header (Image 1 Screen 2) */}
      <div style={{ height: 260, position: 'relative', background: '#e2e8f0' }}>
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
          <Polyline positions={routePoints} color="#1b4332" weight={4} dashArray="8, 6" />
          <Marker position={citizenCoords} icon={citizenIcon}>
            <Popup>
              <strong>Pickup Destination</strong><br />
              {activeReport.location.address}
            </Popup>
          </Marker>
          <Marker position={driverCoords} icon={truckIcon}>
            <Popup>
              <strong>Collection Vehicle</strong><br />
              {activeReport.assignedDriver?.name} ({activeReport.assignedDriver?.vehiclePlate})
            </Popup>
          </Marker>
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#1b4332'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
          <span>Tracking ID: {activeReport.trackingId}</span>
        </div>
      </div>

      {/* Driver & Arrival Sheet (Direct Replica of Image 1 Screen 2) */}
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b4332' }}>
              Our pickup agent is on the way
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.82rem', marginTop: 2 }}>
              <MapPin size={14} color="#16a34a" />
              <span>{activeReport.location.address}</span>
            </div>
          </div>
          <span className={`badge badge-${activeReport.status.toLowerCase().replace(' ', '')}`} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            {activeReport.status}
          </span>
        </div>

        {/* Courier / Driver Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
          padding: '14px 18px',
          borderRadius: 18,
          border: '1px solid #e2e8f0',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
              alt="Driver"
              style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid #22c55e' }}
            />
            <div>
              <div style={{ fontWeight: 800, color: '#1b4332', fontSize: '0.98rem' }}>
                {activeReport.assignedDriver?.name || 'Travis Jordan'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                ID: {activeReport.assignedDriver?.driverIdCode || '587-254-2365'} • {activeReport.assignedDriver?.vehiclePlate || 'NY-EV-7821'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={`tel:${activeReport.assignedDriver?.phone || '5872542365'}`}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#15803d',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}
              title="Call Driver"
            >
              <Phone size={16} />
            </a>
            <button
              onClick={() => alert(`Starting live messaging chat with driver ${activeReport.assignedDriver?.name}`)}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}
              title="Chat with Driver"
            >
              <MessageSquare size={16} />
            </button>
          </div>
        </div>

        {/* Road Distance & ETA Metrics (Image 1 stats) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          padding: '12px 16px',
          background: '#f0fdf4',
          borderRadius: 16,
          border: '1px solid #bbf7d0',
          marginBottom: 20
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>Road Distance</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#14532d' }}>
              {activeReport.assignedDriver?.distanceKm || 3.4} km
            </div>
          </div>
          <div style={{ borderLeft: '1.5px solid #bbf7d0', paddingLeft: 16 }}>
            <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>Estimated Time</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#14532d' }}>
              {activeReport.assignedDriver?.etaMinutes || 8} min
            </div>
          </div>
        </div>

        {/* Horizontal Status Timeline Stepper */}
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 10 }}>
            Live Progress Tracking:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {TIMELINE_STEPS.map((step, idx) => {
              const isPastOrCurrent = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div 
                  key={step} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    position: 'relative',
                    zIndex: 2,
                    flex: 1
                  }}
                >
                  <div style={{
                    width: isCurrent ? 28 : 22,
                    height: isCurrent ? 28 : 22,
                    borderRadius: '50%',
                    background: isPastOrCurrent ? '#22c55e' : '#e2e8f0',
                    color: isPastOrCurrent ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    boxShadow: isCurrent ? '0 0 12px rgba(34,197,94,0.6)' : 'none',
                    transition: 'all 0.3s'
                  }}>
                    {isPastOrCurrent ? '✓' : idx + 1}
                  </div>
                  <span style={{
                    fontSize: '0.66rem',
                    fontWeight: isCurrent ? 800 : 500,
                    color: isCurrent ? '#1b4332' : '#64748b',
                    marginTop: 6,
                    textAlign: 'center'
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
