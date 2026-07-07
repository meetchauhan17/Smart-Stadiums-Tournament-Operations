import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Users, Monitor, Briefcase, Leaf,
  ArrowRight, ChevronDown, Zap, Globe,
  BarChart3, Shield, Activity, Radio,
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';

// ═══════════════════════════════════════════════════════════════════
//  HERO SECTION
// ═══════════════════════════════════════════════════════════════════

function HeroSection() {
  const { t } = useTranslation();

  const QUICK_STATS = [
    { label: t('landing.capacity'),         value: '82,500',  icon: Users },
    { label: t('landing.ai_modules'),       value: '4',       icon: Zap },
    { label: t('landing.languages'),        value: '5',       icon: Globe },
    { label: t('landing.real_time_analytics'), value: 'Live',  icon: Activity },
  ];

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      {/* ── Animated glow orbs ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 120, -80, 0],
          y: [0, -100, 60, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 420, height: 420,
          background: 'radial-gradient(circle, rgba(0,255,135,0.06) 0%, transparent 70%)',
          filter: 'blur(50px)',
          right: '10%', top: '20%',
        }}
        animate={{
          x: [0, -90, 60, 0],
          y: [0, 70, -110, 0],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/5 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#00FF87] animate-ping opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF87]" />
          </span>
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#00D4FF]">
            {t('landing.hero_tag')}
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading font-bold tracking-tight leading-[0.95] mb-5"
          style={{ fontSize: 'clamp(3rem, 10vw, 6.5rem)' }}
        >
          <span className="text-white">STADIUM</span>
          <span className="gradient-text">IQ</span>
          <span className="block text-[#00D4FF] mt-1" style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)' }}>
            2026
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-[#4A6580] text-lg md:text-xl max-w-2xl leading-relaxed mb-10"
        >
          {t('landing.hero_subtitle')}
        </motion.p>

        {/* Quick stat pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {QUICK_STATS.map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0D1B2E]/80 border border-white/5 backdrop-blur-sm"
            >
              <Icon size={14} className="text-[#00D4FF]" />
              <span className="font-heading font-bold text-sm text-[#E8F4FD]">{value}</span>
              <span className="text-[11px] text-[#4A6580]">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link to="/operations">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 36px rgba(0,212,255,0.5)' }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-base px-8 py-4"
            >
              <Radio size={18} />
              {t('landing.cta_operations')}
            </motion.button>
          </Link>
          <Link to="/fan">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(0,212,255,0.25)' }}
              whileTap={{ scale: 0.97 }}
              className="btn-ghost text-base px-8 py-4"
            >
              <Users size={18} />
              {t('landing.cta_fan')}
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#4A6580] font-medium">{t('landing.explore')}</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} className="text-[#00D4FF] opacity-60" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  FEATURE GRID
// ═══════════════════════════════════════════════════════════════════

function FeatureCard({ to, icon: Icon, title, description, color, glow, badge, index }) {
  const { t } = useTranslation();

  return (
    <Link to={to} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -6, transition: { duration: 0.22 } }}
        className="relative h-full rounded-2xl border border-white/5 bg-[#0D1B2E] overflow-hidden transition-shadow duration-300 p-6 md:p-8"
        style={{ '--accent': color, '--glow': glow }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top center, ${glow}, transparent 65%)` }}
        />

        <div
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
          style={{ background: badge, border: `1px solid ${color}20` }}
        >
          <Icon size={26} style={{ color }} />
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ boxShadow: `0 0 24px ${glow}` }}
          />
        </div>

        <h3 className="relative font-heading font-bold text-[#E8F4FD] text-lg mb-2 leading-snug">
          {title}
        </h3>

        <p className="relative text-[#4A6580] text-sm leading-relaxed mb-6">
          {description}
        </p>

        <div
          className="relative inline-flex items-center gap-2 text-xs font-semibold tracking-wide"
          style={{ color }}
        >
          <span>{t('landing.explore')}</span>
          <ArrowRight
            size={14}
            className="transition-transform duration-200 group-hover:translate-x-1.5"
          />
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-60 transition-opacity duration-400"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      </motion.div>
    </Link>
  );
}

function FeatureGrid() {
  const { t } = useTranslation();

  const FEATURES = [
    {
      to:          '/fan',
      icon:        Users,
      title:       t('landing.fan_title'),
      description: t('landing.fan_desc'),
      color:       '#00D4FF',
      glow:        'rgba(0,212,255,0.15)',
      badge:       'rgba(0,212,255,0.10)',
    },
    {
      to:          '/operations',
      icon:        Monitor,
      title:       t('landing.ops_title'),
      description: t('landing.ops_desc'),
      color:       '#FFB800',
      glow:        'rgba(255,184,0,0.15)',
      badge:       'rgba(255,184,0,0.10)',
    },
    {
      to:          '/staff',
      icon:        Briefcase,
      title:       t('landing.staff_title'),
      description: t('landing.staff_desc'),
      color:       '#00FF87',
      glow:        'rgba(0,255,135,0.15)',
      badge:       'rgba(0,255,135,0.10)',
    },
    {
      to:          '/sustainability',
      icon:        Leaf,
      title:       t('landing.sustain_title'),
      description: t('landing.sustain_desc'),
      color:       '#34D399',
      glow:        'rgba(52,211,153,0.15)',
      badge:       'rgba(52,211,153,0.10)',
    },
  ];

  return (
    <section className="relative py-20 md:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="section-tag mb-3 block">
            <Zap size={12} /> {t('landing.modules_tag')}
          </span>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-[#E8F4FD] mb-3">
            {t('landing.modules_title')}
          </h2>
          <p className="text-[#4A6580] max-w-xl mx-auto">
            {t('landing.modules_desc')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.to} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  STATISTICS SECTION (count-up on scroll)
// ═══════════════════════════════════════════════════════════════════

function CountUpStat({ value, suffix, label, icon: Icon, delay }) {
  const [display, setDisplay] = useState(0);
  const ref        = useRef(null);
  const started    = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          let start;

          const animate = (ts) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3);
            setDisplay(eased * value);
            if (progress < 1) requestAnimationFrame(animate);
          };

          setTimeout(() => requestAnimationFrame(animate), delay);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, delay]);

  const formatted = value >= 1000
    ? Math.floor(display).toLocaleString()
    : Number.isInteger(value)
    ? Math.floor(display).toString()
    : display.toFixed(1);

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#00D4FF]/8 flex items-center justify-center mb-4">
        <Icon size={22} className="text-[#00D4FF]" />
      </div>
      <p className="font-heading font-bold text-4xl md:text-5xl text-[#E8F4FD] mb-1 tabular-nums">
        {formatted}
        <span className="text-[#00D4FF]">{suffix}</span>
      </p>
      <p className="text-[#4A6580] text-sm font-medium">{label}</p>
    </div>
  );
}

function StatsSection() {
  const { t } = useTranslation();

  const HERO_STATS = [
    { value: 3,      suffix: '',     label: t('landing.stat_venues'), icon: Shield },
    { value: 250000, suffix: '+',    label: t('landing.stat_fans'),   icon: Users },
    { value: 99.9,   suffix: '%',    label: t('landing.stat_uptime'), icon: Activity },
    { value: 40,     suffix: '%',    label: t('landing.stat_energy'), icon: Leaf },
  ];

  return (
    <section className="relative py-20 md:py-28 px-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="section-tag mb-3 block">
            <BarChart3 size={12} /> {t('landing.stats_tag')}
          </span>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-[#E8F4FD]">
            {t('landing.stats_title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {HERO_STATS.map((stat, i) => (
            <CountUpStat key={stat.label} {...stat} delay={i * 150} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  LIVE TICKER
// ═══════════════════════════════════════════════════════════════════

function LiveTicker() {
  const { t } = useTranslation();
  const {
    currentVenue,
    currentOccupancy,
    occupancyPercent,
    unresolvedAlerts,
    currentMatchAtVenue,
    weatherData,
  } = useStadium();

  const items = [
    `🏟️ ${currentVenue.name} — Occupancy: ${currentOccupancy.toLocaleString()} / ${currentVenue.capacity.toLocaleString()} (${occupancyPercent}%)`,
    `🚨 Active Alerts: ${unresolvedAlerts.length}${unresolvedAlerts.length > 0 ? ` — ${unresolvedAlerts[0]?.message?.slice(0, 60)}…` : ' — All clear'}`,
    `⚽ Next Match: ${currentMatchAtVenue.homeTeam.flag} ${currentMatchAtVenue.homeTeam.name} vs ${currentMatchAtVenue.awayTeam.name} ${currentMatchAtVenue.awayTeam.flag} — ${currentMatchAtVenue.date} at ${currentMatchAtVenue.kickoffTime}`,
    `🌤️ Weather: ${weatherData.temp.value}°C, ${weatherData.condition}, Wind ${weatherData.windSpeed.value} km/h ${weatherData.windSpeed.direction}`,
    `🎟️ ${currentMatchAtVenue.ticketsSold.toLocaleString()} tickets sold — ${currentMatchAtVenue.ticketsSold >= currentVenue.capacity ? 'SOLD OUT' : `${(currentVenue.capacity - currentMatchAtVenue.ticketsSold).toLocaleString()} remaining`}`,
    `🌱 Solar: ${(1840).toLocaleString()} kWh today — 92% of daily target`,
  ];

  const doubled = [...items, ...items];

  return (
    <section className="relative border-y border-[#00D4FF]/8 bg-[#060D1A]/80 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center h-11">
        <div className="shrink-0 h-full flex items-center gap-2 px-5 bg-[#FF3366]/10 border-r border-[#FF3366]/20 z-10">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF3366] animate-ping opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF3366]" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.14em] text-[#FF3366]">{t('common.live')}</span>
        </div>

        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <motion.div
            className="inline-flex gap-16 text-xs text-[#4A6580]"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: items.length * 9,
                ease: 'linear',
              },
            }}
          >
            {doubled.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1 shrink-0">
                {item.split('—').map((part, pi) => (
                  <span key={pi}>
                    {pi > 0 && <span className="text-[#0F2340] mx-1">—</span>}
                    <span className={pi === 0 ? 'text-[#E8F4FD] font-medium' : ''}>
                      {part.trim()}
                    </span>
                  </span>
                ))}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  FOOTER
// ═══════════════════════════════════════════════════════════════════

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="py-12 px-4 border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-sm text-[#E8F4FD]">
            Stadium<span className="text-[#00D4FF]">IQ</span>
          </span>
          <span className="text-[#4A6580] text-xs">2026</span>
        </div>
        <p className="text-[#4A6580] text-xs text-center">
          {t('landing.footer_text')}
        </p>
        <p className="text-[#4A6580] text-[10px]">
          {t('landing.footer_powered')}
        </p>
      </div>
    </footer>
  );
}

import PageTransition from '../components/PageTransition';

// ═══════════════════════════════════════════════════════════════════
//  PAGE EXPORT
// ═══════════════════════════════════════════════════════════════════

export default function Landing() {
  return (
    <PageTransition>
      <HeroSection />
      <LiveTicker />
      <FeatureGrid />
      <StatsSection />
      <Footer />
    </PageTransition>
  );
}
