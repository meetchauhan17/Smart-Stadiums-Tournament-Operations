// ─── Toast Notification System ────────────────────────────────────
// Global top-right toast queue for: AI ready, alert resolved, staff change.
// Usage: import { useToast } from './ToastProvider'
//        const toast = useToast();
//        toast.success('AI response ready!');

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, Zap, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error:   AlertTriangle,
  info:    Info,
  ai:      Zap,
};

const COLORS = {
  success: { bg: 'rgba(0,255,135,0.08)', border: '#00FF87', text: '#00FF87', glow: 'rgba(0,255,135,0.25)' },
  warning: { bg: 'rgba(255,184,0,0.08)', border: '#FFB800', text: '#FFB800', glow: 'rgba(255,184,0,0.25)' },
  error:   { bg: 'rgba(255,51,102,0.08)', border: '#FF3366', text: '#FF3366', glow: 'rgba(255,51,102,0.25)' },
  info:    { bg: 'rgba(0,212,255,0.08)', border: '#00D4FF', text: '#00D4FF', glow: 'rgba(0,212,255,0.25)' },
  ai:      { bg: 'rgba(168,85,247,0.08)', border: '#A855F7', text: '#A855F7', glow: 'rgba(168,85,247,0.25)' },
};

let toastId = 0;

// ─── Toast Item ───────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }) {
  const c   = COLORS[toast.type] || COLORS.info;
  const Icon = ICONS[toast.type] || Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 80, scale: 0.9, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-start gap-3 w-[340px] max-w-[calc(100vw-32px)] p-4 rounded-2xl shadow-2xl border backdrop-blur-sm"
      role="alert"
      aria-live="polite"
      style={{
        background:  c.bg,
        borderColor: `${c.border}35`,
        borderLeft:  `3px solid ${c.border}`,
        boxShadow:   `0 8px 32px ${c.glow}, 0 0 0 1px ${c.border}15`,
      }}
    >
      {/* Glow blob */}
      <div
        className="absolute -top-2 -right-2 w-24 h-24 rounded-full blur-2xl pointer-events-none"
        style={{ background: c.glow, opacity: 0.3 }}
      />

      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${c.border}18` }}
      >
        <Icon size={15} style={{ color: c.border }} />
      </div>

      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-[11px] font-heading font-bold uppercase tracking-[0.12em] mb-0.5"
             style={{ color: c.text }}>
            {toast.title}
          </p>
        )}
        <p className="text-xs text-[#E8F4FD] leading-snug">{toast.message}</p>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="p-1 rounded-lg text-[#4A6580] hover:text-[#E8F4FD] hover:bg-white/5 transition-colors shrink-0"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback((type, message, title, duration = 4500) => {
    const id = `toast-${++toastId}`;
    setToasts(prev => [...prev.slice(-4), { id, type, message, title }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  // Convenience methods
  const toast = {
    success: (msg, title) => push('success', msg, title),
    warning: (msg, title) => push('warning', msg, title),
    error:   (msg, title) => push('error',   msg, title),
    info:    (msg, title) => push('info',    msg, title),
    ai:      (msg, title) => push('ai',      msg, title),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast portal — fixed top-right */}
      <div
        className="fixed top-20 right-4 z-[600] flex flex-col gap-2.5 pointer-events-none"
        aria-label="Notifications"
        role="region"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast() must be inside <ToastProvider>');
  return ctx;
}
