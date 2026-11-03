import React, { useState, useEffect } from 'react';
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
import { Home, MapPin, Sparkles, BarChart3, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [userPoints, setUserPoints] = useState(1250);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [classificationPreFill, setClassificationPreFill] = useState(null);

  useEffect(() => {
    fetchInitialData();
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setCurrentUser(res.user);
        if (res.user.ecoPoints) {
          setUserPoints(res.user.ecoPoints);
        }
      } else {
        // Default guest citizen session
        const defaultUser = {
          name: 'Alex Navillera',
          email: 'alex@example.com',
          role: 'citizen',
          ecoPoints: 1250
        };
        setCurrentUser(defaultUser);
      }
    } catch {
      // Keep default guest
    }
  };

  const fetchInitialData = async () => {
    try {
      const res = await api.getReports();
      if (res.success) {
        setReports(res.reports);
      }
    } catch (e) {
      console.warn('Initial data load warning:', e);
    }
  };

  const handleClassificationSelected = (item) => {
    setClassificationPreFill(item);
    setUserPoints(prev => prev + item.ecoPoints);
    setIsPickupOpen(true);
  };

  const handleReportCreated = (newReport) => {
    setReports(prev => [newReport, ...prev]);
    setUserPoints(prev => prev + 25);
    setActiveTab('home');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    if (user.ecoPoints) setUserPoints(user.ecoPoints);
    if (user.role === 'admin') {
      setActiveTab('admin');
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setActiveTab('home');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--main-background)' }}>
      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenPickup={() => { setClassificationPreFill(null); setIsPickupOpen(true); }}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAuth={(tab) => { setAuthTab(tab); setIsAuthOpen(true); }}
        onLogout={handleLogout}
        userPoints={userPoints}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px 20px 80px', maxWidth: 1300, width: '100%', margin: '0 auto' }}>
        {activeTab === 'home' && (
          <CitizenHome
            onOpenPickup={() => { setClassificationPreFill(null); setIsPickupOpen(true); }}
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
            onRequestPickup={() => { setClassificationPreFill(null); setIsPickupOpen(true); }}
          />
        )}

        {activeTab === 'catalog' && (
          <WasteCatalogView
            onOpenScanner={() => setIsScannerOpen(true)}
            onRequestPickup={() => { setClassificationPreFill(null); setIsPickupOpen(true); }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            onRefreshNeeded={fetchInitialData}
          />
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
          { id: 'admin', label: 'Admin', icon: BarChart3 }
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
                  transition: 'all 0.2s'
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
                transition: 'all 0.2s'
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
