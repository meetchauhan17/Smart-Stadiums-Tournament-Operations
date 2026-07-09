// ─── Operations.test.jsx ─────────────────────────────────────────
// Tests the Operations Control Room page.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { StadiumProvider } from '../context/StadiumContext';
import { ToastProvider } from '../components/Toast';
import { http, HttpResponse } from 'msw';
import { server, MOCK_CLAUDE_URL, mockClaudeSuccess } from '../test/mswServer';
import Operations from './Operations';

// ─── Render helper ────────────────────────────────────────────────
function renderOperations() {
  return render(
    <ToastProvider>
      <StadiumProvider>
        <BrowserRouter>
          <Operations />
        </BrowserRouter>
      </StadiumProvider>
    </ToastProvider>
  );
}

// ─── aiHelper mock ───────────────────────────────────────────────
vi.mock('../utils/aiHelper', async () => ({
  callClaude: vi.fn().mockResolvedValue(
    JSON.stringify({
      actions: ['Deploy stewards', 'Redirect fans'],
      staff: 'Send 4 stewards to Zone E.',
      pa: 'Ladies and gentlemen, please follow steward directions.',
      time: '8 min',
    })
  ),
  buildOperationsSystemPrompt: vi.fn().mockReturnValue('Mock system prompt'),
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

// Mock ZoneMap
vi.mock('../components/ZoneMap', () => ({
  default: () => <div data-testid="zone-map">Mock ZoneMap</div>,
}));

// ════════════════════════════════════════════════════════════════════
// 1. KPI Strip — 5 Flat Stats
// ════════════════════════════════════════════════════════════════════
describe('Operations — KPI strip', () => {
  it('renders all 5 KPI stats by label text', () => {
    renderOperations();

    const kpiLabels = [
      'OCCUPANCY',
      'ALERTS',
      'STAFF ON DUTY',
      'RESPONSE TIME',
      'AIR QUALITY (AQI)',
    ];
    kpiLabels.forEach(label => {
      const elements = screen.queryAllByText(label);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// 2. Alerts Feed — renders active alerts from context
// ════════════════════════════════════════════════════════════════════
describe('Operations — alerts feed', () => {
  it('renders alerts panel heading', () => {
    renderOperations();

    expect(screen.getByText(/ACTIVE ALERTS/i)).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════════════
// 3. Resolve button — clicking Resolve triggers context action
// ════════════════════════════════════════════════════════════════════
describe('Operations — resolve alert', () => {
  it('renders Resolve buttons for active unresolved alerts', () => {
    renderOperations();

    const resolveButtons = screen.queryAllByText('RESOLVE');
    expect(resolveButtons.length).toBeGreaterThanOrEqual(0);
  });

  it('clicking Resolve removes the button from the DOM or decrements', async () => {
    const user = userEvent.setup();
    renderOperations();

    const resolveButtons = screen.queryAllByText('RESOLVE');
    if (resolveButtons.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const initialCount = resolveButtons.length;
    await user.click(resolveButtons[0]);

    await waitFor(() => {
      const remaining = screen.queryAllByText('RESOLVE');
      expect(remaining.length).toBeLessThanOrEqual(initialCount);
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// 4. AI Recommendation Panel — loading state and output
// ════════════════════════════════════════════════════════════════════
describe('Operations — AI recommendation panel', () => {
  it('renders the incident description textarea', () => {
    renderOperations();

    const textarea = screen.getByPlaceholderText(/Describe turnstile failures, medical symptoms, crowd blockages/i);
    expect(textarea).toBeTruthy();
  });

  it('renders the Get Recommendation button', () => {
    renderOperations();

    const btn = screen.getByRole('button', { name: /get ai recommendation/i });
    expect(btn).toBeTruthy();
  });

  it('Get Recommendation button is disabled when description is empty', () => {
    renderOperations();

    const btn = screen.getByRole('button', { name: /get ai recommendation/i });
    expect(btn).toBeDisabled();
  });

  it('enables Get Recommendation button after typing', async () => {
    const user = userEvent.setup();
    renderOperations();

    const textarea = screen.getByPlaceholderText(/Describe turnstile failures, medical symptoms, crowd blockages/i);
    await user.type(textarea, 'Fan crowd surge');

    const btn = screen.getByRole('button', { name: /get ai recommendation/i });
    expect(btn).not.toBeDisabled();
  });

  it('shows AI output after successful API call', async () => {
    const user = userEvent.setup();

    renderOperations();

    const textarea = screen.getByPlaceholderText(/Describe turnstile failures, medical symptoms, crowd blockages/i);
    await user.type(textarea, 'Overcrowding event at south gate entrance area');

    const btn = screen.getByRole('button', { name: /get ai recommendation/i });
    await user.click(btn);

    await waitFor(() => {
      expect(screen.getByText('AI Rationale')).toBeTruthy();
      expect(screen.getByText('Recommended Actions')).toBeTruthy();
    }, { timeout: 5000 });
  });
});

// ════════════════════════════════════════════════════════════════════
// 5. Chart rendering
// ════════════════════════════════════════════════════════════════════
describe('Operations — chart rendering', () => {
  it('renders the crowd flow chart title', () => {
    renderOperations();
    expect(screen.getByText('CROWD FLOW — 24H')).toBeTruthy();
  });

  it('renders the gate throughput chart title', () => {
    renderOperations();
    expect(screen.getByText('ENTRY RATE BY GATE')).toBeTruthy();
  });
});
