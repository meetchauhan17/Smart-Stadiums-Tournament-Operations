// ─── aiClient.test.js ─────────────────────────────────────────────
// Tests all security hardened functions in src/utils/aiClient.js
// Uses MSW to intercept Claude API calls.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, MOCK_CLAUDE_URL, mockClaudeSuccess } from '../test/mswServer';
import {
  sanitizeInput,
  escapeHTML,
  getNavigationDirections,
  translateAndRespond,
} from './aiClient';

// ─── Helper: inject an API key so _fetchClaude skips demo-mode ───
function injectApiKey(key = 'sk-test-key-123') {
  localStorage.setItem('stadiumiq_claude_key', key);
}

// ─── Helper: exhaust rate limit ──────────────────────────────────
function exhaustRateLimit() {
  const history = [];
  const now = Date.now();
  for (let i = 0; i < 10; i++) {
    history.push(now - i * 100); // 10 recent timestamps
  }
  sessionStorage.setItem('stadiumiq_rate_history', JSON.stringify(history));
}

// ════════════════════════════════════════════════════════════════════
// 1. sanitizeInput() — Input Sanitization
// ════════════════════════════════════════════════════════════════════
describe('sanitizeInput()', () => {
  it('strips HTML tags, leaving inner text', () => {
    // sanitizeInput removes the <script> and </script> tags,
    // but leaves the textContent between them as-is.
    const dirty = '<script>alert("xss")</script>Hello';
    const result = sanitizeInput(dirty);
    // Must NOT contain angle brackets (tags stripped)
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    // Must contain the text after the tag
    expect(result).toContain('Hello');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
  });

  it('truncates to default 500 char limit', () => {
    const long = 'a'.repeat(600);
    expect(sanitizeInput(long)).toHaveLength(500);
  });

  it('truncates to custom maxLength', () => {
    const text = 'a'.repeat(300);
    expect(sanitizeInput(text, 200)).toHaveLength(200);
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(42)).toBe('');
  });

  it('strips nested HTML tags', () => {
    const input = '<b><i>bold italic</i></b> text';
    expect(sanitizeInput(input)).toBe('bold italic text');
  });
});

// ════════════════════════════════════════════════════════════════════
// 2. escapeHTML() — XSS Prevention
// ════════════════════════════════════════════════════════════════════
describe('escapeHTML()', () => {
  it('escapes angle brackets', () => {
    expect(escapeHTML('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes ampersand', () => {
    expect(escapeHTML('a & b')).toBe('a &amp; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHTML('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHTML("it's")).toBe("it&#x27;s");
  });

  it('returns non-string values unchanged', () => {
    expect(escapeHTML(42)).toBe(42);
    expect(escapeHTML(null)).toBe(null);
  });
});

// ════════════════════════════════════════════════════════════════════
// 3. getNavigationDirections() — Structured Directions
// ════════════════════════════════════════════════════════════════════
describe('getNavigationDirections()', () => {
  beforeEach(() => injectApiKey());

  it('returns success with structured steps and time', async () => {
    const mockJson = JSON.stringify({
      time: '3 min',
      steps: ['Exit Zone E', 'Turn left at Concourse 2', 'Arrive at Gate D'],
    });
    server.use(http.post(MOCK_CLAUDE_URL, () => mockClaudeSuccess(mockJson)));

    const result = await getNavigationDirections('Zone E', 'Gate D', 'MetLife Stadium');

    expect(result.success).toBe(true);
    expect(result.isMock).toBe(false);
    // Data is the raw JSON string — parseable
    const parsed = JSON.parse(result.data);
    expect(parsed).toHaveProperty('time');
    expect(parsed).toHaveProperty('steps');
    expect(Array.isArray(parsed.steps)).toBe(true);
  });

  it('returns fallback mock data when no API key is set', async () => {
    localStorage.removeItem('stadiumiq_claude_key');

    const result = await getNavigationDirections('Zone A', 'Restrooms', 'MetLife Stadium');

    expect(result.success).toBe(true);
    expect(result.isMock).toBe(true);
    const parsed = JSON.parse(result.data);
    expect(parsed.steps.length).toBeGreaterThan(0);
  });

  it('sanitizes destination input — strips HTML tags', async () => {
    const mockJson = JSON.stringify({ time: '2 min', steps: ['Step 1'] });
    let capturedBody;
    server.use(
      http.post(MOCK_CLAUDE_URL, async ({ request }) => {
        capturedBody = await request.json();
        return mockClaudeSuccess(mockJson);
      })
    );

    await getNavigationDirections('Zone A', '<script>xss</script>Gate B', 'MetLife Stadium');

    expect(capturedBody.messages[0].content).not.toContain('<script>');
  });

  it('handles API 500 error — returns fallback data', async () => {
    server.use(
      http.post(MOCK_CLAUDE_URL, () =>
        HttpResponse.json({ error: { message: 'Internal Server Error' } }, { status: 500 })
      )
    );

    const result = await getNavigationDirections('Zone B', 'First Aid', 'Stadium');

    expect(result.success).toBe(false);
    // Still returns usable fallback data
    expect(result.data).toBeTruthy();
    expect(result.error).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════════════
// 4. translateAndRespond() — Language in System Prompt
// ════════════════════════════════════════════════════════════════════
describe('translateAndRespond()', () => {
  beforeEach(() => injectApiKey());

  it('includes target language in system prompt sent to Claude', async () => {
    let capturedBody;
    server.use(
      http.post(MOCK_CLAUDE_URL, async ({ request }) => {
        capturedBody = await request.json();
        return mockClaudeSuccess('Hola! Puedo ayudarte.');
      })
    );

    await translateAndRespond('Where is my seat?', 'es', 'Match day at MetLife');

    expect(capturedBody.system).toContain('Spanish');
  });

  it('includes Arabic language and ALWAYS rule when ar is requested', async () => {
    let capturedBody;
    server.use(
      http.post(MOCK_CLAUDE_URL, async ({ request }) => {
        capturedBody = await request.json();
        return mockClaudeSuccess('مرحبا');
      })
    );

    await translateAndRespond('Help me', 'ar', 'Stadium context');

    expect(capturedBody.system).toContain('Arabic');
    expect(capturedBody.system).toContain('ALWAYS');
  });

  it('returns success with AI response text', async () => {
    server.use(
      http.post(MOCK_CLAUDE_URL, () => mockClaudeSuccess('Bonjour! Je suis ici pour vous aider.'))
    );

    const result = await translateAndRespond('Hello', 'fr', 'Stadium');

    expect(result.success).toBe(true);
    expect(result.data).toContain('Bonjour');
  });
});

// ════════════════════════════════════════════════════════════════════
// 5. Rate Limiting — max 10 calls/minute
// ════════════════════════════════════════════════════════════════════
describe('Rate Limiting', () => {
  beforeEach(() => injectApiKey());

  it('blocks API call when 10 calls already made in the last 60 seconds', async () => {
    exhaustRateLimit();

    const result = await getNavigationDirections('Zone A', 'Gate B', 'Stadium');

    // Should fail and return an error about rate limiting
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/rate limit/i);
  });

  it('allows a call when fewer than 10 calls made in window', async () => {
    // Only 5 calls in history
    const history = [];
    for (let i = 0; i < 5; i++) history.push(Date.now() - i * 100);
    sessionStorage.setItem('stadiumiq_rate_history', JSON.stringify(history));

    const mockJson = JSON.stringify({ time: '2 min', steps: ['Step 1'] });
    server.use(http.post(MOCK_CLAUDE_URL, () => mockClaudeSuccess(mockJson)));

    const result = await getNavigationDirections('Zone A', 'Gate C', 'Stadium');

    // Rate limit should not block this call — error should be undefined or not rate-limit
    expect(result.error).toBeUndefined();
  });

  it('expired timestamps outside 60s window do not count toward limit', async () => {
    // 10 timestamps all older than 61 seconds
    const oldHistory = Array.from({ length: 10 }, (_, i) => Date.now() - 62000 - i * 100);
    sessionStorage.setItem('stadiumiq_rate_history', JSON.stringify(oldHistory));

    const mockJson = JSON.stringify({ time: '2 min', steps: ['Go left'] });
    server.use(http.post(MOCK_CLAUDE_URL, () => mockClaudeSuccess(mockJson)));

    const result = await getNavigationDirections('Zone C', 'Exit', 'Stadium');

    // Should succeed because old timestamps are expired
    expect(result.success).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════
// 6. AbortController Timeout — 10 second limit
// ════════════════════════════════════════════════════════════════════
describe('AbortController timeout', () => {
  beforeEach(() => injectApiKey());

  it('times out after 10 seconds and returns fallback data', async () => {
    vi.useFakeTimers();

    // Handler that never resolves
    server.use(
      http.post(MOCK_CLAUDE_URL, () => new Promise(() => {}))
    );

    const resultPromise = getNavigationDirections('Zone D', 'Medical', 'Stadium');

    // Advance time past the 10s timeout
    vi.advanceTimersByTime(11000);

    const result = await resultPromise;

    // Should fail with timeout/abort error, but return fallback
    expect(result.success).toBe(false);
    // The error message contains 'timed out' (from AbortError handler in aiClient.js)
    expect(result.error).toMatch(/timed.out|abort|10 seconds/i);
    // Fallback data must still be provided
    expect(result.data).toBeTruthy();

    vi.useRealTimers();
  });
});
