/**
 * LiveBadge — Pulsing status indicator
 *
 * @prop {'live'|'offline'|'paused'|'alert'} status
 * @prop {string} label   - Override default label
 * @prop {'sm'|'md'|'lg'} size
 * @prop {string} className
 */
export default function LiveBadge({ status = 'live', label, size = 'md', className = '' }) {
  const config = {
    live: {
      dot:   '#00FF87',
      glow:  'rgba(0,255,135,0.5)',
      text:  '#00FF87',
      bg:    'rgba(0,255,135,0.08)',
      border:'rgba(0,255,135,0.2)',
      ping:  'rgba(0,255,135,0.4)',
      defaultLabel: 'LIVE',
      animate: true,
    },
    alert: {
      dot:   '#FF3366',
      glow:  'rgba(255,51,102,0.5)',
      text:  '#FF3366',
      bg:    'rgba(255,51,102,0.08)',
      border:'rgba(255,51,102,0.2)',
      ping:  'rgba(255,51,102,0.4)',
      defaultLabel: 'ALERT',
      animate: true,
    },
    paused: {
      dot:   '#FFB800',
      glow:  'rgba(255,184,0,0.4)',
      text:  '#FFB800',
      bg:    'rgba(255,184,0,0.08)',
      border:'rgba(255,184,0,0.2)',
      ping:  'rgba(255,184,0,0.3)',
      defaultLabel: 'PAUSED',
      animate: false,
    },
    offline: {
      dot:   '#4A6580',
      glow:  'none',
      text:  '#4A6580',
      bg:    'rgba(74,101,128,0.08)',
      border:'rgba(74,101,128,0.15)',
      ping:  'transparent',
      defaultLabel: 'OFFLINE',
      animate: false,
    },
  };

  const c = config[status] || config.live;

  const sizeStyles = {
    sm: { dot: 'w-1.5 h-1.5', text: 'text-[9px]',  px: 'px-2 py-0.5',    gap: 'gap-1.5' },
    md: { dot: 'w-2 h-2',     text: 'text-[10px]',  px: 'px-2.5 py-1',    gap: 'gap-1.5' },
    lg: { dot: 'w-2.5 h-2.5', text: 'text-[11px]',  px: 'px-3 py-1.5',    gap: 'gap-2'   },
  };

  const sz = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`inline-flex items-center ${sz.gap} ${sz.px} rounded-full border font-bold tracking-[0.1em] select-none ${className}`}
      style={{
        background:   c.bg,
        borderColor:  c.border,
        color:        c.text,
      }}
    >
      {/* Dot with ping ring */}
      <span className="relative flex shrink-0" style={{ width: sz.dot.split(' ')[0].replace('w-','') * 4 + 'px', height: sz.dot.split(' ')[1].replace('h-','') * 4 + 'px' }}>
        {c.animate && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: c.ping, opacity: 0.75 }}
          />
        )}
        <span
          className={`relative inline-flex rounded-full ${sz.dot}`}
          style={{
            background:  c.dot,
            boxShadow:   `0 0 6px ${c.glow}`,
          }}
        />
      </span>

      {/* Label */}
      <span className={sz.text}>{label || c.defaultLabel}</span>
    </span>
  );
}
