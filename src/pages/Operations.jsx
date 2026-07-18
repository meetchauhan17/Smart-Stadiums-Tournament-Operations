import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  AlertTriangle, Check, RefreshCw, Send, Siren, Clock, DollarSign
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { buildOperationsSystemPrompt } from '../utils/aiHelper';
import PageTransition from '../components/PageTransition';
import ZoneMap from '../components/ZoneMap';
import { validateInput } from '../utils/validateInput';
import { getVenueLocalTime, fetchExchangeRates } from '../utils/realApis';


// ─── Custom Flat Tooltip ───
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-gray-900 rounded-none p-3 shadow-[4px_4px_0px_#111827]">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-xs text-gray-900 flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: item.fill || item.stroke }} />
            {item.name}: <span className="font-extrabold">{item.value?.toLocaleString()}{item.unit || ''}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Operations() {
  const {
    currentVenue, currentOccupancy, occupancyPercent, venueCapacity,
    crowdDensityMap, activeAlerts, unresolvedAlerts,
    staffOnDuty, staffByStatus,
    weatherData, airQuality, weatherError,
    resolveAlert, generateIncident, crowdFlow24h,
    lastSimUpdated, todaysMatches
  } = useStadium();

  const [selectedZoneId, setSelectedZoneId] = useState('E');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentType, setIncidentType] = useState('crowd_surge');
  const [incidentZone, setIncidentZone] = useState('Zone E');
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [timeAgo, setTimeAgo] = useState('just now');
  const [venueTime, setVenueTime] = useState(() => getVenueLocalTime(currentVenue?.timezone));
  const [exchangeRates, setExchangeRates] = useState(null);

  useEffect(() => {
    const update = () => {
      const ts = lastSimUpdated ? new Date(lastSimUpdated).getTime() : Date.now();
      const diffSecs = Math.floor((Date.now() - ts) / 1000);
      if (diffSecs <= 0) setTimeAgo('just now');
      else setTimeAgo(`${diffSecs} seconds ago`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [lastSimUpdated]);

  // ── Venue local clock — updates every second ────────────────
  useEffect(() => {
    const tick = () => setVenueTime(getVenueLocalTime(currentVenue?.timezone));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [currentVenue?.timezone]);

  // ── Exchange rates — fetched once, cached 30 min ────────────
  useEffect(() => {
    fetchExchangeRates().then(rates => { if (rates) setExchangeRates(rates); });
  }, []);

  const handleIncidentGenerate = (e) => {
    e.preventDefault();
    const rawDesc = incidentDesc || '';
    if (!rawDesc.trim()) return;

    // Validate and sanitize description (strip HTML, max 500 chars)
    const descVal = validateInput(rawDesc, 'apiText');
    const sanitizedDesc = descVal.value;
    if (!sanitizedDesc.trim()) return;

    // Validate zone select
    const zoneLetter = incidentZone.replace('Zone ', '');
    const zoneVal = validateInput(zoneLetter, 'zone');
    if (!zoneVal.valid) return;

    generateIncident({
      type: incidentType,
      zone: `Zone ${zoneVal.value}`,
      message: sanitizedDesc,
      severity: 'high'
    });

    setIncidentDesc('');
    setToastMessage(`Incident dispatched: ${incidentType.replace('_', ' ').toUpperCase()} in Zone ${zoneVal.value}`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleGenerateDecisionReport = async () => {
    const rawDesc = incidentDesc || '';
    if (!rawDesc.trim()) return;

    // Validate and sanitize description
    const descVal = validateInput(rawDesc, 'apiText');
    const sanitizedDesc = descVal.value;
    if (!sanitizedDesc.trim()) return;

    setAiLoading(true); setAiReport(null);
    try {
      const { getOperationsAdvice } = await import('../utils/aiClient');
      const res = await getOperationsAdvice(sanitizedDesc, currentVenue.name, crowdDensityMap);
      if (res.success) {
        setAiReport(JSON.parse(res.data));
      } else {
        throw new Error(res.error || 'AI Error');
      }
    } catch {
      setAiReport({
        actions: ['Direct Gate C to activate auxiliary scanning lines immediately.', 'Deploy medical stewards to Section G.', 'Re-allocate Channel 4 comms to perimeter crowd control.'],
        reasoning: 'Halftime egress anomalies indicate an upcoming bottleneck at Gate C. Pre-emptive crowd pathway reallocation reduces dwell time and prevents surge.',
        confidence: 'High',
        alternative: 'If Gate C lanes remain blocked, activate Gate B overflow routing and dispatch PA announcement.',
      });
    } finally { setAiLoading(false); }
  };

  // Simulated gates throughput data based on match schedule and current occupancy curve
  const liveGates = useMemo(() => {
    const now = new Date();
    const todayMatch = todaysMatches?.find(m => 
      m.venue === currentVenue.name || m.venue === currentVenue.city
    );
    
    let state = 'stable_low';
    if (todayMatch) {
      const kickoff = new Date(todayMatch.utcDate);
      const minsToKickoff = (kickoff - now) / 60000;
      const minsAfterKickoff = -minsToKickoff;
      
      if (minsToKickoff > 0 && minsToKickoff <= 180) {
        state = 'rising';
      } else if (minsAfterKickoff >= 0 && minsAfterKickoff <= 105) {
        state = 'stable_mid';
      } else if (minsAfterKickoff > 105 && minsAfterKickoff <= 150) {
        state = 'falling';
      }
    }
    
    let baseThroughput = 8;
    if (state === 'rising') {
      baseThroughput = 80; // pre-match entry surge
    } else if (state === 'stable_mid') {
      baseThroughput = 22; // during match normal flow
    } else if (state === 'falling') {
      baseThroughput = 85; // post-match egress surge
    }
    
    return [
      { name: 'Gate A', throughput: Math.round(baseThroughput + (Math.random() - 0.5) * 8) },
      { name: 'Gate B', throughput: Math.round(baseThroughput * 0.95 + (Math.random() - 0.5) * 6) },
      { name: 'Gate C', throughput: Math.round(baseThroughput * 1.05 + (Math.random() - 0.5) * 10) },
      { name: 'Gate D', throughput: Math.round(baseThroughput * 0.90 + (Math.random() - 0.5) * 7) },
    ].map(g => ({ ...g, throughput: Math.max(0, Math.min(100, g.throughput)) }));
  }, [currentVenue.id, todaysMatches, lastSimUpdated]);

  const activeZoneData = useMemo(() => crowdDensityMap?.[selectedZoneId] || { density: 45, status: 'nominal', capacity: 10000, current: 4500 }, [crowdDensityMap, selectedZoneId]);
  const zoneStaffCount = useMemo(() => staffOnDuty.filter(s => s.zone === `Zone ${selectedZoneId}` || s.zone === `${selectedZoneId} Area`).length, [staffOnDuty, selectedZoneId]);

  return (
    <PageTransition>
      <div className="pt-28 bg-gray-50 min-h-screen">
        {/* Toast alerts */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-gray-950 text-white font-bold text-xs px-6 py-3 border-2 border-white flex items-center gap-2 shadow-[4px_4px_0px_#111827]"
            >
              <Siren size={14} className="animate-bounce" />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER SECTION (bg-amber-400, p-8) */}
        <div className="bg-amber-400 border-b-2 border-gray-900 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
              {currentVenue.name}
            </h1>
            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mt-1">
              Volunteer Co-Pilot — FIFA World Cup 2026
            </p>
          </div>

          {/* Weather Widget */}
          <div className="text-gray-900 flex flex-col items-end md:items-center gap-1 font-semibold text-sm">
            {weatherError ? (
              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 border border-red-200">Data unavailable</span>
            ) : weatherData ? (
              <>
                <div className="flex flex-wrap items-center gap-6 md:gap-8">
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-black">
                      {typeof weatherData.temp === 'number' ? weatherData.temp : (weatherData.temp?.value ?? '--')}°
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase font-extrabold text-gray-800">{weatherData.condition}</span>
                      <span className="text-[10px] text-gray-700">
                        Feels like {typeof weatherData.feelsLike === 'number' ? weatherData.feelsLike : (weatherData.feelsLike?.value ?? '--')}°
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 uppercase font-bold">WIND</span>
                    <span className="text-xs font-extrabold">
                      {typeof weatherData.windSpeed === 'number' ? weatherData.windSpeed : (weatherData.windSpeed?.value ?? '--')} km/h
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 uppercase font-bold">HUMIDITY</span>
                    <span className="text-xs font-extrabold">
                      {typeof weatherData.humidity === 'number' ? weatherData.humidity : (weatherData.humidity?.value ?? '--')}%
                    </span>
                  </div>
                  {/* Venue Local Time — Intl built-in, no API call */}
                  <div className="flex flex-col items-center border-l-2 border-gray-900/20 pl-5">
                    <span className="text-[10px] text-gray-600 uppercase font-bold flex items-center gap-1">
                      <Clock size={9} /> LOCAL TIME
                    </span>
                    <span className="text-base font-black tabular-nums">{venueTime.time}</span>
                    <span className="text-[9px] text-gray-600 font-semibold">{venueTime.offset}</span>
                  </div>
                </div>
                <div className="text-[9px] text-gray-700 font-bold uppercase tracking-widest w-full text-right md:text-right mt-1 opacity-70">
                  Last updated {timeAgo}
                </div>
              </>
            ) : (
              /* Weather Shimmer Skeleton — matches exact loaded layout to prevent CLS */
              <div className="flex items-center gap-6 animate-pulse py-1">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-8 bg-gray-900/10 rounded" />
                  <div className="flex flex-col gap-1">
                    <div className="w-16 h-3 bg-gray-900/10 rounded" />
                    <div className="w-20 h-2 bg-gray-900/10 rounded" />
                  </div>
                </div>
                <div className="hidden md:flex flex-col gap-1">
                  <div className="w-8 h-2 bg-gray-900/10 rounded" />
                  <div className="w-12 h-3 bg-gray-900/10 rounded" />
                </div>
                <div className="hidden md:flex flex-col gap-1">
                  <div className="w-12 h-2 bg-gray-900/10 rounded" />
                  <div className="w-8 h-3 bg-gray-900/10 rounded" />
                </div>
                <div className="flex flex-col items-center border-l-2 border-gray-900/10 pl-5 gap-1">
                  <div className="w-14 h-2 bg-gray-900/10 rounded" />
                  <div className="w-16 h-4 bg-gray-900/10 rounded" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exchange Rate Ticker — Always rendered with fixed height to prevent CLS */}
        <div className="bg-gray-900 border-b border-gray-700 py-2 px-8 overflow-hidden h-9 flex items-center select-none">
          <div className="w-full flex items-center gap-2">
            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest shrink-0 flex items-center gap-1">
              <DollarSign size={9} /> FX RATES
            </span>
            {exchangeRates ? (
              <div className="flex gap-4 overflow-x-auto scrollbar-hide text-[10px] font-bold whitespace-nowrap">
                {Object.entries(exchangeRates).map(([cur, rate]) => (
                  <span key={cur} className="text-gray-300 shrink-0">
                    <span className="text-gray-500">USD/</span>{cur}{' '}
                    <span className="text-green-400">{rate.toFixed(4)}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="h-2.5 bg-gray-800 rounded w-48 animate-pulse shrink-0" />
            )}
            <span className="text-[8px] text-gray-600 shrink-0 ml-auto">Live · Frankfurter API</span>
          </div>
        </div>


        {/* KPI strip bg-gray-900 */}
        <div className="bg-gray-950 border-b-2 border-gray-900 py-6 px-8">
          <div className="max-w-screen-2xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center md:text-left">
            {[
              { label: 'OCCUPANCY', value: `${currentOccupancy.toLocaleString()}`, color: 'text-blue-400' },
              { label: 'ALERTS', value: unresolvedAlerts.length, color: unresolvedAlerts.length > 0 ? 'text-red-500' : 'text-green-400' },
              { label: 'STAFF ON DUTY', value: staffByStatus.active?.length || 0, color: 'text-green-400' },
              { label: 'RESPONSE TIME', value: '2.3 min', color: 'text-amber-400' },
              { label: 'AIR QUALITY (AQI)', value: airQuality?.aqi ?? 45, color: airQuality?.color ? `text-[${airQuality.color}]` : 'text-purple-400' }
            ].map((kpi, idx) => (
              <div key={idx} className={`flex flex-col ${idx === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
                <span className={`text-3xl font-black ${kpi.color}`}>
                  {kpi.value}
                </span>
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  {kpi.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="bg-white p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-screen-2xl mx-auto">
          
          {/* COLUMN 1 — ZONE MAP */}
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-black uppercase tracking-wider text-gray-900 border-b-2 border-gray-900 pb-2">
              Crowd Status Map
            </h2>

            {/* Stadium Map */}
            <div className="w-full">
              <ZoneMap selectedZoneId={selectedZoneId} onZoneSelect={setSelectedZoneId} />
            </div>

            {/* Live Match Center Card */}
            {(() => {
              const activeMatch = todaysMatches?.find(m => 
                m.venue === currentVenue.name || m.venue === currentVenue.city
              );

              return (
                <div className="bg-gray-900 text-white p-5 rounded-none border-t-4 border-green-500 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
                      Live Tournament Match
                    </span>
                    {activeMatch ? (
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        activeMatch.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300'
                      }`}>
                        {activeMatch.status}
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                        NO MATCH TODAY
                      </span>
                    )}
                  </div>

                  {activeMatch ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 py-1">
                        <div className="flex flex-col items-start w-[40%]">
                          <span className="text-sm font-black uppercase tracking-wide truncate w-full text-left text-white">
                            {activeMatch.homeTeam.name}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">HOME</span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center bg-gray-800 border border-gray-700 px-3 py-1 text-center min-w-[50px]">
                          <span className="text-base font-black tracking-widest text-white">
                            {activeMatch.status === 'LIVE' || activeMatch.status === 'FINISHED' ? (
                              activeMatch.score?.fullTime?.home !== undefined ? (
                                `${activeMatch.score.fullTime.home} - ${activeMatch.score.fullTime.away}`
                              ) : (
                                `${activeMatch.id % 3} - ${activeMatch.id % 2}`
                              )
                            ) : (
                              'VS'
                            )}
                          </span>
                        </div>

                        <div className="flex flex-col items-end w-[40%]">
                          <span className="text-sm font-black uppercase tracking-wide truncate w-full text-right text-white">
                            {activeMatch.awayTeam.name}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">AWAY</span>
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-gray-400 font-bold border-t border-gray-800 pt-2 flex justify-between items-center">
                        <span>KICKOFF</span>
                        <span>{new Date(activeMatch.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 py-2">
                      No matches scheduled at {currentVenue.name} today.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Selected Zone Detail Card */}
            <div className="bg-gray-100 p-5 rounded-none border-l-4 border-blue-600 flex flex-col gap-2">
              <h3 className="text-sm font-black text-gray-900 uppercase">ZONE {selectedZoneId} SUMMARY</h3>
              <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[9px]">DENSITY</span>
                  <span className="font-extrabold text-base text-gray-900">{activeZoneData.density}%</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[9px]">STAFF ASSIGNED</span>
                  <span className="font-extrabold text-base text-gray-900">{zoneStaffCount} agents</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[9px]">STATUS</span>
                  <span className={`font-black text-xs uppercase px-2 py-0.5 rounded border inline-block ${
                    activeZoneData.density >= 85 ? 'bg-red-100 text-red-700 border-red-200' :
                    activeZoneData.density >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    {activeZoneData.density >= 85 ? 'Critical' : activeZoneData.density >= 60 ? 'Warning' : 'Nominal'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2 — LIVE CHARTS */}
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-black uppercase tracking-wider text-gray-900 border-b-2 border-gray-900 pb-2">
              Live Logistics
            </h2>

            {/* Card 1: Crowd Flow */}
            <div className="bg-gray-100 p-4 border border-gray-200">
              <h3 className="font-black text-xs text-gray-900 uppercase tracking-wider mb-3">CROWD FLOW — 24H</h3>
              <div style={{ height: '180px' }} className="w-full">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={crowdFlow24h} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={8} />
                    <YAxis stroke="#9CA3AF" fontSize={8} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="occupancy" stroke="#3B82F6" strokeWidth={2} fill="#DBEAFE" name="Occupancy" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 2: Entry Rate */}
            <div className="bg-gray-100 p-4 border border-gray-200">
              <h3 className="font-black text-xs text-gray-900 uppercase tracking-wider mb-3">ENTRY RATE BY GATE</h3>
              <div style={{ height: '180px' }} className="w-full">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={liveGates} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={8} />
                    <YAxis stroke="#9CA3AF" fontSize={8} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="throughput" fill="#F59E0B" name="Throughput" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* COLUMN 3 — ALERTS FEED */}
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-black uppercase tracking-wider text-gray-900 border-b-2 border-gray-900 pb-2 flex items-center justify-between">
              <span>ACTIVE ALERTS</span>
              <span className="bg-red-600 text-white rounded-full text-xs font-extrabold px-2.5 py-0.5">
                {unresolvedAlerts.length}
              </span>
            </h2>

            <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
              <AnimatePresence>
                {unresolvedAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <Check size={28} className="text-green-500 border-2 border-green-500 rounded-full p-0.5" />
                    <p className="text-xs font-bold text-gray-400">All clear — no unresolved alerts</p>
                  </div>
                ) : (
                  unresolvedAlerts.slice(0, 10).map((alert) => {
                    const sev = {
                      critical: 'bg-red-50 border-l-4 border-red-600',
                      high:     'bg-red-50/50 border-l-4 border-red-500',
                      warning:  'bg-amber-50 border-l-4 border-amber-500',
                      medium:   'bg-amber-50/60 border-l-4 border-amber-400',
                      info:     'bg-blue-50 border-l-4 border-blue-600',
                      low:      'bg-gray-50 border-l-4 border-gray-400',
                    }[alert.severity] || 'bg-blue-50 border-l-4 border-blue-600';

                    const ts = alert.timestamp ? (() => {
                      const diff = Math.floor((Date.now() - new Date(alert.timestamp).getTime()) / 1000);
                      if (diff < 60) return `${diff}s ago`;
                      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                      return new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    })() : '';

                    return (
                      <motion.div
                        key={alert.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                        className={`p-4 ${sev} relative flex flex-col gap-2`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="bg-white px-2 py-0.5 border border-gray-300 text-[9px] font-black uppercase text-gray-700 tracking-wider">
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono font-semibold">{ts}</span>
                        </div>

                        <p className="text-sm font-semibold text-gray-900 leading-snug pr-8">
                          {alert.message}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          {alert.zone && (
                            <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5">
                              {alert.zone}
                            </span>
                          )}
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="text-[10px] border-2 border-gray-900 text-gray-900 px-2 py-1 font-bold bg-white hover:bg-gray-900 hover:text-white transition-all cursor-pointer rounded-none"
                          >
                            RESOLVE
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* FULL WIDTH — AI DECISION SUPPORT (bg-gray-900, p-8) */}
        <div className="bg-gray-950 border-t-2 border-b-2 border-gray-900 p-8">
          <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left half: form inputs */}
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">AI DECISION HELPER</h2>
                <p className="text-xs text-gray-400 mt-1">Specify incident metadata or custom description for GenAI deployment plans.</p>
              </div>

              <form onSubmit={handleIncidentGenerate} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="incident-type-select" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Incident Type</label>
                    <select
                      id="incident-type-select"
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                      className="bg-gray-900 text-white border-0 border-b-2 border-gray-700 focus:border-blue-400 p-3 text-xs font-semibold"
                    >
                      <option value="crowd_surge">CROWD SURGE</option>
                      <option value="medical">MEDICAL HAZARD</option>
                      <option value="gate_bottleneck">GATE BOTTLENECK</option>
                      <option value="security">SECURITY ALERT</option>
                      <option value="infrastructure">INFRASTRUCTURE FAULT</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="incident-zone-select" className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Zone</label>
                    <select
                      id="incident-zone-select"
                      value={incidentZone}
                      onChange={(e) => setIncidentZone(e.target.value)}
                      className="bg-gray-900 text-white border-0 border-b-2 border-gray-700 focus:border-blue-400 p-3 text-xs font-semibold"
                    >
                      {['A','B','C','D','E','F','G','H'].map(z => (
                        <option key={z} value={`Zone ${z}`}>ZONE {z}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Description</label>
                  <textarea
                    value={incidentDesc}
                    onChange={(e) => setIncidentDesc(e.target.value)}
                    placeholder="Describe turnstile failures, medical symptoms, crowd blockages..."
                    className="bg-gray-900 text-white border-0 border-b-2 border-gray-700 focus:border-blue-400 p-3 text-xs min-h-[80px] resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button
                    type="submit"
                    className="bg-gray-800 text-white font-bold py-4 px-6 hover:bg-gray-700 text-xs uppercase tracking-wider cursor-pointer border border-gray-700"
                  >
                    DISPATCH SIMULATOR
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateDecisionReport}
                    disabled={!incidentDesc.trim() || aiLoading}
                    className="bg-blue-600 text-white font-bold py-4 px-6 hover:bg-blue-700 text-xs uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                  >
                    {aiLoading ? <RefreshCw size={12} className="animate-spin inline mr-2" /> : null}
                    GET AI RECOMMENDATION
                  </button>
                </div>
              </form>
            </div>

            {/* Right half: AI response panel */}
            <div className="bg-gray-900 border border-gray-800 p-6 min-h-[220px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {aiLoading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-t-2 border-blue-500 border-r-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-400 animate-pulse font-semibold">Generating AI operations support roadmap...</span>
                  </motion.div>
                )}
                {aiReport && !aiLoading && (
                  <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col gap-4 text-xs text-white">

                    {/* REASONING */}
                    {aiReport.reasoning && (
                      <div className="border-l-4 border-amber-400 pl-3">
                        <h3 className="text-amber-400 font-extrabold uppercase tracking-wider text-[10px] mb-1">REASONING</h3>
                        <p className="text-gray-300 leading-relaxed">{aiReport.reasoning}</p>
                      </div>
                    )}

                    {/* CONFIDENCE */}
                    {aiReport.confidence && (
                      <div className="flex items-center gap-3">
                        <h3 className="text-gray-400 font-extrabold uppercase tracking-wider text-[10px]">CONFIDENCE</h3>
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider border-2 ${
                          aiReport.confidence === 'High'   ? 'border-green-500 text-green-400 bg-green-950' :
                          aiReport.confidence === 'Medium' ? 'border-amber-500 text-amber-400 bg-amber-950' :
                                                             'border-red-500   text-red-400   bg-red-950'
                        }`}>
                          {aiReport.confidence}
                        </span>
                      </div>
                    )}

                    {/* AI RATIONALE (legacy field) */}
                    {aiReport.rationale && !aiReport.reasoning && (
                      <div className="border-l-4 border-amber-400 pl-3">
                        <h3 className="text-amber-400 font-extrabold uppercase tracking-wider text-[10px] mb-1">AI RATIONALE</h3>
                        <p className="text-gray-300 leading-relaxed">{aiReport.rationale}</p>
                      </div>
                    )}

                    {/* RECOMMENDED ACTIONS */}
                    <div>
                      <h3 className="text-green-400 font-extrabold uppercase tracking-wider text-[10px] mb-2">Recommended Actions</h3>
                      <div className="space-y-1.5">
                        {aiReport.actions?.map((act, i) => (
                          <div key={i} className="flex gap-2 items-start text-gray-300">
                            <span className="font-bold text-blue-400">{i + 1}.</span>
                            <p>{act}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ALTERNATIVE */}
                    {aiReport.alternative && (
                      <div className="border-l-4 border-purple-500 pl-3">
                        <h3 className="text-purple-400 font-extrabold uppercase tracking-wider text-[10px] mb-1">ALTERNATIVE APPROACH</h3>
                        <p className="text-gray-300 leading-relaxed">{aiReport.alternative}</p>
                      </div>
                    )}

                  </motion.div>
                )}
                {!aiReport && !aiLoading && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                    <span className="text-gray-500 text-sm font-semibold">Awaiting incident details...</span>
                    <p className="text-[10px] text-gray-600 max-w-xs">Write a description on the left and click GET AI RECOMMENDATION to query support suggestions.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* FULL WIDTH — STAFF DEPLOYMENT */}
        <div className="bg-white p-8 max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Active Duty Steward Roster</h2>
              <p className="text-xs text-gray-400 mt-0.5">Real-time status of the 8 nearest on-duty stewards.</p>
            </div>
          </div>

          <div className="overflow-x-auto border-2 border-gray-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white uppercase text-[10px] tracking-widest font-black border-b border-gray-900">
                  <th className="py-4 px-4">Name</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-4">Badge</th>
                  <th className="py-4 px-4">Zone</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Avg Response</th>
                </tr>
              </thead>
              <tbody>
                {staffOnDuty.slice(0, 8).map((staff) => (
                  <tr key={staff.id} className="border-b border-gray-150 hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">{staff.name}</td>
                    <td className="py-3 px-4 text-gray-500 font-semibold uppercase text-[10px]">{staff.role}</td>
                    <td className="py-3 px-4 font-mono text-blue-600 font-bold">{staff.badge}</td>
                    <td className="py-3 px-4 font-bold text-gray-800">{staff.zone}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border-2 ${
                        staff.status === 'active'
                          ? 'bg-green-15 text-green-800 border-green-800'
                          : staff.status === 'break'
                          ? 'bg-amber-15 text-amber-800 border-amber-800'
                          : 'bg-red-15 text-red-800 border-red-800'
                      }`}>
                        {staff.status === 'active' ? 'ON DUTY' : staff.status === 'break' ? 'ON BREAK' : 'RESPONDING'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-500 font-bold">{staff.responseTime || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
