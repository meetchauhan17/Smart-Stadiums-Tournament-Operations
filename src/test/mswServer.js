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

  // Weather API mock
  http.get('https://api.open-meteo.com/v1/forecast', () => HttpResponse.json({
    current: {
      temperature_2m: 22,
      relative_humidity_2m: 60,
      wind_speed_10m: 10,
      wind_direction_10m: 180,
      weather_code: 0,
      apparent_temperature: 22,
      precipitation: 0
    }
  })),

  // Air Quality API mock
  http.get('https://air-quality-api.open-meteo.com/v1/air-quality', () => HttpResponse.json({
    current: {
      us_aqi: 45,
      pm2_5: 5.2,
      pm10: 10.4,
      carbon_monoxide: 120,
      nitrogen_dioxide: 8.5
    }
  })),

  // Exchange Rates API mock
  http.get('https://api.frankfurter.app/latest', () => HttpResponse.json({
    rates: {
      EUR: 0.92, GBP: 0.79, MXN: 17.2, CAD: 1.35, BRL: 5.15,
      SAR: 3.75, AED: 3.67, JPY: 155.4, KRW: 1350.0, ARS: 880.0
    }
  })),

  // openfootball API mock
  http.get('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2022/worldcup.json', () => HttpResponse.json({
    matches: [
      { team1: 'USA', team2: 'England', score: { ft: [1, 1] }, group: 'Group B' },
      { team1: 'Mexico', team2: 'Germany', score: { ft: [2, 1] }, group: 'Group C' }
    ]
  })),

  // REST Countries flag API mock
  http.get('https://restcountries.com/v3.1/name/:name', () => HttpResponse.json([
    { flags: { svg: 'https://flagcdn.com/us.svg', png: 'https://flagcdn.com/w320/us.png' } }
  ])),
];

export const server = setupServer(...defaultHandlers);
