import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Zap, Info, CheckCircle, MapPin, Clock } from 'lucide-react';

import { useStadium } from '../context/StadiumContext';

// ─── Config (Flat Design Colors) ───────────────────────────────────
const SEVERITY = {
  critical: {
    icon:      Zap,
    color:     '#FF3366',
    bg:        '#FFF5F5',
    border:    '#FF3366',
    badge:     '#FFFFFF',
    badgeText: '#FF3366',
    label:     'CRITICAL',
  },
  high: {
    icon:      AlertTriangle,
    color:     '#FF8C42',
    bg:        '#FFFBF7',
    border:    '#FF8C42',
    badge:     '#FFFFFF',
    badgeText: '#FF8C42',
    label:     'HIGH',
  },
  warning: {
    icon:      AlertTriangle,
    color:     '#F59E0B',
    bg:        '#FEF3C7',
    border:    '#F59E0B',
    badge:     '#FFFFFF',
    badgeText: '#B45309',
    label:     'WARNING',
  },
  medium: {
    icon:      AlertTriangle,
    color:     '#F59E0B',
    bg:        '#FEF3C7',
    border:    '#F59E0B',
    badge:     '#FFFFFF',
    badgeText: '#B45309',
    label:     'MEDIUM',
  },
  info: {
    icon:      Info,
    color:     '#3B82F6',
    bg:        '#EFF6FF',
    border:    '#3B82F6',
    badge:     '#FFFFFF',
    badgeText: '#1D4ED8',
    label:     'INFO',
  },
  low: {
    icon:      Info,
    color:     '#6B7280',
    bg:        '#F3F4F6',
    border:    '#6B7280',
    badge:     '#FFFFFF',
    badgeText: '#6B7280',
    label:     'LOW',
  },
  success: {
    icon:      CheckCircle,
    color:     '#10B981',
    bg:        '#ECFDF5',
    border:    '#10B981',
    badge:     '#FFFFFF',
    badgeText: '#047857',
    label:     'RESOLVED',
  },
};

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * AlertBanner — Flat Block Style
 */
export default function AlertBanner({
  alert,
  onDismiss,
  onResolve,
  compact = false,
  index = 0,
}) {
  const { matchDayMode } = useStadium();

  if (!alert) return null;

  const sev = alert.resolved
    ? SEVERITY.success
    : SEVERITY[alert.severity] || SEVERITY.info;

  const Icon = sev.icon;
  const showUrgent = matchDayMode && !alert.resolved;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.98 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 40, scale: 0.98, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{
        layout:  { duration: 0.2 },
        default: { duration: 0.2, delay: index * 0.03, ease: 'easeOut' },
      }}
      className={`relative overflow-hidden rounded-lg border-2 shadow-none ${compact ? 'p-3' : 'p-5'} ${
        showUrgent ? 'border-[#FF3366] bg-[#FFF5F5] animate-pulse-slow' : ''
      }`}
      style={{
        backgroundColor: showUrgent ? '#FFF5F5' : sev.bg,
        borderColor: showUrgent ? '#FF3366' : '#E5E7EB',
        borderLeft: `6px solid ${showUrgent ? '#FF3366' : sev.color}`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div
          className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center shrink-0 border border-[#E5E7EB] bg-white`}
        >
          <Icon
            size={compact ? 14 : 16}
            style={{ color: showUrgent ? '#FF3366' : sev.color }}
            className={alert.severity === 'critical' && !alert.resolved ? 'animate-pulse' : ''}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: badges */}
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span
              className="text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded border border-[#E5E7EB]"
              style={{ backgroundColor: '#FFFFFF', color: showUrgent ? '#FF3366' : sev.badgeText }}
            >
              {showUrgent ? 'URGENT' : sev.label}
            </span>

            {alert.type && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-200/50 text-[#6B7280] uppercase tracking-wider">
                {alert.type.replace(/_/g, ' ')}
              </span>
            )}

            {alert.isAIGenerated && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                ⚡ AI DETECTED
              </span>
            )}
          </div>

          {/* Message */}
          <p className={`text-[#111827] font-semibold leading-snug ${compact ? 'text-xs' : 'text-sm'}`}>
            {alert.message}
          </p>

          {/* Suggested action */}
          {!compact && alert.suggestedAction && !alert.resolved && (
            <p className="mt-1.5 text-[11px] text-[#6B7280] leading-snug font-semibold">
              <span style={{ color: showUrgent ? '#FF3366' : sev.color }}>Action Required:</span> {alert.suggestedAction}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {alert.zone && (
              <span className="flex items-center gap-1 text-[10px] text-[#6B7280] font-bold uppercase">
                <MapPin size={10} />
                Zone {alert.zone}
              </span>
            )}
            {alert.timestamp && (
              <span className="flex items-center gap-1 text-[10px] text-[#6B7280] font-semibold">
                <Clock size={10} />
                {formatTimestamp(alert.timestamp)}
              </span>
            )}
            {alert.responseTime && (
              <span className="text-[10px] text-[#10B981] font-bold">
                ✓ Resolved in {alert.responseTime}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!alert.resolved && (
          <div className="flex flex-col gap-1.5 shrink-0">
            {onResolve && (
              <button
                onClick={() => onResolve(alert.id)}
                aria-label={`Resolve alert: ${alert.message}`}
                className="text-[10px] font-bold px-3 py-1.5 rounded border-2 border-[#10B981] bg-white text-[#10B981] hover:bg-[#ECFDF5] hover:scale-105 transition-all cursor-pointer"
              >
                Resolve
              </button>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                aria-label={`Dismiss alert: ${alert.message}`}
                className="p-1.5 rounded hover:bg-gray-100 text-[#6B7280] hover:text-[#111827] transition-colors flex items-center justify-center cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * AlertList — wraps multiple AlertBanners
 */
export function AlertList({
  alerts = [],
  onDismiss,
  onResolve,
  showResolved = false,
  compact = false,
  maxItems,
}) {
  const visible = (showResolved ? alerts : alerts.filter(a => !a.resolved))
    .slice(0, maxItems);

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout" initial={false}>
        {visible.map((alert, i) => (
          <AlertBanner
            key={alert.id}
            alert={alert}
            onDismiss={onDismiss}
            onResolve={onResolve}
            compact={compact}
            index={i}
          />
        ))}
      </AnimatePresence>

      {visible.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-10 text-[#6B7280]"
        >
          <CheckCircle size={28} className="mb-2 text-[#10B981] opacity-75" />
          <p className="text-sm font-semibold">All clear — no active alerts</p>
        </motion.div>
      )}
    </div>
  );
}
