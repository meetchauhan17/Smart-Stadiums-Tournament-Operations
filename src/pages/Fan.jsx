import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Users, Navigation, MessageSquare, Compass,
  ShoppingBag, SendHorizontal, AlertCircle, Info,
  Star, Clock, CloudSun, Calendar, Globe
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { useAI } from '../hooks/useAI';
import PageHeader from '../components/PageHeader';
import ZoneMap from '../components/ZoneMap';
import LiveBadge from '../components/LiveBadge';
import PageTransition from '../components/PageTransition';

// ─── Constants ───
const STADIUM_LOCATIONS = [
  { id: 'Gate A', label: 'Gate A (VIP Entry)', distance: '120m', walk: '2 min' },
  { id: 'Gate C', label: 'Gate C (North Entry)', distance: '280m', walk: '4 min' },
  { id: 'Gate D', label: 'Gate D (Accessibility)', distance: '190m', walk: '3 min' },
  { id: 'Gate E', label: 'Gate E (South Entry)', distance: '340m', walk: '5 min' },
  { id: 'Restrooms North', label: 'Restrooms Block N1', distance: '40m', walk: '1 min' },
  { id: 'Restrooms South', label: 'Restrooms Block S2', distance: '90m', walk: '2 min' },
  { id: 'First Aid Post 2', label: 'First Aid (Concourse 1)', distance: '85m', walk: '2 min' },
  { id: 'Food Court A', label: 'Food Court (Concourse 2)', distance: '70m', walk: '1.5 min' },
  { id: 'FIFA Store', label: 'Official Merchandise Store', distance: '150m', walk: '3 min' },
];

const LOCAL_LANGS = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'pt', flag: '🇧🇷', name: 'Português' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
];

export default function Fan() {
  const { t, i18n } = useTranslation();
  const {
    currentVenue,
    currentMatchAtVenue,
    weatherData,
    updateFanSatisfaction,
  } = useStadium();

  // ── Profile State ──
  const [profile, setProfile] = useState({
    name: 'Alex Mercer',
    section: 'Zone E',
    row: 'G',
    seat: '14',
    zone: 'E',
  });

  // ── Navigation State ──
  const [navDestination, setNavDestination] = useState('');
  const [navInstructions, setNavInstructions] = useState([]);
  const [navTime, setNavTime] = useState('');
  const [navLoading, setNavLoading] = useState(false);
  const [navError, setNavError] = useState('');

  // ── Rating State ──
  const [rating, setRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [rated, setRated] = useState(false);

  // ── Concession Queues state ──
  const [queues, setQueues] = useState([
    { id: 'q1', name: 'Halal Grill & Kebab', wait: 8, status: 'normal' },
    { id: 'q2', name: 'Viking Burgers & Fries', wait: 14, status: 'high' },
    { id: 'q3', name: 'Stadium Tacos & Brews', wait: 4, status: 'low' },
    { id: 'q4', name: 'Official FIFA Merchandise Shop', wait: 9, status: 'normal' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Memoize filtered concessions list
  const filteredQueues = useMemo(() => {
    return queues.filter(q => q.name.toLowerCase().includes(debouncedQuery.toLowerCase()));
  }, [queues, debouncedQuery]);

  // ── Tabs state ──
  const [activeTab, setActiveTab] = useState('directions');

  // ── Lang-locked AI System Prompt Builder ──
  const langMap = { en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese', ar: 'Arabic' };
  const currentLangName = langMap[i18n.language] || 'English';

  const fanSystemPrompt = `You are a friendly FIFA World Cup 2026 Fan Assistant at ${currentVenue.name}.
Match: ${currentMatchAtVenue.homeTeam.name} vs ${currentMatchAtVenue.awayTeam.name}
Language rule: ALWAYS respond in ${currentLangName} — regardless of what language the user types in.
You help fans with seating, directions, food, services, and general match info.
You must be warm and helpful. Keep responses under 100 words.`;

  const { messages, sendMessage, isLoading, clearMessages } = useAI(fanSystemPrompt);
  const [chatInput, setChatInput] = useState('');

  // ── Simulated countdown ──
  const [countdown, setCountdown] = useState('02:14:38');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        const parts = prev.split(':').map(Number);
        let [h, m, s] = parts;
        s--;
        if (s < 0) {
          s = 59;
          m--;
          if (m < 0) {
            m = 59;
            h--;
          }
        }
        if (h < 0) return '00:00:00';
        return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
      });
    }, 1000);

    const queueTimer = setInterval(() => {
      setQueues(prev =>
        prev.map(q => {
          const shift = Math.floor((Math.random() - 0.5) * 3);
          const newWait = Math.max(1, q.wait + shift);
          return {
            ...q,
            wait: newWait,
            status: newWait > 12 ? 'high' : newWait > 6 ? 'normal' : 'low',
          };
        })
      );
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(queueTimer);
    };
  }, []);

  const generateDirections = async (destination) => {
    if (!destination) return;
    setNavLoading(true);
    setNavError('');
    setNavInstructions([]);

    try {
      const { getNavigationDirections } = await import('../utils/aiClient');
      const res = await getNavigationDirections(profile.section, destination, currentVenue.name);
      
      if (res.success) {
        const parsed = JSON.parse(res.data);
        setNavInstructions(parsed.steps || []);
        setNavTime(parsed.time || '4 min');
      } else {
        throw new Error(res.error || 'Failed to calculate directions');
      }
    } catch {
      setNavError(t('common.error') + ': Route fallbacks active.');
      setNavInstructions([
        `1. Exit your section corridor and head down the main ramp to Concourse Level.`,
        `2. Walk past Food Court A toward Gate Entry corridor.`,
        `3. Follow the directional signage matching "${destination}".`,
      ]);
      setNavTime('5 min');
    } finally {
      setNavLoading(false);
    }
  };

  const handleSendChat = (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const handleRating = (score) => {
    setRating(score);
    setRated(true);
    updateFanSatisfaction('overall', score * 20);
  };

  const activeLangConfig = LOCAL_LANGS.find(l => l.code === i18n.language);

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-6 mt-14 bg-white text-[#111827]">
        {/* Non-English active banner indicator */}
        {i18n.language !== 'en' && activeLangConfig && (
          <div className="mb-4 p-3 rounded-none border-2 border-[#3B82F6] bg-[#EFF6FF] flex items-center justify-between text-xs text-[#1D4ED8] font-bold">
            <span className="flex items-center gap-2">
              <Globe size={13} className="animate-spin" style={{ animationDuration: '6s' }} />
              <span>
                {t('fan.viewing_indicator')} <strong>{activeLangConfig.name} {activeLangConfig.flag}</strong>
              </span>
            </span>
            <button
              onClick={() => i18n.changeLanguage('en')}
              aria-label="Switch back to English UI language"
              className="text-[10px] uppercase font-bold tracking-wider hover:underline focus:outline-none cursor-pointer"
            >
              Switch to English
            </button>
          </div>
        )}

        <PageHeader
          title={t('fan.title')}
          subtitle={t('fan.subtitle')}
          icon={Users}
          actions={<LiveBadge status="live" label="FAN FEED" />}
        />

        {/* Swap main Columns: Left is AI navigation/assistant chat (6 Cols), Right is Profile/Match config info (6 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          
          {/* ─── LEFT COLUMN (6 Cols): ACTIVE ASSISTANCE HUB ─── */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex bg-[#F3F4F6] border-2 border-[#111827] rounded-none p-1 shrink-0" role="tablist">
              <button
                onClick={() => setActiveTab('directions')}
                role="tab"
                aria-selected={activeTab === 'directions'}
                aria-label="Show AI Navigation Wayfinding"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-none text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'directions' ? 'bg-[#3B82F6] text-white' : 'text-[#6B7280] hover:bg-white hover:text-[#111827]'
                }`}
              >
                <Compass size={13} />
                {t('fan.tab_navigation')}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                role="tab"
                aria-selected={activeTab === 'chat'}
                aria-label="Open AI Assistant chat window"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-none text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'chat' ? 'bg-[#3B82F6] text-white' : 'text-[#6B7280] hover:bg-white hover:text-[#111827]'
                }`}
              >
                <MessageSquare size={13} />
                {t('fan.tab_assistant')}
              </button>
              <button
                onClick={() => setActiveTab('experience')}
                role="tab"
                aria-selected={activeTab === 'experience'}
                aria-label="Show Concessions and Concourse Hub"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-none text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'experience' ? 'bg-[#3B82F6] text-white' : 'text-[#6B7280] hover:bg-white hover:text-[#111827]'
                }`}
              >
                <ShoppingBag size={13} />
                {t('fan.tab_hub')}
              </button>
            </div>

            <div className="flex-1 min-h-[480px] flex flex-col">
              <AnimatePresence mode="wait">
                {/* TAB 1: AI NAVIGATION */}
                {activeTab === 'directions' && (
                  <motion.div
                    key="directions-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1"
                  >
                    <ZoneMap
                      selectedZoneId={profile.section.replace('Zone ', '')}
                      onZoneSelect={(zoneId) => setProfile(p => ({ ...p, section: `Zone ${zoneId}` }))}
                    />

                    <div className="bg-white border-2 border-[#111827] rounded-none p-5 flex flex-col justify-between shadow-none">
                      <div>
                        <h3 className="font-heading font-extrabold text-[#111827] text-sm mb-1 flex items-center gap-2">
                          <Compass size={16} className="text-[#3B82F6]" />
                          {t('fan.nav_title')}
                        </h3>
                        <p className="text-xs text-[#6B7280] mb-4 font-semibold">{t('fan.nav_desc')}</p>

                        <div className="flex flex-col gap-2 mb-4">
                          <label htmlFor="destination-select" className="text-[10px] text-[#6B7280] uppercase tracking-wider font-extrabold">
                            {t('fan.select_destination')}
                          </label>
                          <select
                            id="destination-select"
                            value={navDestination}
                            onChange={(e) => setNavDestination(e.target.value)}
                            aria-label="Select walking target location"
                            className="w-full bg-[#F3F4F6] border-2 border-[#111827] rounded-none px-3 py-2 text-xs text-[#111827] font-bold focus:bg-white focus:outline-none"
                          >
                            <option value="">{t('fan.choose_destination')}</option>
                            {STADIUM_LOCATIONS.map(loc => (
                              <option key={loc.id} value={loc.label}>{loc.label}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => generateDirections(navDestination)}
                          disabled={!navDestination || navLoading}
                          aria-label="Calculate directions from current zone"
                          className="btn-primary w-full text-center cursor-pointer text-xs"
                        >
                          {navLoading ? t('fan.calculating_route') : t('fan.find_route')}
                        </button>

                        {navInstructions.length > 0 && (
                          <div className="mt-5 space-y-2 border-t-2 border-[#111827] pt-4">
                            <div className="flex items-center justify-between text-[10px] text-[#6B7280] uppercase tracking-wider font-bold mb-2">
                              <span>{t('fan.directions_label')}</span>
                              <span className="text-[#10B981] flex items-center gap-1">
                                <Clock size={10} /> {navTime} {t('fan.walk_time')}
                              </span>
                            </div>
                            {navInstructions.map((step, idx) => (
                              <div key={idx} className="flex gap-2.5 items-start text-xs text-[#111827] font-semibold">
                                <span className="w-5 h-5 rounded-none bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center shrink-0 font-mono text-[10px] font-extrabold border border-[#3B82F6]/20">
                                  {idx + 1}
                                </span>
                                <span className="pt-0.5 leading-snug">{step}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {navInstructions.length === 0 && !navLoading && !navError && (
                          <div className="mt-5 border-t-2 border-[#111827] pt-6 text-center text-[#6B7280]">
                            <Compass size={24} className="opacity-20 mx-auto mb-2 text-[#3B82F6] animate-pulse" />
                            <p className="text-xs font-extrabold text-[#111827]">{t('fan.no_route_title', 'No active route')}</p>
                            <p className="text-[10px] text-[#6B7280] max-w-[200px] mx-auto leading-normal mt-1 font-semibold">
                              Choose a destination from the drop-down list to calculate walking times.
                            </p>
                          </div>
                        )}

                        {navError && (
                          <div className="mt-4 p-3 border-2 border-[#FF3366] bg-[#FFF5F5] flex items-start gap-2">
                            <AlertCircle size={14} className="text-[#FF3366] shrink-0 mt-0.5" />
                            <p className="text-[10px] text-[#FF3366] leading-snug font-semibold">{navError}</p>
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-[#6B7280] mt-4 flex items-center gap-1.5 font-bold">
                        <Info size={11} className="text-[#3B82F6]" />
                        <span>{t('fan.nav_note')}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: AI ASSISTANT CHAT */}
                {activeTab === 'chat' && (
                  <motion.div
                    key="chat-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white border-2 border-[#111827] rounded-none flex-1 flex flex-col overflow-hidden max-h-[500px] shadow-none"
                  >
                    <div className="px-4 py-3 border-b-2 border-[#111827] bg-[#F3F4F6] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-none bg-[#10B981] animate-pulse border border-[#111827]" />
                        <span className="font-heading font-extrabold text-xs text-[#111827] uppercase tracking-wider">
                          {t('fan.chat_title')}
                        </span>
                      </div>
                      <button
                        onClick={clearMessages}
                        aria-label="Clear chat conversation logs"
                        className="text-[10px] text-[#6B7280] hover:text-[#111827] transition-all font-extrabold focus:outline-none cursor-pointer"
                      >
                        {t('fan.chat_reset')}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[300px]">
                      {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10">
                          <MessageSquare size={36} className="text-[#3B82F6] opacity-35 mb-3" />
                          <h4 className="font-heading font-extrabold text-sm text-[#111827] mb-1">
                            {t('fan.chat_empty_title')}
                          </h4>
                          <p className="text-xs text-[#6B7280] max-w-xs leading-relaxed font-semibold">
                            {t('fan.chat_empty_desc')}
                          </p>
                        </div>
                      )}

                      {messages.map(m => (
                        <div
                          key={m.id}
                          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-none px-4 py-3 text-xs leading-relaxed font-semibold border-2 ${
                              m.role === 'user'
                                ? 'bg-[#3B82F6] text-white border-[#111827]'
                                : 'bg-[#F3F4F6] text-[#111827] border-[#111827]'
                            }`}
                          >
                            {m.content}
                            {m.streaming && (
                              <span className="inline-block w-1.5 h-3 bg-[#111827] ml-0.5 animate-pulse" />
                            )}
                          </div>
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-[#F3F4F6] border-2 border-[#111827] rounded-none px-4 py-3 text-xs text-[#6B7280] flex items-center gap-1.5 font-extrabold">
                            <span className="w-1.5 h-1.5 rounded-none bg-[#3B82F6] animate-bounce" />
                            <span className="w-1.5 h-1.5 rounded-none bg-[#3B82F6] animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 rounded-none bg-[#3B82F6] animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSendChat} className="p-3 border-t-2 border-[#111827] bg-[#F3F4F6] flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={t('fan.chat_placeholder')}
                        aria-label="Ask the stadium AI assistant a question"
                        className="flex-1 bg-[#FFFFFF] border-2 border-[#111827] rounded-none px-4 py-2.5 text-xs text-[#111827] font-semibold focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !chatInput.trim()}
                        aria-label="Send message to AI assistant"
                        className="w-10 h-10 rounded-none bg-[#3B82F6] hover:bg-[#2563EB] border-2 border-[#111827] text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 focus:outline-none cursor-pointer"
                      >
                        <SendHorizontal size={16} />
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* TAB 3: FAN SERVICES & CONCESSIONS */}
                {activeTab === 'experience' && (
                  <motion.div
                    key="experience-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1"
                  >
                    <div className="bg-white border-2 border-[#111827] rounded-none p-5 flex flex-col justify-between shadow-none">
                      <div>
                        <h3 className="font-heading font-extrabold text-[#111827] text-sm mb-3 flex items-center gap-2">
                          <ShoppingBag size={14} className="text-[#3B82F6]" />
                          {t('fan.concessions_title')}
                        </h3>

                        <div className="mb-4">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search food & concessions..."
                            aria-label="Search food concessions stands"
                            className="w-full bg-[#F3F4F6] border-2 border-[#111827] rounded-none px-3 py-2.5 text-xs text-[#111827] font-semibold focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {filteredQueues.length === 0 ? (
                            <p className="text-center py-6 text-xs text-[#6B7280] font-semibold">
                              No concessions match your search query.
                            </p>
                          ) : (
                            filteredQueues.map(q => (
                              <div key={q.id} className="flex items-center justify-between p-3 rounded-none border-2 border-[#111827] bg-[#F3F4F6]">
                                <div>
                                  <p className="text-xs font-extrabold text-[#111827]">{q.name}</p>
                                  <span className="text-[10px] text-[#6B7280] font-bold">{t('fan.queue_estimated')}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className={`text-xs font-extrabold ${
                                    q.status === 'high'    ? 'text-[#FF3366]' :
                                    q.status === 'normal'  ? 'text-[#F59E0B]' : 'text-[#10B981]'
                                  }`}>
                                    {q.wait} min
                                  </span>
                                  <span className="text-[9px] text-[#6B7280] uppercase font-extrabold tracking-wider">
                                    {t(`common.${q.status}`)}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="text-[9px] text-[#6B7280] mt-4 flex items-center gap-1.5 font-bold">
                        <Clock size={10} />
                        <span>{t('fan.concessions_note')}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="bg-[#F3F4F6] border-2 border-[#111827] rounded-none p-5 flex flex-col items-center justify-center text-center shadow-none">
                        <div className="flex items-center gap-1.5 text-[9px] text-[#6B7280] font-extrabold uppercase tracking-wider mb-2">
                          <Calendar size={11} className="text-[#3B82F6]" />
                          {t('fan.countdown_label')}
                        </div>
                        <p className="font-heading font-extrabold text-3xl text-[#111827] tracking-widest font-mono">
                          {countdown}
                        </p>
                      </div>

                      <div className="bg-white border-2 border-[#111827] rounded-none p-4 flex items-center justify-between shadow-none">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-none bg-[#EFF6FF] border-2 border-[#111827] flex items-center justify-center text-[#3B82F6]">
                            <CloudSun size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-[#111827]">{weatherData.condition}</p>
                            <span className="text-[10px] text-[#6B7280] font-bold">{t('fan.weather_label')}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-heading font-extrabold text-[#111827]">{weatherData.temp.value}°C</span>
                          <span className="text-[9px] text-[#6B7280] font-bold">Humidity {weatherData.humidity.value}%</span>
                        </div>
                      </div>

                      <div className="bg-white border-2 border-[#111827] rounded-none p-4 flex flex-col gap-2 shadow-none">
                        <p className="text-xs font-extrabold text-[#111827]">{t('fan.rate_experience')}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1" role="img" aria-label="Rating Stars selector">
                            {[1, 2, 3, 4, 5].map(starIdx => {
                              const isFilled = starIdx <= (ratingHover || rating);
                              return (
                                <button
                                  key={starIdx}
                                  onClick={() => handleRating(starIdx)}
                                  onMouseEnter={() => setRatingHover(starIdx)}
                                  onMouseLeave={() => setRatingHover(0)}
                                  aria-label={`Rate ${starIdx} stars`}
                                  className="focus:outline-none transition-transform active:scale-125 cursor-pointer"
                                  disabled={rated}
                                >
                                  <Star
                                    size={18}
                                    className={`transition-colors ${
                                      isFilled ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#E5E7EB] fill-transparent hover:text-[#F59E0B]'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                          {rated && (
                            <span className="text-[10px] text-[#10B981] font-extrabold">
                              {t('fan.rating_thanks')}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-[#6B7280] font-bold">{t('fan.rating_note')}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ─── RIGHT COLUMN (5 Cols): PROFILE & VENUE INFO (Swapped layout position) ─── */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-white border-2 border-[#111827] rounded-none p-5 flex flex-col items-center text-center shadow-none">
              <div className="relative w-16 h-16 rounded-none bg-[#3B82F6]/10 border-2 border-[#111827] flex items-center justify-center font-heading font-extrabold text-[#3B82F6] text-lg mb-3">
                {profile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h3 className="font-heading font-extrabold text-[#111827] text-base">{profile.name}</h3>
              <span className="text-[10px] text-[#6B7280] tracking-wider font-extrabold uppercase mt-0.5">
                {t('fan.profile_title')}
              </span>

              <div className="grid grid-cols-3 gap-2 w-full mt-4 border-t-2 border-[#111827] pt-4">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-[#6B7280] uppercase tracking-wider font-bold">{t('fan.section')}</span>
                  <span className="text-sm font-heading font-extrabold text-[#3B82F6]">{profile.section.replace('Zone ', '')}</span>
                </div>
                <div className="flex flex-col items-center border-x-2 border-[#111827]">
                  <span className="text-[9px] text-[#6B7280] uppercase tracking-wider font-bold">{t('fan.row')}</span>
                  <span className="text-sm font-heading font-extrabold text-[#111827]">{profile.row}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-[#6B7280] uppercase tracking-wider font-bold">{t('fan.seat')}</span>
                  <span className="text-sm font-heading font-extrabold text-[#111827]">{profile.seat}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#111827] rounded-none p-5 shadow-none">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-[#111827] pb-3 -mx-5 -mt-5 px-5 py-3 bg-[#F3F4F6]">
                <Calendar size={13} className="text-[#3B82F6]" />
                <h4 className="font-heading font-extrabold text-xs text-[#111827] uppercase tracking-wider mb-0">
                  {t('fan.match_info')}
                </h4>
              </div>
              <div className="flex flex-col gap-3 text-xs text-[#111827] mt-2">
                <div className="flex justify-between items-center py-1.5 border-b border-[#E5E7EB] font-bold">
                  <span className="text-[#6B7280]">{t('fan.fixture')}</span>
                  <span className="text-right">
                    {currentMatchAtVenue.homeTeam.flag} {currentMatchAtVenue.homeTeam.code} vs{' '}
                    {currentMatchAtVenue.awayTeam.code} {currentMatchAtVenue.awayTeam.flag}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#E5E7EB] font-bold">
                  <span className="text-[#6B7280]">{t('fan.kickoff')}</span>
                  <span className="font-mono">{currentMatchAtVenue.kickoffTime}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 font-bold">
                  <span className="text-[#6B7280]">{t('fan.gate')}</span>
                  <span className="text-[#10B981] font-extrabold">{currentMatchAtVenue.gates.generalN}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#111827] rounded-none p-5 flex flex-col gap-3 shadow-none">
              <h4 className="font-heading font-extrabold text-xs text-[#3B82F6] uppercase tracking-wider">
                {t('fan.config_title')}
              </h4>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="current-zone-select" className="text-[10px] text-[#6B7280] uppercase tracking-wider font-extrabold">{t('fan.current_zone')}</label>
                <select
                  id="current-zone-select"
                  value={profile.section}
                  onChange={(e) => setProfile(p => ({ ...p, section: e.target.value }))}
                  aria-label="Change current stadium location zone"
                  className="w-full bg-[#F3F4F6] border-2 border-[#111827] rounded-none px-3 py-2 text-xs text-[#111827] font-bold focus:bg-white focus:outline-none"
                >
                  {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H'].map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-extrabold">{t('fan.language_label')}</span>
                <div className="grid grid-cols-5 gap-1">
                  {LOCAL_LANGS.map(l => (
                    <button
                      key={l.code}
                      onClick={() => i18n.changeLanguage(l.code)}
                      aria-label={`Change assistance language to ${l.name}`}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-none border-2 transition-all cursor-pointer ${
                        i18n.language === l.code
                          ? 'border-[#111827] bg-[#3B82F6] text-white font-bold'
                          : 'border-transparent bg-white text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] border-2 hover:border-[#111827]'
                      }`}
                    >
                      <span className="text-sm">{l.flag}</span>
                      <span className="text-[8px] font-bold mt-0.5">{l.code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
