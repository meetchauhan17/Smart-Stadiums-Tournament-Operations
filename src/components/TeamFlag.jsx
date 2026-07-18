// ─── TeamFlag — Animated country flag widget (no emoji) ───────────────────────
// Uses real country colors as horizontal stripes with the country ISO code.
// Falls back to a clean generic shield badge if the country is unknown.
import { motion } from 'framer-motion';

// Country color palettes — [top, middle (optional), bottom]
const COUNTRY_COLORS = {
  'USA':          { stripes: ['#B22234', '#FFFFFF', '#3C3B6E'], code: 'USA' },
  'United States':{ stripes: ['#B22234', '#FFFFFF', '#3C3B6E'], code: 'USA' },
  'Mexico':       { stripes: ['#006847', '#FFFFFF', '#CE1126'], code: 'MEX' },
  'Canada':       { stripes: ['#FF0000', '#FFFFFF', '#FF0000'], code: 'CAN' },
  'Brazil':       { stripes: ['#009C3B', '#FFDF00', '#002776'], code: 'BRA' },
  'Argentina':    { stripes: ['#74ACDF', '#FFFFFF', '#74ACDF'], code: 'ARG' },
  'England':      { stripes: ['#FFFFFF', '#CF142B', '#FFFFFF'], code: 'ENG' },
  'France':       { stripes: ['#002395', '#FFFFFF', '#ED2939'], code: 'FRA' },
  'Germany':      { stripes: ['#000000', '#DD0000', '#FFCE00'], code: 'GER' },
  'Spain':        { stripes: ['#AA151B', '#F1BF00', '#AA151B'], code: 'ESP' },
  'Portugal':     { stripes: ['#006600', '#FF0000', '#FF0000'], code: 'POR' },
  'Netherlands':  { stripes: ['#AE1C28', '#FFFFFF', '#21468B'], code: 'NED' },
  'Belgium':      { stripes: ['#000000', '#FAE042', '#EF3340'], code: 'BEL' },
  'Italy':        { stripes: ['#009246', '#FFFFFF', '#CE2B37'], code: 'ITA' },
  'Japan':        { stripes: ['#FFFFFF', '#BC002D', '#FFFFFF'], code: 'JPN' },
  'South Korea':  { stripes: ['#FFFFFF', '#C60C30', '#003478'], code: 'KOR' },
  'Australia':    { stripes: ['#00008B', '#CC0001', '#00008B'], code: 'AUS' },
  'Morocco':      { stripes: ['#C1272D', '#006233', '#C1272D'], code: 'MAR' },
  'Senegal':      { stripes: ['#00853F', '#FDEF42', '#E31B23'], code: 'SEN' },
  'Nigeria':      { stripes: ['#008751', '#FFFFFF', '#008751'], code: 'NGA' },
  'Saudi Arabia': { stripes: ['#006C35', '#FFFFFF', '#006C35'], code: 'KSA' },
  'Iran':         { stripes: ['#239F40', '#FFFFFF', '#DA0000'], code: 'IRN' },
  'Qatar':        { stripes: ['#8D1B3D', '#FFFFFF', '#8D1B3D'], code: 'QAT' },
  'Uruguay':      { stripes: ['#FFFFFF', '#5AAAFA', '#FFFFFF'], code: 'URU' },
  'Colombia':     { stripes: ['#FCD116', '#003087', '#CE1126'], code: 'COL' },
  'Ecuador':      { stripes: ['#FFD100', '#003893', '#EF3340'], code: 'ECU' },
  'Chile':        { stripes: ['#D52B1E', '#FFFFFF', '#003082'], code: 'CHI' },
  'Poland':       { stripes: ['#FFFFFF', '#DC143C', '#FFFFFF'], code: 'POL' },
  'Croatia':      { stripes: ['#FF0000', '#FFFFFF', '#0000FF'], code: 'CRO' },
  'Denmark':      { stripes: ['#C60C30', '#FFFFFF', '#C60C30'], code: 'DEN' },
  'Switzerland':  { stripes: ['#FF0000', '#FFFFFF', '#FF0000'], code: 'SUI' },
  // 2022 WC teams
  'Qatar':        { stripes: ['#8D1B3D', '#FFFFFF', '#8D1B3D'], code: 'QAT' },
  'Ecuador':      { stripes: ['#FFD100', '#003893', '#EF3340'], code: 'ECU' },
  'Senegal':      { stripes: ['#00853F', '#FDEF42', '#E31B23'], code: 'SEN' },
  'Netherlands':  { stripes: ['#AE1C28', '#FFFFFF', '#21468B'], code: 'NED' },
  'Wales':        { stripes: ['#C8102E', '#007A33', '#C8102E'], code: 'WAL' },
  'Ghana':        { stripes: ['#006B3F', '#FCD116', '#CE1126'], code: 'GHA' },
  'Tunisia':      { stripes: ['#E70013', '#FFFFFF', '#E70013'], code: 'TUN' },
  'Cameroon':     { stripes: ['#007A5E', '#CE1126', '#FCD116'], code: 'CMR' },
  'Serbia':       { stripes: ['#C6363C', '#0C4076', '#FFFFFF'], code: 'SRB' },
};

const DEFAULT_COLORS = { stripes: ['#6B7280', '#9CA3AF', '#6B7280'], code: '?' };

/**
 * AnimatedTeamFlag
 * Renders a small animated country stripe badge instead of a flag emoji.
 * @param {string} teamName - The team name to look up
 * @param {boolean} pulse - Whether to add a pulsing glow (for live match)
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export function TeamFlag({ teamName, pulse = false, size = 'md' }) {
  const cfg = COUNTRY_COLORS[teamName] || DEFAULT_COLORS;
  const [c1, c2, c3] = cfg.stripes;
  const code = cfg.code;

  const dims = {
    sm: { w: 32, h: 22, text: 'text-[7px]' },
    md: { w: 44, h: 30, text: 'text-[8px]' },
    lg: { w: 56, h: 38, text: 'text-[9px]' },
  }[size] || { w: 44, h: 30, text: 'text-[8px]' };

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative inline-flex flex-col items-center gap-1 shrink-0"
    >
      {/* Flag stripe widget */}
      <div
        className={`relative overflow-hidden border border-gray-300 shadow-sm ${pulse ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
        style={{ width: dims.w, height: dims.h, borderRadius: 2 }}
      >
        {/* Top stripe */}
        <div className="absolute top-0 left-0 right-0" style={{ height: '33.3%', backgroundColor: c1 }} />
        {/* Middle stripe */}
        <div className="absolute left-0 right-0" style={{ top: '33.3%', height: '33.4%', backgroundColor: c2 }} />
        {/* Bottom stripe */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '33.3%', backgroundColor: c3 }} />
        {/* Country code overlay */}
        <div className={`absolute inset-0 flex items-center justify-center ${dims.text} font-black tracking-widest`}
          style={{
            color: '#ffffff',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            mixBlendMode: 'normal',
          }}
        >
          {code}
        </div>
        {/* Live pulse overlay */}
        {pulse && (
          <motion.div
            className="absolute inset-0 bg-red-500"
            animate={{ opacity: [0, 0.25, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
}

export default TeamFlag;
