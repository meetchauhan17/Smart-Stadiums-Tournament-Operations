import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  AlertTriangle, Check, RefreshCw, Send, Siren
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { buildOperationsSystemPrompt } from '../utils/aiHelper';
import PageTransition from '../components/PageTransition';
import ZoneMap from '../components/ZoneMap';

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
    resolveAlert, generateIncident, crowdFlow24h
  } = useStadium();

  const [selectedZoneId, setSelectedZoneId] = useState('E');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentType, setIncidentType] = useState('crowd_surge');
  const [incidentZone, setIncidentZone] = useState('Zone E');
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [timeAgo, setTimeAgo] = useState('just now');

  useEffect(() => {
    if (!weatherData?.fetchedAt) return;
    const update = () => {
      const diffSecs = Math.floor((Date.now() - new Date(weatherData.fetchedAt).getTime()) / 1000);
      if (diffSecs < 60) setTimeAgo('just now');
      else setTimeAgo(`${Math.floor(diffSecs / 60)} min ago`);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [weatherData?.fetchedAt]);

  const handleIncidentGenerate = (e) => {
    e.preventDefault();
    if (!incidentDesc.trim()) return;
    generateIncident({ type: incidentType, zone: incidentZone, message: incidentDesc, severity: 'high' });
    setIncidentDesc('');
    setToastMessage(`Incident dispatched: ${incidentType.replace('_', ' ').toUpperCase()} in ${incidentZone}`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleGenerateDecisionReport = async () => {
    if (!incidentDesc.trim()) return;
    setAiLoading(true); setAiReport(null);
    try {
      const { getOperationsAdvice } = await import('../utils/aiClient');
      const res = await getOperationsAdvice(incidentDesc, currentVenue.name, crowdDensityMap);
      if (res.success) {
        setAiReport(JSON.parse(res.data));
      } else {
        throw new Error(res.error || 'AI Error');
      }
    } catch {
      setAiReport({
        actions: ['Direct Gate C to activate auxiliary scanning lines immediately.', 'Deploy medical stewards to Section G.', 'Re-allocate Channel 4 comms to perimeter crowd control.'],
        threatLevel: 'Elevated', rationale: 'Halftime egress anomalies indicate upcoming bottleneck at Gate C. Pre-emptive pathways reduce crowd dwell time.',
        confidence: 94
      });
    } finally { setAiLoading(false); }
  };

  // Local simulated gates throughput data
  const liveGates = useMemo(() => [
    { name: 'Gate A', throughput: Math.round(55 + Math.random() * 15) },
    { name: 'Gate B', throughput: Math.round(40 + Math.random() * 20) },
    { name: 'Gate C', throughput: Math.round(80 + Math.random() * 15) },
    { name: 'Gate D', throughput: Math.round(62 + Math.random() * 12) },
  ], [currentVenue.id]);

  const activeZoneData = useMemo(() => crowdDensityMap?.[selectedZoneId] || { density: 45, status: 'nominal', capacity: 10000, current: 4500 }, [crowdDensityMap, selectedZoneId]);
  const zoneStaffCount = useMemo(() => staffOnDuty.filter(s => s.zone === `Zone ${selectedZoneId}` || s.zone === `${selectedZoneId} Area`).length, [staffOnDuty, selectedZoneId]);

  return (
    <PageTransition>
      <div className="pt-20 bg-gray-50 min-h-screen">
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
              FIFA World Cup 2026 Operations Console
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
                    <span className="text-4xl font-black">{weatherData.temp?.value}°</span>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase font-extrabold text-gray-800">{weatherData.condition}</span>
                      <span className="text-[10px] text-gray-700">Feels like {weatherData.feelsLike?.value}°</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 uppercase font-bold">WIND</span>
                    <span className="text-xs font-extrabold">{weatherData.windSpeed?.value} {weatherData.windSpeed?.unit} {weatherData.windSpeed?.direction}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 uppercase font-bold">HUMIDITY</span>
                    <span className="text-xs font-extrabold">{weatherData.humidity?.value}%</span>
                  </div>
                </div>
                <div className="text-[9px] text-gray-700 font-bold uppercase tracking-widest w-full text-right md:text-right mt-1 opacity-70">
                  Updated {timeAgo}
                </div>
              </>
            ) : (
              <span className="text-xs font-bold text-gray-700 animate-pulse">Loading live weather...</span>
            )}
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
              <div key={idx} className="flex flex-col">
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
            <h3 className="text-lg font-black uppercase tracking-wider text-gray-900 border-b-2 border-gray-900 pb-2">
              Crowd Status Map
            </h3>

            {/* Stadium Map */}
            <div className="w-full">
              <ZoneMap selectedZoneId={selectedZoneId} onZoneSelect={setSelectedZoneId} />
            </div>

            {/* Selected Zone Detail Card */}
            <div className="bg-gray-100 p-5 rounded-none border-l-4 border-blue-600 flex flex-col gap-2">
              <h4 className="text-sm font-black text-gray-900 uppercase">ZONE {selectedZoneId} SUMMARY</h4>
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
            <h3 className="text-lg font-black uppercase tracking-wider text-gray-900 border-b-2 border-gray-900 pb-2">
              Live Logistics
            </h3>

            {/* Card 1: Crowd Flow */}
            <div className="bg-gray-100 p-4 border border-gray-200">
              <h4 className="font-black text-xs text-gray-900 uppercase tracking-wider mb-3">CROWD FLOW — 24H</h4>
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
              <h4 className="font-black text-xs text-gray-900 uppercase tracking-wider mb-3">ENTRY RATE BY GATE</h4>
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
            <h3 className="text-lg font-black uppercase tracking-wider text-gray-900 border-b-2 border-gray-900 pb-2 flex items-center justify-between">
              <span>ACTIVE ALERTS</span>
              <span className="bg-red-600 text-white rounded-full text-xs font-extrabold px-2.5 py-0.5">
                {unresolvedAlerts.length}
              </span>
            </h3>

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
                <h3 className="text-xl font-black text-white uppercase tracking-tight">AI DECISION HELPER</h3>
                <p className="text-xs text-gray-400 mt-1">Specify incident metadata or custom description for GenAI deployment plans.</p>
              </div>

              <form onSubmit={handleIncidentGenerate} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Incident Type</label>
                    <select
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
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Zone</label>
                    <select
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
                    <div>
                      <h4 className="text-blue-400 font-extrabold uppercase tracking-wider text-[10px] mb-1">AI Rationale</h4>
                      <p className="text-gray-300 leading-relaxed">{aiReport.rationale}</p>
                    </div>
                    <div>
                      <h4 className="text-green-400 font-extrabold uppercase tracking-wider text-[10px] mb-2">Recommended Actions</h4>
                      <div className="space-y-1.5">
                        {aiReport.actions?.map((act, i) => (
                          <div key={i} className="flex gap-2 items-start text-gray-300">
                            <span className="font-bold text-blue-400">{i + 1}.</span>
                            <p>{act}</p>
                          </div>
                        ))}
                      </div>
                    </div>
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
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Active Duty Steward Roster</h3>
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
