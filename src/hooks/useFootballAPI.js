// ─── useFootballAPI — Real-time FIFA WC 2026 data hook ───────────
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchTodaysMatches,
  fetchLiveMatch,
  fetchWCStandings,
  FALLBACK_MATCHES,
  TEAM_FLAG_EMOJI,
} from '../utils/realApis';

// ─── Simulated match events pool (used when free API tier doesn't
//     provide play-by-play data) ───────────────────────────────────
// Note: 'icon' field removed — use <MatchEventIcon type={event.type} /> to render
const EVENT_TEMPLATES = [
  { type: 'GOAL',          label: 'GOAL!',           color: '#10B981' },
  { type: 'YELLOW_CARD',   label: 'Yellow Card',     color: '#F59E0B' },
  { type: 'RED_CARD',      label: 'Red Card',        color: '#EF4444' },
  { type: 'SUBSTITUTION',  label: 'Substitution',    color: '#3B82F6' },
  { type: 'VAR',           label: 'VAR Check',       color: '#8B5CF6' },
  { type: 'OFFSIDE',       label: 'Offside',         color: '#F97316' },
  { type: 'FREE_KICK',     label: 'Free Kick',       color: '#6B7280' },
  { type: 'CORNER',        label: 'Corner Kick',     color: '#6B7280' },
  { type: 'PENALTY',       label: 'Penalty Awarded', color: '#EC4899' },
];


const PLAYER_NAMES = [
  'M. Salah', 'R. Lewandowski', 'K. Mbappé', 'V. Osimhen', 'L. Messi',
  'E. Haaland', 'P. Dybala', 'B. Saka', 'P. Foden', 'R. Bellingham',
  'V. Vinicius Jr.', 'F. Valverde', 'R. Benzema', 'K. De Bruyne', 'L. Modric',
  'T. Werner', 'L. Hernandez', 'H. Son', 'S. Mane', 'A. Hakimi',
];

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateSimEvent(match, minute) {
  const template = pickRandom(EVENT_TEMPLATES);
  const isHome   = Math.random() > 0.5;
  const team     = isHome ? match.homeTeam.name : match.awayTeam.name;
  return {
    id:       `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type:     template.type,
    icon:     template.icon,
    label:    template.label,
    color:    template.color,
    minute,
    team,
    player:   pickRandom(PLAYER_NAMES),
    timestamp: new Date().toISOString(),
  };
}

// ─── Atmosphere score calculation ─────────────────────────────────
function calcAtmosphere(events, status) {
  let score = 60;
  if (status === 'LIVE') score += 25;
  events.forEach(e => {
    if (e.type === 'GOAL')      score += 15;
    if (e.type === 'RED_CARD')  score -= 5;
    if (e.type === 'PENALTY')   score += 8;
    if (e.type === 'VAR')       score += 3;
  });
  return Math.max(10, Math.min(100, score));
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useFootballAPI() {
  const [matches,       setMatches]       = useState(FALLBACK_MATCHES);
  const [liveMatch,     setLiveMatch]     = useState(null);
  const [standings,     setStandings]     = useState(null);
  const [matchEvents,   setMatchEvents]   = useState([]);
  const [atmosphere,    setAtmosphere]    = useState(65);
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState(null);
  const [lastUpdated,   setLastUpdated]   = useState(null);
  const [matchMinute,   setMatchMinute]   = useState(null);
  const [liveScore,     setLiveScore]     = useState({ home: null, away: null });

  const matchTimerRef    = useRef(null);
  const liveTimerRef     = useRef(null);
  const eventTimerRef    = useRef(null);
  const minuteTimerRef   = useRef(null);
  const eventsRef        = useRef(matchEvents);

  useEffect(() => { eventsRef.current = matchEvents; }, [matchEvents]);

  // ── Fetch all today's matches ──────────────────────────────────
  const loadMatches = useCallback(async () => {
    try {
      const result = await fetchTodaysMatches();
      setMatches(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
      setMatches(FALLBACK_MATCHES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Fetch live match details (score + minute) ─────────────────
  const loadLiveMatch = useCallback(async (matchId) => {
    if (!matchId) { setLiveMatch(null); return; }
    try {
      const result = await fetchLiveMatch(matchId);
      if (result) {
        setLiveMatch(result);
        // Update score from API if available
        if (result.score?.fullTime) {
          setLiveScore({
            home: result.score.fullTime.home ?? result.score.halfTime?.home ?? null,
            away: result.score.fullTime.away ?? result.score.halfTime?.away ?? null,
          });
        }
        if (result.minute) setMatchMinute(result.minute);
      }
    } catch {
      // silently fail
    }
  }, []);

  // ── Fetch WC Standings ────────────────────────────────────────
  const loadStandings = useCallback(async () => {
    try {
      const result = await fetchWCStandings();
      setStandings(result);
    } catch {
      // standings are optional
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    loadMatches();
    loadStandings();
  }, [loadMatches, loadStandings]);

  // ── Poll matches every 60s; poll live match every 30s ─────────
  useEffect(() => {
    matchTimerRef.current = setInterval(loadMatches, 60_000);
    return () => clearInterval(matchTimerRef.current);
  }, [loadMatches]);

  // ── Detect live match and start live polling ──────────────────
  useEffect(() => {
    const live = matches.find(m => m.status === 'LIVE');
    if (live) {
      loadLiveMatch(live.id);
      liveTimerRef.current = setInterval(() => loadLiveMatch(live.id), 30_000);
    } else {
      setLiveMatch(null);
      clearInterval(liveTimerRef.current);
    }
    return () => clearInterval(liveTimerRef.current);
  }, [matches, loadLiveMatch]);

  // ── Simulate match minute clock when LIVE ─────────────────────
  useEffect(() => {
    const live = matches.find(m => m.status === 'LIVE');
    if (!live) { setMatchMinute(null); return; }

    // Estimate minute from kickoff time
    const kickoff  = new Date(live.utcDate).getTime();
    const elapsed  = Math.floor((Date.now() - kickoff) / 60000);
    const startMin = Math.max(1, Math.min(90, elapsed));
    setMatchMinute(startMin);

    minuteTimerRef.current = setInterval(() => {
      setMatchMinute(prev => {
        if (prev == null) return startMin;
        if (prev >= 90) return 90;
        return prev + 1;
      });
    }, 60_000); // increment every real minute

    return () => clearInterval(minuteTimerRef.current);
  }, [matches]);

  // ── Simulate match events (goals, cards, etc.) ────────────────
  useEffect(() => {
    const live = matches.find(m => m.status === 'LIVE');
    if (!live) {
      setMatchEvents([]);
      setAtmosphere(65);
      clearInterval(eventTimerRef.current);
      return;
    }

    // Generate initial seed events based on elapsed time
    const kickoff     = new Date(live.utcDate).getTime();
    const elapsedMins = Math.floor((Date.now() - kickoff) / 60000);
    const seedCount   = Math.min(8, Math.floor(elapsedMins / 10));
    const seedEvents  = [];
    for (let i = 0; i < seedCount; i++) {
      const min = Math.floor((elapsedMins / seedCount) * i) + 1;
      seedEvents.push(generateSimEvent(live, min));
    }
    setMatchEvents(seedEvents);
    setAtmosphere(calcAtmosphere(seedEvents, 'LIVE'));

    // Simulate live event every 45s–120s
    const scheduleNextEvent = () => {
      const delay = Math.floor(Math.random() * 75_000) + 45_000;
      eventTimerRef.current = setTimeout(() => {
        setMatchMinute(prev => {
          const min = prev ?? elapsedMins;
          const newEvent = generateSimEvent(live, Math.min(90, min));
          setMatchEvents(prev2 => {
            const next = [newEvent, ...prev2].slice(0, 20); // keep last 20
            setAtmosphere(calcAtmosphere(next, 'LIVE'));
            return next;
          });
          return prev;
        });
        scheduleNextEvent();
      }, delay);
    };
    scheduleNextEvent();

    return () => {
      clearTimeout(eventTimerRef.current);
      setMatchEvents([]);
    };
  }, [matches]);

  // ── Derived: get flag emoji for a team name ────────────────────
  const getFlag = useCallback((teamName) => {
    return TEAM_FLAG_EMOJI[teamName] || '🏳️';
  }, []);

  // ── Refresh manually ─────────────────────────────────────────
  const refresh = useCallback(() => {
    setIsLoading(true);
    loadMatches();
    loadStandings();
  }, [loadMatches, loadStandings]);

  return {
    matches,
    liveMatch,
    standings,
    matchEvents,
    atmosphere,
    isLoading,
    error,
    lastUpdated,
    matchMinute,
    liveScore,
    getFlag,
    refresh,
  };
}

export default useFootballAPI;
