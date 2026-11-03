import React, { useState, useEffect } from 'react';
import { 
  PlusCircle,
  BookOpen,
  Search,
  AlertCircle,
  Info
} from 'lucide-react';
import { ForestSilhouettes, FloatingLeaf } from './NatureDecorations';

// A. Official Plastic Resin Identification Codes (RIC 1 - 7)
const RESIN_CODES = [
  {
    code: 'PET / PETE',
    number: '1',
    name: 'Polyethylene Terephthalate',
    commonItems: 'Soft drink bottles, mineral water bottles, peanut butter jars, salad dressing containers.',
    curbsideNote: 'Widely collected in most municipal curbside recycling programmes.',
    preparation: 'Empty all liquids, rinse food residue, and crush flat. Screw caps back on.',
    imageUrl: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'HDPE',
    number: '2',
    name: 'High-Density Polyethylene',
    commonItems: 'Milk jugs, laundry detergent jugs, shampoo bottles, bleach jugs, motor oil containers.',
    curbsideNote: 'Widely accepted in most municipal curbside collection schemes.',
    preparation: 'Rinse thoroughly with clean water. Keep caps on or follow local depot rules.',
    imageUrl: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'PVC',
    number: '3',
    name: 'Polyvinyl Chloride',
    commonItems: 'Plumbing pipes, vinyl siding, blister packs, wire jacketing, medical tubing.',
    curbsideNote: 'Rarely accepted in standard curbside bins; requires specialized construction or chemical recycling drop-offs.',
    preparation: 'Do not mix with household food packaging. Check with local municipal transfer station.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'LDPE',
    number: '4',
    name: 'Low-Density Polyethylene',
    commonItems: 'Squeeze bottles, bread bags, dry cleaning bags, shrink wrap, bubble wrap.',
    curbsideNote: 'Check local guidelines; clean film and bags are often returned to grocery store collection bins.',
    preparation: 'Must be clean and dry. Bundle soft films together into a single pouch.',
    imageUrl: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'PP',
    number: '5',
    name: 'Polypropylene',
    commonItems: 'Yogurt containers, margarine tubs, syrup bottles, medicine bottles, bottle caps.',
    curbsideNote: 'Increasingly accepted in modern municipal recycling facilities.',
    preparation: 'Scrape food clean and rinse. Flatten containers where possible.',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'PS',
    number: '6',
    name: 'Polystyrene',
    commonItems: 'Disposable foam coffee cups, take-out clamshells, meat trays, egg cartons, packing peanuts.',
    curbsideNote: 'Generally not accepted in standard curbside recycling due to contamination and low density.',
    preparation: 'Reuse packaging peanuts or deliver clean foam to designated industrial drop-off stations.',
    imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=300&q=80'
  },
  {
    code: 'Other',
    number: '7',
    name: 'Other or Mixed Plastic Resins',
    commonItems: 'Multi-layer food pouches, polycarbonate bottles, acrylics, nylon, fiberglass, bioplastics (PLA).',
    curbsideNote: 'Usually not recyclable in municipal curbside streams unless explicitly certified.',
    preparation: 'Segregate non-compostable plastics. Compostable PLA should only enter commercial composting if accepted.',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=300&q=80'
  }
];

// B. The Seven WasteWise Municipal Segregation Streams
const WASTE_CATEGORIES = [
  {
    category: 'Plastic',
    badge: 'Curbside / Station',
    badgeClass: 'badge-plastic',
    description: 'Rigid containers, beverage bottles, clean jars, and approved polymer packaging.',
    examples: 'PET soda bottles, HDPE detergent jugs, PP food tubs.',
    preparation: 'Empty liquid residue, rinse cleanly, crush flat, and keep caps secured.',
    imageUrl: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=400&q=80'
  },
  {
    category: 'Organic',
    badge: 'Composting Round',
    badgeClass: 'badge-organic',
    description: 'Biodegradable kitchen food scraps, plant clippings, and compostable organics.',
    examples: 'Fruit and vegetable peelings, coffee grounds, eggshells, garden leaves.',
    preparation: 'Collect in ventilated countertop compost pails or brown paper bags. Never mix with plastic wrap.',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80'
  },
  {
    category: 'Electronic',
    badge: 'Special Handling',
    badgeClass: 'badge-electronic',
    description: 'Consumer electronics, cell phones, circuit boards, and rechargeable batteries.',
    examples: 'Laptops, power banks, cables, alkaline & lithium batteries, old appliances.',
    preparation: 'Tape battery terminal ends with clear tape. Never place in standard curbside bins.',
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=400&q=80'
  },
  {
    category: 'Medical',
    badge: 'Hazardous SafeDrop',
    badgeClass: 'badge-medical',
    description: 'Expired pharmaceuticals, clinical sharps, and bio-protection items requiring safe disposal.',
    examples: 'Unused prescription pills, sealed sharps containers, medical packaging.',
    preparation: 'Place sharps into puncture-resistant containers. Drop off at certified safe-drop kiosks.',
    imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=400&q=80'
  },
  {
    category: 'Recyclable',
    badge: 'Fibre & Paper',
    badgeClass: 'badge-recyclable',
    description: 'Clean dry cardboard, office paper, envelopes, and paperboard cartons.',
    examples: 'Corrugated delivery boxes, cereal boxes, newspapers, magazines, clean paper bags.',
    preparation: 'Remove plastic tape and bubble wrap, flatten cardboard boxes completely.',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80'
  },
  {
    category: 'Metal',
    badge: 'Infinite Cycle',
    badgeClass: 'badge-metal',
    description: 'Aluminium cans, tin food cans, clean metal lids, and clean foil.',
    examples: 'Aluminium soda cans, canned soup tins, clean aluminium bakeware, metal bottle caps.',
    preparation: 'Rinse food residue, push can lids inside, and crush aluminium cans to conserve space.',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80'
  },
  {
    category: 'Glass',
    badge: 'Container Glass',
    badgeClass: 'badge-glass',
    description: 'Clear, amber, and green glass beverage bottles and food jars.',
    examples: 'Sauce jars, beverage bottles, condiment jars, jam containers.',
    preparation: 'Rinse food residue clean. Labels may remain on. Do not mix with mirror glass or ceramics.',
    imageUrl: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=400&q=80'
  }
];

const SORTING_STEPS = [
  {
    step: '1',
    title: 'Clean your waste',
    desc: 'Rinse food and drink residue with clean water to prevent contamination at sorting facilities.',
    icon: '🧼'
  },
  {
    step: '2',
    title: 'Crush & flatten',
    desc: 'Flatten cardboard boxes and crush metal cans or plastic bottles to optimize collection capacity.',
    icon: '📦'
  },
  {
    step: '3',
    title: 'Segregate by category',
    desc: 'Sort into the official WasteWise streams ready for scheduled curbside pickup or drop-off.',
    icon: '🛍️'
  }
];

export default function WasteCatalogView({ onRequestPickup, initialSearchQuery = '' }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'resins', 'categories'
  const [search, setSearch] = useState(initialSearchQuery);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const s = search.toLowerCase().trim();

  // Filter Resin Codes
  const filteredResins = RESIN_CODES.filter(item => {
    if (!s) return true;
    return (
      item.code.toLowerCase().includes(s) ||
      item.name.toLowerCase().includes(s) ||
      item.number.includes(s) ||
      item.commonItems.toLowerCase().includes(s) ||
      item.curbsideNote.toLowerCase().includes(s) ||
      item.preparation.toLowerCase().includes(s)
    );
  });

  // Filter Categories
  const filteredCategories = WASTE_CATEGORIES.filter(item => {
    if (!s) return true;
    return (
      item.category.toLowerCase().includes(s) ||
      item.description.toLowerCase().includes(s) ||
      item.examples.toLowerCase().includes(s) ||
      item.preparation.toLowerCase().includes(s)
    );
  });

  const showResins = activeTab === 'all' || activeTab === 'resins';
  const showCategories = activeTab === 'all' || activeTab === 'categories';
  const totalResults = (showResins ? filteredResins.length : 0) + (showCategories ? filteredCategories.length : 0);

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Nature-Inspired Pale Green Header Section */}
      <div 
        className="pale-green-box"
        style={{
          padding: '30px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <ForestSilhouettes opacity={0.15} height={130} />
        <FloatingLeaf size={30} top={14} right={20} rotate={15} opacity={0.22} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 650 }}>
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
            <span>Standardized Material & Polymer Reference</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-text)', letterSpacing: '-0.3px' }}>
            Waste Guide & Resin Codes
          </h2>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.86rem', marginTop: 4, lineHeight: 1.4 }}>
            Verify official plastic resin codes (1–7), explore household waste segregation categories, and prepare materials correctly.
          </p>
        </div>

        <button
          onClick={onRequestPickup}
          className="btn-primary"
          style={{ position: 'relative', zIndex: 1, padding: '10px 20px', fontSize: '0.88rem' }}
        >
          <PlusCircle size={16} /> Request Pickup
        </button>
      </div>

      {/* Program Notice */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid var(--border-light)',
        borderRadius: 16,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Info size={20} color="var(--secondary-green)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.82rem', color: 'var(--secondary-text)', margin: 0 }}>
          <strong>Local Acceptance Notice:</strong> Curbside acceptance of plastics and specialized materials depends on the equipment and guidelines of your local municipal recycling programme. Always check with your local authority for specific curbside rules.
        </p>
      </div>

      {/* Search Bar & Section Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14
      }}>
        {/* Real Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#ffffff',
          border: '1.5px solid var(--border-light)',
          borderRadius: 999,
          padding: '8px 18px',
          minWidth: 280,
          flex: 1,
          maxWidth: 460,
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <Search size={16} color="var(--secondary-green)" />
          <input
            type="text"
            placeholder="Search resin codes, categories, materials, preparation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              width: '100%',
              fontSize: '0.86rem',
              color: 'var(--primary-text)'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', fontWeight: 700 }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Section Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--very-light-mint)',
          padding: 4,
          borderRadius: 999,
          border: '1.5px solid var(--border-light)'
        }}>
          {[
            { id: 'all', label: 'All Guides' },
            { id: 'resins', label: 'Plastic Resin Codes (1–7)' },
            { id: 'categories', label: 'Waste Streams' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 16px',
                borderRadius: 999,
                fontSize: '0.8rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                background: activeTab === tab.id ? 'var(--primary-forest)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--primary-text)',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* No Search Results State */}
      {totalResults === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 20px',
          background: '#ffffff',
          borderRadius: 20,
          border: '1.5px solid var(--border-light)'
        }}>
          <AlertCircle size={32} color="var(--secondary-green)" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-text)' }}>
            No Matching Materials Found
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--secondary-text)', marginTop: 4 }}>
            No items matched "{search}". Try searching for terms like "PET", "bottle", "cardboard", or "batteries".
          </p>
          <button
            onClick={() => setSearch('')}
            className="btn-secondary"
            style={{ marginTop: 14, padding: '7px 16px', fontSize: '0.82rem' }}
          >
            Reset Search
          </button>
        </div>
      )}

      {/* SECTION A: Official Plastic Resin Identification Codes (RIC 1 - 7) */}
      {showResins && filteredResins.length > 0 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                background: 'var(--primary-forest)',
                color: '#ffffff',
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 800
              }}>
                A
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                Plastic Resin Identification Codes (1 to 7)
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginTop: 4 }}>
              The international Resin Identification Code (RIC) system classifies plastic polymers used in packaging and manufacturing.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 16
          }}>
            {filteredResins.map(item => (
              <div
                key={item.number}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--pale-green-section)',
                      border: '1.5px solid var(--soft-leaf-green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      color: 'var(--primary-forest)'
                    }}>
                      ♳ {item.number}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                        {item.code}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)', fontWeight: 600 }}>
                        {item.name}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--primary-text)' }}>
                  <strong>Common items:</strong> {item.commonItems}
                </div>

                <div style={{
                  background: 'var(--very-light-mint)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  color: 'var(--primary-forest)'
                }}>
                  <strong>Curbside status:</strong> {item.curbsideNote}
                </div>

                <div style={{ fontSize: '0.76rem', color: 'var(--secondary-text)', marginTop: 'auto' }}>
                  <strong>Preparation:</strong> {item.preparation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION B: The Seven WasteWise Municipal Segregation Streams */}
      {showCategories && filteredCategories.length > 0 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                background: 'var(--primary-forest)',
                color: '#ffffff',
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 800
              }}>
                B
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                Municipal Waste Segregation Streams (7 Categories)
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginTop: 4 }}>
              The seven standard WasteWise segregation categories accepted for municipal pickup requests and recycling drop-offs.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 16
          }}>
            {filteredCategories.map(cat => (
              <div
                key={cat.category}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                    {cat.category}
                  </h4>
                  <span className={`badge ${cat.badgeClass}`}>
                    {cat.badge}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--primary-text)' }}>
                  {cat.description}
                </p>

                <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>
                  <strong>Examples:</strong> {cat.examples}
                </div>

                <div style={{
                  background: 'var(--pale-green-section)',
                  border: '1px solid var(--soft-leaf-green)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  color: 'var(--primary-forest)',
                  marginTop: 'auto'
                }}>
                  <strong>Preparation:</strong> {cat.preparation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Household Segregation Steps */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid var(--border-light)',
        borderRadius: 24,
        padding: '28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 540, margin: '0 auto 24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-text)' }}>
            Household Segregation in 3 Simple Steps
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--secondary-text)', marginTop: 4 }}>
            Prepare your materials cleanly before handing over to collection drivers or dropping off at stations.
          </p>
        </div>

        <div className="grid-3">
          {SORTING_STEPS.map(st => (
            <div
              key={st.step}
              style={{
                background: 'var(--very-light-mint)',
                border: '1.5px solid var(--border-light)',
                borderRadius: 18,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: 2 }}>{st.icon}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-green)', textTransform: 'uppercase' }}>
                Step {st.step}
              </div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                {st.title}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', lineHeight: 1.4 }}>
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
