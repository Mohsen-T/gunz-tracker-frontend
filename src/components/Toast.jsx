import { useState, useEffect, useCallback, createContext, useContext } from 'react';

/**
 * Global toast notification system.
 * Wrap your app in <ToastProvider> and call useToast().show() from anywhere.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Listed!', 'Node #1 is now on sale');
 *   toast.error('Failed', 'Insufficient funds');
 */

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((opts) => {
    const id = nextId++;
    const toast = {
      id,
      type: opts.type || 'info',
      title: opts.title || '',
      message: opts.message || '',
      txHash: opts.txHash || null,
      duration: opts.duration ?? 5000,
    };
    setToasts(prev => [...prev, toast]);
    if (toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration);
    }
    return id;
  }, [remove]);

  const api = {
    show,
    success: (title, message, opts = {}) => show({ type: 'success', title, message, ...opts }),
    error:   (title, message, opts = {}) => show({ type: 'error',   title, message, ...opts }),
    info:    (title, message, opts = {}) => show({ type: 'info',    title, message, ...opts }),
    pending: (title, message, opts = {}) => show({ type: 'pending', title, message, duration: 0, ...opts }),
    dismiss: remove,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none',
      maxWidth: 380,
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const config = {
    success: { color: '#4ADE80', bg: '#0a180a', icon: '✓', label: 'SUCCESS' },
    error:   { color: '#EF4444', bg: '#1a0a0a', icon: '✕', label: 'ERROR' },
    info:    { color: '#60A5FA', bg: '#0a1018', icon: 'i', label: 'INFO' },
    pending: { color: '#FBBF24', bg: '#181408', icon: '⟳', label: 'PENDING' },
  }[toast.type] || {};

  return (
    <div style={{
      pointerEvents: 'auto',
      background: config.bg,
      border: `1px solid ${config.color}55`,
      borderLeft: `3px solid ${config.color}`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(8px)',
      transform: visible ? 'translateX(0)' : 'translateX(120%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
      minWidth: 280,
    }}>
      {/* Icon */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: config.color + '22', border: `1px solid ${config.color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, color: config.color,
        flexShrink: 0,
        animation: toast.type === 'pending' ? 'spin 1s linear infinite' : 'none',
      }}>{config.icon}</div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 8, fontWeight: 800, color: config.color,
          letterSpacing: 1, marginBottom: 2,
        }}>{config.label}</div>
        {toast.title && (
          <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd', marginBottom: 2 }}>
            {toast.title}
          </div>
        )}
        {toast.message && (
          <div style={{ fontSize: 10, color: '#aaa', lineHeight: 1.5 }}>
            {toast.message}
          </div>
        )}
        {toast.txHash && (
          <a
            href={`https://gunzscan.io/tx/${toast.txHash}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 9, color: config.color, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}
          >
            View TX ↗
          </a>
        )}
      </div>

      {/* Close */}
      <button onClick={onDismiss} style={{
        background: 'none', border: 'none', color: '#556',
        cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
        padding: 0, width: 16, height: 16, flexShrink: 0,
      }}>✕</button>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
