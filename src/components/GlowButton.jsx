import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * GlowButton — Redesigned as a premium Flat Design button (no shadows, glows, or vignettes)
 */
export default function GlowButton({
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  children,
  type = 'button',
}) {
  const baseStyle =
    'relative inline-flex items-center justify-center gap-2 font-heading font-extrabold uppercase tracking-wider transition-all duration-150 select-none overflow-hidden border-2 cursor-pointer';

  const variants = {
    primary: {
      border: 'border-[#3B82F6]',
      text: 'text-white',
      bg: 'bg-[#3B82F6] hover:bg-[#2563EB]',
    },
    outline: {
      border: 'border-[#E5E7EB] hover:border-[#6B7280]',
      text: 'text-[#111827]',
      bg: 'bg-white hover:bg-[#F3F4F6]',
    },
    danger: {
      border: 'border-[#FF3366]',
      text: 'text-white',
      bg: 'bg-[#FF3366] hover:bg-[#E0245E]',
    },
    success: {
      border: 'border-[#10B981]',
      text: 'text-white',
      bg: 'bg-[#10B981] hover:bg-[#059669]',
    },
    warning: {
      border: 'border-[#F59E0B]',
      text: 'text-white',
      bg: 'bg-[#F59E0B] hover:bg-[#D97706]',
    },
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px] gap-1.5 rounded',
    md: 'px-5 py-2.5 text-xs gap-2 rounded',
    lg: 'px-7 py-3.5 text-sm gap-2.5 rounded',
  };

  const v = variants[variant] || variants.primary;
  const sz = sizes[size] || sizes.md;

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.975 } : {}}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`${v.border} ${v.text} ${v.bg} ${sz} ${baseStyle} ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${className}`}
    >
      <span className="relative z-10 flex items-center gap-1.5 justify-center w-full">{children}</span>
    </motion.button>
  );
}

GlowButton.propTypes = {
  /** Visual style variant */
  variant:   PropTypes.oneOf(['primary', 'outline', 'danger', 'success', 'warning']),
  /** Size preset */
  size:      PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Click handler */
  onClick:   PropTypes.func,
  /** Disables interaction and dims the button */
  disabled:  PropTypes.bool,
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Button content */
  children:  PropTypes.node.isRequired,
  /** HTML button type attribute */
  type:      PropTypes.oneOf(['button', 'submit', 'reset']),
};
