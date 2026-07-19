// ─── logger.test.js ───────────────────────────────────────────────
// Tests the centralized logger utility.
// Verifies all three methods exist and call the correct console methods
// (in dev/test mode, which is the environment vitest runs in).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  let originalLog, originalWarn, originalError;

  beforeEach(() => {
    // Spy on console methods
    originalLog   = vi.spyOn(console, 'log').mockImplementation(() => {});
    originalWarn  = vi.spyOn(console, 'warn').mockImplementation(() => {});
    originalError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports an object with log, warn, and error methods', () => {
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('logger.log calls console.log in dev/test mode', () => {
    logger.log('hello world');
    // In vitest, import.meta.env.DEV is true — so console.log should be called
    expect(console.log).toHaveBeenCalled();
  });

  it('logger.warn calls console.warn in dev/test mode', () => {
    logger.warn('a warning');
    expect(console.warn).toHaveBeenCalled();
  });

  it('logger.error calls console.error in dev/test mode', () => {
    logger.error('an error');
    expect(console.error).toHaveBeenCalled();
  });

  it('logger.log forwards all arguments', () => {
    logger.log('msg', { key: 'value' }, 42);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[StadiumIQ]'),
      'msg',
      { key: 'value' },
      42
    );
  });
});
