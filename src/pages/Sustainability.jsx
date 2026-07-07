import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Brush
} from 'recharts';
import {
  Leaf, Sun, Droplets, Recycle, Zap, Wind,
  TrendingDown, Award, Copy, Check, RefreshCw,
  BarChart3, TreePine, Car, Train,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { useAI } from '../hooks/useAI';
import { callClaude, buildSustainabilitySystemPrompt } from '../utils/aiHelper';
import PageHeader from '../components/PageHeader';
import GlowButton from '../components/GlowButton';
import PageTransition from '../components/PageTransition';
import LiveBadge from '../components/LiveBadge';

// ─── Custom Dark Tooltip ──────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0D1B2E] border border-[#00D4FF]/30 rounded-xl p-3 shadow-2xl">
        <p className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider mb-1">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-xs text-[#E8F4FD] flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill || item.stroke }} />
            {item.name}: <span className="font-bold">{item.value.toLocaleString()}{item.unit || ''}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── SVG Circular Gauge Component ─────────────────────────────────
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
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <filter id={`gauge-glow-${label}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0F2340" strokeWidth={size * 0.07} />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={size * 0.07}
            strokeDasharray={dashArr}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            filter={`url(#gauge-glow-${label})`}
            style={{ transition: 'stroke-dasharray 0.05s linear' }}
          />
          <foreignObject x={cx - 14} y={cy - 22} width={28} height={28}>
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
              {Icon && <Icon size={20} />}
            </div>
          </foreignObject>
          <text x={cx} y={cy + 16} textAnchor="middle" fill="#E8F4FD" fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize={size * 0.155}>
            {Math.round(animated)}%
          </text>
        </svg>
      </div>
      <p className="text-[11px] font-semibold text-[#4A6580] text-center leading-tight max-w-[100px] h-8">
        {label}
      </p>
    </motion.div>
  );
}

const TRANSPORT_DATA = [
  { name: 'Public Transit', value: 62, color: '#00D4FF' },
  { name: 'Rideshare',      value: 24, color: '#00FF87' },
  { name: 'Private Vehicle',value: 14, color: '#FFB800' },
];

const ENERGY_BREAKDOWN = [
  { name: 'Solar',   value: 43.6, color: '#00FF87' },
  { name: 'Grid',    value: 48.2, color: '#4A6580' },
  { name: 'Battery', value: 8.2,  color: '#00D4FF' },
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
  const [tipLoading,setTipLoading]= useState(false);

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
      <div className="max-w-7xl mx-auto px-4 py-6 mt-14">
      <PageHeader
        title={t('sustain.title')}
        subtitle={`${t('sustain.subtitle')} — ${currentVenue.name} · FIFA World Cup 2026`}
        icon={Leaf}
        actions={<LiveBadge status="live" label={t('sustain.live_badge')} />}
      />

      {/* ═══════════════════════════════════════════════════════════
           HERO — 4 CIRCULAR PROGRESS GAUGES
           ═══════════════════════════════════════════════════════════ */}
      <div className="glass-card border border-[#00D4FF]/10 bg-[#0D1B2E]/50 rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 py-2">
          <CircularGauge value={73} color="#00FF87" label="Solar Energy Coverage"    icon={Sun}     size={130} delay={0}   />
          <CircularGauge value={68} color="#00D4FF" label="Water Recycling Rate"     icon={Droplets} size={130} delay={200} />
          <CircularGauge value={81} color="#34D399" label="Waste Diversion"          icon={Recycle}  size={130} delay={400} />
          <CircularGauge value={45} color="#A855F7" label="Carbon Offset Progress"   icon={Wind}     size={130} delay={600} />
        </div>

        {/* AI Tip Banner */}
        <div className="mt-6 mx-auto max-w-3xl rounded-xl border border-[#00FF87]/20 bg-[#00FF87]/5 p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00FF87]/10 flex items-center justify-center shrink-0">
            <Zap size={16} className="text-[#00FF87]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#00FF87] mb-1">
              ⚡ {t('sustain.energy_tip_title')}
            </p>
            {tipLoading ? (
              <div className="flex items-center gap-2 text-xs text-[#4A6580]">
                <RefreshCw size={11} className="animate-spin" />
                {t('sustain.analyzing_patterns')}
              </div>
            ) : (
              <p className="text-xs text-[#E8F4FD] leading-relaxed">{aiTip}</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
           MAIN GRID
           ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">
          <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl">
            <h3 className="font-heading font-semibold text-xs text-[#00D4FF] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BarChart3 size={12} /> {t('sustain.chart_energy_title')}
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sustainabilityHistory} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00FF87" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#00FF87" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0F2340" />
                  <XAxis dataKey="dayLabel" stroke="#4A6580" fontSize={8} />
                  <YAxis yAxisId="left" stroke="#4A6580" fontSize={8} unit=" kWh" />
                  <YAxis yAxisId="right" orientation="right" stroke="#A855F7" fontSize={8} unit="%" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '9px', paddingBottom: '10px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="solarGenerated" stroke="#00FF87" strokeWidth={1.5} fill="url(#gradSolar)" name="Solar (kWh)" />
                  <Line yAxisId="left" type="monotone" dataKey="energyUsed" stroke="#00D4FF" strokeWidth={1.5} dot={false} name="Grid Draw (kWh)" />
                  <Line yAxisId="right" type="monotone" dataKey="renewableShare" stroke="#A855F7" strokeWidth={2} dot={false} name="Renewable %" />
                  <Brush dataKey="dayLabel" height={15} stroke="#00D4FF" fill="#060D1A" travellerWidth={4} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Accessibility: Hidden energy data table for screen readers */}
            <table className="sr-only" aria-label="30-day energy production vs consumption data">
              <caption>Energy Intelligence — Solar Generated vs Grid Draw vs Renewable Share (30 days)</caption>
              <thead><tr><th>Day</th><th>Solar (kWh)</th><th>Grid Draw (kWh)</th><th>Renewable (%)</th></tr></thead>
              <tbody>
                {sustainabilityHistory.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td>{row.dayLabel}</td>
                    <td>{row.solarGenerated}</td>
                    <td>{row.energyUsed}</td>
                    <td>{row.renewableShare}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl">
              <h4 className="font-heading font-semibold text-[10px] text-[#4A6580] uppercase tracking-wider mb-3">
                {t('sustain.power_mix_title')}
              </h4>
              <div className="h-28 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ENERGY_BREAKDOWN} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value">
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
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                      <span className="text-[#4A6580]">{e.name}</span>
                    </div>
                    <span className="font-bold text-[#E8F4FD]">{e.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-4 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl flex flex-col gap-3">
              <h4 className="font-heading font-semibold text-[10px] text-[#4A6580] uppercase tracking-wider">
                {t('sustain.live_kpi_title')}
              </h4>
              {[
                { label: 'Total Used',    val: sustainabilityMetrics.energyUsed.value.toLocaleString(),     unit: 'kWh', color: '#00D4FF' },
                { label: 'Solar Output',  val: sustainabilityMetrics.solarGenerated.value.toLocaleString(), unit: 'kWh', color: '#00FF87' },
                { label: 'EV Chargers',   val: sustainabilityMetrics.evChargers.value,                     unit: 'active', color: '#A855F7' },
                { label: 'LED Coverage',  val: sustainabilityMetrics.ledCoverage.value,                     unit: '%',   color: '#00FF87' },
                { label: 'Renewable Mix', val: sustainabilityMetrics.renewableShare.value,                   unit: '%',   color: '#00D4FF' },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-[#4A6580]">{m.label}</span>
                  <span className="font-heading font-bold text-xs" style={{ color: m.color }}>
                    {m.val} <span className="text-[9px] text-[#4A6580] font-normal">{m.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5">
          <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl">
            <h3 className="font-heading font-semibold text-xs text-[#00D4FF] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingDown size={12} /> {t('sustain.impact_title')}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] text-[#4A6580] mb-1.5">
                  <span>Carbon Footprint vs Target</span>
                  <span className="text-[#FF3366] font-bold">
                    {sustainabilityMetrics.carbonOffset.value} / 3.0 tCO₂e
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#0F2340] relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(sustainabilityMetrics.carbonOffset.value / 3) * 100}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#FF3366] to-[#FFB800]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-[#4A6580] mb-1.5">
                  <span>Water Saved vs Baseline</span>
                  <span className="text-[#00D4FF] font-bold">
                    {(sustainabilityMetrics.waterSaved.value / 1000).toFixed(1)}k / 40k L
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#0F2340] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(sustainabilityMetrics.waterSaved.value / 40000) * 100}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] to-[#00FF87]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-[#4A6580] mb-1.5">
                  <span>Waste Diverted from Landfill</span>
                  <span className="text-[#00FF87] font-bold">
                    {sustainabilityMetrics.wasteRecycled.value}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#0F2340] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${sustainabilityMetrics.wasteRecycled.value}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#00FF87] to-[#34D399]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl">
            <h3 className="font-heading font-semibold text-xs text-[#00D4FF] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Train size={12} /> {t('sustain.transport_title')}
            </h3>
            <p className="text-[10px] text-[#4A6580] mb-4">{t('sustain.transport_desc')}</p>
            <div className="flex items-center gap-5">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={TRANSPORT_DATA} cx="50%" cy="50%" innerRadius={22} outerRadius={42} paddingAngle={3} dataKey="value">
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
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-[#4A6580] flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                        {t.name}
                      </span>
                      <span className="font-bold" style={{ color: t.color }}>{t.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#0F2340] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${t.value}%` }}
                        className="h-full rounded-full"
                        style={{ background: t.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl">
            <h3 className="font-heading font-semibold text-xs text-[#00D4FF] uppercase tracking-wider mb-4 flex items-center gap-1.5">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#0F2340" />
                  <XAxis dataKey="name" stroke="#4A6580" fontSize={9} />
                  <YAxis stroke="#4A6580" fontSize={9} unit="kg" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="recyclable" fill="#00FF87" radius={[3,3,0,0]} name="Recyclable" stackId="a" />
                  <Bar dataKey="compost"    fill="#00D4FF" radius={[0,0,0,0]} name="Compost"     stackId="a" />
                  <Bar dataKey="landfill"   fill="#FF3366" radius={[3,3,0,0]} name="Landfill"    stackId="a" />
                </BarChart>
              </ResponsiveContainer>

              {/* Accessibility: Hidden waste data table for screen readers */}
              <table className="sr-only" aria-label="Waste diversion comparison data table">
                <caption>Waste Sorted by Match Day — Recyclable, Compost, Landfill (kg)</caption>
                <thead><tr><th>Match</th><th>Recyclable (kg)</th><th>Compost (kg)</th><th>Landfill (kg)</th></tr></thead>
                <tbody>
                  <tr><td>Match 1</td><td>2840</td><td>1620</td><td>480</td></tr>
                  <tr><td>Match 2</td><td>3100</td><td>1780</td><td>420</td></tr>
                  <tr><td>Today</td><td>3460</td><td>1940</td><td>380</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* AI REPORT */}
      <div className="glass-card p-6 border border-[#00FF87]/15 bg-[#0D1B2E]/60 rounded-2xl mb-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="font-heading font-bold text-base text-white flex items-center gap-2 mb-1">
              <TreePine size={16} className="text-[#00FF87]" />
              {t('sustain.ai_report_title')}
            </h3>
            <p className="text-xs text-[#4A6580]">{t('sustain.ai_report_desc')}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {aiReport && (
              <GlowButton size="sm" variant="success" onClick={handleCopy}>
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? t('sustain.copied') : t('sustain.copy_report')}
              </GlowButton>
            )}
            <GlowButton size="sm" onClick={handleGenerateReport} disabled={aiLoading}>
              {aiLoading
                ? <><RefreshCw size={11} className="animate-spin" /> {t('sustain.generating_report')}</>
                : <><Leaf size={11} /> {t('sustain.generate_report')}</>}
            </GlowButton>
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
              <div className="w-10 h-10 border-t-2 border-[#00FF87] border-r-transparent rounded-full animate-spin" />
              <span className="text-xs font-heading font-semibold tracking-wider text-[#4A6580] animate-pulse">
                {t('sustain.generating_data_msg')}
              </span>
            </motion.div>
          )}

          {aiReport && !aiLoading && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              <div className="p-4 rounded-xl bg-[#0A192F]/60 border border-[#00D4FF]/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#00D4FF] mb-2 flex items-center gap-1">
                  <BarChart3 size={10} /> Performance Summary
                </p>
                <p className="text-xs text-[#E8F4FD] leading-relaxed">{aiReport.summary}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#0A192F]/60 border border-[#00FF87]/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#00FF87] mb-3 flex items-center gap-1">
                  <Zap size={10} /> Top 3 Opportunities
                </p>
                <div className="space-y-2">
                  {aiReport.opportunities?.map((opp, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="w-4 h-4 rounded-full bg-[#00FF87]/15 text-[#00FF87] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-[#E8F4FD] leading-snug">{opp}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0A192F]/60 border border-[#A855F7]/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7] mb-2 flex items-center gap-1">
                  <TrendingDown size={10} /> Projected Impact
                </p>
                <p className="text-xs text-[#E8F4FD] leading-relaxed">{aiReport.impact}</p>
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
              <TreePine size={36} className="text-[#4A6580]/25 mb-3" />
              <p className="text-xs text-[#4A6580] max-w-sm leading-relaxed">
                {t('sustain.report_placeholder')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ACHIEVEMENTS */}
      <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl mb-5">
        <h3 className="font-heading font-bold text-sm text-white mb-4 flex items-center gap-2">
          <Award size={15} className="text-[#FFB800]" />
          {t('sustain.achievements_title')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((a) => (
            <motion.div
              key={a.id}
              whileHover={a.earned ? { scale: 1.03 } : {}}
              className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                a.earned ? 'border-[#FFB800]/30 bg-[#FFB800]/6 cursor-default' : 'border-[#0F2340] bg-[#0A192F]/30 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{a.icon}</span>
                {a.earned && (
                  <span className="w-4 h-4 rounded-full bg-[#00FF87]/15 flex items-center justify-center">
                    <Check size={9} className="text-[#00FF87]" />
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-[#E8F4FD] leading-tight">{a.label}</p>
              <p className="text-[9px] text-[#4A6580] leading-tight">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* LEADERBOARD */}
      <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl">
        <h3 className="font-heading font-bold text-sm text-white mb-4 flex items-center gap-2">
          <TreePine size={15} className="text-[#00FF87]" />
          {t('sustain.leaderboard_title')}
        </h3>
        <div className="space-y-3">
          {[...VENUE_LEADERBOARD].sort((a, b) => b.score - a.score).map((v, idx) => (
            <div key={v.name} className="p-3.5 rounded-xl border border-[#0F2340] bg-[#0A192F]/40 flex items-center gap-4">
              <span className="font-heading font-black text-lg w-6 text-center" style={{
                color: idx === 0 ? '#FFB800' : idx === 1 ? '#4A6580' : '#8B5CF6'
              }}>
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <span>{v.flag}</span> {v.name}
                  </span>
                  <span className="font-heading font-bold text-sm text-[#00FF87]">
                    {v.score} / 100
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#0F2340] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${v.score}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] to-[#00FF87]"
                  />
                </div>
                <div className="flex gap-4 mt-2 text-[9px] text-[#4A6580]">
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
