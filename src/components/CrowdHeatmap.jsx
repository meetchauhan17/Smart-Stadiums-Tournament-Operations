import { motion } from 'framer-motion';
import { getDensityColor } from '../utils/formatters';

/**
 * CrowdHeatmap — SVG stadium seating heatmap
 *
 * Props:
 *   zones       {Array}  - Zone data from useCrowd
 *   heatmapGrid {Array}  - 10×10 grid from generateHeatmapGrid
 *   showLabels  {boolean}
 *   size        {number} - SVG size in px (default 320)
 */
export default function CrowdHeatmap({ zones = [], heatmapGrid = [], showLabels = true, size = 320 }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.46;
  const innerR = size * 0.18; // Field

  // Define stand arcs (N, S, E, W, VIP)
  const standSections = [
    { id: 'north', name: 'North', startDeg: 225, endDeg: 315, innerFactor: 0.55, outerFactor: 0.95 },
    { id: 'south', name: 'South', startDeg: 45,  endDeg: 135, innerFactor: 0.55, outerFactor: 0.95 },
    { id: 'east',  name: 'East',  startDeg: 315, endDeg: 45,  innerFactor: 0.55, outerFactor: 0.95 },
    { id: 'west',  name: 'West',  startDeg: 135, endDeg: 225, innerFactor: 0.55, outerFactor: 0.95 },
    { id: 'vip',   name: 'VIP',   startDeg: 160, endDeg: 200, innerFactor: 0.48, outerFactor: 0.56 },
  ];

  const toRad = (deg) => (deg * Math.PI) / 180;

  const describeArc = (startDeg, endDeg, innerR2, outerR2) => {
    const startRad = toRad(startDeg - 90);
    const endRad   = toRad(endDeg - 90);

    const x1 = cx + outerR2 * Math.cos(startRad);
    const y1 = cy + outerR2 * Math.sin(startRad);
    const x2 = cx + outerR2 * Math.cos(endRad);
    const y2 = cy + outerR2 * Math.sin(endRad);
    const x3 = cx + innerR2 * Math.cos(endRad);
    const y3 = cy + innerR2 * Math.sin(endRad);
    const x4 = cx + innerR2 * Math.cos(startRad);
    const y4 = cy + innerR2 * Math.sin(startRad);

    const angleDiff = endDeg - startDeg;
    const large = (angleDiff + 360) % 360 > 180 ? 1 : 0;

    return [
      `M ${x1} ${y1}`,
      `A ${outerR2} ${outerR2} 0 ${large} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR2} ${innerR2} 0 ${large} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');
  };

  const midAngle = (startDeg, endDeg) => {
    let mid = (startDeg + endDeg) / 2;
    if (endDeg < startDeg) mid = ((startDeg + endDeg + 360) / 2) % 360;
    return mid;
  };

  const getZoneData = (sectionId) =>
    zones.find(z => z.id === sectionId) || { density: 0.5, status: 'moderate' };

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-2xl">
        <defs>
          {/* Pitch gradient */}
          <radialGradient id="pitchGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0d4a2e" />
            <stop offset="100%" stopColor="#083520" />
          </radialGradient>
          {/* Track gradient */}
          <radialGradient id="trackGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0a2540" />
            <stop offset="100%" stopColor="#071830" />
          </radialGradient>
        </defs>

        {/* Outer stadium ring */}
        <circle cx={cx} cy={cy} r={outerR + 6} fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="2" />

        {/* Track area */}
        <circle cx={cx} cy={cy} r={outerR} fill="url(#trackGrad)" />

        {/* Stand sections */}
        {standSections.map((section) => {
          const zoneData = getZoneData(section.id);
          const sectionInnerR = outerR * section.innerFactor;
          const sectionOuterR = outerR * section.outerFactor;
          const color = getDensityColor(zoneData.density);
          const opacity = 0.3 + zoneData.density * 0.55;
          const mid = midAngle(section.startDeg, section.endDeg);
          const midRad = toRad(mid - 90);
          const labelR = (sectionInnerR + sectionOuterR) / 2;
          const lx = cx + labelR * Math.cos(midRad);
          const ly = cy + labelR * Math.sin(midRad);

          return (
            <g key={section.id}>
              <motion.path
                d={describeArc(section.startDeg, section.endDeg, sectionInnerR, sectionOuterR)}
                fill={color}
                fillOpacity={opacity}
                stroke="rgba(0,212,255,0.15)"
                strokeWidth="1"
                initial={{ fillOpacity: 0 }}
                animate={{ fillOpacity: opacity }}
                transition={{ duration: 0.6 }}
              />
              {showLabels && section.id !== 'vip' && (
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(232,244,253,0.7)"
                  fontSize={size * 0.028}
                  fontFamily="Space Grotesk, sans-serif"
                  fontWeight="600"
                >
                  {section.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Running track */}
        <circle cx={cx} cy={cy} r={outerR * 0.52} fill="#0A192F" stroke="rgba(0,212,255,0.08)" strokeWidth="1" />

        {/* Field */}
        <ellipse cx={cx} cy={cy} rx={innerR * 1.4} ry={innerR} fill="url(#pitchGrad)" />

        {/* Pitch markings */}
        <ellipse cx={cx} cy={cy} rx={innerR * 1.35} ry={innerR * 0.92} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line x1={cx} y1={cy - innerR * 0.92} x2={cx} y2={cy + innerR * 0.92} stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
        <circle cx={cx} cy={cy} r={innerR * 0.22} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />

        {/* FIFA logo center */}
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(0,212,255,0.5)"
          fontSize={size * 0.032}
          fontFamily="Space Grotesk, sans-serif"
          fontWeight="700"
        >
          FIFA
        </text>

        {/* Scan line effect */}
        <line
          x1={cx - outerR}
          y1={cy}
          x2={cx + outerR}
          y2={cy}
          stroke="rgba(0,212,255,0.06)"
          strokeWidth="1"
        />
        <line
          x1={cx}
          y1={cy - outerR}
          x2={cx}
          y2={cy + outerR}
          stroke="rgba(0,212,255,0.06)"
          strokeWidth="1"
        />
      </svg>

      {/* Zone legend */}
      {showLabels && zones.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3 w-full">
          {zones.map(zone => (
            <div key={zone.id} className="flex items-center gap-1.5 text-[10px] text-[#4A6580]">
              <span
                className="w-2.5 h-2.5 rounded-sm inline-block"
                style={{ background: getDensityColor(zone.density), opacity: 0.8 }}
              />
              <span>{zone.name}</span>
              <span className="text-[#E8F4FD] font-semibold">
                {Math.round(zone.density * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
