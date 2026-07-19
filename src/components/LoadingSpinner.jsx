import PropTypes from 'prop-types';

/**
 * LoadingSpinner — Full-page animated loading indicator with stadium icon.
 *
 * @component
 * @param {Object}  props
 * @param {'sm'|'md'|'lg'} props.size - Controls spinner ring diameter
 * @param {string}  props.text        - Label displayed below the spinner
 */
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
        {/* Rotating dash ring */}
        <div
          className={`rounded-full border-t-[#3B82F6] border-r-transparent border-b-[#10B981] border-l-transparent animate-spin ${currentSize}`}
          style={{
            animationDuration: '0.8s',
          }}
        />

        {/* Stadium outline center svg */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="40%" height="40%" viewBox="0 0 18 18" className="text-[#3B82F6] opacity-60 animate-pulse">
            <ellipse cx="9" cy="9" rx="6" ry="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <ellipse cx="9" cy="9" rx="3" ry="1.8" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        </div>
      </div>

      {text && (
        <span className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-[#6B7280]">
          {text}
        </span>
      )}
    </div>
  );
}

LoadingSpinner.propTypes = {
  /** Spinner ring size preset */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Loading label displayed below the animated ring */
  text: PropTypes.string,
};
