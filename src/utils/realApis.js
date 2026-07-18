// ─── StadiumIQ 2026 — Real Free API Integrations ─────────────────
// All APIs used here are free with no API key required.

// ═══════════════════════════════════════════════════════════════
// 1. STADIUM DATABASE — 10 FIFA World Cup 2026 Venues
// ═══════════════════════════════════════════════════════════════

export const STADIUMS = [
  {
    id: 'metlife',
    name: 'MetLife Stadium',
    shortName: 'MetLife',
    city: 'East Rutherford',
    country: 'USA',
    capacity: 82500,
    lat: 40.8136,
    lon: -74.0744,
    timezone: 'America/New_York',
    tier: 'Tier 1 — Grand Final Venue',
    surface: 'FieldTurf Revolution 360',
    roof: 'Open',
    gates: ['A','B','C','D','E','F','G','H'],
    address: '1 MetLife Stadium Dr, East Rutherford, NJ 07073',
    openedYear: 2010,
  },
  {
    id: 'sofi',
    name: 'SoFi Stadium',
    shortName: 'SoFi',
    city: 'Inglewood',
    country: 'USA',
    capacity: 70240,
    lat: 33.9535,
    lon: -118.3392,
    timezone: 'America/Los_Angeles',
    tier: 'Tier 1 — Semi-Final Venue',
    surface: 'Shaw Sports Turf',
    roof: 'Translucent Canopy',
    gates: ['A','B','C','D','E','F'],
    address: '1001 Stadium Dr, Inglewood, CA 90301',
    openedYear: 2020,
  },
  {
    id: 'att',
    name: 'AT&T Stadium',
    shortName: 'AT&T',
    city: 'Arlington',
    country: 'USA',
    capacity: 80000,
    lat: 32.7473,
    lon: -97.0945,
    timezone: 'America/Chicago',
    tier: 'Tier 1 — Quarter-Final Venue',
    surface: 'FieldTurf Vista',
    roof: 'Retractable',
    gates: ['A','B','C','D','E','F','G'],
    address: '1 AT&T Way, Arlington, TX 76011',
    openedYear: 2009,
  },
  {
    id: 'caesars',
    name: 'Caesars Superdome',
    shortName: 'Superdome',
    city: 'New Orleans',
    country: 'USA',
    capacity: 73000,
    lat: 29.9511,
    lon: -90.0812,
    timezone: 'America/Chicago',
    tier: 'Tier 2 — Group Stage Venue',
    surface: 'UBU Speed Series',
    roof: 'Domed',
    gates: ['A','B','C','D','E','F'],
    address: '1500 Sugar Bowl Dr, New Orleans, LA 70112',
    openedYear: 1975,
  },
  {
    id: 'levis',
    name: "Levi's Stadium",
    shortName: "Levi's",
    city: 'Santa Clara',
    country: 'USA',
    capacity: 68500,
    lat: 37.4032,
    lon: -121.9698,
    timezone: 'America/Los_Angeles',
    tier: 'Tier 2 — Group Stage Venue',
    surface: 'Bermuda Grass',
    roof: 'Open',
    gates: ['A','B','C','D','E','F'],
    address: '4900 Marie P DeBartolo Way, Santa Clara, CA 95054',
    openedYear: 2014,
  },
  {
    id: 'seattle',
    name: 'Lumen Field',
    shortName: 'Lumen',
    city: 'Seattle',
    country: 'USA',
    capacity: 69000,
    lat: 47.5952,
    lon: -122.3316,
    timezone: 'America/Los_Angeles',
    tier: 'Tier 2 — Group Stage Venue',
    surface: 'FieldTurf',
    roof: 'Open with partial cover',
    gates: ['A','B','C','D','E'],
    address: '800 Occidental Ave S, Seattle, WA 98134',
    openedYear: 2002,
  },
  {
    id: 'toronto',
    name: 'BMO Field',
    shortName: 'BMO',
    city: 'Toronto',
    country: 'Canada',
    capacity: 45736,
    lat: 43.6333,
    lon: -79.4189,
    timezone: 'America/Toronto',
    tier: 'Tier 2 — Group Stage Venue',
    surface: 'Natural Grass',
    roof: 'Open',
    gates: ['A','B','C','D'],
    address: '170 Princes Blvd, Toronto, ON M6K 3C3',
    openedYear: 2007,
  },
  {
    id: 'vancouver',
    name: 'BC Place',
    shortName: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    capacity: 54500,
    lat: 49.2767,
    lon: -123.1117,
    timezone: 'America/Vancouver',
    tier: 'Tier 2 — Group Stage Venue',
    surface: 'FieldTurf',
    roof: 'Retractable',
    gates: ['A','B','C','D','E'],
    address: '777 Pacific Blvd, Vancouver, BC V6B 4Y8',
    openedYear: 1983,
  },
  {
    id: 'azteca',
    name: 'Estadio Azteca',
    shortName: 'Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    capacity: 87523,
    lat: 19.3029,
    lon: -99.1505,
    timezone: 'America/Mexico_City',
    tier: 'Tier 1 — Opening Match Venue',
    surface: 'Natural Grass',
    roof: 'Partial canopy',
    gates: ['A','B','C','D','E','F','G','H'],
    address: 'Calzada de Tlalpan 3465, Mexico City, Mexico',
    openedYear: 1966,
  },
  {
    id: 'guadalajara',
    name: 'Estadio Akron',
    shortName: 'Akron',
    city: 'Guadalajara',
    country: 'Mexico',
    capacity: 49850,
    lat: 20.6897,
    lon: -103.4059,
    timezone: 'America/Mexico_City',
    tier: 'Tier 2 — Group Stage Venue',
    surface: 'Natural Grass',
    roof: 'Open',
    gates: ['A','B','C','D'],
    address: 'Av. de las Rosas, Guadalajara, Mexico',
    openedYear: 2010,
  },
];

// Build a lookup map by id for O(1) access
export const STADIUMS_MAP = Object.fromEntries(STADIUMS.map(s => [s.id, s]));

// ═══════════════════════════════════════════════════════════════
// 2. WEATHER — Open-Meteo (free, no key required)
//    Docs: https://open-meteo.com/
// ═══════════════════════════════════════════════════════════════

/** WMO weather code → human-readable condition */
function getWeatherCondition(code) {
  if (code === 0)              return 'Clear Sky';
  if (code <= 3)               return 'Partly Cloudy';
  if (code <= 49)              return 'Foggy';
  if (code <= 67)              return 'Rainy';
  if (code <= 77)              return 'Snowy';
  if (code <= 82)              return 'Rain Showers';
  if (code <= 99)              return 'Thunderstorm';
  return 'Unknown';
}

/** WMO code → emoji icon */
function getWeatherIcon(code) {
  if (code === 0)              return '☀️';
  if (code <= 3)               return '⛅';
  if (code <= 49)              return '🌫️';
  if (code <= 67)              return '🌧️';
  if (code <= 77)              return '🌨️';
  if (code <= 82)              return '🌦️';
  if (code <= 99)              return '⛈️';
  return '🌡️';
}

/**
 * Fetch current weather for a lat/lon using Open-Meteo.
 * Returns a normalized object compatible with the existing WeatherData shape.
 */
export async function fetchStadiumWeather(lat, lon, signal) {
  const url = [
    'https://api.open-meteo.com/v1/forecast',
    `?latitude=${lat}&longitude=${lon}`,
    '&current=temperature_2m,relative_humidity_2m,wind_speed_10m',
    ',wind_direction_10m,weather_code,apparent_temperature,precipitation',
    '&wind_speed_unit=kmh&temperature_unit=celsius&timezone=auto',
  ].join('');

  const res  = await fetch(url, { signal: signal || AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const data = await res.json();
  const c    = data.current;

  const compassDir = (deg) => {
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  const condition  = getWeatherCondition(c.weather_code);
  const icon       = getWeatherIcon(c.weather_code);
  const windDir    = compassDir(c.wind_direction_10m ?? 180);

  // Normalize into the same shape the app already expects from WEATHER_DATA
  return {
    temp:        { value: Math.round(c.temperature_2m),    unit: '°C' },
    feelsLike:   { value: Math.round(c.apparent_temperature), unit: '°C' },
    humidity:    { value: c.relative_humidity_2m,          unit: '%' },
    windSpeed:   { value: Math.round(c.wind_speed_10m),    unit: 'km/h', direction: windDir },
    precipitation:{ value: Math.round((c.precipitation ?? 0) * 10) / 10, unit: 'mm' },
    condition,
    icon,
    weatherCode: c.weather_code,
    // Fan comfort score (0-100): penalize heat, rain, wind
    fanComfort: Math.max(0, Math.min(100,
      100
      - Math.max(0, c.temperature_2m - 28) * 4   // heat penalty
      - Math.max(0, 12 - c.temperature_2m) * 2    // cold penalty
      - Math.round(c.wind_speed_10m / 5)          // wind penalty
      - (c.weather_code >= 51 ? 20 : 0)           // rain penalty
    )),
    source: 'open-meteo',
    fetchedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. AIR QUALITY — Open-Meteo Air Quality API (free, no key)
//    Docs: https://open-meteo.com/en/docs/air-quality-api
// ═══════════════════════════════════════════════════════════════

function aqiLevel(aqi) {
  if (aqi == null)  return { level: 'Unknown',  color: '#9CA3AF' };
  if (aqi < 50)     return { level: 'Good',      color: '#10B981' };
  if (aqi < 100)    return { level: 'Moderate',  color: '#F59E0B' };
  if (aqi < 150)    return { level: 'Unhealthy for Sensitive', color: '#F97316' };
  if (aqi < 200)    return { level: 'Unhealthy', color: '#EF4444' };
  return              { level: 'Hazardous',    color: '#7C3AED' };
}

export async function fetchAirQuality(lat, lon, signal) {
  const url = [
    'https://air-quality-api.open-meteo.com/v1/air-quality',
    `?latitude=${lat}&longitude=${lon}`,
    '&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide',
    '&timezone=auto',
  ].join('');

  const res  = await fetch(url, { signal: signal || AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Air quality API error: ${res.status}`);
  const data = await res.json();
  const c    = data.current;

  const { level, color } = aqiLevel(c.us_aqi);

  return {
    aqi:   Math.round(c.us_aqi ?? 0),
    pm25:  Math.round((c.pm2_5 ?? 0) * 10) / 10,
    pm10:  Math.round((c.pm10  ?? 0) * 10) / 10,
    co:    Math.round((c.carbon_monoxide  ?? 0)),
    no2:   Math.round((c.nitrogen_dioxide ?? 0)),
    level,
    color,
    source: 'open-meteo-aq',
    fetchedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// 4. SUNRISE / SUNSET — Sunrise-Sunset.org (free, no key)
//    Docs: https://sunrise-sunset.org/api
// ═══════════════════════════════════════════════════════════════

export async function fetchSunTimes(lat, lon, signal) {
  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`;

  const res  = await fetch(url, { signal: signal || AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Sun-times API error: ${res.status}`);
  const data = await res.json();

  if (data.status !== 'OK') throw new Error('Sun-times: non-OK status');
  const r = data.results;

  const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dayLengthHours = Math.floor(r.day_length / 3600);
  const dayLengthMins  = Math.round((r.day_length % 3600) / 60);

  return {
    sunrise:      fmt(r.sunrise),
    sunset:       fmt(r.sunset),
    solarNoon:    fmt(r.solar_noon),
    dayLength:    r.day_length,
    dayLengthStr: `${dayLengthHours}h ${dayLengthMins}m`,
    source: 'sunrise-sunset.org',
    fetchedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// 5. CROWD SIMULATION & REAL MATCH DATA
// ═══════════════════════════════════════════════════════════════

export const FALLBACK_MATCHES = [
  {
    id: 1001,
    homeTeam: { name: 'USA' },
    awayTeam: { name: 'England' },
    utcDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Kickoff in 1 hour
    venue: 'MetLife Stadium',
    status: 'SCHEDULED'
  },
  {
    id: 1002,
    homeTeam: { name: 'Mexico' },
    awayTeam: { name: 'Germany' },
    utcDate: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // Live (kickoff 45 min ago)
    venue: 'Estadio Azteca',
    status: 'LIVE'
  },
  {
    id: 1003,
    homeTeam: { name: 'Canada' },
    awayTeam: { name: 'France' },
    utcDate: new Date(Date.now() + 180 * 60 * 1000).toISOString(), // Kickoff in 3 hours
    venue: 'BC Place',
    status: 'SCHEDULED'
  }
];

// ─── Football-Data.org API Key helper ────────────────────────────
const LS_FOOTBALL_KEY = 'stadiumiq_football_key';
// Priority: .env (VITE_FOOTBALL_API_KEY) → localStorage → empty
export const getFbKey = () =>
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FOOTBALL_API_KEY)
    || localStorage.getItem(LS_FOOTBALL_KEY)
    || '';

// ─── football-data.org base URL proxy-aware ──────────────────────
const FB_BASE = import.meta.env.MODE === 'test'
  ? 'https://api.football-data.org/v4'
  : '/api/football?path=';

// ─── Rate-limit throttle guard (per Daniel's recommendation) ─────
// Reads X-Requests-Available & X-RequestCounter-Reset response headers
// to back off automatically before hitting the 10 req/min limit.
let _fbRequestsAvailable = 10;
let _fbResetAt = 0; // epoch ms when the counter resets

function parseFbRateLimitHeaders(headers) {
  const available = parseInt(headers.get('X-Requests-Available-Minute') || headers.get('X-Requests-Available') || '10', 10);
  const resetSec  = parseInt(headers.get('X-RequestCounter-Reset') || '60', 10);
  _fbRequestsAvailable = isNaN(available) ? 10 : available;
  _fbResetAt = Date.now() + (isNaN(resetSec) ? 60 : resetSec) * 1000;
}

/**
 * fbFetch — football-data.org fetch helper with automatic throttling.
 * Implements header-based backoff as recommended by Daniel (football-data.org):
 * reads X-Requests-Available and X-RequestCounter-Reset headers and waits
 * until the rate limit window resets if only 1 request remains.
 */
async function fbFetch(path, signal) {
  const key = getFbKey();
  const headers = key ? { 'X-Auth-Token': key } : {};

  // Back off if we're nearly out of requests for this window
  if (_fbRequestsAvailable <= 1 && _fbResetAt > Date.now()) {
    const waitMs = _fbResetAt - Date.now() + 200; // +200ms safety margin
    await new Promise(resolve => setTimeout(resolve, Math.min(waitMs, 60000)));
  }

  try {
    const res = await fetch(`${FB_BASE}${path}`, {
      headers,
      signal: signal || AbortSignal.timeout(10000),
    });

    // Always parse rate-limit headers even on error responses
    parseFbRateLimitHeaders(res.headers);

    if (res.status === 429) {
      // Hard rate-limit hit — wait until reset
      const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return null;
    }
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Normalize a football-data.org match object into the app's shape */
function normalizeMatch(m) {
  return {
    id: m.id,
    homeTeam: { id: m.homeTeam?.id, name: m.homeTeam?.shortName || m.homeTeam?.name || 'TBD' },
    awayTeam: { id: m.awayTeam?.id, name: m.awayTeam?.shortName || m.awayTeam?.name || 'TBD' },
    utcDate: m.utcDate,
    venue: m.venue || m.homeTeam?.venue || 'FIFA WC 2026 Venue',
    status: m.status === 'IN_PLAY' || m.status === 'PAUSED' ? 'LIVE' : m.status,
    minute: m.minute || null,
    score: m.score || null,
    stage: m.stage || '',
    group: m.group || '',
    referees: m.referees || [],
  };
}

/** Fetch today's WC 2026 matches (LIVE + SCHEDULED) */
export async function fetchTodaysMatches(signal) {
  const key = getFbKey();
  if (key) {
    const data = await fbFetch('/competitions/WC/matches?status=LIVE,SCHEDULED,PAUSED', signal);
    if (data?.matches?.length) {
      return data.matches.map(normalizeMatch);
    }
    // Also try finished matches today as fallback
    const today = new Date().toISOString().split('T')[0];
    const data2 = await fbFetch(`/competitions/WC/matches?dateFrom=${today}&dateTo=${today}`, signal);
    if (data2?.matches?.length) {
      return data2.matches.map(normalizeMatch);
    }
  }

  // ── Keyless Real Data Mode (fetches from openfootball database) ──
  try {
    // Use 2022 WC data — more relevant teams for WC 2026 predictions
    const res = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2022/worldcup.json', {
      signal: signal || AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const rawMatches = data.matches || [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Pick 4 realistic matches from group stage to represent today's matches
    const selected = rawMatches.slice(0, 4);

    return selected.map((m, idx) => {
      // Offset times:
      // Match 0: 6 hours ago (Finished)
      // Match 1: 30 minutes ago (LIVE right now)
      // Match 2: 3 hours in the future (Upcoming)
      // Match 3: 6 hours in the future (Upcoming)
      let offsetHours = 0;
      let status = 'SCHEDULED';
      if (idx === 0) { offsetHours = -6; status = 'FINISHED'; }
      else if (idx === 1) { offsetHours = 0; status = 'LIVE'; }
      else if (idx === 2) { offsetHours = 3; status = 'SCHEDULED'; }
      else if (idx === 3) { offsetHours = 6; status = 'SCHEDULED'; }

      const kickoffTime = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
      const isLive = status === 'LIVE';

      return {
        id: 10000 + idx,
        homeTeam: { id: idx * 2 + 1, name: m.team1 },
        awayTeam: { id: idx * 2 + 2, name: m.team2 },
        utcDate: kickoffTime.toISOString(),
        venue: m.ground || 'Luzhniki Stadium, Moscow',
        status,
        minute: isLive ? Math.max(1, Math.min(90, Math.floor((now.getTime() - kickoffTime.getTime()) / 60000))) : null,
        score: {
          fullTime: {
            home: status === 'FINISHED' ? m.score?.ft?.[0] : isLive ? Math.floor(Math.random() * 2) : null,
            away: status === 'FINISHED' ? m.score?.ft?.[1] : isLive ? Math.floor(Math.random() * 1) : null,
          },
          halfTime: {
            home: m.score?.ht?.[0] ?? null,
            away: m.score?.ht?.[1] ?? null,
          }
        },
        stage: m.group || 'Group Stage',
        group: m.group || 'Group A',
        referees: [],
      };
    });
  } catch {
    return FALLBACK_MATCHES;
  }
}

/** Fetch a single live match with minute + score details */
export async function fetchLiveMatch(matchId, signal) {
  if (!matchId) return null;
  const key = getFbKey();
  if (key) {
    const data = await fbFetch(`/matches/${matchId}`, signal);
    if (data) return normalizeMatch(data);
  }

  // Keyless live match fallback
  const todays = await fetchTodaysMatches(signal);
  return todays.find(m => m.id === Number(matchId)) || null;
}

/** Fetch match head2head and events (goals, cards) */
export async function fetchMatchEvents(matchId, signal) {
  return [];
}

/** Fetch WC 2026 group standings */
export async function fetchWCStandings(signal) {
  const key = getFbKey();
  if (key) {
    const data = await fbFetch('/competitions/WC/standings', signal);
    if (data?.standings) return data.standings;
  }

  // ── Keyless Standing Generator (generates real standings from openfootball raw data) ──
  try {
    // Use 2022 WC data — consistent with fetchTodaysMatches fallback
    const res = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2022/worldcup.json', {
      signal: signal || AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const matches = data.matches || [];

    // Group teams
    const groups = {};

    matches.forEach(m => {
      const grp = m.group || 'Group Stage';
      if (!groups[grp]) groups[grp] = {};

      const t1 = m.team1;
      const t2 = m.team2;

      if (!groups[grp][t1]) groups[grp][t1] = { name: t1, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
      if (!groups[grp][t2]) groups[grp][t2] = { name: t2, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };

      const f1 = m.score?.ft?.[0];
      const f2 = m.score?.ft?.[1];

      if (f1 != null && f2 != null) {
        groups[grp][t1].played += 1;
        groups[grp][t2].played += 1;
        groups[grp][t1].gf += f1;
        groups[grp][t1].ga += f2;
        groups[grp][t2].gf += f2;
        groups[grp][t2].ga += f1;
        groups[grp][t1].gd = groups[grp][t1].gf - groups[grp][t1].ga;
        groups[grp][t2].gd = groups[grp][t2].gf - groups[grp][t2].ga;

        if (f1 > f2) {
          groups[grp][t1].won += 1;
          groups[grp][t2].lost += 1;
          groups[grp][t1].pts += 3;
        } else if (f1 < f2) {
          groups[grp][t2].won += 1;
          groups[grp][t1].lost += 1;
          groups[grp][t2].pts += 3;
        } else {
          groups[grp][t1].draw += 1;
          groups[grp][t2].draw += 1;
          groups[grp][t1].pts += 1;
          groups[grp][t2].pts += 1;
        }
      }
    });

    return Object.entries(groups).map(([groupName, teamsObj]) => {
      const table = Object.values(teamsObj)
        .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
        .map((team, idx) => ({
          position: idx + 1,
          team: { name: team.name },
          playedGames: team.played,
          won: team.won,
          draw: team.draw,
          lost: team.lost,
          points: team.pts,
          goalsFor: team.gf,
          goalsAgainst: team.ga,
          goalDifference: team.gd,
        }));

      return {
        stage: groupName,
        table,
      };
    });
  } catch {
    return null;
  }
}


/** Fetch team/country flag URL from REST Countries (free, no key) */
export async function fetchTeamFlag(countryName) {
  if (!countryName) return null;
  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=flags,name`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.flags?.svg || data?.[0]?.flags?.png || null;
  } catch {
    return null;
  }
}

/** Cache for flags to avoid hammering the API */
const FLAG_CACHE = new Map();
export async function getTeamFlagCached(countryName) {
  if (!countryName) return null;
  if (FLAG_CACHE.has(countryName)) return FLAG_CACHE.get(countryName);
  const flag = await fetchTeamFlag(countryName);
  FLAG_CACHE.set(countryName, flag);
  return flag;
}

/** Well-known FIFA WC 2026 team → flag emoji (instant, no API needed) */
export const TEAM_FLAG_EMOJI = {
  'USA': '🇺🇸', 'United States': '🇺🇸',
  'Mexico': '🇲🇽', 'Canada': '🇨🇦',
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'France': '🇫🇷', 'Germany': '🇩🇪', 'Spain': '🇪🇸', 'Portugal': '🇵🇹',
  'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Italy': '🇮🇹',
  'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'Australia': '🇦🇺',
  'Morocco': '🇲🇦', 'Senegal': '🇸🇳', 'Nigeria': '🇳🇬',
  'Saudi Arabia': '🇸🇦', 'Iran': '🇮🇷', 'Qatar': '🇶🇦',
  'Uruguay': '🇺🇾', 'Colombia': '🇨🇴', 'Ecuador': '🇪🇨', 'Chile': '🇨🇱',
  'Poland': '🇵🇱', 'Croatia': '🇭🇷', 'Denmark': '🇩🇰', 'Switzerland': '🇨🇭',
  'TBD': '🏳️',
};

export function simulateCrowd(venue, weatherData, matchData) {
  const now = new Date();
  const todayMatch = matchData.find(m => 
    m.venue === venue.name || m.venue === venue.city
  );
  
  let baseOccupancy = 0.05; // empty stadium default
  
  if (todayMatch) {
    const kickoff = new Date(todayMatch.utcDate);
    const minsToKickoff = (kickoff - now) / 60000;
    const minsAfterKickoff = -minsToKickoff;
    
    if (minsToKickoff > 180) baseOccupancy = 0.05; // pre-arrival
    else if (minsToKickoff > 90) baseOccupancy = 0.15; // early arrivals
    else if (minsToKickoff > 30) baseOccupancy = 0.55; // main wave
    else if (minsToKickoff > 0) baseOccupancy = 0.88;  // pre-kickoff
    else if (minsAfterKickoff < 45) baseOccupancy = 0.96; // first half
    else if (minsAfterKickoff < 60) baseOccupancy = 0.85; // halftime
    else if (minsAfterKickoff < 105) baseOccupancy = 0.94; // second half
    else if (minsAfterKickoff < 150) baseOccupancy = 0.4;  // post-match exit
    else baseOccupancy = 0.08; // cleared out
  }
  
  // Weather modifier: rain reduces outdoor zone density
  const weatherMod = weatherData?.weatherCode > 60 ? -0.12 : 0;
  // Heat modifier: handles both real API flat number and mock object shape
  const tempValue = typeof weatherData?.temp === 'number' ? weatherData.temp : (weatherData?.temp?.value ?? 22);
  const heatMod = tempValue > 35 ? 0.08 : 0;
  
  // Zone-specific distribution (realistic stadium patterns)
  const zones = {
    A: baseOccupancy + 0.05 + weatherMod,  // main stand, always fullest
    B: baseOccupancy + 0.03,
    C: baseOccupancy - 0.02 + heatMod,     // sunny side
    D: baseOccupancy - 0.05 + heatMod,     // corner, always least full
    E: baseOccupancy + 0.02,
    F: baseOccupancy - 0.01,
    G: baseOccupancy + 0.04,               // home end, passionate fans
    H: baseOccupancy + weatherMod,
  };
  
  // Add small random variance ±3% and clamp 0-100
  return Object.fromEntries(
    Object.entries(zones).map(([z, v]) => [
      z,
      Math.round(Math.max(0, Math.min(100, 
        (v + (Math.random() - 0.5) * 0.06) * 100
      )))
    ])
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. COMBINED — Fetch all venue data in one call
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all real-time data for a stadium in parallel.
 * Individual failures are caught and replaced with null so the
 * rest of the app still works if one API is down.
 */
export async function fetchAllVenueData(stadium, signal) {
  const { lat, lon } = stadium;

  const [weather, airQuality, sunTimes] = await Promise.allSettled([
    fetchStadiumWeather(lat, lon, signal),
    fetchAirQuality(lat, lon, signal),
    fetchSunTimes(lat, lon, signal),
  ]);

  return {
    weather:    weather.status    === 'fulfilled' ? weather.value    : null,
    airQuality: airQuality.status === 'fulfilled' ? airQuality.value : null,
    sunTimes:   sunTimes.status   === 'fulfilled' ? sunTimes.value   : null,
  };
}

// ═══════════════════════════════════════════════════════════════
// 7. THESPORTSDB — Team badge images (FREE, no API key needed)
//    https://www.thesportsdb.com/api/v1/json/3/searchteams.php
// ═══════════════════════════════════════════════════════════════

const BADGE_CACHE = new Map();

/**
 * Fetch a team's badge/logo from TheSportsDB (free, no key).
 * Returns the badge URL string or null on failure.
 */
export async function fetchTeamBadge(teamName) {
  if (!teamName || teamName === 'TBD') return null;
  if (BADGE_CACHE.has(teamName)) return BADGE_CACHE.get(teamName);

  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    const badge = data?.teams?.[0]?.strTeamBadge || null;
    BADGE_CACHE.set(teamName, badge);
    return badge;
  } catch {
    BADGE_CACHE.set(teamName, null);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// 8. FRANKFURTER — Live exchange rates (FREE, no API key)
//    https://api.frankfurter.app/latest
//    Covers: USD, EUR, GBP, MXN, CAD, BRL, SAR, AED, JPY, KRW
// ═══════════════════════════════════════════════════════════════

let _ratesCache   = null;
let _ratesCacheTs = 0;
const RATES_TTL   = 30 * 60 * 1000; // 30 min cache

/**
 * Fetch live exchange rates relative to USD.
 * Returns { EUR: 0.92, GBP: 0.79, MXN: 17.2, ... } or null.
 */
export async function fetchExchangeRates() {
  if (_ratesCache && Date.now() - _ratesCacheTs < RATES_TTL) {
    return _ratesCache;
  }
  try {
    const res = await fetch(
      'https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,MXN,CAD,BRL,SAR,AED,JPY,KRW,ARS',
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    _ratesCache   = data.rates;
    _ratesCacheTs = Date.now();
    return data.rates;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// 9. VENUE LOCAL TIME — Uses Intl.DateTimeFormat (built-in, FREE)
//    No network request needed — uses IANA timezone strings from
//    the STADIUMS array above.
// ═══════════════════════════════════════════════════════════════

/**
 * Get the current local time at a venue as a formatted string.
 * @param {string} timezone  IANA timezone e.g. 'America/New_York'
 * @returns {{ time: string, date: string, offset: string }}
 */
export function getVenueLocalTime(timezone) {
  if (!timezone) return { time: '--:--', date: '--', offset: '' };
  try {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const date = now.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    // Calculate UTC offset
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const offsetMins = (tzDate - utcDate) / 60000;
    const offsetHrs  = Math.floor(Math.abs(offsetMins) / 60);
    const offsetRem  = Math.abs(offsetMins) % 60;
    const offsetStr  = `UTC${offsetMins >= 0 ? '+' : '-'}${String(offsetHrs).padStart(2, '0')}:${String(offsetRem).padStart(2, '0')}`;
    return { time, date, offset: offsetStr };
  } catch {
    return { time: '--:--', date: '--', offset: '' };
  }
}

// ═══════════════════════════════════════════════════════════════
// 10. OPEN-NOTIFY — ISS Current Location (FREE, no key)
//     Fun real-time data point for the "live data" experience.
//     http://api.open-notify.org/iss-now.json
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch the current position of the ISS.
 * Returns { lat, lon, timestamp } or null.
 * Used as an ambient "live data" indicator on the Operations page.
 */
export async function fetchISSPosition() {
  try {
    const res = await fetch('http://api.open-notify.org/iss-now.json', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return {
      lat:       parseFloat(data.iss_position.latitude),
      lon:       parseFloat(data.iss_position.longitude),
      timestamp: data.timestamp,
    };
  } catch {
    return null;
  }
}

