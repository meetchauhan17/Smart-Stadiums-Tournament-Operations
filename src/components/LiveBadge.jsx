import PropTypes from 'prop-types';

/**
 * LiveBadge — Pulsing status indicator (Flat Design)
 *
 * @prop {'live'|'offline'|'paused'|'alert'} status
 * @prop {string} label   - Override default label
 * @prop {'sm'|'md'|'lg'} size
 * @prop {string} className
 */
export default function LiveBadge({ status = 'live', label, size = 'md', className = '' }) {
  const config = {
    live: {
      dot:   '#10B981',
      text:  '#10B981',
      bg:    '#ECFDF5',
      border:'#A7F3D0',
      ping:  'rgba(16,185,129,0.3)',
      defaultLabel: 'LIVE',
      animate: true,
    },
    alert: {
      dot:   '#FF3366',
      text:  '#FF3366',
      bg:    '#FFF5F5',
      border:'#FECACA',
      ping:  'rgba(255,51,102,0.3)',
      defaultLabel: 'ALERT',
      animate: true,
    },
    paused: {
      dot:   '#F59E0B',
      text:  '#B45309',
      bg:    '#FEF3C7',
      border:'#FDE68A',
      ping:  'rgba(245,158,11,0.2)',
      defaultLabel: 'PAUSED',
      animate: false,
    },
    offline: {
      dot:   '#6B7280',
      text:  '#6B7280',
      bg:    '#F3F4F6',
      border:'#E5E7EB',
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
      <span className="relative flex shrink-0 w-2 h-2">
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
          }}
        />
      </span>

      {/* Label */}
      <span className={sz.text}>{label || c.defaultLabel}</span>
    </span>
  );
}

LiveBadge.propTypes = {
  /** Current operational status determining color and animation */
  status:    PropTypes.oneOf(['live', 'offline', 'paused', 'alert']),
  /** Override the default status label text */
  label:     PropTypes.string,
  /** Size preset controlling dot size and padding */
  size:      PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Additional CSS class names */
  className: PropTypes.string,
};
