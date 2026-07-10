// ─── MSW Mock Server ──────────────────────────────────────────────
// Defines HTTP handlers for the Cohere and Mistral APIs.
// Imported by src/test/setup.js.

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const MOCK_COHERE_URL = 'https://api.cohere.com/v2/chat';
export const MOCK_MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

// Default success response — Cohere
export const mockCohereSuccess = (text = 'Mock Cohere response') =>
  HttpResponse.json({
    id: 'msg_cohere_123',
    message: {
      content: [{ type: 'text', text }]
    },
    meta: { api_version: { version: '2' } }
  });

// Default success response — Mistral
export const mockMistralSuccess = (text = 'Mock Mistral response') =>
  HttpResponse.json({
    id: 'msg_mistral_456',
    object: 'chat.completion',
    choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 30, completion_tokens: 60 },
  });

// Default handler: always returns success for both providers
const defaultHandlers = [
  http.post(MOCK_COHERE_URL, () => mockCohereSuccess()),
  http.post(MOCK_MISTRAL_URL, () => mockMistralSuccess()),
];

export const server = setupServer(...defaultHandlers);
