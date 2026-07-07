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

// ─── Flat Design Color Map ───
const COLOR_MAP = {
  cyan:   { accent: '#3B82F6', border: '#3B82F6', bg: '#EFF6FF', text: '#3B82F6' },
  green:  { accent: '#10B981', border: '#10B981', bg: '#ECFDF5', text: '#10B981' },
  amber:  { accent: '#F59E0B', border: '#F59E0B', bg: '#FEF3C7', text: '#F59E0B' },
  red:    { accent: '#FF3366', border: '#FF3366', bg: '#FFF5F5', text: '#FF3366' },
  purple: { accent: '#A855F7', border: '#A855F7', bg: '#F3E8FF', text: '#A855F7' },
  muted:  { accent: '#6B7280', border: '#6B7280', bg: '#F3F4F6', text: '#6B7280' },
};

/**
 * StatCard — Flat Color Block Style
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
    up:      { icon: TrendingUp,   textColor: '#10B981', bg: '#ECFDF5', sign: '+' },
    down:    { icon: TrendingDown, textColor: '#FF3366', bg: '#FFF5F5', sign: ''  },
    neutral: { icon: Minus,        textColor: '#6B7280', bg: '#F3F4F6', sign: ''  },
  };
  const td = trendConfig[trend] || trendConfig.neutral;
  const TrendIcon = td.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.25, delay }}
      whileHover={isClickable ? { scale: 1.03 } : {}}
      onClick={onClick}
      className={`relative overflow-hidden rounded-lg border-2 bg-white transition-all duration-200 shadow-none ${
        isClickable ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        borderColor: '#E5E7EB',
        borderLeftWidth: '6px',
        borderLeftColor: c.border,
      }}
    >
      <div className="relative p-6">
        {/* ── Top row: label + icon ── */}
        <div className="flex items-start justify-between mb-4">
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
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                {title}
              </p>
            </div>
            {subtitle && (
              <p className="text-[10px] text-[#6B7280] leading-tight mt-0.5">{subtitle}</p>
            )}
          </div>

          {Icon && (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: c.bg }}
            >
              <Icon size={18} style={{ color: c.accent }} />
            </div>
          )}
        </div>

        {/* ── Value ── */}
        <div className="flex items-end gap-1.5 mb-2">
          <motion.p
            key={String(value)}
            className="font-heading font-extrabold leading-none text-[#111827]"
            style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)' }}
          >
            {typeof value === 'number' ? formatValue(value, animated) : value ?? '—'}
          </motion.p>
          {unit && (
            <span className="text-sm font-bold pb-0.5" style={{ color: c.accent }}>
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
              <span>
                {td.sign}{Math.abs(trendValue).toFixed(1)}%
              </span>
            </span>
            <span className="text-[10px] text-[#6B7280] font-semibold">{trendLabel}</span>
          </div>
        )}

        {/* ── Children slot ── */}
        {children && (
          <div className="mt-4 pt-4 border-t-2 border-[#E5E7EB]">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}
