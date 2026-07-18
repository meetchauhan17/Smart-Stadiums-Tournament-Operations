// ─── MatchEventIcon — Animated SVG widgets for match events (no emoji) ──────
// Replaces emoji event icons with purpose-built animated SVG widgets.
import { motion } from 'framer-motion';
import {
  Circle, Square, ArrowLeftRight, Monitor, Flag, Footprints,
  Triangle, Target, ShieldAlert, Goal, Crosshair, Swords
} from 'lucide-react';

// Custom mini SVG icons for events that need specific shapes
function SoccerBallIcon({ size = 16, color = '#10B981' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" />
      <polygon points="12,4 15,10 21,10 16.5,14.5 18.5,20.5 12,17 5.5,20.5 7.5,14.5 3,10 9,10"
        fill={color} opacity="0.7" />
    </svg>
  );
}

function YellowCardIcon({ size = 16 }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 10 14">
      <rect x="0.5" y="0.5" width="9" height="13" rx="1" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1" />
    </svg>
  );
}

function RedCardIcon({ size = 16 }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 10 14">
      <rect x="0.5" y="0.5" width="9" height="13" rx="1" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
    </svg>
  );
}

// ─── Icon map: event.type → animated widget ───────────────────────
export function MatchEventIcon({ type, color, size = 18, animate: doAnimate = true }) {
  const iconProps = { size: size - 2, color };

  const inner = (() => {
    switch (type) {
      case 'GOAL':
        return <SoccerBallIcon size={size} color={color} />;
      case 'YELLOW_CARD':
        return <YellowCardIcon size={size - 4} />;
      case 'RED_CARD':
        return <RedCardIcon size={size - 4} />;
      case 'SUBSTITUTION':
        return <ArrowLeftRight {...iconProps} />;
      case 'VAR':
        return <Monitor {...iconProps} />;
      case 'OFFSIDE':
        return <Flag {...iconProps} />;
      case 'FREE_KICK':
        return <Footprints {...iconProps} />;
      case 'CORNER':
        return <Triangle {...iconProps} />;
      case 'PENALTY':
        return <Target {...iconProps} />;
      default:
        return <Circle {...iconProps} />;
    }
  })();

  const animateProps = (() => {
    if (!doAnimate) return {};
    switch (type) {
      case 'GOAL':
        return {
          animate: { scale: [1, 1.4, 1], rotate: [0, 360, 360] },
          transition: { duration: 0.8, ease: 'easeOut' },
        };
      case 'YELLOW_CARD':
      case 'RED_CARD':
        return {
          animate: { rotate: [-8, 8, -8, 8, 0] },
          transition: { duration: 0.5 },
        };
      case 'VAR':
        return {
          animate: { opacity: [1, 0.4, 1, 0.4, 1] },
          transition: { duration: 0.8, repeat: 2 },
        };
      case 'SUBSTITUTION':
        return {
          animate: { x: [-4, 4, 0] },
          transition: { duration: 0.4 },
        };
      default:
        return {
          animate: { scale: [1, 1.2, 1] },
          transition: { duration: 0.4 },
        };
    }
  })();

  return (
    <motion.div
      className="inline-flex items-center justify-center shrink-0"
      style={{
        width: size + 4,
        height: size + 4,
        backgroundColor: `${color}18`,
        borderRadius: 4,
        border: `1.5px solid ${color}40`,
      }}
      {...animateProps}
    >
      {inner}
    </motion.div>
  );
}

export default MatchEventIcon;
