import { useState } from 'react';
import {
  Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Area
} from 'recharts';
import { Leaf, Sun, Droplets, Recycle, Wind, Check, Copy, RefreshCw, Award, TreePine } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStadium } from '../context/StadiumContext';
import { callAI, buildSustainabilitySystemPrompt } from '../utils/aiHelper';
import { AchievementIcon } from '../components/AchievementIcon';

// ─── Flat Tooltip ───
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-gray-900 p-3 rounded-none shadow-none">
        <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-sm font-bold flex items-center gap-2">
            <span className="w-3 h-3 border border-gray-900" style={{ backgroundColor: item.fill || item.stroke }} />
            <span className="text-gray-600">{item.name}:</span> 
            <span className="text-gray-900">{item.value?.toLocaleString()}{item.unit || ''}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ACHIEVEMENTS = [
  { id: 'zero-plastic',  label: 'Zero Plastic Match',        earned: true,  desc: 'Single-use plastics eliminated' },
  { id: 'solar-day',     label: '100% Solar Hour',           earned: true,  desc: '1 full hour on solar alone' },
  { id: 'top-recycler',  label: 'Top Recycling Rate',        earned: true,  desc: '>80% waste diverted' },
  { id: 'green-commute', label: 'Green Commute Champion',    earned: true,  desc: '>60% via public transit' },
  { id: 'carbon-neg',    label: 'Carbon Negative Match',     earned: false, desc: 'Offset > Footprint' },
  { id: 'zero-waste',    label: 'Zero Waste Stadium',        earned: false, desc: '<1% landfill diversion' },
  { id: 'rain-harvest',  label: 'Rainwater Harvest Active',  earned: true,  desc: '12,000L collected today' },
  { id: 'ev-fleet',      label: 'Full EV Fleet Day',         earned: false, desc: '100% EV operational vehicles' },
];

const VENUE_LEADERBOARD = [
  { name: 'MetLife Stadium', score: 94 },
  { name: 'SoFi Stadium',    score: 88 },
  { name: 'AT&T Stadium',    score: 82 },
];

export default function Sustainability() {
  const { sustainabilityMetrics, sustainabilityHistory, currentVenue, airQuality } = useStadium();
  const [aiReport,   setAiReport]   = useState(null);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [copied,     setCopied]     = useState(false);

  const sysPrompt = buildSustainabilitySystemPrompt();

  const handleGenerateReport = async () => {
    setAiLoading(true); setAiReport(null);
    try {
      const raw = await callAI({
        systemPrompt: sysPrompt,
        prompt: `Generate a sustainability performance report for ${currentVenue.name}. Metrics: Solar ${sustainabilityMetrics.solarGenerated.value} kWh, Water saved ${sustainabilityMetrics.waterSaved.value.toLocaleString()} L, Waste diverted ${sustainabilityMetrics.wasteRecycled.value}%, Carbon offset ${sustainabilityMetrics.carbonOffset.value} tCO2e.
Return JSON only: {"performance":"Summary paragraph of current state","opportunities":["opp 1","opp 2","opp 3"],"impact":"projected improvement paragraph"}`,
      });
      try {
        const clean = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
        setAiReport(JSON.parse(clean));
      } catch {
        setAiReport({ performance: raw.split('\n').slice(0, 2).join(' '), opportunities: ['Shift HVAC to zone cooling mode to reduce load.', 'Expand compostable packaging.', 'Enable pre-match solar pre-charge of battery storage.'], impact: 'Implementing these measures could reduce carbon footprint significantly.' });
      }
    } catch {
      setAiReport({ performance: 'Stadium is performing above tournament average across all sustainability KPIs.', opportunities: ['Optimize HVAC zone control during halftime.', 'Deploy additional recycling marshals in high-traffic areas.', 'Switch perimeter lighting to adaptive dimming post-kickoff.'], impact: 'These changes could improve the overall Green Score by 8-12 points.' });
    } finally { setAiLoading(false); }
  };

  const handleCopy = () => {
    if (!aiReport) return;
    const text = `SUSTAINABILITY REPORT — ${currentVenue.name}\n\nPERFORMANCE\n${aiReport.performance}\n\nOPPORTUNITIES\n${aiReport.opportunities.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nIMPACT\n${aiReport.impact}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-12">
      {/* HEADER */}
      <div className="bg-emerald-600 p-8 pt-36">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">Sustainability</h1>
            <p className="text-emerald-100 text-sm md:text-lg mt-1 font-medium">{currentVenue.name} Green Operations Dashboard</p>
          </div>
          {airQuality && (
            <div className="bg-white text-emerald-700 font-bold px-4 py-2 rounded-sm border-2 border-emerald-800 shadow-[4px_4px_0px_#065f46]">
              {airQuality.aqi} AQI — {airQuality.level}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        
        {/* TOP METRICS ROW */}
        <div className="bg-white p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-2 border-gray-900 mb-6">
          <div className="border-t-4 border-emerald-500 pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2 uppercase tracking-widest text-xs font-bold">
              <Sun size={14} className="text-emerald-500" /> Solar Coverage
            </div>
            <div className="text-5xl font-black text-emerald-600">73%</div>
          </div>
          
          <div className="border-t-4 border-blue-500 pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2 uppercase tracking-widest text-xs font-bold">
              <Droplets size={14} className="text-blue-500" /> Water Recycled
            </div>
            <div className="text-5xl font-black text-blue-600">68%</div>
          </div>

          <div className="border-t-4 border-amber-500 pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2 uppercase tracking-widest text-xs font-bold">
              <Recycle size={14} className="text-amber-500" /> Waste Diverted
            </div>
            <div className="text-5xl font-black text-amber-600">81%</div>
          </div>

          <div className="border-t-4 border-purple-500 pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2 uppercase tracking-widest text-xs font-bold">
              <Wind size={14} className="text-purple-500" /> Carbon Offset
            </div>
            <div className="text-5xl font-black text-purple-600">45%</div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* LEFT: Energy Production Chart */}
          <div className="bg-white p-6 border-t-4 border-emerald-500 border-x-2 border-b-2 border-gray-900 flex flex-col">
            <h3 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-6">Energy Production — 30 Days</h3>
            <div className="flex-1" style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sustainabilityHistory} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="dayLabel" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} unit="k" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="solarGenerated" name="Solar Output" fill="#D1FAE5" stroke="#059669" strokeWidth={2} fillOpacity={1} />
                  <Line type="monotone" dataKey="energyUsed" name="Consumption" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT: Waste Breakdown */}
          <div className="bg-white p-6 border-t-4 border-amber-500 border-x-2 border-b-2 border-gray-900 flex flex-col">
            <h3 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-6">Waste Sorted Today</h3>
            <div className="flex-1" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Today', recyclable: 3460, compost: 1940, landfill: 380 }]} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                  <Bar dataKey="recyclable" name="Recyclable" stackId="a" fill="#10B981" />
                  <Bar dataKey="compost"    name="Compost"    stackId="a" fill="#F59E0B" />
                  <Bar dataKey="landfill"   name="Landfill"   stackId="a" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t-2 border-gray-100">
              <div>
                <div className="text-2xl font-black text-emerald-500">3,460<span className="text-sm font-bold text-gray-400 ml-1">kg</span></div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recyclable</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-500">1,940<span className="text-sm font-bold text-gray-400 ml-1">kg</span></div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Compost</div>
              </div>
              <div>
                <div className="text-2xl font-black text-red-500">380<span className="text-sm font-bold text-gray-400 ml-1">kg</span></div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Landfill</div>
              </div>
            </div>
          </div>
          
        </div>

        {/* FULL WIDTH — AI REPORT */}
        <div className="bg-gray-900 p-8 border-2 border-gray-900 mb-6 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 flex flex-col justify-center">
            <h2 className="text-3xl font-black text-white mb-2">Generate AI Sustainability Report</h2>
            <p className="text-gray-400 text-sm mb-6">Analyze 30-day performance trends and get actionable optimization strategies instantly.</p>
            <button 
              onClick={handleGenerateReport} 
              disabled={aiLoading} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 px-8 rounded-none uppercase tracking-widest flex items-center justify-center gap-2 border-2 border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? <RefreshCw size={20} className="animate-spin" /> : <Leaf size={20} />}
              {aiLoading ? 'Analyzing...' : 'Generate Report'}
            </button>
            {aiReport && (
               <button onClick={handleCopy} className="mt-4 flex items-center justify-center gap-2 border-2 border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white py-3 px-6 font-bold uppercase text-sm transition-colors cursor-pointer">
                 {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                 {copied ? 'Copied to Clipboard' : 'Copy Report'}
               </button>
            )}
          </div>
          <div className="w-full md:w-2/3 bg-gray-800 border-2 border-gray-700 p-6 min-h-[250px] relative">
            {!aiReport && !aiLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                <TreePine size={48} className="mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest">Awaiting Generation</p>
              </div>
            )}
            {aiLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-500">
                <RefreshCw size={48} className="mb-4 animate-spin opacity-50" />
                <p className="font-bold uppercase tracking-widest text-emerald-400">Processing live data...</p>
              </div>
            )}
            {aiReport && !aiLoading && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-2 h-2 bg-emerald-400 rounded-none" /> Performance</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{aiReport.performance}</p>
                </div>
                <div>
                  <h4 className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-2 h-2 bg-amber-400 rounded-none" /> Opportunities</h4>
                  <ul className="space-y-2">
                    {aiReport.opportunities?.map((opp, i) => (
                      <li key={i} className="text-gray-300 text-sm flex gap-3 items-start">
                        <span className="text-amber-500 font-bold shrink-0 mt-0.5">{i+1}.</span> {opp}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-2 h-2 bg-blue-400 rounded-none" /> Impact</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{aiReport.impact}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ACHIEVEMENTS */}
        <div className="bg-white p-6 border-2 border-gray-900 mb-6">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-6">Green Stadium Achievements</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map(a => (
              <motion.div
                key={a.id}
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={`p-4 border-2 transition-all ${
                  a.earned
                    ? 'bg-emerald-50 border-emerald-600'
                    : 'bg-gray-100 border-gray-300 opacity-60 grayscale'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  {/* Animated widget icon — replaces emoji */}
                  <AchievementIcon achievementId={a.id} earned={a.earned} size={24} />
                  {a.earned && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, delay: 0.2 }}
                    >
                      <Check size={20} className="text-emerald-600" />
                    </motion.div>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 leading-tight mb-1">{a.label}</h3>
                <p className="text-xs text-gray-600 font-medium leading-snug">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* LEADERBOARD */}
        <div className="bg-emerald-600 p-8 border-2 border-gray-900">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6">Venue Green Score Leaderboard</h2>
          <div className="bg-emerald-700 border-2 border-emerald-800 divide-y divide-emerald-800">
            {VENUE_LEADERBOARD.map((venue, idx) => (
              <div key={venue.name} className="p-4 md:p-6 flex items-center gap-4 md:gap-6 hover:bg-emerald-600/50 transition-colors">
                <div className="text-2xl md:text-4xl font-black text-emerald-300 w-8 md:w-12 text-center shrink-0">
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-lg mb-2 truncate">{venue.name}</div>
                  <div className="h-4 bg-emerald-900 border-2 border-emerald-800 w-full relative">
                    <div 
                      className="absolute top-0 left-0 bottom-0 bg-white" 
                      style={{ width: `${venue.score}%` }} 
                    />
                  </div>
                </div>
                <div className="text-3xl md:text-5xl font-black text-white shrink-0">
                  {venue.score}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
