import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CitizenHome from './components/CitizenHome';
import RecyclingCentresMap from './components/RecyclingCentresMap';
import CollectionScheduleView from './components/CollectionScheduleView';
import WasteCatalogView from './components/WasteCatalogView';
import AdminDashboard from './components/AdminDashboard';
import WasteScannerModal from './components/WasteScannerModal';
import PickupRequestModal from './components/PickupRequestModal';
import { api } from './services/api';
import { Home, MapPin, Calendar, Sparkles, BarChart3, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeRole, setActiveRole] = useState('citizen');
  const [reports, setReports] = useState([]);
  const [userPoints, setUserPoints] = useState(1250);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [classificationPreFill, setClassificationPreFill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // When active role changes, auto-switch to relevant view for convenience
  useEffect(() => {
    if (activeRole === 'admin' || activeRole === 'driver') {
      setActiveTab('admin');
    } else {
      setActiveTab('home');
    }
  }, [activeRole]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await api.getReports();
      if (res.success) {
        setReports(res.reports);
      }
    } catch (e) {
      console.warn('Initial data load warning:', e);
    } finally {
      setLoading(false);
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f8f5' }}>
      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        onOpenPickup={() => { setClassificationPreFill(null); setIsPickupOpen(true); }}
        onOpenScanner={() => setIsScannerOpen(true)}
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
            activeRole={activeRole}
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

      {/* Floating Mobile Bottom Navigation (Image 1 & 4 replica) */}
      <div style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(27,67,50,0.12)',
        borderRadius: 999,
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        boxShadow: '0 8px 32px rgba(20,40,29,0.18)',
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
                  background: 'linear-gradient(135deg, #1b4332 0%, #22c55e 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -16,
                  boxShadow: '0 6px 16px rgba(34,197,94,0.4)',
                  transition: 'all 0.2s'
                }}
                title="Scan Waste with AI"
              >
                <Sparkles size={22} />
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
                color: isActive ? '#15803d' : '#64748b',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ fontSize: '0.66rem', fontWeight: isActive ? 800 : 500 }}>
                {btn.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* AI Waste-Image Classifier Modal (Image 1 Screen 3) */}
      <WasteScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectClassification={handleClassificationSelected}
      />

      {/* Pickup Request Modal (Image 3 & 4) */}
      <PickupRequestModal
        isOpen={isPickupOpen}
        onClose={() => setIsPickupOpen(false)}
        initialData={classificationPreFill}
        onReportCreated={handleReportCreated}
      />
    </div>
  );
}
