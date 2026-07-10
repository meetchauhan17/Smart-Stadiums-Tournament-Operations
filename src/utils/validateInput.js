// ─── validateInput.js ─────────────────────────────────────────────
// Centralized, type-safe input validation for all user-facing inputs.
// Used consistently across Fan Hub, Operations, Staff, and AI clients.
//
// O(1) lookup via pre-indexed Set/Map — optimized for
// real-time crowd data processing at scale.

/** Valid zone identifiers — A through H */
const VALID_ZONES = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);

/** Supported language codes */
const VALID_LANGUAGE_CODES = new Set(['en', 'es', 'fr', 'pt', 'ar', 'de']);

/** Supported language names (user-facing) */
const VALID_LANGUAGE_NAMES = new Set([
  'English', 'Spanish', 'French', 'Portuguese', 'Arabic', 'German',
]);

/**
 * Validate a user input value against a known type.
 *
 * @param {*}      value - The raw value to validate
 * @param {string} type  - One of: 'zone' | 'languageCode' | 'languageName' | 'density' | 'apiText'
 * @returns {{ valid: boolean, value: *, error: string|null }}
 *
 * @example
 * validateInput('E', 'zone')          // { valid: true,  value: 'E',   error: null }
 * validateInput('Z', 'zone')          // { valid: false, value: null,  error: 'Zone must be A–H' }
 * validateInput(105,  'density')      // { valid: true,  value: 100,   error: null }  ← clamped
 * validateInput(NaN,  'density')      // { valid: false, value: null,  error: '...' }
 * validateInput('<script>xss', 'apiText') // { valid: true, value: 'xss', error: null } ← sanitized
 */
export function validateInput(value, type) {
  switch (type) {

    // ── Zone: must be a single letter A-H ────────────────────────
    case 'zone': {
      const upper = String(value || '').trim().toUpperCase();
      if (!VALID_ZONES.has(upper)) {
        return { valid: false, value: null, error: `Zone must be A–H. Received: "${value}"` };
      }
      return { valid: true, value: upper, error: null };
    }

    // ── Language code: must be in supported set ───────────────────
    case 'languageCode': {
      const code = String(value || '').trim().toLowerCase();
      if (!VALID_LANGUAGE_CODES.has(code)) {
        return { valid: false, value: null, error: `Language code "${value}" is not supported. Use: ${[...VALID_LANGUAGE_CODES].join(', ')}` };
      }
      return { valid: true, value: code, error: null };
    }

    // ── Language name: must be a supported display name ───────────
    case 'languageName': {
      // Case-insensitive match
      const normalized = String(value || '').trim();
      const match = [...VALID_LANGUAGE_NAMES].find(
        n => n.toLowerCase() === normalized.toLowerCase()
      );
      if (!match) {
        return { valid: false, value: null, error: `Language "${value}" is not supported.` };
      }
      return { valid: true, value: match, error: null };
    }

    // ── Crowd density: must be a finite number, clamped 0-100 ─────
    case 'density': {
      const num = Number(value);
      if (!Number.isFinite(num)) {
        return { valid: false, value: null, error: `Crowd density must be a number (0–100). Received: "${value}"` };
      }
      // Clamp silently — out-of-range values are coerced, not rejected
      const clamped = Math.max(0, Math.min(100, num));
      return { valid: true, value: clamped, error: null };
    }

    // ── API text: strip HTML, enforce max 500 chars ───────────────
    case 'apiText': {
      if (typeof value !== 'string') {
        return { valid: value !== null && value !== undefined, value: '', error: null };
      }
      const stripped = value.replace(/<\/?[^>]+(>|$)/g, '').trim().slice(0, 500);
      return { valid: true, value: stripped, error: null };
    }

    default:
      return { valid: false, value: null, error: `Unknown validation type: "${type}"` };
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────

/** Returns true if zone letter is valid (A-H). */
export const isValidZone       = (z) => validateInput(z, 'zone').valid;

/** Returns true if language code is in supported set. */
export const isValidLangCode   = (c) => validateInput(c, 'languageCode').valid;

/** Returns clamped density, or null if value is not a finite number. */
export const clampDensity      = (d) => validateInput(d, 'density').value;

/** Strip HTML and truncate to 500 chars for safe API submission. */
export const sanitizeApiText   = (t) => validateInput(t, 'apiText').value;
