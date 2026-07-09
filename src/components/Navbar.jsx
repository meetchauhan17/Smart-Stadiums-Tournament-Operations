import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Menu, X, Clock } from 'lucide-react';
import { useStadium } from '../context/StadiumContext';

// ─── Live Clock ───
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
    <div className="flex items-center gap-1 font-mono text-base font-bold text-gray-900 tracking-wider bg-gray-100 px-3 py-1.5 border border-gray-200">
      <span>{hh}</span>
      <span className="animate-pulse">:</span>
      <span>{mm}</span>
      <span className="animate-pulse">:</span>
      <span className="text-gray-500">{ss}</span>
    </div>
  );
}

// ─── Venue Dropdown ───
function VenueDropdown() {
  const { stadiums, currentVenue, switchVenue, weatherData, weatherLoading } = useStadium();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const countryFlag = { USA: '🇺🇸', Canada: '🇨🇦', Mexico: '🇲🇽' };
  const countryOrder = ['USA', 'Canada', 'Mexico'];
  const byCountry = (stadiums || []).reduce((acc, s) => {
    if (!acc[s.country]) acc[s.country] = [];
    acc[s.country].push(s);
    return acc;
  }, {});

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-900 rounded-none text-xs font-bold text-gray-900 hover:bg-gray-50 transition-all duration-150 cursor-pointer uppercase tracking-wider"
      >
        <MapPin size={12} className="text-blue-600" />
        <span className="max-w-[130px] truncate">{currentVenue.shortName}</span>
        {weatherData?.icon && !weatherLoading && (
          <span className="text-sm leading-none">{weatherData.icon}</span>
        )}
        {weatherLoading && (
          <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        )}
        <ChevronDown size={12} className={`text-gray-900 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full mt-2 w-72 rounded-none border-2 border-gray-900 bg-white shadow-[4px_4px_0px_#111827] z-[200] overflow-hidden"
          >
            <p className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-gray-400 border-b-2 border-gray-900 bg-gray-50">
              FIFA WC 2026 Venues
            </p>
            <div className="max-h-80 overflow-y-auto">
              {countryOrder.map((country) =>
                byCountry[country] ? (
                  <div key={country} className="border-b border-gray-100 last:border-0">
                    <p className="px-3 pt-2 pb-1 text-[9px] font-extrabold uppercase tracking-wider text-gray-400 bg-gray-50/50">
                      {countryFlag[country]} {country}
                    </p>
                    {byCountry[country].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          switchVenue(s.id);
                          setOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer text-left ${
                          s.id === currentVenue.id
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <span className="truncate pr-2">{s.name}</span>
                        <span className={`text-[10px] ${s.id === currentVenue.id ? 'text-blue-200' : 'text-gray-500'}`}>
                          {(s.capacity / 1000).toFixed(0)}k
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Navbar Export ───
export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const NAV_LINKS = [
    { to: '/', label: 'Overview' },
    { to: '/fan', label: 'Fans' },
    { to: '/operations', label: 'Operations' },
    { to: '/staff', label: 'Staff' },
    { to: '/sustainability', label: 'Sustainability' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-white border-b-2 border-gray-900">
        <div className="h-full max-w-screen-2xl mx-auto px-6 flex items-center justify-between">
          
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-1.5 shrink-0 select-none">
            <span className="font-black text-2xl tracking-tight text-gray-950 uppercase">
              STADIUM<span className="text-blue-600">IQ</span>
            </span>
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-sm ml-1">
              2026
            </span>
          </Link>

          {/* Center: Desktop Nav Links (Hidden on mobile) */}
          <div className="hidden lg:flex items-center justify-center flex-1 h-full">
            <nav className="flex items-center h-full gap-1">
              {NAV_LINKS.map(({ to, label }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative flex items-center justify-center px-5 h-full text-sm font-semibold tracking-wider uppercase transition-colors duration-150 ${
                      active
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Controls (Hidden on mobile except dropdown menu button) */}
          <div className="hidden lg:flex items-center gap-4">
            <LiveClock />
            <VenueDropdown />
          </div>

          {/* Mobile Right Menu Button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 border-2 border-gray-900 text-gray-900 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-gray-900/40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[72px] left-0 right-0 z-50 bg-white border-b-2 border-gray-900 flex flex-col p-6 gap-4"
            >
              <div className="flex flex-col gap-2">
                {NAV_LINKS.map(({ to, label }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 text-sm font-bold uppercase tracking-wider border-2 border-gray-900 ${
                        active
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'text-gray-900 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>

              <div className="border-t-2 border-gray-900 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <LiveClock />
                <VenueDropdown />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
