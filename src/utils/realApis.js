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
export async function fetchStadiumWeather(lat, lon) {
  const url = [
    'https://api.open-meteo.com/v1/forecast',
    `?latitude=${lat}&longitude=${lon}`,
    '&current=temperature_2m,relative_humidity_2m,wind_speed_10m',
    ',wind_direction_10m,weather_code,apparent_temperature,precipitation',
    '&wind_speed_unit=kmh&temperature_unit=celsius&timezone=auto',
  ].join('');

  const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
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

export async function fetchAirQuality(lat, lon) {
  const url = [
    'https://air-quality-api.open-meteo.com/v1/air-quality',
    `?latitude=${lat}&longitude=${lon}`,
    '&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide',
    '&timezone=auto',
  ].join('');

  const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
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

export async function fetchSunTimes(lat, lon) {
  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`;

  const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
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
// 5. CROWD SIMULATION — Realistic time-of-day based model
// ═══════════════════════════════════════════════════════════════

const ZONE_NAMES = ['A','B','C','D','E','F','G','H'];

/**
 * Generate realistic crowd density per zone based on the time of day
 * relative to a simulated match kickoff hour.
 *
 * @param {number} capacity  - Total stadium capacity
 * @param {boolean} matchDay - Is there a match today?
 * @param {number} [kickoffHour=19] - Kickoff hour in 24h (local time)
 * @returns {Object} zone → density (0-100)
 */
export function generateRealisticCrowd(capacity, matchDay = true, kickoffHour = 19) {
  const hour     = new Date().getHours();
  const minBefore = (kickoffHour - hour) * 60;

  let baseLoad;
  if (!matchDay) {
    // Non-match day: skeleton crew, 5-15% across zones
    baseLoad = 0.05 + Math.random() * 0.10;
  } else if (minBefore > 180) {
    // >3h before kickoff: trickle arrivals
    baseLoad = 0.08 + Math.random() * 0.10;
  } else if (minBefore > 60) {
    // 1-3h before: gates open, crowd building
    baseLoad = 0.25 + (1 - minBefore / 180) * 0.40;
  } else if (minBefore > -90) {
    // Kickoff ± 90 min: match in progress, near capacity
    baseLoad = 0.82 + Math.random() * 0.12;
  } else if (minBefore > -105) {
    // Halftime: small egress
    baseLoad = 0.75 + Math.random() * 0.10;
  } else {
    // Post-match: rapid exit
    const minsAfter = Math.abs(minBefore) - 90;
    baseLoad = Math.max(0.05, 0.90 - minsAfter * 0.012);
  }

  // Zone-specific variance: some zones fill faster (near gates, food courts)
  const ZONE_BIAS = { A: 0.05, B: 0.02, C: -0.03, D: 0.08, E: 0.04, F: -0.05, G: 0.06, H: -0.02 };

  return ZONE_NAMES.reduce((acc, zone) => {
    const bias    = ZONE_BIAS[zone] ?? 0;
    const noise   = (Math.random() - 0.5) * 0.12;
    const density = Math.round(Math.max(2, Math.min(99, (baseLoad + bias + noise) * 100)));
    acc[zone] = {
      density,
      current: Math.round(capacity * density / 100 / 8), // per-zone fans
      capacity: Math.round(capacity / 8),
      status:
        density >= 90 ? 'critical' :
        density >= 75 ? 'warning'  : 'nominal',
    };
    return acc;
  }, {});
}

// ═══════════════════════════════════════════════════════════════
// 6. COMBINED — Fetch all venue data in one call
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all real-time data for a stadium in parallel.
 * Individual failures are caught and replaced with null so the
 * rest of the app still works if one API is down.
 */
export async function fetchAllVenueData(stadium) {
  const { lat, lon } = stadium;

  const [weather, airQuality, sunTimes] = await Promise.allSettled([
    fetchStadiumWeather(lat, lon),
    fetchAirQuality(lat, lon),
    fetchSunTimes(lat, lon),
  ]);

  return {
    weather:    weather.status    === 'fulfilled' ? weather.value    : null,
    airQuality: airQuality.status === 'fulfilled' ? airQuality.value : null,
    sunTimes:   sunTimes.status   === 'fulfilled' ? sunTimes.value   : null,
  };
}
