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
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 bg-white">
      {/* ── Flat Poster Geometric Decorations ── */}
      <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-[#EFF6FF] rounded-full -z-10 pointer-events-none opacity-80" />
      <div className="absolute bottom-[10%] right-[-5%] w-[450px] h-[450px] bg-[#ECFDF5] rounded-lg rotate-12 -z-10 pointer-events-none opacity-80" />
      <div className="absolute top-[30%] right-[10%] w-72 h-72 bg-[#FEF3C7] rounded-full -z-10 pointer-events-none opacity-60" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto mt-12">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded border-2 border-[#3B82F6] bg-white mb-6"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#10B981] animate-ping opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]" />
          </span>
          <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#3B82F6]">
            {t('landing.hero_tag')}
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
          className="font-heading font-extrabold tracking-tight leading-[0.95] mb-6 text-[#111827]"
          style={{ fontSize: 'clamp(3rem, 9vw, 6rem)' }}
        >
          STADIUM<span className="text-[#3B82F6]">IQ</span>
          <span className="block text-[#3B82F6] mt-2 font-bold" style={{ fontSize: 'clamp(1.8rem, 5vw, 3.25rem)' }}>
            2026
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-[#6B7280] text-lg md:text-xl max-w-2xl leading-relaxed mb-8 font-semibold"
        >
          {t('landing.hero_subtitle')}
        </motion.p>

        {/* Quick stat pills */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {QUICK_STATS.map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded border-2 border-[#E5E7EB] bg-white"
            >
              <Icon size={14} className="text-[#3B82F6]" />
              <span className="font-heading font-extrabold text-sm text-[#111827]">{value}</span>
              <span className="text-[11px] text-[#6B7280] font-bold uppercase">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link to="/operations">
            <button className="btn-primary text-base px-8 cursor-pointer">
              <Radio size={18} />
              {t('landing.cta_operations')}
            </button>
          </Link>
          <Link to="/fan">
            <button className="btn-ghost text-base px-8 cursor-pointer">
              <Users size={18} />
              {t('landing.cta_fan')}
            </button>
          </Link>
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10"
      >
        <span className="text-[9px] uppercase tracking-wider text-[#6B7280] font-bold">{t('landing.explore')}</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={18} className="text-[#3B82F6]" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  FEATURE GRID
// ═══════════════════════════════════════════════════════════════════

function FeatureCard({ to, icon: Icon, title, description, color, bg, text, index }) {
  const { t } = useTranslation();

  return (
    <Link to={to} className="block group cursor-pointer">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        whileHover={{ scale: 1.02 }}
        className="relative h-full rounded-lg border-2 border-[#E5E7EB] bg-white p-6 md:p-8 transition-all duration-200 shadow-none flex flex-col justify-between"
      >
        <div>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-5 border-2"
            style={{ backgroundColor: bg, borderColor: color }}
          >
            <Icon size={24} style={{ color }} />
          </div>

          <h3 className="font-heading font-extrabold text-[#111827] text-lg mb-2 leading-snug">
            {title}
          </h3>

          <p className="text-[#6B7280] text-sm leading-relaxed mb-6 font-medium">
            {description}
          </p>
        </div>

        <div
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider mt-auto"
          style={{ color }}
        >
          <span>{t('landing.explore')}</span>
          <ArrowRight
            size={14}
            className="transition-transform duration-200 group-hover:translate-x-1.5"
          />
        </div>
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
      color:       '#3B82F6', // Blue 500
      bg:          '#EFF6FF',
      text:        '#3B82F6',
    },
    {
      to:          '/operations',
      icon:        Monitor,
      title:       t('landing.ops_title'),
      description: t('landing.ops_desc'),
      color:       '#F59E0B', // Amber 500
      bg:          '#FEF3C7',
      text:        '#B45309',
    },
    {
      to:          '/staff',
      icon:        Briefcase,
      title:       t('landing.staff_title'),
      description: t('landing.staff_desc'),
      color:       '#10B981', // Emerald 500
      bg:          '#ECFDF5',
      text:        '#047857',
    },
    {
      to:          '/sustainability',
      icon:        Leaf,
      title:       t('landing.sustain_title'),
      description: t('landing.sustain_desc'),
      color:       '#059669',
      bg:          '#ECFDF5',
      text:        '#059669',
    },
  ];

  return (
    <section className="relative py-20 px-4 bg-[#F3F4F6]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="section-tag mb-3 block text-center justify-center">
            <Zap size={12} /> {t('landing.modules_tag')}
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-[#111827] mb-3">
            {t('landing.modules_title')}
          </h2>
          <p className="text-[#6B7280] max-w-xl mx-auto font-semibold">
            {t('landing.modules_desc')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          const duration = 1500;
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
      <div className="w-12 h-12 rounded-full bg-[#EFF6FF] border-2 border-[#3B82F6] flex items-center justify-center mb-4">
        <Icon size={20} className="text-[#3B82F6]" />
      </div>
      <p className="font-heading font-extrabold text-4xl md:text-5xl text-[#111827] mb-1 tabular-nums">
        {formatted}
        <span className="text-[#3B82F6]">{suffix}</span>
      </p>
      <p className="text-[#6B7280] text-sm font-bold uppercase tracking-wide">{label}</p>
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
    <section className="relative py-20 px-4 bg-white border-t-2 border-[#E5E7EB]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="section-tag mb-3 block text-center justify-center">
            <BarChart3 size={12} /> {t('landing.stats_tag')}
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-[#111827]">
            {t('landing.stats_title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {HERO_STATS.map((stat, i) => (
            <CountUpStat key={stat.label} {...stat} delay={i * 100} />
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
    <section className="relative border-y-2 border-[#E5E7EB] bg-[#F3F4F6] overflow-hidden">
      <div className="flex items-center h-11">
        <div className="shrink-0 h-full flex items-center gap-2 px-5 bg-[#FFF5F5] border-r-2 border-[#FF3366] z-10">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF3366] animate-ping opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF3366]" />
          </span>
          <span className="text-[10px] font-bold tracking-wider text-[#FF3366]">{t('common.live')}</span>
        </div>

        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <motion.div
            className="inline-flex gap-16 text-xs text-[#6B7280] font-semibold"
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
                    {pi > 0 && <span className="text-[#E5E7EB] mx-2">|</span>}
                    <span className={pi === 0 ? 'text-[#111827] font-bold' : ''}>
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
    <footer className="py-12 px-4 border-t-2 border-[#E5E7EB] bg-[#F3F4F6]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-heading font-extrabold text-sm text-[#111827]">
            Stadium<span className="text-[#3B82F6]">IQ</span>
          </span>
          <span className="text-[#6B7280] text-xs font-bold">2026</span>
        </div>
        <p className="text-[#6B7280] text-xs text-center font-medium">
          {t('landing.footer_text')}
        </p>
        <p className="text-[#6B7280] text-[10px] font-bold uppercase tracking-wider">
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
