export default function LoadingSpinner({ size = 'md', text = 'Loading Stadium Systems...' }) {
  const sizes = {
    sm: 'w-6 h-6 border-[2px]',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-16 h-16 border-[4px]',
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 gap-4">
      <div className="relative">
        {/* Glowing aura */}
        <div className={`absolute inset-0 rounded-full bg-[#00D4FF]/20 filter blur-md animate-pulse`} />
        
        {/* Rotating dash ring */}
        <div
          className={`rounded-full border-t-[#00D4FF] border-r-transparent border-b-[#00FF87] border-l-transparent animate-spin ${currentSize}`}
          style={{
            animationDuration: '0.8s',
            boxShadow: '0 0 10px rgba(0, 212, 255, 0.15)',
          }}
        />

        {/* Stadium outline center svg */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="40%" height="40%" viewBox="0 0 18 18" className="text-[#00D4FF] opacity-60 animate-pulse">
            <ellipse cx="9" cy="9" rx="6" ry="4" stroke="currentColor" strokeWidth="1" fill="none" />
            <ellipse cx="9" cy="9" rx="3" ry="1.8" stroke="currentColor" strokeWidth="0.8" fill="none" />
          </svg>
        </div>
      </div>

      {text && (
        <span className="font-heading text-xs font-semibold uppercase tracking-[0.15em] text-[#4A6580] animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}
