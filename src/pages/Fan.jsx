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
import GlowButton from '../components/GlowButton';
import LiveBadge from '../components/LiveBadge';
import PageTransition from '../components/PageTransition';

// ─── Constants ────────────────────────────────────────────────────
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

  // ── Performance: Debounce Search for Concessions ──
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Memoize filtered concessions list based on debounced search query
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
Be warm and helpful. Keep responses under 100 words.`;

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
      <div className="max-w-6xl mx-auto px-4 py-6 mt-14">
      {/* Non-English active banner indicator */}
      {i18n.language !== 'en' && activeLangConfig && (
        <div className="mb-4 p-3 rounded-xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 flex items-center justify-between text-xs text-[#00D4FF]">
          <span className="flex items-center gap-2">
            <Globe size={13} className="animate-spin" style={{ animationDuration: '6s' }} />
            <span>
              {t('fan.viewing_indicator')} <strong>{activeLangConfig.name} {activeLangConfig.flag}</strong>
            </span>
          </span>
          <button
            onClick={() => i18n.changeLanguage('en')}
            aria-label="Switch back to English UI language"
            className="text-[10px] uppercase font-bold tracking-wider hover:underline focus:outline-none"
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

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mt-4">
        {/* ─── LEFT SIDEBAR ─── */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/60 rounded-2xl flex flex-col items-center text-center">
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#00FF87] p-0.5 mb-3">
              <div className="w-full h-full rounded-full bg-[#060D1A] flex items-center justify-center font-heading font-bold text-white text-lg">
                {profile.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <h3 className="font-heading font-semibold text-white text-base">{profile.name}</h3>
            <span className="text-[10px] text-[#4A6580] tracking-widest font-semibold uppercase mt-0.5">
              {t('fan.profile_title')}
            </span>

            <div className="grid grid-cols-3 gap-2 w-full mt-4 border-t border-white/5 pt-4">
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-[#4A6580] uppercase tracking-wider">{t('fan.section')}</span>
                <span className="text-sm font-heading font-bold text-[#00D4FF]">{profile.section.replace('Zone ', '')}</span>
              </div>
              <div className="flex flex-col items-center border-x border-white/5">
                <span className="text-[9px] text-[#4A6580] uppercase tracking-wider">{t('fan.row')}</span>
                <span className="text-sm font-heading font-bold text-white">{profile.row}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-[#4A6580] uppercase tracking-wider">{t('fan.seat')}</span>
                <span className="text-sm font-heading font-bold text-white">{profile.seat}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl">
            <h4 className="font-heading font-semibold text-xs text-[#00D4FF] uppercase tracking-wider mb-3">
              {t('fan.match_info')}
            </h4>
            <div className="flex flex-col gap-3 text-xs text-[#E8F4FD]">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-[#4A6580]">{t('fan.fixture')}</span>
                <span className="font-semibold text-right">
                  {currentMatchAtVenue.homeTeam.flag} {currentMatchAtVenue.homeTeam.code} vs{' '}
                  {currentMatchAtVenue.awayTeam.code} {currentMatchAtVenue.awayTeam.flag}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-[#4A6580]">{t('fan.kickoff')}</span>
                <span className="font-mono font-semibold">{currentMatchAtVenue.kickoffTime}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[#4A6580]">{t('fan.gate')}</span>
                <span className="font-semibold text-[#00FF87]">{currentMatchAtVenue.gates.generalN}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl flex flex-col gap-3">
            <h4 className="font-heading font-semibold text-xs text-[#00D4FF] uppercase tracking-wider">
              {t('fan.config_title')}
            </h4>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="current-zone-select" className="text-[10px] text-[#4A6580] uppercase tracking-wider">{t('fan.current_zone')}</label>
              <select
                id="current-zone-select"
                value={profile.section}
                onChange={(e) => setProfile(p => ({ ...p, section: e.target.value }))}
                aria-label="Change current stadium location zone"
                className="w-full bg-[#0A192F] border border-[#0F2340] rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D4FF]"
              >
                {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H'].map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-[#4A6580] uppercase tracking-wider">{t('fan.language_label')}</span>
              <div className="grid grid-cols-5 gap-1">
                {LOCAL_LANGS.map(l => (
                  <button
                    key={l.code}
                    onClick={() => i18n.changeLanguage(l.code)}
                    aria-label={`Change assistance language to ${l.name}`}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${
                      i18n.language === l.code
                        ? 'border-[#00D4FF] bg-[#00D4FF]/10 text-white'
                        : 'border-[#0F2340] bg-transparent text-[#4A6580] hover:text-[#E8F4FD]'
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

        {/* ─── MAIN CONTENT ─── */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex bg-[#0A192F]/60 border border-[#00D4FF]/10 rounded-xl p-1 shrink-0" role="tablist">
            <button
              onClick={() => setActiveTab('directions')}
              role="tab"
              aria-selected={activeTab === 'directions'}
              aria-label="Show AI Navigation Wayfinding"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'directions' ? 'bg-[#00D4FF] text-[#060D1A]' : 'text-[#4A6580] hover:text-[#E8F4FD]'
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
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'chat' ? 'bg-[#00D4FF] text-[#060D1A]' : 'text-[#4A6580] hover:text-[#E8F4FD]'
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
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'experience' ? 'bg-[#00D4FF] text-[#060D1A]' : 'text-[#4A6580] hover:text-[#E8F4FD]'
              }`}
            >
              <ShoppingBag size={13} />
              {t('fan.tab_hub')}
            </button>
          </div>

          <div className="flex-1 min-h-[460px] flex flex-col">
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

                  <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading font-semibold text-white text-base mb-1 flex items-center gap-2">
                        <Compass size={16} className="text-[#00D4FF]" />
                        {t('fan.nav_title')}
                      </h3>
                      <p className="text-xs text-[#4A6580] mb-4">{t('fan.nav_desc')}</p>

                      <div className="flex flex-col gap-2 mb-4">
                        <label htmlFor="destination-select" className="text-[10px] text-[#4A6580] uppercase tracking-wider font-semibold">
                          {t('fan.select_destination')}
                        </label>
                        <select
                          id="destination-select"
                          value={navDestination}
                          onChange={(e) => setNavDestination(e.target.value)}
                          aria-label="Select walking target location"
                          className="w-full bg-[#0A192F] border border-[#0F2340] rounded-xl px-3 py-2 text-xs text-white focus:border-[#00D4FF]"
                        >
                          <option value="">{t('fan.choose_destination')}</option>
                          {STADIUM_LOCATIONS.map(loc => (
                            <option key={loc.id} value={loc.label}>{loc.label}</option>
                          ))}
                        </select>
                      </div>

                      <GlowButton
                        onClick={() => generateDirections(navDestination)}
                        disabled={!navDestination || navLoading}
                        variant="primary"
                        aria-label="Calculate directions from current zone"
                        className="w-full text-center"
                      >
                        {navLoading ? t('fan.calculating_route') : t('fan.find_route')}
                      </GlowButton>

                      {navInstructions.length > 0 && (
                        <div className="mt-5 space-y-2 border-t border-white/5 pt-4">
                          <div className="flex items-center justify-between text-[10px] text-[#4A6580] uppercase tracking-wider font-semibold mb-2">
                            <span>{t('fan.directions_label')}</span>
                            <span className="text-[#00FF87] flex items-center gap-1">
                              <Clock size={10} /> {navTime} {t('fan.walk_time')}
                            </span>
                          </div>
                          {navInstructions.map((step, idx) => (
                            <div key={idx} className="flex gap-2.5 items-start text-xs text-[#E8F4FD]">
                              <span className="w-5 h-5 rounded-full bg-[#00D4FF]/10 text-[#00D4FF] flex items-center justify-center shrink-0 font-mono text-[10px] font-bold">
                                {idx + 1}
                              </span>
                              <span className="pt-0.5 leading-snug">{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {navInstructions.length === 0 && !navLoading && !navError && (
                        <div className="mt-5 border-t border-white/5 pt-6 text-center text-[#4A6580]">
                          <Compass size={24} className="opacity-20 mx-auto mb-2 text-[#00D4FF] animate-pulse" />
                          <p className="text-xs font-semibold text-[#E8F4FD]">{t('fan.no_route_title', 'No active route')}</p>
                          <p className="text-[10px] text-[#4A6580] max-w-[200px] mx-auto leading-normal mt-1">
                            Choose a destination from the drop-down list to calculate walking times.
                          </p>
                        </div>
                      )}

                      {navError && (
                        <div className="mt-4 p-3 rounded-lg border border-[#FF3366]/20 bg-[#FF3366]/5 flex items-start gap-2">
                          <AlertCircle size={14} className="text-[#FF3366] shrink-0 mt-0.5" />
                          <p className="text-[10px] text-[#FF3366] leading-snug">{navError}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-[#4A6580] mt-4 flex items-center gap-1.5">
                      <Info size={11} className="text-[#00D4FF]" />
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
                  className="glass-card border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl flex-1 flex flex-col overflow-hidden max-h-[500px]"
                >
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00FF87] animate-pulse" />
                      <span className="font-heading font-semibold text-xs text-[#E8F4FD] uppercase tracking-wider">
                        {t('fan.chat_title')}
                      </span>
                    </div>
                    <button
                      onClick={clearMessages}
                      aria-label="Clear chat conversation logs"
                      className="text-[10px] text-[#4A6580] hover:text-white transition-all font-semibold focus:outline-none"
                    >
                      {t('fan.chat_reset')}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[300px]">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center py-10">
                        <MessageSquare size={36} className="text-[#00D4FF] opacity-20 mb-3" />
                        <h4 className="font-heading font-semibold text-sm text-[#E8F4FD] mb-1">
                          {t('fan.chat_empty_title')}
                        </h4>
                        <p className="text-xs text-[#4A6580] max-w-xs leading-relaxed">
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
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                            m.role === 'user'
                              ? 'bg-[#00D4FF]/10 text-white rounded-tr-none border border-[#00D4FF]/20'
                              : 'bg-[#0A192F] text-[#E8F4FD] rounded-tl-none border border-[#0F2340]'
                          }`}
                        >
                          {m.content}
                          {m.streaming && (
                            <span className="inline-block w-1.5 h-3 bg-white ml-0.5 animate-pulse" />
                          )}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-[#0A192F] border border-[#0F2340] rounded-2xl rounded-tl-none px-4 py-3 text-xs text-[#4A6580] flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendChat} className="p-3 border-t border-white/5 bg-[#060D1A]/60 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={t('fan.chat_placeholder')}
                      aria-label="Ask the stadium AI assistant a question"
                      className="flex-1 bg-[#0A192F] border border-[#0F2340] rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#00D4FF] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !chatInput.trim()}
                      aria-label="Send message to AI assistant"
                      className="w-10 h-10 rounded-xl bg-[#00D4FF] hover:bg-[#33DDFF] text-[#060D1A] flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 focus:outline-none"
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
                  <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading font-semibold text-white text-sm mb-2 flex items-center gap-2">
                        <ShoppingBag size={14} className="text-[#00D4FF]" />
                        {t('fan.concessions_title')}
                      </h3>

                      {/* Performance: 500ms debounced search query field */}
                      <div className="mb-3">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search food & concessions..."
                          aria-label="Search food concessions stands"
                          className="w-full bg-[#0A192F] border border-[#0F2340] rounded-xl px-3 py-2 text-xs text-[#E8F4FD] focus:border-[#00D4FF]"
                        />
                      </div>

                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {filteredQueues.length === 0 ? (
                          <p className="text-center py-6 text-xs text-[#4A6580]">
                            No concessions match your search query.
                          </p>
                        ) : (
                          filteredQueues.map(q => (
                            <div key={q.id} className="flex items-center justify-between p-3 rounded-xl border border-[#0F2340] bg-[#0A192F]/50">
                              <div>
                                <p className="text-xs font-semibold text-[#E8F4FD]">{q.name}</p>
                                <span className="text-[10px] text-[#4A6580]">{t('fan.queue_estimated')}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className={`text-xs font-bold ${
                                  q.status === 'high'    ? 'text-[#FF3366]' :
                                  q.status === 'normal'  ? 'text-[#FFB800]' : 'text-[#00FF87]'
                                }`}>
                                  {q.wait} min
                                </span>
                                <span className="text-[9px] text-[#4A6580] uppercase font-bold tracking-wider">
                                  {t(`common.${q.status}`)}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="text-[9px] text-[#4A6580] mt-4 flex items-center gap-1.5">
                      <Clock size={10} />
                      <span>{t('fan.concessions_note')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="glass-card p-4 border border-[#00D4FF]/10 bg-gradient-to-br from-[#0D1B2E]/60 to-[#0A192F]/60 rounded-2xl flex flex-col items-center justify-center text-center">
                      <div className="flex items-center gap-1.5 text-[9px] text-[#4A6580] font-bold uppercase tracking-wider mb-2">
                        <Calendar size={11} className="text-[#00D4FF]" />
                        {t('fan.countdown_label')}
                      </div>
                      <p className="font-heading font-bold text-3xl text-white tracking-widest font-mono">
                        {countdown}
                      </p>
                    </div>

                    <div className="glass-card p-4 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF]">
                          <CloudSun size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{weatherData.condition}</p>
                          <span className="text-[10px] text-[#4A6580]">{t('fan.weather_label')}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-heading font-bold text-[#E8F4FD]">{weatherData.temp.value}°C</span>
                        <span className="text-[9px] text-[#4A6580]">Humidity {weatherData.humidity.value}%</span>
                      </div>
                    </div>

                    <div className="glass-card p-4 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl flex flex-col gap-2">
                      <p className="text-xs font-semibold text-[#E8F4FD]">{t('fan.rate_experience')}</p>
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
                                className="focus:outline-none transition-transform active:scale-125"
                                disabled={rated}
                              >
                                <Star
                                  size={18}
                                  className={`transition-colors ${
                                    isFilled ? 'fill-[#FFB800] text-[#FFB800]' : 'text-[#0F2340] fill-transparent hover:text-[#FFB800]'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                        {rated && (
                          <span className="text-[10px] text-[#00FF87] font-semibold">
                            {t('fan.rating_thanks')}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-[#4A6580]">{t('fan.rating_note')}</span>
                    </div>
                  </div>
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
