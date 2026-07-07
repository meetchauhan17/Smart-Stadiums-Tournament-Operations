import { motion } from 'framer-motion';
import { useStadium } from '../context/StadiumContext';

/**
 * Get crowd density color (Flat Design accents)
 */
function getZoneColor(density) {
  if (density >= 90) return '#FF3366'; // Red 500
  if (density >= 80) return '#FF8C42'; // Orange
  if (density >= 65) return '#F59E0B'; // Amber 500
  if (density >= 45) return '#3B82F6'; // Blue 500
  return '#10B981'; // Emerald 500
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
      className="relative w-full max-w-sm mx-auto flex flex-col items-center bg-white border-2 border-[#E5E7EB] hover:border-[#3B82F6] rounded-lg p-5 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all select-none shadow-none"
    >
      <div className="w-full flex items-center justify-between mb-4">
        <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#3B82F6]">
          Stadium Interactive Map
        </span>
        <span className="text-[10px] text-[#6B7280] font-semibold">Use arrows / Click to select</span>
      </div>

      <svg viewBox="0 0 64 64" className="w-full h-auto drop-shadow-none">
        {/* Outer perimeter outline */}
        <polygon points="18,10 46,10 58,22 58,42 46,54 18,54 6,42 6,22" fill="none" stroke="#E5E7EB" strokeWidth="1" />

        {/* Center Pitch Field */}
        <polygon points="26,23 38,23 38,41 26,41" fill="#ECFDF5" stroke="#10B981" strokeWidth="1" />
        <line x1="32" y1="23" x2="32" y2="41" stroke="#10B981" strokeWidth="0.8" />
        <circle cx="32" cy="32" r="3" fill="none" stroke="#10B981" strokeWidth="0.8" />

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
                fillOpacity={isSelected ? 0.65 : 0.25}
                stroke={isSelected ? '#3B82F6' : color}
                strokeWidth={isSelected ? 2.5 : 1}
                strokeOpacity={isSelected ? 1.0 : 0.6}
                whileHover={{ fillOpacity: 0.55, strokeWidth: 1.5 }}
                transition={{ duration: 0.15 }}
              />

              {/* Zone label tag */}
              <text
                x={cfg.textX}
                y={cfg.textY}
                fontFamily="Outfit, sans-serif"
                fontWeight="extrabold"
                fontSize="3.5"
                fill={isSelected ? '#3B82F6' : '#111827'}
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
      <div className="grid grid-cols-5 gap-1.5 w-full mt-4 border-t-2 border-[#E5E7EB] pt-4">
        {[
          { label: '<45%', color: '#10B981' },
          { label: '45-65%', color: '#3B82F6' },
          { label: '65-80%', color: '#F59E0B' },
          { label: '80-90%', color: '#FF8C42' },
          { label: '>90%', color: '#FF3366' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="w-full h-2 rounded-none" style={{ backgroundColor: item.color }} />
            <span className="text-[8px] text-[#6B7280] font-bold">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
