import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Count-up hook ──────────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const rafRef   = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const numericTarget = parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0;

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed  = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * numericTarget);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

function formatValue(raw, animated) {
  const str = String(raw);
  const isDecimal = str.includes('.');
  const decimals  = isDecimal ? str.split('.')[1]?.length || 1 : 0;
  if (animated >= 1000) return animated.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  return animated.toFixed(decimals);
}

// ─── Flat color map ─────────────────────────────────────────────────
const COLOR_MAP = {
  cyan:   { accent: '#3B82F6', border: '#3B82F6', bg: '#EFF6FF', text: '#3B82F6' },
  blue:   { accent: '#3B82F6', border: '#3B82F6', bg: '#EFF6FF', text: '#3B82F6' },
  green:  { accent: '#10B981', border: '#10B981', bg: '#ECFDF5', text: '#10B981' },
  amber:  { accent: '#F59E0B', border: '#F59E0B', bg: '#FFFBEB', text: '#F59E0B' },
  red:    { accent: '#EF4444', border: '#EF4444', bg: '#FEF2F2', text: '#EF4444' },
  purple: { accent: '#8B5CF6', border: '#8B5CF6', bg: '#F5F3FF', text: '#8B5CF6' },
  muted:  { accent: '#6B7280', border: '#E5E7EB', bg: '#F9FAFB', text: '#6B7280' },
};

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
    up:      { icon: TrendingUp,   textColor: '#10B981', bg: '#D1FAE5', sign: '+' },
    down:    { icon: TrendingDown, textColor: '#EF4444', bg: '#FEE2E2', sign: '' },
    neutral: { icon: Minus,        textColor: '#6B7280', bg: '#F3F4F6', sign: '' },
  };
  const td = trendConfig[trend] || trendConfig.neutral;
  const TrendIcon = td.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.2, delay }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-150 ${
        isClickable ? 'cursor-pointer hover:border-gray-300' : ''
      } ${className}`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: c.border,
      }}
    >
      <div className="relative p-5">
        {/* ── Top row: label + icon ── */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: c.accent }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: c.accent }} />
                </span>
              )}
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {title}
              </p>
            </div>
            {subtitle && (
              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{subtitle}</p>
            )}
          </div>

          {Icon && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: c.bg }}
            >
              <Icon size={18} style={{ color: c.accent }} />
            </div>
          )}
        </div>

        {/* ── Value ── */}
        <div className="flex items-end gap-1.5 mb-2">
          <p
            className="font-bold leading-none text-gray-900"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
          >
            {typeof value === 'number' ? formatValue(value, animated) : value ?? '—'}
          </p>
          {unit && (
            <span className="text-sm font-semibold pb-0.5" style={{ color: c.accent }}>
              {unit}
            </span>
          )}
        </div>

        {/* ── Trend ── */}
        {trendValue !== undefined && (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
              style={{ background: td.bg, color: td.textColor }}
            >
              <TrendIcon size={10} />
              <span>{td.sign}{Math.abs(trendValue).toFixed(1)}%</span>
            </span>
            <span className="text-[10px] text-gray-400">{trendLabel}</span>
          </div>
        )}

        {children && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}
