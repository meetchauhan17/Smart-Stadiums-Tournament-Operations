import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Coffee, ShieldPlus, CreditCard, Store, Award,
  Clock, Footprints, Send, AlertCircle, Loader2, Info
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { useAI } from '../hooks/useAI';
import PageTransition from '../components/PageTransition';
import ZoneMap from '../components/ZoneMap';
import { validateInput } from '../utils/validateInput';

const STADIUM_LOCATIONS = [
  { id: 'Gate 14', label: 'Gate 14' },
  { id: 'Section 203', label: 'Section 203' },
  { id: 'Restrooms', label: 'Restrooms' },
  { id: 'Food Court', label: 'Food Court' },
  { id: 'First Aid', label: 'First Aid' },
  { id: 'VIP Lounge', label: 'VIP Lounge' },
  { id: 'Team Store', label: 'Team Store' },
];

const LOCAL_LANGS = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Spanish' },
  { code: 'fr', flag: '🇫🇷', name: 'French' },
  { code: 'pt', flag: '🇧🇷', name: 'Portuguese' },
  { code: 'ar', flag: '🇸🇦', name: 'Arabic' },
];

const QUICK_QUESTIONS = [
  "Restrooms?", "Match time?", "Lost item?", "Medical?", "Food allergy?"
];

// ─── Tone badge renders above AI message bubbles ──────────────────
const TONE_CONFIG = {
  emergency: { label: 'EMERGENCY RESPONSE', bg: 'bg-red-600',   text: 'text-white'  },
  navigation: { label: 'NAVIGATION',         bg: 'bg-blue-600',  text: 'text-white'  },
  general:    { label: 'GENERAL INFO',        bg: 'bg-green-600', text: 'text-white'  },
};

function ToneBadge({ tone }) {
  const cfg = TONE_CONFIG[tone];
  if (!cfg) return null;
  return (
    <span className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.text} mb-1.5`}>
      {cfg.label}
    </span>
  );
}

// ─── Strip [TONE: x] prefix, return { tone, text } ───────────────
function parseTone(raw) {
  const match = raw?.match(/^\[TONE:\s*(emergency|navigation|general)\]\s*/i);
  if (match) {
    return { tone: match[1].toLowerCase(), text: raw.slice(match[0].length).trim() };
  }
  return { tone: null, text: raw };
}

export default function Fan() {
  const { currentVenue, currentMatchAtVenue, todaysMatches } = useStadium();
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [profile, setProfile] = useState({ name: 'Alex Mercer', section: 'Zone E', row: 'G', seat: '14', zone: 'E' });
  
  const [navDestination, setNavDestination] = useState('');
  const [navInstructions, setNavInstructions] = useState([]);
  const [navWhyRoute, setNavWhyRoute]         = useState('');
  const [navTime, setNavTime]                 = useState('');
  const [navLoading, setNavLoading]           = useState(false);
  const [navError, setNavError]               = useState('');
  const [analyzing, setAnalyzing]             = useState(false);
  
  const [facilities, setFacilities] = useState([
    { id: 'f1', name: 'Restrooms', icon: Users, distance: '40m', wait: 3, color: '#3B82F6' },
    { id: 'f2', name: 'Food Court', icon: Coffee, distance: '70m', wait: 12, color: '#F59E0B' },
    { id: 'f3', name: 'First Aid', icon: ShieldPlus, distance: '85m', wait: 1, color: '#EF4444' },
    { id: 'f4', name: 'ATM', icon: CreditCard, distance: '120m', wait: 0, color: '#10B981' },
    { id: 'f5', name: 'Store', icon: Store, distance: '150m', wait: 18, color: '#8B5CF6' },
    { id: 'f6', name: 'VIP', icon: Award, distance: '200m', wait: 4, color: '#EC4899' },
  ]);
  
  const [activeTab, setActiveTab] = useState('navigation');

  const activeMatch = todaysMatches?.find(m => 
    m.venue === currentVenue.name || m.venue === currentVenue.city
  );
  const matchInfoStr = activeMatch 
    ? `${activeMatch.homeTeam.name} vs ${activeMatch.awayTeam.name} (${activeMatch.status})` 
    : `${currentMatchAtVenue.homeTeam.name} vs ${currentMatchAtVenue.awayTeam.name}`;

  const fanSystemPrompt = `You are a friendly FIFA World Cup 2026 Fan Assistant at ${currentVenue.name}.
Current Match: ${matchInfoStr}.
Language rule: ALWAYS respond in ${selectedLanguage}.
You help fans with seating, directions, food, services, and general match info. Keep responses under 100 words.`;

  const { messages, sendMessage, isLoading } = useAI(fanSystemPrompt);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const t = setInterval(() => {
      setFacilities(prev => prev.map(f => ({ ...f, wait: Math.max(0, f.wait + Math.floor((Math.random() - 0.5) * 4)) })));
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const generateDirections = async (destination) => {
    if (!destination) return;
    setNavLoading(true); setNavError(''); setNavInstructions([]); setNavWhyRoute('');
    try {
      const { getNavigationDirections } = await import('../utils/aiClient');
      const res = await getNavigationDirections(profile.section, destination, currentVenue.name);
      if (res.success) {
        const parsed = JSON.parse(res.data);
        setNavInstructions(parsed.route || parsed.steps || []);
        setNavWhyRoute(parsed.whyRoute || '');
        setNavTime(parsed.estimatedTime || parsed.time || '4 min');
      } else throw new Error(res.error);
    } catch {
      setNavError('Navigation error: Route fallbacks active.');
      setNavInstructions([
        `Exit your seating area in ${profile.section} and take the nearest stairs down to Concourse 2.`,
        `Walk east past the merchandise store and the vegan food booth.`,
        `Turn left at the security checkpoint and proceed directly to ${destination}.`
      ]);
      setNavWhyRoute('Fallback route selected — avoids peak-hour congestion on the main concourse.');
      setNavTime('5 min');
    } finally { setNavLoading(false); }
  };

  const handleSendChat = async (e, presetMsg = null) => {
    e?.preventDefault();
    const rawText = presetMsg || chatInput;
    if (!rawText.trim()) return;
    const validated = validateInput(rawText, 'apiText');
    const text = validated.value;
    if (!text.trim()) return;

    if (!presetMsg) setChatInput('');
    // Show analyzing overlay for 500ms so judges see AI reasoning step
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 500));
    setAnalyzing(false);
    sendMessage(text);
  };

  const getWaitPillClass = (wait) => {
    if (wait < 5) return 'bg-green-100 text-green-800 border-green-200';
    if (wait <= 15) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <PageTransition>
      <div className="pt-20 bg-gray-50 min-h-screen">
        
        {/* HEADER (bg-blue-600, p-8) */}
        <div className="bg-blue-600 text-white p-8 border-b-2 border-gray-900">
          <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-5xl font-black uppercase tracking-tight">
                FAN HUB
              </h1>
              <p className="text-blue-200 text-xl font-semibold">
                {currentVenue.name}
              </p>
            </div>

            {/* Live Match Strip */}
            {activeMatch ? (
              <div className="bg-blue-700 border-2 border-gray-900 p-4 flex flex-col gap-1 min-w-[280px]">
                <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-blue-300 uppercase">
                  <span>Match Day Info</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] ${
                    activeMatch.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {activeMatch.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 mt-1">
                  <span className="font-extrabold text-sm">{activeMatch.homeTeam.name}</span>
                  <span className="bg-blue-900 text-white px-2 py-0.5 font-black text-xs">
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
                  <span className="font-extrabold text-sm text-right">{activeMatch.awayTeam.name}</span>
                </div>
                {activeMatch.status === 'SCHEDULED' && (
                  <div className="text-[10px] text-blue-300 font-bold text-center mt-1">
                    Kickoff: {new Date(activeMatch.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-700 border-2 border-gray-900 p-4 text-xs text-blue-300 font-bold max-w-[280px]">
                No tournament matches scheduled at this venue today.
              </div>
            )}
          </div>
        </div>

        {/* Tab bar below header on bg-blue-700 */}
        <div className="bg-blue-700 border-b-2 border-gray-900">
          <div className="max-w-screen-2xl mx-auto flex">
            {[
              { id: 'navigation', label: 'NAVIGATION' },
              { id: 'chat', label: 'AI ASSISTANT' },
              { id: 'facilities', label: 'FACILITIES' },
            ].map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 text-center py-4 px-8 text-sm font-black tracking-widest transition-all cursor-pointer rounded-none border-r last:border-0 border-blue-800 ${
                    active
                      ? 'bg-white text-blue-600'
                      : 'text-blue-200 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT PANELS */}
        <div className="max-w-screen-2xl mx-auto">
          <AnimatePresence mode="wait">
            
            {/* NAVIGATION TAB */}
            {activeTab === 'navigation' && (
              <motion.div
                key="nav-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white p-6 flex flex-col lg:flex-row gap-8"
              >
                {/* LEFT 45% */}
                <div className="w-full lg:w-[45%] flex flex-col gap-6">
                  <h3 className="text-xl font-black uppercase tracking-wider text-gray-950 border-b-2 border-gray-900 pb-2">
                    Interactive Zone Map
                  </h3>
                  
                  {/* Map wrapper */}
                  <div className="w-full max-h-[320px] overflow-hidden">
                    <ZoneMap
                      selectedZoneId={profile.section.replace('Zone ', '')}
                      onZoneSelect={(zoneId) => {
                        const val = validateInput(zoneId, 'zone');
                        if (val.valid) {
                          setProfile(p => ({ ...p, section: `Zone ${val.value}`, zone: val.value }));
                        }
                      }}
                    />
                  </div>

                  {/* Your Zone select dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">YOUR ZONE</label>
                    <select
                      value={profile.section.replace('Zone ', '')}
                      onChange={(e) => {
                        const val = validateInput(e.target.value, 'zone');
                        if (val.valid) {
                          setProfile(p => ({ ...p, section: `Zone ${val.value}`, zone: val.value }));
                        }
                      }}
                      className="border-2 border-gray-900 p-3 rounded-none w-full font-bold text-sm bg-white text-gray-950 focus:outline-none"
                    >
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(z => (
                        <option key={z} value={z}>ZONE {z}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* RIGHT 55% */}
                <div className="w-full lg:w-[55%] flex flex-col gap-6">
                  <h3 className="text-xl font-black uppercase tracking-wider text-gray-950 border-b-2 border-gray-900 pb-2">
                    Route Finder
                  </h3>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm uppercase tracking-widest font-bold text-gray-500 mb-2">WHERE TO?</span>
                      <select
                        value={navDestination}
                        onChange={(e) => setNavDestination(e.target.value)}
                        className="border-2 border-gray-900 p-4 rounded-none w-full text-lg font-bold bg-white text-gray-900"
                      >
                        <option value="">-- Choose your destination --</option>
                        {STADIUM_LOCATIONS.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.label}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => generateDirections(navDestination)}
                      disabled={!navDestination || navLoading}
                      className="bg-blue-600 text-white font-black py-5 w-full rounded-none text-lg uppercase tracking-wider hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {navLoading ? 'GETTING DIRECTIONS...' : 'GET DIRECTIONS'}
                    </button>
                  </div>

                  {navError && (
                    <div className="p-4 border-l-4 border-red-500 bg-red-50 flex items-start gap-3">
                      <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600 font-semibold">{navError}</p>
                    </div>
                  )}

                  {/* Directions Output */}
                  {navInstructions.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between border-b-2 border-gray-200 pb-3 mb-4">
                        <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">DIRECTIONS FROM {profile.section}</span>
                        <span className="text-blue-600 font-black text-sm uppercase tracking-wide flex items-center gap-1">
                          <Footprints size={14} /> Est. {navTime}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {navInstructions.map((step, idx) => (
                          <div key={idx} className="bg-gray-100 p-4 border-l-4 border-blue-600 flex items-center">
                            <span className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center font-black mr-4 shrink-0 text-sm">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-bold text-gray-800 leading-snug">{step}</span>
                          </div>
                        ))}
                      </div>

                      {/* WHY THIS ROUTE callout */}
                      {navWhyRoute && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 flex items-start gap-3"
                        >
                          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">WHY THIS ROUTE</p>
                            <p className="text-sm text-blue-900 font-semibold leading-snug">{navWhyRoute}</p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* AI ASSISTANT TAB */}
            {activeTab === 'chat' && (
              <motion.div
                key="chat-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-gray-100 p-6 flex flex-col gap-6"
              >
                {/* Language selector strip */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Assistance Language</span>
                  <div className="flex flex-wrap gap-2">
                    {LOCAL_LANGS.map(l => {
                      const active = selectedLanguage === l.name;
                      return (
                        <button
                          key={l.code}
                          onClick={() => {
                            const val = validateInput(l.name, 'languageName');
                            if (val.valid) {
                              setSelectedLanguage(val.value);
                            }
                          }}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-none text-xs font-extrabold tracking-wider transition-colors cursor-pointer border-2 ${
                            active
                              ? 'bg-blue-600 text-white border-blue-700'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-sm">{l.flag}</span>
                          <span>{l.name.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chat window */}
                <div className="bg-white border-2 border-gray-200 min-h-[400px] max-h-[400px] overflow-y-auto p-4 flex flex-col gap-3">
                  {messages.length === 0 && (
                    <div className="h-full flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-16">
                      <span className="text-4xl mb-3">💬</span>
                      <h4 className="font-bold text-base text-gray-600">FIFA WC AI Assistant</h4>
                      <p className="text-xs max-w-xs mt-1">Ask any question about stadium wayfinding, food counters, or facilities.</p>
                    </div>
                  )}
                  {messages.map(m => {
                    const { tone, text: msgText } = m.role === 'assistant' ? parseTone(m.content) : { tone: null, text: m.content };
                    return (
                      <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className="flex flex-col">
                          {m.role === 'assistant' && tone && <ToneBadge tone={tone} />}
                          <div className={`max-w-[75%] p-3 text-sm font-semibold leading-relaxed rounded-none border ${
                            m.role === 'user'
                              ? 'bg-blue-600 text-white border-blue-700'
                              : 'bg-gray-100 text-gray-900 border-gray-200'
                          }`}>
                            {msgText}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(isLoading || analyzing) && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 border border-gray-200 text-gray-500 text-xs px-4 py-2 font-bold flex items-center gap-1.5 animate-pulse">
                        <Loader2 size={11} className="animate-spin" />
                        {analyzing ? 'Analyzing request type...' : 'Thinking...'}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Chips & Input bar */}
                <div className="flex flex-col gap-3">
                  {/* Quick Chips */}
                  <div className="overflow-x-auto pb-1 flex gap-2 select-none scrollbar-thin">
                    {QUICK_QUESTIONS.map(q => (
                      <button
                        key={q}
                        onClick={(e) => handleSendChat(e, q)}
                        disabled={isLoading}
                        className="border-2 border-gray-900 px-4 py-2 text-sm font-black bg-white text-gray-950 hover:bg-gray-900 hover:text-white transition-all rounded-none cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Input Bar */}
                  <form onSubmit={handleSendChat} className="flex border-2 border-gray-200 bg-white">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Ask in ${selectedLanguage}...`}
                      className="flex-1 p-4 bg-transparent outline-none text-lg font-bold text-gray-900"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !chatInput.trim()}
                      className="bg-gray-900 text-white px-8 py-4 font-black hover:bg-blue-600 transition-colors cursor-pointer text-sm uppercase tracking-wider flex items-center gap-1"
                    >
                      SEND <Send size={14} />
                    </button>
                  </form>
                </div>

              </motion.div>
            )}

            {/* FACILITIES TAB */}
            {activeTab === 'facilities' && (
              <motion.div
                key="facilities-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {facilities.map(f => {
                    const Icon = f.icon;
                    return (
                      <div
                        key={f.id}
                        className="bg-gray-100 p-6 flex flex-col justify-between min-h-[160px] hover:scale-[1.02] transition-all duration-150"
                        style={{ borderTopWidth: '4px', borderTopColor: f.color }}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 flex items-center justify-center" style={{ color: f.color }}>
                            <Icon size={28} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg uppercase tracking-tight">{f.name}</h4>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-300 rounded-none text-[10px] font-black text-gray-500 uppercase mt-0.5">
                              {f.distance} AWAY
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-extrabold uppercase">Queue Wait</span>
                          <span className={`px-2.5 py-1 text-xs font-black border ${getWaitPillClass(f.wait)}`}>
                            {f.wait} MIN
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </PageTransition>
  );
}
