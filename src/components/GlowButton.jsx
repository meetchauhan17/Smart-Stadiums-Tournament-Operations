import { motion } from 'framer-motion';

/**
 * GlowButton — Premium dark glass button with neon borders and box-shadow glow
 *
 * @prop {'primary'|'outline'|'danger'|'success'|'warning'} variant
 * @prop {'sm'|'md'|'lg'} size
 * @prop {fn} onClick
 * @prop {boolean} disabled
 * @prop {string} className
 * @prop {node} children
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
    'relative inline-flex items-center justify-center gap-2 font-heading font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 select-none overflow-hidden';

  const variants = {
    primary: {
      border: 'border-[#00D4FF]/40 hover:border-[#00D4FF]',
      text: 'text-[#00D4FF] hover:text-[#060D1A]',
      bg: 'bg-[#00D4FF]/5 hover:bg-[#00D4FF]',
      glow: 'hover:shadow-[0_0_24px_rgba(0,212,255,0.45)]',
    },
    outline: {
      border: 'border-[#4A6580]/30 hover:border-[#00D4FF]/60',
      text: 'text-[#E8F4FD] hover:text-[#00D4FF]',
      bg: 'bg-transparent hover:bg-[#00D4FF]/5',
      glow: 'hover:shadow-[0_0_15px_rgba(0,212,255,0.15)]',
    },
    danger: {
      border: 'border-[#FF3366]/40 hover:border-[#FF3366]',
      text: 'text-[#FF3366] hover:text-white',
      bg: 'bg-[#FF3366]/5 hover:bg-[#FF3366]',
      glow: 'hover:shadow-[0_0_24px_rgba(255,51,102,0.45)]',
    },
    success: {
      border: 'border-[#00FF87]/40 hover:border-[#00FF87]',
      text: 'text-[#00FF87] hover:text-[#060D1A]',
      bg: 'bg-[#00FF87]/5 hover:bg-[#00FF87]',
      glow: 'hover:shadow-[0_0_24px_rgba(0,255,135,0.45)]',
    },
    warning: {
      border: 'border-[#FFB800]/40 hover:border-[#FFB800]',
      text: 'text-[#FFB800] hover:text-[#060D1A]',
      bg: 'bg-[#FFB800]/5 hover:bg-[#FFB800]',
      glow: 'hover:shadow-[0_0_24px_rgba(255,184,0,0.45)]',
    },
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px] gap-1.5 rounded-lg',
    md: 'px-6 py-3 text-xs gap-2',
    lg: 'px-8 py-4 text-sm gap-2.5 rounded-2xl',
  };

  const v = variants[variant] || variants.primary;
  const sz = sizes[size] || sizes.md;

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.025 } : {}}
      whileTap={!disabled ? { scale: 0.975 } : {}}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`border ${v.border} ${v.text} ${v.bg} ${v.glow} ${sz} ${baseStyle} ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      {/* Light sheen effect on hover */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

      {/* Button content */}
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </motion.button>
  );
}
