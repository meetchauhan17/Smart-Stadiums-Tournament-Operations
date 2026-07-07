import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Zap, Info, CheckCircle, MapPin, Clock } from 'lucide-react';

import { useStadium } from '../context/StadiumContext';

// ─── Config ───────────────────────────────────────────────────────
const SEVERITY = {
  critical: {
    icon:      Zap,
    color:     '#FF3366',
    bg:        'rgba(255,51,102,0.07)',
    border:    '#FF3366',
    badge:     'rgba(255,51,102,0.15)',
    badgeText: '#FF3366',
    label:     'CRITICAL',
    glow:      '0 0 16px rgba(255,51,102,0.25)',
  },
  high: {
    icon:      AlertTriangle,
    color:     '#FF8C42',
    bg:        'rgba(255,140,66,0.07)',
    border:    '#FF8C42',
    badge:     'rgba(255,140,66,0.15)',
    badgeText: '#FF8C42',
    label:     'HIGH',
    glow:      '0 0 16px rgba(255,140,66,0.2)',
  },
  warning: {
    icon:      AlertTriangle,
    color:     '#FFB800',
    bg:        'rgba(255,184,0,0.07)',
    border:    '#FFB800',
    badge:     'rgba(255,184,0,0.15)',
    badgeText: '#FFB800',
    label:     'WARNING',
    glow:      '0 0 16px rgba(255,184,0,0.2)',
  },
  medium: {
    icon:      AlertTriangle,
    color:     '#FFB800',
    bg:        'rgba(255,184,0,0.07)',
    border:    '#FFB800',
    badge:     'rgba(255,184,0,0.15)',
    badgeText: '#FFB800',
    label:     'MEDIUM',
    glow:      '0 0 12px rgba(255,184,0,0.15)',
  },
  info: {
    icon:      Info,
    color:     '#00D4FF',
    bg:        'rgba(0,212,255,0.06)',
    border:    '#00D4FF',
    badge:     'rgba(0,212,255,0.12)',
    badgeText: '#00D4FF',
    label:     'INFO',
    glow:      '0 0 12px rgba(0,212,255,0.15)',
  },
  low: {
    icon:      Info,
    color:     '#4A6580',
    bg:        'rgba(74,101,128,0.08)',
    border:    '#4A6580',
    badge:     'rgba(74,101,128,0.15)',
    badgeText: '#4A6580',
    label:     'LOW',
    glow:      'none',
  },
  success: {
    icon:      CheckCircle,
    color:     '#00FF87',
    bg:        'rgba(0,255,135,0.06)',
    border:    '#00FF87',
    badge:     'rgba(0,255,135,0.12)',
    badgeText: '#00FF87',
    label:     'RESOLVED',
    glow:      '0 0 12px rgba(0,255,135,0.15)',
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
 * AlertBanner — single alert item
 *
 * @prop {object} alert    - { id, severity, zone, message, timestamp, resolved, suggestedAction }
 * @prop {fn}     onDismiss  - (id) => void
 * @prop {fn}     onResolve  - (id) => void
 * @prop {boolean} compact  - Condensed layout for lists
 * @prop {number}  index    - Stagger index
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
      initial={{ opacity: 0, x: 60, scale: 0.96 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 60, scale: 0.95, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{
        layout:  { duration: 0.25 },
        default: { duration: 0.3, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] },
      }}
      className={`relative overflow-hidden rounded-xl border ${compact ? 'p-3' : 'p-4'} ${
        showUrgent ? 'animate-[pulse_1.5s_infinite]' : ''
      }`}
      style={{
        background:  sev.bg,
        borderColor: showUrgent ? 'rgba(255, 51, 102, 0.6)' : `${sev.border}22`,
        borderLeft:  `3px solid ${showUrgent ? '#FF3366' : sev.color}`,
        boxShadow:   showUrgent ? '0 0 14px rgba(255, 51, 102, 0.35)' : sev.glow,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-lg flex items-center justify-center shrink-0`}
          style={{ background: sev.badge }}
        >
          <Icon
            size={compact ? 13 : 15}
            style={{ color: sev.color }}
            className={alert.severity === 'critical' && !alert.resolved ? 'animate-pulse' : ''}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: badges */}
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span
              className="text-[9px] font-bold tracking-[0.12em] px-1.5 py-0.5 rounded"
              style={{ background: sev.badge, color: sev.badgeText }}
            >
              {sev.label}
            </span>

            {alert.type && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-white/5 text-[#4A6580] uppercase tracking-wider">
                {alert.type.replace(/_/g, ' ')}
              </span>
            )}

            {alert.isAIGenerated && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#00D4FF]/10 text-[#00D4FF]">
                ⚡ AI DETECTED
              </span>
            )}
          </div>

          {/* Message */}
          <p className={`text-[#E8F4FD] leading-snug ${compact ? 'text-xs' : 'text-sm'}`}>
            {alert.message}
          </p>

          {/* Suggested action (non-compact) */}
          {!compact && alert.suggestedAction && !alert.resolved && (
            <p className="mt-1.5 text-[10px] text-[#4A6580] leading-snug">
              <span style={{ color: sev.color }}>→</span> {alert.suggestedAction}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {alert.zone && (
              <span className="flex items-center gap-1 text-[10px] text-[#4A6580]">
                <MapPin size={9} />
                {alert.zone}
              </span>
            )}
            {alert.timestamp && (
              <span className="flex items-center gap-1 text-[10px] text-[#4A6580]">
                <Clock size={9} />
                {formatTimestamp(alert.timestamp)}
              </span>
            )}
            {alert.responseTime && (
              <span className="text-[10px] text-[#00FF87]">
                ✓ Responded in {alert.responseTime}
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
                className="text-[9px] font-bold px-2.5 py-1 rounded-lg border transition-all"
                style={{
                  borderColor: '#00FF8730',
                  color: '#00FF87',
                  background: 'rgba(0,255,135,0.06)',
                }}
              >
                Resolve
              </button>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                aria-label={`Dismiss alert: ${alert.message}`}
                className="p-1 rounded-lg text-[#4A6580] hover:text-[#E8F4FD] hover:bg-white/5 transition-colors flex items-center justify-center"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * AlertList — wraps multiple AlertBanners with AnimatePresence
 *
 * @prop {Array}   alerts
 * @prop {fn}      onDismiss
 * @prop {fn}      onResolve
 * @prop {boolean} showResolved
 * @prop {boolean} compact
 * @prop {number}  maxItems
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
          className="flex flex-col items-center justify-center py-10 text-[#4A6580]"
        >
          <CheckCircle size={28} className="mb-2 opacity-25" />
          <p className="text-sm">All clear — no active alerts</p>
        </motion.div>
      )}
    </div>
  );
}
