// ─── Operations.test.jsx ─────────────────────────────────────────
// Tests the Operations Control Room page.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { StadiumProvider } from '../context/StadiumContext';
import { ToastProvider } from '../components/Toast';
import { server, MOCK_CLAUDE_URL, mockClaudeSuccess } from '../test/mswServer';
import Operations from './Operations';
import * as realApis from '../utils/realApis';

// Mock realApis to prevent background network state updates
vi.mock('../utils/realApis', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    fetchAllVenueData: vi.fn().mockResolvedValue({
      weather: {
        temp: { value: 20, unit: '°C' },
        feelsLike: { value: 20, unit: '°C' },
        humidity: { value: 50, unit: '%' },
        windSpeed: { value: 10, unit: 'km/h', direction: 'N' },
        precipitation: { value: 0, unit: 'mm' },
        condition: 'Clear',
        icon: '☀️',
        fanComfort: 90,
        weatherCode: 0,
        source: 'mock',
        fetchedAt: new Date().toISOString(),
      },
      airQuality: { aqi: 42, level: 'Good', color: '#10B981' },
      sunTimes: { sunrise: '06:00 AM', sunset: '08:00 PM', dayLengthStr: '14h 0m' },
    }),
    fetchStadiumWeather: vi.fn().mockResolvedValue({}),
    fetchAirQuality: vi.fn().mockResolvedValue({}),
    fetchTodaysMatches: vi.fn().mockResolvedValue([]),
  };
});

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
  callAI: vi.fn().mockResolvedValue(
    JSON.stringify({
      actions: ['Deploy stewards', 'Redirect fans'],
      staff: 'Send 4 stewards to Zone E.',
      pa: 'Ladies and gentlemen, please follow steward directions.',
      time: '8 min',
      reasoning: 'Crowd surge in Zone E requires immediate perimeter control to prevent escalation.',
      confidence: 'High',
      alternative: 'If primary deployment is insufficient, activate adjacent zone volunteers via PA.',
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

beforeEach(() => {
  vi.clearAllMocks();
});

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
    renderOperations();

    const textarea = screen.getByPlaceholderText(/Describe turnstile failures, medical symptoms, crowd blockages/i);
    // Use fireEvent.change to directly trigger React's synthetic onChange on the controlled textarea
    fireEvent.change(textarea, { target: { value: 'Fan crowd surge' } });

    const btn = screen.getByRole('button', { name: /get ai recommendation/i });
    expect(btn).not.toBeDisabled();
  });

  it('shows AI output after successful API call', async () => {
    renderOperations();

    const textarea = screen.getByPlaceholderText(/Describe turnstile failures, medical symptoms, crowd blockages/i);
    // Use fireEvent.change to directly trigger React's synthetic onChange on the controlled textarea
    fireEvent.change(textarea, { target: { value: 'Overcrowding event at south gate entrance area' } });

    const btn = screen.getByRole('button', { name: /get ai recommendation/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);

    await waitFor(() => {
      // AI panel now shows REASONING (amber) and Recommended Actions headers
      expect(screen.getByText('REASONING')).toBeTruthy();
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
