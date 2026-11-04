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
  Compass
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onOpenPickup, 
  onOpenAuth, 
  onLogout, 
  userPoints = 0 
}) {
  // Strict separation: Guests see ONLY public storytelling and authentication
  // Authenticated users see the municipal application features (no public story page)
  const authenticatedTabs = [
    { id: 'home', label: 'Citizen Portal', icon: Recycle },
    { id: 'centres', label: 'Recycling Centres', icon: MapPin },
    { id: 'schedule', label: 'Collection Schedule', icon: Calendar },
    { id: 'catalog', label: 'Waste Guide', icon: BookOpen },
    ...(currentUser?.role === 'admin' ? [{ id: 'admin', label: 'Municipal Fleet', icon: BarChart3 }] : [])
  ];

  const handleLogoClick = () => {
    if (currentUser) {
      setActiveTab('home');
    } else {
      setActiveTab('landing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOurStoryClick = () => {
    if (activeTab !== 'landing') {
      setActiveTab('landing');
    }
    // Smooth scroll to the green journey story section
    const el = document.getElementById('the-green-journey');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
    }
  };

  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-light)',
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
          onClick={handleLogoClick}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--pale-green-section)',
            border: '1.5px solid var(--soft-leaf-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-forest)',
            boxShadow: '0 2px 8px rgba(22, 101, 52, 0.08)'
          }}>
            <Recycle size={22} color="var(--primary-forest)" />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-forest)', letterSpacing: '-0.4px' }}>
              Waste<span style={{ color: 'var(--secondary-green)' }}>Wise</span>
            </span>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--secondary-text)', marginTop: -2, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Coimbatore Platform
            </div>
          </div>
        </div>

        {/* Navigation Area */}
        {currentUser ? (
          // Authenticated navigation: full suite of application views
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--very-light-mint)',
            padding: 4,
            borderRadius: 999,
            border: '1px solid var(--border-light)'
          }}>
            {authenticatedTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'landing') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
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
        ) : (
          // Unauthenticated navigation: ONLY "Our Story" link (no protected application tabs)
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
            <>
              {/* Quick Pickup Request for authenticated users */}
              <button
                onClick={onOpenPickup}
                className="btn-primary"
                style={{ padding: '7px 15px', fontSize: '0.84rem' }}
              >
                <PlusCircle size={15} />
                <span>Request Pickup</span>
              </button>

              {/* Eco Points Pill */}
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

              {/* User Profile Pill */}
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
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: currentUser.role === 'admin' ? '#b45309' : 'var(--secondary-green)', textTransform: 'capitalize' }}>
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
          ) : (
            // Guest Auth CTAs: Sign In & Join WasteWise
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => onOpenAuth('login')}
                className="btn-secondary"
                style={{
                  padding: '7px 16px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  background: '#FFFFFF',
                  borderRadius: 999
                }}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="btn-primary"
                style={{
                  padding: '7px 16px',
                  fontSize: '0.86rem',
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
