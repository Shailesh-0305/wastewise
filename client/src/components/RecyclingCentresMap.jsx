import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  Filter, 
  Check, 
  Plus, 
  Star,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';

// Dark Mode Custom Pins
const createCentreIcon = (name, isSelected) => {
  return new L.DivIcon({
    className: 'custom-centre-pin',
    html: `<div style="
      background: ${isSelected ? '#22c55e' : '#18221f'};
      color: ${isSelected ? '#0b291a' : '#f0fdf4'};
      border: 2px solid ${isSelected ? '#ffffff' : '#22c55e'};
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 4px 14px ${isSelected ? 'rgba(34,197,94,0.6)' : 'rgba(0,0,0,0.5)'};
      display: flex;
      align-items: center;
      gap: 4px;
      transform: translate(-50%, -50%);
    ">
      <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${isSelected ? '#0b291a' : '#22c55e'};"></span>
      ${name}
    </div>`,
    iconSize: [120, 30],
    iconAnchor: [60, 15]
  });
};

export default function RecyclingCentresMap() {
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('All');
  const [travelMode, setTravelMode] = useState('drive'); // 'walk', 'bike', 'drive'
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

  // User starting coords (simulated Buffalo / NY district)
  const userCoords = [40.8520, -73.8790];
  const targetCoords = activeCentre ? [activeCentre.coordinates.lat, activeCentre.coordinates.lng] : userCoords;

  // Glowing Route Line between user and selected station (Image 2 style)
  const routePoints = [
    userCoords,
    [userCoords[0] + 0.003, userCoords[1] + 0.004],
    [userCoords[0] - 0.002, userCoords[1] + 0.008],
    targetCoords
  ];

  return (
    <div style={{
      background: '#111816',
      borderRadius: 24,
      overflow: 'hidden',
      color: '#f0fdf4',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      border: '1px solid #202e28'
    }}>
      {/* Top Search & Transit Mode Bar (Direct Replica of Image 2) */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #1f2d27',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#18221f',
          border: '1px solid #273832',
          padding: '8px 16px',
          borderRadius: 999,
          width: 320
        }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="New York Recycling..."
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.88rem',
              width: '100%'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: '#94a3b8', fontSize: '0.8rem' }}>✕</button>
          )}
        </div>

        {/* Transit Mode Selectors (Matches Image 2: 20 Min Walk | 10 Min Bike | 5 Min Drive) */}
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
                padding: '8px 16px',
                borderRadius: 999,
                fontSize: '0.82rem',
                fontWeight: 700,
                background: travelMode === mode.id ? '#22c55e' : '#18221f',
                color: travelMode === mode.id ? '#0b291a' : '#94a3b8',
                border: travelMode === mode.id ? '1px solid #22c55e' : '1px solid #273832',
                transition: 'all 0.2s'
              }}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Material Filter Tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {['All', 'Organic', 'Plastic', 'Electronic', 'Medical'].map(mat => (
            <button
              key={mat}
              onClick={() => setSelectedMaterial(mat)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: '0.76rem',
                fontWeight: 600,
                background: selectedMaterial === mat ? '#273832' : 'transparent',
                color: selectedMaterial === mat ? '#4ade80' : '#64748b',
                border: selectedMaterial === mat ? '1px solid #4ade80' : '1px solid transparent'
              }}
            >
              {mat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map & Station Sidebar Container (Image 2 Layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', minHeight: 520 }}>
        {/* Left Sidebar with Selected Station & List */}
        <div style={{
          background: '#151d1a',
          borderRight: '1px solid #1f2d27',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: 600,
          overflowY: 'auto'
        }}>
          {activeCentre && (
            <div style={{
              background: '#18221f',
              border: '1px solid #273832',
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
                  background: 'rgba(0,0,0,0.7)',
                  padding: '3px 8px',
                  borderRadius: 999,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Star size={12} fill="#4ade80" /> {activeCentre.rating}
                </div>
              </div>

              {/* Station Title & Info */}
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f0fdf4' }}>
                  {activeCentre.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.78rem', marginTop: 4 }}>
                  <MapPin size={14} color="#4ade80" />
                  <span>{activeCentre.address}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.78rem', marginTop: 2 }}>
                  <Clock size={14} color="#4ade80" />
                  <span>{activeCentre.operatingHours}</span>
                </div>
              </div>

              {/* Accepted Materials tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {activeCentre.acceptedMaterials.map((mat, i) => (
                  <span
                    key={i}
                    style={{
                      background: '#22302b',
                      color: '#4ade80',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  >
                    {mat}
                  </span>
                ))}
              </div>

              {/* Action Buttons (Matches Image 2: "Choose This Center" + Call) */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => alert(`Center selected: ${activeCentre.name}. Route navigation activated!`)}
                  className="btn-mint"
                  style={{ flex: 1, padding: '12px', fontSize: '0.88rem' }}
                >
                  <Check size={16} /> Choose This Center
                </button>
                <a
                  href={`tel:${activeCentre.phone}`}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#22302b',
                    border: '1px solid #273832',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4ade80'
                  }}
                  title="Call Station"
                >
                  <Phone size={18} />
                </a>
              </div>
            </div>
          )}

          {/* Other Nearby Centers List (Matches Image 2 bottom left) */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>
              Nearby Stations:
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
                    background: selectedCentre?._id === c._id ? '#1e2d27' : '#18221f',
                    border: selectedCentre?._id === c._id ? '1.5px solid #22c55e' : '1px solid #273832',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f0fdf4', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {c.address}
                    </div>
                  </div>
                  <ChevronRight size={16} color="#64748b" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Leaflet Dark Map */}
        <div style={{ position: 'relative', height: '100%', minHeight: 520 }} className="dark-leaflet-tiles">
          <MapContainer
            center={targetCoords}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', background: '#0f1715' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Glowing Route Polyline */}
            <Polyline
              positions={routePoints}
              color="#22c55e"
              weight={5}
              opacity={0.85}
              dashArray="6, 8"
            />
            {filteredCentres.map(c => {
              const isSelected = selectedCentre?._id === c._id;
              return (
                <Marker
                  key={c._id}
                  position={[c.coordinates.lat, c.coordinates.lng]}
                  icon={createCentreIcon(c.name, isSelected)}
                  eventHandlers={{
                    click: () => setSelectedCentre(c)
                  }}
                >
                  <Popup>
                    <div style={{ color: '#111816', padding: 4 }}>
                      <strong>{c.name}</strong><br />
                      {c.address}<br />
                      <span style={{ color: '#15803d', fontWeight: 600 }}>{c.operatingHours}</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
