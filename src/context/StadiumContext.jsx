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
  getFbKey,
} from '../utils/realApis';

const StadiumContext = createContext(null);

// ─── Constants ────────────────────────────────────────────────────
const DEFAULT_VENUE_ID     = 'metlife';
const LS_VENUE_KEY         = 'stadiumiq_venue_v2';
const LS_API_KEY           = 'stadiumiq_cohere_key';
const LS_AI_PROVIDER       = 'stadiumiq_ai_provider';
const LS_MISTRAL_KEY       = 'stadiumiq_mistral_key';
const LS_MISTRAL_MODEL     = 'stadiumiq_mistral_model';
const LS_FOOTBALL_KEY      = 'stadiumiq_football_key';
const LS_HF_KEY            = 'stadiumiq_hf_key';
const LS_HF_MODEL          = 'stadiumiq_hf_model';
const WEATHER_REFRESH_MS   = 10 * 60 * 1000; // 10 minutes
const AQI_REFRESH_MS       = 10 * 60 * 1000; // 10 minutes

// ─── Env-first key readers ────────────────────────────────────────
// Priority: .env (VITE_*) → localStorage → empty string
// This allows setting keys once in .env without using the Settings modal.
const envKey = (envVar, lsKey) =>
  import.meta.env[envVar] || localStorage.getItem(lsKey) || '';
const MATCH_REFRESH_MS     = 2 * 60 * 1000;  // 2 minutes
const CROWD_REFRESH_MS     = 30 * 1000;      // 30 seconds

// Occupancy seeded from realistic % of capacity per venue
const OCCUPANCY_SEED_PCT = 0.817;

// ─── Helpers ──────────────────────────────────────────────────────
function findVenueIdForMatch(match) {
  if (!match) return null;
  
  // 1. Match by stage (FIFA WC 2026 Final is officially hosted at MetLife)
  const stageUpper = (match.stage || '').toUpperCase();
  if (stageUpper.includes('FINAL') && !stageUpper.includes('SEMI') && !stageUpper.includes('QUARTER')) {
    return 'metlife';
  }

  // 2. Match by venue string first
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

  // 3. Robust Fallback: Map by home team name or major team context (if venue is null/unmatched)
  const homeLower = (match.homeTeam?.name || '').toLowerCase();
  const awayLower = (match.awayTeam?.name || '').toLowerCase();

  // USA match mappings
  if (homeLower === 'usa' || homeLower === 'united states' || homeLower === 'engaind' || homeLower === 'england') return 'metlife';
  if (awayLower === 'usa' || awayLower === 'united states') return 'metlife';

  // Mexico match mappings
  if (homeLower === 'mexico' || homeLower === 'germany') return 'azteca';
  if (awayLower === 'mexico') return 'azteca';

  // Canada match mappings
  if (homeLower === 'canada' || homeLower === 'france') return 'vancouver';
  if (awayLower === 'canada') return 'vancouver';

  // Spain/Argentina powerhouse mappings
  if (homeLower === 'spain' || awayLower === 'spain') return 'metlife';
  if (homeLower === 'argentina' || awayLower === 'argentina') return 'sofi';
  
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
  const verifiedVenueId = ALL_VENUES[savedVenueId] ? savedVenueId : DEFAULT_VENUE_ID;
  const [currentVenueId, setCurrentVenueId] = useState(verifiedVenueId);

  const initialVenue    = ALL_VENUES[savedVenueId] || ALL_VENUES[DEFAULT_VENUE_ID];
  const [currentOccupancy, setCurrentOccupancy] = useState(
    Math.round(initialVenue.capacity * OCCUPANCY_SEED_PCT)
  );

  // ── Crowd Density ──────────────────────────────────────────────
  const [crowdDensityMap, setCrowdDensityMap] = useState(INITIAL_CROWD_DENSITY);

  // ── Alerts — start empty, only generated during active match phases ──
  const [activeAlerts, setActiveAlerts] = useState([]);

  // ── Staff ──────────────────────────────────────────────────────
  const [staffOnDuty, setStaffOnDuty] = useState(
    // Initially set all staff to off-shift — will be updated once todaysMatches loads
    STAFF_MEMBERS.map(s => ({ ...s, status: 'off-shift' }))
  );

  // ── Match Schedule ─────────────────────────────────────────────
  const [matchSchedule] = useState(MATCH_SCHEDULE);
  const [todaysMatches, setTodaysMatches] = useState(FALLBACK_MATCHES);
  const [matchPhase, setMatchPhase] = useState('no-match');
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
  // Env-first: reads from .env first, then localStorage, then default
  const [cohereKey, setCohereKey] = useState(() => envKey('VITE_COHERE_API_KEY', LS_API_KEY));
  const [aiProvider, setAiProvider] = useState(() => envKey('VITE_AI_PROVIDER', LS_AI_PROVIDER) || 'cohere');
  const [mistralKey, setMistralKey] = useState(() => envKey('VITE_MISTRAL_API_KEY', LS_MISTRAL_KEY));
  const [mistralModel, setMistralModel] = useState(() => envKey('VITE_MISTRAL_MODEL', LS_MISTRAL_MODEL) || 'mistral-small-latest');
  const [footballApiKey, setFootballApiKey] = useState(() => envKey('VITE_FOOTBALL_API_KEY', LS_FOOTBALL_KEY) || getFbKey());
  const [hfKey, setHfKey] = useState(() => envKey('VITE_HF_API_KEY', LS_HF_KEY));
  const [hfModel, setHfModel] = useState(() => envKey('VITE_HF_MODEL', LS_HF_MODEL) || 'Qwen/Qwen2.5-72B-Instruct');

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
      if (weatherAbortControllerRef.current) {
        weatherAbortControllerRef.current.abort();
      }
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

  const runCrowdSimulation = useCallback((venue, weather, matches, matchPhase) => {
    if (!venue) return;

    // ── No match / post-match-done: stadium is empty ────────────────
    // Zero-out crowd density and skip all incident generation.
    if (matchPhase === 'no-match' || matchPhase === 'post-match-done') {
      const emptyMap = {};
      const zoneCapacity = Math.round(venue.capacity / 8);
      ['A','B','C','D','E','F','G','H'].forEach(zone => {
        // 0-2% = maintenance/cleaning crew only, no spectators
        const density = Math.floor(Math.random() * 3);
        emptyMap[zone] = { density, current: Math.round(zoneCapacity * density / 100), capacity: zoneCapacity, status: 'nominal' };
      });
      setCrowdDensityMap(emptyMap);
      setCurrentOccupancy(Object.values(emptyMap).reduce((s, z) => s + z.current, 0));
      setLastSimUpdated(new Date());
      return; // ← no alerts, no simulation
    }

    const densities = simulateCrowd(venue, weather, matches);
    
    let totalOccupancy = 0;
    const nextMap = {};

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

    // ── Incident generation: only during active match phases ───────────
    // No crowd = no incidents. Incidents only make sense when spectators
    // are physically present in the stadium.
    const isActivePhase = matchPhase === 'match-day' || matchPhase === 'pre-match' || matchPhase === 'post-match';
    if (!isActivePhase) return;

    // 1. High-density crowd surge warning (only if zone > 85% AND match is active)
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

    // 2. Wet conditions safety alert (only during match phases with spectators)
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

  // ── Match-aware staff deployment ─────────────────────────────
  // Staff should only be on duty when there is a match at this venue.
  // Phase logic:
  //   'no-match'       → No match today → all staff off-shift
  //   'pre-match-early'→ Match is 4+ hours away → supervisors only active
  //   'pre-match'      → Match within 1–4 hours → security/ops/medical deploy
  //   'match-day'      → Match live or within 1 hour → full deployment
  //   'post-match'     → Match ended, within 2 hours → wind-down staff
  //   'post-match-done'→ More than 2h after final whistle → all off-shift
  useEffect(() => {
    if (!todaysMatches || todaysMatches.length === 0) {
      setStaffOnDuty(STAFF_MEMBERS.map(s => ({ ...s, status: 'off-shift' })));
      setMatchPhase('no-match');
      return;
    }

    const now = Date.now();

    // Find the most relevant match: LIVE first, then closest upcoming, then latest finished
    const liveMatch = todaysMatches.find(m => m.status === 'LIVE');
    const upcomingMatches = todaysMatches
      .filter(m => m.status === 'SCHEDULED' && new Date(m.utcDate).getTime() > now)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
    const finishedMatches = todaysMatches
      .filter(m => m.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());

    const referenceMatch = liveMatch || upcomingMatches[0] || finishedMatches[0];

    if (!referenceMatch) {
      setStaffOnDuty(STAFF_MEMBERS.map(s => ({ ...s, status: 'off-shift' })));
      setMatchPhase('no-match');
      return;
    }

    const matchTime    = new Date(referenceMatch.utcDate).getTime();
    const hoursToMatch = (matchTime - now) / (1000 * 60 * 60);
    const matchStatus  = referenceMatch.status;

    // Determine deployment phase
    let phase;
    if (matchStatus === 'LIVE') {
      phase = 'match-day';
    } else if (matchStatus === 'FINISHED') {
      const hoursSinceKickoff = (now - matchTime) / (1000 * 60 * 60);
      // Assume match lasts ~2h, so "finished" is kickoff + ~2h
      const hoursSinceEnd = hoursSinceKickoff - 2;
      phase = hoursSinceEnd < 2 ? 'post-match' : 'post-match-done';
    } else if (hoursToMatch <= 1) {
      phase = 'match-day';          // match imminent — full deployment
    } else if (hoursToMatch <= 4) {
      phase = 'pre-match';          // 1–4h out — security/ops/medical
    } else if (hoursToMatch <= 8) {
      phase = 'pre-match-early';    // 4–8h out — supervisors only
    } else {
      phase = 'no-match';           // match is tomorrow or far away
    }

    setMatchPhase(phase);

    // Role + shift weights per phase
    // Returns { status, visible } for each staff member
    const getStaffStatus = (member) => {
      const { role, shift } = member;
      switch (phase) {
        case 'no-match':
        case 'post-match-done':
          return 'off-shift';

        case 'pre-match-early':
          // Only lead supervisors in the building (Level 3 certs or badge ending in -001/-002)
          const isSupervisor = member.badge.endsWith('-001') || member.badge.endsWith('-002') ||
            member.certifications?.some(c => c.includes('Level 3') || c.includes('MD'));
          return isSupervisor ? 'active' : 'off-shift';

        case 'pre-match':
          // Security, medical, operations are active; volunteers arriving
          if (role === 'Security' || role === 'Medical' || role === 'Operations') {
            return shift === 'Relief' ? 'standby' : 'active';
          }
          if (role === 'Volunteer' && shift === 'Morning') return 'active';
          return 'off-shift';

        case 'match-day':
          // Full deployment — use realistic spread from original weights
          if (shift === 'Relief') return 'standby';
          // Spread: mostly active, some on break or responding
          const idx = STAFF_MEMBERS.findIndex(s => s.id === member.id);
          const spread = ['active','active','active','active','break','responding','active'];
          return spread[idx % spread.length];

        case 'post-match':
          // Wind down — security active for crowd exit, others finishing
          if (role === 'Security' || role === 'Operations') return 'active';
          if (role === 'Medical') return 'standby';
          return 'off-shift';

        default:
          return 'off-shift';
      }
    };

    setStaffOnDuty(
      STAFF_MEMBERS.map(member => ({
        ...member,
        status: getStaffStatus(member),
        matchPhase: phase,
        lastUpdate: new Date().toISOString(),
      }))
    );
  }, [todaysMatches]);

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

    // 3. If no LIVE or upcoming match, find the most recently finished match today
    if (!activeMatch) {
      const finishedMatches = todaysMatches
        .filter(m => m.status === 'FINISHED')
        .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());
      if (finishedMatches.length > 0) {
        activeMatch = finishedMatches[0];
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

    // Compute match phase for crowd + alert gating
    const computePhase = (matches) => {
      if (!matches?.length) return 'no-match';
      const now = Date.now();
      const live = matches.find(m => m.status === 'LIVE');
      if (live) return 'match-day';
      const upcoming = matches
        .filter(m => m.status === 'SCHEDULED' && new Date(m.utcDate).getTime() > now)
        .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0];
      if (upcoming) {
        const h = (new Date(upcoming.utcDate).getTime() - now) / 3600000;
        if (h <= 1)  return 'match-day';
        if (h <= 4)  return 'pre-match';
        if (h <= 8)  return 'pre-match-early';
        return 'no-match';
      }
      const finished = matches.filter(m => m.status === 'FINISHED')
        .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())[0];
      if (finished) {
        const hSince = (now - new Date(finished.utcDate).getTime()) / 3600000 - 2;
        return hSince < 2 ? 'post-match' : 'post-match-done';
      }
      return 'no-match';
    };

    const phase = computePhase(todaysMatches);

    // Clear all pre-seeded/stale incidents when stadium is empty
    if (phase === 'no-match' || phase === 'post-match-done') {
      setActiveAlerts([]);
    }

    runCrowdSimulation(venue, weatherData, todaysMatches, phase);

    crowdTimerRef.current = setInterval(() => {
      const currentPhase = computePhase(todaysMatches);
      runCrowdSimulation(venue, weatherData, todaysMatches, currentPhase);
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

    // Compute phase for the newly selected venue
    const now = Date.now();
    const live = todaysMatches?.find(m => m.status === 'LIVE');
    const upcoming = (todaysMatches || [])
      .filter(m => m.status === 'SCHEDULED' && new Date(m.utcDate).getTime() > now)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0];
    const hoursToNext = upcoming ? (new Date(upcoming.utcDate).getTime() - now) / 3600000 : Infinity;
    const venuePhase = live ? 'match-day'
      : hoursToNext <= 1 ? 'match-day'
      : hoursToNext <= 4 ? 'pre-match'
      : hoursToNext <= 8 ? 'pre-match-early'
      : 'no-match';

    const zoneCapacity = Math.round(venue.capacity / 8);

    if (venuePhase === 'no-match' || venuePhase === 'post-match-done') {
      // Empty stadium: 0-2% density, clear all stale incidents
      const emptyMap = {};
      ['A','B','C','D','E','F','G','H'].forEach(zone => {
        const density = Math.floor(Math.random() * 3);
        emptyMap[zone] = { density, current: Math.round(zoneCapacity * density / 100), capacity: zoneCapacity, status: 'nominal' };
      });
      setCrowdDensityMap(emptyMap);
      setCurrentOccupancy(Object.values(emptyMap).reduce((s, z) => s + z.current, 0));
      setActiveAlerts([]);
    } else {
      // Match venue: run full crowd simulation
      const newCrowd = simulateCrowd(venue, weatherData, todaysMatches);
      const newCrowdDensityMap = Object.fromEntries(
        Object.entries(newCrowd).map(([zone, density]) => [
          zone,
          { density, current: Math.round(zoneCapacity * (density / 100)), capacity: zoneCapacity, status: density >= 85 ? 'critical' : density >= 60 ? 'warning' : 'nominal' }
        ])
      );
      setCrowdDensityMap(newCrowdDensityMap);
    }
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

  const saveSettings = useCallback(({ provider, cohereKeyVal, mistralKeyVal, mistralModelVal, hfKeyVal, hfModelVal }) => {
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
    if (hfKeyVal !== undefined) {
      setHfKey(hfKeyVal);
      localStorage.setItem(LS_HF_KEY, hfKeyVal.trim());
    }
    if (hfModelVal !== undefined) {
      setHfModel(hfModelVal);
      localStorage.setItem(LS_HF_MODEL, hfModelVal.trim());
    }
  }, []);

  const saveFootballApiKey = useCallback((key) => {
    const trimmed = (key || '').trim();
    setFootballApiKey(trimmed);
    localStorage.setItem(LS_FOOTBALL_KEY, trimmed);
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
    matchPhase,
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
    hfKey,
    hfModel,
    saveSettings,
    isAIConfigured: Boolean(
      aiProvider === 'mistral' ? mistralKey : 
      aiProvider === 'huggingface' ? hfKey : 
      aiProvider === 'cohere' ? cohereKey : false
    ),

    // ── Football API ──
    footballApiKey,
    saveFootballApiKey,

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
