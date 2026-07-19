// ─── StadiumIQ Logger ─────────────────────────────────────────────
//
// Centralized, environment-aware logger.
//
//  • In development/test: writes to the browser console.
//  • In production (PROD build): all output is suppressed so that
//    debug traces never leak into the browser console for end-users.
//
// Usage:
//   import { logger } from './logger';
//   logger.warn('Rate limit hit');
//   logger.error('Fetch failed', err);
//
// This replaces all raw console.{log,warn,error} calls throughout
// the codebase, keeping the production bundle clean.

const isDev = import.meta.env.DEV;
const PREFIX = '[StadiumIQ]';

/** @type {{ log: Function, warn: Function, error: Function }} */
export const logger = {
  /**
   * Write an informational message (dev/test only).
   * @param {...*} args
   */
  log: (...args) => {
    if (isDev) console.log(PREFIX, ...args);   // eslint-disable-line no-console
  },

  /**
   * Write a warning message (dev/test only).
   * @param {...*} args
   */
  warn: (...args) => {
    if (isDev) console.warn(PREFIX, ...args);  // eslint-disable-line no-console
  },

  /**
   * Write an error message (dev/test only).
   * @param {...*} args
   */
  error: (...args) => {
    if (isDev) console.error(PREFIX, ...args); // eslint-disable-line no-console
  },
};
