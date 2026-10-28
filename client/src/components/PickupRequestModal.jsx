import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Package, 
  CheckCircle, 
  Navigation,
  FileText,
  AlertCircle
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

export default function PickupRequestModal({ isOpen, onClose, initialData = null, onReportCreated }) {
  const [category, setCategory] = useState(initialData?.category || 'Plastic');
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || '');
  const [packageSize, setPackageSize] = useState('Medium');
  const [quantity, setQuantity] = useState(2);
  const [unit, setUnit] = useState('bags');
  const [pickupDay, setPickupDay] = useState('Tomorrow (Thu)');
  const [pickupTime, setPickupTime] = useState('07:00 AM - 09:00 AM');
  const [address, setAddress] = useState('Jl. Siliwangi No. 12, Buffalo, NY');
  const [landmark, setLandmark] = useState('Near Green Park Gate No. 2');
  const [lat, setLat] = useState(40.8448);
  const [lng, setLng] = useState(-73.8648);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      if (initialData.category) setCategory(initialData.category);
      if (initialData.subCategory) setSubCategory(initialData.subCategory);
    }
  }, [initialData]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(4)));
          setLng(Number(pos.coords.longitude.toFixed(4)));
          setAddress(`Current GPS Pin (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
        },
        () => {
          // Default Buffalo coords if permission denied
          setLat(40.8448);
          setLng(-73.8648);
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        category,
        subCategory: subCategory || `${category} segregated recyclables`,
        quantity: Number(quantity),
        unit,
        address,
        landmark,
        lat,
        lng,
        imageUrl: initialData?.imageUrl || '',
        aiClassification: {
          detectedCategory: category,
          confidence: 0.96,
          estimatedCO2Grams: initialData?.co2Grams || (category === 'Plastic' ? 120 : 300),
          ecoPointsEarned: initialData?.ecoPoints || (category === 'Plastic' ? 25 : 40)
        },
        preferredDay: pickupDay,
        preferredSlot: pickupTime,
        notes
      };

      const res = await api.createReport(payload);
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 }
        });
        onReportCreated(res.report);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit pickup request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div style={{
        background: '#ffffff',
        borderRadius: 28,
        width: '100%',
        maxWidth: 520,
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh'
      }}>
        {/* Header (Matches Image 3 Screen 3) */}
        <div style={{
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b4332' }}>
              Pickup and Pack
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Schedule collection with WasteWise eco-couriers
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#b91c1c',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Waste Category Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
              Select Waste Category:
            </label>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                    border: category === cat.id ? `2px solid ${cat.color}` : '1.5px solid #e2e8f0',
                    background: category === cat.id ? `${cat.color}15` : '#ffffff',
                    color: category === cat.id ? cat.color : '#475569',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pickup Day & Time (Image 3 fields) */}
          <div className="grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Pickup Day
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={pickupDay}
                  onChange={(e) => setPickupDay(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}
                >
                  <option value="Today">Today (Urgent)</option>
                  <option value="Tomorrow (Thu)">Tomorrow (Thursday)</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Monday">Next Monday</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Pickup Time
              </label>
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#1e293b'
                }}
              >
                <option value="07:00 AM - 09:00 AM">07:00 AM - 09:00 AM</option>
                <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM</option>
              </select>
            </div>
          </div>

          {/* Package Size & Quantity (Image 3 & 4) */}
          <div className="grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Package Size
              </label>
              <select
                value={packageSize}
                onChange={(e) => setPackageSize(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#1e293b'
                }}
              >
                <option value="Small">Small (Max 2 kg)</option>
                <option value="Medium">Medium (3 - 8 kg)</option>
                <option value="Large">Large (8+ kg / Bulk)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Quantity
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{
                    width: '65%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{
                    width: '35%',
                    padding: '10px',
                    borderRadius: 12,
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '0.88rem',
                    fontWeight: 600
                  }}
                >
                  <option value="bags">bags</option>
                  <option value="kg">kg</option>
                  <option value="items">items</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pickup Location with Address & GPS (Image 3) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                Pickup Location
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                style={{
                  fontSize: '0.75rem',
                  color: '#15803d',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Navigation size={12} /> Use GPS Location
              </button>
            </div>
            
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: 14,
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8
            }}>
              <MapPin size={20} color="#15803d" style={{ flexShrink: 0 }} />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address or location..."
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#1e293b'
                }}
              />
            </div>

            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Location Detail (optional landmark / gate / floor)..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1.5px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '0.82rem'
              }}
            />
          </div>

          {/* Notes / Special Instructions */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Special Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleaned & crushed cans, left near front porch"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1.5px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '0.82rem'
              }}
            />
          </div>

          {/* Confirm Button (Image 3 green CTA button) */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '1rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              marginTop: 10
            }}
          >
            {isSubmitting ? 'Scheduling Pickup...' : 'CONFIRM PICKUP'}
          </button>
        </form>
      </div>
    </div>
  );
}
