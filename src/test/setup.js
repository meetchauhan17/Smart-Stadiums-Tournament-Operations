// ─── Global Test Setup ────────────────────────────────────────────
// Runs before every test file in the suite.

import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mswServer';

// ── MSW lifecycle ──────────────────────────────────────────────────
// Start mock server before all tests; reset handlers between tests;
// close mock server after all tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  // Reset sessionStorage between tests to avoid rate limiter bleed-through
  sessionStorage.clear();
  localStorage.clear();
});
afterAll(() => server.close());

// ── Global mocks ──────────────────────────────────────────────────
// Framer motion: avoid animation timing issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: new Proxy({}, {
      get: (_, tag) => {
        const MotionComponent = (props) => {
          const React = require('react');
          return React.createElement(tag, props);
        };
        MotionComponent.displayName = `motion.${tag}`;
        return MotionComponent;
      },
    }),
    AnimatePresence: ({ children }) => {
      const React = require('react');
      return React.createElement(React.Fragment, null, children);
    },
  };
});

// react-i18next: return keys as-is so test assertions are stable
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// react-router-dom: mock Link and useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});
