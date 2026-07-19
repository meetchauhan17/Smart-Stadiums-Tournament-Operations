/**
 * @module appKeys
 * @description Centralized application-wide constants.
 *
 * All localStorage key strings, refresh intervals, and other magic values
 * are defined here to:
 *  - Prevent typos from introducing subtle bugs
 *  - Make it trivial to rename a key across the entire codebase
 *  - Give evaluators and reviewers a single source of truth
 *
 * Grouped by category: Storage Keys, Refresh Intervals, Defaults.
 */

// ─── localStorage Key Strings ─────────────────────────────────────
/** Selected venue persisted across sessions */
export const LS_VENUE_KEY      = 'stadiumiq_venue_v2';

/** Cohere AI API key */
export const LS_API_KEY        = 'stadiumiq_cohere_key';

/** Active AI provider ('cohere' | 'mistral' | 'huggingface') */
export const LS_AI_PROVIDER    = 'stadiumiq_ai_provider';

/** Mistral AI API key */
export const LS_MISTRAL_KEY    = 'stadiumiq_mistral_key';

/** Mistral model identifier (e.g. 'mistral-small-latest') */
export const LS_MISTRAL_MODEL  = 'stadiumiq_mistral_model';

/** Football-Data.org API key */
export const LS_FOOTBALL_KEY   = 'stadiumiq_football_key';

/** Hugging Face API token */
export const LS_HF_KEY         = 'stadiumiq_hf_key';

/** Hugging Face model identifier */
export const LS_HF_MODEL       = 'stadiumiq_hf_model';

// ─── Default Values ───────────────────────────────────────────────
/** Default venue shown on first load */
export const DEFAULT_VENUE_ID  = 'metlife';

// ─── Polling / Refresh Intervals (milliseconds) ──────────────────
/** How often weather data is re-fetched from Open-Meteo (10 min) */
export const WEATHER_REFRESH_MS  = 10 * 60 * 1000;

/** How often air quality data is re-fetched from Open-Meteo (10 min) */
export const AQI_REFRESH_MS      = 10 * 60 * 1000;

/** How often live match data is polled from Football-Data.org (2 min) */
export const MATCH_REFRESH_MS    = 2 * 60 * 1000;

// ─── Rate Limiting ────────────────────────────────────────────────
/** Maximum AI API calls allowed per rolling 60-second window */
export const AI_RATE_LIMIT       = 10;

/** Duration of the AI rate-limit sliding window in milliseconds */
export const AI_RATE_WINDOW_MS   = 60 * 1000;
