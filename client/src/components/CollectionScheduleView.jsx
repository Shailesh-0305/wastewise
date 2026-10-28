import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Truck, 
  Plus, 
  MapPin, 
  CheckCircle2,
  Trash2,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function CollectionScheduleView({ onRequestPickup }) {
  const [schedules, setSchedules] = useState([]);
  const [selectedDay, setSelectedDay] = useState(8);
  const [currentMonth, setCurrentMonth] = useState('October 2026');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.getSchedules();
      if (res.success) {
        setSchedules(res.schedules);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Calendar matrix days 1 - 31
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Map dates with active collection tags (ZyroBin Image 4)
  const getDayTags = (day) => {
    if (day === 8) return ['organic', 'general'];
    if (day === 12) return ['recycling'];
    if (day === 19) return ['organic'];
    if (day === 23) return ['recycling', 'general'];
    if (day === 28) return ['organic'];
    return [];
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
        borderRadius: 24,
        padding: '28px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 10px 30px rgba(27,67,50,0.2)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, marginBottom: 8 }}>
            <CalendarIcon size={14} color="#86efac" />
            <span>ZyroBin Municipal Schedule</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Collection Schedule</h2>
          <p style={{ color: '#d8f3dc', fontSize: '0.9rem' }}>Track your district waste pickup dates & upcoming municipal routes</p>
        </div>

        <button
          onClick={onRequestPickup}
          className="btn-mint"
          style={{ padding: '12px 20px', fontSize: '0.9rem' }}
        >
          <Plus size={16} /> Request Custom Pickup
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* Monthly Calendar View (Direct Replica of Image 4) */}
        <div className="card">
          {/* Calendar Month Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button style={{ width: 34, height: 34, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={18} color="#475569" />
            </button>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1b4332' }}>
              {currentMonth}
            </h3>
            <button style={{ width: 34, height: 34, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={18} color="#475569" />
            </button>
          </div>

          {/* Day of Week Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#64748b',
            marginBottom: 12
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {/* Blank leading days for month alignment */}
            <div /> <div /> <div />
            {daysInMonth.map(day => {
              const tags = getDayTags(day);
              const isSelected = selectedDay === day;
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: isSelected ? '#1b4332' : tags.length > 0 ? '#f0fdf4' : 'transparent',
                    border: isSelected ? '2px solid #22c55e' : tags.length > 0 ? '1px solid #bbf7d0' : '1px solid transparent',
                    color: isSelected ? '#ffffff' : '#1e293b',
                    fontWeight: isSelected || tags.length > 0 ? 800 : 500,
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{day}</span>
                  {/* Colored Dots (Green = Organic, Blue = Recycling, Gray = General) */}
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                      {tags.map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: t === 'organic' ? '#22c55e' : t === 'recycling' ? '#0284c7' : '#94a3b8'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Color Legend (Image 4 bottom) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid #f1f5f9',
            fontSize: '0.78rem',
            color: '#64748b',
            fontWeight: 600
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              <span>Organic</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
              <span>Recycling</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} />
              <span>General</span>
            </div>
          </div>
        </div>

        {/* Upcoming Pickups Card (Matches Image 4 right card) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1b4332', marginBottom: 14 }}>
              Upcoming Pickups
            </h4>

            {/* Next Collection Spotlight (Thu 8 Tomorrow) */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: 18,
              padding: '16px',
              marginBottom: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 12,
                  padding: '6px 12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>THU</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b4332' }}>8</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1b4332' }}>Tomorrow</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> 07:00 AM - 09:00 AM
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className="badge badge-organic">🍏 Organic Waste</span>
                <span className="badge badge-metal">🗑️ General Waste</span>
              </div>

              <div style={{ fontSize: '0.76rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Truck size={14} color="#15803d" />
                <span>Assigned: Muhammad Gilang Pratama (TRK-08)</span>
              </div>
            </div>

            {/* Other Scheduled Rounds */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {schedules.slice(1).map(s => (
                <div
                  key={s._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1b4332' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {s.dayOfWeek} • {s.timeWindow}
                    </div>
                  </div>
                  <span className="badge badge-recyclable" style={{ fontSize: '0.7rem' }}>
                    {s.categories[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
