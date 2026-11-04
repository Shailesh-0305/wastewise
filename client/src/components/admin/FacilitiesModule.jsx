import React, { useState, useEffect, useCallback } from 'react';
import {
  Recycle, ShieldAlert, Plus, Edit3, Power, MapPin, Phone, Clock, CheckCircle2,
  Search, RefreshCw, Map as MapIcon, List, AlertTriangle, X, Building2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';
import {
  AdminPageHeader, StatusBadge, LoadingState, EmptyState, COIMBATORE_WARDS, COIMBATORE_LOCALITIES
} from './AdminSharedUI';

const RECYCLING_CENTRE_TYPES = [
  'Dry Waste Collection Centre',
  'Material Recovery Facility',
  'Scrap Dealer / Aggregator',
  'Plastic Recovery Unit',
  'Paper & Glass Drop-off',
  'Composting Unit'
];

const DISPOSAL_FACILITY_TYPES = [
  'E-Waste',
  'Battery Disposal',
  'Hazardous Waste',
  'Medical Waste Collection',
  'Composting',
  'Special Recovery Facility'
];

const VERIFICATION_STATUSES = [
  'Verified Municipal Facility',
  'Authorised Partner',
  'Pending Verification',
  'Unverified'
];

const OPERATIONAL_STATUSES = [
  'Operational',
  'Temporarily Closed',
  'Under Maintenance',
  'Decommissioned'
];

const ACCEPTED_MATERIAL_OPTIONS = [
  'Plastic', 'Paper', 'Glass', 'Metal', 'Organic', 'E-Waste', 'Battery', 'Hazardous', 'Medical', 'Textiles'
];

const COIMBATORE_MAP_VIEW_CENTER = [11.0168, 76.9558];

export default function FacilitiesModule({ initialTab = 'recycling-centres', toast }) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);
  const [viewMode, setViewMode] = useState('both'); // 'table' | 'map' | 'both'
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [showInactive, setShowInactive] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    locality: 'RS Puram',
    ward: 'Ward 24 - RS Puram',
    centreType: 'Dry Waste Collection Centre',
    facilityCategory: 'Recycling Centre',
    isDisposalFacility: false,
    acceptedMaterials: ['Plastic', 'Paper'],
    operatingHours: '9:00 AM - 6:00 PM',
    contactPhone: '',
    contactPerson: '',
    email: '',
    verificationStatus: 'Pending Verification',
    operationalStatus: 'Operational',
    capacityTonnesPerDay: '',
    handlingNotes: '',
    lat: '',
    lng: '',
    isActive: true
  });

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCenters({ includeInactive: 'true' });
      setFacilities(Array.isArray(data) ? data : []);
    } catch (err) {
      toast?.error(err.message || 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const openModal = (facility = null) => {
    const isDisposalMode = activeSubTab === 'disposal-facilities';
    if (facility) {
      const coords = facility.location?.coordinates || [];
      setEditingFacility(facility);
      setFormData({
        name: facility.name || '',
        address: facility.address || '',
        locality: facility.locality || 'RS Puram',
        ward: facility.ward || 'Ward 24 - RS Puram',
        centreType: facility.centreType || (isDisposalMode ? 'E-Waste' : 'Dry Waste Collection Centre'),
        facilityCategory: facility.facilityCategory || (isDisposalMode ? 'Disposal Facility' : 'Recycling Centre'),
        isDisposalFacility: Boolean(facility.isDisposalFacility || isDisposalMode),
        acceptedMaterials: Array.isArray(facility.acceptedMaterials) ? facility.acceptedMaterials : [],
        operatingHours: facility.operatingHours || '9:00 AM - 6:00 PM',
        contactPhone: facility.contactPhone || '',
        contactPerson: facility.contactPerson || '',
        email: facility.email || '',
        verificationStatus: facility.verificationStatus || 'Pending Verification',
        operationalStatus: facility.operationalStatus || 'Operational',
        capacityTonnesPerDay: facility.capacityTonnesPerDay ?? '',
        handlingNotes: facility.handlingNotes || '',
        lat: coords.length === 2 ? String(coords[1]) : '',
        lng: coords.length === 2 ? String(coords[0]) : '',
        isActive: facility.isActive !== false
      });
    } else {
      setEditingFacility(null);
      setFormData({
        name: '',
        address: '',
        locality: 'RS Puram',
        ward: 'Ward 24 - RS Puram',
        centreType: isDisposalMode ? 'E-Waste' : 'Dry Waste Collection Centre',
        facilityCategory: isDisposalMode ? 'Disposal Facility' : 'Recycling Centre',
        isDisposalFacility: isDisposalMode,
        acceptedMaterials: isDisposalMode ? ['E-Waste', 'Hazardous'] : ['Plastic', 'Paper', 'Glass', 'Metal'],
        operatingHours: '9:00 AM - 6:00 PM',
        contactPhone: '',
        contactPerson: '',
        email: '',
        verificationStatus: 'Pending Verification',
        operationalStatus: 'Operational',
        capacityTonnesPerDay: '',
        handlingNotes: '',
        lat: '',
        lng: '',
        isActive: true
      });
    }
    setModalOpen(true);
  };

  const toggleMaterial = (mat) => {
    setFormData((prev) => {
      const exists = prev.acceptedMaterials.includes(mat);
      const next = exists
        ? prev.acceptedMaterials.filter((m) => m !== mat)
        : [...prev.acceptedMaterials, mat];
      return { ...prev, acceptedMaterials: next };
    });
  };

  const handleSaveFacility = async (e) => {
    e.preventDefault();
    const latNum = Number(formData.lat);
    const lngNum = Number(formData.lng);

    if (
      formData.lat === '' ||
      formData.lng === '' ||
      !Number.isFinite(latNum) ||
      !Number.isFinite(lngNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lngNum < -180 ||
      lngNum > 180
    ) {
      toast?.error('Explicit, valid latitude (-90 to 90) and longitude (-180 to 180) are required. Coordinates never default to city centre.');
      return;
    }

    if (formData.acceptedMaterials.length === 0) {
      toast?.error('Please select at least one accepted waste material.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        lat: latNum,
        lng: lngNum,
        capacityTonnesPerDay: formData.capacityTonnesPerDay !== '' ? Number(formData.capacityTonnesPerDay) : undefined
      };

      if (editingFacility) {
        await api.updateCenter(editingFacility._id, payload);
        toast?.success('Facility updated successfully');
      } else {
        await api.createCenter(payload);
        toast?.success('Facility registered successfully');
      }
      setModalOpen(false);
      loadFacilities();
    } catch (err) {
      toast?.error(err.message || 'Failed to save facility');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (facility) => {
    try {
      await api.toggleCenterActive(facility._id);
      toast?.success(`Facility ${facility.isActive !== false ? 'deactivated' : 'activated'} successfully`);
      loadFacilities();
    } catch (err) {
      toast?.error(err.message || 'Failed to toggle facility status');
    }
  };

  // Filter based on activeSubTab
  const filteredFacilities = facilities.filter((f) => {
    const isDisposal =
      f.isDisposalFacility ||
      f.facilityCategory === 'Disposal Facility' ||
      f.facilityCategory === 'Integrated Facility' ||
      DISPOSAL_FACILITY_TYPES.includes(f.centreType);

    if (activeSubTab === 'disposal-facilities' && !isDisposal) return false;
    if (activeSubTab === 'recycling-centres' && f.facilityCategory === 'Disposal Facility' && !f.acceptedMaterials?.some((m) => ['Plastic', 'Paper', 'Glass', 'Metal'].includes(m))) {
      // Pure disposal facility shown primarily in disposal tab unless integrated
      return false;
    }

    if (!showInactive && f.isActive === false) return false;
    if (typeFilter && f.centreType !== typeFilter) return false;
    if (verificationFilter && f.verificationStatus !== verificationFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        f.name?.toLowerCase().includes(q) ||
        f.locality?.toLowerCase().includes(q) ||
        f.ward?.toLowerCase().includes(q) ||
        f.address?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const mappableFacilities = filteredFacilities.filter((f) => {
    const coords = f.location?.coordinates;
    return Array.isArray(coords) && coords.length === 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1]);
  });

  const typeOptions = activeSubTab === 'disposal-facilities' ? DISPOSAL_FACILITY_TYPES : RECYCLING_CENTRE_TYPES;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={
          activeSubTab === 'disposal-facilities'
            ? 'Special Disposal & Treatment Facilities'
            : 'Coimbatore Recycling Centres Directory'
        }
        subtitle={
          activeSubTab === 'disposal-facilities'
            ? 'Manage hazardous, e-waste, biomedical, battery, and composting facilities with explicit municipal verification statuses.'
            : 'Manage public recycling drop-off centres, material recovery facilities (MRFs), and verified coordinates across Coimbatore.'
        }
        actions={
          <>
            <button
              onClick={loadFacilities}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} /> {activeSubTab === 'disposal-facilities' ? 'Add Disposal Facility' : 'Add Recycling Centre'}
            </button>
          </>
        }
      />

      {/* Sub-navigation & View Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setActiveSubTab('recycling-centres'); setTypeFilter(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'recycling-centres' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Recycle size={15} /> Recycling Centres
          </button>
          <button
            onClick={() => { setActiveSubTab('disposal-facilities'); setTypeFilter(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'disposal-facilities' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert size={15} /> Special Disposal Facilities
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'both' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Split View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            <List size={13} /> Table
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'map' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            <MapIcon size={13} /> Map
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by facility name, locality (e.g. RS Puram, Peelamedu), ward..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50/60"
        >
          <option value="">All Facility Types</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={verificationFilter}
          onChange={(e) => setVerificationFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50/60"
        >
          <option value="">All Verification Statuses</option>
          {VERIFICATION_STATUSES.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
          />
          Show Deactivated
        </label>
      </div>

      {/* Verification Integrity Notice for Disposal Facilities */}
      {activeSubTab === 'disposal-facilities' && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Municipal Verification Policy:</strong> Only facilities explicitly marked as{' '}
            <span className="font-bold underline">Verified Municipal Facility</span> or{' '}
            <span className="font-bold underline">Authorised Partner</span> are endorsed by Coimbatore Corporation. Unverified or Pending facilities are clearly flagged and never represented as authorised municipal endpoints.
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState label="Loading Coimbatore facilities..." />
      ) : (
        <div className="space-y-6">
          {/* Map View */}
          {(viewMode === 'map' || viewMode === 'both') && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Verified Facility Coordinates ({mappableFacilities.length} plotted)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">
                  Default map viewport: Coimbatore (11.0168° N, 76.9558° E)
                </span>
              </div>
              <div className="h-[340px] w-full relative z-0">
                <MapContainer
                  center={COIMBATORE_MAP_VIEW_CENTER}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {mappableFacilities.map((f) => {
                    const [lng, lat] = f.location.coordinates;
                    return (
                      <Marker key={f._id} position={[lat, lng]}>
                        <Popup>
                          <div className="space-y-1 text-xs">
                            <p className="font-bold text-slate-900">{f.name}</p>
                            <p className="text-slate-600">{f.locality} • {f.centreType}</p>
                            <p className="text-[11px] font-semibold text-emerald-800">{f.verificationStatus}</p>
                            <p className="text-[11px] text-slate-500">{f.operatingHours}</p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </div>
          )}

          {/* Table View */}
          {(viewMode === 'table' || viewMode === 'both') && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {filteredFacilities.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No matching facilities found"
                  description="Add a new recycling centre or disposal facility with verified Coimbatore coordinates."
                  action={
                    <button
                      onClick={() => openModal()}
                      className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold"
                    >
                      Add First Facility
                    </button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4">Facility & Locality</th>
                        <th className="py-3.5 px-4">Type & Category</th>
                        <th className="py-3.5 px-4">Accepted Materials</th>
                        <th className="py-3.5 px-4">Verification & Status</th>
                        <th className="py-3.5 px-4">Coordinates & Contact</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredFacilities.map((f) => {
                        const coords = f.location?.coordinates || [];
                        return (
                          <tr key={f._id} className={`hover:bg-slate-50/70 transition-colors ${f.isActive === false ? 'opacity-60 bg-slate-50/40' : ''}`}>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{f.name}</div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                {f.locality || 'Coimbatore'} {f.ward ? `• ${f.ward}` : ''}
                              </div>
                              <div className="text-slate-400 text-[11px] truncate max-w-xs">{f.address}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {f.centreType || 'Dry Waste Collection Centre'}
                              </span>
                              <div className="text-[11px] text-slate-500 mt-1">
                                {f.facilityCategory || 'Recycling Centre'}
                                {f.capacityTonnesPerDay ? ` • ${f.capacityTonnesPerDay} T/day` : ''}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(f.acceptedMaterials || []).map((mat) => (
                                  <span
                                    key={mat}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]"
                                  >
                                    {mat}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col items-start gap-1">
                                <StatusBadge status={f.verificationStatus || 'Verified Municipal Facility'} />
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <StatusBadge status={f.operationalStatus || 'Operational'} />
                                  {f.isActive === false && <StatusBadge status="Inactive" />}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-slate-600">
                              {coords.length === 2 ? (
                                <div className="font-mono text-slate-700">
                                  {Number(coords[1]).toFixed(4)}°N, {Number(coords[0]).toFixed(4)}°E
                                </div>
                              ) : (
                                <span className="text-amber-700 font-semibold">No GPS Coordinates</span>
                              )}
                              <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                                <Clock size={11} /> {f.operatingHours || '9:00 AM - 6:00 PM'}
                              </div>
                              {f.contactPhone && (
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Phone size={11} /> {f.contactPhone}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => openModal(f)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                                  title="Edit Facility"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => handleToggleActive(f)}
                                  className={`p-1.5 rounded-lg border ${
                                    f.isActive === false
                                      ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                      : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                  }`}
                                  title={f.isActive === false ? 'Reactivate Facility' : 'Deactivate Facility'}
                                >
                                  <Power size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Facility Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingFacility ? 'Edit Facility Details' : 'Register Coimbatore Facility'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Requires explicit GPS coordinates and accurate municipal verification status.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFacility} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Facility Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. RS Puram Dry Waste Collection Centre"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Facility Category *</label>
                  <select
                    value={formData.facilityCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setFormData({
                        ...formData,
                        facilityCategory: cat,
                        isDisposalFacility: cat === 'Disposal Facility' || cat === 'Integrated Facility'
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Recycling Centre">Recycling Centre</option>
                    <option value="Disposal Facility">Disposal Facility</option>
                    <option value="Integrated Facility">Integrated Facility (Both)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specific Facility Type *</label>
                  <select
                    value={formData.centreType}
                    onChange={(e) => setFormData({ ...formData, centreType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {[...RECYCLING_CENTRE_TYPES, ...DISPOSAL_FACILITY_TYPES].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Locality *</label>
                  <input
                    type="text"
                    list="cbe-localities-list"
                    required
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <datalist id="cbe-localities-list">
                    {COIMBATORE_LOCALITIES.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Ward</label>
                  <select
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {COIMBATORE_WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, landmark, Coimbatore, Tamil Nadu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {/* Explicit GPS Coordinates */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Explicit GPS Coordinates Required *</span>
                  <span className="text-[11px] text-emerald-700">Coimbatore region: ~10.90°N–11.15°N, 76.85°E–77.10°E</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Latitude (-90 to 90) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      placeholder="e.g. 11.0085"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Longitude (-180 to 180) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                      placeholder="e.g. 76.9511"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Accepted Materials */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Accepted Waste Streams *</label>
                <div className="flex flex-wrap gap-2">
                  {ACCEPTED_MATERIAL_OPTIONS.map((mat) => {
                    const selected = formData.acceptedMaterials.includes(mat);
                    return (
                      <button
                        type="button"
                        key={mat}
                        onClick={() => toggleMaterial(mat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          selected
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {selected && <CheckCircle2 size={12} />}
                        {mat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Verification & Operational Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Verification Status *</label>
                  <select
                    value={formData.verificationStatus}
                    onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {VERIFICATION_STATUSES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operational Status *</label>
                  <select
                    value={formData.operationalStatus}
                    onChange={(e) => setFormData({ ...formData, operationalStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {OPERATIONAL_STATUSES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacity (Tonnes/Day)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.capacityTonnesPerDay}
                    onChange={(e) => setFormData({ ...formData, capacityTonnesPerDay: e.target.value })}
                    placeholder="e.g. 25"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Contact & Operating Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={formData.operatingHours}
                    onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                    placeholder="9:00 AM - 6:00 PM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91 422 239 0261"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supervisor / Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Facility Officer Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-800 text-white font-semibold hover:bg-emerald-900 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingFacility ? 'Update Facility' : 'Register Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
