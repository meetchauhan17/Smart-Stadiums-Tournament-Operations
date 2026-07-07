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
  success: { bg: '#ECFDF5', border: '#10B981', text: '#047857' },
  warning: { bg: '#FEF3C7', border: '#F59E0B', text: '#B45309' },
  error:   { bg: '#FFF5F5', border: '#FF3366', text: '#C53030' },
  info:    { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' },
  ai:      { bg: '#F3E8FF', border: '#A855F7', text: '#6D28D9' },
};

let toastId = 0;

// ─── Toast Item ───
function ToastItem({ toast, onDismiss }) {
  const c   = COLORS[toast.type] || COLORS.info;
  const Icon = ICONS[toast.type] || Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 80, scale: 0.9, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative flex items-start gap-3 w-[340px] max-w-[calc(100vw-32px)] p-4 rounded-lg border-2 shadow-none"
      role="alert"
      aria-live="polite"
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${c.border}` }}
      >
        <Icon size={14} style={{ color: c.border }} />
      </div>

      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-[11px] font-heading font-bold uppercase tracking-wider mb-0.5"
             style={{ color: c.text }}>
            {toast.title}
          </p>
        )}
        <p className="text-xs text-[#111827] font-semibold leading-snug">{toast.message}</p>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="p-1 rounded text-[#6B7280] hover:text-[#111827] hover:bg-black/5 transition-colors shrink-0 cursor-pointer"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

// ─── Provider ───
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

// ─── Hook ───
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast() must be inside <ToastProvider>');
  return ctx;
}
