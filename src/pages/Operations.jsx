import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  Cell, ScatterChart, Scatter, ZAxis, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import {
  Radio, Users, Shield, Zap, Star, AlertTriangle, Play,
  Send, CheckCircle, FileText, ShieldAlert,
  Siren, Globe, Info, Clock, MapPin
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { buildOperationsSystemPrompt } from '../utils/aiHelper';
import PageHeader from '../components/PageHeader';
import ZoneMap from '../components/ZoneMap';
import StatCard from '../components/StatCard';
import { AlertList } from '../components/AlertBanner';
import LiveBadge from '../components/LiveBadge';
import PageTransition from '../components/PageTransition';

// ─── Custom Flat Tooltip ───
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-[#E5E7EB] rounded p-3 shadow-none text-[#111827]">
        <p className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider mb-1">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-xs text-[#111827] flex items-center gap-1.5 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill || item.stroke }} />
            {item.name}: <span className="font-extrabold">{item.value.toLocaleString()}{item.unit || ''}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Custom Occupancy Gauge Component (SVG based) ───
function OccupancyGauge({ percent, labelSafe, labelMonitor, labelAlert, labelCritical }) {
  const radius = 68;
  const strokeWidth = 10;
  const circ = Math.PI * radius;
  const strokeDashoffset = circ - (Math.min(percent, 100) / 100) * circ;

  let status = labelSafe || 'SAFE';
  let color = '#10B981'; // Emerald 500
  let bgTint = '#ECFDF5';
  let textColor = '#047857';

  if (percent >= 95) {
    status = labelCritical || 'CRITICAL';
    color = '#FF3366'; // Red 500
    bgTint = '#FFF5F5';
    textColor = '#C53030';
  } else if (percent >= 80) {
    status = labelAlert || 'ALERT';
    color = '#FF8C42'; // Orange
    bgTint = '#FFFBF7';
    textColor = '#B45309';
  } else if (percent >= 60) {
    status = labelMonitor || 'MONITOR';
    color = '#F59E0B'; // Amber 500
    bgTint = '#FEF3C7';
    textColor = '#92400E';
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-[#E5E7EB] rounded-lg h-full relative overflow-hidden shadow-none">
      <div className="relative w-40 h-24">
        <svg width="100%" height="100%" viewBox="0 0 160 100">
          <path
            d="M 12 80 A 68 68 0 0 1 148 80"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d="M 12 80 A 68 68 0 0 1 148 80"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
          <text x="80" y="70" textAnchor="middle" fill="#111827" fontFamily="Outfit, sans-serif" fontWeight="800" fontSize="22">
            {percent}%
          </text>
        </svg>
      </div>

      <div className="flex flex-col items-center mt-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded border-2 mb-1.5" style={{ backgroundColor: bgTint, borderColor: color, color: textColor }}>
          {status}
        </span>
        <span className="text-[9px] text-[#6B7280] uppercase tracking-wider font-bold">Security Index</span>
      </div>
    </div>
  );
}

export default function Operations() {
  const { t, i18n } = useTranslation();
  const {
    currentVenue,
    currentOccupancy,
    occupancyPercent,
    venueCapacity,
    crowdDensityMap,
    activeAlerts,
    unresolvedAlerts,
    staffOnDuty,
    staffByStatus,
    fanSatisfactionScore,
    resolveAlert,
    dismissAlert,
    generateIncident,
    matchDayMode,
    toggleMatchDayMode,
  } = useStadium();

  const [selectedZoneId, setSelectedZoneId] = useState('E');
  const [consoleTab, setConsoleTab] = useState('telemetry');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentType, setIncidentType] = useState('crowd_surge');
  const [incidentZone, setIncidentZone] = useState('Zone E');
  const [paLanguage, setPaLanguage] = useState(i18n.language || 'en');
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ── Match Day Mode countdown timer ──
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!matchDayMode) return;
    const kickoff = new Date(Date.now() + 90 * 60 * 1000);
    const id = setInterval(() => {
      const diff = Math.max(0, kickoff - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown({ h, m, s });
    }, 1000);
    return () => clearInterval(id);
  }, [matchDayMode]);

  const activeZoneData = crowdDensityMap[selectedZoneId] || { density: 0, label: `Zone ${selectedZoneId}`, capacity: 0, current: 0 };
  const opsSystemPrompt = buildOperationsSystemPrompt(currentVenue);
  const zonesList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  // Memoize scatter heatmap data
  const scatterData = useMemo(() => {
    const data = [];
    for (let hour = 12; hour <= 23; hour++) {
      zonesList.forEach((zone, index) => {
        const zoneWeight = zone === 'E' || zone === 'B' ? 1.15 : zone === 'G' ? 0.8 : 1.0;
        const timeFactor = Math.sin(((hour - 12) / 11) * Math.PI);
        const baseDensity = 40 + timeFactor * 45;
        const finalDensity = Math.min(100, Math.max(20, Math.round(baseDensity * zoneWeight + (Math.random() - 0.5) * 10)));
        data.push({ hour: `${hour}:00`, hourVal: hour, zoneNum: index + 1, zoneName: `Zone ${zone}`, density: finalDensity });
      });
    }
    return data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [liveGates, setLiveGates] = useState([
    { name: 'Gate 1', throughput: 74, capacity: 100 },
    { name: 'Gate 2', throughput: 88, capacity: 100 },
    { name: 'Gate 3', throughput: 62, capacity: 100 },
    { name: 'Gate 4', throughput: 45, capacity: 100 },
    { name: 'Gate 5', throughput: 92, capacity: 100 },
    { name: 'Gate 6', throughput: 78, capacity: 100 },
    { name: 'Gate 7', throughput: 86, capacity: 100 },
    { name: 'Gate 8', throughput: 54, capacity: 100 },
    { name: 'Gate 9', throughput: 41, capacity: 100 },
    { name: 'Gate 10', throughput: 96, capacity: 100 },
    { name: 'Gate 11', throughput: 68, capacity: 100 },
    { name: 'Gate 12', throughput: 59, capacity: 100 },
  ]);

  const [flowData, setFlowData] = useState([
    { name: 'Entry Gates', 'VIP Gate': 15, 'North Gate': 35, 'East Gate': 20, 'South Gate': 30 },
    { name: 'Concourses', 'Concourse 1': 25, 'Concourse 2': 40, 'Concourse 3': 35, 'VIP Suites': 0 },
    { name: 'Arena Zones', 'Lower Tiers': 45, 'Upper Tiers': 35, 'VIP Suites': 10, 'Media Tribune': 10 },
    { name: 'Dispersal', 'Public Transit': 55, 'Parking Lots': 30, 'Rideshare Hub': 15, 'Media Tribune': 0 }
  ]);

  const staffRadarData = [
    { subject: 'Response Speed', dayShift: 82, nightShift: 90, fullMark: 100 },
    { subject: 'Coverage Area', dayShift: 88, nightShift: 84, fullMark: 100 },
    { subject: 'Satisfaction', dayShift: 78, nightShift: 86, fullMark: 100 },
    { subject: 'Resolution Rate', dayShift: 92, nightShift: 80, fullMark: 100 },
    { subject: 'Radio Comms', dayShift: 80, nightShift: 88, fullMark: 100 }
  ];

  useEffect(() => {
    const id = setInterval(() => {
      setLiveGates(prev =>
        prev.map(g => {
          const delta = Math.floor((Math.random() - 0.5) * 16);
          const next = Math.max(20, Math.min(g.capacity, g.throughput + delta));
          return { ...g, throughput: next };
        })
      );
      
      setFlowData(prev =>
        prev.map(row => {
          const updated = { ...row };
          Object.keys(updated).forEach(k => {
            if (k !== 'name' && typeof updated[k] === 'number') {
              const delta = (Math.random() - 0.5) * 4;
              updated[k] = Math.max(5, Math.round(updated[k] + delta));
            }
          });
          return updated;
        })
      );
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const handleGetRecommendation = async () => {
    if (!incidentDesc.trim()) return;
    setAiLoading(true);
    setAiReport(null);

    const langNames = { en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese', ar: 'Arabic' };
    const targetLang = langNames[paLanguage] || 'English';

    const prompt = `INCIDENT REPORT:
Type: ${incidentType.replace(/_/g, ' ')}
Affected Location: ${incidentZone}
Details: "${incidentDesc}"

Provide structured operational recommendations.
IMPORTANT: Generate the PA Announcement field in ${targetLang} language.
Return JSON structure only:
{"actions":["step 1","step 2"],"staff":"deployment instruction","pa":"PA announcement in ${targetLang}","time":"X min"}`;

    try {
      const { callClaude } = await import('../utils/aiHelper');
      const response = await callClaude({
        prompt,
        systemPrompt: opsSystemPrompt,
      });
      const cleanJson = response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1);
      setAiReport(JSON.parse(cleanJson));
    } catch {
      const paFallbacks = {
        es: 'Damas y caballeros, por favor sigan las instrucciones del personal en el área.',
        fr: 'Mesdames et messieurs, veuillez suivre les instructions des stewards.',
        pt: 'Senhoras e senhores, por favor sigam as orientações dos fiscais de segurança.',
        ar: 'سيداتي وسادتي، يرجى اتباع توجيهات المنظمين في المنطقة.',
        en: 'Ladies and gentlemen, please follow steward directions in the affected area.'
      };
      setAiReport({
        actions: ['1. Initiate localized perimeter containment.', '2. Deploy adjacent security stewards.', '3. Broaden PA instruction alerts.'],
        staff: 'Reassign 4 stewards from Zone F to backup Gate D.',
        pa: paFallbacks[paLanguage] || paFallbacks.en,
        time: '7 minutes',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleBroadcastAlert = () => {
    setToastMessage(t('ops.broadcast_warning') + '...');
    setTimeout(() => setToastMessage(''), 4500);
  };

  const staffInActiveZone = useMemo(
    () => staffOnDuty.filter(s => s.zone.toLowerCase() === `zone ${selectedZoneId.toLowerCase()}`),
    [staffOnDuty, selectedZoneId]
  );

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-6 mt-14">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] bg-[#FF3366] text-white font-heading font-bold text-xs px-6 py-3 rounded border-2 border-red-700 flex items-center gap-2 shadow-none"
          >
            <Siren size={14} className="animate-pulse" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title={t('ops.title')}
        subtitle={t('ops.subtitle')}
        icon={Radio}
        actions={
          <div className="flex items-center flex-wrap gap-2.5">
            {matchDayMode && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded border-2 border-[#FF3366] bg-[#FFF5F5] text-[#FF3366] font-mono text-[10px] font-bold">
                <span>⚡ KICKOFF: {String(countdown.h).padStart(2, '0')}h {String(countdown.m).padStart(2, '0')}m {String(countdown.s).padStart(2, '0')}s</span>
              </div>
            )}
            <button
              onClick={toggleMatchDayMode}
              className={`px-3 py-1.5 rounded font-heading text-[9px] font-bold uppercase tracking-wider transition-all border-2 cursor-pointer ${
                matchDayMode
                  ? 'bg-[#FF3366] text-white border-[#FF3366]'
                  : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F3F4F6] hover:text-[#111827]'
              }`}
            >
              {matchDayMode ? '🔴 MATCH DAY: ON' : '⚫ MATCH DAY: OFF'}
            </button>
            <LiveBadge status="live" label={t('ops.live_badge')} />
            <button
              onClick={generateIncident}
              className="btn-primary flex items-center gap-1.5 text-xs h-10 px-3 cursor-pointer"
            >
              <Play size={12} /> {t('ops.test_incident')}
            </button>
          </div>
        }
      />

      {/* ── LIVE KPI STRIP ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          title={t('ops.kpi_occupancy')}
          value={currentOccupancy}
          unit={`/ ${venueCapacity.toLocaleString()}`}
          subtitle={`${occupancyPercent}% ${t('ops.capacity')}`}
          icon={Users}
          color="cyan"
          pulse
        />
        <StatCard
          title={t('ops.kpi_alerts')}
          value={unresolvedAlerts.length}
          subtitle={t('ops.awaiting_resolution')}
          icon={AlertTriangle}
          color={unresolvedAlerts.length > 3 ? 'red' : unresolvedAlerts.length > 0 ? 'amber' : 'green'}
        />
        <StatCard
          title={t('ops.kpi_staff')}
          value={staffOnDuty.filter(s => s.status !== 'offline').length}
          unit={t('ops.active_staff_label')}
          subtitle={`${staffByStatus.responding?.length || 0} ${t('ops.responding')}`}
          icon={Shield}
          color="green"
        />
        <StatCard
          title={t('ops.kpi_response')}
          value="2.3"
          unit="min"
          subtitle={t('ops.response_avg')}
          icon={Zap}
          color="amber"
        />
        <StatCard
          title={t('ops.kpi_satisfaction')}
          value={fanSatisfactionScore}
          unit="%"
          subtitle={t('ops.fan_score')}
          icon={Star}
          color="purple"
        />
      </div>

      {/* ── MAIN DASHBOARD GRID (12 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">

        {/* LEFT COLUMN (4 Cols) - ZoneMap & Zone drill down */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="glass-card p-5 bg-white border-2 border-[#E5E7EB] rounded-lg flex-1 flex flex-col justify-between shadow-none">
            <ZoneMap
              selectedZoneId={selectedZoneId}
              onZoneSelect={(zoneId) => setSelectedZoneId(zoneId)}
            />

            <div className="mt-4 border-t-2 border-[#E5E7EB] pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-heading font-extrabold text-sm text-[#111827]">
                  {t('ops.zone_details_title', { zone: selectedZoneId })}
                </span>
                <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-extrabold">
                  {activeZoneData.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#111827] mb-3">
                <div className="p-3 rounded bg-[#F3F4F6] border border-[#E5E7EB]">
                  <span className="text-[9px] text-[#6B7280] uppercase font-bold block">{t('ops.kpi_occupancy')}</span>
                  <span className="text-sm font-heading font-extrabold text-[#3B82F6]">
                    {activeZoneData.density}%
                  </span>
                  <span className="text-[9px] text-[#6B7280] font-semibold block mt-0.5">
                    {activeZoneData.current?.toLocaleString()} fans
                  </span>
                </div>
                <div className="p-3 rounded bg-[#F3F4F6] border border-[#E5E7EB]">
                  <span className="text-[9px] text-[#6B7280] uppercase font-bold block">{t('ops.assigned_staff')}</span>
                  <span className="text-sm font-heading font-extrabold text-[#10B981]">
                    {staffInActiveZone.length} Staff
                  </span>
                  <span className="text-[9px] text-[#6B7280] font-semibold block mt-0.5">
                    {staffInActiveZone.filter(s => s.status === 'active').length} Active
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded border-2 border-[#F59E0B]/30 bg-[#FEF3C7] text-xs">
                <span className="text-[9px] text-[#B45309] font-bold uppercase tracking-wider block mb-1">
                  {t('ops.ai_recommendation_label')}
                </span>
                <p className="text-[#92400E] font-semibold leading-snug">
                  {activeZoneData.density >= 90
                    ? `Critical density in Zone ${selectedZoneId}. Dispatch 2 additional security teams. Override gate timers.`
                    : activeZoneData.density >= 75
                    ? `Queue counts rising in Zone ${selectedZoneId}. Alert concessions stewards.`
                    : `Zone ${selectedZoneId} density is nominal. Standard patrol loops recommended.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN (5 Cols) - Tabbed Charts Console */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex bg-[#F3F4F6] border-2 border-[#E5E7EB] rounded-lg p-1 shrink-0" role="tablist" aria-label="Operations analytics console tabs">
            <button
              role="tab"
              aria-selected={consoleTab === 'telemetry'}
              aria-label="Show Crowd Density Telemetry charts"
              onClick={() => setConsoleTab('telemetry')}
              className={`flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                consoleTab === 'telemetry' ? 'bg-[#3B82F6] text-white' : 'text-[#6B7280] hover:bg-white hover:text-[#111827]'
              }`}
            >
              {t('ops.chart_tabs_telemetry')}
            </button>
            <button
              role="tab"
              aria-selected={consoleTab === 'logistics'}
              aria-label="Show Gate Throughput and Fan Flow Logistics charts"
              onClick={() => setConsoleTab('logistics')}
              className={`flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                consoleTab === 'logistics' ? 'bg-[#3B82F6] text-white' : 'text-[#6B7280] hover:bg-white hover:text-[#111827]'
              }`}
            >
              {t('ops.chart_tabs_logistics')}
            </button>
            <button
              role="tab"
              aria-selected={consoleTab === 'efficiency'}
              aria-label="Show Staff Efficiency Radar Chart"
              onClick={() => setConsoleTab('efficiency')}
              className={`flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                consoleTab === 'efficiency' ? 'bg-[#3B82F6] text-white' : 'text-[#6B7280] hover:bg-white hover:text-[#111827]'
              }`}
            >
              {t('ops.chart_tabs_efficiency')}
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4 min-h-[420px]">
            {consoleTab === 'telemetry' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col gap-4"
              >
                <OccupancyGauge
                  percent={occupancyPercent}
                  labelSafe={t('common.safe')}
                  labelMonitor={t('common.monitor')}
                  labelAlert={t('common.alert')}
                  labelCritical={t('common.critical')}
                />

                <div className="glass-card p-4 bg-white border-2 border-[#E5E7EB] rounded-lg flex-1 shadow-none">
                  <h3 className="font-heading font-extrabold text-[10px] text-[#3B82F6] uppercase tracking-wider mb-3">
                    {t('ops.heatmap_title')}
                  </h3>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="hour" type="category" stroke="#6B7280" fontSize={8} />
                        <YAxis
                          dataKey="zoneNum"
                          type="number"
                          domain={[1, 8]}
                          tickCount={8}
                          tickFormatter={(v) => `Zone ${zonesList[v - 1]}`}
                          stroke="#6B7280"
                          fontSize={8}
                        />
                        <ZAxis dataKey="density" range={[15, 120]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Scatter name="Density" data={scatterData} shape="circle">
                          {scatterData.map((entry, index) => {
                            let fill = '#10B981'; // green
                            if (entry.density >= 90) fill = '#FF3366'; // red
                            else if (entry.density >= 80) fill = '#FF8C42'; // orange
                            else if (entry.density >= 65) fill = '#F59E0B'; // amber
                            else if (entry.density >= 45) fill = '#3B82F6'; // blue
                            return <Cell key={`cell-${index}`} fill={fill} />;
                          })}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Accessibility: Hidden data table for screen readers */}
                  <table className="sr-only" aria-label="Crowd density heatmap data table">
                    <caption>Crowd Density by Hour and Zone</caption>
                    <thead><tr><th>Hour</th><th>Zone</th><th>Density</th></tr></thead>
                    <tbody>
                      {scatterData.slice(0, 10).map((row, idx) => (
                        <tr key={idx}><td>{row.hour}</td><td>{row.zoneName}</td><td>{row.density}%</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {consoleTab === 'logistics' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col gap-4"
              >
                <div className="glass-card p-4 bg-white border-2 border-[#E5E7EB] rounded-lg flex-1 shadow-none">
                  <h3 className="font-heading font-extrabold text-[10px] text-[#3B82F6] uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>{t('ops.throughput_title')}</span>
                    <span className="text-[9px] text-[#6B7280]">Threshold: 85%</span>
                  </h3>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={liveGates} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                        <XAxis type="number" stroke="#6B7280" fontSize={8} />
                        <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={8} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine x={85} stroke="#FF3366" strokeWidth={2} strokeDasharray="3 3" />
                        <Bar dataKey="throughput" radius={[0, 4, 4, 0]}>
                          {liveGates.map((entry, index) => {
                            const isExceeded = entry.throughput >= 85;
                            return <Cell key={`cell-${index}`} fill={isExceeded ? '#FF3366' : '#10B981'} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-4 bg-white border-2 border-[#E5E7EB] rounded-lg flex-1 shadow-none">
                  <h3 className="font-heading font-extrabold text-[10px] text-[#3B82F6] uppercase tracking-wider mb-3">
                    {t('ops.flow_title')}
                  </h3>
                  <div className="w-full h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={flowData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={8} />
                        <YAxis stroke="#6B7280" fontSize={8} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="VIP Gate" stackId="a" fill="#A855F7" />
                        <Bar dataKey="North Gate" stackId="a" fill="#3B82F6" />
                        <Bar dataKey="East Gate" stackId="a" fill="#10B981" />
                        <Bar dataKey="South Gate" stackId="a" fill="#F59E0B" />
                        <Bar dataKey="Concourse 1" stackId="a" fill="#6B7280" />
                        <Bar dataKey="Concourse 2" stackId="a" fill="#3B82F6" />
                        <Bar dataKey="Concourse 3" stackId="a" fill="#FF8C42" />
                        <Bar dataKey="Lower Tiers" stackId="a" fill="#10B981" />
                        <Bar dataKey="Upper Tiers" stackId="a" fill="#F59E0B" />
                        <Bar dataKey="Media Tribune" stackId="a" fill="#FF3366" />
                        <Bar dataKey="Public Transit" stackId="a" fill="#3B82F6" />
                        <Bar dataKey="Parking Lots" stackId="a" fill="#9CA3AF" />
                        <Bar dataKey="Rideshare Hub" stackId="a" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {consoleTab === 'efficiency' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 bg-white border-2 border-[#E5E7EB] rounded-lg flex-1 flex flex-col justify-between shadow-none"
              >
                <div>
                  <h3 className="font-heading font-extrabold text-[10px] text-[#3B82F6] uppercase tracking-wider mb-2">
                    {t('ops.radar_title')}
                  </h3>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={staffRadarData}>
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="subject" stroke="#6B7280" fontSize={8} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#E5E7EB" tickCount={5} fontSize={8} />
                        <Radar name="Day Shift" dataKey="dayShift" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} />
                        <Radar name="Night Shift" dataKey="nightShift" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
                        <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="p-3 rounded bg-[#F3F4F6] border border-[#E5E7EB] text-[10px] text-[#6B7280] font-semibold leading-snug">
                  <span className="text-[#10B981] font-bold">Shift summary:</span> Night Shift demonstrates higher response speed and communication metrics due to increased emergency coordinators pre-assigned at gates.
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (3 Cols) - Alerts Feed */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <div className="glass-card p-5 bg-white border-2 border-[#E5E7EB] rounded-lg flex-1 flex flex-col justify-between overflow-hidden shadow-none">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-extrabold text-xs text-[#FF3366] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={12} /> {t('ops.alerts_title')}
                </h3>
                <span className="text-[10px] text-[#6B7280] font-bold">
                  {unresolvedAlerts.length} {t('ops.unresolved')}
                </span>
              </div>

              <div className="overflow-y-auto max-h-[360px] pr-1">
                <AlertList
                  alerts={activeAlerts}
                  onResolve={resolveAlert}
                  onDismiss={dismissAlert}
                  compact
                  maxItems={5}
                />
              </div>
            </div>

            <button
              onClick={generateIncident}
              className="w-full mt-4 justify-center btn-secondary flex items-center gap-1.5 text-xs h-10 px-3 cursor-pointer"
            >
              <Siren size={13} /> {t('ops.trigger_mock')}
            </button>
          </div>
        </div>

      </div>

      {/* ── AI DECISION SUPPORT PANEL ── */}
      <div className="glass-card p-6 bg-white border-2 border-[#E5E7EB] rounded-lg mb-6 shadow-none">
        <h3 className="font-heading font-extrabold text-base text-[#111827] mb-1 flex items-center gap-2">
          <Zap size={16} className="text-[#3B82F6]" />
          {t('ops.decision_support_title')}
        </h3>
        <p className="text-xs text-[#6B7280] mb-4 font-semibold">
          {t('ops.decision_support_desc')}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">
          {/* Inputs */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1.5 col-span-1">
                <label className="text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold">{t('ops.incident_type')}</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="bg-[#F3F4F6] border-0 rounded px-2 py-2 text-[10px] text-[#111827] font-semibold focus:bg-white focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="crowd_surge">Surge</option>
                  <option value="medical">Medical</option>
                  <option value="weather">Weather</option>
                  <option value="security">Security</option>
                  <option value="infrastructure">IT screen</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 col-span-1">
                <label className="text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold">{t('ops.incident_location')}</label>
                <select
                  value={incidentZone}
                  onChange={(e) => setIncidentZone(e.target.value)}
                  className="bg-[#F3F4F6] border-0 rounded px-2 py-2 text-[10px] text-[#111827] font-semibold focus:bg-white focus:ring-2 focus:ring-[#3B82F6]"
                >
                  {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'VIP Suites', 'Gates Outer'].map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              {/* PA Announcement Target Language Selector */}
              <div className="flex flex-col gap-1.5 col-span-1">
                <label className="text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold flex items-center gap-1">
                  <Globe size={9} className="text-[#3B82F6]" />
                  <span>PA Lang</span>
                </label>
                <select
                  value={paLanguage}
                  onChange={(e) => setPaLanguage(e.target.value)}
                  className="bg-[#F3F4F6] border-0 rounded px-2 py-2 text-[10px] text-[#111827] font-semibold focus:bg-white focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="en">🇺🇸 EN</option>
                  <option value="es">🇪🇸 ES</option>
                  <option value="fr">🇫🇷 FR</option>
                  <option value="pt">🇧🇷 PT</option>
                  <option value="ar">🇸🇦 AR</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold">{t('ops.describe_situation')}</label>
              <textarea
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
                placeholder={t('ops.describe_placeholder')}
                rows={3}
                className="bg-[#F3F4F6] border-0 rounded px-3.5 py-2.5 text-xs text-[#111827] placeholder-[#6B7280] focus:bg-white focus:ring-2 focus:ring-[#3B82F6] resize-none"
              />
            </div>

            <button
              onClick={handleGetRecommendation}
              disabled={!incidentDesc.trim() || aiLoading}
              className="btn-primary w-full justify-center cursor-pointer text-xs"
            >
              {aiLoading ? t('ops.calculating_recommendation') : t('ops.get_recommendation')}
            </button>
          </div>

          {/* AI Outputs */}
          <div className="lg:col-span-6 border-2 border-[#E5E7EB] bg-[#F3F4F6] rounded p-5 flex flex-col justify-between min-h-[220px]">
            {aiReport ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                  <span className="text-[10px] text-[#10B981] font-heading font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle size={12} /> {t('ops.ai_strategy_generated')}
                  </span>
                  <span className="text-[10px] text-[#6B7280] font-bold">
                    {t('ops.resolution_eta')}: <span className="text-[#111827] font-extrabold">{aiReport.time || '10 min'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold block mb-2">{t('ops.immediate_steps')}</span>
                    <div className="space-y-1.5">
                      {aiReport.actions?.map((step, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-xs text-[#111827] font-semibold">
                          <span className="text-[#3B82F6] font-extrabold font-mono">{idx + 1}.</span>
                          <p className="leading-snug">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold block mb-1">{t('ops.staff_deployment')}</span>
                      <p className="text-xs text-[#111827] font-semibold leading-snug">{aiReport.staff}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6B7280] uppercase tracking-wider font-extrabold block mb-1">
                        {t('ops.pa_announcement')} ({paLanguage.toUpperCase()})
                      </span>
                      <p className="text-xs text-[#6B7280] italic font-semibold leading-snug">"{aiReport.pa}"</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : aiLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8">
                <div className="w-8 h-8 border-t-2 border-[#3B82F6] border-r-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs font-heading font-extrabold tracking-wider text-[#6B7280] animate-pulse">
                  Querying Claude AI Engine...
                </span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <FileText size={32} className="text-[#6B7280]/40 mb-2" />
                <p className="text-xs text-[#6B7280] font-semibold max-w-xs leading-relaxed">
                  Await dispatcher report. Input details and request action recommendation.
                </p>
              </div>
            )}
            
            <div className="text-[9px] text-[#6B7280] mt-4 pt-3 border-t border-[#E5E7EB] flex items-center gap-1.5 font-semibold">
              <Info size={10} className="text-[#3B82F6]" />
              <span>{t('ops.decision_log_note')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: STAFF DEPLOYMENT ── */}
      <div className="glass-card p-5 bg-white border-2 border-[#E5E7EB] rounded-lg shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="font-heading font-extrabold text-sm text-[#111827] flex items-center gap-2">
              <Shield size={15} className="text-[#10B981]" />
              {t('ops.steward_deployment_title')}
            </h3>
            <p className="text-xs text-[#6B7280] font-semibold">
              {t('ops.steward_deployment_desc')}
            </p>
          </div>
          <button
            onClick={handleBroadcastAlert}
            className="btn-primary h-10 text-xs px-4 flex items-center gap-1.5 cursor-pointer"
          >
            <Send size={11} /> {t('ops.broadcast_warning')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3">{t('ops.table_name')}</th>
                <th className="py-2.5 px-3">{t('ops.table_role')}</th>
                <th className="py-2.5 px-3">{t('ops.table_badge')}</th>
                <th className="py-2.5 px-3">{t('ops.table_zone')}</th>
                <th className="py-2.5 px-3">{t('ops.table_status')}</th>
                <th className="py-2.5 px-3 text-right">{t('ops.table_avg_response')}</th>
              </tr>
            </thead>
            <tbody>
              {staffOnDuty.slice(0, 8).map(staff => (
                <tr key={staff.id} className="border-b border-[#E5E7EB] hover:bg-[#F3F4F6]">
                  <td className="py-3 px-3 font-extrabold text-[#111827]">{staff.name}</td>
                  <td className="py-3 px-3 text-[#6B7280] font-semibold">{staff.role}</td>
                  <td className="py-3 px-3 font-mono text-[#3B82F6] font-bold">{staff.badge}</td>
                  <td className="py-3 px-3 font-bold text-[#111827]">{staff.zone}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      staff.status === 'active'      ? 'bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/20' :
                      staff.status === 'responding'  ? 'bg-[#FFF5F5] text-[#FF3366] border border-[#FF3366]/20' :
                      staff.status === 'break'       ? 'bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/20' : 'bg-gray-100 text-[#6B7280] border border-gray-200'
                    }`}>
                      {staff.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-[#6B7280] font-mono font-bold">{staff.responseTime}</td>
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
