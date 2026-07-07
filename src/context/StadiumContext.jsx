import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';

import {
  VENUES,
  STAFF_MEMBERS,
  MATCH_SCHEDULE,
  INITIAL_CROWD_DENSITY,
  INITIAL_ALERTS,
  SUSTAINABILITY_METRICS,
  WEATHER_DATA,
  FAN_SATISFACTION_BREAKDOWN,
  INCIDENT_TEMPLATES,
  LIVE_TICKER_ITEMS,
  CROWD_FLOW_24H,
  SUSTAINABILITY_30_DAYS,
  FAN_MESSAGES,
} from '../data/mockData';

// ─── Context ──────────────────────────────────────────────────────
const StadiumContext = createContext(null);

// ─── Constants ────────────────────────────────────────────────────
const DEFAULT_VENUE_ID = 'metlife';
const OCCUPANCY_BY_VENUE = { metlife: 67420, sofi: 54180, att: 62300 };
const LS_VENUE_KEY       = 'stadiumiq_venue_v2';
const LS_LANG_KEY        = 'stadiumiq_lang';
const LS_API_KEY         = 'stadiumiq_claude_key';

// ─── Helpers ──────────────────────────────────────────────────────
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

let alertIdCounter = INITIAL_ALERTS.length + 1;
const nextAlertId  = () => `alert-${String(++alertIdCounter).padStart(3, '0')}`;

// ─── Provider ─────────────────────────────────────────────────────
export function StadiumProvider({ children }) {

  // ── Venue & Occupancy ──────────────────────────────────────────
  const [currentVenueId, setCurrentVenueId] = useState(
    () => localStorage.getItem(LS_VENUE_KEY) || DEFAULT_VENUE_ID
  );
  const [currentOccupancy, setCurrentOccupancy] = useState(
    () => OCCUPANCY_BY_VENUE[localStorage.getItem(LS_VENUE_KEY) || DEFAULT_VENUE_ID]
  );

  // ── Crowd Density ──────────────────────────────────────────────
  const [crowdDensityMap, setCrowdDensityMap] = useState(INITIAL_CROWD_DENSITY);

  // ── Alerts ─────────────────────────────────────────────────────
  const [activeAlerts, setActiveAlerts] = useState(INITIAL_ALERTS);

  // ── Staff ──────────────────────────────────────────────────────
  const [staffOnDuty, setStaffOnDuty] = useState(STAFF_MEMBERS);

  // ── Match Schedule ─────────────────────────────────────────────
  const [matchSchedule] = useState(MATCH_SCHEDULE);

  // ── Sustainability ─────────────────────────────────────────────
  const [sustainabilityMetrics, setSustainabilityMetrics] = useState(SUSTAINABILITY_METRICS);

  // ── Fan Satisfaction ───────────────────────────────────────────
  const [fanSatisfactionScore, setFanSatisfactionScore] = useState(
    FAN_SATISFACTION_BREAKDOWN.overall
  );
  const [satisfactionBreakdown, setSatisfactionBreakdown] = useState(FAN_SATISFACTION_BREAKDOWN);

  // ── Weather ────────────────────────────────────────────────────
  const [weatherData, setWeatherData] = useState(WEATHER_DATA);

  // ── UI State ───────────────────────────────────────────────────
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [aiPanelOpen,  setAiPanelOpen]  = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLiveMode,   setIsLiveMode]   = useState(true);
  const [matchDayMode, setMatchDayMode] = useState(false);

  // ── API Key ────────────────────────────────────────────────────
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(LS_API_KEY) || ''
  );

  // ── Notification Drawer ────────────────────────────────────────
  const [notifications, setNotifications] = useState([
    {
      id: 'n1', read: false, type: 'critical',
      message: 'Zone E crowd density at 94% — steward deployment triggered',
      time: new Date(Date.now() - 4 * 60000),
    },
    {
      id: 'n2', read: false, type: 'warning',
      message: 'Medical team responding to Section 14, Row G',
      time: new Date(Date.now() - 9 * 60000),
    },
    {
      id: 'n3', read: true, type: 'info',
      message: 'Solar generation target: 92% achieved today',
      time: new Date(Date.now() - 25 * 60000),
    },
    {
      id: 'n4', read: true, type: 'success',
      message: 'Gate D throughput normalized — all lanes operational',
      time: new Date(Date.now() - 48 * 60000),
    },
  ]);

  // ─── Derived State ─────────────────────────────────────────────
  const currentVenue        = useMemo(() => VENUES[currentVenueId] || VENUES[DEFAULT_VENUE_ID], [currentVenueId]);
  const venueCapacity        = currentVenue.capacity;
  const occupancyPercent     = useMemo(() => Math.round((currentOccupancy / venueCapacity) * 100), [currentOccupancy, venueCapacity]);
  const unresolvedAlerts     = useMemo(() => activeAlerts.filter(a => !a.resolved), [activeAlerts]);
  const criticalAlerts       = useMemo(() => unresolvedAlerts.filter(a => a.severity === 'critical'), [unresolvedAlerts]);
  const unreadNotifications  = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const staffByRole = useMemo(() => {
    return staffOnDuty.reduce((acc, s) => {
      acc[s.role] = (acc[s.role] || []).concat(s);
      return acc;
    }, {});
  }, [staffOnDuty]);

  const staffByStatus = useMemo(() => {
    return staffOnDuty.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || []).concat(s);
      return acc;
    }, {});
  }, [staffOnDuty]);

  const currentMatchAtVenue  = useMemo(
    () => matchSchedule.find(m => m.venueId === currentVenueId) || matchSchedule[0],
    [matchSchedule, currentVenueId]
  );

  // ─── Actions ───────────────────────────────────────────────────

  /** Switch active venue; persists to localStorage */
  const switchVenue = useCallback((venueId) => {
    if (!VENUES[venueId]) return;
    setCurrentVenueId(venueId);
    setCurrentOccupancy(OCCUPANCY_BY_VENUE[venueId] || 60000);
    localStorage.setItem(LS_VENUE_KEY, venueId);

    // Regenerate density map with slight variation for new venue
    setCrowdDensityMap(prev => {
      const updated = {};
      Object.entries(prev).forEach(([zone, data]) => {
        const shift = (Math.random() - 0.5) * 20;
        const newDensity = Math.max(10, Math.min(99, data.density + shift));
        updated[zone] = {
          ...data,
          density: Math.round(newDensity),
          current: Math.round(data.capacity * (newDensity / 100)),
        };
      });
      return updated;
    });
  }, []);

  /** Add a new alert to the stack */
  const addAlert = useCallback((alert) => {
    const newAlert = {
      id: nextAlertId(),
      timestamp: new Date().toISOString(),
      resolved: false,
      responseTime: null,
      assignedTo: null,
      suggestedAction: 'Assess situation and dispatch appropriate personnel.',
      ...alert,
    };

    setActiveAlerts(prev => [newAlert, ...prev]);

    // Also push to notification drawer
    setNotifications(prev => [{
      id: `n${Date.now()}`,
      read: false,
      type: alert.severity === 'critical' ? 'critical'
          : alert.severity === 'high'     ? 'warning'
          : 'info',
      message: alert.message,
      time: new Date(),
    }, ...prev]);
  }, []);

  /** Mark an alert as resolved */
  const resolveAlert = useCallback((id) => {
    setActiveAlerts(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, resolved: true, resolvedAt: new Date().toISOString() }
          : a
      )
    );
  }, []);

  /** Dismiss (delete) an alert entirely */
  const dismissAlert = useCallback((id) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  /** Update crowd density for a specific zone */
  const updateCrowdDensity = useCallback((zone, value) => {
    setCrowdDensityMap(prev => {
      if (!prev[zone]) return prev;
      const clampedDensity = Math.max(0, Math.min(100, value));
      const newCurrent     = Math.round(prev[zone].capacity * (clampedDensity / 100));
      return {
        ...prev,
        [zone]: {
          ...prev[zone],
          density: clampedDensity,
          current: newCurrent,
        },
      };
    });

    // Auto-generate alert if density crosses critical threshold
    if (value >= 95) {
      addAlert({
        type: 'crowd_surge',
        zone,
        severity: 'critical',
        message: `Zone ${zone} density has reached ${value}% — critical overcrowding threshold exceeded.`,
        suggestedAction: `Deploy 3 stewards to Zone ${zone} immediately. Consider redirecting incoming fans.`,
      });
    } else if (value >= 90) {
      addAlert({
        type: 'crowd_surge',
        zone,
        severity: 'high',
        message: `Zone ${zone} density at ${value}% — approaching critical threshold.`,
        suggestedAction: `Increase monitoring of Zone ${zone}. Pre-position stewards at entry points.`,
      });
    }
  }, [addAlert]);

  /** Update a staff member's status */
  const updateStaffStatus = useCallback((staffId, status) => {
    setStaffOnDuty(prev =>
      prev.map(s =>
        s.id === staffId
          ? { ...s, status, lastUpdate: new Date().toISOString() }
          : s
      )
    );
  }, []);

  /** Reassign a staff member to a different zone */
  const reassignStaff = useCallback((staffId, newZone) => {
    setStaffOnDuty(prev =>
      prev.map(s =>
        s.id === staffId
          ? { ...s, zone: newZone, lastUpdate: new Date().toISOString() }
          : s
      )
    );
  }, []);

  /** Randomly generate a realistic incident alert */
  const generateIncident = useCallback(() => {
    const template = pickRandom(INCIDENT_TEMPLATES);
    const zone     = pickRandom(template.zonePool);

    addAlert({
      type:             template.type,
      zone,
      severity:         template.severity,
      message:          template.messageTemplate(zone),
      suggestedAction:  'AI recommendation: Dispatch nearest available staff. Monitor situation.',
      isAIGenerated:    true,
    });
  }, [addAlert]);

  /** Update sustainability metrics (partial update) */
  const updateSustainabilityMetric = useCallback((key, newValue) => {
    setSustainabilityMetrics(prev => ({
      ...prev,
      [key]: { ...prev[key], value: newValue },
    }));
  }, []);

  /** Update fan satisfaction score */
  const updateFanSatisfaction = useCallback((category, score) => {
    if (category === 'overall') {
      setFanSatisfactionScore(score);
    } else {
      setSatisfactionBreakdown(prev => ({ ...prev, [category]: score }));
      // Recalculate overall as average
      setSatisfactionBreakdown(prev => {
        const vals = Object.values({ ...prev, [category]: score });
        const avg  = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
        setFanSatisfactionScore(avg);
        return { ...prev, [category]: score };
      });
    }
  }, []);

  /** Notification actions */
  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /** Save Claude API key */
  const saveApiKey = useCallback((key) => {
    setApiKey(key);
    localStorage.setItem(LS_API_KEY, key.trim());
  }, []);

  /** Toggle UI panels */
  const toggleSidebar  = useCallback(() => setSidebarOpen(v => !v), []);
  const toggleAiPanel  = useCallback(() => setAiPanelOpen(v => !v), []);
  const toggleSettings = useCallback(() => setSettingsOpen(v => !v), []);
  const toggleLiveMode = useCallback(() => setIsLiveMode(v => !v), []);
  const toggleMatchDayMode = useCallback(() => setMatchDayMode(v => !v), []);

  // ─── Context Value ─────────────────────────────────────────────
  const value = {
    // ── Direct State Setters (for useLiveData simulation hook) ──
    setCrowdDensityMap,
    setActiveAlerts,
    setStaffOnDuty,
    setSustainabilityMetrics,
    setFanSatisfactionScore,
    setWeatherData,
    setCurrentOccupancy,
    setNotifications,

    // ── Stadium Data ──
    venues: VENUES,
    currentVenue,
    currentVenueId,
    currentOccupancy,
    occupancyPercent,
    venueCapacity,

    // ── Crowd ──
    crowdDensityMap,

    // ── Alerts ──
    activeAlerts,
    unresolvedAlerts,
    criticalAlerts,

    // ── Staff ──
    staffOnDuty,
    staffByRole,
    staffByStatus,

    // ── Match ──
    matchSchedule,
    currentMatchAtVenue,

    // ── Sustainability ──
    sustainabilityMetrics,
    sustainabilityHistory: SUSTAINABILITY_30_DAYS,

    // ── Fan ──
    fanSatisfactionScore,
    satisfactionBreakdown,
    fanMessages: FAN_MESSAGES,

    // ── Analytics ──
    crowdFlow24h: CROWD_FLOW_24H,
    tickerItems: LIVE_TICKER_ITEMS,

    // ── Weather ──
    weatherData,

    // ── Notifications ──
    notifications,
    unreadNotifications,

    // ── UI ──
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    aiPanelOpen,
    setAiPanelOpen,
    toggleAiPanel,
    settingsOpen,
    setSettingsOpen,
    toggleSettings,
    isLiveMode,
    toggleLiveMode,
    matchDayMode,
    setMatchDayMode,
    toggleMatchDayMode,

    // ── API ──
    apiKey,
    saveApiKey,
    isAIConfigured: Boolean(apiKey),

    // ── Actions ──
    switchVenue,
    addAlert,
    resolveAlert,
    dismissAlert,
    updateCrowdDensity,
    updateStaffStatus,
    reassignStaff,
    generateIncident,
    updateSustainabilityMetric,
    updateFanSatisfaction,
    markAllNotificationsRead,
    dismissNotification,
  };

  return (
    <StadiumContext.Provider value={value}>
      {children}
    </StadiumContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useStadium() {
  const ctx = useContext(StadiumContext);
  if (!ctx) {
    throw new Error('useStadium() must be used inside a <StadiumProvider>');
  }
  return ctx;
}

export default StadiumContext;
