import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [locality, setLocality] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [city, setCity] = useState('Coimbatore');
  const [state] = useState('Tamil Nadu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (tab === 'login') {
        const res = await api.login({ email: email.trim().toLowerCase(), password });
        if (res.success) {
          setSuccessMsg('Signed in successfully!');
          setTimeout(() => {
            onAuthSuccess(res.user);
            onClose();
          }, 350);
        } else {
          setError(res.message || 'Invalid email or password.');
        }
      } else {
        const cleanPhone = phone.trim() 
          ? (phone.trim().startsWith('+91') ? phone.trim() : `+91 ${phone.trim().replace(/^\+?91\s*/, '')}`) 
          : '';
        const res = await api.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: cleanPhone,
          street: street.trim(),
          locality: locality.trim(),
          city: city.trim() || 'Coimbatore',
          state: state.trim() || 'Tamil Nadu',
          zip: pinCode.trim()
        });
        if (res.success) {
          setSuccessMsg('Account registered successfully!');
          setTimeout(() => {
            onAuthSuccess(res.user);
            onClose();
          }, 350);
        } else {
          setError(res.message || 'Registration failed.');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
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
          maxWidth: 440,
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
            color: 'var(--secondary-text)',
            padding: 6,
            borderRadius: '50%',
            background: 'transparent',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--very-light-mint)',
          borderRadius: 999,
          padding: 4,
          marginBottom: 20,
          border: '1.5px solid var(--border-light)'
        }}>
          <button
            onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 999,
              fontSize: '0.84rem',
              fontWeight: 700,
              background: tab === 'login' ? 'var(--primary-forest)' : 'transparent',
              color: tab === 'login' ? '#ffffff' : 'var(--primary-text)',
              transition: 'all 0.15s'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 999,
              fontSize: '0.84rem',
              fontWeight: 700,
              background: tab === 'register' ? 'var(--primary-forest)' : 'transparent',
              color: tab === 'register' ? '#ffffff' : 'var(--primary-text)',
              transition: 'all 0.15s'
            }}
          >
            Create Citizen Account
          </button>
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: 4 }}>
          {tab === 'login' ? 'Welcome Back' : 'Join WasteWise'}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: 18 }}>
          {tab === 'login' 
            ? 'Sign in to access your pickup requests and points.' 
            : 'Register to schedule doorstep waste pickups and track recycling metrics.'}
        </p>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: '0.8rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: '0.8rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 5 }}>
                Full Name *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--border-light)', borderRadius: 12, padding: '8px 12px' }}>
                <UserIcon size={16} color="var(--secondary-green)" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.86rem', color: 'var(--primary-text)' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 5 }}>
              Email Address *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--border-light)', borderRadius: 12, padding: '8px 12px' }}>
              <Mail size={16} color="var(--secondary-green)" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.86rem', color: 'var(--primary-text)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 5 }}>
              Password *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--border-light)', borderRadius: 12, padding: '8px 12px' }}>
              <Lock size={16} color="var(--secondary-green)" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.86rem', color: 'var(--primary-text)' }}
              />
            </div>
          </div>

          {tab === 'register' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 5 }}>
                  Mobile Number (India +91)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--border-light)', borderRadius: 12, padding: '8px 12px' }}>
                  <Phone size={16} color="var(--secondary-green)" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.86rem', color: 'var(--primary-text)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 5 }}>
                  Street / Door No.
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--border-light)', borderRadius: 12, padding: '8px 12px' }}>
                  <MapPin size={16} color="var(--secondary-green)" />
                  <input
                    type="text"
                    placeholder="e.g. 42 Cross Cut Road"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.86rem', color: 'var(--primary-text)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 5 }}>
                  Locality / Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. RS Puram, Gandhipuram, Peelamedu"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  style={{
                    border: '1.5px solid var(--border-light)',
                    borderRadius: 12,
                    padding: '8px 12px',
                    fontSize: '0.86rem',
                    width: '100%',
                    color: 'var(--primary-text)'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 5 }}>
                    City (Default)
                  </label>
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{
                      border: '1.5px solid var(--border-light)',
                      borderRadius: 12,
                      padding: '8px 12px',
                      fontSize: '0.86rem',
                      width: '100%',
                      color: 'var(--primary-text)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', marginBottom: 5 }}>
                    PIN Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="641001"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    style={{
                      border: '1.5px solid var(--border-light)',
                      borderRadius: 12,
                      padding: '8px 12px',
                      fontSize: '0.86rem',
                      width: '100%',
                      color: 'var(--primary-text)'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '11px', marginTop: 6 }}
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
