import { useStadium } from '../context/StadiumContext';

/**
 * Get crowd density color based on the requested criteria:
 * - density >= 85: #EF4444 (red — critical)
 * - density >= 70: #F59E0B (amber — high)
 * - density >= 50: #3B82F6 (blue — moderate)
 * - density < 50:  #10B981 (green — low)
 */
export function getZoneColor(density) {
  if (density >= 85) return '#EF4444'; // red — critical
  if (density >= 70) return '#F59E0B'; // amber — high  
  if (density >= 50) return '#3B82F6'; // blue — moderate
  return '#10B981';                    // green — low
}

const ZONES = [
  { id: 'A', points: '160,60 240,60 260,110 140,110', cx: 200, cy: 82 },
  { id: 'B', points: '140,110 260,110 250,150 150,150', cx: 200, cy: 128 },
  { id: 'C', points: '260,60 320,80 310,130 260,110', cx: 290, cy: 95 },
  { id: 'D', points: '260,110 310,130 300,165 250,150', cx: 282, cy: 140 },
  { id: 'E', points: '310,80 360,90 355,170 300,165 310,130', cx: 332, cy: 130 },
  { id: 'F', points: '250,150 300,165 295,210 245,200', cx: 272, cy: 182 },
  { id: 'G', points: '150,150 250,150 245,200 155,205', cx: 200, cy: 177 },
  { id: 'H', points: '80,140 150,150 155,205 85,200', cx: 118, cy: 175 },
];

const ZONES_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function ZoneMap({ onZoneSelect, selectedZoneId }) {
  const { crowdDensityMap } = useStadium();

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

      <div style={{ width: '100%', height: '280px', overflow: 'visible' }}>
        <svg 
          viewBox="0 0 400 280" 
          width="100%" 
          height="280"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block' }}
          className="w-full h-auto"
        >
          {ZONES.map(zone => {
            const zoneObj = crowdDensityMap?.[zone.id];
            const density = typeof zoneObj === 'object' ? (zoneObj?.density ?? 45) : (zoneObj ?? 45);
            const color = getZoneColor(density);
            const isSelected = selectedZoneId === zone.id;

            return (
              <g 
                key={zone.id} 
                onClick={() => onZoneSelect && onZoneSelect(zone.id)}
                style={{ cursor: 'pointer' }}
                className="group"
                role="button"
                tabIndex={-1}
                aria-label={`Zone ${zone.id}. Density: ${density}%. Status: ${isSelected ? 'Selected' : 'Not Selected'}`}
                aria-pressed={isSelected}
              >
                <polygon
                  points={zone.points}
                  fill={color}
                  stroke={isSelected ? 'white' : 'rgba(255,255,255,0.4)'}
                  strokeWidth={isSelected ? 3 : 1}
                  opacity={0.9}
                  style={{ transition: 'fill-opacity 0.1s' }}
                />
                <text
                  x={zone.cx} 
                  y={zone.cy - 6}
                  textAnchor="middle"
                  fill="white"
                  fontWeight="700"
                  fontSize="13"
                  style={{ pointerEvents: 'none' }}
                >
                  {zone.id}
                </text>
                <text
                  x={zone.cx} 
                  y={zone.cy + 9}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  style={{ pointerEvents: 'none' }}
                >
                  {density}%
                </text>
              </g>
            );
          })}

          {/* Soccer field outline rendered on top so it doesn't get covered by zone polygons */}
          <rect x="155" y="105" width="95" height="130" 
            fill="none" stroke="#ccc" strokeWidth="1.5" rx="2" style={{ pointerEvents: 'none' }}/>
          <circle cx="202" cy="170" r="20" 
            fill="none" stroke="#ccc" strokeWidth="1.5" style={{ pointerEvents: 'none' }}/>        </svg>
      </div>

      {/* Grid Legend */}
      <div className="grid grid-cols-4 gap-1.5 w-full mt-4 border-t border-gray-100 pt-3 relative">
        {[
          { label: '<50% (Low)', color: '#10B981' },
          { label: '50-70% (Mod)', color: '#3B82F6' },
          { label: '70-85% (High)', color: '#F59E0B' },
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
