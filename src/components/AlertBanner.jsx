import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Zap, Info, CheckCircle, MapPin, Clock } from 'lucide-react';

import { useStadium } from '../context/StadiumContext';

// ─── Config (Dark Theme Colors) ────────────────────────────────────
const SEVERITY = {
  critical: {
    icon:      Zap,
    color:     '#FF3366',
    bg:        'rgba(255, 51, 102, 0.08)',
    border:    '#FF3366',
    badgeText: '#FF3366',
    label:     'CRITICAL',
  },
  high: {
    icon:      AlertTriangle,
    color:     '#FF8C42',
    bg:        'rgba(255, 140, 66, 0.08)',
    border:    '#FF8C42',
    badgeText: '#FF8C42',
    label:     'HIGH',
  },
  warning: {
    icon:      AlertTriangle,
    color:     '#FFB800',
    bg:        'rgba(255, 184, 0, 0.08)',
    border:    '#FFB800',
    badgeText: '#FFB800',
    label:     'WARNING',
  },
  medium: {
    icon:      AlertTriangle,
    color:     '#FFB800',
    bg:        'rgba(255, 184, 0, 0.08)',
    border:    '#FFB800',
    badgeText: '#FFB800',
    label:     'MEDIUM',
  },
  info: {
    icon:      Info,
    color:     '#00D4FF',
    bg:        'rgba(0, 212, 255, 0.06)',
    border:    '#00D4FF',
    badgeText: '#00D4FF',
    label:     'INFO',
  },
  low: {
    icon:      Info,
    color:     '#8892B0',
    bg:        'rgba(136, 146, 176, 0.06)',
    border:    '#8892B0',
    badgeText: '#8892B0',
    label:     'LOW',
  },
  success: {
    icon:      CheckCircle,
    color:     '#00FF87',
    bg:        'rgba(0, 255, 135, 0.06)',
    border:    '#00FF87',
    badgeText: '#00FF87',
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
 * AlertBanner — Dark Theme
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
      className={`relative overflow-hidden rounded-lg border shadow-none ${compact ? 'p-3' : 'p-5'} ${
        showUrgent ? 'animate-pulse-slow' : ''
      }`}
      style={{
        backgroundColor: showUrgent ? 'rgba(255, 51, 102, 0.1)' : sev.bg,
        borderColor: showUrgent ? '#FF3366' : 'rgba(0,212,255,0.12)',
        borderLeft: `4px solid ${showUrgent ? '#FF3366' : sev.color}`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div
          className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center shrink-0 border`}
          style={{
            backgroundColor: `${showUrgent ? 'rgba(255,51,102,0.15)' : sev.bg}`,
            borderColor: showUrgent ? '#FF3366' : sev.color,
          }}
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
              className="text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded border"
              style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderColor: showUrgent ? '#FF3366' : sev.color,
                color: showUrgent ? '#FF3366' : sev.badgeText,
              }}
            >
              {showUrgent ? 'URGENT' : sev.label}
            </span>

            {alert.type && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0D1B2E] text-[#8892B0] uppercase tracking-wider border border-[rgba(0,212,255,0.1)]">
                {alert.type.replace(/_/g, ' ')}
              </span>
            )}

            {alert.isAIGenerated && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20">
                ⚡ AI DETECTED
              </span>
            )}
          </div>

          {/* Message */}
          <p className={`text-[#E8F4FD] font-semibold leading-snug ${compact ? 'text-xs' : 'text-sm'}`}>
            {alert.message}
          </p>

          {/* Suggested action */}
          {!compact && alert.suggestedAction && !alert.resolved && (
            <p className="mt-1.5 text-[11px] text-[#8892B0] leading-snug font-semibold">
              <span style={{ color: showUrgent ? '#FF3366' : sev.color }}>Action Required:</span> {alert.suggestedAction}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {alert.zone && (
              <span className="flex items-center gap-1 text-[10px] text-[#8892B0] font-bold uppercase">
                <MapPin size={10} />
                Zone {alert.zone}
              </span>
            )}
            {alert.timestamp && (
              <span className="flex items-center gap-1 text-[10px] text-[#8892B0] font-semibold">
                <Clock size={10} />
                {formatTimestamp(alert.timestamp)}
              </span>
            )}
            {alert.responseTime && (
              <span className="text-[10px] text-[#00FF87] font-bold">
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
                className="text-[10px] font-bold px-3 py-1.5 rounded border border-[#00FF87] bg-[#00FF87]/10 text-[#00FF87] hover:bg-[#00FF87]/20 hover:scale-105 transition-all cursor-pointer"
              >
                Resolve
              </button>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                aria-label={`Dismiss alert: ${alert.message}`}
                className="p-1.5 rounded hover:bg-[#0D1B2E] text-[#8892B0] hover:text-[#E8F4FD] transition-colors flex items-center justify-center cursor-pointer"
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
          className="flex flex-col items-center justify-center py-10 text-[#8892B0]"
        >
          <CheckCircle size={28} className="mb-2 text-[#00FF87] opacity-75" />
          <p className="text-sm font-semibold">All clear — no active alerts</p>
        </motion.div>
      )}
    </div>
  );
}
