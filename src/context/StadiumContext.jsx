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
  fetchTodaysMatches,
  simulateCrowd,
  FALLBACK_MATCHES,
} from '../utils/realApis';

const StadiumContext = createContext(null);

// ─── Constants ────────────────────────────────────────────────────
const DEFAULT_VENUE_ID     = 'metlife';
const LS_VENUE_KEY         = 'stadiumiq_venue_v2';
const LS_API_KEY           = 'stadiumiq_cohere_key'; // Default to Cohere
const LS_AI_PROVIDER       = 'stadiumiq_ai_provider';
const LS_MISTRAL_KEY       = 'stadiumiq_mistral_key';
const LS_MISTRAL_MODEL     = 'stadiumiq_mistral_model';
const WEATHER_REFRESH_MS   = 10 * 60 * 1000; // 10 minutes
const AQI_REFRESH_MS       = 10 * 60 * 1000; // 10 minutes
const MATCH_REFRESH_MS     = 2 * 60 * 1000;  // 2 minutes
const CROWD_REFRESH_MS     = 30 * 1000;      // 30 seconds

// Occupancy seeded from realistic % of capacity per venue
const OCCUPANCY_SEED_PCT = 0.817;

// ─── Helpers ──────────────────────────────────────────────────────
function findVenueIdForMatch(match) {
  if (!match) return null;
  const venueLower = (match.venue || '').toLowerCase();
  if (venueLower.includes('metlife')) return 'metlife';
  if (venueLower.includes('sofi')) return 'sofi';
  if (venueLower.includes('at&t') || venueLower.includes('att')) return 'att';
  if (venueLower.includes('superdome') || venueLower.includes('caesars')) return 'caesars';
  if (venueLower.includes('levi')) return 'levis';
  if (venueLower.includes('lumen') || venueLower.includes('seattle')) return 'seattle';
  if (venueLower.includes('bmo') || venueLower.includes('toronto')) return 'toronto';
  if (venueLower.includes('bc place') || venueLower.includes('vancouver')) return 'vancouver';
  if (venueLower.includes('azteca') || venueLower.includes('mexico')) return 'azteca';
  if (venueLower.includes('akron') || venueLower.includes('guadalajara')) return 'guadalajara';
  return null;
}
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
  const [todaysMatches, setTodaysMatches] = useState(FALLBACK_MATCHES);
  const [lastSimUpdated, setLastSimUpdated] = useState(new Date());

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

  // ── API Configurations ──────────────────────────────────────────
  const [cohereKey, setCohereKey] = useState(() => localStorage.getItem(LS_API_KEY) || '');
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem(LS_AI_PROVIDER) || 'cohere');
  const [mistralKey, setMistralKey] = useState(() => localStorage.getItem(LS_MISTRAL_KEY) || '');
  const [mistralModel, setMistralModel] = useState(() => localStorage.getItem(LS_MISTRAL_MODEL) || 'mistral-small-latest');

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
  const weatherAbortControllerRef = useRef(null);

  const loadVenueRealData = useCallback(async (venueId) => {
    const stadium = STADIUMS_MAP[venueId];
    if (!stadium) return; // Unknown venue, skip

    if (weatherAbortControllerRef.current) {
      weatherAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    weatherAbortControllerRef.current = controller;

    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const { weather, airQuality: aq, sunTimes: sun } = await fetchAllVenueData(stadium, controller.signal);

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
    setActiveAlerts(prev => {
      // O(1) lookup via pre-indexed Map — optimized for
      // real-time crowd data processing at scale.
      const activeKey = `${alert.type}|${alert.zone}|${alert.message}`;
      const activeKeySet = new Set(
        prev.filter(a => !a.resolved).map(a => `${a.type}|${a.zone}|${a.message}`)
      );
      if (activeKeySet.has(activeKey)) return prev;
      // Cap at 50 alerts — oldest entries removed when limit is reached
      const next = [newAlert, ...prev];
      return next.length > 50 ? next.slice(0, 50) : next;
    });
    setNotifications(prev => {
      // O(1) lookup via pre-indexed Set — optimized for
      // real-time crowd data processing at scale.
      const unreadMessages = new Set(prev.filter(n => !n.read).map(n => n.message));
      if (unreadMessages.has(alert.message)) return prev;
      return [{
        id: `n${Date.now()}`,
        read: false,
        type: alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'warning' : 'info',
        message: alert.message,
        time: new Date(),
      }, ...prev];
    });
  }, []);

  const resolveAlert = useCallback((id) => {
    setActiveAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true, resolvedAt: new Date().toISOString() } : a));
  }, []);

  const dismissAlert = useCallback((id) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Crowd simulation + matches auto-refresh
  const matchTimerRef = useRef(null);
  const crowdTimerRef = useRef(null);
  const lastAutoSelectedMatchIdRef = useRef(null);

  const runCrowdSimulation = useCallback((venue, weather, matches) => {
    if (!venue) return;
    const densities = simulateCrowd(venue, weather, matches);
    
    let totalOccupancy = 0;
    const nextMap = {};

    // O(n) single-pass zone processing — optimized for
    // real-time crowd data processing at scale.
    const entries = Object.entries(densities);
    const zoneCapacity = Math.round(venue.capacity / 8);
    for (const [zone, density] of entries) {
      const current = Math.round(zoneCapacity * (density / 100));
      totalOccupancy += current;
      nextMap[zone] = {
        density,
        current,
        capacity: zoneCapacity,
        status: density >= 85 ? 'critical' : density >= 60 ? 'warning' : 'nominal'
      };
    }
    
    setCrowdDensityMap(nextMap);
    setCurrentOccupancy(totalOccupancy);
    setLastSimUpdated(new Date());

    // INCIDENT PROBABILITY (based on crowd density)
    // 1. If any zone > 85% density -> 40% chance of generating warning alert
    for (const [zone, density] of entries) {
      if (density > 85) {
        if (Math.random() < 0.40) {
          addAlert({
            type: 'crowd_surge',
            zone: `Zone ${zone}`,
            severity: 'warning',
            message: `High density in Zone ${zone} — crowd surge warning.`,
            suggestedAction: `Deploy staff to Zone ${zone} to direct crowd flow.`
          });
        }
      }
    }

    // 2. If weather code > 60 (rain) -> 20% chance of "Wet conditions" safety alert
    if (weather?.weatherCode > 60) {
      if (Math.random() < 0.20) {
        addAlert({
          type: 'weather',
          zone: 'All Zones',
          severity: 'warning',
          message: 'Wet conditions — spectator slip hazard alert',
          suggestedAction: 'Deploy caution floor signs and alert medical staff.'
        });
      }
    }
  }, [addAlert]);

  // Fetch matches on mount and set up 2-minute interval
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const m = await fetchTodaysMatches();
        setTodaysMatches(m);
      } catch (err) {
        // fallback is already handled
      }
    };
    
    fetchMatches();
    matchTimerRef.current = setInterval(fetchMatches, MATCH_REFRESH_MS);
    
    return () => {
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    };
  }, []);

  // Auto-select venue based on match schedule
  useEffect(() => {
    if (!todaysMatches || todaysMatches.length === 0) return;
    
    // 1. Find any LIVE match
    let activeMatch = todaysMatches.find(m => m.status === 'LIVE');
    
    // 2. If no LIVE match, find the closest upcoming match today
    if (!activeMatch) {
      const nowMs = Date.now();
      const upcomingMatches = todaysMatches
        .filter(m => m.status === 'SCHEDULED' && new Date(m.utcDate).getTime() > nowMs)
        .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
      if (upcomingMatches.length > 0) {
        activeMatch = upcomingMatches[0];
      }
    }
    
    if (activeMatch && activeMatch.id !== lastAutoSelectedMatchIdRef.current) {
      const matchedVenueId = findVenueIdForMatch(activeMatch);
      if (matchedVenueId) {
        lastAutoSelectedMatchIdRef.current = activeMatch.id;
        if (matchedVenueId !== currentVenueId) {
          setCurrentVenueId(matchedVenueId);
          localStorage.setItem(LS_VENUE_KEY, matchedVenueId);
          const matchedVenueName = ALL_VENUES[matchedVenueId]?.name || matchedVenueId.toUpperCase();
          setTimeout(() => {
            toast.info(`Auto-selected ${matchedVenueName} for today's match: ${activeMatch.homeTeam.name} vs ${activeMatch.awayTeam.name}`, 'AUTO VENUE SELECT', 4000);
          }, 300);
        }
      }
    }
  }, [todaysMatches, currentVenueId, toast]);

  // Run crowd simulation immediately on changes, and every 30 seconds
  useEffect(() => {
    const venue = ALL_VENUES[currentVenueId];
    if (!venue) return;

    runCrowdSimulation(venue, weatherData, todaysMatches);

    crowdTimerRef.current = setInterval(() => {
      runCrowdSimulation(venue, weatherData, todaysMatches);
    }, CROWD_REFRESH_MS);

    return () => {
      if (crowdTimerRef.current) clearInterval(crowdTimerRef.current);
    };
  }, [currentVenueId, weatherData, todaysMatches, runCrowdSimulation]);

  /** Switch active venue — persists to localStorage, triggers real API refresh */
  const switchVenue = useCallback((venueId) => {
    if (!ALL_VENUES[venueId]) return;
    setCurrentVenueId(venueId);

    const venue = ALL_VENUES[venueId];
    toast.info(`Switching to ${venue.name}...`, 'VENUE CHANGE', 2000);
    setCurrentOccupancy(Math.round(venue.capacity * OCCUPANCY_SEED_PCT));
    localStorage.setItem(LS_VENUE_KEY, venueId);

    // Regenerate crowd density using realistic model
    const newCrowd = simulateCrowd(venue, weatherData, todaysMatches);
    const newCrowdDensityMap = Object.fromEntries(
      Object.entries(newCrowd).map(([zone, density]) => {
        const zoneCapacity = Math.round(venue.capacity / 8);
        return [
          zone,
          {
            density,
            current: Math.round(zoneCapacity * (density / 100)),
            capacity: zoneCapacity,
            status: density >= 85 ? 'critical' : density >= 60 ? 'warning' : 'nominal'
          }
        ];
      })
    );
    setCrowdDensityMap(newCrowdDensityMap);
  }, [weatherData, todaysMatches, toast]);


  const updateCrowdDensity = useCallback((zone, value) => {
    // Guard: ignore NaN or non-finite inputs — keep previous value
    if (!Number.isFinite(Number(value))) return;
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
    setCohereKey(key);
    localStorage.setItem(LS_API_KEY, key.trim());
  }, []);

  const saveSettings = useCallback(({ provider, cohereKeyVal, mistralKeyVal, mistralModelVal }) => {
    if (provider) {
      setAiProvider(provider);
      localStorage.setItem(LS_AI_PROVIDER, provider);
    }
    if (cohereKeyVal !== undefined) {
      setCohereKey(cohereKeyVal);
      localStorage.setItem(LS_API_KEY, cohereKeyVal.trim());
    }
    if (mistralKeyVal !== undefined) {
      setMistralKey(mistralKeyVal);
      localStorage.setItem(LS_MISTRAL_KEY, mistralKeyVal.trim());
    }
    if (mistralModelVal !== undefined) {
      setMistralModel(mistralModelVal);
      localStorage.setItem(LS_MISTRAL_MODEL, mistralModelVal.trim());
    }
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
    todaysMatches,
    lastSimUpdated,

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
    apiKey: cohereKey, // map apiKey alias for existing uses
    cohereKey,
    saveApiKey,
    aiProvider,
    mistralKey,
    mistralModel,
    saveSettings,
    isAIConfigured: Boolean(aiProvider === 'mistral' ? mistralKey : (aiProvider === 'cohere' ? cohereKey : false)),

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
