import React, { useState, useEffect } from 'react';
import { 
  X, 
  Navigation,
  AlertCircle,
  Send
} from 'lucide-react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

const CATEGORIES = [
  { id: 'Plastic', label: 'Plastic', color: '#0284c7', icon: '♻️' },
  { id: 'Organic', label: 'Organic', color: '#16a34a', icon: '🍏' },
  { id: 'Electronic', label: 'Electronic', color: '#ca8a04', icon: '🔋' },
  { id: 'Medical', label: 'Medical', color: '#e11d48', icon: '🩺' },
  { id: 'Recyclable', label: 'Recyclable', color: '#059669', icon: '📦' },
  { id: 'Glass', label: 'Glass', color: '#0d9488', icon: '🍾' },
  { id: 'Metal', label: 'Metal', color: '#475569', icon: '🥫' }
];

export default function PickupRequestModal({ isOpen, onClose, onReportCreated, currentUser }) {
  const [category, setCategory] = useState('Plastic');
  const [subCategory, setSubCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('bags');
  
  // Dynamic Dates for next 7 days
  const [dateOptions, setDateOptions] = useState([]);
  const [selectedDateVal, setSelectedDateVal] = useState('');
  const [pickupTime, setPickupTime] = useState('07:00 AM - 09:00 AM');
  
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [geoNotice, setGeoNotice] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Generate dynamic date options on mount
  useEffect(() => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = dayNames[d.getDay()];
      const mName = monthNames[d.getMonth()];
      const dateNum = d.getDate();
      const label = i === 1 ? `Tomorrow (${dayName}, ${mName} ${dateNum})` : `${dayName}, ${mName} ${dateNum}`;
      days.push({
        label,
        value: d.toISOString().split('T')[0],
        dayName: label
      });
    }
    setDateOptions(days);
    if (days.length > 0) {
      setSelectedDateVal(days[0].value);
    }
  }, []);

  // Autofill user profile address if available
  useEffect(() => {
    if (currentUser?.address) {
      const parts = [];
      if (currentUser.address.street) parts.push(currentUser.address.street);
      if (currentUser.address.locality) parts.push(currentUser.address.locality);
      if (currentUser.address.city) parts.push(currentUser.address.city);
      if (currentUser.address.state) parts.push(currentUser.address.state);
      if (currentUser.address.zip) parts.push(currentUser.address.zip);
      if (parts.length > 0) {
        setAddress(parts.join(', '));
      }
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setGeoNotice('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(5));
        const longitude = Number(pos.coords.longitude.toFixed(5));
        setLat(latitude);
        setLng(longitude);
        setGeoNotice(`GPS Coordinates attached: (${latitude}, ${longitude})`);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        // Do NOT insert fallback coordinates when denied
        if (err.code === err.PERMISSION_DENIED) {
          setGeoNotice('Location access denied. Please type your Coimbatore address manually.');
        } else {
          setGeoNotice('Unable to acquire GPS location. Please enter your Coimbatore address manually.');
        }
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!address.trim()) {
      setError('Please provide a pickup street address.');
      setIsSubmitting(false);
      return;
    }

    const chosenOption = dateOptions.find(d => d.value === selectedDateVal);

    try {
      const payload = {
        category,
        subCategory: subCategory ? subCategory.trim() : `${category} waste items`,
        quantity: Number(quantity) || 1,
        unit,
        address: address.trim(),
        landmark: landmark.trim(),
        lat: lat || 11.0055,
        lng: lng || 76.9661,
        preferredDay: chosenOption ? chosenOption.dayName : 'Upcoming',
        preferredSlot: pickupTime,
        notes: notes.trim()
      };

      const res = await api.createReport(payload);
      if (res.success) {
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore confetti error if canvas is restricted
        }
        onReportCreated(res.report);
        onClose();
      } else {
        setError(res.message || 'Failed to submit pickup request to server.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while scheduling pickup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px 24px',
          position: 'relative',
          borderRadius: 24,
          boxShadow: '0 20px 48px rgba(22, 101, 52, 0.16)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
              Request Waste Pickup
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--secondary-text)', marginTop: 2 }}>
              Schedule curbside collection for your segregated waste materials.
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              color: 'var(--secondary-text)', 
              padding: 6, 
              borderRadius: '50%',
              background: 'transparent',
              cursor: 'pointer' 
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: '0.82rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Category Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 8 }}>
              Select Waste Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
              {CATEGORIES.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 14,
                      border: isSelected ? `2px solid ${cat.color}` : '1.5px solid var(--border-light)',
                      background: isSelected ? 'var(--pale-green-section)' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--primary-forest)' : 'var(--primary-text)' }}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory / Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 6 }}>
              Item Details / Subcategory
            </label>
            <input 
              type="text"
              placeholder="e.g. Crushed plastic bottles, cardboard boxes, vegetable peelings"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: 12,
                border: '1.5px solid var(--border-light)',
                fontSize: '0.86rem',
                background: '#ffffff',
                color: 'var(--primary-text)'
              }}
            />
          </div>

          {/* Quantity & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 6 }}>
                Quantity
              </label>
              <input 
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: 12,
                  border: '1.5px solid var(--border-light)',
                  fontSize: '0.86rem',
                  background: '#ffffff',
                  color: 'var(--primary-text)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 6 }}>
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: 12,
                  border: '1.5px solid var(--border-light)',
                  fontSize: '0.86rem',
                  background: '#ffffff',
                  color: 'var(--primary-text)'
                }}
              >
                <option value="bags">bags (standard)</option>
                <option value="kg">kg (weight)</option>
                <option value="items">items (units)</option>
              </select>
            </div>
          </div>

          {/* Preferred Date & Time Window */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 6 }}>
                Preferred Date
              </label>
              <select
                value={selectedDateVal}
                onChange={(e) => setSelectedDateVal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 12,
                  border: '1.5px solid var(--border-light)',
                  fontSize: '0.84rem',
                  background: '#ffffff',
                  color: 'var(--primary-text)'
                }}
              >
                {dateOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 6 }}>
                Time Window
              </label>
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 12,
                  border: '1.5px solid var(--border-light)',
                  fontSize: '0.84rem',
                  background: '#ffffff',
                  color: 'var(--primary-text)'
                }}
              >
                <option value="07:00 AM - 09:00 AM">07:00 AM - 09:00 AM (Morning IST)</option>
                <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Midday IST)</option>
                <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM (Afternoon IST)</option>
              </select>
            </div>
          </div>

          {/* Pickup Address & Geolocation */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase' }}>
                Pickup Address *
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: 'var(--primary-forest)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Navigation size={12} color="var(--secondary-green)" />
                <span>{isLocating ? 'Locating...' : 'Attach GPS Pin'}</span>
              </button>
            </div>

            <input 
              type="text"
              required
              placeholder="Door / Flat No., Street, Locality (e.g. 42 Cross Cut Rd, Gandhipuram)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: 12,
                border: '1.5px solid var(--border-light)',
                fontSize: '0.86rem',
                background: '#ffffff',
                color: 'var(--primary-text)'
              }}
            />

            {geoNotice && (
              <p style={{ fontSize: '0.74rem', color: lat ? 'var(--secondary-green)' : '#b45309', marginTop: 4 }}>
                {geoNotice}
              </p>
            )}
          </div>

          {/* Landmark */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 6 }}>
              Nearby Landmark (Optional)
            </label>
            <input 
              type="text"
              placeholder="e.g. Near Gandhipuram Bus Stand, Opp. VOC Park"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: 12,
                border: '1.5px solid var(--border-light)',
                fontSize: '0.86rem',
                background: '#ffffff',
                color: 'var(--primary-text)'
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 6 }}>
              Instructions for Driver (Optional)
            </label>
            <textarea 
              rows="2"
              placeholder="Special instructions for access, bin location, packaging..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: 12,
                border: '1.5px solid var(--border-light)',
                fontSize: '0.86rem',
                background: '#ffffff',
                color: 'var(--primary-text)'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1, padding: '10px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ flex: 2, padding: '10px' }}
            >
              <Send size={15} />
              <span>{isSubmitting ? 'Scheduling...' : 'Submit Pickup Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
