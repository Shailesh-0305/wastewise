import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Leaf,
  Truck,
  MapPin
} from 'lucide-react';
import { ForestSilhouettes, FloatingLeaf } from './NatureDecorations';
import { api } from '../services/api';

export default function CollectionScheduleView({ onRequestPickup }) {
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 10, 3)); // Nov 3, 2026 (target semester date)
  const [selectedDay, setSelectedDay] = useState(3);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchSchedules();
  }, [year, month]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.getSchedules();
      if (res.success && Array.isArray(res.schedules)) {
        setSchedules(res.schedules);
      }
    } catch (e) {
      console.warn('Could not load schedules:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(1);
  };

  // Calendar calculations
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 for Sunday
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  // Match schedules for a given day in the current viewed month
  const getSchedulesForDay = (day) => {
    return schedules.filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  // Get distinct categories scheduled for a day (for dot indicators)
  const getDayCategories = (day) => {
    const dayScheds = getSchedulesForDay(day);
    const cats = new Set();
    dayScheds.forEach(s => {
      (s.categories || []).forEach(c => cats.add(c.toLowerCase()));
    });
    // If no explicit DB schedules, fallback to regular weekly district rota
    if (cats.size === 0) {
      const dayOfWeek = new Date(year, month, day).getDay();
      if (dayOfWeek === 2) { cats.add('organic'); cats.add('general'); } // Tue
      if (dayOfWeek === 4) { cats.add('plastic'); cats.add('recyclable'); } // Thu
      if (dayOfWeek === 6) { cats.add('electronic'); cats.add('metal'); } // Sat
    }
    return Array.from(cats);
  };

  const selectedDaySchedules = getSchedulesForDay(selectedDay);
  const isToday = (day) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const getCategoryColor = (cat) => {
    switch (cat.toLowerCase()) {
      case 'organic': return '#16a34a';
      case 'plastic': return '#0284c7';
      case 'electronic': return '#ca8a04';
      case 'medical': return '#e11d48';
      case 'recyclable':
      case 'recycling': return '#059669';
      case 'metal': return '#475569';
      case 'glass': return '#0d9488';
      default: return '#15803d';
    }
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
            Track curbside collection calendar rounds and municipal segregation routes.
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
          {/* Calendar Month Header & Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-text)' }}>
                {monthNames[month]} {year}
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--secondary-text)' }}>
                Click any date to inspect scheduled rounds
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                onClick={handlePrevMonth}
                aria-label="Previous month"
                style={{ width: 34, height: 34, borderRadius: 10, border: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-text)', background: '#ffffff', cursor: 'pointer' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNextMonth}
                aria-label="Next month"
                style={{ width: 34, height: 34, borderRadius: 10, border: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-text)', background: '#ffffff', cursor: 'pointer' }}
              >
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
            {/* Blank leading slots */}
            {blankDays.map(b => (
              <div key={`blank-${b}`} style={{ height: 66, borderRadius: 12, background: 'transparent' }} />
            ))}

            {/* Days in Month */}
            {daysArray.map(day => {
              const isSelected = selectedDay === day;
              const categories = getDayCategories(day);
              const currentDayIsToday = isToday(day);

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    height: 66,
                    borderRadius: 12,
                    border: isSelected ? '2px solid var(--secondary-green)' : currentDayIsToday ? '1.5px solid var(--soft-leaf-green)' : '1px solid var(--border-light)',
                    background: isSelected ? 'var(--pale-green-section)' : '#ffffff',
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: isSelected || currentDayIsToday ? 800 : 500, color: isSelected ? 'var(--primary-forest)' : 'var(--primary-text)' }}>
                      {day}
                    </span>
                    {currentDayIsToday && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--secondary-green)' }} title="Today" />
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {categories.map((cat, idx) => (
                      <span
                        key={idx}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: getCategoryColor(cat)
                        }}
                        title={cat}
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
              { label: 'Glass & Recyclable', color: '#059669' },
              { label: 'Medical SafeDrop', color: '#e11d48' }
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
                {monthNames[month].slice(0, 3)} {selectedDay}, {year}
              </h4>
            </div>

            {selectedDaySchedules.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedDaySchedules.map((s, idx) => (
                  <div 
                    key={s._id || idx}
                    style={{
                      background: 'var(--pale-green-section)',
                      border: '1px solid var(--soft-leaf-green)',
                      borderRadius: 14,
                      padding: '14px'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--secondary-green)', textTransform: 'uppercase' }}>
                      {s.timeWindow || '07:00 AM - 09:00 AM'} · {s.status || 'Scheduled'}
                    </div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--primary-forest)', marginTop: 2 }}>
                      {s.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--secondary-text)', marginTop: 4 }}>
                      <MapPin size={12} />
                      <span>{s.zone || 'District 4 - Metro North'}</span>
                    </div>
                    {s.driverName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--secondary-text)', marginTop: 2 }}>
                        <Truck size={12} />
                        <span>Driver: {s.driverName} ({s.vehicleId || 'EV Fleet'})</span>
                      </div>
                    )}
                    {s.notes && (
                      <p style={{ fontSize: '0.74rem', color: 'var(--primary-text)', marginTop: 6, fontStyle: 'italic' }}>
                        "{s.notes}"
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {(s.categories || []).map(t => (
                        <span key={t} className={`badge badge-${t.toLowerCase()}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : getDayCategories(selectedDay).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  background: 'var(--pale-green-section)',
                  border: '1px solid var(--soft-leaf-green)',
                  borderRadius: 14,
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--secondary-green)', textTransform: 'uppercase' }}>
                    07:00 AM - 09:00 AM · Weekly Rota
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary-forest)', marginTop: 2 }}>
                    District 4 Scheduled Round
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--secondary-text)', marginTop: 4 }}>
                    Standard curbside collection round. Place designated waste containers out before 06:45 AM.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {getDayCategories(selectedDay).map(t => (
                    <span key={t} className={`badge badge-${t.toLowerCase()}`}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--secondary-text)', fontSize: '0.84rem' }}>
                <Leaf size={24} color="var(--soft-leaf-green)" style={{ margin: '0 auto 8px' }} />
                <p>No municipal rounds scheduled on this date.</p>
                <p style={{ fontSize: '0.76rem', marginTop: 4 }}>
                  You can request an on-demand direct pickup below.
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
