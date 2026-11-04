import React, { useState, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  ChevronRight,
  Loader2,
  Inbox,
  AlertCircle
} from 'lucide-react';

export const WASTE_CATEGORIES = ['Plastic', 'Organic', 'Electronic', 'Medical', 'Recyclable', 'Metal', 'Glass'];
export const PICKUP_STATUSES = ['Reported', 'Confirmed', 'Assigned', 'In Progress', 'Collected', 'Recycled', 'Rejected', 'Cancelled'];

export const VALID_STATUS_TRANSITIONS = {
  Reported: ['Confirmed', 'Assigned', 'Rejected', 'Cancelled'],
  Confirmed: ['Assigned', 'In Progress', 'Rejected', 'Cancelled'],
  Assigned: ['In Progress', 'Collected', 'Confirmed', 'Cancelled'],
  'In Progress': ['Collected', 'Cancelled'],
  Collected: ['Recycled'],
  Recycled: [],
  Rejected: ['Confirmed'],
  Cancelled: []
};

export const COIMBATORE_ZONES = [
  'Central Zone',
  'East Zone',
  'West Zone',
  'North Zone',
  'South Zone'
];

export const COIMBATORE_WARDS = [
  'Ward 15 - Ganapathy',
  'Ward 18 - Saravanampatti',
  'Ward 24 - RS Puram',
  'Ward 32 - Gandhipuram',
  'Ward 38 - Peelamedu',
  'Ward 45 - Saibaba Colony',
  'Ward 54 - Singanallur',
  'Ward 62 - Race Course',
  'Ward 68 - Vadavalli',
  'Ward 72 - Town Hall',
  'Ward 81 - Ukkadam',
  'Ward 90 - Podanur',
  'Ward 95 - Kovaipudur',
  'Ward 98 - Kuniyamuthur'
];

export const COIMBATORE_LOCALITIES = [
  'RS Puram',
  'Gandhipuram',
  'Peelamedu',
  'Saibaba Colony',
  'Race Course',
  'Singanallur',
  'Saravanampatti',
  'Vadavalli',
  'Kovaipudur',
  'Ukkadam',
  'Podanur',
  'Ganapathy',
  'Town Hall',
  'Kuniyamuthur',
  'Thudiyalur',
  'Kavundampalayam',
  'Kalapatti',
  'Ramanathapuram',
  'Sundarapuram',
  'hope College'
];

export const formatISTDate = (dateInput, includeTime = false) => {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {})
  };
  return d.toLocaleString('en-IN', options) + (includeTime ? ' IST' : '');
};

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = React.useMemo(() => ({
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    warning: (msg) => showToast(msg, 'warning'),
    info: (msg) => showToast(msg, 'info')
  }), [showToast]);

  return { toasts, showToast, dismissToast, toast, removeToast: dismissToast };
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxWidth: 400
    }}>
      {toasts.map(t => {
        const isErr = t.type === 'error';
        const isWarn = t.type === 'warning';
        const bg = isErr ? '#fef2f2' : isWarn ? '#fffbeb' : '#f0fdf4';
        const border = isErr ? '#fecaca' : isWarn ? '#fde68a' : '#86efac';
        const color = isErr ? '#991b1b' : isWarn ? '#92400e' : '#166534';
        return (
          <div
            key={t.id}
            style={{
              background: bg,
              border: `1.5px solid ${border}`,
              color,
              padding: '12px 16px',
              borderRadius: 14,
              boxShadow: '0 10px 28px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            {isErr ? <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} /> :
             isWarn ? <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} /> :
             <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />}
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              style={{ background: 'transparent', border: 'none', color, cursor: 'pointer', padding: 2 }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function AdminPageHeader({ breadcrumb = 'Operations', title, subtitle, actions }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1.5px solid var(--border-light)',
      borderRadius: 20,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 20
    }}>
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--secondary-green)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 4
        }}>
          <span>Coimbatore Command Centre</span>
          <ChevronRight size={13} />
          <span>{breadcrumb}</span>
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-text)', letterSpacing: '-0.3px' }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '0.84rem', color: 'var(--secondary-text)', marginTop: 3 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = String(status || 'Unknown');
  let bg = '#f1f5f9';
  let color = '#334155';
  let border = '#cbd5e1';

  if (['Collected', 'Recycled', 'Resolved', 'Completed', 'Available', 'Active', 'Operational', 'Verified Municipal Facility', 'Green'].includes(s)) {
    bg = '#dcfce7';
    color = '#166534';
    border = '#86efac';
  } else if (['Assigned', 'Confirmed', 'In Progress', 'On Duty', 'In Service', 'Dispatched', 'Approved', 'Scheduled', 'Authorised Partner', 'Upcoming'].includes(s)) {
    bg = '#e0f2fe';
    color = '#0369a1';
    border = '#7dd3fc';
  } else if (['Reported', 'Submitted', 'Under Review', 'Pending', 'Under Maintenance', 'On Leave', 'Pending Verification', 'Medium', 'High', 'Yellow', 'Draft'].includes(s)) {
    bg = '#fef3c7';
    color = '#92400e';
    border = '#fde68a';
  } else if (['Rejected', 'Cancelled', 'Out of Service', 'Deactivated', 'Inactive', 'Critical', 'Urgent', 'Hazardous', 'Overdue', 'Red', 'Unverified'].includes(s)) {
    bg = '#fee2e2';
    color = '#991b1b';
    border = '#fecaca';
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: '0.73rem',
      fontWeight: 700,
      background: bg,
      color,
      border: `1px solid ${border}`,
      whiteSpace: 'nowrap'
    }}>
      {s}
    </span>
  );
}

export function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  danger = true,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: 16
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        maxWidth: 440,
        width: '100%',
        padding: '24px',
        border: '1.5px solid var(--border-light)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: danger ? '#fef2f2' : '#f0fdf4',
            color: danger ? '#dc2626' : '#166534',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {danger ? <AlertTriangle size={20} /> : <Info size={20} />}
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-text)' }}>{title}</h3>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--secondary-text)', lineHeight: 1.5, marginBottom: 20 }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '8px 18px',
              fontSize: '0.84rem',
              fontWeight: 700,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: danger ? '#dc2626' : 'var(--primary-forest)',
              color: '#ffffff'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LoadingState({ label = 'Loading municipal operations data...' }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1.5px solid var(--border-light)',
      borderRadius: 20,
      padding: '48px 24px',
      textAlign: 'center',
      color: 'var(--secondary-text)'
    }}>
      <Loader2 size={28} color="var(--primary-forest)" className="animate-spin" style={{ margin: '0 auto 10px' }} />
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-text)' }}>{label}</div>
    </div>
  );
}

export function EmptyState({ title = 'No records found', subtitle = 'No matching records exist in the database for the current filter criteria.', action }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1.5px dashed var(--border-light)',
      borderRadius: 18,
      padding: '40px 24px',
      textAlign: 'center'
    }}>
      <Inbox size={32} color="var(--secondary-green)" style={{ margin: '0 auto 10px', opacity: 0.7 }} />
      <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary-text)' }}>{title}</h4>
      <p style={{ fontSize: '0.82rem', color: 'var(--secondary-text)', marginTop: 4, maxWidth: 460, marginInline: 'auto' }}>
        {subtitle}
      </p>
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function PaginationBar({ page, totalPages, totalCount, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 14,
      marginTop: 14,
      borderTop: '1px solid var(--border-light)',
      fontSize: '0.8rem',
      color: 'var(--secondary-text)'
    }}>
      <span>Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total records)</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="btn-secondary"
          style={{ padding: '5px 12px', fontSize: '0.78rem', opacity: page <= 1 ? 0.5 : 1 }}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="btn-secondary"
          style={{ padding: '5px 12px', fontSize: '0.78rem', opacity: page >= totalPages ? 0.5 : 1 }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
