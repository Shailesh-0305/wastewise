import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Phone, 
  Check, 
  Star, 
  ChevronRight 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';

const ALL_MATERIALS = ['All', 'Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass'];

// Light Mode Custom Pin for Recycling Centres
const createCentreIcon = (name, isSelected) => {
  return new L.DivIcon({
    className: 'custom-centre-pin',
    html: `<div style="
      background: ${isSelected ? '#166534' : '#ffffff'};
      color: ${isSelected ? '#ffffff' : '#166534'};
      border: 2px solid ${isSelected ? '#ffffff' : '#166534'};
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 4px 12px ${isSelected ? 'rgba(22,101,52,0.35)' : 'rgba(0,0,0,0.1)'};
      display: flex;
      align-items: center;
      gap: 5px;
      transform: translate(-50%, -50%);
    ">
      <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:${isSelected ? '#86efac' : '#166534'};"></span>
      ${name}
    </div>`,
    iconSize: [120, 30],
    iconAnchor: [60, 15]
  });
};

const userLocationIcon = new L.DivIcon({
  className: 'custom-user-pin',
  html: `<div style="
    background: #15803d;
    color: #ffffff;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #ffffff;
    box-shadow: 0 4px 12px rgba(22,101,52,0.35);
  ">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

export default function RecyclingCentresMap() {
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('All');
  const [travelMode, setTravelMode] = useState('drive');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCentres();
  }, [selectedMaterial]);

  const loadCentres = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedMaterial !== 'All') params.material = selectedMaterial;
      const res = await api.getCentres(params);
      if (res.success) {
        setCentres(res.centres);
        if (res.centres.length > 0 && !selectedCentre) {
          setSelectedCentre(res.centres[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCentres = centres.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  const activeCentre = selectedCentre || filteredCentres[0];

  // User starting coords (Buffalo / NY district)
  const userCoords = [40.8520, -73.8790];
  const targetCoords = activeCentre ? [activeCentre.coordinates.lat, activeCentre.coordinates.lng] : userCoords;

  const routePoints = [
    userCoords,
    [userCoords[0] + 0.003, userCoords[1] + 0.004],
    [userCoords[0] - 0.002, userCoords[1] + 0.008],
    targetCoords
  ];

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 24,
      overflow: 'hidden',
      color: 'var(--primary-text)',
      boxShadow: 'var(--shadow-sm)',
      border: '1.5px solid var(--border-light)'
    }}>
      {/* Top Search & Transit Mode Bar */}
      <div style={{
        padding: '16px 22px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--very-light-mint)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#ffffff',
          border: '1.5px solid var(--border-light)',
          padding: '8px 16px',
          borderRadius: 999,
          width: 300
        }}>
          <Search size={16} color="var(--secondary-green)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recycling centres..."
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary-text)',
              fontSize: '0.86rem',
              width: '100%'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'var(--secondary-text)', fontSize: '0.8rem' }}>✕</button>
          )}
        </div>

        {/* Transit Mode Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[
            { id: 'walk', label: `${activeCentre?.distanceTimes?.walkMin || 20} Min`, icon: '🚶' },
            { id: 'bike', label: `${activeCentre?.distanceTimes?.bikeMin || 10} Min`, icon: '🚲' },
            { id: 'drive', label: `${activeCentre?.distanceTimes?.driveMin || 5} Min`, icon: '🚗' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setTravelMode(mode.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 999,
                fontSize: '0.82rem',
                fontWeight: 700,
                background: travelMode === mode.id ? 'var(--primary-forest)' : '#ffffff',
                color: travelMode === mode.id ? '#ffffff' : 'var(--primary-text)',
                border: travelMode === mode.id ? '1px solid var(--primary-forest)' : '1px solid var(--border-light)',
                transition: 'all 0.2s',
                boxShadow: travelMode === mode.id ? '0 2px 8px rgba(22,101,52,0.2)' : 'none'
              }}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Material Filter Tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {ALL_MATERIALS.map(mat => (
            <button
              key={mat}
              onClick={() => setSelectedMaterial(mat)}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: '0.76rem',
                fontWeight: 700,
                background: selectedMaterial === mat ? 'var(--pale-green-section)' : 'transparent',
                color: selectedMaterial === mat ? 'var(--primary-forest)' : 'var(--secondary-text)',
                border: selectedMaterial === mat ? '1.5px solid var(--soft-leaf-green)' : '1px solid transparent'
              }}
            >
              {mat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map & Station Sidebar Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', minHeight: 520 }}>
        {/* Left Sidebar with Selected Station & List */}
        <div style={{
          background: '#ffffff',
          borderRight: '1px solid var(--border-light)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: 580,
          overflowY: 'auto'
        }}>
          {activeCentre && (
            <div style={{
              background: 'var(--very-light-mint)',
              border: '1.5px solid var(--border-light)',
              borderRadius: 20,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              {/* Station Image */}
              <div style={{ position: 'relative', height: 140, borderRadius: 14, overflow: 'hidden' }}>
                <img
                  src={activeCentre.imageUrl}
                  alt={activeCentre.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(4px)',
                  padding: '3px 8px',
                  borderRadius: 999,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--primary-forest)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}>
                  <Star size={12} fill="var(--secondary-green)" color="var(--secondary-green)" /> {activeCentre.rating}
                </div>
              </div>

              {/* Station Info */}
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                  {activeCentre.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary-text)', fontSize: '0.78rem', marginTop: 4 }}>
                  <MapPin size={14} color="var(--secondary-green)" />
                  <span>{activeCentre.address}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary-text)', fontSize: '0.78rem', marginTop: 2 }}>
                  <Clock size={14} color="var(--secondary-green)" />
                  <span>{activeCentre.operatingHours}</span>
                </div>
              </div>

              {/* Accepted Materials tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {activeCentre.acceptedMaterials.map((mat, i) => (
                  <span
                    key={i}
                    className={`badge badge-${mat.toLowerCase()}`}
                    style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                  >
                    {mat}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => alert(`Station selected: ${activeCentre.name}. Navigation route plotted!`)}
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '0.84rem' }}
                >
                  <Check size={15} /> Select Station
                </button>
                <a
                  href={`tel:${activeCentre.phone}`}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '1.5px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-forest)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                  }}
                  title="Call Station"
                >
                  <Phone size={16} />
                </a>
              </div>
            </div>
          )}

          {/* Other Nearby Centers List */}
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.5px' }}>
              All Recycling Stations ({filteredCentres.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredCentres.map(c => (
                <div
                  key={c._id}
                  onClick={() => setSelectedCentre(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px',
                    borderRadius: 14,
                    background: selectedCentre?._id === c._id ? 'var(--pale-green-section)' : '#ffffff',
                    border: selectedCentre?._id === c._id ? '1.5px solid var(--soft-leaf-green)' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary-text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {c.address}
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--secondary-green)" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Leaflet Light Map */}
        <div style={{ position: 'relative', height: '100%', minHeight: 520 }}>
          <MapContainer
            center={targetCoords}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            {/* Standard Light OpenStreetMap Tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* User Location Marker */}
            <Marker position={userCoords} icon={userLocationIcon}>
              <Popup>
                <div style={{ padding: 4 }}>
                  <strong>Your Curbside Location</strong>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Buffalo, NY · Lake Star District</div>
                </div>
              </Popup>
            </Marker>

            {/* Recycling Centres Markers */}
            {filteredCentres.map(c => {
              const isSelected = activeCentre?._id === c._id;
              return (
                <Marker
                  key={c._id}
                  position={[c.coordinates.lat, c.coordinates.lng]}
                  icon={createCentreIcon(c.name.split(' ')[0], isSelected)}
                  eventHandlers={{
                    click: () => setSelectedCentre(c)
                  }}
                >
                  <Popup>
                    <div style={{ padding: 4 }}>
                      <strong style={{ color: '#166534' }}>{c.name}</strong>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{c.address}</div>
                      <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600, marginTop: 4 }}>
                        🕒 {c.operatingHours}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Soft Green Route Polyline */}
            {activeCentre && (
              <Polyline
                positions={routePoints}
                pathOptions={{
                  color: '#15803d',
                  weight: 4,
                  opacity: 0.85,
                  dashArray: '6, 8'
                }}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
