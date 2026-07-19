import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Briefcase, Zap, Megaphone, Copy, Check, RefreshCw,
  Calendar, Clock, PlayCircle, Siren, CheckCircle2
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { callAI } from '../utils/aiHelper';
import PageTransition from '../components/PageTransition';
import { validateInput } from '../utils/validateInput';


const ROLE_ASSIGNMENTS = {
  Security: 'Zone E — South Upper Stand',
  Medical: 'Medical Post Gate B',
  Volunteer: 'Gate C Entrance Lanes',
  Operations: 'Command Control Room',
};

const DEFAULT_TASKS = {
  Security: [
    { id: 'sec-1', text: 'Perform security sweep of Zone E concourse', done: true },
    { id: 'sec-2', text: 'Set up crowd diversion barriers at Gate D', done: false },
    { id: 'sec-3', text: 'Verify Channel 4 tactical radio operational link', done: true },
    { id: 'sec-4', text: 'Report queue compression rates to Operations Lead', done: false },
  ],
  Medical: [
    { id: 'med-1', text: 'Inspect automated external defibrillator (AED) units', done: true },
    { id: 'med-2', text: 'Check oxygen supply levels at Gate B Post', done: true },
    { id: 'med-3', text: 'Confirm primary dispatch phone link is operational', done: false },
    { id: 'med-4', text: 'Verify first-aid bag inventory', done: false },
  ],
  Volunteer: [
    { id: 'vol-1', text: 'Distribute spectator maps at Gate C entry', done: true },
    { id: 'vol-2', text: 'Guide accessibility seating ticket holders', done: false },
    { id: 'vol-3', text: 'Monitor ticket scanning queues for delays', done: false },
    { id: 'vol-4', text: 'Provide wayfinding directions to food courts', done: true },
  ],
  Operations: [
    { id: 'ops-1', text: 'Check real-time crowd density scatter updates', done: true },
    { id: 'ops-2', text: 'Verify solar power reserve output telemetry', done: true },
    { id: 'ops-3', text: 'Log average response times for incident alerts', done: false },
    { id: 'ops-4', text: 'Sync radio channels with dispatch commanders', done: false },
  ],
};

const PROTOCOL_SCENARIOS = {
  'Fan medical emergency': '1. Secure the immediate area and verify victim status.\n2. Radio dispatcher immediately on Channel 4 with Section/Row details.\n3. Administer initial first aid or CPR if qualified.\n4. Clear adjacent corridor to ensure rapid stretcher access.',
  'Crowd too dense': '1. Report current bottleneck location to Operations Command.\n2. Open secondary bypass gates to divert incoming flow.\n3. Position stewards to guide fans into lower-density sectors.\n4. Defer queue entries until central concourse congestion decreases.',
  'Lost child': '1. Obtain child name, age, clothing description, and parent info.\n2. Notify Operations and Security Dispatchers immediately.\n3. Remain with child at current position for at least 10 minutes.\n4. Guide child to official Lost & Found post if parents are not located.',
  'Equipment failure': '1. Log ticket scanner or system code/location.\n2. Dispatch manual check-in stewards to affected gates immediately.\n3. Notify IT Operations Command to dispatch technician.\n4. Utilize physical ticket verification stamps if outage exceeds 5 minutes.',

  'Aggressive fan': '1. Avoid direct physical confrontation and maintain de-escalation stance.\n2. Call Security dispatcher for immediate backup.\n3. Observe and document fan clothing, zone seat number, and behavior.\n4. Maintain safety perimeter for adjacent spectators.',
};

const LOCAL_LANGS = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
];

/**
 * Staff Page Component.
 * Intended for venue staff on duty. Allows choosing shift roles, managing
 * shift statuses, viewing tasks assigned to the role, and looking up
 * language cards with live translation assistance.
 *
 * @component
 * @returns {React.ReactElement} The rendered Staff workspace dashboard
 */
export default function Staff() {
  const { staffOnDuty, reassignStaff, updateStaffStatus, todaysMatches } = useStadium();

  // Shift & Role State
  const [myRole, setMyRole] = useState('Security');
  const [myStatus, setMyStatus] = useState('ON DUTY');
  const [tasks, setTasks] = useState(DEFAULT_TASKS.Security);

  // Roster Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [showOffShift, setShowOffShift] = useState(false);

  // AI Guidance State
  const [guidanceScenario, setGuidanceScenario] = useState('');
  const [guidanceProtocol, setGuidanceProtocol] = useState('');
  const [guidanceLoading, setGuidanceLoading] = useState(false);

  // PA Generator State
  const [paSituation, setPaSituation] = useState('');
  const [paLanguage, setPaLanguage] = useState('English');
  const [paOutput, setPaOutput] = useState('');
  const [paLoading, setPaLoading] = useState(false);
  const [paCopied, setPaCopied] = useState(false);

  // Handle Role Change
  const handleRoleChange = (role) => {
    setMyRole(role);
    setTasks(DEFAULT_TASKS[role] || []);
  };

  // Toggle Task Completion
  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  // Derive match phase from todaysMatches (same logic as StadiumContext)
  const matchPhase = useMemo(() => {
    if (!todaysMatches?.length) return 'no-match';
    const now = Date.now();
    const live = todaysMatches.find(m => m.status === 'LIVE');
    if (live) return 'match-day';
    const upcoming = todaysMatches
      .filter(m => m.status === 'SCHEDULED' && new Date(m.utcDate).getTime() > now)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0];
    if (upcoming) {
      const h = (new Date(upcoming.utcDate).getTime() - now) / 3600000;
      if (h <= 1)  return 'match-day';
      if (h <= 4)  return 'pre-match';
      if (h <= 8)  return 'pre-match-early';
    }
    const finished = todaysMatches.filter(m => m.status === 'FINISHED');
    if (finished.length) {
      const last = finished.sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())[0];
      const hSince = (now - new Date(last.utcDate).getTime()) / 3600000 - 2;
      return hSince < 2 ? 'post-match' : 'post-match-done';
    }
    return 'no-match';
  }, [todaysMatches]);

  const PHASE_CONFIG = {
    'no-match':        { label: 'No Match Today',     color: 'bg-gray-700',  icon: Calendar, note: 'Staff are off-shift. No match is scheduled at this venue today.' },
    'pre-match-early': { label: 'Pre-Match (Early)',  color: 'bg-blue-700',  icon: Clock, note: 'Supervisors and leads are on-site. Full deployment begins 4 hours before kickoff.' },
    'pre-match':       { label: 'Pre-Match Prep',     color: 'bg-amber-600', icon: Zap, note: 'Security, medical, and operations teams are deploying. Match in under 4 hours.' },
    'match-day':       { label: 'Match Day — Live',   color: 'bg-red-600',   icon: PlayCircle, note: 'Full staff deployment active. Match is live or imminent.' },
    'post-match':      { label: 'Post-Match',         color: 'bg-purple-700',icon: Siren, note: 'Security managing crowd exit. Other teams winding down.' },
    'post-match-done': { label: 'Match Concluded',    color: 'bg-gray-700',  icon: CheckCircle2, note: 'Match ended over 2 hours ago. All staff have stood down.' },
  };
  const phase = PHASE_CONFIG[matchPhase] || PHASE_CONFIG['no-match'];
  const PhaseIcon = phase.icon;

  // Live stats from staffOnDuty
  const onDutyCount     = staffOnDuty.filter(s => s.status !== 'off-shift').length;
  const activeCount     = staffOnDuty.filter(s => s.status === 'active').length;
  const respondingCount = staffOnDuty.filter(s => s.status === 'responding').length;
  const avgResponseTime = staffOnDuty
    .filter(s => s.responseTime && s.status !== 'off-shift')
    .reduce((sum, s, _, arr) => sum + parseFloat(s.responseTime) / arr.length, 0)
    .toFixed(1);

  // Filtered Roster
  const filteredStaff = useMemo(() => {
    return staffOnDuty.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.badge.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole   = roleFilter === 'All' || s.role === roleFilter;
      const matchZone   = zoneFilter === 'All' || s.zone === zoneFilter;
      const matchShift  = showOffShift || s.status !== 'off-shift';
      return matchSearch && matchRole && matchZone && matchShift;
    });
  }, [staffOnDuty, searchTerm, roleFilter, zoneFilter, showOffShift]);

  // AI Protocol Fetcher
  const handleGetProtocol = async (preset = null) => {
    const rawScenario = preset || guidanceScenario;
    if (!rawScenario.trim()) return;

    // Validate and sanitize input scenario
    const validated = validateInput(rawScenario, 'apiText');
    const scenario = validated.value;
    if (!scenario.trim()) return;

    setGuidanceLoading(true);
    setGuidanceProtocol('');

    try {
      const response = await callAI({
        systemPrompt: 'You are an expert FIFA World Cup 2026 Stadium Operations Director. Output a short 4-step emergency protocol. Short and concise.',
        prompt: `Provide a step-by-step security/operations protocol for this scenario: "${scenario}". Return exactly 4 numbered steps, each on its own line.`
      });
      setGuidanceProtocol(response);
    } catch {
      setGuidanceProtocol(PROTOCOL_SCENARIOS[scenario] || PROTOCOL_SCENARIOS['Fan medical emergency']);
    } finally {
      setGuidanceLoading(false);
    }
  };

  // AI PA Announcement Generator
  const handleGeneratePA = async () => {
    const rawSituation = paSituation || '';
    if (!rawSituation.trim()) return;

    // Validate target language
    const langVal = validateInput(paLanguage, 'languageName');
    if (!langVal.valid) return;

    // Validate and sanitize custom situation text
    const sitVal = validateInput(rawSituation, 'apiText');
    const sanitizedSituation = sitVal.value;
    if (!sanitizedSituation.trim()) return;

    setPaLoading(true);
    setPaOutput('');
    setPaCopied(false);

    try {
      const response = await callAI({
        systemPrompt: `You are the chief stadium announcer at the FIFA World Cup 2026. Write a clear, professional public address announcement in the specified language. Keep it brief.`,
        prompt: `Generate a PA announcement in ${langVal.value} for this situation: "${sanitizedSituation}". Do not include any greeting or preamble, just return the exact announcement text.`
      });
      setPaOutput(response);
    } catch {
      setPaOutput(`[PA ANNOUNCEMENT - ${langVal.value.toUpperCase()}]\nAttention all spectators. Please be advised that we are experiencing high congestion near Gate C. We kindly request fans to utilize Gate B or Gate D for faster entry. Thank you for your cooperation.`);
    } finally {
      setPaLoading(false);
    }
  };

  const handleCopyPA = () => {
    if (!paOutput) return;
    navigator.clipboard.writeText(paOutput);
    setPaCopied(true);
    setTimeout(() => setPaCopied(false), 2000);
  };

  return (
    <PageTransition>
      <div className="pt-28 bg-gray-50 min-h-screen">
        
        {/* HEADER */}
        <div className={`text-white px-8 py-6 border-b-2 border-gray-900 ${phase.color}`}>
          <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <PhaseIcon size={24} className="text-white shrink-0" />
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">STAFF HUB</h1>
              </div>
              <p className="text-white/70 text-sm font-semibold mt-1">{phase.note}</p>
            </div>

            {/* Live stats strip */}
            <div className="bg-white/10 border-2 border-white/30 px-6 py-4 flex gap-8">
              {[
                { val: onDutyCount,     lbl: 'ON DUTY' },
                { val: activeCount,     lbl: 'ACTIVE' },
                { val: respondingCount, lbl: 'RESPONDING' },
                { val: avgResponseTime > 0 ? `${avgResponseTime}m` : '--', lbl: 'AVG RESPONSE' }
              ].map((s, idx) => (
                <div key={idx} className="flex flex-col text-center">
                  <span className="text-2xl font-black text-white leading-none">{s.val}</span>
                  <span className="text-white/85 text-[9px] font-bold uppercase tracking-widest mt-1">{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phase banner strip */}
          <div className="max-w-screen-2xl mx-auto mt-4 flex items-center gap-3">
            <span className="px-3 py-1.5 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest border border-white/30">
              {phase.label}
            </span>
            {matchPhase === 'match-day' && (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-white/80 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white" /> FULL DEPLOYMENT ACTIVE
              </span>
            )}
            {(matchPhase === 'no-match' || matchPhase === 'post-match-done') && (
              <span className="text-[10px] text-white/60 font-semibold">
                Check back on a match day to see active staff deployment.
              </span>
            )}
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="bg-white p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-screen-2xl mx-auto">
          
          {/* COLUMN 1 — MY SHIFT */}
          <div className="bg-gray-100 p-6 flex flex-col gap-6 border border-gray-200">
            <h2 className="text-xl font-black uppercase tracking-wider text-gray-950 border-b-2 border-gray-900 pb-2">
              My Shift Console
            </h2>

            {/* Role selector */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="assigned-role-select" className="text-[10px] text-gray-700 font-bold uppercase tracking-wider">Assigned Role</label>
              <select
                id="assigned-role-select"
                value={myRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="border-2 border-gray-900 p-3 bg-white text-gray-900 font-bold text-sm focus:outline-none"
              >
                <option value="Security">Security Coordinator</option>
                <option value="Medical">Medical Responder</option>
                <option value="Volunteer">Volunteer Steward</option>
                <option value="Operations">Operations Dispatch</option>
              </select>
            </div>

            {/* Current assignment display */}
            <div className="bg-white border border-gray-300 p-4">
              <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Current Assignment</span>
              <span className="block font-black text-gray-900 text-base mt-1 uppercase">
                {ROLE_ASSIGNMENTS[myRole]}
              </span>
            </div>

            {/* Task checklist */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1 border-b border-gray-200 pb-2">Active Task List</span>
              <div className="flex flex-col">
                {tasks.map(t => (
                  <label key={t.id} className="flex items-center gap-3 border-b border-gray-200 py-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleTask(t.id)}
                      className="w-4.5 h-4.5 border-2 border-gray-900 rounded-none text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span className={`text-xs font-bold ${t.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {t.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Buttons */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Update Duty Status</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'ON DUTY', state: 'ON DUTY', activeBg: 'bg-green-600 text-white border-green-600', inactiveColor: 'border-2 border-green-600 text-green-600 bg-transparent' },
                  { label: 'ON BREAK', state: 'ON BREAK', activeBg: 'bg-amber-500 text-white border-amber-500', inactiveColor: 'border-2 border-amber-500 text-amber-500 bg-transparent' },
                  { label: 'SUPPORT', state: 'SUPPORT', activeBg: 'bg-red-600 text-white border-red-600', inactiveColor: 'border-2 border-red-600 text-red-600 bg-transparent animate-pulse' },
                ].map(s => {
                  const active = myStatus === s.state;
                  return (
                    <button
                      key={s.state}
                      onClick={() => setMyStatus(s.state)}
                      className={`py-2.5 px-1 text-[10px] font-black uppercase transition-all rounded-none cursor-pointer ${
                        active ? s.activeBg : s.inactiveColor
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUMN 2 — TEAM ROSTER */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-black uppercase tracking-wider text-gray-950 border-b-2 border-gray-900 pb-2">
              Active Team Roster
            </h2>

            {/* Search */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search team members by name/badge..."
              className="border-2 border-gray-900 p-3 w-full text-xs font-semibold focus:outline-none placeholder-gray-400"
            />

            {/* Filter row */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter roster by role"
                className="border-2 border-gray-900 p-2.5 bg-white text-gray-900 text-xs font-bold focus:outline-none"
              >
                <option value="All">All Roles</option>
                <option value="Security">Security</option>
                <option value="Medical">Medical</option>
                <option value="Volunteer">Volunteer</option>
                <option value="Operations">Operations</option>
              </select>

              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                aria-label="Filter roster by zone"
                className="border-2 border-gray-900 p-2.5 bg-white text-gray-900 text-xs font-bold focus:outline-none"
              >
                <option value="All">All Zones</option>
                {['A','B','C','D','E','F','G','H'].map(z => (
                  <option key={z} value={`Zone ${z}`}>Zone {z}</option>
                ))}
              </select>
            </div>

            {/* Show off-shift toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-700 font-bold uppercase tracking-wider">
                {filteredStaff.length} member{filteredStaff.length !== 1 ? 's' : ''} shown
              </span>
              <button
                onClick={() => setShowOffShift(v => !v)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border-2 cursor-pointer transition-colors ${
                  showOffShift
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-900 hover:bg-gray-100'
                }`}
              >
                {showOffShift ? '✓ Showing Off-Shift' : 'Show Off-Shift'}
              </button>
            </div>

            {/* Scrollable Table */}
            <div className="overflow-y-auto max-h-[380px] border border-gray-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white uppercase text-[9px] tracking-widest font-black sticky top-0">
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Zone</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-600 font-bold">
                        {(matchPhase === 'no-match' || matchPhase === 'post-match-done') && !showOffShift
                          ? <>
                              <div className="flex justify-center mb-2">
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  <Shield size={32} className="text-gray-500" />
                                </motion.div>
                              </div>
                              <div>No match today — staff are off-shift.</div>
                              <button onClick={() => setShowOffShift(true)} className="mt-3 px-4 py-2 border-2 border-gray-900 text-xs font-black uppercase cursor-pointer hover:bg-gray-100">
                                Show All Staff (Off-Shift)
                              </button>
                            </>
                          : 'No staff match your search criteria.'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map(s => (
                      <tr key={s.id} className="border-b border-gray-150 hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-gray-950">{s.name}</p>
                          <span className="text-[9px] text-gray-600 font-mono">{s.badge}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 font-semibold uppercase text-[9px]">
                          {s.role}
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={s.zone}
                            onChange={(e) => reassignStaff(s.id, e.target.value)}
                            aria-label={`Reassign zone for ${s.name}`}
                            className="bg-transparent border border-gray-200 rounded px-1.5 py-0.5 text-[10px] text-blue-600 font-bold focus:outline-none"
                          >
                            {['A','B','C','D','E','F','G','H'].map(z => (
                              <option key={z} value={`Zone ${z}`}>Zone {z}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={s.status}
                            onChange={(e) => updateStaffStatus(s.id, e.target.value)}
                            aria-label={`Update status for ${s.name}`}
                            className={`border rounded px-1.5 py-0.5 text-[10px] font-bold focus:outline-none ${
                              s.status === 'active'     ? 'bg-green-100 text-green-800 border-green-200' :
                              s.status === 'break'      ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              s.status === 'responding' ? 'bg-red-100 text-red-800 border-red-200' :
                              s.status === 'standby'    ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              /* off-shift */              'bg-gray-100 text-gray-500 border-gray-200'
                            }`}
                          >
                            <option value="active">ON DUTY</option>
                            <option value="break">BREAK</option>
                            <option value="responding">SUPPORT</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* COLUMN 3 — AI GUIDANCE */}
          <div className="bg-gray-950 p-6 flex flex-col gap-4 border border-gray-900 text-white">
            <h2 className="text-xl font-black uppercase tracking-wider text-white border-b-2 border-gray-800 pb-2">
              AI Guidance
            </h2>

            {/* Quick scenario buttons */}
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">QUICK PROTOCOLS</span>
              <div className="flex flex-col border border-gray-800">
                {Object.keys(PROTOCOL_SCENARIOS).map(scen => (
                  <button
                    key={scen}
                    onClick={() => {
                      setGuidanceScenario(scen);
                      handleGetProtocol(scen);
                    }}
                    className="bg-gray-900 text-white px-4 py-3 border-b border-gray-850 hover:bg-green-600 text-left font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors last:border-b-0"
                  >
                    {scen}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom input */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">OR CUSTOM SITUATION</label>
              <textarea
                value={guidanceScenario}
                onChange={(e) => setGuidanceScenario(e.target.value)}
                placeholder="Type custom scenario (e.g. spectator blocking emergency fire corridor in Section 18)..."
                className="bg-gray-900 text-white border border-gray-800 p-3 w-full text-xs min-h-[70px] resize-none focus:outline-none focus:border-green-600"
              />
            </div>

            <button
              onClick={() => handleGetProtocol()}
              disabled={guidanceLoading || !guidanceScenario.trim()}
              className="bg-green-600 text-white font-black py-4 w-full uppercase tracking-wider hover:bg-green-500 transition-colors disabled:opacity-50 cursor-pointer rounded-none"
            >
              {guidanceLoading ? 'GETTING PROTOCOL...' : 'GET PROTOCOL'}
            </button>

            {/* AI Protocol Response Panel */}
            <div className="bg-gray-900 p-4 border border-gray-850 min-h-[160px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {guidanceLoading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-6 gap-2">
                    <RefreshCw size={16} className="animate-spin text-green-500" />
                    <span className="text-[10px] text-gray-400 font-bold animate-pulse uppercase">Synthesizing protocol...</span>
                  </motion.div>
                )}
                {guidanceProtocol && !guidanceLoading && (
                  <motion.div key="response" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                    <span className="text-[10px] text-green-400 font-black uppercase tracking-widest border-b border-gray-800 pb-1 flex items-center gap-1.5">
                      <Shield size={12} /> PROTOCOL ACTION PLAN
                    </span>
                    <div className="space-y-2">
                      {guidanceProtocol.split('\n').filter(l => l.trim().length > 0).map((line, idx) => (
                        <div key={idx} className="border-l-4 border-green-500 pl-3 py-0.5 text-xs text-gray-200 font-bold leading-relaxed">
                          {line}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                {!guidanceProtocol && !guidanceLoading && (
                  <motion.div key="empty" initial={{ opacity: 0 }} className="text-center py-8">
                    <p className="text-xs text-gray-600 font-bold">Select a scenario above to display the step-by-step response roadmap.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* FULL WIDTH — PA ANNOUNCEMENT GENERATOR */}
        <div className="bg-gray-100 border-t-2 border-gray-900 p-8 max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Inputs */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Megaphone className="text-gray-900" size={24} />
              <h2 className="text-xl font-black text-gray-950 uppercase tracking-tight">PA ANNOUNCEMENT GENERATOR</h2>
            </div>
            <p className="text-xs text-gray-700 leading-snug">Generate clear and professional public announcements instantly translated into FIFA broadcast languages.</p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-700 font-bold uppercase tracking-wider">Describe the Situation</label>
              <textarea
                value={paSituation}
                onChange={(e) => setPaSituation(e.target.value)}
                placeholder="e.g. Requesting spectator with license tag ABC-123 to move their vehicle blocking Gate B lane..."
                className="border-2 border-gray-900 p-3 w-full min-h-[100px] text-xs bg-white text-gray-900 font-semibold focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="target-language-select" className="text-[10px] text-gray-700 font-bold uppercase tracking-wider">Target Language</label>
              <select
                id="target-language-select"
                value={paLanguage}
                onChange={(e) => setPaLanguage(e.target.value)}
                className="border-2 border-gray-900 p-3 bg-white text-gray-950 font-bold text-xs focus:outline-none"
              >
                {LOCAL_LANGS.map(l => (
                  <option key={l.code} value={l.name}>{l.name} ({l.code.toUpperCase()})</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGeneratePA}
              disabled={paLoading || !paSituation.trim()}
              className="bg-gray-900 text-white font-black py-4 px-8 uppercase hover:bg-blue-600 transition-colors disabled:opacity-40 cursor-pointer rounded-none text-xs tracking-wider"
            >
              {paLoading ? 'Generating...' : 'GENERATE ANNOUNCEMENT'}
            </button>
          </div>

          {/* Right Output */}
          <div className="bg-white border-2 border-gray-900 p-6 relative flex flex-col justify-between min-h-[220px]">
            {/* Copy Button */}
            {paOutput && (
              <button
                onClick={handleCopyPA}
                className="flex items-center gap-1 bg-gray-100 border border-gray-300 px-3 py-1 font-bold text-[10px] uppercase text-gray-600 hover:bg-gray-200 transition-colors absolute top-4 right-4 rounded-none cursor-pointer"
              >
                {paCopied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                {paCopied ? 'Copied' : 'Copy'}
              </button>
            )}

            <div className="flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {paLoading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-2 py-8">
                    <RefreshCw size={20} className="animate-spin text-gray-900" />
                    <span className="text-[10px] text-gray-400 font-black animate-pulse uppercase tracking-wider">Translating PA text...</span>
                  </motion.div>
                )}
                {paOutput && !paLoading && (
                  <motion.div key="output" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">PA AUDIO READ-OUT</span>
                    <p className="text-base font-black text-gray-950 leading-relaxed italic">
                      "{paOutput}"
                    </p>
                  </motion.div>
                )}
                {!paOutput && !paLoading && (
                  <motion.div key="empty" initial={{ opacity: 0 }} className="text-center py-8">
                    <p className="text-sm text-gray-400 font-bold">Write a announcement scenario on the left and click GENERATE ANNOUNCEMENT to trigger live translations.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </PageTransition>
  );
}
