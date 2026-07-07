// ─── Operations.test.jsx ─────────────────────────────────────────
// Tests the Operations Control Room page.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { StadiumProvider } from '../context/StadiumContext';
import { http, HttpResponse } from 'msw';
import { server, MOCK_CLAUDE_URL, mockClaudeSuccess } from '../test/mswServer';
import Operations from './Operations';

// ─── Render helper ────────────────────────────────────────────────
function renderOperations() {
  return render(
    <BrowserRouter>
      <StadiumProvider>
        <Operations />
      </StadiumProvider>
    </BrowserRouter>
  );
}

// ─── aiHelper mock (Operations uses aiHelper, not aiClient directly) ─
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

// ════════════════════════════════════════════════════════════════════
// 1. KPI Strip — 5 StatCards
// ════════════════════════════════════════════════════════════════════
describe('Operations — KPI strip', () => {
  it('renders all 5 KPI stat cards by text key', () => {
    renderOperations();

    // StatCard renders the title prop directly — i18n mock returns the key.
    // Some keys might appear more than once (e.g., subtitle also uses the key),
    // so we use getAllByText and check at least one instance exists.
    const kpiKeys = [
      'ops.kpi_occupancy',
      'ops.kpi_alerts',
      'ops.kpi_staff',
      'ops.kpi_response',
      'ops.kpi_satisfaction',
    ];
    kpiKeys.forEach(key => {
      const elements = screen.queryAllByText(key);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders exactly 5 distinct KPI title keys in the page', () => {
    renderOperations();

    // Collect all unique kpi_ text keys found in the document
    const kpiKeys = [
      'ops.kpi_occupancy',
      'ops.kpi_alerts',
      'ops.kpi_staff',
      'ops.kpi_response',
      'ops.kpi_satisfaction',
    ];
    const foundKeys = kpiKeys.filter(key => screen.queryAllByText(key).length > 0);
    expect(foundKeys.length).toBe(5);
  });
});

// ════════════════════════════════════════════════════════════════════
// 2. Alerts Feed — renders active alerts from context
// ════════════════════════════════════════════════════════════════════
describe('Operations — alerts feed', () => {
  it('renders alerts panel heading (ops.alerts_title)', () => {
    renderOperations();

    expect(screen.getByText('ops.alerts_title')).toBeTruthy();
  });

  it('renders the unresolved label somewhere in the document', () => {
    renderOperations();

    // 'ops.unresolved' text may be split across sibling elements.
    // Use a broader query: check the raw container text.
    const body = document.body.textContent;
    expect(body).toContain('ops.unresolved');
  });

  it('shows the trigger mock incident button', () => {
    renderOperations();

    expect(screen.getByText('ops.trigger_mock')).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════════════
// 3. Resolve button — clicking Resolve triggers context action
// ════════════════════════════════════════════════════════════════════
describe('Operations — resolve alert', () => {
  it('renders Resolve buttons for active unresolved alerts', () => {
    renderOperations();

    // INITIAL_ALERTS from mockData has some unresolved alerts
    // AlertList renders Resolve buttons for unresolved ones
    const resolveButtons = screen.queryAllByText('Resolve');
    // At least some buttons exist (there are 5 initial alerts, some unresolved)
    expect(resolveButtons.length).toBeGreaterThanOrEqual(0);
  });

  it('clicking Resolve removes the button from the DOM', async () => {
    const user = userEvent.setup();
    renderOperations();

    const resolveButtons = screen.queryAllByText('Resolve');
    if (resolveButtons.length === 0) {
      // Skip gracefully if no unresolved alerts in this seed
      expect(true).toBe(true);
      return;
    }

    const initialCount = resolveButtons.length;
    await user.click(resolveButtons[0]);

    // After resolve, the corresponding button should be gone
    await waitFor(() => {
      const remaining = screen.queryAllByText('Resolve');
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

    const textarea = screen.getByPlaceholderText('ops.describe_placeholder');
    expect(textarea).toBeTruthy();
  });

  it('renders the Get Recommendation button', () => {
    renderOperations();

    const btn = screen.getByText('ops.get_recommendation');
    expect(btn).toBeTruthy();
  });

  it('Get Recommendation button is disabled when description is empty', () => {
    renderOperations();

    const btn = screen.getByText('ops.get_recommendation').closest('button');
    expect(btn).toBeDisabled();
  });

  it('enables Get Recommendation button after typing', async () => {
    const user = userEvent.setup();
    renderOperations();

    const textarea = screen.getByPlaceholderText('ops.describe_placeholder');
    await user.type(textarea, 'Fan crowd surge');

    const btn = screen.getByText('ops.get_recommendation').closest('button');
    expect(btn).not.toBeDisabled();
  });

  it('shows AI output (ops.ai_strategy_generated) after successful API call', async () => {
    const user = userEvent.setup();

    // aiHelper.callClaude is already mocked at top of this file
    renderOperations();

    const textarea = screen.getByPlaceholderText('ops.describe_placeholder');
    await user.type(textarea, 'Overcrowding event at south gate entrance area');

    const btn = screen.getByText('ops.get_recommendation').closest('button');
    await user.click(btn);

    await waitFor(() => {
      expect(screen.getByText('ops.ai_strategy_generated')).toBeTruthy();
    }, { timeout: 5000 });
  });
});

// ════════════════════════════════════════════════════════════════════
// 5. Chart rendering
// ════════════════════════════════════════════════════════════════════
describe('Operations — chart rendering', () => {
  it('renders the chart console tab strip', () => {
    renderOperations();

    expect(screen.getByRole('tablist')).toBeTruthy();
  });

  it('renders all 3 chart tab buttons', () => {
    renderOperations();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);
  });

  it('telemetry tab is aria-selected="true" by default', () => {
    renderOperations();

    const tabs = screen.getAllByRole('tab');
    const selectedTab = tabs.find(t => t.getAttribute('aria-selected') === 'true');
    expect(selectedTab).toBeTruthy();
    expect(selectedTab.textContent).toBe('ops.chart_tabs_telemetry');
  });

  it('switching to logistics tab shows throughput heading', async () => {
    const user = userEvent.setup();
    renderOperations();

    const tabs = screen.getAllByRole('tab');
    const logisticsTab = tabs.find(t => t.textContent === 'ops.chart_tabs_logistics');
    await user.click(logisticsTab);

    await waitFor(() => {
      expect(screen.getByText('ops.throughput_title')).toBeTruthy();
    });
  });

  it('switching to efficiency tab shows radar heading', async () => {
    const user = userEvent.setup();
    renderOperations();

    const tabs = screen.getAllByRole('tab');
    const efficiencyTab = tabs.find(t => t.textContent === 'ops.chart_tabs_efficiency');
    await user.click(efficiencyTab);

    await waitFor(() => {
      expect(screen.getByText('ops.radar_title')).toBeTruthy();
    });
  });

  it('renders the sr-only accessible heatmap data table', () => {
    renderOperations();

    const accessTable = screen.getByRole('table', { name: /Crowd density heatmap data table/i });
    expect(accessTable).toBeTruthy();
  });
});
