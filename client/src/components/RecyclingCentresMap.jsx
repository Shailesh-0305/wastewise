import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Phone, 
  ExternalLink, 
  Star, 
  ChevronRight,
  RotateCw,
  Navigation,
  AlertCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
    background: #0284c7;
    color: #ffffff;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #ffffff;
    box-shadow: 0 4px 12px rgba(2,132,199,0.35);
  ">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Map Controller for smooth fly-to repositioning
function MapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.flyTo(coords, 14, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

export default function RecyclingCentresMap() {
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('All');
  const [travelMode, setTravelMode] = useState('drive');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Optional User Geolocation
  const [userLocation, setUserLocation] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [locatingUser, setLocatingUser] = useState(false);

  const loadCentres = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedMaterial !== 'All') params.material = selectedMaterial;
      const res = await api.getCentres(params);
      if (res.success && Array.isArray(res.centres)) {
        setCentres(res.centres);
        if (res.centres.length > 0) {
          // Keep existing selection if still in filtered list, else select first
          setSelectedCentre(prev => {
            if (prev && res.centres.some(c => c._id === prev._id)) return prev;
            return res.centres[0];
          });
        } else {
          setSelectedCentre(null);
        }
      } else {
        setError(res.message || 'Failed to load recycling centres from server.');
      }
    } catch (e) {
      setError(e.message || 'Network error while connecting to recycling stations API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCentres();
  }, [selectedMaterial]);

  const handleRequestUserLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocatingUser(false);
      },
      (err) => {
        setLocatingUser(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission denied. You can still browse all centres on the map.');
        } else {
          setGeoError('Unable to retrieve your current location.');
        }
      },
      { timeout: 8000 }
    );
  };

  const filteredCentres = centres.filter(c => {
    const s = search.toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(s);
    const addrMatch = (c.address || '').toLowerCase().includes(s);
    const cityMatch = (c.city || '').toLowerCase().includes(s);
    return nameMatch || addrMatch || cityMatch;
  });

  const activeCentre = selectedCentre && filteredCentres.some(c => c._id === selectedCentre._id)
    ? selectedCentre
    : (filteredCentres[0] || null);

  // Default camera target: selected centre or first centre or fallback world coords
  const mapCenterCoords = activeCentre?.coordinates
    ? [activeCentre.coordinates.lat, activeCentre.coordinates.lng]
    : userLocation
    ? userLocation
    : [40.7589, -73.9851];

  const handleGetDirections = (centre) => {
    if (!centre || !centre.coordinates) return;
    const dest = `${centre.coordinates.lat},${centre.coordinates.lng}`;
    let dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    if (userLocation) {
      dirUrl += `&origin=${userLocation[0]},${userLocation[1]}`;
    }
    if (travelMode) {
      const modeParam = travelMode === 'walk' ? 'walking' : travelMode === 'bike' ? 'bicycling' : 'driving';
      dirUrl += `&travelmode=${modeParam}`;
    }
    window.open(dirUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 24,
      overflow: 'hidden',
      color: 'var(--primary-text)',
      boxShadow: 'var(--shadow-sm)',
      border: '1.5px solid var(--border-light)'
    }}>
      {/* Top Header & Filter Controls */}
      <div style={{
        padding: '24px 28px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--very-light-mint)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#ffffff',
              border: '1.5px solid var(--soft-leaf-green)',
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--primary-forest)',
              marginBottom: 6
            }}>
              <MapPin size={13} color="var(--secondary-green)" />
              <span>Certified Municipal Facilities</span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-text)' }}>
              Recycling Centres & Drop-Off Stations
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--secondary-text)', marginTop: 2 }}>
              Inspect authorized sorting points and obtain direct navigation directions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Optional Geolocation Trigger */}
            <button
              onClick={handleRequestUserLocation}
              disabled={locatingUser}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              title="Pin your location on the map"
            >
              <Navigation size={14} color={userLocation ? 'var(--secondary-green)' : 'currentColor'} />
              <span>{locatingUser ? 'Locating...' : userLocation ? 'Current Location Active' : 'Locate Me'}</span>
            </button>

            {/* Travel Mode Selector */}
            <div style={{
              display: 'flex',
              background: '#ffffff',
              border: '1.5px solid var(--border-light)',
              borderRadius: 999,
              padding: 3
            }}>
              {[
                { id: 'drive', label: '🚗 Drive' },
                { id: 'bike', label: '🚲 Cycle' },
                { id: 'walk', label: '🚶 Walk' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setTravelMode(mode.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    background: travelMode === mode.id ? 'var(--pale-green-section)' : 'transparent',
                    color: travelMode === mode.id ? 'var(--primary-forest)' : 'var(--secondary-text)',
                    transition: 'all 0.15s'
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {geoError && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            fontSize: '0.78rem',
            padding: '6px 14px',
            borderRadius: 10,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={14} />
            <span>{geoError}</span>
          </div>
        )}

        {/* Search & Material Tags Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#ffffff',
            border: '1.5px solid var(--border-light)',
            borderRadius: 999,
            padding: '7px 14px',
            minWidth: 260,
            flex: 1
          }}>
            <Search size={15} color="var(--secondary-green)" />
            <input
              type="text"
              placeholder="Search station by name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.84rem', color: 'var(--primary-text)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {ALL_MATERIALS.map(mat => (
              <button
                key={mat}
                onClick={() => setSelectedMaterial(mat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 999,
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  background: selectedMaterial === mat ? 'var(--pale-green-section)' : '#ffffff',
                  color: selectedMaterial === mat ? 'var(--primary-forest)' : 'var(--secondary-text)',
                  border: selectedMaterial === mat ? '1.5px solid var(--soft-leaf-green)' : '1px solid var(--border-light)',
                  whiteSpace: 'nowrap'
                }}
              >
                {mat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map & Station Sidebar Container (Responsive Grid) */}
      <div className="map-responsive-grid">
        {/* Left Sidebar with Selected Station & List */}
        <div style={{
          background: '#ffffff',
          borderRight: '1px solid var(--border-light)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: 600,
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--secondary-text)' }}>
              <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: 'var(--secondary-green)' }} />
              <p style={{ fontSize: '0.86rem', fontWeight: 600 }}>Loading recycling centres...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '30px 16px', background: '#fef2f2', borderRadius: 14, border: '1px solid #fecaca' }}>
              <AlertCircle size={24} color="#dc2626" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.86rem', fontWeight: 700, color: '#991b1b' }}>Could not load centres</p>
              <p style={{ fontSize: '0.76rem', color: '#7f1d1d', marginTop: 4 }}>{error}</p>
              <button
                onClick={loadCentres}
                className="btn-secondary"
                style={{ marginTop: 12, padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Retry
              </button>
            </div>
          ) : centres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--secondary-text)' }}>
              <MapPin size={28} color="var(--soft-leaf-green)" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--primary-text)' }}>No Centres in Database</h4>
              <p style={{ fontSize: '0.78rem', marginTop: 4 }}>No recycling centres have been registered in the system yet.</p>
            </div>
          ) : filteredCentres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--secondary-text)' }}>
              <Search size={24} color="var(--secondary-green)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary-text)' }}>No matching centres</p>
              <p style={{ fontSize: '0.76rem', marginTop: 4 }}>Try clearing your search query or selecting "All" materials.</p>
              <button
                onClick={() => { setSearch(''); setSelectedMaterial('All'); }}
                className="btn-secondary"
                style={{ marginTop: 10, padding: '6px 12px', fontSize: '0.78rem' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
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
                  {activeCentre.imageUrl && (
                    <div style={{ position: 'relative', height: 130, borderRadius: 14, overflow: 'hidden' }}>
                      <img
                        src={activeCentre.imageUrl}
                        alt={activeCentre.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {activeCentre.rating && (
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
                          gap: 4
                        }}>
                          <Star size={12} fill="var(--secondary-green)" color="var(--secondary-green)" /> {activeCentre.rating}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                      {activeCentre.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary-text)', fontSize: '0.78rem', marginTop: 4 }}>
                      <MapPin size={14} color="var(--secondary-green)" />
                      <span>{activeCentre.address}</span>
                    </div>
                    {activeCentre.operatingHours && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary-text)', fontSize: '0.78rem', marginTop: 2 }}>
                        <Clock size={14} color="var(--secondary-green)" />
                        <span>{activeCentre.operatingHours}</span>
                      </div>
                    )}
                  </div>

                  {Array.isArray(activeCentre.acceptedMaterials) && (
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
                  )}

                  {/* Functional Action Buttons */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => handleGetDirections(activeCentre)}
                      className="btn-primary"
                      style={{ flex: 1, padding: '9px', fontSize: '0.82rem' }}
                      title="Open turn-by-turn directions in Google Maps"
                    >
                      <ExternalLink size={14} /> Get Directions
                    </button>
                    {activeCentre.phone && (
                      <a
                        href={`tel:${activeCentre.phone}`}
                        style={{
                          width: 38,
                          height: 38,
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
                        <Phone size={15} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* All Stations List */}
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.5px' }}>
                  Available Stations ({filteredCentres.length})
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
                        background: activeCentre?._id === c._id ? 'var(--pale-green-section)' : '#ffffff',
                        border: activeCentre?._id === c._id ? '1.5px solid var(--soft-leaf-green)' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {c.imageUrl && (
                        <img
                          src={c.imageUrl}
                          alt={c.name}
                          style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
                        />
                      )}
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
            </>
          )}
        </div>

        {/* Interactive Leaflet Map */}
        <div style={{ position: 'relative', height: '100%', minHeight: 460 }}>
          <MapContainer
            center={mapCenterCoords}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapRecenter coords={mapCenterCoords} />

            {/* User Real Geolocation Pin (Rendered ONLY if user permitted) */}
            {userLocation && (
              <Marker position={userLocation} icon={userLocationIcon}>
                <Popup>
                  <div style={{ padding: 4 }}>
                    <strong style={{ color: '#0284c7' }}>Your Current Location</strong>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      Retrieved via browser GPS
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Actual Recycling Centres Markers from Database */}
            {filteredCentres.map(c => {
              if (!c.coordinates || typeof c.coordinates.lat !== 'number' || typeof c.coordinates.lng !== 'number') return null;
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
                      {c.operatingHours && (
                        <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600, marginTop: 4 }}>
                          🕒 {c.operatingHours}
                        </div>
                      )}
                      <button
                        onClick={() => handleGetDirections(c)}
                        style={{
                          marginTop: 8,
                          background: 'var(--primary-forest)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Get Directions ↗
                      </button>
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
