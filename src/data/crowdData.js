// ─── Simulated Real-Time Crowd Data ──────────────────────────────

// Zone density levels: 0 (empty) → 1 (full)
export const generateCrowdZones = (baseOccupancy = 0.75) => {
  const zones = [
    { id: 'north', name: 'North Stand',  capacity: 22000, color: '#FF6B35' },
    { id: 'south', name: 'South Stand',  capacity: 22000, color: '#F7C59F' },
    { id: 'east',  name: 'East Stand',   capacity: 18000, color: '#EFEFD0' },
    { id: 'west',  name: 'West Stand',   capacity: 18000, color: '#004E89' },
    { id: 'vip',   name: 'VIP Boxes',    capacity: 2500,  color: '#1A936F' },
    { id: 'media', name: 'Media Zone',   capacity: 500,   color: '#88D498' },
  ];

  return zones.map(z => {
    const jitter = (Math.random() - 0.5) * 0.25;
    const density = Math.max(0.1, Math.min(1, baseOccupancy + jitter));
    const current = Math.floor(z.capacity * density);
    return {
      ...z,
      current,
      density,
      status: density > 0.9 ? 'critical' : density > 0.75 ? 'high' : density > 0.5 ? 'moderate' : 'low',
    };
  });
};

// Time-series crowd flow data (entry/exit over event timeline)
export const generateCrowdTimeline = () => {
  const hours = [];
  const baseHours = [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5];
  const entryPattern  = [200, 800, 2400, 5600, 8200, 4100, 800, 200, 100, 50, 30, 10];
  const exitPattern   = [0,   0,   100,  200,  300,  500,  1200, 600, 400, 900, 12000, 28000];

  baseHours.forEach((h, i) => {
    const noise = () => Math.floor((Math.random() - 0.5) * 400);
    hours.push({
      time: `${h >= 0 ? '+' : ''}${h}h`,
      entry: Math.max(0, entryPattern[i] + noise()),
      exit:  Math.max(0, exitPattern[i] + noise()),
      net:   entryPattern[i] - exitPattern[i],
    });
  });
  return hours;
};

// Heatmap grid: 10×10 grid representing stadium sections
export const generateHeatmapGrid = (baseTemp = 0.72) => {
  const grid = [];
  for (let row = 0; row < 10; row++) {
    const rowData = [];
    for (let col = 0; col < 10; col++) {
      // Center (field) is always low; outer ring is packed
      const distFromCenter = Math.sqrt(Math.pow(row - 4.5, 2) + Math.pow(col - 4.5, 2));
      const fieldInfluence = distFromCenter < 2.5 ? 0 : 1;
      const jitter = (Math.random() - 0.5) * 0.3;
      const value = fieldInfluence === 0 ? 0 : Math.max(0.1, Math.min(1, baseTemp + jitter));
      rowData.push(value);
    }
    grid.push(rowData);
  }
  return grid;
};

// Concession wait time data
export const CONCESSION_QUEUES = [
  { id: 'cc1', name: 'Concourse A - Bar 1', waitMin: 3, capacity: 6, current: 18, type: 'drinks' },
  { id: 'cc2', name: 'Concourse A - Food 1', waitMin: 8, capacity: 4, current: 32, type: 'food' },
  { id: 'cc3', name: 'Concourse B - Bar 1', waitMin: 1, capacity: 6, current: 6, type: 'drinks' },
  { id: 'cc4', name: 'Concourse B - Food 1', waitMin: 12, capacity: 4, current: 48, type: 'food' },
  { id: 'cc5', name: 'Concourse C - Bar 1', waitMin: 2, capacity: 6, current: 12, type: 'drinks' },
  { id: 'cc6', name: 'VIP Lounge - Service', waitMin: 0, capacity: 8, current: 2, type: 'vip' },
  { id: 'cc7', name: 'Concourse D - Bar 1', waitMin: 15, capacity: 4, current: 60, type: 'drinks' },
  { id: 'cc8', name: 'Concourse D - Food 1', waitMin: 5, capacity: 4, current: 20, type: 'food' },
];

// Entry gate throughput
export const GATE_THROUGHPUT = [
  { id: 'g1', name: 'Gate A', throughput: 850, capacity: 1000, status: 'normal', waitMin: 4 },
  { id: 'g2', name: 'Gate B', throughput: 980, capacity: 1000, status: 'busy', waitMin: 8 },
  { id: 'g3', name: 'Gate C', throughput: 420, capacity: 1000, status: 'normal', waitMin: 2 },
  { id: 'g4', name: 'Gate D', throughput: 1050, capacity: 1000, status: 'critical', waitMin: 14 },
  { id: 'g5', name: 'Gate E', throughput: 730, capacity: 1000, status: 'normal', waitMin: 5 },
  { id: 'g6', name: 'VIP Gate', throughput: 180, capacity: 300, status: 'normal', waitMin: 1 },
];

// Historical crowd density over 12 hours
export const HOURLY_DENSITY = Array.from({ length: 12 }, (_, i) => ({
  hour: `${14 + i}:00`,
  density: [12, 28, 45, 62, 78, 88, 92, 89, 85, 72, 45, 18][i],
  alerts: [0, 0, 0, 1, 2, 3, 4, 2, 1, 0, 0, 0][i],
  incidents: [0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0][i],
}));

// Security alerts mock data
export const SECURITY_ALERTS = [
  { id: 'sa1', type: 'crowd_surge', severity: 'critical', location: 'Gate D', message: 'Crowd density exceeding safe threshold at Gate D entry', time: '2026-07-07T15:12:00Z', resolved: false },
  { id: 'sa2', type: 'medical', severity: 'warning', location: 'Section 12, Row F', message: 'Medical assistance requested — spectator unwell', time: '2026-07-07T15:08:00Z', resolved: false },
  { id: 'sa3', type: 'queue_overflow', severity: 'warning', location: 'Concourse D - Bar 1', message: 'Queue length exceeding 60 persons — staffing increase recommended', time: '2026-07-07T15:05:00Z', resolved: true },
  { id: 'sa4', type: 'perimeter', severity: 'info', location: 'North Perimeter', message: 'Unauthorized access attempt — security responded', time: '2026-07-07T14:55:00Z', resolved: true },
  { id: 'sa5', type: 'ai_anomaly', severity: 'warning', location: 'South Stand', message: 'AI detected unusual movement pattern — monitoring', time: '2026-07-07T14:50:00Z', resolved: false },
];
