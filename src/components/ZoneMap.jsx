import { motion } from 'framer-motion';
import { useStadium } from '../context/StadiumContext';

/**
 * Get crowd density color based on the requested criteria:
 * - density < 60%: #10B981 (green)
 * - density < 85%: #F59E0B (amber)
 * - density >= 85%: #EF4444 (red)
 */
function getZoneColor(density) {
  if (density >= 85) return '#EF4444'; // Red (critical)
  if (density >= 60) return '#F59E0B'; // Amber (warning)
  return '#10B981'; // Green (safe)
}

const ZONES_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function ZoneMap({ onZoneSelect, selectedZoneId }) {
  const { crowdDensityMap } = useStadium();

  // Isometric/top-down visual layout coordinates for zones A-H
  const zonesConfig = {
    A: { path: 'M 18 10 L 46 10 L 41 18 L 23 18 Z', textX: 32, textY: 14.5 },
    B: { path: 'M 23 18 L 41 18 L 38 23 L 26 23 Z', textX: 32, textY: 20.5 },
    C: { path: 'M 46 10 L 58 22 L 50 25 L 41 18 Z', textX: 48, textY: 18.5 },
    D: { path: 'M 41 18 L 50 25 L 45 29 L 38 23 Z', textX: 43.5, textY: 24 },
    E: { path: 'M 58 22 L 46 54 L 41 46 L 50 25 Z', textX: 49, textY: 37 },
    F: { path: 'M 50 25 L 41 46 L 38 41 L 45 29 Z', textX: 43.5, textY: 35.5 },
    G: { path: 'M 46 54 L 18 54 L 23 46 L 41 46 Z', textX: 32, textY: 50 },
    H: { path: 'M 23 46 L 18 54 L 6 42 L 14 39 Z', textX: 15, textY: 45.5 },
  };

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
      className="relative w-full max-w-lg mx-auto flex flex-col items-center bg-white border-2 border-gray-900 p-4 focus:outline-none focus:border-blue-600 transition-all select-none rounded-none"
    >
      <div className="w-full flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-950">
          Zone Selection Map
        </span>
        <span className="text-[10px] text-gray-500 font-bold">Use arrows / Click</span>
      </div>

      <div className="w-full max-w-lg mx-auto" style={{ height: '320px' }}>
        <svg
          width="100%"
          height="320"
          viewBox="0 0 400 320"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto"
        >
          {/* Centering and scaling the map */}
          <g transform="translate(40, 0) scale(5)">
            {/* Outer perimeter outline */}
            <polygon points="18,10 46,10 58,22 58,42 46,54 18,54 6,42 6,22" fill="none" stroke="#E5E7EB" strokeWidth="0.8" />

            {/* Center Pitch Field */}
            <polygon points="26,23 38,23 38,41 26,41" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="0.6" />
            <line x1="32" y1="23" x2="32" y2="41" stroke="#D1D5DB" strokeWidth="0.5" />
            <circle cx="32" cy="32" r="3" fill="none" stroke="#D1D5DB" strokeWidth="0.5" />

            {/* Render Zones */}
            {Object.entries(zonesConfig).map(([zoneId, cfg]) => {
              const zoneData = crowdDensityMap?.[zoneId] || { density: 50, label: `Zone ${zoneId}` };
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
                    fillOpacity={isSelected ? 0.85 : 0.4}
                    stroke={isSelected ? '#111827' : color}
                    strokeWidth={isSelected ? 1.8 : 0.6}
                    strokeOpacity={isSelected ? 1.0 : 0.6}
                    whileHover={{ fillOpacity: 0.7 }}
                    transition={{ duration: 0.1 }}
                  />

                  {/* Zone label tag: 16-20px font size scaled. 3.6 font size * 5 scale = 18px! */}
                  <text
                    x={cfg.textX}
                    y={cfg.textY}
                    fontFamily="Outfit, sans-serif"
                    fontWeight="900"
                    fontSize="4"
                    fill={isSelected ? '#111827' : '#FFFFFF'}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none transition-colors"
                  >
                    {zoneId}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Grid Legend */}
      <div className="grid grid-cols-3 gap-1.5 w-full mt-4 border-t border-gray-100 pt-3 relative">
        {[
          { label: '<60% (Safe)', color: '#10B981' },
          { label: '60-85% (Warning)', color: '#F59E0B' },
          { label: '>=85% (Critical)', color: '#EF4444' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="w-full h-1.5 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[8px] text-gray-500 font-bold">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
