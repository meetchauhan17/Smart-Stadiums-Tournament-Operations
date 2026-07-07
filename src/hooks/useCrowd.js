import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateCrowdZones,
  generateCrowdTimeline,
  generateHeatmapGrid,
  GATE_THROUGHPUT,
  SECURITY_ALERTS,
  HOURLY_DENSITY,
} from '../data/crowdData';

/**
 * useCrowd — Simulated real-time crowd intelligence hook
 *
 * Polls every `intervalMs` to simulate live crowd data updates.
 *
 * @param {number} baseOccupancy - Base occupancy level 0-1 (default 0.75)
 * @param {number} intervalMs    - Update interval in ms (default 5000)
 */
export function useCrowd(baseOccupancy = 0.75, intervalMs = 5000) {
  const [zones, setZones]         = useState(() => generateCrowdZones(baseOccupancy));
  const [heatmap, setHeatmap]     = useState(() => generateHeatmapGrid(baseOccupancy));
  const [timeline, setTimeline]   = useState(() => generateCrowdTimeline());
  const [gates, setGates]         = useState(GATE_THROUGHPUT);
  const [alerts, setAlerts]       = useState(SECURITY_ALERTS);
  const [hourlyDensity]           = useState(HOURLY_DENSITY);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLive, setIsLive]       = useState(true);
  const intervalRef               = useRef(null);

  const totalCapacity  = zones.reduce((sum, z) => sum + z.capacity, 0);
  const totalCurrent   = zones.reduce((sum, z) => sum + z.current, 0);
  const occupancyRate  = totalCapacity > 0 ? totalCurrent / totalCapacity : 0;
  const criticalZones  = zones.filter(z => z.status === 'critical');
  const activeAlerts   = alerts.filter(a => !a.resolved);

  const refresh = useCallback(() => {
    // Gradually drift occupancy ±3% per tick for realism
    const drift = (Math.random() - 0.5) * 0.06;
    const newBase = Math.max(0.2, Math.min(0.98, baseOccupancy + drift));

    setZones(generateCrowdZones(newBase));
    setHeatmap(generateHeatmapGrid(newBase));

    // Drift gate throughput
    setGates(prev =>
      prev.map(g => ({
        ...g,
        throughput: Math.max(50, g.throughput + Math.floor((Math.random() - 0.5) * 80)),
        waitMin: Math.max(0, g.waitMin + Math.floor((Math.random() - 0.5) * 2)),
      }))
    );

    setLastUpdated(new Date());
  }, [baseOccupancy]);

  useEffect(() => {
    if (!isLive) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(refresh, intervalMs);
    return () => clearInterval(intervalRef.current);
  }, [isLive, intervalMs, refresh]);

  const resolveAlert = useCallback((alertId) => {
    setAlerts(prev =>
      prev.map(a => a.id === alertId ? { ...a, resolved: true } : a)
    );
  }, []);

  const toggleLive = useCallback(() => setIsLive(v => !v), []);

  return {
    zones,
    heatmap,
    timeline,
    gates,
    alerts,
    activeAlerts,
    hourlyDensity,
    totalCapacity,
    totalCurrent,
    occupancyRate,
    criticalZones,
    lastUpdated,
    isLive,
    refresh,
    resolveAlert,
    toggleLive,
  };
}
