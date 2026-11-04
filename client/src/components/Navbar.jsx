import React from 'react';
import { 
  Recycle, 
  MapPin, 
  Calendar, 
  BarChart3, 
  PlusCircle, 
  LogOut,
  LogIn,
  BookOpen,
  UserPlus,
  Compass,
  ShieldCheck,
  LayoutDashboard,
  Truck,
  Building2,
  MessageSquareWarning,
  Settings,
  Database
} from 'lucide-react';

export const ADMIN_CATEGORY_TABS = [
  {
    id: 'overview-group',
    label: 'Command Overview',
    defaultModule: 'dashboard',
    modules: ['dashboard'],
    icon: LayoutDashboard
  },
  {
    id: 'operations-group',
    label: 'Operations & Fleet',
    defaultModule: 'pickups',
    modules: ['pickups', 'workers', 'vehicles', 'wards', 'schedules', 'routes'],
    icon: Truck
  },
  {
    id: 'facilities-group',
    label: 'Facilities',
    defaultModule: 'recycling-centres',
    modules: ['recycling-centres', 'disposal-facilities'],
    icon: Building2
  },
  {
    id: 'community-group',
    label: 'Community & Civic',
    defaultModule: 'complaints',
    modules: ['complaints', 'campaigns'],
    icon: MessageSquareWarning
  },
  {
    id: 'insights-group',
    label: 'Analytics & Maps',
    defaultModule: 'analytics',
    modules: ['analytics', 'cleanliness-map', 'ward-performance', 'capacity'],
    icon: BarChart3
  },
  {
    id: 'system-group',
    label: 'System & Governance',
    defaultModule: 'users',
    modules: ['users', 'audit-logs', 'settings'],
    icon: Settings
  }
];

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  activeAdminModule = 'dashboard',
  setActiveAdminModule,
  currentUser, 
  onOpenPickup, 
  onOpenAuth, 
  onLogout, 
  userPoints = 0 
}) {
  const isAdmin = currentUser?.role === 'admin';

  // Citizen / User Dashboard tabs (strictly separate from Admin Command Centre)
  const citizenTabs = [
    { id: 'home', label: 'Citizen Portal', icon: Recycle },
    { id: 'centres', label: 'Recycling Centres', icon: MapPin },
    { id: 'schedule', label: 'Collection Schedule', icon: Calendar },
    { id: 'catalog', label: 'Waste Guide', icon: BookOpen }
  ];

  const handleLogoClick = () => {
    if (currentUser) {
      if (isAdmin) {
        setActiveTab('admin');
        if (setActiveAdminModule) setActiveAdminModule('dashboard');
      } else {
        setActiveTab('home');
      }
    } else {
      setActiveTab('landing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOurStoryClick = () => {
    if (activeTab !== 'landing') {
      setActiveTab('landing');
    }
    const el = document.getElementById('the-green-journey');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
    }
  };

  return (
    <header style={{
      background: isAdmin ? '#052e16' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(14px)',
      borderBottom: isAdmin ? '1.5px solid #14532d' : '1px solid var(--border-light)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px',
      transition: 'background 0.2s ease'
    }}>
      <div style={{
        maxWidth: isAdmin ? 1560 : 1300,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={handleLogoClick}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: isAdmin ? '#14532d' : 'var(--pale-green-section)',
            border: isAdmin ? '1.5px solid #22c55e' : '1.5px solid var(--soft-leaf-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isAdmin ? '#86efac' : 'var(--primary-forest)',
            boxShadow: '0 2px 8px rgba(22, 101, 52, 0.12)'
          }}>
            {isAdmin ? <ShieldCheck size={22} color="#86efac" /> : <Recycle size={22} color="var(--primary-forest)" />}
          </div>
          <div>
            <span style={{ fontSize: '1.22rem', fontWeight: 800, color: isAdmin ? '#ffffff' : 'var(--primary-forest)', letterSpacing: '-0.4px' }}>
              Waste<span style={{ color: isAdmin ? '#86efac' : 'var(--secondary-green)' }}>Wise</span>
            </span>
            <div style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              color: isAdmin ? '#86efac' : 'var(--secondary-text)',
              marginTop: -2,
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}>
              {isAdmin ? 'CCMC Admin Command Centre' : (currentUser ? 'Coimbatore Citizen Portal' : 'Coimbatore Platform')}
            </div>
          </div>
        </div>

        {/* Center Navigation Area: Strictly Separated by Role */}
        {currentUser ? (
          isAdmin ? (
            // ADMIN TOP NAVIGATION: 6 Organized Backend Domain Groups
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#064e3b',
              padding: 4,
              borderRadius: 999,
              border: '1px solid #166534',
              flexWrap: 'wrap'
            }}>
              {ADMIN_CATEGORY_TABS.map(cat => {
                const Icon = cat.icon;
                const isActive = cat.modules.includes(activeAdminModule);
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveTab('admin');
                      if (setActiveAdminModule) {
                        setActiveAdminModule(cat.defaultModule);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 14px',
                      borderRadius: 999,
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#052e16' : '#d1fae5',
                      background: isActive ? '#86efac' : 'transparent',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 2px 10px rgba(134, 239, 172, 0.25)' : 'none',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                  >
                    <Icon size={14} color={isActive ? '#052e16' : '#86efac'} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </nav>
          ) : (
            // CITIZEN / USER TOP NAVIGATION: Citizen Portal Features Only
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--very-light-mint)',
              padding: 4,
              borderRadius: 999,
              border: '1px solid var(--border-light)',
              flexWrap: 'wrap'
            }}>
              {citizenTabs.map(tab => {
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
                      padding: '7px 14px',
                      borderRadius: 999,
                      fontSize: '0.84rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#ffffff' : 'var(--primary-text)',
                      background: isActive ? 'var(--primary-forest)' : 'transparent',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 2px 8px rgba(22,101,52,0.2)' : 'none'
                    }}
                  >
                    <Icon size={15} color={isActive ? '#ffffff' : 'var(--secondary-green)'} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )
        ) : (
          // Unauthenticated navigation: ONLY "Our Story" link
          <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleOurStoryClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 999,
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--primary-forest)',
                background: 'var(--pale-green-section)',
                border: '1px solid var(--soft-leaf-green)',
                transition: 'all 0.15s ease'
              }}
            >
              <Compass size={15} color="var(--primary-forest)" />
              <span>Our Story</span>
            </button>
          </nav>
        )}

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {currentUser ? (
            isAdmin ? (
              // ADMIN RIGHT CONTROLS: Backend Status + Admin Profile + Logout (No Citizen Pickup or Eco Points)
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#064e3b',
                  border: '1px solid #22c55e',
                  padding: '5px 12px',
                  borderRadius: 999,
                  color: '#d1fae5',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  <Database size={13} color="#86efac" />
                  <span>18 Backend Modules Active</span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#064e3b',
                  border: '1px solid #166534',
                  borderRadius: 999,
                  padding: '3px 10px 3px 6px',
                  gap: 8
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#86efac',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#052e16',
                    fontSize: '0.78rem',
                    fontWeight: 800
                  }}>
                    A
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                      {currentUser.name}
                    </span>
                    <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Municipal Admin
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Log Out of Admin Command Centre"
                    style={{
                      color: '#fca5a5',
                      padding: '4px 8px',
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginLeft: 4,
                      background: 'rgba(220, 38, 38, 0.18)',
                      border: '1px solid rgba(252, 165, 165, 0.3)',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}
                  >
                    <LogOut size={13} />
                    <span>Exit</span>
                  </button>
                </div>
              </>
            ) : (
              // CITIZEN / USER RIGHT CONTROLS: Request Pickup + Eco Points + User Profile + Logout
              <>
                <button
                  onClick={onOpenPickup}
                  className="btn-primary"
                  style={{ padding: '7px 15px', fontSize: '0.84rem' }}
                >
                  <PlusCircle size={15} />
                  <span>Request Pickup</span>
                </button>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#ffffff',
                  border: '1.5px solid var(--soft-leaf-green)',
                  padding: '5px 12px',
                  borderRadius: 999,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--secondary-green)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                    {userPoints.toLocaleString()} <span style={{ fontWeight: 600, color: 'var(--secondary-text)' }}>pts</span>
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 999,
                  padding: '3px 10px 3px 6px',
                  gap: 8
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--pale-green-section)',
                    border: '1px solid var(--soft-leaf-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-forest)',
                    fontSize: '0.78rem',
                    fontWeight: 800
                  }}>
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary-text)', lineHeight: 1.2 }}>
                      {currentUser.name}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--secondary-green)', textTransform: 'capitalize' }}>
                      {currentUser.role}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Log Out"
                    style={{
                      color: 'var(--secondary-text)',
                      padding: 4,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: 4,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </>
            )
          ) : (
            // Guest Auth CTAs: Separate Citizen Sign In, Admin Portal, and Join WasteWise
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => onOpenAuth('login', 'citizen')}
                className="btn-secondary"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  background: '#FFFFFF',
                  borderRadius: 999
                }}
              >
                <LogIn size={15} />
                <span>Citizen Sign In</span>
              </button>

              <button
                onClick={() => onOpenAuth('login', 'admin')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  background: '#052e16',
                  color: '#86efac',
                  border: '1.5px solid #166534',
                  borderRadius: 999,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ShieldCheck size={15} color="#86efac" />
                <span>Admin Portal</span>
              </button>

              <button
                onClick={() => onOpenAuth('register', 'citizen')}
                className="btn-primary"
                style={{
                  padding: '7px 15px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  borderRadius: 999,
                  background: 'var(--primary-forest)',
                  borderColor: 'var(--primary-forest)'
                }}
              >
                <UserPlus size={15} />
                <span>Join WasteWise</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
