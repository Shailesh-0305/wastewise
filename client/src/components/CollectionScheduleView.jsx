import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Leaf
} from 'lucide-react';
import { ForestSilhouettes, FloatingLeaf } from './NatureDecorations';

export default function CollectionScheduleView({ onRequestPickup }) {
  const [selectedDay, setSelectedDay] = useState(8);
  const [currentMonth] = useState('November 2026');

  // Calendar matrix days 1 - 30
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  // Map dates with active collection tags
  const getDayTags = (day) => {
    if (day === 4) return ['organic', 'general'];
    if (day === 8) return ['organic', 'plastic'];
    if (day === 12) return ['recyclable', 'glass'];
    if (day === 19) return ['organic'];
    if (day === 23) return ['electronic', 'metal'];
    if (day === 28) return ['organic', 'medical'];
    return [];
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Nature-Inspired Pale Green Header Section */}
      <div 
        className="pale-green-box"
        style={{
          padding: '28px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <ForestSilhouettes opacity={0.14} height={130} />
        <FloatingLeaf size={28} top={14} right={18} rotate={-10} opacity={0.2} />

        <div style={{ position: 'relative', zIndex: 1 }}>
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
            <CalendarIcon size={14} color="var(--secondary-green)" />
            <span>District 4 · Municipal Operations</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-text)', letterSpacing: '-0.3px' }}>
            Collection Schedule
          </h2>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.86rem', marginTop: 2 }}>
            Track your weekly curbside pickup days and municipal segregation rounds.
          </p>
        </div>

        <button
          onClick={onRequestPickup}
          className="btn-primary"
          style={{ position: 'relative', zIndex: 1, padding: '10px 20px', fontSize: '0.88rem' }}
        >
          <Plus size={16} /> Request Custom Pickup
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 22 }}>
        {/* Monthly Calendar View */}
        <div className="card">
          {/* Calendar Month Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-text)' }}>
              {currentMonth}
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-text)' }}>
                <ChevronLeft size={16} />
              </button>
              <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-text)' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.74rem', color: 'var(--secondary-text)', marginBottom: 12 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Calendar Days Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {daysInMonth.map(day => {
              const isSelected = selectedDay === day;
              const tags = getDayTags(day);
              const isToday = day === 3;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    height: 64,
                    borderRadius: 12,
                    border: isSelected ? '2px solid var(--secondary-green)' : isToday ? '1.5px solid var(--soft-leaf-green)' : '1px solid var(--border-light)',
                    background: isSelected ? 'var(--pale-green-section)' : '#ffffff',
                    padding: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: isSelected || isToday ? 800 : 500, color: isSelected ? 'var(--primary-forest)' : 'var(--primary-text)' }}>
                      {day}
                    </span>
                    {isToday && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--secondary-green)' }} />
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {tags.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: t === 'organic' ? '#16a34a' : t === 'plastic' ? '#0284c7' : t === 'electronic' ? '#ca8a04' : '#059669'
                        }}
                        title={t}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category Dot Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
            {[
              { label: 'Organic Compost', color: '#16a34a' },
              { label: 'Plastic Recyclables', color: '#0284c7' },
              { label: 'E-Waste & Batteries', color: '#ca8a04' },
              { label: 'Glass & Metal', color: '#059669' }
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--secondary-text)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Date Schedule Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Clock size={16} color="var(--secondary-green)" />
              <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                Schedule for Nov {selectedDay}, 2026
              </h4>
            </div>

            {getDayTags(selectedDay).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  background: 'var(--pale-green-section)',
                  border: '1px solid var(--soft-leaf-green)',
                  borderRadius: 14,
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--secondary-green)', textTransform: 'uppercase' }}>
                    07:00 AM - 09:00 AM
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary-forest)', marginTop: 2 }}>
                    Zone North Scheduled Round
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--secondary-text)', marginTop: 4 }}>
                    Curbside bins collected by Muhammad Gilang Pratama (TRK-GREEN-08).
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {getDayTags(selectedDay).map(t => (
                    <span key={t} className={`badge badge-${t}`}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--secondary-text)', fontSize: '0.84rem' }}>
                <Leaf size={24} color="var(--soft-leaf-green)" style={{ margin: '0 auto 8px' }} />
                <p>No standard municipal rounds on this date.</p>
                <p style={{ fontSize: '0.76rem', marginTop: 4 }}>
                  You can request a direct on-demand pickup below.
                </p>
                <button
                  onClick={onRequestPickup}
                  className="btn-primary"
                  style={{ marginTop: 12, padding: '7px 16px', fontSize: '0.8rem' }}
                >
                  Book On-Demand
                </button>
              </div>
            )}
          </div>

          {/* District Information */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary-text)', marginBottom: 8 }}>
              Curbside Collection Rules
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem', color: 'var(--secondary-text)' }}>
              <li style={{ display: 'flex', gap: 6 }}>
                <span style={{ color: 'var(--secondary-green)' }}>✓</span>
                <span>Place segregated bins outside by 06:45 AM.</span>
              </li>
              <li style={{ display: 'flex', gap: 6 }}>
                <span style={{ color: 'var(--secondary-green)' }}>✓</span>
                <span>Rinse food residue from plastic containers and tins.</span>
              </li>
              <li style={{ display: 'flex', gap: 6 }}>
                <span style={{ color: 'var(--secondary-green)' }}>✓</span>
                <span>Keep e-waste and batteries in sealed clear pouches.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
