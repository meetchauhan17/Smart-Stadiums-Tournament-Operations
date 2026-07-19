/**
 * @module stadiums
 * @description Static venue database for FIFA World Cup 2026.
 *
 * Each entry describes one of the 10 official FIFA WC 2026 host stadiums.
 * Data is intentionally kept separate from API logic so it can be imported
 * without pulling in any fetch dependencies.
 *
 * @typedef {Object} Stadium
 * @property {string}   id          - Unique slug identifier (e.g. 'metlife')
 * @property {string}   name        - Full official venue name
 * @property {string}   shortName   - Abbreviated name used in UI labels
 * @property {string}   city        - Host city name
 * @property {string}   country     - Host country (USA | Canada | Mexico)
 * @property {number}   capacity    - Total seating capacity
 * @property {number}   lat         - Latitude for weather/map APIs
 * @property {number}   lon         - Longitude for weather/map APIs
 * @property {string}   timezone    - IANA timezone string
 * @property {string}   tier        - FIFA classification and match stage
 * @property {string}   surface     - Playing surface type
 * @property {string}   roof        - Roof configuration
 * @property {string[]} gates       - Gate letter identifiers
 * @property {string}   address     - Full postal address
 * @property {number}   openedYear  - Year the stadium was inaugurated
 */

/** @type {Stadium[]} */
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
    gates: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
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
    gates: ['A', 'B', 'C', 'D', 'E', 'F'],
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
    gates: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
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
    gates: ['A', 'B', 'C', 'D', 'E', 'F'],
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
    gates: ['A', 'B', 'C', 'D', 'E', 'F'],
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
    gates: ['A', 'B', 'C', 'D', 'E'],
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
    gates: ['A', 'B', 'C', 'D'],
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
    gates: ['A', 'B', 'C', 'D', 'E'],
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
    gates: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
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
    gates: ['A', 'B', 'C', 'D'],
    address: 'Av. de las Rosas, Guadalajara, Mexico',
    openedYear: 2010,
  },
];

/**
 * O(1) lookup map keyed by venue `id`.
 * Built once at module load time to avoid repeated array scans.
 *
 * @type {Object.<string, Stadium>}
 * @example
 * const metlife = STADIUMS_MAP['metlife']; // { id: 'metlife', name: 'MetLife Stadium', ... }
 */
export const STADIUMS_MAP = Object.fromEntries(STADIUMS.map(s => [s.id, s]));
