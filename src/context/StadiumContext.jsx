import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { useToast } from '../components/Toast';

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

import {
  STADIUMS,
  STADIUMS_MAP,
  fetchAllVenueData,
  fetchStadiumWeather,
  fetchAirQuality,
  generateRealisticCrowd,
} from '../utils/realApis';

// ─── Context ──────────────────────────────────────────────────────
const StadiumContext = createContext(null);

// ─── Constants ────────────────────────────────────────────────────
const DEFAULT_VENUE_ID     = 'metlife';
const LS_VENUE_KEY         = 'stadiumiq_venue_v2';
const LS_API_KEY           = 'stadiumiq_claude_key';
const WEATHER_REFRESH_MS   = 10 * 60 * 1000; // 10 minutes
const AQI_REFRESH_MS       = 15 * 60 * 1000; // 15 minutes

// Occupancy seeded from realistic % of capacity per venue
const OCCUPANCY_SEED_PCT = 0.817;

// ─── Helpers ──────────────────────────────────────────────────────
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

let alertIdCounter = INITIAL_ALERTS.length + 1;
const nextAlertId  = () => `alert-${String(++alertIdCounter).padStart(3, '0')}`;

/** Build a venue object compatible with the existing VENUES shape from realApis STADIUMS */
function buildVenueFromStadium(s) {
  return {
    id: s.id,
    name: s.name,
    shortName: s.shortName,
    city: `${s.city}${s.country !== 'Mexico' && s.country !== 'Canada' ? '' : ''}`,
    country: s.country,
    capacity: s.capacity,
    coordinates: { lat: s.lat, lng: s.lon },
    timezone: s.timezone,
    surface: s.surface,
    roof: s.roof,
    sections: s.sections || 30,
    gates: s.gates,
    concourses: s.concourses || 3,
    medicalPosts: s.medicalPosts || 12,
    securityCheckpoints: s.securityCheckpoints || 16,
    parkingLots: s.parkingLots || 8,
    image: s.id,
    tier: s.tier,
    openedYear: s.openedYear,
    address: s.address,
  };
}

// Merge: STADIUMS_MAP entries win for richer data, fall back to VENUES for legacy ids
const ALL_VENUES = STADIUMS.reduce((acc, s) => {
  acc[s.id] = buildVenueFromStadium(s);
  return acc;
}, { ...VENUES });

// ─── Provider ─────────────────────────────────────────────────────
export function StadiumProvider({ children }) {
  const toast = useToast();

  // ── Venue & Occupancy ──────────────────────────────────────────
  const savedVenueId = localStorage.getItem(LS_VENUE_KEY) || DEFAULT_VENUE_ID;
  const [currentVenueId, setCurrentVenueId] = useState(savedVenueId);

  const initialVenue    = ALL_VENUES[savedVenueId] || ALL_VENUES[DEFAULT_VENUE_ID];
  const [currentOccupancy, setCurrentOccupancy] = useState(
    Math.round(initialVenue.capacity * OCCUPANCY_SEED_PCT)
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
  const [fanSatisfactionScore, setFanSatisfactionScore] = useState(FAN_SATISFACTION_BREAKDOWN.overall);
  const [satisfactionBreakdown, setSatisfactionBreakdown] = useState(FAN_SATISFACTION_BREAKDOWN);

  // ── Weather — starts with mock, updated with real API ─────────
  const [weatherData, setWeatherData] = useState(WEATHER_DATA);

  // ── Air Quality — new real data ────────────────────────────────
  const [airQuality, setAirQuality] = useState(null);

  // ── Sun Times ──────────────────────────────────────────────────
  const [sunTimes, setSunTimes] = useState(null);

  // ── API fetch state ────────────────────────────────────────────
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError,   setWeatherError]   = useState(null);

  // ── UI State ───────────────────────────────────────────────────
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [aiPanelOpen,  setAiPanelOpen]  = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLiveMode,   setIsLiveMode]   = useState(true);
  const [matchDayMode, setMatchDayMode] = useState(false);

  // ── API Key ────────────────────────────────────────────────────
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_API_KEY) || '');

  // ── Notifications ──────────────────────────────────────────────
  const [notifications, setNotifications] = useState([
    { id: 'n1', read: false, type: 'critical', message: 'Zone E crowd density at 94% — steward deployment triggered', time: new Date(Date.now() - 4 * 60000) },
    { id: 'n2', read: false, type: 'warning',  message: 'Medical team responding to Section 14, Row G',              time: new Date(Date.now() - 9 * 60000) },
    { id: 'n3', read: true,  type: 'info',     message: 'Solar generation target: 92% achieved today',               time: new Date(Date.now() - 25 * 60000) },
    { id: 'n4', read: true,  type: 'success',  message: 'Gate D throughput normalized — all lanes operational',      time: new Date(Date.now() - 48 * 60000) },
  ]);

  // ─── Derived State ─────────────────────────────────────────────
  const currentVenue       = useMemo(() => ALL_VENUES[currentVenueId] || ALL_VENUES[DEFAULT_VENUE_ID], [currentVenueId]);
  const venueCapacity      = currentVenue.capacity;
  const occupancyPercent   = useMemo(() => Math.round((currentOccupancy / venueCapacity) * 100), [currentOccupancy, venueCapacity]);
  const unresolvedAlerts   = useMemo(() => activeAlerts.filter(a => !a.resolved), [activeAlerts]);
  const criticalAlerts     = useMemo(() => unresolvedAlerts.filter(a => a.severity === 'critical'), [unresolvedAlerts]);
  const unreadNotifications= useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const staffByRole   = useMemo(() => staffOnDuty.reduce((acc, s) => { acc[s.role]   = (acc[s.role]   || []).concat(s); return acc; }, {}), [staffOnDuty]);
  const staffByStatus = useMemo(() => staffOnDuty.reduce((acc, s) => { acc[s.status] = (acc[s.status] || []).concat(s); return acc; }, {}), [staffOnDuty]);

  const currentMatchAtVenue = useMemo(
    () => matchSchedule.find(m => m.venueId === currentVenueId) || matchSchedule[0],
    [matchSchedule, currentVenueId]
  );

  // ─── Real API: fetch weather + AQ + sun on venue change ───────
  const weatherTimerRef = useRef(null);
  const aqiTimerRef     = useRef(null);

  const loadVenueRealData = useCallback(async (venueId) => {
    const stadium = STADIUMS_MAP[venueId];
    if (!stadium) return; // Unknown venue, skip

    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const { weather, airQuality: aq, sunTimes: sun } = await fetchAllVenueData(stadium);

      if (weather) {
        // Merge real weather into the shape the pages expect
        setWeatherData(prev => ({
          ...prev,
          temp:          weather.temp,
          feelsLike:     weather.feelsLike,
          humidity:      weather.humidity,
          windSpeed:     weather.windSpeed,
          precipitation: weather.precipitation,
          condition:     weather.condition,
          icon:          weather.icon,
          fanComfort:    weather.fanComfort,
          weatherCode:   weather.weatherCode,
          source:        weather.source,
          fetchedAt:     weather.fetchedAt,
        }));
      }

      if (aq)  setAirQuality(aq);
      if (sun) setSunTimes(sun);

    } catch (err) {
      setWeatherError(`Live weather unavailable: ${err.message}`);
      // Keep whatever mock/previous data was there — don't wipe it
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // Initial load + re-fetch when venue changes
  useEffect(() => {
    loadVenueRealData(currentVenueId);

    if (weatherTimerRef.current) clearInterval(weatherTimerRef.current);
    if (aqiTimerRef.current) clearInterval(aqiTimerRef.current);

    // Weather auto-refresh
    weatherTimerRef.current = setInterval(async () => {
      const stadium = STADIUMS_MAP[currentVenueId];
      if (!stadium) return;
      try {
        const w = await fetchStadiumWeather(stadium.lat, stadium.lon);
        setWeatherData(prev => ({ ...prev, ...w }));
      } catch (e) {
        // graceful fail
      }
    }, WEATHER_REFRESH_MS);

    // AQI auto-refresh
    aqiTimerRef.current = setInterval(async () => {
      const stadium = STADIUMS_MAP[currentVenueId];
      if (!stadium) return;
      try {
        const aq = await fetchAirQuality(stadium.lat, stadium.lon);
        setAirQuality(aq);
      } catch (e) {
        // graceful fail
      }
    }, AQI_REFRESH_MS);

    return () => {
      if (weatherTimerRef.current) clearInterval(weatherTimerRef.current);
      if (aqiTimerRef.current) clearInterval(aqiTimerRef.current);
    };
  }, [currentVenueId, loadVenueRealData]);

  // ─── Actions ───────────────────────────────────────────────────

  /** Switch active venue — persists to localStorage, triggers real API refresh */
  const switchVenue = useCallback((venueId) => {
    if (!ALL_VENUES[venueId]) return;
    setCurrentVenueId(venueId);

    const venue = ALL_VENUES[venueId];
    toast.info(`Switching to ${venue.name}...`, 'VENUE CHANGE', 2000);
    setCurrentOccupancy(Math.round(venue.capacity * OCCUPANCY_SEED_PCT));
    localStorage.setItem(LS_VENUE_KEY, venueId);

    // Regenerate crowd density using realistic model
    const newCrowd = generateRealisticCrowd(venue.capacity, matchDayMode, 19);
    setCrowdDensityMap(newCrowd);
  }, [matchDayMode, toast]);

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
    setNotifications(prev => [{
      id: `n${Date.now()}`,
      read: false,
      type: alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'warning' : 'info',
      message: alert.message,
      time: new Date(),
    }, ...prev]);
  }, []);

  const resolveAlert = useCallback((id) => {
    setActiveAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true, resolvedAt: new Date().toISOString() } : a));
  }, []);

  const dismissAlert = useCallback((id) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const updateCrowdDensity = useCallback((zone, value) => {
    setCrowdDensityMap(prev => {
      if (!prev[zone]) return prev;
      const clampedDensity = Math.max(0, Math.min(100, value));
      return { ...prev, [zone]: { ...prev[zone], density: clampedDensity, current: Math.round(prev[zone].capacity * (clampedDensity / 100)) } };
    });
    if (value >= 95) addAlert({ type: 'crowd_surge', zone, severity: 'critical', message: `Zone ${zone} density at ${value}% — critical overcrowding.`, suggestedAction: `Deploy 3 stewards to Zone ${zone} immediately.` });
    else if (value >= 90) addAlert({ type: 'crowd_surge', zone, severity: 'high', message: `Zone ${zone} density at ${value}% — approaching critical.`, suggestedAction: `Increase monitoring of Zone ${zone}.` });
  }, [addAlert]);

  const updateStaffStatus = useCallback((staffId, status) => {
    setStaffOnDuty(prev => prev.map(s => s.id === staffId ? { ...s, status, lastUpdate: new Date().toISOString() } : s));
  }, []);

  const reassignStaff = useCallback((staffId, newZone) => {
    setStaffOnDuty(prev => prev.map(s => s.id === staffId ? { ...s, zone: newZone, lastUpdate: new Date().toISOString() } : s));
  }, []);

  const generateIncident = useCallback(() => {
    const template = pickRandom(INCIDENT_TEMPLATES);
    const zone     = pickRandom(template.zonePool);
    addAlert({ type: template.type, zone, severity: template.severity, message: template.messageTemplate(zone), suggestedAction: 'AI recommendation: Dispatch nearest available staff.', isAIGenerated: true });
  }, [addAlert]);

  const updateSustainabilityMetric = useCallback((key, newValue) => {
    setSustainabilityMetrics(prev => ({ ...prev, [key]: { ...prev[key], value: newValue } }));
  }, []);

  const updateFanSatisfaction = useCallback((category, score) => {
    if (category === 'overall') {
      setFanSatisfactionScore(score);
    } else {
      setSatisfactionBreakdown(prev => {
        const updated = { ...prev, [category]: score };
        const vals = Object.values(updated);
        setFanSatisfactionScore(Math.round(vals.reduce((s, v) => s + v, 0) / vals.length));
        return updated;
      });
    }
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const saveApiKey = useCallback((key) => {
    setApiKey(key);
    localStorage.setItem(LS_API_KEY, key.trim());
  }, []);

  const toggleSidebar      = useCallback(() => setSidebarOpen(v  => !v), []);
  const toggleAiPanel      = useCallback(() => setAiPanelOpen(v  => !v), []);
  const toggleSettings     = useCallback(() => setSettingsOpen(v => !v), []);
  const toggleLiveMode     = useCallback(() => setIsLiveMode(v   => !v), []);
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
    venues: ALL_VENUES,                // now includes all 10 venues
    stadiums: STADIUMS,                // array form for dropdowns
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
    tickerItems:  LIVE_TICKER_ITEMS,

    // ── Weather (real API + mock fallback) ──
    weatherData,
    weatherLoading,
    weatherError,

    // ── Air Quality (real API) ──
    airQuality,

    // ── Sun Times (real API) ──
    sunTimes,

    // ── Notifications ──
    notifications,
    unreadNotifications,

    // ── UI ──
    sidebarOpen,  setSidebarOpen,  toggleSidebar,
    aiPanelOpen,  setAiPanelOpen,  toggleAiPanel,
    settingsOpen, setSettingsOpen, toggleSettings,
    isLiveMode,   toggleLiveMode,
    matchDayMode, setMatchDayMode, toggleMatchDayMode,

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

    // ── Utility ──
    refreshWeather: () => loadVenueRealData(currentVenueId),
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
  if (!ctx) throw new Error('useStadium() must be used inside a <StadiumProvider>');
  return ctx;
}

export default StadiumContext;
