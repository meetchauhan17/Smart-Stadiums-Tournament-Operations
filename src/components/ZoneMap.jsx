import { motion } from 'framer-motion';
import { useStadium } from '../context/StadiumContext';

/**
 * Get crowd density color (green -> yellow -> orange -> red)
 */
function getZoneColor(density) {
  if (density >= 90) return '#FF3366'; // Danger Red
  if (density >= 80) return '#FF8C42'; // Orange
  if (density >= 65) return '#FFB800'; // Amber/Yellow
  if (density >= 45) return '#00D4FF'; // Cyan
  return '#00FF87'; // Success Green
}

const ZONES_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'VIP', 'MEDIA'];

export default function ZoneMap({ onZoneSelect, selectedZoneId }) {
  const { crowdDensityMap } = useStadium();

  // Isometric/top-down visual layout coordinates for zones A-H, VIP, Media
  const zonesConfig = {
    A: { path: 'M 18 10 L 46 10 L 41 18 L 23 18 Z', textX: 32, textY: 14, colorClass: 'north-upper' },
    B: { path: 'M 23 18 L 41 18 L 38 23 L 26 23 Z', textX: 32, textY: 20.5, colorClass: 'north-lower' },
    C: { path: 'M 46 10 L 58 22 L 50 25 L 41 18 Z', textX: 48, textY: 18.5, colorClass: 'east-upper' },
    D: { path: 'M 41 18 L 50 25 L 45 29 L 38 23 Z', textX: 43.5, textY: 24, colorClass: 'east-lower' },
    E: { path: 'M 58 22 L 46 54 L 41 46 L 50 25 Z', textX: 49, textY: 37, colorClass: 'south-upper' },
    F: { path: 'M 50 25 L 41 46 L 38 41 L 45 29 Z', textX: 43.5, textY: 35.5, colorClass: 'south-lower' },
    G: { path: 'M 46 54 L 18 54 L 23 46 L 41 46 Z', textX: 32, textY: 50, colorClass: 'west-upper' },
    H: { path: 'M 23 46 L 18 54 L 6 42 L 14 39 Z', textX: 15, textY: 45.5, colorClass: 'west-lower' },
    VIP: { path: 'M 6 42 L 18 10 L 23 18 L 14 39 Z', textX: 15, textY: 27, colorClass: 'vip' },
    MEDIA: { path: 'M 23 46 L 14 39 L 26 23 L 38 41 Z', textX: 25.5, textY: 37, colorClass: 'media' }
  };

  // Handle keyboard navigation with Arrow Keys
  const handleKeyDown = (e) => {
    if (!onZoneSelect) return;
    
    let currentIndex = ZONES_ORDER.indexOf(selectedZoneId);
    if (currentIndex === -1) currentIndex = 0;

    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % ZONES_ORDER.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + ZONES_ORDER.length) % ZONES_ORDER.length;
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onZoneSelect(ZONES_ORDER[currentIndex]);
      return;
    }

    if (nextIndex !== currentIndex) {
      onZoneSelect(ZONES_ORDER[nextIndex]);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Stadium Interactive Map. Selected: Zone ${selectedZoneId}. Use arrow keys to select other zones.`}
      className="relative w-full max-w-sm mx-auto flex flex-col items-center bg-[#0D1B2E]/40 border border-[#00D4FF]/10 hover:border-[#00D4FF]/30 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/40 transition-all select-none"
    >
      <div className="w-full flex items-center justify-between mb-3">
        <span className="text-xs font-heading font-semibold uppercase tracking-wider text-[#00D4FF]">
          Stadium Interactive Map
        </span>
        <span className="text-[10px] text-[#4A6580]">Use arrows / Click to select</span>
      </div>

      <svg viewBox="0 0 64 64" className="w-full h-auto drop-shadow-2xl">
        <defs>
          <filter id="zoneGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer perimeter outline */}
        <polygon points="18,10 46,10 58,22 58,42 46,54 18,54 6,42 6,22" fill="none" stroke="#00D4FF" strokeOpacity="0.1" strokeWidth="1" />

        {/* Center Pitch Field */}
        <polygon points="26,23 38,23 38,41 26,41" fill="#0d3a1f" stroke="#00FF87" strokeWidth="0.8" strokeOpacity="0.5" />
        <line x1="32" y1="23" x2="32" y2="41" stroke="#00FF87" strokeWidth="0.5" strokeOpacity="0.4" />
        <circle cx="32" cy="32" r="3" fill="none" stroke="#00FF87" strokeWidth="0.5" strokeOpacity="0.4" />

        {/* Render Zones */}
        {Object.entries(zonesConfig).map(([zoneId, cfg]) => {
          const zoneData = crowdDensityMap[zoneId] || { density: 50, label: `Zone ${zoneId}` };
          const color = getZoneColor(zoneData.density);
          const isSelected = selectedZoneId === zoneId;

          return (
            <g
              key={zoneId}
              onClick={() => onZoneSelect && onZoneSelect(zoneId)}
              className="cursor-pointer group"
              role="button"
              tabIndex={-1}
              aria-label={`Zone ${zoneId}. Density: ${zoneData.density}%. Status: ${isSelected ? 'Selected' : 'Not Selected'}`}
              aria-pressed={isSelected}
            >
              {/* Main Zone Segment shape */}
              <motion.path
                d={cfg.path}
                fill={color}
                fillOpacity={isSelected ? 0.45 : 0.2}
                stroke={isSelected ? '#00D4FF' : color}
                strokeWidth={isSelected ? 1.5 : 0.8}
                strokeOpacity={isSelected ? 1.0 : 0.55}
                filter={isSelected ? 'url(#zoneGlow)' : 'none'}
                whileHover={{ fillOpacity: 0.5, strokeWidth: 1.2, strokeOpacity: 0.95 }}
                transition={{ duration: 0.2 }}
              />

              {/* Zone label tag */}
              <text
                x={cfg.textX}
                y={cfg.textY}
                fontFamily="Space Grotesk, sans-serif"
                fontWeight="bold"
                fontSize="3.2"
                fill={isSelected ? '#00D4FF' : '#E8F4FD'}
                fillOpacity={isSelected ? 1.0 : 0.75}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none transition-colors"
              >
                {zoneId}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Grid Legend */}
      <div className="grid grid-cols-5 gap-1.5 w-full mt-4 border-t border-white/5 pt-3">
        {[
          { label: '<45%', color: '#00FF87' },
          { label: '45-65%', color: '#00D4FF' },
          { label: '65-80%', color: '#FFB800' },
          { label: '80-90%', color: '#FF8C42' },
          { label: '>90%', color: '#FF3366' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="w-full h-1.5 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[8px] text-[#4A6580] font-semibold">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
