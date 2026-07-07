// ─── MSW Mock Server ──────────────────────────────────────────────
// Defines HTTP handlers for the Claude API and sets up the server.
// Imported by src/test/setup.js.

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const MOCK_CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

// Default success response — mirrors real Claude API shape
export const mockClaudeSuccess = (text = 'Mock AI response') =>
  HttpResponse.json({
    id: 'msg_mock_123',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text }],
    model: 'claude-sonnet-4-5',
    stop_reason: 'end_turn',
    usage: { input_tokens: 50, output_tokens: 80 },
  });

// Default handler: always returns success
const defaultHandlers = [
  http.post(MOCK_CLAUDE_URL, () => mockClaudeSuccess()),
];

export const server = setupServer(...defaultHandlers);
