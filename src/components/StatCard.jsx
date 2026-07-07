import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Count-up hook using requestAnimationFrame ─────────────────────
function useCountUp(target, duration = 1200, startOnMount = true) {
  const [display, setDisplay] = useState(0);
  const rafRef   = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!startOnMount) return;

    const numericTarget = parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0;

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed  = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * numericTarget);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, startOnMount]);

  return display;
}

// ─── Format display value ──────────────────────────────────────────
function formatValue(raw, animated) {
  const str = String(raw);
  const isDecimal = str.includes('.');
  const decimals  = isDecimal ? str.split('.')[1]?.length || 1 : 0;

  if (animated >= 1000) {
    return animated.toLocaleString('en-US', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    });
  }
  return animated.toFixed(decimals);
}

// ─── Color Map ────────────────────────────────────────────────────
const COLOR_MAP = {
  cyan:   { accent: '#00D4FF', border: '#00D4FF', glow: 'rgba(0,212,255,0.18)', badge: 'rgba(0,212,255,0.12)', text: '#00D4FF' },
  green:  { accent: '#00FF87', border: '#00FF87', glow: 'rgba(0,255,135,0.18)', badge: 'rgba(0,255,135,0.12)', text: '#00FF87' },
  amber:  { accent: '#FFB800', border: '#FFB800', glow: 'rgba(255,184,0,0.18)',  badge: 'rgba(255,184,0,0.12)',  text: '#FFB800' },
  red:    { accent: '#FF3366', border: '#FF3366', glow: 'rgba(255,51,102,0.18)', badge: 'rgba(255,51,102,0.12)', text: '#FF3366' },
  purple: { accent: '#A855F7', border: '#A855F7', glow: 'rgba(168,85,247,0.18)', badge: 'rgba(168,85,247,0.12)', text: '#A855F7' },
  muted:  { accent: '#4A6580', border: '#4A6580', glow: 'rgba(74,101,128,0.1)',  badge: 'rgba(74,101,128,0.1)',  text: '#4A6580' },
};

/**
 * StatCard
 *
 * @prop {string}  title       - Metric label
 * @prop {*}       value       - Numeric value (counts up on mount)
 * @prop {string}  unit        - Unit suffix (e.g. "kWh", "%", "fans")
 * @prop {'up'|'down'|'neutral'} trend
 * @prop {number}  trendValue  - % change
 * @prop {string}  trendLabel  - e.g. "vs last match"
 * @prop {Component} icon      - Lucide icon
 * @prop {'cyan'|'green'|'amber'|'red'|'purple'|'muted'} color
 * @prop {boolean} pulse       - Pulsing live dot
 * @prop {number}  delay       - Mount animation stagger delay (s)
 * @prop {string}  subtitle    - Small text below title
 * @prop {fn}      onClick
 * @prop {string}  className
 * @prop {node}    children    - Optional slot below value
 */
export default function StatCard({
  title,
  value,
  unit       = '',
  trend      = 'neutral',
  trendValue,
  trendLabel = 'vs previous',
  icon: Icon,
  color      = 'cyan',
  pulse      = false,
  delay      = 0,
  subtitle,
  onClick,
  className  = '',
  children,
}) {
  const c           = COLOR_MAP[color] || COLOR_MAP.cyan;
  const animated    = useCountUp(value);
  const isClickable = Boolean(onClick);

  const trendConfig = {
    up:      { icon: TrendingUp,   textClass: 'text-[#00FF87]', bg: 'rgba(0,255,135,0.10)',  sign: '+' },
    down:    { icon: TrendingDown, textClass: 'text-[#FF3366]', bg: 'rgba(255,51,102,0.10)', sign: ''  },
    neutral: { icon: Minus,        textClass: 'text-[#4A6580]', bg: 'rgba(74,101,128,0.10)', sign: ''  },
  };
  const td = trendConfig[trend] || trendConfig.neutral;
  const TrendIcon = td.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={isClickable ? { y: -3, transition: { duration: 0.18 } } : {}}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border bg-[#0D1B2E] group transition-shadow duration-300 ${
        isClickable ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        borderColor: `rgba(${hexToRgb(c.border)},0.12)`,
        borderLeft:  `2px solid ${c.accent}`,
      }}
    >
      {/* Hover glow background */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, ${c.glow}, transparent 60%)` }}
      />

      <div className="relative p-5">
        {/* ── Top row: label + icon ── */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {pulse && (
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                    style={{ background: c.accent }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ background: c.accent }}
                  />
                </span>
              )}
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4A6580]">
                {title}
              </p>
            </div>
            {subtitle && (
              <p className="text-[10px] text-[#4A6580] leading-tight mt-0.5">{subtitle}</p>
            )}
          </div>

          {Icon && (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative"
              style={{ background: c.badge, border: `1px solid ${c.accent}18` }}
            >
              <Icon size={16} style={{ color: c.accent }} />
            </div>
          )}
        </div>

        {/* ── Value ── */}
        <div className="flex items-end gap-1.5 mb-1">
          <motion.p
            key={String(value)}
            className="font-heading font-bold leading-none"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2rem)', color: '#E8F4FD' }}
          >
            {typeof value === 'number' ? formatValue(value, animated) : value ?? '—'}
          </motion.p>
          {unit && (
            <span className="text-sm font-medium pb-0.5" style={{ color: c.accent }}>
              {unit}
            </span>
          )}
        </div>

        {/* ── Trend ── */}
        {trendValue !== undefined && (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
              style={{ background: td.bg, color: td.textClass.replace('text-[','').replace(']','') }}
            >
              <TrendIcon size={10} style={{ color: td.textClass.replace('text-[','').replace(']','') }} />
              <span className={td.textClass}>
                {td.sign}{Math.abs(trendValue).toFixed(1)}%
              </span>
            </span>
            <span className="text-[10px] text-[#4A6580]">{trendLabel}</span>
          </div>
        )}

        {/* ── Children slot ── */}
        {children && (
          <div className="mt-4 pt-3 border-t border-white/5">
            {children}
          </div>
        )}
      </div>

      {/* Bottom shimmer accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${c.accent} 50%, transparent 100%)`,
          opacity: 0.3,
        }}
      />
    </motion.div>
  );
}

// helper: hex to rgb string
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
