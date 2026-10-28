import React from 'react';
import { 
  Recycle, 
  MapPin, 
  Calendar, 
  BarChart3, 
  Sparkles, 
  PlusCircle, 
  Truck, 
  ShieldCheck, 
  User,
  Bell
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, activeRole, setActiveRole, onOpenPickup, onOpenScanner, userPoints = 1250 }) {
  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.88)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(27, 67, 50, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#22c55e',
            boxShadow: '0 4px 12px rgba(27, 67, 50, 0.2)'
          }}>
            <Recycle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1b4332', letterSpacing: '-0.5px' }}>
              Waste<span style={{ color: '#22c55e' }}>Wise</span>
            </span>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#52b788', marginTop: -2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Smart Waste Platform
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#eef5f0',
          padding: 4,
          borderRadius: 999
        }}>
          {[
            { id: 'home', label: 'Citizen Portal', icon: Recycle },
            { id: 'centres', label: 'Recycling Centres', icon: MapPin },
            { id: 'schedule', label: 'Collection Schedule', icon: Calendar },
            { id: 'admin', label: 'Admin & Fleet', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 999,
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : '#2d6a4f',
                  background: isActive ? '#1b4332' : 'transparent',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(27,67,50,0.2)' : 'none'
                }}
              >
                <Icon size={16} color={isActive ? '#22c55e' : 'currentColor'} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* AI Scanner Button */}
          <button
            onClick={onOpenScanner}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#e0f5ea',
              color: '#15803d',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              padding: '8px 14px',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: '0.84rem'
            }}
            title="Scan waste with AI image recognition"
          >
            <Sparkles size={16} color="#16a34a" />
            <span>AI Scan</span>
          </button>

          {/* Quick Pickup Request */}
          <button
            onClick={onOpenPickup}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <PlusCircle size={16} />
            <span>Request Pickup</span>
          </button>

          {/* Eco Points Pill (Matches Image 3) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#ffffff',
            border: '1.5px solid #dcfce7',
            padding: '6px 12px',
            borderRadius: 999,
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534' }}>
              {userPoints.toLocaleString()} <span style={{ fontWeight: 500, color: '#86efac' }}>pts</span>
            </span>
          </div>

          {/* Role Switcher Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 999,
            padding: '3px 8px',
            gap: 4
          }}>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.8rem',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="citizen">👤 Alex (Citizen)</option>
              <option value="driver">🚛 Travis (Driver)</option>
              <option value="admin">🏢 Supervisor (Admin)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
