import React, { useState } from 'react';
import { 
  Sparkles, 
  PlusCircle,
  BookOpen
} from 'lucide-react';
import { ForestSilhouettes, FloatingLeaf } from './NatureDecorations';

const RECYCLING_CODES = [
  {
    code: 'PETE/PET',
    number: '1',
    category: 'Plastic',
    isRecyclable: true,
    title: 'Polyethylene Terephthalate',
    description: 'Plastic commonly used in single-use soda bottles, water bottles, and food jars.',
    howToPrepare: 'Empty liquid, rinse residue, and crush flat. Cap can be left on.',
    imageUrl: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'HDPE',
    number: '2',
    category: 'Plastic',
    isRecyclable: true,
    title: 'High-Density Polyethylene',
    description: 'Versatile stiff plastic commonly used in milk jugs, detergent bottles, and shampoo containers.',
    howToPrepare: 'Rinse thoroughly with water. Remove any paper labels if loose.',
    imageUrl: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'PVC',
    number: '3',
    category: 'Plastic',
    isRecyclable: false,
    title: 'Polyvinyl Chloride',
    description: 'Tough materials for pipes, playground equipment, vinyl siding, and blister packaging.',
    howToPrepare: 'Rarely accepted in curbside bins. Drop off at specialized chemical/hardware depot.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'LDPE',
    number: '4',
    category: 'Plastic',
    isRecyclable: true,
    title: 'Low-Density Polyethylene',
    description: 'Flexible plastic used in squeeze bottles, grocery bags, bread packaging, and bubble wrap.',
    howToPrepare: 'Clean of food crumbs. Bundle clean plastic bags together in a single bag.',
    imageUrl: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'PP',
    number: '5',
    category: 'Plastic',
    isRecyclable: true,
    title: 'Polypropylene',
    description: 'High heat-tolerant plastic for yogurt cups, medicine bottles, ketchup bottles, and syrup caps.',
    howToPrepare: 'Scrape food clean and rinse. Widely accepted in modern municipal programs.',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'PS',
    number: '6',
    category: 'Plastic',
    isRecyclable: false,
    title: 'Polystyrene',
    description: 'Foam coffee cups, styrofoam trays, disposable packing peanuts, and plastic cutlery.',
    howToPrepare: 'Non-recyclable curbside. Reuse peanuts or check for specialty styrofoam drop-offs.',
    imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'E-WASTE',
    number: '7',
    category: 'Electronic',
    isRecyclable: true,
    title: 'Consumer Electronics & Cells',
    description: 'Old smartphones, laptops, chargers, lithium-ion, and alkaline battery packs.',
    howToPrepare: 'Tape battery terminals with clear tape. Never place in standard curbside bins.',
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'ORGANIC',
    number: '8',
    category: 'Organic',
    isRecyclable: true,
    title: 'Biodegradable Kitchen Scraps',
    description: 'Vegetable peelings, fruit rinds, coffee grounds, eggshells, and yard leaves.',
    howToPrepare: 'Collect in a breathable countertop compost pail or biodegradable brown paper bag.',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=300&q=80'
  }
];

const SORTING_STEPS = [
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
    title: 'Pack by category',
    desc: 'Segregate items into the 7 official WasteWise streams ready for driver collection.',
    icon: '🛍️'
  }
];

export default function WasteCatalogView({ onOpenScanner, onRequestPickup }) {
  const [filter, setFilter] = useState('all');

  const filteredCodes = RECYCLING_CODES.filter(item => {
    if (filter === 'recyclable') return item.isRecyclable;
    if (filter === 'non-recyclable') return !item.isRecyclable;
    return true;
  });

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 26 }}>
      {/* Nature-Inspired Pale Green Header Section */}
      <div 
        className="pale-green-box"
        style={{
          padding: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20
        }}
      >
        <ForestSilhouettes opacity={0.15} height={135} />
        <FloatingLeaf size={30} top={16} right={20} rotate={15} opacity={0.22} />

        <div style={{ maxWidth: 620, position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#ffffff',
            border: '1.5px solid var(--soft-leaf-green)',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: '0.76rem',
            fontWeight: 700,
            color: 'var(--primary-forest)',
            marginBottom: 8
          }}>
            <BookOpen size={14} color="var(--secondary-green)" />
            <span>Official Segregation Guide</span>
          </div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--primary-text)', letterSpacing: '-0.4px' }}>
            WasteWise Material Identification Guide
          </h2>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.88rem', marginTop: 4 }}>
            Learn how to identify resin numbers, avoid recycling contamination, and prep items for our collection couriers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 1 }}>
          <button
            onClick={onOpenScanner}
            className="btn-mint"
            style={{ padding: '10px 18px', fontSize: '0.86rem' }}
          >
            <Sparkles size={16} /> Scan Waste
          </button>
          <button
            onClick={onRequestPickup}
            className="btn-primary"
            style={{ padding: '10px 18px', fontSize: '0.86rem' }}
          >
            <PlusCircle size={16} /> Request Pickup
          </button>
        </div>
      </div>

      {/* 3 Step Quick Sorting Process */}
      <div>
        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--primary-text)', marginBottom: 14 }}>
          3-Step Household Segregation
        </h3>
        <div className="grid-3">
          {SORTING_STEPS.map(s => (
            <div key={s.step} className="card" style={{ padding: '20px', display: 'flex', gap: 14 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'var(--pale-green-section)',
                border: '1.5px solid var(--soft-leaf-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                flexShrink: 0
              }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-green)', textTransform: 'uppercase' }}>
                  Step {s.step}
                </div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--primary-text)', marginTop: 2 }}>
                  {s.title}
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', marginTop: 4 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Material Identification Codes Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--primary-text)' }}>
              Standard Identification Numbers
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>
              Look for the triangular chase symbol on the bottom of containers
            </p>
          </div>

          <div style={{ display: 'flex', background: 'var(--very-light-mint)', padding: 3, borderRadius: 999, border: '1px solid var(--border-light)' }}>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'recyclable', label: 'Accepted Curbside' },
              { id: 'non-recyclable', label: 'Special Drop-Off' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 999,
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  background: filter === tab.id ? 'var(--primary-forest)' : 'transparent',
                  color: filter === tab.id ? '#ffffff' : 'var(--secondary-text)',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16
        }}>
          {filteredCodes.map(item => (
            <div key={item.number} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ height: 110, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    background: item.isRecyclable ? '#dcfce7' : '#fee2e2',
                    color: item.isRecyclable ? '#15803d' : '#b91c1c',
                    border: `1px solid ${item.isRecyclable ? '#86efac' : '#fca5a5'}`,
                    padding: '3px 8px',
                    borderRadius: 999,
                    fontSize: '0.68rem',
                    fontWeight: 800
                  }}
                >
                  {item.isRecyclable ? '✓ Curbside Recyclable' : '⚠ Non-Standard Drop'}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    background: 'rgba(255,255,255,0.92)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--primary-forest)'
                  }}
                >
                  #{item.number} {item.code}
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '0.76rem', color: 'var(--secondary-text)', marginTop: 4 }}>
                  {item.description}
                </p>
              </div>

              <div style={{
                background: 'var(--very-light-mint)',
                border: '1px solid var(--border-light)',
                borderRadius: 10,
                padding: '8px 10px',
                fontSize: '0.74rem',
                color: 'var(--primary-text)'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-forest)' }}>Prep Tip: </span>
                <span>{item.howToPrepare}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
