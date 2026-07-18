// ─── Skeleton Loading Components (no emoji) ──────────────────────────────────
// Provides premium skeleton loaders with shimmer animations for card views, 
// tables, and full dashboard pages.
import { motion } from 'framer-motion';

/**
 * Shimmer element for skeleton layout blocks
 */
export function Shimmer({ className = 'h-4 bg-gray-200' }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Shimmer overlay animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/**
 * MatchCardSkeleton
 * High-fidelity placeholder that matches the shape of a football match card.
 */
export function MatchCardSkeleton() {
  return (
    <div className="border-2 border-gray-200 bg-white p-4 flex flex-col gap-4">
      {/* Header strip */}
      <Shimmer className="h-4 bg-gray-200 w-1/2" />
      
      {/* Score block */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex-1 flex flex-col items-center gap-2">
          <Shimmer className="w-11 h-8 bg-gray-200" />
          <Shimmer className="w-16 h-3 bg-gray-200" />
        </div>
        <Shimmer className="w-14 h-9 bg-gray-300" />
        <div className="flex-1 flex flex-col items-center gap-2">
          <Shimmer className="w-11 h-8 bg-gray-200" />
          <Shimmer className="w-16 h-3 bg-gray-200" />
        </div>
      </div>
      
      {/* Bottom venue info */}
      <div className="border-t border-gray-100 pt-3 flex justify-between">
        <Shimmer className="h-3 bg-gray-200 w-1/3" />
        <Shimmer className="h-3 bg-gray-200 w-1/5" />
      </div>
    </div>
  );
}

/**
 * TableSkeleton
 * Placeholder for tabular listings (e.g. Standings, Staff rosters)
 */
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="border-2 border-gray-200 bg-white p-4 flex flex-col gap-3">
      {/* Table header */}
      <div className="flex gap-4 border-b border-gray-200 pb-2 mb-1">
        <Shimmer className="h-4 bg-gray-300 w-12" />
        <Shimmer className="h-4 bg-gray-300 flex-1" />
        <Shimmer className="h-4 bg-gray-300 w-10" />
        <Shimmer className="h-4 bg-gray-300 w-10" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-1">
          <Shimmer className="h-3 bg-gray-200 w-8" />
          <Shimmer className="h-3 bg-gray-200 flex-1" />
          <Shimmer className="h-3 bg-gray-200 w-10" />
          <Shimmer className="h-3 bg-gray-200 w-10" />
        </div>
      ))}
    </div>
  );
}

/**
 * DashboardPageSkeleton
 * General placeholder layout for lazy loading full dashboard pages.
 */
export function DashboardPageSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 p-6 min-h-[70vh] bg-gray-50 animate-pulse">
      {/* Header bar placeholder */}
      <div className="bg-gray-200 h-28 w-full p-6 flex flex-col justify-end gap-2">
        <Shimmer className="h-8 bg-gray-300 w-1/3" />
        <Shimmer className="h-4 bg-gray-300 w-1/4" />
      </div>
      
      {/* Three-column layout placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </div>
        <div className="flex flex-col gap-6">
          <TableSkeleton rows={8} />
        </div>
      </div>
    </div>
  );
}
