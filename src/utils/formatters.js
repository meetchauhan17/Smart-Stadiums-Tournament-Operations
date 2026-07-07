// ─── Formatters ───────────────────────────────────────────────────

/**
 * Format a number with thousand separators
 */
export const formatNumber = (n, decimals = 0) =>
  typeof n === 'number'
    ? n.toLocaleString('en-US', { maximumFractionDigits: decimals })
    : '—';

/**
 * Format a percentage value (0-100 or 0-1)
 */
export const formatPercent = (value, decimals = 1) => {
  const v = value > 1 ? value : value * 100;
  return `${v.toFixed(decimals)}%`;
};

/**
 * Format capacity display: "42,350 / 82,500 (51.3%)"
 */
export const formatCapacity = (current, total) => {
  const pct = total > 0 ? ((current / total) * 100).toFixed(1) : 0;
  return `${formatNumber(current)} / ${formatNumber(total)} (${pct}%)`;
};

/**
 * Format a countdown duration (seconds) to HH:MM:SS
 */
export const formatCountdown = (seconds) => {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

/**
 * Format energy in MWh
 */
export const formatEnergy = (mwh) => {
  if (mwh >= 1000) return `${(mwh / 1000).toFixed(2)} GWh`;
  return `${mwh.toFixed(1)} MWh`;
};

/**
 * Format CO2 in tonnes
 */
export const formatCarbon = (tCO2e) => {
  if (tCO2e >= 1000) return `${(tCO2e / 1000).toFixed(2)} kt CO₂e`;
  return `${tCO2e.toFixed(1)} t CO₂e`;
};

/**
 * Format water volume in liters/m³
 */
export const formatWater = (liters) => {
  if (liters >= 1_000_000) return `${(liters / 1_000_000).toFixed(2)} ML`;
  if (liters >= 1000) return `${(liters / 1000).toFixed(1)} kL`;
  return `${liters.toFixed(0)} L`;
};

/**
 * Format a UTC timestamp to local time string
 */
export const formatTime = (isoString, locale = 'en-US') => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date to readable string
 */
export const formatDate = (isoString, locale = 'en-US') => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Relative time (e.g., "3 minutes ago")
 */
export const formatRelativeTime = (isoString) => {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

/**
 * Get crowd density color (green → amber → red)
 */
export const getDensityColor = (density) => {
  if (density >= 0.9) return 'var(--color-danger)';
  if (density >= 0.75) return 'var(--color-warning)';
  if (density >= 0.5) return 'var(--color-accent)';
  return 'var(--color-success)';
};

/**
 * Get density status label
 */
export const getDensityLabel = (density) => {
  if (density >= 0.9) return 'Critical';
  if (density >= 0.75) return 'High';
  if (density >= 0.5) return 'Moderate';
  return 'Low';
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));

/**
 * Generate random in range (for simulation)
 */
export const randInRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Lerp between two values
 */
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Format match score
 */
export const formatScore = (home, away) =>
  `${home ?? '—'} - ${away ?? '—'}`;

/**
 * Get severity badge class
 */
export const getSeverityClass = (severity) => {
  const map = {
    critical: 'stat-badge-down',
    warning: 'bg-amber-500/15 text-amber-400',
    info: 'bg-cyan-500/15 text-cyan-400',
    success: 'stat-badge-up',
  };
  return map[severity] || 'stat-badge-neutral';
};

/**
 * Truncate long strings
 */
export const truncate = (str, maxLen = 80) =>
  str?.length > maxLen ? `${str.slice(0, maxLen)}…` : str || '';
