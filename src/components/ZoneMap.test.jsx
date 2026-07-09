// ─── ZoneMap.test.jsx ─────────────────────────────────────────────
// Tests the ZoneMap SVG interactive component.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StadiumProvider } from '../context/StadiumContext';
import { ToastProvider } from '../components/Toast';
import { BrowserRouter } from 'react-router-dom';
import ZoneMap from './ZoneMap';

// ─── Helper ──────────────────────────────────────────────────────
function renderZoneMap(props = {}) {
  const defaultProps = {
    selectedZoneId: 'E',
    onZoneSelect: vi.fn(),
    ...props,
  };
  return {
    ...render(
      <BrowserRouter>
        <ToastProvider>
          <StadiumProvider>
            <ZoneMap {...defaultProps} />
          </StadiumProvider>
        </ToastProvider>
      </BrowserRouter>
    ),
    onZoneSelect: defaultProps.onZoneSelect,
  };
}

// ════════════════════════════════════════════════════════════════════
// 1. Zone rendering
// ════════════════════════════════════════════════════════════════════
describe('ZoneMap — zone rendering', () => {
  it('renders all 8 primary letter zones (A-H)', () => {
    renderZoneMap();

    // Each zone `<g>` has aria-label="Zone X. Density: ..."
    const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    zones.forEach(zone => {
      const el = screen.getByRole('button', { name: new RegExp(`Zone ${zone}`, 'i') });
      expect(el).toBeTruthy();
    });
  });

  it('renders VIP and MEDIA zones', () => {
    renderZoneMap();

    expect(screen.getByRole('button', { name: /Zone VIP/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Zone MEDIA/i })).toBeTruthy();
  });

  it('renders the interactive map container', () => {
    renderZoneMap();
    const map = screen.getByRole('generic', { name: /Stadium Interactive Map/i });
    expect(map).toBeTruthy();
  });

  it('renders the density color legend', () => {
    renderZoneMap();
    // Legend has 5 density range labels
    expect(screen.getByText('<45%')).toBeTruthy();
    expect(screen.getByText('>90%')).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════════════
// 2. Click interaction
// ════════════════════════════════════════════════════════════════════
describe('ZoneMap — click interaction', () => {
  it('calls onZoneSelect with the correct zone ID when clicking Zone A', async () => {
    const user = userEvent.setup();
    const { onZoneSelect } = renderZoneMap({ selectedZoneId: 'B' });

    const zoneA = screen.getByRole('button', { name: /Zone A/i });
    await user.click(zoneA);

    expect(onZoneSelect).toHaveBeenCalledWith('A');
  });

  it('calls onZoneSelect with "B" when clicking Zone B', async () => {
    const user = userEvent.setup();
    const { onZoneSelect } = renderZoneMap();

    const zoneB = screen.getByRole('button', { name: /Zone B/i });
    await user.click(zoneB);

    expect(onZoneSelect).toHaveBeenCalledWith('B');
  });

  it('calls onZoneSelect with "VIP" when clicking VIP zone', async () => {
    const user = userEvent.setup();
    const { onZoneSelect } = renderZoneMap();

    const vip = screen.getByRole('button', { name: /Zone VIP/i });
    await user.click(vip);

    expect(onZoneSelect).toHaveBeenCalledWith('VIP');
  });
});

// ════════════════════════════════════════════════════════════════════
// 3. aria-pressed reflects selected state
// ════════════════════════════════════════════════════════════════════
describe('ZoneMap — selected zone accessibility', () => {
  it('sets aria-pressed="true" on the currently selected zone', () => {
    renderZoneMap({ selectedZoneId: 'C' });

    const zoneC = screen.getByRole('button', { name: /Zone C/i });
    expect(zoneC).toHaveAttribute('aria-pressed', 'true');
  });

  it('sets aria-pressed="false" on non-selected zones', () => {
    renderZoneMap({ selectedZoneId: 'C' });

    const zoneA = screen.getByRole('button', { name: /Zone A/i });
    expect(zoneA).toHaveAttribute('aria-pressed', 'false');
  });
});

// ════════════════════════════════════════════════════════════════════
// 4. Keyboard navigation — arrow keys cycle zones
// ════════════════════════════════════════════════════════════════════
describe('ZoneMap — keyboard navigation', () => {
  it('ArrowRight moves selection forward to the next zone in sequence', async () => {
    const user = userEvent.setup();
    const { onZoneSelect } = renderZoneMap({ selectedZoneId: 'A' });

    const container = screen.getByRole('generic', { name: /Stadium Interactive Map/i });
    container.focus();

    await user.keyboard('{ArrowRight}');

    // A is index 0, so ArrowRight should go to B (index 1)
    expect(onZoneSelect).toHaveBeenCalledWith('B');
  });

  it('ArrowLeft moves selection backward to the previous zone', async () => {
    const user = userEvent.setup();
    const { onZoneSelect } = renderZoneMap({ selectedZoneId: 'C' });

    const container = screen.getByRole('generic', { name: /Stadium Interactive Map/i });
    container.focus();

    await user.keyboard('{ArrowLeft}');

    // C is index 2, so ArrowLeft should go to B (index 1)
    expect(onZoneSelect).toHaveBeenCalledWith('B');
  });

  it('ArrowRight from last zone wraps around to first zone', async () => {
    const user = userEvent.setup();
    // MEDIA is the last zone in ZONES_ORDER
    const { onZoneSelect } = renderZoneMap({ selectedZoneId: 'MEDIA' });

    const container = screen.getByRole('generic', { name: /Stadium Interactive Map/i });
    container.focus();

    await user.keyboard('{ArrowRight}');

    // Should wrap to first zone: 'A'
    expect(onZoneSelect).toHaveBeenCalledWith('A');
  });

  it('ArrowDown moves forward (same as ArrowRight)', async () => {
    const user = userEvent.setup();
    const { onZoneSelect } = renderZoneMap({ selectedZoneId: 'A' });

    const container = screen.getByRole('generic', { name: /Stadium Interactive Map/i });
    container.focus();

    await user.keyboard('{ArrowDown}');

    expect(onZoneSelect).toHaveBeenCalledWith('B');
  });
});
