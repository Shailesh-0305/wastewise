import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import CitizenHome from './components/CitizenHome';
import RecyclingCentresMap from './components/RecyclingCentresMap';
import CollectionScheduleView from './components/CollectionScheduleView';
import WasteCatalogView from './components/WasteCatalogView';
import AdminDashboard from './components/AdminDashboard';
import WasteScannerModal from './components/WasteScannerModal';
import PickupRequestModal from './components/PickupRequestModal';
import AuthModal from './components/AuthModal';
import { api } from './services/api';
import { Home, MapPin, Sparkles, BarChart3, BookOpen, ShieldAlert, LogIn } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [classificationPreFill, setClassificationPreFill] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.getReports();
      if (res.success && Array.isArray(res.reports)) {
        setReports(res.reports);
      } else {
        setReports([]);
      }
    } catch (e) {
      console.warn('Initial data load warning:', e);
      setReports([]);
    }
  }, []);

  const checkCurrentUser = useCallback(async () => {
    setIsCheckingAuth(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setCurrentUser(null);
      setUserPoints(0);
      setIsCheckingAuth(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setUserPoints(res.user.ecoPoints || 0);
        fetchReports();
      } else {
        // Token invalid or expired
        api.logout();
        setCurrentUser(null);
        setUserPoints(0);
      }
    } catch {
      api.logout();
      setCurrentUser(null);
      setUserPoints(0);
    } finally {
      setIsCheckingAuth(false);
    }
  }, [fetchReports]);

  useEffect(() => {
    checkCurrentUser();
  }, [checkCurrentUser]);

  // Handle pickup request opening: requires authentication
  const handleOpenPickup = () => {
    if (!currentUser) {
      setAuthTab('login');
      setIsAuthOpen(true);
      return;
    }
    setClassificationPreFill(null);
    setIsPickupOpen(true);
  };

  const handleClassificationSelected = (item) => {
    setClassificationPreFill(item);
    if (!currentUser) {
      setAuthTab('login');
      setIsAuthOpen(true);
      return;
    }
    setIsPickupOpen(true);
  };

  const handleReportCreated = (newReport) => {
    setReports(prev => [newReport, ...prev]);
    setUserPoints(prev => prev + (newReport.aiClassification?.ecoPointsEarned || 25));
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
    setActiveTab('home');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--main-background)' }}>
      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenPickup={handleOpenPickup}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAuth={(tab) => { setAuthTab(tab); setIsAuthOpen(true); }}
        onLogout={handleLogout}
        userPoints={userPoints}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px 20px 80px', maxWidth: 1300, width: '100%', margin: '0 auto' }}>
        {activeTab === 'home' && (
          <CitizenHome
            onOpenPickup={handleOpenPickup}
            onOpenScanner={() => setIsScannerOpen(true)}
            onNavigateCentres={() => setActiveTab('centres')}
            onNavigateSchedule={() => setActiveTab('schedule')}
            onNavigateCatalog={() => setActiveTab('catalog')}
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
            onOpenScanner={() => setIsScannerOpen(true)}
            onRequestPickup={handleOpenPickup}
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
                  onClick={() => { setAuthTab('login'); setIsAuthOpen(true); }}
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
                  Return to Home
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Floating Mobile Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid var(--border-light)',
        borderRadius: 999,
        padding: '8px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        boxShadow: '0 8px 32px rgba(22, 101, 52, 0.12)',
        zIndex: 90
      }}>
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'catalog', label: 'Guide', icon: BookOpen },
          { id: 'scanner', label: 'AI Scan', icon: Sparkles, isSpecial: true },
          { id: 'centres', label: 'Map', icon: MapPin },
          ...(currentUser?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: BarChart3 }] : [])
        ].map(btn => {
          const Icon = btn.icon;
          const isActive = activeTab === btn.id;

          if (btn.isSpecial) {
            return (
              <button
                key={btn.id}
                onClick={() => setIsScannerOpen(true)}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: 'var(--primary-forest)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -16,
                  boxShadow: '0 6px 16px rgba(22,101,52,0.3)',
                  transition: 'all 0.2s',
                  border: 'none',
                  cursor: 'pointer'
                }}
                title="Scan Waste with AI"
              >
                <Sparkles size={20} />
              </button>
            );
          }

          return (
            <button
              key={btn.id}
              onClick={() => setActiveTab(btn.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                color: isActive ? 'var(--primary-forest)' : 'var(--secondary-text)',
                transition: 'all 0.2s',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: '0.66rem', fontWeight: isActive ? 800 : 500 }}>
                {btn.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        defaultTab={authTab}
      />

      {/* AI Waste-Image Classifier Modal */}
      <WasteScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectClassification={handleClassificationSelected}
      />

      {/* Pickup Request Modal */}
      <PickupRequestModal
        isOpen={isPickupOpen}
        onClose={() => setIsPickupOpen(false)}
        initialData={classificationPreFill}
        onReportCreated={handleReportCreated}
      />
    </div>
  );
}
