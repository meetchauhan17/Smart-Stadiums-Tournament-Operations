// ─── AchievementIcon — Animated Lucide icon widgets (no emoji) ───────────────
// Replaces emoji achievement icons with purpose-built animated icon widgets.
import { motion } from 'framer-motion';
import {
  Ban, Sun, RefreshCw, Train, Globe, Trophy, Droplets, Zap,
  Leaf, Wind, Award, Star, ShieldCheck, TreePine, Recycle
} from 'lucide-react';

// Map achievement IDs to lucide icons + color + animation
const ACHIEVEMENT_MAP = {
  'zero-plastic':  { Icon: Ban,        color: '#EF4444', bg: '#FEE2E2', anim: 'shake' },
  'solar-day':     { Icon: Sun,        color: '#F59E0B', bg: '#FEF3C7', anim: 'spin'  },
  'top-recycler':  { Icon: Recycle,    color: '#10B981', bg: '#D1FAE5', anim: 'spin'  },
  'green-commute': { Icon: Train,      color: '#3B82F6', bg: '#DBEAFE', anim: 'slide' },
  'carbon-neg':    { Icon: Globe,      color: '#059669', bg: '#D1FAE5', anim: 'pulse' },
  'zero-waste':    { Icon: Trophy,     color: '#D97706', bg: '#FEF3C7', anim: 'bounce'},
  'rain-harvest':  { Icon: Droplets,   color: '#0EA5E9', bg: '#E0F2FE', anim: 'pulse' },
  'ev-fleet':      { Icon: Zap,        color: '#8B5CF6', bg: '#EDE9FE', anim: 'zap'   },
};

const DEFAULT_ACHIEVEMENT = { Icon: Award, color: '#6B7280', bg: '#F3F4F6', anim: 'pulse' };

function getAnimProps(anim, earned) {
  if (!earned) return {};
  switch (anim) {
    case 'spin':
      return {
        animate: { rotate: 360 },
        transition: { duration: 3, repeat: Infinity, ease: 'linear' },
      };
    case 'bounce':
      return {
        animate: { y: [0, -5, 0] },
        transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
      };
    case 'pulse':
      return {
        animate: { scale: [1, 1.12, 1] },
        transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      };
    case 'shake':
      return {
        animate: { rotate: [0, -10, 10, -10, 0] },
        transition: { duration: 0.6, repeat: Infinity, repeatDelay: 3 },
      };
    case 'slide':
      return {
        animate: { x: [0, 3, 0, -3, 0] },
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      };
    case 'zap':
      return {
        animate: { opacity: [1, 0.5, 1], scale: [1, 1.08, 1] },
        transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
      };
    default:
      return {};
  }
}

/**
 * AchievementIcon
 * @param {string} achievementId - must match a key in ACHIEVEMENT_MAP
 * @param {boolean} earned - whether this achievement is earned
 * @param {number} size - icon size in px
 */
export function AchievementIcon({ achievementId, earned, size = 28 }) {
  const cfg = ACHIEVEMENT_MAP[achievementId] || DEFAULT_ACHIEVEMENT;
  const { Icon, color, bg, anim } = cfg;

  return (
    <motion.div
      className="inline-flex items-center justify-center rounded-none"
      style={{
        width: size + 16,
        height: size + 16,
        backgroundColor: earned ? bg : '#F3F4F6',
        border: `2px solid ${earned ? color + '80' : '#D1D5DB'}`,
      }}
      {...getAnimProps(anim, earned)}
    >
      <Icon
        size={size}
        color={earned ? color : '#9CA3AF'}
        strokeWidth={2}
      />
    </motion.div>
  );
}

export default AchievementIcon;
