import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  HelpCircle, 
  ArrowRight, 
  ShieldAlert, 
  Recycle,
  Layers,
  Sparkle
} from 'lucide-react';

const RECYCLING_CODES = [
  {
    code: 'PETE/PET',
    number: '1',
    isRecyclable: true,
    title: 'Polyethylene Terephthalate',
    description: 'Plastic commonly used in single-use soda bottles, water bottles, and food jars.',
    howToPrepare: 'Empty liquid, rinse residue, and crush flat. Cap can be left on.',
    imageUrl: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'HDPE',
    number: '2',
    isRecyclable: true,
    title: 'High-Density Polyethylene',
    description: 'Versatile stiff plastic commonly used in milk jugs, detergent bottles, and shampoo containers.',
    howToPrepare: 'Rinse thoroughly with water. Remove any paper labels if loose.',
    imageUrl: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'PVC',
    number: '3',
    isRecyclable: false,
    title: 'Polyvinyl Chloride',
    description: 'Tough materials for pipes, playground equipment, vinyl siding, and blister packaging.',
    howToPrepare: 'Rarely accepted in curbside bins. Drop off at specialized chemical/hardware depot.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'LDPE',
    number: '4',
    isRecyclable: true,
    title: 'Low-Density Polyethylene',
    description: 'Flexible plastic used in squeeze bottles, grocery bags, bread packaging, and bubble wrap.',
    howToPrepare: 'Clean of food crumbs. Bundle clean plastic bags together in a single bag.',
    imageUrl: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'PP',
    number: '5',
    isRecyclable: true,
    title: 'Polypropylene',
    description: 'High heat-tolerant plastic for yogurt cups, medicine bottles, ketchup bottles, and syrup caps.',
    howToPrepare: 'Scrape food clean and rinse. Widely accepted in modern municipal programs.',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'PS',
    number: '6',
    isRecyclable: false,
    title: 'Polystyrene',
    description: 'Foam coffee cups, styrofoam trays, disposable packing peanuts, and plastic cutlery.',
    howToPrepare: 'Non-recyclable curbside. Reuse peanuts or check for specialty styrofoam drop-offs.',
    imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=300&q=80'
  }
];

export const SORTING_STEPS = [
  {
    step: '1',
    title: 'Clean your waste',
    desc: 'Rinse food and drink residue with cold water to avoid contamination in sorting facilities.',
    icon: '🧼'
  },
  {
    step: '2',
    title: 'Crush your waste',
    desc: 'Step on cans and squeeze plastic bottles flat to maximize collection truck storage efficiency.',
    icon: '📦'
  },
  {
    step: '3',
    title: 'Pack your waste',
    desc: 'Use paper bags or segregated bins categorized by material ready for your pickup courier.',
    icon: '🛍️'
  }
];

export default function WasteCatalogView({ onOpenScanner, onRequestPickup }) {
  const [filter, setFilter] = useState('all'); // 'all', 'recyclable', 'non-recyclable'

  const filteredCodes = RECYCLING_CODES.filter(item => {
    if (filter === 'recyclable') return item.isRecyclable;
    if (filter === 'non-recyclable') return !item.isRecyclable;
    return true;
  });

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Top Banner (GreenCove Style - Image 3) */}
      <div style={{
        background: 'linear-gradient(135deg, #163e2d 0%, #255840 100%)',
        borderRadius: 28,
        padding: '32px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ maxWidth: 620 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ade80', letterSpacing: '1px', textTransform: 'uppercase' }}>
            greencove. waste catalog
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, letterSpacing: '-0.5px' }}>
            Pack up and let our staff pick your waste up
          </h2>
          <p style={{ color: '#d8f3dc', fontSize: '0.92rem', marginTop: 8 }}>
            Proper waste segregation prevents landfill contamination and increases city recycling yields by up to 40%.
          </p>
        </div>

        <button
          onClick={onOpenScanner}
          className="btn-mint"
          style={{ padding: '14px 24px', fontSize: '0.95rem' }}
        >
          <Sparkles size={18} /> Identify Item with AI Scanner
        </button>
      </div>

      {/* 3 Step Preparation Guide (Direct Replica of Image 3 Screen 1) */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b4332', marginBottom: 14 }}>
          How to Prepare for Collection:
        </h3>
        <div className="grid-3">
          {SORTING_STEPS.map(s => (
            <div
              key={s.step}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                border: '1.5px solid #dcfce7',
                background: '#ffffff'
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: '#e0f5ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem'
              }}>
                {s.icon}
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1b4332' }}>
                {s.title}
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Material Codes Catalog (Image 3 Replica) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b4332' }}>
              Plastic Resin Identification Codes
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Check the embossed recycling triangle on bottom of bottles and packaging
            </p>
          </div>

          {/* Recyclable / Non-Recyclable Toggle (Image 3) */}
          <div style={{
            display: 'flex',
            background: '#e2e8f0',
            padding: 4,
            borderRadius: 999
          }}>
            {[
              { id: 'all', label: 'All Codes' },
              { id: 'recyclable', label: 'Recyclable' },
              { id: 'non-recyclable', label: 'Non-Recyclable' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: filter === tab.id ? '#1b4332' : 'transparent',
                  color: filter === tab.id ? '#ffffff' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Code Cards Grid */}
        <div className="grid-2">
          {filteredCodes.map(item => (
            <div
              key={item.code}
              className="card"
              style={{
                display: 'flex',
                gap: 16,
                padding: '20px',
                border: '1.5px solid #e2e8f0',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: item.isRecyclable ? '#e0f5ea' : '#fee2e2',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: item.isRecyclable ? '1.5px solid #bbf7d0' : '1.5px solid #fecaca'
              }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: item.isRecyclable ? '#15803d' : '#b91c1c' }}>
                  {item.number}
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: item.isRecyclable ? '#166534' : '#991b1b' }}>
                  {item.code}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1b4332' }}>
                    {item.code} ({item.title})
                  </h4>
                  <span className={`badge ${item.isRecyclable ? 'badge-recyclable' : 'badge-medical'}`} style={{ fontSize: '0.68rem' }}>
                    {item.isRecyclable ? '✓ Recyclable' : '✕ Landfill / SafeDrop'}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: 4, lineHeight: 1.4 }}>
                  {item.description}
                </p>
                <div style={{ fontSize: '0.76rem', color: '#15803d', fontWeight: 600, marginTop: 8, background: '#f0fdf4', padding: '6px 10px', borderRadius: 8 }}>
                  <strong>How to prep:</strong> {item.howToPrepare}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
