import { useEffect, useRef } from 'react';
import { useStadium } from '../context/StadiumContext';
import { useToast } from '../components/Toast';

// ─── Alert Pools for simulation ──────────────────────────────────
const ALERT_POOL = [
  {
    type: 'crowd_surge',
    message: 'High density in Zone C — recommend redirect',
    suggestedAction: 'Deploy 2 stewards to Section C concourse entry. Adjust PA flow announcements.',
  },
  {
    type: 'medical',
    message: 'Medical team needed Gate 7 — spectator reporting shortness of breath',
    suggestedAction: 'Dispatch Medical Unit 4. Hold Gate 7 elevator for emergency transport.',
  },
  {
    type: 'concession_queue',
    message: 'Queue forming at Concession Stand 14 — wait time > 15 minutes',
    suggestedAction: 'Notify concession coordinator. Suggest redirection to Stand 15 (2 min wait).',
  },
  {
    type: 'weather',
    message: 'Weather alert: wind increasing — speeds exceeding 45 km/h on upper deck',
    suggestedAction: 'Advise fans in upper sections to secure loose items. Monitor roof canopy.',
  },
  {
    type: 'security',
    message: 'VIP arrival at Gate 1 — clear path and secure main reception corridor',
    suggestedAction: 'Deploy escort detail. Steward team to restrict unauthorized concourse access.',
  },
  {
    type: 'infrastructure',
    message: 'LED Screen West reporting minor pixel latency issue',
    suggestedAction: 'IT operations dispatched for soft calibration. No game display impact.',
  },
];

/**
 * useLiveData — Top-level simulation hook.
 * Automatically runs all live stadium updates when context's isLiveMode is true.
 * Speed is accelerated significantly when matchDayMode is enabled.
 */
export function useLiveData() {
  const {
    isLiveMode,
    matchDayMode,
    matchPhase,
    crowdDensityMap,
    activeAlerts,
    staffOnDuty,
    sustainabilityMetrics,
    fanSatisfactionScore,
    weatherData,

    // State setters
    setCrowdDensityMap,
    setActiveAlerts,
    setStaffOnDuty,
    setSustainabilityMetrics,
    setFanSatisfactionScore,
    setWeatherData,
    setCurrentOccupancy,
    setNotifications,

    // Actions
    addAlert,
    resolveAlert,
    updateCrowdDensity,
  } = useStadium();

  const toast = useToast();

  // Store refs to keep track of active timeouts for auto-resolution of alerts
  const autoResolveTimeouts = useRef({});

  const staffRef = useRef(staffOnDuty);
  const alertsRef = useRef(activeAlerts);

  useEffect(() => {
    staffRef.current = staffOnDuty;
  }, [staffOnDuty]);

  useEffect(() => {
    alertsRef.current = activeAlerts;
  }, [activeAlerts]);



  // ═══════════════════════════════════════════════════════════════════
  //  2. ALERT GENERATION & AUTO-RESOLUTION
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isLiveMode) return;

    let timerId;

    const triggerNextAlertCycle = () => {
      // Gate incident alerts: No alerts if there is no match or the match is concluded
      const isMatchActive = matchPhase !== 'no-match' && matchPhase !== 'post-match-done';
      if (!isMatchActive) {
        // Try again in 30 seconds to see if a match starts
        timerId = setTimeout(triggerNextAlertCycle, 30000);
        return;
      }

      // 30% chance of generating a new alert (higher in match day mode)
      const triggerChance = matchDayMode ? 0.45 : 0.3;
      if (Math.random() < triggerChance) {
        const template = ALERT_POOL[Math.floor(Math.random() * ALERT_POOL.length)];
        
        const rand = Math.random();
        let severity = 'info';
        if (rand > 0.9) severity = 'critical';
        else if (rand > 0.6) severity = 'warning';

        const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H'];
        const zone = zones[Math.floor(Math.random() * zones.length)];

        const newAlertId = `alert-${Date.now()}`;
        const newAlert = {
          id: newAlertId,
          type: template.type,
          zone,
          severity,
          message: `${template.message} in ${zone}`,
          suggestedAction: template.suggestedAction,
          timestamp: new Date().toISOString(),
          resolved: false,
          isAIGenerated: Math.random() > 0.5,
        };

        // Inject new alert into state
        setActiveAlerts(prev => [newAlert, ...prev]);

        // Push alert notification to Drawer list
        setNotifications(prev => [
          {
            id: `n-${newAlertId}`,
            read: false,
            type: severity === 'critical' ? 'critical' : severity === 'warning' ? 'warning' : 'info',
            message: newAlert.message,
            time: new Date(),
          },
          ...prev,
        ]);

        // Toast on new alert
        toast.warning(newAlert.message, `NEW ${severity.toUpperCase()} INCIDENT`);

        // Auto-resolve delay: 30s to 50s in Match Day Mode, 3m to 5m normally
        const autoResolveDelay = matchDayMode
          ? Math.floor(Math.random() * 20000) + 30000
          : Math.floor(Math.random() * 120000) + 180000;
        
        autoResolveTimeouts.current[newAlertId] = setTimeout(() => {
          const currentAlerts = alertsRef.current;
          const match = currentAlerts.find(a => a.id === newAlertId);
          if (match && !match.resolved) {
            toast.success(match.message, "INCIDENT RESOLVED");
            setActiveAlerts(prev => prev.map(a =>
              a.id === newAlertId
                ? { ...a, resolved: true, responseTime: `${(autoResolveDelay / 60000).toFixed(1)} min (Auto)` }
                : a
            ));
          }
          delete autoResolveTimeouts.current[newAlertId];
        }, autoResolveDelay);
      }

      // Next tick: 8s to 15s in Match Day Mode, 45s to 90s normally
      const nextDelay = matchDayMode
        ? Math.floor(Math.random() * 7000) + 8000
        : Math.floor(Math.random() * 45000) + 45000;
      timerId = setTimeout(triggerNextAlertCycle, nextDelay);
    };

    // Schedule initial run
    const initialDelay = matchDayMode ? 4000 : 45000;
    timerId = setTimeout(triggerNextAlertCycle, initialDelay);

    return () => {
      clearTimeout(timerId);
      Object.values(autoResolveTimeouts.current).forEach(clearTimeout);
    };
  }, [isLiveMode, matchDayMode, matchPhase, setActiveAlerts, setNotifications]);

  // ═══════════════════════════════════════════════════════════════════
  //  3. STAFF STATUS SIMULATION
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isLiveMode) return;

    const staffInterval = matchDayMode ? 6000 : 30000;

    const interval = setInterval(() => {
      const allStaff = staffRef.current;
      // Filter out off-shift staff members — we only simulate active / on-break members
      const activeStaffList = allStaff.filter(s => s.status !== 'off-shift' && s.status !== 'standby');
      if (activeStaffList.length === 0) return;

      const maxOnBreak = Math.floor(activeStaffList.length * 0.25);
      const currentOnBreak = activeStaffList.filter((s) => s.status === 'break').length;

      const randIdx = Math.floor(Math.random() * activeStaffList.length);
      const targetStaff = activeStaffList[randIdx];

      // Find the index in the original full staff array
      const fullIdx = allStaff.findIndex(s => s.id === targetStaff.id);
      if (fullIdx === -1) return;

      const next = [...allStaff];
      let updatedName = "";
      let updatedStatus = "";

      if (targetStaff.status === 'break') {
        next[fullIdx] = {
          ...targetStaff,
          status: 'active',
          lastUpdate: new Date().toISOString(),
        };
        updatedName = targetStaff.name;
        updatedStatus = 'Active';
      } else if (targetStaff.status === 'active' && currentOnBreak < maxOnBreak) {
        next[fullIdx] = {
          ...targetStaff,
          status: 'break',
          lastUpdate: new Date().toISOString(),
        };
        updatedName = targetStaff.name;
        updatedStatus = 'On Break';
      }

      if (updatedName) {
        toast.info(`${updatedName} is now ${updatedStatus}`, "STAFF STATUS CHANGED");
        setStaffOnDuty(next);
      }
    }, staffInterval);

    return () => clearInterval(interval);
  }, [isLiveMode, matchDayMode, setStaffOnDuty]);

  // ═══════════════════════════════════════════════════════════════════
  //  4. SUSTAINABILITY METRICS SIMULATION
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isLiveMode) return;

    const sustainabilityInterval = matchDayMode ? 10000 : 60000;

    const interval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const isMatchActive = matchPhase !== 'no-match' && matchPhase !== 'post-match-done';

      setSustainabilityMetrics((prev) => {
        const next = { ...prev };

        // 1. Solar generated depends on sun/hour, not matches
        let solarFactor = 0;
        if (hour >= 6 && hour < 18) {
          solarFactor = Math.sin(((hour - 6) / 12) * Math.PI);
        }
        const solarFluctuation = (Math.random() - 0.5) * 80;
        const maxSolarCapacity = 2200;
        const nextSolar = Math.max(0, Math.round(maxSolarCapacity * solarFactor + solarFluctuation));
        next.solarGenerated = { ...next.solarGenerated, value: nextSolar };

        // 2. Energy used scales significantly if a match is active vs empty stadium
        if (isMatchActive) {
          const energyDelta = Math.floor((Math.random() - 0.2) * 50);
          next.energyUsed = { ...next.energyUsed, value: Math.max(1000, next.energyUsed.value + energyDelta) };
        } else {
          // Idle baseline power consumption (under 150 kWh baseline fluctuate slightly)
          const baseEnergy = 120 + Math.floor((Math.random() - 0.5) * 10);
          next.energyUsed = { ...next.energyUsed, value: baseEnergy };
        }

        // 3. Water saved / consumed scales similarly
        if (isMatchActive) {
          const waterDelta = Math.floor(Math.random() * 200) + 100;
          next.waterSaved = { ...next.waterSaved, value: next.waterSaved.value + waterDelta };
        } else {
          // Off-match baseline: small baseline maintenance water use
          const waterDelta = Math.floor(Math.random() * 5);
          next.waterSaved = { ...next.waterSaved, value: next.waterSaved.value + waterDelta };
        }

        return next;
      });
    }, sustainabilityInterval);

    return () => clearInterval(interval);
  }, [isLiveMode, matchDayMode, matchPhase, setSustainabilityMetrics]);

  // ═══════════════════════════════════════════════════════════════════
  //  5. FAN SATISFACTION SIMULATION
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isLiveMode) return;

    const fanInterval = matchDayMode ? 20000 : 120000;

    const interval = setInterval(() => {
      // If no match is happening, fan satisfaction score remains stable/idle at baseline
      const isMatchActive = matchPhase !== 'no-match' && matchPhase !== 'post-match-done';
      if (!isMatchActive) {
        setFanSatisfactionScore(92); // baseline satisfaction when empty
        return;
      }

      const criticalCount = activeAlerts.filter(a => a.severity === 'critical' && !a.resolved).length;
      
      setFanSatisfactionScore((prev) => {
        let delta = (Math.random() - 0.5) * 4;

        if (criticalCount > 0) {
          delta -= (criticalCount * 3.5);
        } else {
          delta += 0.8;
        }

        const nextScore = Math.max(40, Math.min(100, Math.round(prev + delta)));
        return nextScore;
      });
    }, fanInterval);

    return () => clearInterval(interval);
  }, [isLiveMode, matchDayMode, matchPhase, activeAlerts, setFanSatisfactionScore]);

  // ═══════════════════════════════════════════════════════════════════
  //  6. WEATHER CONDITIONS SIMULATION (Every 5 minutes)
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isLiveMode) return;

    const weatherInterval = matchDayMode ? 30000 : 300000;

    const interval = setInterval(() => {
      setWeatherData((prev) => {
        const next = { ...prev };

        // Safely read temp — real API returns a plain number, mock returns { value, unit }
        const currentTemp = typeof next.temp === 'number' ? next.temp : (next.temp?.value ?? 22);
        const currentWind = typeof next.windSpeed === 'number' ? next.windSpeed : (next.windSpeed?.value ?? 15);

        const tempDelta = (Math.random() - 0.5) * 2;
        const nextTemp  = parseFloat((currentTemp + tempDelta).toFixed(1));

        const windDelta = Math.floor((Math.random() - 0.5) * 4);
        const nextWind  = Math.max(0, Math.min(70, currentWind + windDelta));

        // Preserve the original shape (object or flat number)
        const tempOut  = typeof next.temp === 'number'      ? nextTemp : { ...next.temp,      value: nextTemp };
        const windOut  = typeof next.windSpeed === 'number'  ? nextWind : { ...next.windSpeed,  value: nextWind };

        return { ...next, temp: tempOut, windSpeed: windOut };
      });
    }, weatherInterval);


    return () => clearInterval(interval);
  }, [isLiveMode, matchDayMode, setWeatherData]);

  return null;
}

export default useLiveData;
