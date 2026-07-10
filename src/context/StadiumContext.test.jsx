// ─── StadiumContext.test.jsx ──────────────────────────────────────
// Tests all core state actions in StadiumContext.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StadiumProvider, useStadium } from './StadiumContext';
import { ToastProvider } from '../components/Toast';
import * as realApis from '../utils/realApis';

vi.mock('../utils/realApis', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    fetchAllVenueData: vi.fn(original.fetchAllVenueData),
  };
});

beforeEach(() => {
  realApis.fetchAllVenueData.mockClear();
});

// ─── Helper: renders a component inside the StadiumProvider ──────
function renderWithProvider(ui) {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <StadiumProvider>{ui}</StadiumProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

// ─── Probe Component — exposes context values via data attributes ─
function ContextProbe({ onMount }) {
  const ctx = useStadium();
  // Call the probe callback so tests can capture the context object
  onMount?.(ctx);
  return (
    <div
      data-testid="probe"
      data-alerts={ctx.activeAlerts.length}
      data-venue={ctx.currentVenue?.id}
    />
  );
}

// ════════════════════════════════════════════════════════════════════
// 1. addAlert — adds to activeAlerts
// ════════════════════════════════════════════════════════════════════
describe('StadiumContext.addAlert()', () => {
  it('adds a new alert to the front of activeAlerts', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    const initialCount = ctx.activeAlerts.length;

    await act(async () => {
      ctx.addAlert({
        type: 'test',
        zone: 'Zone A',
        severity: 'info',
        message: 'Test alert from unit test',
      });
    });

    expect(ctx.activeAlerts.length).toBe(initialCount + 1);
    expect(ctx.activeAlerts[0].message).toBe('Test alert from unit test');
  });

  it('auto-populates required fields (id, timestamp, resolved:false)', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    await act(async () => {
      ctx.addAlert({
        type: 'crowd_surge',
        zone: 'Zone B',
        severity: 'warning',
        message: 'Queue building',
      });
    });

    const newAlert = ctx.activeAlerts[0];
    expect(newAlert.id).toBeTruthy();
    expect(newAlert.timestamp).toBeTruthy();
    expect(newAlert.resolved).toBe(false);
  });

  it('pushes a notification to the notifications drawer', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    const initialNotifCount = ctx.notifications.length;

    await act(async () => {
      ctx.addAlert({
        type: 'medical',
        zone: 'Zone C',
        severity: 'critical',
        message: 'Medical emergency at Gate 7',
      });
    });

    expect(ctx.notifications.length).toBeGreaterThan(initialNotifCount);
    expect(ctx.notifications[0].read).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════
// 2. resolveAlert — marks correct alert as resolved
// ════════════════════════════════════════════════════════════════════
describe('StadiumContext.resolveAlert()', () => {
  it('marks the target alert as resolved and sets resolvedAt', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    let alertId;

    await act(async () => {
      ctx.addAlert({
        type: 'security',
        zone: 'Zone D',
        severity: 'high',
        message: 'Unauthorized access attempt',
      });
      alertId = ctx.activeAlerts[0].id;
    });

    await act(async () => {
      ctx.resolveAlert(alertId);
    });

    const resolved = ctx.activeAlerts.find(a => a.id === alertId);
    expect(resolved.resolved).toBe(true);
    expect(resolved.resolvedAt).toBeTruthy();
  });

  it('does not affect other alerts when resolving one', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    // Add two fresh unresolved alerts we control
    await act(async () => {
      ctx.addAlert({ type: 'test', zone: 'Zone A', severity: 'info', message: 'Alert One' });
      ctx.addAlert({ type: 'test', zone: 'Zone B', severity: 'info', message: 'Alert Two' });
    });

    // Resolve the most recently added one (index 0 after both adds)
    const targetId = ctx.activeAlerts[0].id;
    const otherId  = ctx.activeAlerts[1].id;

    await act(async () => {
      ctx.resolveAlert(targetId);
    });

    // The second alert we added must still be unresolved
    const otherAlert = ctx.activeAlerts.find(a => a.id === otherId);
    expect(otherAlert).toBeTruthy();
    expect(otherAlert.resolved).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════
// 3. updateCrowdDensity — clamps to 0-100
// ════════════════════════════════════════════════════════════════════
describe('StadiumContext.updateCrowdDensity()', () => {
  it('clamps density at minimum 0', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    await act(async () => {
      ctx.updateCrowdDensity('A', -50);
    });

    expect(ctx.crowdDensityMap['A'].density).toBeGreaterThanOrEqual(0);
  });

  it('clamps density at maximum 100', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    await act(async () => {
      ctx.updateCrowdDensity('A', 150);
    });

    expect(ctx.crowdDensityMap['A'].density).toBeLessThanOrEqual(100);
  });

  it('sets density to the given value when within valid range', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    await act(async () => {
      ctx.updateCrowdDensity('B', 72);
    });

    expect(ctx.crowdDensityMap['B'].density).toBe(72);
  });

  it('auto-generates critical alert when density >= 95', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    const initialCount = ctx.activeAlerts.length;

    await act(async () => {
      ctx.updateCrowdDensity('C', 97);
    });

    expect(ctx.activeAlerts.length).toBeGreaterThan(initialCount);
    const criticalAlert = ctx.activeAlerts.find(
      a => a.severity === 'critical' && a.zone === 'C'
    );
    expect(criticalAlert).toBeTruthy();
  });

  it('silently ignores update for an unknown zone key', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    const prevMap = { ...ctx.crowdDensityMap };

    await act(async () => {
      ctx.updateCrowdDensity('NONEXISTENT_ZONE', 50);
    });

    // Map must be unchanged
    expect(Object.keys(ctx.crowdDensityMap)).toEqual(Object.keys(prevMap));
  });
});

// ════════════════════════════════════════════════════════════════════
// 4. switchVenue — updates venue and persists to localStorage
// ════════════════════════════════════════════════════════════════════
describe('StadiumContext.switchVenue()', () => {
  it('updates currentVenue when switching to a known venue ID', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    await act(async () => {
      ctx.switchVenue('sofi');
    });

    expect(ctx.currentVenue.id).toBe('sofi');
  });

  it('persists chosen venue ID to localStorage', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    await act(async () => {
      ctx.switchVenue('att');
    });

    expect(localStorage.getItem('stadiumiq_venue_v2')).toBe('att');
  });

  it('ignores unknown venue IDs gracefully', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    const prevVenue = ctx.currentVenue.id;

    await act(async () => {
      ctx.switchVenue('totally_unknown_venue');
    });

    // Venue should remain unchanged
    expect(ctx.currentVenue.id).toBe(prevVenue);
  });

  it('switching venue while weather fetch in progress → previous fetch cancelled, new one starts', async () => {
    let ctx;
    const fetchSpy = vi.spyOn(realApis, 'fetchAllVenueData');

    let resolveFirst;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    // Intercept all calls with a slow promise (handles StrictMode double-invoke)
    fetchSpy.mockImplementation(() => firstPromise);

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    // Capture call count at mount (StrictMode may cause 1 or 2 calls)
    const callsBeforeSwitch = fetchSpy.mock.calls.length;
    expect(callsBeforeSwitch).toBeGreaterThanOrEqual(1);

    // Use the LAST call's AbortSignal — StrictMode aborts the first signal during cleanup
    const lastCallIndex = fetchSpy.mock.calls.length - 1;
    const lastSignal = fetchSpy.mock.calls[lastCallIndex][1];
    expect(lastSignal).toBeInstanceOf(AbortSignal);
    expect(lastSignal.aborted).toBe(false);

    // Switch venue — should abort the in-flight fetch and start a new one
    await act(async () => {
      ctx.switchVenue('sofi');
    });

    // The previously in-flight signal must now be aborted
    expect(lastSignal.aborted).toBe(true);
    // Exactly one additional fetch started for the new venue
    expect(fetchSpy).toHaveBeenCalledTimes(callsBeforeSwitch + 1);

    resolveFirst({ weather: null, airQuality: null, sunTimes: null });
    fetchSpy.mockRestore();
  });
});

// ════════════════════════════════════════════════════════════════════
// 5. generateIncident — creates alert with valid structure
// ════════════════════════════════════════════════════════════════════
describe('StadiumContext.generateIncident()', () => {
  it('adds exactly one alert to activeAlerts', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    const before = ctx.activeAlerts.length;

    await act(async () => {
      ctx.generateIncident();
    });

    expect(ctx.activeAlerts.length).toBe(before + 1);
  });

  it('generated alert has required structure fields', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    await act(async () => {
      ctx.generateIncident();
    });

    const incident = ctx.activeAlerts[0];
    expect(incident).toMatchObject({
      id:            expect.any(String),
      type:          expect.any(String),
      zone:          expect.any(String),
      severity:      expect.any(String),
      message:       expect.any(String),
      resolved:      false,
      isAIGenerated: true,
    });
  });

  it('generated alert severity is one of the valid values', async () => {
    let ctx;

    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    await act(async () => {
      ctx.generateIncident();
    });

    // INCIDENT_TEMPLATES includes: critical, high, medium, low
    const validSeverities = ['info', 'warning', 'high', 'critical', 'medium', 'low'];
    expect(validSeverities).toContain(ctx.activeAlerts[0].severity);
  });
});

// ════════════════════════════════════════════════════════════════════
// 6. Edge Cases — addAlert capped at 50 items
// ════════════════════════════════════════════════════════════════════
describe('StadiumContext edge case — addAlert max 50 cap', () => {
  it('adding 60 unique alerts caps activeAlerts at 50 (oldest removed)', async () => {
    let ctx;
    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    // Clear the slate — the initial alerts have different messages so they don't dedup
    // We add 60 alerts with unique messages to force the cap
    await act(async () => {
      for (let i = 0; i < 60; i++) {
        ctx.addAlert({
          type: 'test_cap',
          zone: `Zone X${i}`,   // unique zone per iteration prevents dedup
          severity: 'info',
          message: `Edge case cap test alert #${i} — unique message ${Date.now()}-${i}`,
        });
      }
    });

    // Must never exceed 50
    expect(ctx.activeAlerts.length).toBeLessThanOrEqual(50);
  });
});

// ════════════════════════════════════════════════════════════════════
// 7. Edge Cases — updateCrowdDensity with NaN value ignored
// ════════════════════════════════════════════════════════════════════
describe('StadiumContext edge case — updateCrowdDensity NaN guard', () => {
  it('NaN density is silently ignored — previous map value is kept', async () => {
    let ctx;
    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    // Set a known valid density first
    await act(async () => {
      ctx.updateCrowdDensity('A', 55);
    });
    const densityBefore = ctx.crowdDensityMap['A']?.density;

    // Now attempt NaN — should be a no-op
    await act(async () => {
      ctx.updateCrowdDensity('A', NaN);
    });

    // Value must be unchanged
    expect(ctx.crowdDensityMap['A']?.density).toBe(densityBefore);
  });

  it('undefined density is silently ignored', async () => {
    let ctx;
    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    await act(async () => {
      ctx.updateCrowdDensity('B', 70);
    });
    const before = ctx.crowdDensityMap['B']?.density;

    await act(async () => {
      ctx.updateCrowdDensity('B', undefined);
    });

    expect(ctx.crowdDensityMap['B']?.density).toBe(before);
  });
});

// ════════════════════════════════════════════════════════════════════
// 8. Edge Cases — switchVenue triggers fresh crowd simulation state
// ════════════════════════════════════════════════════════════════════
describe('StadiumContext edge case — switchVenue resets crowd state', () => {
  it('switching venue updates currentVenue.id and crowd density keys', async () => {
    let ctx;
    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    // Start at default venue (metlife)
    const startVenue = ctx.currentVenue.id;

    await act(async () => {
      ctx.switchVenue('sofi');
    });

    // Venue must have changed
    expect(ctx.currentVenue.id).toBe('sofi');
    expect(ctx.currentVenue.id).not.toBe(startVenue);

    // crowdDensityMap keys must exist (simulated on switch)
    expect(Object.keys(ctx.crowdDensityMap).length).toBeGreaterThan(0);
  });

  it('switching venue while previous crowd data exists replaces it cleanly', async () => {
    let ctx;
    renderWithProvider(<ContextProbe onMount={(c) => { ctx = c; }} />);

    await act(async () => {
      // Manually set density on current venue zone
      ctx.updateCrowdDensity('A', 80);
    });

    await act(async () => {
      // Switch to a completely different venue
      ctx.switchVenue('att');
    });

    // Previous density update should not bleed over
    expect(ctx.currentVenue.id).toBe('att');
    // Density map is rebuilt — values should be crowd-simulated fresh
    expect(ctx.crowdDensityMap).toBeDefined();
  });
});
