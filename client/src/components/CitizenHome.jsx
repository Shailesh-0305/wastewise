import React, { useState, useEffect, useCallback } from 'react';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  BookOpen, 
  Search, 
  ArrowRight, 
  PlusCircle,
  LogIn,
  Megaphone,
  MessageSquareWarning,
  X
} from 'lucide-react';
import LiveTrackingCard from './LiveTrackingCard';
import { ForestSilhouettes, FloatingLeaf } from './NatureDecorations';
import { api } from '../services/api';

const SERVICES = [
  { id: 'pickup', title: 'Pickup Request', icon: Truck, desc: 'Schedule doorstep waste collection' },
  { id: 'centres', title: 'Recycling Centres', icon: MapPin, desc: 'Find nearby municipal drop-off stations' },
  { id: 'schedule', title: 'Collection Schedule', icon: Calendar, desc: 'View calendar rounds and dates' },
  { id: 'guide', title: 'Waste Guide', icon: BookOpen, desc: 'Material segregation & resin guide' }
];

const RECYCLING_MATERIALS = [
  { name: 'Plastic', img: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=400&q=80', badge: 'High Yield', desc: 'Bottles, jugs & clean containers' },
  { name: 'Organic', img: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80', badge: 'Compostable', desc: 'Food scraps, peelings & leaves' },
  { name: 'Electronic', img: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=400&q=80', badge: 'Hazardous Stream', desc: 'Batteries, cables & old gadgets' },
  { name: 'Glass', img: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=400&q=80', badge: 'Recyclable', desc: 'Jars, beverage & sauce bottles' },
  { name: 'Metal', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80', badge: 'Infinite Cycle', desc: 'Tin cans, foil & metal caps' }
];

const COMPLAINT_CATEGORIES = [
  'Overflowing Public Bins',
  'Missed Garbage Collection',
  'Illegal Dumping',
  'Waste Left in Public Spaces',
  'Damaged Waste Collection Infrastructure',
  'Uncollected Hazardous Waste',
  'Other Sanitation Issues'
];

export default function CitizenHome({ 
  onOpenPickup, 
  onNavigateCentres, 
  onNavigateSchedule, 
  onNavigateCatalog, 
  onOpenAuth,
  reports = [], 
  userPoints = 0,
  currentUser
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintFeedback, setComplaintFeedback] = useState('');
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    category: 'Overflowing Public Bins',
    description: '',
    ward: 'Ward 24 - RS Puram',
    locality: currentUser?.address?.locality || 'RS Puram',
    address: currentUser?.address?.street || 'RS Puram, Coimbatore'
  });

  const latestReport = reports[0];

  const loadCommunityUpdates = useCallback(async () => {
    try {
      const [campRes, compRes] = await Promise.all([
        api.getCampaigns(),
        currentUser ? api.getComplaints() : Promise.resolve([])
      ]);
      const campList = Array.isArray(campRes) ? campRes : campRes?.campaigns || [];
      const compList = Array.isArray(compRes) ? compRes : compRes?.complaints || [];
      setCampaigns(campList.slice(0, 4));
      setMyComplaints(compList.slice(0, 4));
    } catch {
      // Non-blocking for citizen home
    }
  }, [currentUser]);

  useEffect(() => {
    loadCommunityUpdates();
  }, [loadCommunityUpdates]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigateCatalog(searchQuery.trim());
    } else {
      onNavigateCatalog();
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setSubmittingComplaint(true);
    setComplaintFeedback('');
    try {
      await api.createComplaint(complaintForm);
      setComplaintModalOpen(false);
      setComplaintForm({
        title: '',
        category: 'Overflowing Bin',
        description: '',
        ward: 'Ward 24 - RS Puram',
        locality: currentUser?.address?.locality || 'RS Puram',
        address: currentUser?.address?.street || ''
      });
      setComplaintFeedback('Your civic sanitation issue has been submitted to Coimbatore Municipal Operations.');
      loadCommunityUpdates();
    } catch (err) {
      setComplaintFeedback(err.message || 'Failed to submit complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const getUserLocationText = () => {
    if (!currentUser) return null;
    const parts = [];
    if (currentUser.address?.street) parts.push(currentUser.address.street);
    if (currentUser.address?.locality) parts.push(currentUser.address.locality);
    parts.push(currentUser.address?.city || 'Coimbatore');
    parts.push(currentUser.address?.state || 'Tamil Nadu');
    return parts.join(', ');
  };

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 26 }}>
      {/* Nature-Inspired Pale Green Header Section */}
      <div 
        className="pale-green-box"
        style={{
          padding: '32px 30px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <ForestSilhouettes opacity={0.16} height={140} />
        <FloatingLeaf size={32} top={18} right={24} rotate={20} opacity={0.25} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* User Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#ffffff',
                border: '2.5px solid var(--soft-leaf-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-forest)',
                fontSize: '1.25rem',
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'W'}
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-text)', letterSpacing: '-0.3px' }}>
                  {currentUser ? `Hello, ${currentUser.name}` : 'Welcome to WasteWise'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--secondary-text)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  {currentUser ? (
                    <>
                      <MapPin size={13} color="var(--secondary-green)" />
                      <span>{getUserLocationText()}</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={13} color="var(--secondary-green)" />
                      <span>Coimbatore, Tamil Nadu · Municipal Waste Portal</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Account Status / Eco-Points Card */}
            {currentUser ? (
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #d4ebd6',
                borderRadius: 18,
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 2px 10px rgba(22, 101, 52, 0.05)'
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--secondary-text)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    Eco Points Balance
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
                    {userPoints.toLocaleString()} <span style={{ fontSize: '0.78rem', color: 'var(--secondary-green)', fontWeight: 600 }}>pts</span>
                  </div>
                </div>
                <div style={{ borderLeft: '1.5px solid var(--border-light)', paddingLeft: 14 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--secondary-text)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    Account Role
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary-text)', textTransform: 'capitalize' }}>
                    {currentUser.role}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #d4ebd6',
                borderRadius: 18,
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 2px 10px rgba(22, 101, 52, 0.05)'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)', fontWeight: 600 }}>
                    Sign in to track pickups & earn points
                  </div>
                </div>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  <LogIn size={13} /> Sign In
                </button>
              </div>
            )}
          </div>

          {/* Functional Search & Action Bar */}
          <form 
            onSubmit={handleSearchSubmit}
            style={{
              background: '#ffffff',
              borderRadius: 999,
              padding: '6px 8px 6px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              border: '1.5px solid #d4ebd6',
              boxShadow: '0 4px 14px rgba(22, 101, 52, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <Search size={18} color="var(--secondary-green)" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recyclable materials, guidelines, or Coimbatore municipal rounds..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '0.88rem',
                  color: 'var(--primary-text)'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {searchQuery && (
                <button
                  type="submit"
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                >
                  Search Guide
                </button>
              )}
              <button
                type="button"
                onClick={onOpenPickup}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.84rem' }}
              >
                <PlusCircle size={15} />
                <span>Book Collection</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Services Grid (4 Functional Working Cards) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--primary-text)' }}>
            Waste Management Services
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>
            Request doorstep waste collection, monitor status updates, and locate nearby recycling centres.
          </span>
        </div>

        <div className="grid-4">
          {SERVICES.map(svc => {
            const Icon = svc.icon;
            const handleClick = () => {
              if (svc.id === 'pickup') onOpenPickup();
              else if (svc.id === 'centres') onNavigateCentres();
              else if (svc.id === 'schedule') onNavigateSchedule();
              else if (svc.id === 'guide') onNavigateCatalog();
            };

            return (
              <button
                key={svc.id}
                onClick={handleClick}
                className="card"
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '20px',
                  background: '#ffffff'
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'var(--pale-green-section)',
                  border: '1.5px solid #d4ebd6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-forest)'
                }}>
                  <Icon size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                    {svc.title}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', marginTop: 2 }}>
                    {svc.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Tracking Section for Most Recent Active Report */}
      {latestReport && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary-green)' }} />
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                Active Collection Tracking
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary-forest)' }}>
              Tracking ID: {latestReport.trackingId}
            </span>
          </div>

          <LiveTrackingCard activeReport={latestReport} />
        </div>
      )}

      {/* Community Campaigns & Civic Issue Reporting Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Municipal Campaigns */}
        <div className="card" style={{ padding: 20, background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Megaphone size={18} color="var(--primary-forest)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                Coimbatore Campaigns & Notices
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--secondary-green)' }}>
              CCMC Updates
            </span>
          </div>
          {campaigns.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--secondary-text)', padding: '16px 0' }}>
              No active ward announcements or clean-up campaigns at the moment.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {campaigns.map((camp) => (
                <div
                  key={camp._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'var(--pale-green-section)',
                    border: '1px solid #d4ebd6'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-forest)', textTransform: 'uppercase' }}>
                      {camp.campaignType} • {camp.ward}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--secondary-text)' }}>
                      {camp.startDate ? new Date(camp.startDate).toLocaleDateString('en-IN') : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-text)', marginTop: 3 }}>
                    {camp.title}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', marginTop: 2 }}>
                    {camp.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Civic Issue Reporting & Status */}
        <div className="card" style={{ padding: 20, background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquareWarning size={18} color="var(--primary-forest)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                  Civic Sanitation Issues
                </h3>
              </div>
              <button
                onClick={() => setComplaintModalOpen(true)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.76rem' }}
              >
                + Report Street Issue
              </button>
            </div>

            {complaintFeedback && (
              <div style={{ padding: '10px 12px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.78rem', marginBottom: 10 }}>
                {complaintFeedback}
              </div>
            )}

            {myComplaints.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--secondary-text)', padding: '16px 0' }}>
                Spot an overflowing community bin, missed street sweep, or illegal dumping in Coimbatore? Report it directly to ward supervisors.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myComplaints.map((c) => (
                  <div
                    key={c._id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary-text)' }}>{c.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>
                        {c.category} • {c.locality}
                        {c.resolutionNotes ? ` — Resolved: ${c.resolutionNotes}` : ''}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: 999,
                      background: c.status === 'Resolved' ? '#dcfce7' : '#fef3c7',
                      color: c.status === 'Resolved' ? '#166534' : '#92400e'
                    }}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accepted Recycling Materials Carousel */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--primary-text)' }}>
              Segregation & Recycling Materials
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>
              Separate your waste at home into these verified municipal categories
            </p>
          </div>
          <button
            onClick={() => onNavigateCatalog()}
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--primary-forest)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>Full Waste Guide</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: 16
        }}>
          {RECYCLING_MATERIALS.map(mat => (
            <div
              key={mat.name}
              onClick={() => onNavigateCatalog(mat.name)}
              className="card"
              style={{
                cursor: 'pointer',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <div style={{ height: 110, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                <img
                  src={mat.img}
                  alt={mat.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  className={`badge badge-${mat.name.toLowerCase()}`}
                  style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.7rem' }}
                >
                  {mat.badge}
                </span>
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                  {mat.name}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', marginTop: 2 }}>
                  {mat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Street Sanitation Issue Modal */}
      {complaintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Report Coimbatore Sanitation Issue</h3>
              <button onClick={() => setComplaintModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateComplaint} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Summary *</label>
                <input
                  type="text"
                  required
                  value={complaintForm.title}
                  onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                  placeholder="e.g. Overflowing bin on DB Road"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Category *</label>
                <select
                  value={complaintForm.category}
                  onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {COMPLAINT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Locality *</label>
                  <input
                    type="text"
                    required
                    value={complaintForm.locality}
                    onChange={(e) => setComplaintForm({ ...complaintForm, locality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Street Landmark</label>
                  <input
                    type="text"
                    value={complaintForm.address}
                    onChange={(e) => setComplaintForm({ ...complaintForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Details *</label>
                <textarea
                  rows={3}
                  required
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  placeholder="Describe the issue location and condition..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setComplaintModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="px-5 py-2 rounded-xl bg-emerald-800 text-white font-semibold hover:bg-emerald-900"
                >
                  {submittingComplaint ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
