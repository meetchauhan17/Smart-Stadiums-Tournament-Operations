// ─── formatters.test.js ───────────────────────────────────────────
// Unit tests for all 14 exported utility functions in formatters.js.

import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatPercent,
  formatCapacity,
  formatCountdown,
  formatEnergy,
  formatCarbon,
  formatWater,
  formatTime,
  formatDate,
  formatRelativeTime,
  getDensityColor,
  getDensityLabel,
  clamp,
  randInRange,
  lerp,
  formatScore,
  getSeverityClass,
  truncate,
} from './formatters';

// ════════════════════════════════════════════════════════════════════
// 1. formatNumber()
// ════════════════════════════════════════════════════════════════════
describe('formatNumber()', () => {
  it('formats integers with thousand separators', () => {
    expect(formatNumber(82500)).toBe('82,500');
  });

  it('formats 0 correctly', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats with decimals when specified', () => {
    const result = formatNumber(1234.567, 2);
    expect(result).toContain('1,234');
    expect(result).toContain('57'); // locale-rounded
  });

  it('returns em dash for non-number input', () => {
    expect(formatNumber('not a number')).toBe('—');
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(undefined)).toBe('—');
  });
});

// ════════════════════════════════════════════════════════════════════
// 2. formatPercent()
// ════════════════════════════════════════════════════════════════════
describe('formatPercent()', () => {
  it('formats a 0-100 value as percentage string', () => {
    expect(formatPercent(75)).toBe('75.0%');
  });

  it('treats value ≤ 1 as a fraction (0-1 range)', () => {
    expect(formatPercent(0.5)).toBe('50.0%');
  });

  it('respects custom decimal places', () => {
    expect(formatPercent(66, 2)).toBe('66.00%');
  });

  it('formats 100% correctly', () => {
    expect(formatPercent(100)).toBe('100.0%');
  });
});

// ════════════════════════════════════════════════════════════════════
// 3. formatCapacity()
// ════════════════════════════════════════════════════════════════════
describe('formatCapacity()', () => {
  it('shows current, total, and percentage', () => {
    const result = formatCapacity(41250, 82500);
    expect(result).toContain('41,250');
    expect(result).toContain('82,500');
    expect(result).toContain('50.0%');
  });

  it('handles 0 total without dividing by zero', () => {
    const result = formatCapacity(0, 0);
    expect(result).toContain('0%');
  });
});

// ════════════════════════════════════════════════════════════════════
// 4. formatCountdown()
// ════════════════════════════════════════════════════════════════════
describe('formatCountdown()', () => {
  it('formats seconds to HH:MM:SS', () => {
    expect(formatCountdown(3661)).toBe('01:01:01');
  });

  it('returns 00:00:00 for zero or negative seconds', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(-5)).toBe('00:00:00');
  });

  it('pads single-digit values', () => {
    expect(formatCountdown(70)).toBe('00:01:10');
  });
});

// ════════════════════════════════════════════════════════════════════
// 5. formatEnergy()
// ════════════════════════════════════════════════════════════════════
describe('formatEnergy()', () => {
  it('formats small values in MWh', () => {
    expect(formatEnergy(500)).toContain('MWh');
  });

  it('converts 1000+ MWh to GWh', () => {
    expect(formatEnergy(2500)).toContain('GWh');
    expect(formatEnergy(2500)).toContain('2.50');
  });
});

// ════════════════════════════════════════════════════════════════════
// 6. formatCarbon()
// ════════════════════════════════════════════════════════════════════
describe('formatCarbon()', () => {
  it('formats small values in tCO₂e', () => {
    expect(formatCarbon(500)).toContain('CO₂e');
  });

  it('converts 1000+ tCO₂e to kt', () => {
    expect(formatCarbon(3000)).toContain('kt');
    expect(formatCarbon(3000)).toContain('3.00');
  });
});

// ════════════════════════════════════════════════════════════════════
// 7. formatWater()
// ════════════════════════════════════════════════════════════════════
describe('formatWater()', () => {
  it('formats values < 1000 as liters', () => {
    expect(formatWater(500)).toContain('L');
  });

  it('formats thousands as kL', () => {
    expect(formatWater(5000)).toContain('kL');
  });

  it('formats millions as ML', () => {
    expect(formatWater(2_000_000)).toContain('ML');
  });
});

// ════════════════════════════════════════════════════════════════════
// 8. formatTime()
// ════════════════════════════════════════════════════════════════════
describe('formatTime()', () => {
  it('returns em dash for null/undefined input', () => {
    expect(formatTime(null)).toBe('—');
    expect(formatTime(undefined)).toBe('—');
  });

  it('parses a valid ISO date string and returns time format', () => {
    const result = formatTime('2026-07-18T14:30:00Z', 'en-US');
    // Must contain AM/PM or a colon — flexible to timezone of the test runner
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

// ════════════════════════════════════════════════════════════════════
// 9. formatDate()
// ════════════════════════════════════════════════════════════════════
describe('formatDate()', () => {
  it('returns em dash for null input', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns a readable date string for a valid ISO string', () => {
    const result = formatDate('2026-07-18T00:00:00Z', 'en-US');
    expect(result).toContain('2026');
    expect(result).toMatch(/July|18/);
  });
});

// ════════════════════════════════════════════════════════════════════
// 10. formatRelativeTime()
// ════════════════════════════════════════════════════════════════════
describe('formatRelativeTime()', () => {
  it('formats seconds-ago timestamps', () => {
    const ts = new Date(Date.now() - 30000).toISOString(); // 30s ago
    expect(formatRelativeTime(ts)).toMatch(/\d+s ago/);
  });

  it('formats minutes-ago timestamps', () => {
    const ts = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    expect(formatRelativeTime(ts)).toMatch(/\d+m ago/);
  });

  it('formats hours-ago timestamps', () => {
    const ts = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(formatRelativeTime(ts)).toMatch(/\d+h ago/);
  });

  it('formats days-ago timestamps', () => {
    const ts = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    expect(formatRelativeTime(ts)).toMatch(/\d+d ago/);
  });
});

// ════════════════════════════════════════════════════════════════════
// 11. getDensityColor()
// ════════════════════════════════════════════════════════════════════
describe('getDensityColor()', () => {
  it('returns danger color at density ≥ 0.9', () => {
    expect(getDensityColor(0.9)).toBe('var(--color-danger)');
    expect(getDensityColor(1.0)).toBe('var(--color-danger)');
  });

  it('returns warning color at density ≥ 0.75', () => {
    expect(getDensityColor(0.75)).toBe('var(--color-warning)');
    expect(getDensityColor(0.8)).toBe('var(--color-warning)');
  });

  it('returns accent color at density ≥ 0.5', () => {
    expect(getDensityColor(0.5)).toBe('var(--color-accent)');
    expect(getDensityColor(0.7)).toBe('var(--color-accent)');
  });

  it('returns success color at density < 0.5', () => {
    expect(getDensityColor(0.2)).toBe('var(--color-success)');
    expect(getDensityColor(0)).toBe('var(--color-success)');
  });
});

// ════════════════════════════════════════════════════════════════════
// 12. getDensityLabel()
// ════════════════════════════════════════════════════════════════════
describe('getDensityLabel()', () => {
  it('returns "Critical" at ≥ 0.9', () => {
    expect(getDensityLabel(0.95)).toBe('Critical');
  });

  it('returns "High" at ≥ 0.75', () => {
    expect(getDensityLabel(0.8)).toBe('High');
  });

  it('returns "Moderate" at ≥ 0.5', () => {
    expect(getDensityLabel(0.6)).toBe('Moderate');
  });

  it('returns "Low" at < 0.5', () => {
    expect(getDensityLabel(0.3)).toBe('Low');
  });
});

// ════════════════════════════════════════════════════════════════════
// 13. clamp()
// ════════════════════════════════════════════════════════════════════
describe('clamp()', () => {
  it('clamps to max when value exceeds it', () => {
    expect(clamp(1.5)).toBe(1);
  });

  it('clamps to min when value is below it', () => {
    expect(clamp(-0.5)).toBe(0);
  });

  it('returns value unchanged when within range', () => {
    expect(clamp(0.5)).toBe(0.5);
  });

  it('supports custom min/max', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-10, 0, 100)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════
// 14. randInRange()
// ════════════════════════════════════════════════════════════════════
describe('randInRange()', () => {
  it('returns an integer within [min, max] inclusive', () => {
    for (let i = 0; i < 20; i++) {
      const v = randInRange(5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(10);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

// ════════════════════════════════════════════════════════════════════
// 15. lerp()
// ════════════════════════════════════════════════════════════════════
describe('lerp()', () => {
  it('returns a at t=0', () => {
    expect(lerp(0, 100, 0)).toBe(0);
  });

  it('returns b at t=1', () => {
    expect(lerp(0, 100, 1)).toBe(100);
  });

  it('returns midpoint at t=0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });
});

// ════════════════════════════════════════════════════════════════════
// 16. formatScore()
// ════════════════════════════════════════════════════════════════════
describe('formatScore()', () => {
  it('formats two scores with a dash separator', () => {
    expect(formatScore(2, 1)).toBe('2 - 1');
  });

  it('shows em dash for null/undefined values', () => {
    expect(formatScore(null, null)).toBe('— - —');
    expect(formatScore(undefined, undefined)).toBe('— - —');
  });

  it('handles 0 - 0 correctly', () => {
    expect(formatScore(0, 0)).toBe('0 - 0');
  });
});

// ════════════════════════════════════════════════════════════════════
// 17. getSeverityClass()
// ════════════════════════════════════════════════════════════════════
describe('getSeverityClass()', () => {
  it('returns stat-badge-down for critical', () => {
    expect(getSeverityClass('critical')).toBe('stat-badge-down');
  });

  it('returns amber class for warning', () => {
    expect(getSeverityClass('warning')).toContain('amber');
  });

  it('returns cyan class for info', () => {
    expect(getSeverityClass('info')).toContain('cyan');
  });

  it('returns stat-badge-up for success', () => {
    expect(getSeverityClass('success')).toBe('stat-badge-up');
  });

  it('returns default neutral class for unknown severity', () => {
    expect(getSeverityClass('unknown')).toBe('stat-badge-neutral');
    expect(getSeverityClass()).toBe('stat-badge-neutral');
  });
});

// ════════════════════════════════════════════════════════════════════
// 18. truncate()
// ════════════════════════════════════════════════════════════════════
describe('truncate()', () => {
  it('truncates strings longer than maxLen and appends ellipsis', () => {
    const result = truncate('Hello World This Is Long', 10);
    expect(result.length).toBeLessThanOrEqual(11); // 10 chars + ellipsis char
    expect(result).toContain('…');
  });

  it('returns short strings unchanged', () => {
    expect(truncate('Short', 80)).toBe('Short');
  });

  it('returns empty string for null/undefined', () => {
    expect(truncate(null)).toBe('');
    expect(truncate(undefined)).toBe('');
  });
});
