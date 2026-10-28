import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Leaf, 
  Award, 
  ArrowRight,
  Info
} from 'lucide-react';
import { classifyWasteImage } from '../services/aiClassifier';
import confetti from 'canvas-confetti';

const SAMPLE_PREVIEWS = [
  {
    name: 'Plastic Water Bottle',
    url: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=600&q=80',
    type: 'plastic'
  },
  {
    name: 'Rechargeable Batteries',
    url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80',
    type: 'battery'
  },
  {
    name: 'Organic Food Waste',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
    type: 'compost'
  },
  {
    name: 'Packaging Box',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
    type: 'paper'
  }
];

export default function WasteScannerModal({ isOpen, onClose, onSelectClassification }) {
  const [selectedImage, setSelectedImage] = useState(SAMPLE_PREVIEWS[0].url);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  // Trigger classification when image changes
  useEffect(() => {
    if (isOpen && selectedImage) {
      handleScan(selectedImage);
    }
  }, [isOpen, selectedImage]);

  const handleScan = async (imageSrc) => {
    setIsScanning(true);
    setResult(null);
    try {
      const res = await classifyWasteImage(imageSrc);
      setResult(res);
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (result) {
      onSelectClassification({
        category: result.category,
        subCategory: result.label,
        co2Grams: result.co2PerItemGrams,
        ecoPoints: result.rewardPoints,
        imageUrl: selectedImage
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div style={{
        background: '#ffffff',
        borderRadius: 28,
        width: '100%',
        maxWidth: 480,
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        maxHeight: '90vh'
      }}>
        {/* Header (Matches Image 1) */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#e0f5ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803d'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1b4332' }}>Scan Waste</h3>
              <p style={{ fontSize: '0.72rem', color: '#64748b' }}>AI Waste Classification & Carbon Tracker</p>
            </div>
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

        {/* Viewfinder Camera Area (Directly Matching Image 1 Screen 3) */}
        <div style={{
          position: 'relative',
          height: 280,
          background: '#0f172a',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Main Scanned Image */}
          <img 
            src={selectedImage} 
            alt="Waste Scan" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isScanning ? 'brightness(0.85) contrast(1.1)' : 'none',
              transition: 'all 0.3s'
            }}
          />

          {/* Scanner Targeting Corner Brackets (Image 1 replica) */}
          <div style={{
            position: 'absolute',
            width: '68%',
            height: '68%',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: 28, height: 28, borderTop: '3.5px solid #22c55e', borderLeft: '3.5px solid #22c55e', borderTopLeftRadius: 6 }} />
              <div style={{ width: 28, height: 28, borderTop: '3.5px solid #22c55e', borderRight: '3.5px solid #22c55e', borderTopRightRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: 28, height: 28, borderBottom: '3.5px solid #22c55e', borderLeft: '3.5px solid #22c55e', borderBottomLeftRadius: 6 }} />
              <div style={{ width: 28, height: 28, borderBottom: '3.5px solid #22c55e', borderRight: '3.5px solid #22c55e', borderBottomRightRadius: 6 }} />
            </div>

            {/* Glowing Laser line */}
            {isScanning && <div className="scanner-laser" />}
          </div>

          {/* Scan status tag */}
          <div style={{
            position: 'absolute',
            top: 12,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            {isScanning ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>AI Neural Engine Scanning...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={12} color="#22c55e" />
                <span>Object Identified ({Math.round((result?.confidence || 0.95) * 100)}% match)</span>
              </>
            )}
          </div>
        </div>

        {/* Sample Picker & Upload Row */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Try Demo Images or Upload:
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                fontSize: '0.75rem',
                color: '#15803d',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Upload size={12} /> Upload Image
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileUpload} 
            />
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {SAMPLE_PREVIEWS.map((sample, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(sample.url)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedImage === sample.url ? '2px solid #22c55e' : '2px solid transparent',
                  flexShrink: 0,
                  opacity: selectedImage === sample.url ? 1 : 0.65,
                  transition: 'all 0.2s'
                }}
              >
                <img src={sample.url} alt={sample.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Classification Result Card (Exact Replica of Image 1 Screen 3) */}
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          {result ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1b4332' }}>
                  {result.label}
                </h4>
                <button 
                  onClick={() => handleScan(selectedImage)}
                  style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}
                >
                  <RefreshCw size={14} /> Rescan
                </button>
              </div>

              {/* 3 Metric Pills (Matches Image 1: Saved CO2 | Material | Reward) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                background: '#f8fafc',
                padding: '12px',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Saved CO₂</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#15803d' }}>
                    {result.co2PerItemGrams}g
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Material</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1b4332' }}>
                    {result.category}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Reward</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#eab308' }}>
                    +{result.rewardPoints} pts
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 14,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                marginBottom: 20
              }}>
                <Info size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.78rem', color: '#166534', lineHeight: 1.4 }}>
                  <strong>Segregation Guideline:</strong> {result.tips}
                </p>
              </div>

              {/* Action Button: Add Recycle Bag (Matches Image 1) */}
              <button
                onClick={handleConfirm}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              >
                <span>Add Recycle Bag / Schedule Pickup</span>
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <p>Analyzing waste composition...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
