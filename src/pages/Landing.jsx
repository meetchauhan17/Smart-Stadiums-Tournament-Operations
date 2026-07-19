import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Monitor, Briefcase, Leaf, Zap, Globe, ArrowRight } from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import PageTransition from '../components/PageTransition';

// ═══════════════════════════════════════════════════════════════════
//  HERO SECTION (bg-blue-600, min-h-screen)
// ═══════════════════════════════════════════════════════════════════
function HeroSection() {
  return (
    <section className="relative bg-blue-600 min-h-screen flex flex-col justify-between overflow-hidden pt-20">
      {/* Abstract geometric composition on the right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full lg:w-1/2 h-[500px] pointer-events-none hidden lg:block select-none">
        <div className="relative w-full h-full">
          <div className="absolute right-20 top-10 w-[380px] h-[240px] bg-blue-500 border-4 border-white rotate-0 opacity-90 shadow-2xl" />
          <div className="absolute right-32 top-24 w-[340px] h-[260px] bg-blue-400 border-4 border-white rotate-[15deg] opacity-95 shadow-2xl" />
          <div className="absolute right-12 top-40 w-[360px] h-[220px] bg-blue-700 border-4 border-white -rotate-[10deg] opacity-90 shadow-2xl" />
        </div>
      </div>

      {/* Main Hero Container */}
      <div className="flex-1 max-w-7xl mx-auto px-6 flex items-center w-full z-10 py-16">
        <div className="max-w-2xl text-left flex flex-col">
          {/* Headline */}
          <h1
            className="font-black text-white tracking-tight uppercase"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 6.5rem)', letterSpacing: '-0.03em', lineHeight: '0.95' }}
          >
            THE FUTURE OF
            <br />
            STADIUM OPS
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-blue-100 text-lg md:text-xl font-medium max-w-lg leading-relaxed">
            AI Co-Pilot for FIFA World Cup 2026 Volunteers &amp; Fans
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-row flex-wrap gap-4 mt-10">
            <Link to="/operations">
              <button className="bg-white text-blue-600 font-bold px-8 py-4 rounded-none text-base border-2 border-white hover:bg-transparent hover:text-white transition-all cursor-pointer">
                VOLUNTEER CO-PILOT
              </button>
            </Link>
            <Link to="/fan">
              <button className="bg-transparent text-white font-bold px-8 py-4 rounded-none text-base border-4 border-white hover:bg-white hover:text-blue-600 transition-all cursor-pointer">
                FAN EXPERIENCE
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Blue-700 strip at bottom of hero */}
      <div className="bg-blue-700 border-t-4 border-gray-900 py-8 z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          {[
            { value: '10 VENUES', label: 'WORLDWIDE STADIA' },
            { value: '82,500', label: 'MAX CAPACITY' },
            { value: '6 MODULES', label: 'GENAI POWERED' },
            { value: '5 LANGUAGES', label: 'LIVE TRANSLATION' },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-white text-3xl md:text-4xl font-black uppercase tracking-tight">{stat.value}</span>
              <span className="text-blue-200 text-xs font-semibold uppercase tracking-widest mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SECTION 2 — PLATFORM MODULES (bg-white, py-24)
// ═══════════════════════════════════════════════════════════════════
function PlatformModules() {
  const MODULES = [
    {
      to: '/operations',
      icon: Monitor,
      name: 'Volunteer Co-Pilot',
      desc: 'Real-time crowd intelligence, AI decision support, and incident command for on-ground volunteers.',
      accent: 'group-hover:bg-amber-500',
      iconBg: 'bg-amber-100 text-amber-600',
      textColorClass: 'text-amber-600 group-hover:text-white',
      borderHover: 'hover:bg-amber-500',
    },
    {
      to: '/fan',
      icon: Users,
      name: 'Fan Experience Hub',
      desc: 'AI-powered navigation, multilingual chat assistant, and live venue directions.',
      accent: 'group-hover:bg-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      textColorClass: 'text-blue-600 group-hover:text-white',
      borderHover: 'hover:bg-blue-600',
    },
    {
      to: '/staff',
      icon: Briefcase,
      name: 'Crowd Intelligence',
      desc: 'Crowd-aware deployment maps, volunteer status tracking, and real-time zone coordination.',
      accent: 'group-hover:bg-green-600',
      iconBg: 'bg-green-100 text-green-600',
      textColorClass: 'text-green-600 group-hover:text-white',
      borderHover: 'hover:bg-green-600',
    },
    {
      to: '/sustainability',
      icon: Leaf,
      name: 'Sustainability Monitor',
      desc: 'Live solar metrics, water recycling gauges, and smart energy saving tips.',
      accent: 'group-hover:bg-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      textColorClass: 'text-emerald-600 group-hover:text-white',
      borderHover: 'hover:bg-emerald-600',
    },
  ];

  return (
    <section className="bg-white py-24 px-6 border-t-2 border-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <p className="text-blue-600 text-xs uppercase tracking-widest font-extrabold">01. PLATFORM</p>
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight mt-2 leading-none">
            One Platform.
            <br />
            Every Dimension.
          </h2>
        </div>

        {/* 2x2 Grid with thick borders */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-gray-900">
          {MODULES.map((mod, idx) => {
            const Icon = mod.icon;
            // Alternating backgrounds (white and gray-100)
            const isOddRow = Math.floor(idx / 2) % 2 === 1;
            const isOddCol = idx % 2 === 1;
            const bgClass = (idx === 1 || idx === 2) ? 'bg-gray-100' : 'bg-white';

            return (
              <Link
                key={idx}
                to={mod.to}
                className={`group flex flex-col justify-between p-10 min-h-[320px] transition-all duration-150 cursor-pointer border-gray-900 ${bgClass} ${mod.borderHover} hover:border-gray-900 border-b-2 last:border-b-0 ${
                  idx < 2 ? 'md:border-b-2' : 'md:border-b-0'
                } ${
                  idx % 2 === 0 ? 'md:border-r-2' : 'md:border-r-0'
                }`}
              >
                <div className="flex flex-col gap-6">
                  {/* Icon circle */}
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center ${mod.iconBg} transition-colors group-hover:bg-white group-hover:text-gray-900`}>
                    <Icon size={28} />
                  </div>

                  {/* Module Name */}
                  <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 group-hover:text-white">
                    {mod.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm leading-relaxed max-w-sm group-hover:text-blue-50">
                    {mod.desc}
                  </p>
                </div>

                {/* Explore Link */}
                <div className={`flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider mt-6 ${mod.textColorClass}`}>
                  EXPLORE <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SECTION 3 — LIVE STATS (bg-gray-900, py-20)
// ═══════════════════════════════════════════════════════════════════
function LiveStats() {
  const STATS = [
    { val: '3', label: 'CONTINENTS', color: 'text-blue-400' },
    { val: '48', label: 'MATCHES', color: 'text-amber-400' },
    { val: '250K+', label: 'DAILY FANS', color: 'text-green-400' },
    { val: '40%', label: 'ENERGY SAVED', color: 'text-purple-400' },
  ];

  return (
    <section className="bg-gray-950 py-24 px-6 border-t-2 border-gray-900">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-white text-4xl md:text-5xl font-black uppercase tracking-tight mb-16 max-w-md leading-none">
          Numbers that move the world.
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          {STATS.map((stat, idx) => (
            <div key={idx} className="flex flex-col">
              <span className={`text-7xl md:text-8xl font-black tracking-tighter ${stat.color} leading-none`}>
                {stat.val}
              </span>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-4">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  SECTION 4 — VENUE SELECTOR PREVIEW (bg-amber-400, py-20)
// ═══════════════════════════════════════════════════════════════════
function VenueSelectorPreview() {
  const { stadiums, switchVenue } = useStadium();
  const navigate = useNavigate();

  const handleSelectVenue = (id) => {
    switchVenue(id);
    navigate('/operations');
  };

  return (
    <section className="bg-amber-400 py-24 px-6 border-t-2 border-b-2 border-gray-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Headline */}
        <div className="lg:col-span-5">
          <h2 className="text-4xl md:text-5xl font-black text-gray-950 tracking-tight leading-none uppercase">
            10 WORLD CUP VENUES.
            <br />
            ONE PLATFORM.
          </h2>
        </div>

        {/* Right Scrollable horizontal list of stadium pills */}
        <div className="lg:col-span-7 overflow-x-auto pb-4 scrollbar-thin select-none">
          <div className="flex flex-wrap lg:flex-nowrap gap-3 min-w-max pr-6">
            {(stadiums || []).map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectVenue(s.id)}
                className="px-6 py-3.5 bg-white border-2 border-gray-900 text-gray-950 font-extrabold text-sm uppercase tracking-wider rounded-none hover:bg-gray-950 hover:text-white transition-all cursor-pointer shrink-0"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  FOOTER
// ═══════════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer className="bg-gray-950 py-16 px-6 border-t-2 border-gray-900">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left logo */}
        <div className="flex items-center gap-1.5 select-none">
          <span className="font-black text-xl tracking-tight text-white uppercase">
            STADIUM<span className="text-blue-500">IQ</span>
          </span>
          <span className="text-gray-500 text-xs font-bold uppercase tracking-widest ml-1">
            2026
          </span>
        </div>

        {/* Center navigation links */}
        <div className="flex flex-wrap justify-center gap-8">
          <Link to="/" className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest">
            Overview
          </Link>
          <Link to="/fan" className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest">
            Fans
          </Link>
          <Link to="/operations" className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest">
            Operations
          </Link>
          <Link to="/staff" className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest">
            Staff
          </Link>
          <Link to="/sustainability" className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest">
            Sustainability
          </Link>
        </div>

        {/* Right text */}
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
          Built for FIFA World Cup 2026
        </p>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════
/**
 * Landing Page Component.
 * The primary public-facing portal homepage for StadiumIQ 2026.
 * Showcases features, current tournament facts, real-time weather integration,
 * quick stats overview, and venue quick selection.
 *
 * @component
 * @returns {React.ReactElement} The rendered Landing portal page
 */
export default function Landing() {
  return (
    <PageTransition>
      <HeroSection />
      <PlatformModules />
      <LiveStats />
      <VenueSelectorPreview />
      <Footer />
    </PageTransition>
  );
}
