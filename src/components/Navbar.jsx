import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, Radio, Shield, Leaf,
  Bell, ChevronDown, Menu, X, MapPin, Clock,
  Wifi, WifiOff, Globe
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';

// ─── Supported Languages ──────────────────────────────────────────
const LANGUAGES = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'pt', flag: '🇧🇷', name: 'Português' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' }
];

// ─── Live Clock ────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');

  return (
    <div className="hidden md:flex items-center gap-1.5 font-mono text-xs text-[#6B7280] select-none">
      <Clock size={12} className="text-[#3B82F6]" />
      <span>
        <span className="text-[#111827] font-semibold">{hh}:{mm}</span>
        <span className="text-[#6B7280]">:{ss}</span>
      </span>
    </div>
  );
}

// ─── Venue Dropdown ────────────────────────────────────────────────
function VenueDropdown() {
  const { venues, currentVenue, switchVenue } = useStadium();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] hover:bg-[#E5E7EB] text-xs text-[#111827] transition-all duration-200 group cursor-pointer"
      >
        <MapPin size={11} className="text-[#3B82F6]" />
        <span className="max-w-[130px] truncate font-medium">{currentVenue.shortName}</span>
        <ChevronDown
          size={11}
          className={`text-[#6B7280] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-[#E5E7EB] bg-white shadow-none z-[200] overflow-hidden"
          >
            <p className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280] border-b border-[#E5E7EB]">
              FIFA WC 2026 Venues
            </p>
            {Object.values(venues).map(v => (
              <button
                key={v.id}
                onClick={() => { switchVenue(v.id); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs transition-colors cursor-pointer ${
                  v.id === currentVenue.id
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-[#111827] hover:bg-[#F3F4F6]'
                }`}
              >
                <span className="font-semibold">{v.name}</span>
                <span className={v.id === currentVenue.id ? 'text-white/80 text-[10px]' : 'text-[#6B7280] text-[10px]'}>{v.capacity.toLocaleString()}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Language Dropdown ─────────────────────────────────────────────
function LanguageDropdown() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] hover:bg-[#E5E7EB] text-xs text-[#111827] transition-all duration-200 group cursor-pointer"
      >
        <Globe size={11} className="text-[#3B82F6]" />
        <span className="flex items-center gap-1 font-medium">
          <span>{activeLang.flag}</span>
          <span>{activeLang.name}</span>
        </span>
        <ChevronDown
          size={11}
          className={`text-[#6B7280] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-40 rounded-lg border border-[#E5E7EB] bg-white shadow-none z-[200] overflow-hidden"
          >
            <p className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280] border-b border-[#E5E7EB]">
              Select Language
            </p>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => handleLanguageChange(l.code)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                  l.code === i18n.language
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-[#111827] hover:bg-[#F3F4F6]'
                }`}
              >
                <span>{l.flag}</span>
                <span className="font-semibold">{l.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Notification Bell ─────────────────────────────────────────────
function NotificationBell() {
  const { notifications, unreadNotifications, markAllNotificationsRead, dismissNotification } = useStadium();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const typeColor = {
    critical: { dot: '#FF3366', bg: 'bg-[#FF3366]/10', text: 'text-[#FF3366]' },
    warning:  { dot: '#F59E0B', bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]' },
    info:     { dot: '#3B82F6', bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]' },
    success:  { dot: '#10B981', bg: 'bg-[#10B981]/10', text: 'text-[#10B981]' },
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 transition-all cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadNotifications > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-[#FF3366] text-white text-[9px] font-bold flex items-center justify-center leading-none"
          >
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-[#E5E7EB] bg-white shadow-none z-[200] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <span className="font-heading font-semibold text-sm text-[#111827]">
                Notifications
              </span>
              <button
                onClick={markAllNotificationsRead}
                className="text-[10px] text-[#3B82F6] hover:text-[#2563EB] transition-colors font-semibold cursor-pointer"
              >
                Mark all read
              </button>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center py-8 text-[#6B7280] text-xs">No notifications</p>
              ) : (
                notifications.slice(0, 10).map(n => {
                  const c = typeColor[n.type] || typeColor.info;
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-[#E5E7EB] transition-colors ${!n.read ? 'bg-[#F3F4F6]/50' : ''}`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                        style={{ background: c.dot }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#111827] leading-snug">{n.message}</p>
                        <p className="text-[10px] text-[#6B7280] mt-0.5">
                          {n.time instanceof Date
                            ? n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="text-[#6B7280] hover:text-[#111827] shrink-0 p-0.5 rounded transition-colors cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Navbar ───────────────────────────────────────────────────
export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { isLiveMode, toggleLiveMode } = useStadium();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  // Translations Navigation Links mapping
  const NAV_LINKS = [
    { to: '/',               label: t('nav.dashboard'),      icon: LayoutDashboard },
    { to: '/fan',            label: t('nav.fans'),           icon: Users },
    { to: '/operations',     label: t('nav.operations'),     icon: Radio },
    { to: '/staff',          label: t('nav.staff'),          icon: Shield },
    { to: '/sustainability', label: t('nav.sustainability'),  icon: Leaf },
  ];

  return (
    <>
      {/* ── Main Bar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b-2 border-[#E5E7EB]">
        <div className="relative h-full max-w-screen-2xl mx-auto px-4 lg:px-6 flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative w-8 h-8 shrink-0">
              <div className="absolute inset-0 rounded bg-[#3B82F6]/10 group-hover:bg-[#3B82F6]/20 transition-colors" />
              <div className="relative w-full h-full rounded border-2 border-[#3B82F6] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <ellipse cx="9" cy="10" rx="7" ry="5" stroke="#3B82F6" strokeWidth="1.5" fill="none"/>
                  <ellipse cx="9" cy="10" rx="4" ry="2.5" fill="#3B82F6" fillOpacity="0.8"/>
                </svg>
              </div>
            </div>
            <span className="font-heading font-bold text-[17px] tracking-tight hidden sm:block">
              <span className="text-[#111827]">Stadium</span>
              <span className="text-[#3B82F6]">IQ</span>
              <span className="ms-1.5 text-[#6B7280] font-semibold text-sm">2026</span>
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <AnimatePresence mode="wait">
            <motion.nav
              key={i18n.language}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.8 }}
              transition={{ duration: 0.15 }}
              className="hidden lg:flex items-center gap-1"
            >
              {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                      active
                        ? 'text-white bg-[#3B82F6]'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </Link>
                );
              })}
            </motion.nav>
          </AnimatePresence>

          {/* ── Right Controls ── */}
          <div className="flex items-center gap-1.5">
            <LiveClock />

            {/* Live mode toggle */}
            <button
              onClick={toggleLiveMode}
              title={isLiveMode ? 'Live simulation ON — click to pause' : 'Live simulation OFF — click to resume'}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all duration-200 cursor-pointer ${
                isLiveMode
                  ? 'border-[#10B981]/40 text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20'
                  : 'border-[#E5E7EB] text-[#6B7280] hover:bg-gray-100'
              }`}
            >
              {isLiveMode
                ? <Wifi size={10} className="animate-pulse" />
                : <WifiOff size={10} />
              }
              {isLiveMode ? 'LIVE' : 'PAUSED'}
            </button>

            <VenueDropdown />
            <LanguageDropdown />
            <NotificationBell />

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="p-2 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all lg:hidden cursor-pointer"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{   rotate:  90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="block"
                >
                  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ───────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white border-l-2 border-[#E5E7EB] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
                <span className="font-heading font-bold text-[#111827]">
                  Stadium<span className="text-[#3B82F6]">IQ</span>
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Links */}
              <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
                {NAV_LINKS.map(({ to, label, icon: Icon }, i) => {
                  const active = isActive(to);
                  return (
                    <motion.div
                      key={to}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={to}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-md text-sm font-semibold transition-all ${
                          active
                            ? 'bg-[#3B82F6] text-white'
                            : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        <Icon size={18} />
                        {label}
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Mobile Language Selector */}
                <div className="border-t border-[#E5E7EB] mt-4 pt-4 px-4">
                  <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold mb-2">
                    {t('nav.language')}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        onClick={() => { i18n.changeLanguage(l.code); setMobileOpen(false); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer ${
                          l.code === i18n.language
                            ? 'border-[#3B82F6] bg-[#3B82F6]/10 text-[#3B82F6]'
                            : 'border-[#E5E7EB] text-[#111827] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        <span>{l.flag}</span>
                        <span className="font-semibold">{l.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </nav>

              <div className="px-5 py-4 border-t border-[#E5E7EB]">
                <p className="text-[10px] text-[#6B7280]">StadiumIQ Platform v2026.1</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">FIFA World Cup 2026 — Official Tools</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
