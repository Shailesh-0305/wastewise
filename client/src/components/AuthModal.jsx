import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, MapPin, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [street, setStreet] = useState('Lake Star Dist. No48');
  const [city, setCity] = useState('Buffalo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickDemoFill = (roleType) => {
    setError('');
    setSuccessMsg('');
    if (roleType === 'citizen') {
      setEmail('alex@example.com');
      setPassword('citizen123');
      setTab('login');
    } else if (roleType === 'admin') {
      setEmail('admin@wastewise.org');
      setPassword('admin123');
      setTab('login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (tab === 'login') {
        const res = await api.login({ email, password });
        if (res.success) {
          setSuccessMsg('Signed in successfully!');
          setTimeout(() => {
            onAuthSuccess(res.user);
            onClose();
          }, 400);
        } else {
          setError(res.message || 'Invalid email or password');
        }
      } else {
        const res = await api.register({
          name,
          email,
          password,
          phone,
          street,
          city
        });
        if (res.success) {
          setSuccessMsg('Account registered successfully!');
          setTimeout(() => {
            onAuthSuccess(res.user);
            onClose();
          }, 400);
        } else {
          setError(res.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          padding: '28px 24px',
          position: 'relative',
          borderRadius: 24,
          boxShadow: '0 20px 48px rgba(22, 101, 52, 0.16)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            color: '#718078',
            padding: 6,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'var(--pale-green-section)',
            border: '1.5px solid var(--soft-leaf-green)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-forest)',
            marginBottom: 8
          }}>
            <ShieldCheck size={24} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-text)' }}>
            {tab === 'login' ? 'Sign In to WasteWise' : 'Join WasteWise Community'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--secondary-text)', marginTop: 4 }}>
            {tab === 'login' 
              ? 'Access your curbside pickups, eco points, and recycling tracking'
              : 'Create your citizen profile for scheduled recycling and pickups'}
          </p>
        </div>

        {/* Quick Demo Logins Pill */}
        <div style={{
          background: 'var(--pale-green-section)',
          borderRadius: 14,
          padding: '10px 14px',
          marginBottom: 16,
          border: '1px solid #d4ebd6'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-forest)', textTransform: 'uppercase', marginBottom: 6 }}>
            Quick Demo Auto-Fill:
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('citizen')}
              style={{
                flex: 1,
                padding: '6px 10px',
                background: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                fontSize: '0.76rem',
                fontWeight: 600,
                color: 'var(--primary-forest)',
                transition: 'all 0.15s'
              }}
            >
              👤 Citizen (Alex)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('admin')}
              style={{
                flex: 1,
                padding: '6px 10px',
                background: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                fontSize: '0.76rem',
                fontWeight: 600,
                color: 'var(--primary-forest)',
                transition: 'all 0.15s'
              }}
            >
              🏢 Admin (Supervisor)
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--very-light-mint)',
          padding: 4,
          borderRadius: 999,
          marginBottom: 18,
          border: '1px solid var(--border-light)'
        }}>
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '7px 12px',
              borderRadius: 999,
              fontSize: '0.82rem',
              fontWeight: 700,
              background: tab === 'login' ? '#ffffff' : 'transparent',
              color: tab === 'login' ? 'var(--primary-forest)' : 'var(--secondary-text)',
              boxShadow: tab === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '7px 12px',
              borderRadius: 999,
              fontSize: '0.82rem',
              fontWeight: 700,
              background: tab === 'register' ? '#ffffff' : 'transparent',
              color: tab === 'register' ? 'var(--primary-forest)' : 'var(--secondary-text)',
              boxShadow: tab === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Register
          </button>
        </div>

        {/* Form Alerts */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: '0.8rem',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: '0.8rem',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <CheckCircle size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary-text)', marginBottom: 4 }}>
                Full Name
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#ffffff',
                border: '1.5px solid var(--border-light)',
                borderRadius: 12,
                padding: '9px 12px'
              }}>
                <UserIcon size={16} color="var(--secondary-text)" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Navillera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.88rem', color: 'var(--primary-text)' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary-text)', marginBottom: 4 }}>
              Email Address
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#ffffff',
              border: '1.5px solid var(--border-light)',
              borderRadius: 12,
              padding: '9px 12px'
            }}>
              <Mail size={16} color="var(--secondary-text)" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.88rem', color: 'var(--primary-text)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary-text)', marginBottom: 4 }}>
              Password
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#ffffff',
              border: '1.5px solid var(--border-light)',
              borderRadius: 12,
              padding: '9px 12px'
            }}>
              <Lock size={16} color="var(--secondary-text)" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.88rem', color: 'var(--primary-text)' }}
              />
            </div>
          </div>

          {tab === 'register' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary-text)', marginBottom: 4 }}>
                  Phone Number
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#ffffff',
                  border: '1.5px solid var(--border-light)',
                  borderRadius: 12,
                  padding: '9px 12px'
                }}>
                  <Phone size={16} color="var(--secondary-text)" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.88rem', color: 'var(--primary-text)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary-text)', marginBottom: 4 }}>
                    Address
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#ffffff',
                    border: '1.5px solid var(--border-light)',
                    borderRadius: 12,
                    padding: '9px 12px'
                  }}>
                    <MapPin size={16} color="var(--secondary-text)" />
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Street"
                      style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.84rem', color: 'var(--primary-text)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--primary-text)', marginBottom: 4 }}>
                    City
                  </label>
                  <div style={{
                    background: '#ffffff',
                    border: '1.5px solid var(--border-light)',
                    borderRadius: 12,
                    padding: '9px 12px'
                  }}>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.84rem', color: 'var(--primary-text)' }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: 6, padding: '12px' }}
          >
            {loading ? 'Processing...' : (tab === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}
