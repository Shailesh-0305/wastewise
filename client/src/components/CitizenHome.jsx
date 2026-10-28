import React from 'react';
import { 
  Truck, 
  Trash2, 
  Award, 
  Recycle, 
  Search, 
  MapPin, 
  Sparkles, 
  ChevronRight, 
  ArrowRight, 
  Bell, 
  QrCode,
  ShieldCheck,
  CheckCircle,
  Clock,
  Compass
} from 'lucide-react';
import LiveTrackingCard from './LiveTrackingCard';

const SERVICES = [
  { id: 'pickup', title: 'Pick up', icon: Truck, desc: 'Curbside collection' },
  { id: 'smartbin', title: 'Smart bin', icon: Trash2, desc: 'IoT fill-level alert' },
  { id: 'reward', title: 'Reward', icon: Award, desc: 'Eco points redemption' },
  { id: 'recycling', title: 'Recycling', icon: Recycle, desc: 'Materials guide' }
];

const RECYCLING_MATERIALS = [
  { name: 'Plastic', img: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=400&q=80', badge: 'High Yield' },
  { name: 'Metal', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80', badge: '100% Recyclable' },
  { name: 'Glass', img: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=400&q=80', badge: 'Infinite Life' }
];

export default function CitizenHome({ 
  onOpenPickup, 
  onOpenScanner, 
  onNavigateCentres, 
  onNavigateSchedule,
  onNavigateCatalog,
  reports = [], 
  userPoints = 1250,
  activeRole
}) {
  const latestReport = reports[0];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Top Emerald Header (Directly Matching Image 1 Screen 1 & Image 3 Screen 2) */}
      <div style={{
        background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
        borderRadius: 28,
        padding: '30px',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(27,67,50,0.25)'
      }}>
        {/* Subtle decorative circles */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 100, width: 140, height: 140, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', pointerEvents: 'none' }} />

        {/* User Profile Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
              alt="Avatar"
              style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #22c55e' }}
            />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Hello, Alex
              </div>
              <div style={{ fontSize: '0.8rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} color="#4ade80" /> Buffalo, NY
              </div>
            </div>
          </div>

          {/* Gamified Eco-Points & Level Card (Matches Image 3) */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 18,
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#d8f3dc', textTransform: 'uppercase', fontWeight: 700 }}>
                Eco Balance
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#4ade80' }}>
                {userPoints.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>Points</span>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 14 }}>
              <div style={{ fontSize: '0.7rem', color: '#d8f3dc', textTransform: 'uppercase', fontWeight: 700 }}>
                Tier
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                Level Eco Green 82
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar with AI Scan trigger (Image 1 replica) */}
        <div style={{
          background: '#ffffff',
          borderRadius: 999,
          padding: '6px 8px 6px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 580,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search recycling materials, centers, or schedule..."
              style={{
                border: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '0.88rem',
                color: '#1e293b'
              }}
            />
          </div>
          <button
            onClick={onOpenScanner}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#1b4332',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22c55e',
              flexShrink: 0
            }}
            title="Scan with Camera / QR"
          >
            <QrCode size={18} />
          </button>
        </div>
      </div>

      {/* Our Services Quick Grid (Direct Replica of Image 1 Screen 1) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b4332' }}>
            Our Services
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600, cursor: 'pointer' }} onClick={onNavigateCatalog}>
            View Waste Catalog →
          </span>
        </div>

        <div className="grid-4">
          {SERVICES.map(srv => {
            const Icon = srv.icon;
            const clickHandler = 
              srv.id === 'pickup' ? onOpenPickup :
              srv.id === 'recycling' ? onNavigateCatalog :
              srv.id === 'reward' ? () => alert(`You have ${userPoints} points available to redeem for eco vouchers!`) :
              () => alert('Smart bin sensors active: 4 neighborhood bins at 38% capacity.');

            return (
              <div
                key={srv.id}
                onClick={clickHandler}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  border: '1.5px solid rgba(27,67,50,0.08)',
                  background: '#ffffff',
                  transition: 'all 0.25s'
                }}
              >
                <div style={{
                  width: 58,
                  height: 58,
                  borderRadius: 20,
                  background: '#1b4332',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22c55e',
                  boxShadow: '0 6px 16px rgba(27,67,50,0.2)'
                }}>
                  <Icon size={26} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1b4332' }}>
                    {srv.title}
                  </h4>
                  <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                    {srv.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Tracking Card (Image 1 Screen 2) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b4332' }}>
              Active Pickup Tracking
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Real-time driver location
          </span>
        </div>

        {latestReport ? (
          <LiveTrackingCard activeReport={latestReport} />
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
            <p style={{ color: '#64748b', marginBottom: 12 }}>No active waste pickups at the moment.</p>
            <button onClick={onOpenPickup} className="btn-primary">
              Schedule Your First Pickup
            </button>
          </div>
        )}
      </div>

      {/* Recycling Material Cards (Image 1 Screen 1) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b4332' }}>
            Recycling Material
          </h3>
          <span 
            onClick={onNavigateCatalog}
            style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 700, cursor: 'pointer' }}
          >
            See All Guidelines →
          </span>
        </div>

        <div className="grid-3">
          {RECYCLING_MATERIALS.map(mat => (
            <div
              key={mat.name}
              onClick={onNavigateCatalog}
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                border: '1.5px solid #e2e8f0',
                height: 180
              }}
            >
              <img
                src={mat.img}
                alt={mat.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(18, 56, 38, 0.85) 0%, rgba(0,0,0,0.1) 60%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '16px'
              }}>
                <span style={{
                  background: '#22c55e',
                  color: '#0b291a',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  width: 'fit-content',
                  marginBottom: 4
                }}>
                  {mat.badge}
                </span>
                <h4 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 800 }}>
                  {mat.name}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Recycle Station Preview Snippet (Image 1 bottom card) */}
      <div 
        onClick={onNavigateCentres}
        className="card"
        style={{
          background: '#ffffff',
          border: '1.5px solid #dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '20px 24px',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: '#e0f5ea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#15803d'
          }}>
            <MapPin size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>
              Nearby Recycle Station • 160m | 5 min
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1b4332' }}>
              Green Bin Recycle Booth #4
            </h4>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Jackson Road Lane no 7, Buffalo, NY
            </div>
          </div>
        </div>

        <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
          <span>View on Map</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
