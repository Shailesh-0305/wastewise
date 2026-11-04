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
import { Home, MapPin, Calendar, BookOpen } from 'lucide-react';

export default function App() {
  // Public landing page is the default route for unauthenticated visitors;
  // Admin and Citizen workspaces are strictly separated upon authentication.
  const [activeTab, setActiveTab] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return 'landing';
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      return storedUser?.role === 'admin' ? 'admin' : 'home';
    } catch {
      return 'home';
    }
  });
  const [activeAdminModule, setActiveAdminModule] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [authRole, setAuthRole] = useState('citizen');
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
        // Strictly route Admin to Admin Command Centre and Citizen/Driver to Citizen Portal
        if (res.user.role === 'admin') {
          setActiveTab('admin');
        } else {
          setActiveTab(prev => (prev === 'landing' || prev === 'admin') ? 'home' : prev);
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

  // Protected tab navigation: unauthenticated users cannot access application features;
  // Admin and Citizen workspaces remain strictly separate.
  const handleProtectedTabChange = (targetTab) => {
    if (targetTab === 'landing') {
      if (currentUser) {
        setActiveTab(currentUser.role === 'admin' ? 'admin' : 'home');
        return;
      }
      setActiveTab('landing');
      return;
    }

    if (!currentUser) {
      setAuthTab('login');
      setAuthRole(targetTab === 'admin' ? 'admin' : 'citizen');
      setIsAuthOpen(true);
      return;
    }

    if (currentUser.role === 'admin') {
      setActiveTab('admin');
      return;
    }

    if (targetTab === 'admin' && currentUser.role !== 'admin') {
      setActiveTab('home');
      return;
    }

    setActiveTab(targetTab);
  };

  // Handle pickup request opening: requires Citizen authentication
  const handleOpenPickup = () => {
    if (!currentUser) {
      setAuthTab('login');
      setAuthRole('citizen');
      setIsAuthOpen(true);
      return;
    }
    setIsPickupOpen(true);
  };

  const handleReportCreated = (newReport) => {
    setReports(prev => [newReport, ...prev]);
    checkCurrentUser();
    setActiveTab('home');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    if (user.ecoPoints !== undefined) setUserPoints(user.ecoPoints);
    fetchReports();
    if (user.role === 'admin') {
      setActiveTab('admin');
      setActiveAdminModule('dashboard');
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
      setAuthRole('citizen');
      setIsAuthOpen(true);
      return;
    }
    setCatalogSearchQuery(query);
    setActiveTab('catalog');
  };

  const handleOpenAuth = (tab = 'login', role = 'citizen') => {
    setAuthTab(tab);
    setAuthRole(role);
    setIsAuthOpen(true);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--main-background)' }}>
      {/* Top Main Navigation (Role-Separated) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleProtectedTabChange}
        activeAdminModule={activeAdminModule}
        setActiveAdminModule={setActiveAdminModule}
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
      ) : isAdmin ? (
        // DEDICATED MUNICIPAL ADMIN COMMAND CENTRE (Completely separate from User Dashboard)
        <main style={{ flex: 1, padding: '20px 20px 60px', maxWidth: 1580, width: '100%', margin: '0 auto' }}>
          <AdminDashboard
            activeModule={activeAdminModule}
            setActiveModule={setActiveAdminModule}
            onRefreshNeeded={fetchReports}
          />
        </main>
      ) : (
        // DEDICATED CITIZEN / USER PORTAL DASHBOARD (Completely separate from Admin Command Centre)
        <main style={{ flex: 1, padding: '24px 20px 80px', maxWidth: 1300, width: '100%', margin: '0 auto' }}>
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
        </main>
      )}

      {/* Floating Mobile Bottom Navigation: Only for Authenticated Citizens/Users */}
      {currentUser && !isAdmin && (
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
            { id: 'centres', label: 'Centres', icon: MapPin }
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
        defaultRole={authRole}
      />

      {/* Pickup Request Modal (Citizen Portal) */}
      {!isAdmin && (
        <PickupRequestModal
          isOpen={isPickupOpen}
          onClose={() => setIsPickupOpen(false)}
          onReportCreated={handleReportCreated}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
