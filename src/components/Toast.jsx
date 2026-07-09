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
  success: 'bg-green-600',
  warning: 'bg-amber-500',
  error:   'bg-red-600',
  info:    'bg-blue-600',
  ai:      'bg-purple-600',
};

let toastId = 0;

function ToastItem({ toast, onDismiss }) {
  const bgClass = COLORS[toast.type] || COLORS.info;
  const Icon = ICONS[toast.type] || Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`relative flex items-center justify-between gap-4 w-[340px] max-w-[calc(100vw-32px)] px-6 py-4 rounded-none border-2 border-gray-900 shadow-none text-white font-semibold ${bgClass}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon size={18} className="shrink-0 text-white" />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="text-[10px] font-black uppercase tracking-wider mb-0.5 opacity-90">
              {toast.title}
            </p>
          )}
          <p className="text-sm leading-snug break-words">{toast.message}</p>
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="p-1 text-white opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback((type, message, title, duration = 4000) => {
    const id = `toast-${++toastId}`;
    setToasts(prev => [...prev.slice(-4), { id, type, message, title }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

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
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
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

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast() must be inside <ToastProvider>');
  return ctx;
}
