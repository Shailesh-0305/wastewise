import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import GreenJourneyLanding from './components/GreenJourneyLanding';
import CitizenHome from './components/CitizenHome';
import RecyclingCentresMap from './components/RecyclingCentresMap';
import CollectionScheduleView from './components/CollectionScheduleView';
import WasteCatalogView from './components/WasteCatalogView';
import AdminDashboard from './components/AdminDashboard';
import PickupRequestModal from './components/PickupRequestModal';
import AuthModal from './components/AuthModal';
import { api } from './services/api';
import { Home, MapPin, Calendar, BarChart3, BookOpen, ShieldAlert, LogIn } from 'lucide-react';

export default function App() {
  // Public landing page is the default route for unauthenticated visitors
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('token') ? 'home' : 'landing';
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.getReports();
      if (res.success && Array.isArray(res.reports)) {
        setReports(res.reports);
      } else {
        setReports([]);
      }
    } catch (e) {
      console.warn('Reports load warning:', e);
      setReports([]);
    }
  }, []);

  const checkCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCurrentUser(null);
      setUserPoints(0);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setUserPoints(res.user.ecoPoints || 0);
        fetchReports();
        // Route role appropriately upon verified authentication
        if (res.user.role === 'admin') {
          setActiveTab(prev => prev === 'landing' ? 'admin' : prev);
        } else {
          setActiveTab(prev => prev === 'landing' ? 'home' : prev);
        }
      } else {
        api.logout();
        setCurrentUser(null);
        setUserPoints(0);
        setActiveTab('landing');
      }
    } catch {
      api.logout();
      setCurrentUser(null);
      setUserPoints(0);
      setActiveTab('landing');
    }
  }, [fetchReports]);

  useEffect(() => {
    checkCurrentUser();
  }, [checkCurrentUser]);

  // Protected tab navigation: unauthenticated users cannot access application features
  const handleProtectedTabChange = (targetTab) => {
    if (targetTab === 'landing') {
      if (currentUser) {
        // Once logged in, public story page is never displayed
        setActiveTab(currentUser.role === 'admin' ? 'admin' : 'home');
        return;
      }
      setActiveTab('landing');
      return;
    }

    if (!currentUser) {
      // Intercept attempt to access protected features and require authentication
      setAuthTab('login');
      setIsAuthOpen(true);
      return;
    }

    if (targetTab === 'admin' && currentUser.role !== 'admin') {
      setActiveTab('home');
      return;
    }

    setActiveTab(targetTab);
  };

  // Handle pickup request opening: requires authentication
  const handleOpenPickup = () => {
    if (!currentUser) {
      setAuthTab('login');
      setIsAuthOpen(true);
      return;
    }
    setIsPickupOpen(true);
  };

  const handleReportCreated = (newReport) => {
    setReports(prev => [newReport, ...prev]);
    // Refresh user's actual profile points from the backend
    checkCurrentUser();
    setActiveTab('home');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    if (user.ecoPoints !== undefined) setUserPoints(user.ecoPoints);
    fetchReports();
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('home');
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setUserPoints(0);
    setReports([]);
    setActiveTab('landing');
  };

  const handleNavigateCatalog = (query = '') => {
    if (!currentUser) {
      setAuthTab('login');
      setIsAuthOpen(true);
      return;
    }
    setCatalogSearchQuery(query);
    setActiveTab('catalog');
  };

  const handleOpenAuth = (tab = 'login') => {
    setAuthTab(tab);
    setIsAuthOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--main-background)' }}>
      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleProtectedTabChange}
        currentUser={currentUser}
        onOpenPickup={handleOpenPickup}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        userPoints={userPoints}
      />

      {/* Main Content Area */}
      {!currentUser ? (
        // Public storytelling landing page (only for unauthenticated visitors)
        <main style={{ flex: 1, width: '100%', margin: 0, padding: 0 }}>
          <GreenJourneyLanding
            onOpenAuth={handleOpenAuth}
          />
        </main>
      ) : (
        // Protected application views (once logged in, our story is never displayed)
        <main style={{ flex: 1, padding: '24px 20px 80px', maxWidth: activeTab === 'admin' ? 1560 : 1300, width: '100%', margin: '0 auto' }}>
          {activeTab === 'home' && (
            <CitizenHome
              onOpenPickup={handleOpenPickup}
              onNavigateCentres={() => handleProtectedTabChange('centres')}
              onNavigateSchedule={() => handleProtectedTabChange('schedule')}
              onNavigateCatalog={handleNavigateCatalog}
              onOpenAuth={handleOpenAuth}
              reports={reports}
              userPoints={userPoints}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'centres' && (
            <RecyclingCentresMap />
          )}

          {activeTab === 'schedule' && (
            <CollectionScheduleView
              onRequestPickup={handleOpenPickup}
            />
          )}

          {activeTab === 'catalog' && (
            <WasteCatalogView
              onRequestPickup={handleOpenPickup}
              initialSearchQuery={catalogSearchQuery}
            />
          )}

          {activeTab === 'admin' && (
            currentUser?.role === 'admin' ? (
              <AdminDashboard
                onRefreshNeeded={fetchReports}
              />
            ) : (
              <div style={{
                maxWidth: 580,
                margin: '60px auto',
                background: '#ffffff',
                border: '1.5px solid var(--border-light)',
                borderRadius: 24,
                padding: '40px 32px',
                textAlign: 'center',
                boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#dc2626'
                }}>
                  <ShieldAlert size={28} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                  Municipal Fleet Access Restricted
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--secondary-text)', marginTop: 8, lineHeight: 1.5 }}>
                  The Municipal Admin & Fleet Route Optimization dashboard is restricted to authorized municipal officers.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 22 }}>
                  <button
                    onClick={() => handleOpenAuth('login')}
                    className="btn-primary"
                    style={{ padding: '9px 20px', fontSize: '0.86rem' }}
                  >
                    <LogIn size={15} /> Sign In as Admin
                  </button>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="btn-secondary"
                    style={{ padding: '9px 18px', fontSize: '0.86rem' }}
                  >
                    Return to Portal
                  </button>
                </div>
              </div>
            )
          )}
        </main>
      )}

      {/* Floating Mobile Bottom Navigation: Only for Authenticated Users */}
      {currentUser && (
        <nav 
          className="mobile-bottom-nav"
          aria-label="Mobile Navigation"
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid var(--border-light)',
            borderRadius: 999,
            padding: '8px 18px',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 8px 32px rgba(22, 101, 52, 0.12)',
            zIndex: 90
          }}
        >
          {[
            { id: 'home', label: 'Portal', icon: Home },
            { id: 'catalog', label: 'Guide', icon: BookOpen },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'centres', label: 'Centres', icon: MapPin },
            ...(currentUser.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: BarChart3 }] : [])
          ].map(btn => {
            const Icon = btn.icon;
            const isActive = activeTab === btn.id;

            return (
              <button
                key={btn.id}
                onClick={() => {
                  if (btn.id === 'catalog') {
                    setCatalogSearchQuery('');
                  }
                  setActiveTab(btn.id);
                  if (btn.id === 'landing') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  color: isActive ? 'var(--primary-forest)' : 'var(--secondary-text)',
                  transition: 'all 0.15s',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 6px'
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ fontSize: '0.66rem', fontWeight: isActive ? 800 : 500 }}>
                  {btn.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        defaultTab={authTab}
      />

      {/* Pickup Request Modal */}
      <PickupRequestModal
        isOpen={isPickupOpen}
        onClose={() => setIsPickupOpen(false)}
        onReportCreated={handleReportCreated}
        currentUser={currentUser}
      />
    </div>
  );
}
