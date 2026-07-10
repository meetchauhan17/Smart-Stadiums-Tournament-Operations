// ─── aiClient.test.js ─────────────────────────────────────────────
// Tests all security hardened functions in src/utils/aiClient.js
// Uses MSW to intercept Cohere and Mistral API calls.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, MOCK_COHERE_URL, MOCK_MISTRAL_URL, mockCohereSuccess, mockMistralSuccess } from '../test/mswServer';
import {
  sanitizeInput,
  escapeHTML,
  getNavigationDirections,
  translateAndRespond,
} from './aiClient';

// ─── Helper: inject an API key so _fetchAI skips demo-mode ───
function injectApiKey(key = 'cohere-test-key-123', provider = 'cohere') {
  localStorage.setItem('stadiumiq_ai_provider', provider);
  if (provider === 'cohere') {
    localStorage.setItem('stadiumiq_cohere_key', key);
  } else {
    localStorage.setItem('stadiumiq_mistral_key', key);
    localStorage.setItem('stadiumiq_mistral_model', 'mistral-small-latest');
  }
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
    const dirty = '<script>alert("xss")</script>Hello';
    const result = sanitizeInput(dirty);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
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
  beforeEach(() => injectApiKey('cohere-key', 'cohere'));

  it('returns success with structured steps and time', async () => {
    const mockJson = JSON.stringify({
      time: '3 min',
      steps: ['Exit Zone E', 'Turn left at Concourse 2', 'Arrive at Gate D'],
    });
    server.use(http.post(MOCK_COHERE_URL, () => mockCohereSuccess(mockJson)));

    const result = await getNavigationDirections('Zone E', 'Gate D', 'MetLife Stadium');

    expect(result.success).toBe(true);
    expect(result.isMock).toBe(false);
    const parsed = JSON.parse(result.data);
    expect(parsed).toHaveProperty('route');
    expect(parsed).toHaveProperty('estimatedTime');
    expect(Array.isArray(parsed.route)).toBe(true);
  });

  it('returns fallback mock data when no API key is set', async () => {
    localStorage.removeItem('stadiumiq_cohere_key');

    const result = await getNavigationDirections('Zone A', 'Restrooms', 'MetLife Stadium');

    expect(result.success).toBe(true);
    expect(result.isMock).toBe(true);
    const parsed = JSON.parse(result.data);
    expect(parsed.route.length).toBeGreaterThan(0);
  });

  it('sanitizes destination input — strips HTML tags', async () => {
    const mockJson = JSON.stringify({ time: '2 min', steps: ['Step 1'] });
    let capturedBody;
    server.use(
      http.post(MOCK_COHERE_URL, async ({ request }) => {
        capturedBody = await request.json();
        return mockCohereSuccess(mockJson);
      })
    );

    await getNavigationDirections('Zone A', '<script>xss</script>Gate B', 'MetLife Stadium');

    const sysMsg = capturedBody.messages.find(m => m.role === 'system')?.content || '';
    const userMsg = capturedBody.messages.find(m => m.role === 'user')?.content || '';
    expect(sysMsg).not.toContain('<script>');
    expect(userMsg).not.toContain('<script>');
  });

  it('handles API 500 error — returns fallback data', async () => {
    server.use(
      http.post(MOCK_COHERE_URL, () =>
        HttpResponse.json({ error: { message: 'Internal Server Error' } }, { status: 500 })
      )
    );

    const result = await getNavigationDirections('Zone B', 'First Aid', 'Stadium');

    expect(result.success).toBe(false);
    expect(result.data).toBeTruthy();
    expect(result.error).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════════════
// 4. translateAndRespond() — Language in System Prompt
// ════════════════════════════════════════════════════════════════════
describe('translateAndRespond()', () => {
  beforeEach(() => injectApiKey('cohere-key', 'cohere'));

  it('includes target language in system prompt sent to AI', async () => {
    let capturedBody;
    server.use(
      http.post(MOCK_COHERE_URL, async ({ request }) => {
        capturedBody = await request.json();
        return mockCohereSuccess('Hola! Puedo ayudarte.');
      })
    );

    await translateAndRespond('Where is my seat?', 'es', 'Match day at MetLife');

    const sysMsg = capturedBody.messages.find(m => m.role === 'system')?.content || '';
    expect(sysMsg).toContain('Spanish');
  });

  it('includes Arabic language and ALWAYS rule when ar is requested', async () => {
    let capturedBody;
    server.use(
      http.post(MOCK_COHERE_URL, async ({ request }) => {
        capturedBody = await request.json();
        return mockCohereSuccess('مرحبا');
      })
    );

    await translateAndRespond('Help me', 'ar', 'Stadium context');

    const sysMsg = capturedBody.messages.find(m => m.role === 'system')?.content || '';
    expect(sysMsg).toContain('Arabic');
    expect(sysMsg).toContain('ALWAYS');
  });

  it('returns success with AI response text', async () => {
    server.use(
      http.post(MOCK_COHERE_URL, () => mockCohereSuccess('Bonjour! Je suis ici pour vous aider.'))
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

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/rate limit/i);
  });

  it('allows a call when fewer than 10 calls made in window', async () => {
    const history = [];
    for (let i = 0; i < 5; i++) history.push(Date.now() - i * 100);
    sessionStorage.setItem('stadiumiq_rate_history', JSON.stringify(history));

    const mockJson = JSON.stringify({ time: '2 min', steps: ['Step 1'] });
    server.use(http.post(MOCK_COHERE_URL, () => mockCohereSuccess(mockJson)));

    const result = await getNavigationDirections('Zone A', 'Gate C', 'Stadium');

    expect(result.error).toBeUndefined();
  });

  it('expired timestamps outside 60s window do not count toward limit', async () => {
    const oldHistory = Array.from({ length: 10 }, (_, i) => Date.now() - 62000 - i * 100);
    sessionStorage.setItem('stadiumiq_rate_history', JSON.stringify(oldHistory));

    const mockJson = JSON.stringify({ time: '2 min', steps: ['Go left'] });
    server.use(http.post(MOCK_COHERE_URL, () => mockCohereSuccess(mockJson)));

    const result = await getNavigationDirections('Zone C', 'Exit', 'Stadium');

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

    server.use(
      http.post(MOCK_COHERE_URL, () => new Promise(() => {}))
    );

    const resultPromise = getNavigationDirections('Zone D', 'Medical', 'Stadium');
    vi.advanceTimersByTime(11000);

    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/timed.out|abort|10 seconds/i);
    expect(result.data).toBeTruthy();

    vi.useRealTimers();
  });
});

// ════════════════════════════════════════════════════════════════════
// 7. Mistral Provider (Replaces Hugging Face)
// ════════════════════════════════════════════════════════════════════
describe('Mistral AI provider', () => {
  beforeEach(() => {
    injectApiKey('mistral-key-123', 'mistral');
  });

  it('returns success with Mistral response text when key is set', async () => {
    server.use(http.post(MOCK_MISTRAL_URL, () => mockMistralSuccess('Mistral navigation answer')));

    const result = await getNavigationDirections('Section A', 'Exit 3', 'MetLife Stadium');

    expect(result.success).toBe(true);
    expect(result.isMock).toBe(false);
    const parsed = JSON.parse(result.data);
    expect(Array.isArray(parsed.route) || Array.isArray(parsed.steps)).toBe(true);
  });

  it('falls back to demo mode when no Mistral key is set', async () => {
    localStorage.removeItem('stadiumiq_mistral_key');

    const result = await getNavigationDirections('Section B', 'Gate C', 'MetLife Stadium');

    expect(result.success).toBe(true);
    expect(result.isMock).toBe(true);
  });

  it('sends Authorization: Bearer header with key', async () => {
    let capturedHeaders;
    server.use(
      http.post(MOCK_MISTRAL_URL, ({ request }) => {
        capturedHeaders = Object.fromEntries(request.headers.entries());
        return mockMistralSuccess('ok');
      })
    );

    await getNavigationDirections('Zone D', 'Concourse', 'Stadium');

    expect(capturedHeaders['authorization']).toBe('Bearer mistral-key-123');
  });

  it('sends the configured model ID in the request body', async () => {
    const customModel = 'open-mixtral-8x7b';
    localStorage.setItem('stadiumiq_mistral_model', customModel);

    let capturedBody;
    server.use(
      http.post(MOCK_MISTRAL_URL, async ({ request }) => {
        capturedBody = await request.json();
        return mockMistralSuccess('ok');
      })
    );

    await getNavigationDirections('Zone E', 'Exit', 'Stadium');

    expect(capturedBody.model).toBe(customModel);
  });

  it('returns fallback data on Mistral API 401 error', async () => {
    server.use(
      http.post(MOCK_MISTRAL_URL, () =>
        HttpResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
      )
    );

    const result = await getNavigationDirections('Zone A', 'Gate D', 'Stadium');

    expect(result.success).toBe(false);
    expect(result.data).toBeTruthy();
    expect(result.error).toBeTruthy();
  });

  it('returns fallback data on Mistral API 503 error', async () => {
    server.use(
      http.post(MOCK_MISTRAL_URL, () =>
        HttpResponse.json({ error: { message: 'Service Unavailable' } }, { status: 503 })
      )
    );

    const result = await getNavigationDirections('Zone B', 'Medical', 'Stadium');

    expect(result.success).toBe(false);
    expect(result.data).toBeTruthy();
  });

  it('sanitizes user input before sending to Mistral endpoint', async () => {
    let capturedBody;
    server.use(
      http.post(MOCK_MISTRAL_URL, async ({ request }) => {
        capturedBody = await request.json();
        return mockMistralSuccess('ok');
      })
    );

    await getNavigationDirections('<script>xss</script>Zone A', 'Gate B', 'Stadium');

    const userMsg = capturedBody.messages.find(m => m.role === 'user');
    expect(userMsg.content).not.toContain('<script>');
  });
});

// ════════════════════════════════════════════════════════════════════
// 8. Edge Cases — Empty String Input
// ════════════════════════════════════════════════════════════════════
describe('Edge Cases — empty string input', () => {
  beforeEach(() => injectApiKey('cohere-test-key', 'cohere'));

  it('empty string destination → returns fallback, does not crash', async () => {
    server.use(
      http.post(MOCK_COHERE_URL, () =>
        mockCohereSuccess('ROUTE:\n1. Go left\nWHY THIS ROUTE: test\nESTIMATED TIME: 2 minutes walking')
      )
    );
    const result = await getNavigationDirections('Zone A', '', 'MetLife Stadium');
    expect(result).toBeTruthy();
    expect(result.data).toBeTruthy();
  });

  it('empty string to translateAndRespond → returns fallback, does not crash', async () => {
    server.use(http.post(MOCK_COHERE_URL, () => mockCohereSuccess('[TONE: general]\nHello!')));
    const result = await translateAndRespond('', 'en', 'Stadium');
    expect(result).toBeTruthy();
    expect(typeof result.data).toBe('string');
  });
});

// ════════════════════════════════════════════════════════════════════
// 9. Edge Cases — Input > 500 chars truncated before API call
// ════════════════════════════════════════════════════════════════════
describe('Edge Cases — input > 500 chars truncated before API call', () => {
  beforeEach(() => injectApiKey('cohere-test-key', 'cohere'));

  it('message > 500 chars to translateAndRespond is truncated to 500', async () => {
    const longMsg = 'A'.repeat(600);
    let capturedBody;
    server.use(
      http.post(MOCK_COHERE_URL, async ({ request }) => {
        capturedBody = await request.json();
        return mockCohereSuccess('[TONE: general]\nOK');
      })
    );

    await translateAndRespond(longMsg, 'en', 'Stadium');

    const userContent = capturedBody.messages.find(m => m.role === 'user').content;
    expect(userContent.length).toBeLessThanOrEqual(500);
  });

  it('navigation destination > 200 chars is truncated', async () => {
    const longDest = 'X'.repeat(300);
    let capturedBody;
    server.use(
      http.post(MOCK_COHERE_URL, async ({ request }) => {
        capturedBody = await request.json();
        return mockCohereSuccess('ROUTE:\n1. Turn right\nWHY THIS ROUTE: short path\nESTIMATED TIME: 3 minutes walking');
      })
    );

    await getNavigationDirections('Zone A', longDest, 'MetLife Stadium');

    const userMsg = capturedBody.messages.find(m => m.role === 'user').content;
    expect(userMsg).not.toContain('X'.repeat(201));
  });
});

// ════════════════════════════════════════════════════════════════════
// 10. Edge Cases — API timeout → cached fallback response returned
// ════════════════════════════════════════════════════════════════════
describe('Edge Cases — API timeout returns fallback, not undefined', () => {
  beforeEach(() => injectApiKey('cohere-test-key', 'cohere'));

  it('timeout after 10s → fallback data is returned, not a crash', async () => {
    vi.useFakeTimers();

    server.use(
      http.post(MOCK_COHERE_URL, () => new Promise(() => {}))
    );

    const resultPromise = getNavigationDirections('Zone C', 'Exit Gate', 'MetLife Stadium');
    vi.advanceTimersByTime(11000);
    const result = await resultPromise;

    expect(result.data).toBeTruthy();
    const parsed = JSON.parse(result.data);
    expect(Array.isArray(parsed.route) || Array.isArray(parsed.steps)).toBe(true);

    vi.useRealTimers();
  });
});

// ════════════════════════════════════════════════════════════════════
// 11. Edge Cases — Arabic language RTL response
// ════════════════════════════════════════════════════════════════════
describe('Edge Cases — Arabic (ar) → RTL-compatible response', () => {
  beforeEach(() => injectApiKey('cohere-test-key', 'cohere'));

  it('AI returns Arabic Unicode text for ar language code', async () => {
    const arabicResponse = '[TONE: general]\nمرحباً! أنا هنا لمساعدتك في الملعب.';
    server.use(http.post(MOCK_COHERE_URL, () => mockCohereSuccess(arabicResponse)));

    const result = await translateAndRespond('Where is my seat?', 'ar', 'Stadium');

    expect(result.success).toBe(true);
    expect(/[\u0600-\u06FF]/.test(result.data)).toBe(true);
  });

  it('sanitizeInput preserves Arabic Unicode characters unchanged', () => {
    const arabic = 'مرحباً بالملعب';
    expect(sanitizeInput(arabic)).toContain('مرحباً');
  });
});

// ════════════════════════════════════════════════════════════════════
// 12. Edge Cases — Zone density boundary + validateInput utility
// ════════════════════════════════════════════════════════════════════
describe('Edge Cases — validateInput zone and density boundaries', () => {
  it('density = 0 → valid, value is 0 (not null, not crash)', async () => {
    const { validateInput } = await import('./validateInput');
    const result = validateInput(0, 'density');
    expect(result.valid).toBe(true);
    expect(result.value).toBe(0);
    expect(result.error).toBeNull();
  });

  it('density = 101 → clamped to 100 (not rejected)', async () => {
    const { validateInput } = await import('./validateInput');
    const result = validateInput(101, 'density');
    expect(result.valid).toBe(true);
    expect(result.value).toBe(100);
  });

  it('density = NaN → valid:false, value:null', async () => {
    const { validateInput } = await import('./validateInput');
    const result = validateInput(NaN, 'density');
    expect(result.valid).toBe(false);
    expect(result.value).toBeNull();
  });

  it('zone "A" → valid', async () => {
    const { validateInput } = await import('./validateInput');
    expect(validateInput('A', 'zone').valid).toBe(true);
  });

  it('zone "H" → valid (last valid zone)', async () => {
    const { validateInput } = await import('./validateInput');
    expect(validateInput('H', 'zone').valid).toBe(true);
  });

  it('zone "Z" → invalid with descriptive error', async () => {
    const { validateInput } = await import('./validateInput');
    const result = validateInput('Z', 'zone');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/A.H/i);
  });

  it('zone "I" → invalid (out of A-H range)', async () => {
    const { validateInput } = await import('./validateInput');
    expect(validateInput('I', 'zone').valid).toBe(false);
  });

  it('zone density = 0 → getZoneColor should return green, not crash', async () => {
    const { getZoneColor } = await import('../components/ZoneMap');
    expect(getZoneColor(0)).toBe('#10B981');
  });
});

// ════════════════════════════════════════════════════════════════════
// 13. Edge Cases — Venue switch mid-call (AbortController)
// ════════════════════════════════════════════════════════════════════
describe('Edge Cases — concurrent API calls with AbortController timeout', () => {
  beforeEach(() => injectApiKey('cohere-test-key', 'cohere'));

  it('second call resolves successfully after first call times out', async () => {
    vi.useFakeTimers();

    server.use(
      http.post(MOCK_COHERE_URL, () => new Promise(() => {}))
    );

    const firstPromise = getNavigationDirections('Zone A', 'Gate B', 'Stadium');

    vi.advanceTimersByTime(11000);
    const firstResult = await firstPromise;

    expect(firstResult.data).toBeTruthy();

    server.use(
      http.post(MOCK_COHERE_URL, () =>
        mockCohereSuccess('ROUTE:\n1. Turn right\nWHY THIS ROUTE: less crowded\nESTIMATED TIME: 2 minutes walking')
      )
    );

    vi.useRealTimers();

    const secondResult = await getNavigationDirections('Zone B', 'Medical Bay', 'Stadium');
    expect(secondResult.data).toBeTruthy();
  });
});
