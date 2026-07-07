import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Brush, Area
} from 'recharts';
import {
  Leaf, Sun, Droplets, Recycle, Zap, Wind,
  TrendingDown, Award, Copy, Check, RefreshCw,
  BarChart3, TreePine, Train,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { callClaude, buildSustainabilitySystemPrompt } from '../utils/aiHelper';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import LiveBadge from '../components/LiveBadge';

// ─── Custom Flat Tooltip ───
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-[#111827] rounded-none p-3 shadow-none text-[#111827]">
        <p className="text-[10px] font-extrabold text-[#3B82F6] uppercase tracking-wider mb-1">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-xs text-[#111827] flex items-center gap-1.5 font-semibold">
            <span className="w-2.5 h-2.5 rounded-none border border-[#111827]" style={{ backgroundColor: item.fill || item.stroke }} />
            {item.name}: <span className="font-extrabold">{item.value.toLocaleString()}{item.unit || ''}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── SVG Circular Gauge Component (Flat style) ───
function CircularGauge({ value, max = 100, color, label, icon: Icon, size = 130, delay = 0 }) {
  const [animated, setAnimated] = useState(0);
  const r        = size * 0.38;
  const cx       = size / 2;
  const cy       = size / 2;
  const circ     = 2 * Math.PI * r;
  const pct      = Math.min(animated / max, 1);
  const dashArr  = `${pct * circ} ${circ}`;

  useEffect(() => {
    let start;
    const duration = 1400;
    const target   = value;

    const raf = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setAnimated(eased * target);
      if (progress < 1) requestAnimationFrame(raf);
    };

    const timeout = setTimeout(() => requestAnimationFrame(raf), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: delay / 1000 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={size * 0.07} />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={size * 0.07}
            strokeDasharray={dashArr}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.05s linear' }}
          />
          <foreignObject x={cx - 14} y={cy - 22} width={28} height={28}>
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
              {Icon && <Icon size={20} />}
            </div>
          </foreignObject>
          <text x={cx} y={cy + 16} textAnchor="middle" fill="#111827" fontFamily="Outfit, sans-serif" fontWeight="900" fontSize={size * 0.155}>
            {Math.round(animated)}%
          </text>
        </svg>
      </div>
      <p className="text-[11px] font-extrabold text-[#6B7280] text-center uppercase tracking-wider max-w-[100px] h-8 leading-tight">
        {label}
      </p>
    </motion.div>
  );
}

const TRANSPORT_DATA = [
  { name: 'Public Transit', value: 62, color: '#3B82F6' },
  { name: 'Rideshare',      value: 24, color: '#10B981' },
  { name: 'Private Vehicle',value: 14, color: '#F59E0B' },
];

const ENERGY_BREAKDOWN = [
  { name: 'Solar',   value: 43.6, color: '#10B981' },
  { name: 'Grid',    value: 48.2, color: '#6B7280' },
  { name: 'Battery', value: 8.2,  color: '#3B82F6' },
];

const ACHIEVEMENTS = [
  { id: 'zero-plastic',  icon: '🚫🧴', label: 'Zero Plastic Match',           earned: true,  desc: 'Single-use plastics eliminated' },
  { id: 'solar-day',     icon: '☀️',   label: '100% Solar Hour',              earned: true,  desc: '1 full hour on solar alone' },
  { id: 'top-recycler',  icon: '♻️',   label: 'Top Recycling Rate',           earned: true,  desc: '>80% waste diverted' },
  { id: 'green-commute', icon: '🚆',   label: 'Green Commute Champion',       earned: true,  desc: '>60% via public transit' },
  { id: 'carbon-neg',    icon: '🌍',   label: 'Carbon Negative Match',        earned: false, desc: 'Offset > Footprint' },
  { id: 'zero-waste',    icon: '🏆',   label: 'Zero Waste Stadium',           earned: false, desc: '<1% landfill diversion' },
  { id: 'rain-harvest',  icon: '💧',   label: 'Rainwater Harvest Active',     earned: true,  desc: '12,000L collected today' },
  { id: 'ev-fleet',      icon: '⚡🚗',  label: 'Full EV Fleet Day',           earned: false, desc: '100% EV operational vehicles' },
];

const VENUE_LEADERBOARD = [
  { name: 'MetLife Stadium', score: 84, energy: 73, water: 68, waste: 81, carbon: 45, flag: '🇺🇸' },
  { name: 'SoFi Stadium',    score: 91, energy: 88, water: 79, waste: 86, carbon: 61, flag: '🇺🇸' },
  { name: 'AT&T Stadium',    score: 77, energy: 64, water: 71, waste: 74, carbon: 38, flag: '🇺🇸' },
];

export default function Sustainability() {
  const { t } = useTranslation();
  const {
    sustainabilityMetrics,
    sustainabilityHistory,
    currentVenue,
    currentOccupancy,
  } = useStadium();

  const [aiReport,  setAiReport]  = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [aiTip,     setAiTip]     = useState('');
  const [tipLoading,setTipLoading] = useState(false);

  const sysPrompt = buildSustainabilitySystemPrompt();

  useEffect(() => {
    const fetchTip = async () => {
      setTipLoading(true);
      try {
        const tip = await callClaude({
          systemPrompt: sysPrompt,
          prompt: `Current solar output: ${sustainabilityMetrics.solarGenerated.value} kWh. Current arena occupancy: ${currentOccupancy.toLocaleString()} fans. HVAC running at full load. Give a single one-sentence actionable tip to save energy right now. Under 40 words.`,
        });
        setAiTip(tip.replace(/_\[.*?\]_/, '').trim());
      } catch {
        setAiTip('Switch stadium lighting in Zone G and H to 70% brightness — match viewing is not impacted and saves an estimated 280 kWh over the next 3 hours.');
      } finally {
        setTipLoading(false);
      }
    };
    fetchTip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateReport = async () => {
    setAiLoading(true);
    setAiReport(null);
    try {
      const raw = await callClaude({
        systemPrompt: sysPrompt,
        prompt: `Generate a sustainability performance report for ${currentVenue.name} FIFA World Cup 2026.
Current metrics:
- Solar coverage: ${sustainabilityMetrics.solarGenerated.value} kWh / ${sustainabilityMetrics.energyUsed.value} kWh total = ${Math.round(sustainabilityMetrics.solarGenerated.value / sustainabilityMetrics.energyUsed.value * 100)}%
- Water saved: ${sustainabilityMetrics.waterSaved.value.toLocaleString()} L  
- Waste diverted: ${sustainabilityMetrics.wasteRecycled.value}%
- Carbon offset: ${sustainabilityMetrics.carbonOffset.value} tCO2e
- Fan attendance: ${currentOccupancy.toLocaleString()}
- Renewable share: ${sustainabilityMetrics.renewableShare.value}%

Return JSON only: {"summary": "2-3 sentence summary", "opportunities": ["opp 1", "opp 2", "opp 3"], "impact": "projected improvement paragraph"}`,
      });

      try {
        const clean  = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
        const parsed = JSON.parse(clean);
        setAiReport(parsed);
      } catch {
        setAiReport({
          summary: raw.split('\n').slice(0, 2).join(' '),
          opportunities: [
            'Shift HVAC to zone cooling mode to reduce load by 18% during peak occupancy.',
            'Expand compostable packaging to all 48 concession stands to raise waste diversion past 85%.',
            'Enable pre-match solar pre-charge of battery storage to offset peak draw during kickoff.',
          ],
          impact: 'Implementing these three measures could reduce tonight\'s carbon footprint by an estimated 0.8 tCO₂e, increase renewable share to 58%, and save an additional 14,000 L of water — pushing the Green Score above 90.',
        });
      }
    } catch {
      setAiReport({
        summary: 'Stadium is performing above tournament average across all sustainability KPIs.',
        opportunities: [
          'Optimize HVAC zone control during halftime period.',
          'Deploy additional recycling marshals in high-traffic concourse areas.',
          'Switch perimeter lighting to adaptive dimming post-kickoff.',
        ],
        impact: 'These changes could improve the overall Green Score by 8-12 points.',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopy = () => {
    if (!aiReport) return;
    const text = `SUSTAINABILITY REPORT — ${currentVenue.name}\n\nSUMMARY\n${aiReport.summary}\n\nOPPORTUNITIES\n${aiReport.opportunities.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nPROJECTED IMPACT\n${aiReport.impact}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-6 mt-14 bg-white text-[#111827]">
        <PageHeader
          title={t('sustain.title')}
          subtitle={`${t('sustain.subtitle')} — ${currentVenue.name} · FIFA World Cup 2026`}
          icon={Leaf}
          actions={<LiveBadge status="live" label={t('sustain.live_badge')} />}
        />

        {/* HERO — circular progress gauges */}
        <div className="bg-white border-2 border-[#111827] rounded-none p-6 mb-6 shadow-none">
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 py-2">
            <CircularGauge value={73} color="#10B981" label="Solar Energy Coverage"    icon={Sun}     size={130} delay={0}   />
            <CircularGauge value={68} color="#3B82F6" label="Water Recycling Rate"     icon={Droplets} size={130} delay={200} />
            <CircularGauge value={81} color="#059669" label="Waste Diversion"          icon={Recycle}  size={130} delay={400} />
            <CircularGauge value={45} color="#A855F7" label="Carbon Offset Progress"   icon={Wind}     size={130} delay={600} />
          </div>
        </div>

        {/* HERO split layout: AI Optimization Report & tips on the left, Energy history charts on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          
          {/* LEFT COLUMN (6 Cols): AI Sustainability Report & Optimization Tips */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="bg-white border-2 border-[#111827] rounded-none p-6 shadow-none flex-1 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 border-b-2 border-[#111827] pb-3 -mx-6 -mt-6 px-6 py-3.5 bg-[#ECFDF5]">
                  <div>
                    <h3 className="font-heading font-extrabold text-xs text-[#047857] flex items-center gap-2 mb-0">
                      <TreePine size={16} className="text-[#10B981]" />
                      {t('sustain.ai_report_title')}
                    </h3>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {aiReport && (
                      <button
                        onClick={handleCopy}
                        className="btn-ghost flex items-center gap-1.5 h-8 px-2 cursor-pointer text-[10px] border-2 border-[#111827] bg-white"
                      >
                        {copied ? <Check size={10} /> : <Copy size={10} />}
                        {copied ? t('sustain.copied') : t('sustain.copy_report')}
                      </button>
                    )}
                    <button
                      onClick={handleGenerateReport}
                      disabled={aiLoading}
                      className="btn-primary flex items-center gap-1.5 h-8 px-3 cursor-pointer text-[10px] border-2 border-[#111827]"
                    >
                      {aiLoading
                        ? <><RefreshCw size={10} className="animate-spin" /> {t('sustain.generating_report')}</>
                        : <><Leaf size={10} /> {t('sustain.generate_report')}</>}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {aiLoading && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-12 gap-3"
                    >
                      <div className="w-8 h-8 border-t-2 border-[#10B981] border-r-transparent rounded-full animate-spin" />
                      <span className="text-xs font-heading font-extrabold tracking-wider text-[#6B7280] animate-pulse">
                        {t('sustain.generating_data_msg')}
                      </span>
                    </motion.div>
                  )}

                  {aiReport && !aiLoading && (
                    <motion.div
                      key="report"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div className="p-3 border-2 border-[#111827] bg-[#F3F4F6]">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#3B82F6] mb-1 flex items-center gap-1">
                          <BarChart3 size={9} /> Summary
                        </p>
                        <p className="text-[11px] text-[#111827] font-semibold leading-relaxed">{aiReport.summary}</p>
                      </div>

                      <div className="p-3 border-2 border-[#111827] bg-[#F3F4F6]">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#10B981] mb-2 flex items-center gap-1">
                          <Zap size={9} /> Opportunities
                        </p>
                        <div className="space-y-1.5">
                          {aiReport.opportunities?.map((opp, i) => (
                            <div key={i} className="flex gap-1.5 items-start">
                              <span className="w-3.5 h-3.5 rounded-none bg-[#10B981]/15 text-[#10B981] text-[8px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 border border-[#10B981]/25">
                                {i + 1}
                              </span>
                              <p className="text-[10px] text-[#111827] font-semibold leading-snug">{opp}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 border-2 border-[#111827] bg-[#F3F4F6]">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#A855F7] mb-1 flex items-center gap-1">
                          <TrendingDown size={9} /> Impact
                        </p>
                        <p className="text-[11px] text-[#111827] font-semibold leading-relaxed">{aiReport.impact}</p>
                      </div>
                    </motion.div>
                  )}

                  {!aiReport && !aiLoading && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-10 text-center"
                    >
                      <TreePine size={28} className="text-[#6B7280]/35 mb-2" />
                      <p className="text-xs text-[#6B7280] font-semibold max-w-xs leading-relaxed">
                        {t('sustain.report_placeholder')}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* AI Tip Banner */}
              <div className="mt-5 rounded-none border-2 border-[#10B981] bg-[#ECFDF5] p-3 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-none bg-white border border-[#10B981] flex items-center justify-center shrink-0">
                  <Zap size={12} className="text-[#10B981]" />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#047857] mb-0.5">
                    ⚡ {t('sustain.energy_tip_title')}
                  </p>
                  {tipLoading ? (
                    <div className="flex items-center gap-1 text-[10px] text-[#6B7280] font-bold">
                      <RefreshCw size={10} className="animate-spin" />
                      {t('sustain.analyzing_patterns')}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#047857] font-semibold leading-snug">{aiTip}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (6 Cols): Energy History & Breakdown charts */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="bg-white border-2 border-[#111827] rounded-none p-5 shadow-none">
              <h3 className="font-heading font-extrabold text-xs text-[#3B82F6] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <BarChart3 size={12} /> {t('sustain.chart_energy_title')}
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sustainabilityHistory} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="dayLabel" stroke="#6B7280" fontSize={8} />
                    <YAxis yAxisId="left" stroke="#6B7280" fontSize={8} unit=" kWh" />
                    <YAxis yAxisId="right" orientation="right" stroke="#A855F7" fontSize={8} unit="%" domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '9px', paddingBottom: '10px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="solarGenerated" stroke="#10B981" strokeWidth={1.5} fill="#ECFDF5" fillOpacity={0.4} name="Solar (kWh)" />
                    <Line yAxisId="left" type="monotone" dataKey="energyUsed" stroke="#3B82F6" strokeWidth={2} dot={false} name="Grid Draw (kWh)" />
                    <Line yAxisId="right" type="monotone" dataKey="renewableShare" stroke="#A855F7" strokeWidth={2} dot={false} name="Renewable %" />
                    <Brush dataKey="dayLabel" height={15} stroke="#111827" fill="#F3F4F6" travellerWidth={4} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border-2 border-[#111827] rounded-none p-4 shadow-none">
                <h4 className="font-heading font-extrabold text-[10px] text-[#6B7280] uppercase tracking-wider mb-3">
                  {t('sustain.power_mix_title')}
                </h4>
                <div className="h-24 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ENERGY_BREAKDOWN} cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={3} dataKey="value">
                        {ENERGY_BREAKDOWN.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 mt-1">
                  {ENERGY_BREAKDOWN.map((e) => (
                    <div key={e.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className="w-2 h-2 rounded-none border border-[#111827]" style={{ background: e.color }} />
                        <span className="text-[#6B7280]">{e.name}</span>
                      </div>
                      <span className="font-extrabold text-[#111827]">{e.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border-2 border-[#111827] rounded-none p-4 flex flex-col gap-3 shadow-none">
                <h4 className="font-heading font-extrabold text-[10px] text-[#6B7280] uppercase tracking-wider">
                  {t('sustain.live_kpi_title')}
                </h4>
                {[
                  { label: 'Total Used',    val: sustainabilityMetrics.energyUsed.value.toLocaleString(),     unit: 'kWh', color: '#3B82F6' },
                  { label: 'Solar Output',  val: sustainabilityMetrics.solarGenerated.value.toLocaleString(), unit: 'kWh', color: '#10B981' },
                  { label: 'EV Chargers',   val: sustainabilityMetrics.evChargers.value,                     unit: 'active', color: '#A855F7' },
                  { label: 'LED Coverage',  val: sustainabilityMetrics.ledCoverage.value,                     unit: '%',   color: '#10B981' },
                  { label: 'Renewable Mix', val: sustainabilityMetrics.renewableShare.value,                   unit: '%',   color: '#3B82F6' },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-[10px] text-[#6B7280] font-bold">{m.label}</span>
                    <span className="font-heading font-extrabold text-xs" style={{ color: m.color }}>
                      {m.val} <span className="text-[9px] text-[#6B7280] font-normal">{m.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* MIDDLE GRID: Impact, Transport, and Waste side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          <div className="bg-white border-2 border-[#111827] rounded-none p-5 shadow-none">
            <h3 className="font-heading font-extrabold text-xs text-[#3B82F6] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingDown size={12} /> {t('sustain.impact_title')}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] text-[#6B7280] mb-1.5 font-extrabold">
                  <span>Carbon Footprint Target</span>
                  <span className="text-[#FF3366]">
                    {sustainabilityMetrics.carbonOffset.value} / 3.0 tCO₂e
                  </span>
                </div>
                <div className="h-2 rounded-none bg-[#F3F4F6] border border-[#111827] relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(sustainabilityMetrics.carbonOffset.value / 3) * 100}%` }}
                    className="h-full bg-[#FF3366]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-[#6B7280] mb-1.5 font-extrabold">
                  <span>Water Saved Target</span>
                  <span className="text-[#3B82F6]">
                    {(sustainabilityMetrics.waterSaved.value / 1000).toFixed(1)}k / 40k L
                  </span>
                </div>
                <div className="h-2 rounded-none bg-[#F3F4F6] border border-[#111827] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(sustainabilityMetrics.waterSaved.value / 40000) * 100}%` }}
                    className="h-full bg-[#3B82F6]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-[#6B7280] mb-1.5 font-extrabold">
                  <span>Waste Diverted Target</span>
                  <span className="text-[#10B981]">
                    {sustainabilityMetrics.wasteRecycled.value}%
                  </span>
                </div>
                <div className="h-2 rounded-none bg-[#F3F4F6] border border-[#111827] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${sustainabilityMetrics.wasteRecycled.value}%` }}
                    className="h-full bg-[#10B981]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-[#111827] rounded-none p-5 shadow-none">
            <h3 className="font-heading font-extrabold text-xs text-[#3B82F6] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Train size={12} /> {t('sustain.transport_title')}
            </h3>
            <p className="text-[10px] text-[#6B7280] mb-4 font-semibold">{t('sustain.transport_desc')}</p>
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={TRANSPORT_DATA} cx="50%" cy="50%" innerRadius={18} outerRadius={36} paddingAngle={3} dataKey="value">
                      {TRANSPORT_DATA.map((t, i) => (
                        <Cell key={i} fill={t.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {TRANSPORT_DATA.map((t) => (
                  <div key={t.name}>
                    <div className="flex items-center justify-between text-[10px] mb-1 font-extrabold">
                      <span className="text-[#6B7280] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-none border border-[#111827]" style={{ background: t.color }} />
                        {t.name}
                      </span>
                      <span style={{ color: t.color }}>{t.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-none bg-[#F3F4F6] border border-[#111827] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${t.value}%` }}
                        className="h-full"
                        style={{ background: t.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-[#111827] rounded-none p-5 shadow-none">
            <h3 className="font-heading font-extrabold text-xs text-[#3B82F6] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Recycle size={12} /> {t('sustain.waste_title')}
            </h3>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Match 1', recyclable: 2840, compost: 1620, landfill: 480 },
                    { name: 'Match 2', recyclable: 3100, compost: 1780, landfill: 420 },
                    { name: 'Today',   recyclable: 3460, compost: 1940, landfill: 380 },
                  ]}
                  margin={{ top: 4, right: 4, left: -30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={9} />
                  <YAxis stroke="#6B7280" fontSize={9} unit="kg" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="recyclable" fill="#10B981" radius={0} name="Recyclable" stackId="a" />
                  <Bar dataKey="compost"    fill="#3B82F6" radius={0} name="Compost"     stackId="a" />
                  <Bar dataKey="landfill"   fill="#FF3366" radius={0} name="Landfill"    stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ACHIEVEMENTS */}
        <div className="bg-white border-2 border-[#111827] rounded-none p-5 mb-5 shadow-none">
          <h3 className="font-heading font-extrabold text-sm text-[#111827] mb-4 flex items-center gap-2">
            <Award size={15} className="text-[#F59E0B]" />
            {t('sustain.achievements_title')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ACHIEVEMENTS.map((a) => (
              <motion.div
                key={a.id}
                whileHover={a.earned ? { scale: 1.03 } : {}}
                className={`p-3.5 rounded-none border-2 flex flex-col gap-1.5 transition-all ${
                  a.earned ? 'border-[#F59E0B] bg-[#FEF3C7] cursor-default' : 'border-gray-400 bg-[#F3F4F6] opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{a.icon}</span>
                  {a.earned && (
                    <span className="w-4 h-4 rounded-none bg-[#10B981]/15 flex items-center justify-center border border-[#10B981]/25">
                      <Check size={9} className="text-[#10B981]" />
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-extrabold text-[#111827] leading-tight">{a.label}</p>
                <p className="text-[9px] text-[#6B7280] font-bold leading-tight">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* LEADERBOARD */}
        <div className="bg-white border-2 border-[#111827] rounded-none p-5 shadow-none">
          <h3 className="font-heading font-extrabold text-sm text-[#111827] mb-4 flex items-center gap-2">
            <TreePine size={15} className="text-[#10B981]" />
            {t('sustain.leaderboard_title')}
          </h3>
          <div className="space-y-3">
            {[...VENUE_LEADERBOARD].sort((a, b) => b.score - a.score).map((v, idx) => (
              <div key={v.name} className="p-3.5 rounded-none border-2 border-[#111827] bg-white flex items-center gap-4">
                <span className="font-heading font-black text-lg w-6 text-center" style={{
                  color: idx === 0 ? '#F59E0B' : idx === 1 ? '#6B7280' : '#8B5CF6'
                }}>
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                      <span>{v.flag}</span> {v.name}
                    </span>
                    <span className="font-heading font-extrabold text-sm text-[#10B981]">
                      {v.score} / 100
                    </span>
                  </div>
                  <div className="h-2 rounded-none bg-[#F3F4F6] border border-[#111827] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${v.score}%` }}
                      className="h-full bg-[#10B981]"
                    />
                  </div>
                  <div className="flex gap-4 mt-2 text-[9px] text-[#6B7280] font-extrabold">
                    <span>☀️ {v.energy}%</span>
                    <span>💧 {v.water}%</span>
                    <span>♻️ {v.waste}%</span>
                    <span>🌍 {v.carbon}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
