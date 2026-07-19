import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Wifi, WifiOff, Trophy, Clock, Users,
  Zap, Activity, AlertCircle, Info, ChevronUp, ChevronDown,
  Shield, Swords
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { useFootballAPI } from '../hooks/useFootballAPI';
import PageTransition from '../components/PageTransition';
import { getVenueLocalTime } from '../utils/realApis';
import { TeamFlag } from '../components/TeamFlag';
import { MatchEventIcon } from '../components/MatchEventIcon';
import { MatchCardSkeleton, TableSkeleton } from '../components/Skeleton';

// ─── Helpers ─────────────────────────────────────────────────────
function fmtTime(utcDate) {
  if (!utcDate) return '--:--';
  return new Date(utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(utcDate) {
  if (!utcDate) return '';
  return new Date(utcDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
function scoreDisplay(match) {
  const s = match.score;
  if (!s) return 'VS';
  const h = s.fullTime?.home ?? s.halfTime?.home;
  const a = s.fullTime?.away ?? s.halfTime?.away;
  if (h == null || a == null) return 'VS';
  return `${h} - ${a}`;
}

// ─── Status badge ─────────────────────────────────────────────────
function StatusBadge({ status, minute }) {
  if (status === 'LIVE') {
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white text-[10px] font-black tracking-widest animate-pulse rounded-none">
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
        LIVE {minute ? `${minute}'` : ''}
      </span>
    );
  }
  if (status === 'FINISHED') {
    return <span className="px-2.5 py-1 bg-gray-700 text-white text-[10px] font-black tracking-widest rounded-none">FT</span>;
  }
  return (
    <span className="px-2.5 py-1 bg-blue-700 text-white text-[10px] font-black tracking-widest rounded-none">
      UPCOMING
    </span>
  );
}

// ─── Match Card ───────────────────────────────────────────────────
function MatchCard({ match, isLive, matchMinute, liveScore, getFlag, onClick, selected }) {
  const home = match.homeTeam.name;
  const away = match.awayTeam.name;
  const homeFlag = getFlag(home);
  const awayFlag = getFlag(away);
  const dispScore = isLive && liveScore.home != null
    ? `${liveScore.home} - ${liveScore.away}`
    : scoreDisplay(match);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`cursor-pointer border-2 transition-all duration-150 ${
        selected
          ? 'border-red-500 bg-red-50 shadow-[4px_4px_0px_#EF4444]'
          : isLive
          ? 'border-red-400 bg-white shadow-[3px_3px_0px_#FCA5A5]'
          : 'border-gray-200 bg-white hover:border-gray-400'
      }`}
    >
      {/* Top strip */}
      <div className={`px-4 py-2 flex items-center justify-between ${
        isLive ? 'bg-red-600' : 'bg-gray-900'
      }`}>
        <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest truncate max-w-[60%]">
          {match.stage || 'FIFA World Cup 2026'} {match.group ? `· ${match.group}` : ''}
        </span>
        <StatusBadge status={match.status} minute={isLive ? matchMinute : null} />
      </div>

      {/* Score row */}
      <div className="px-4 py-4 flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <TeamFlag teamName={home} pulse={isLive} size="md" />
          <span className="text-xs font-black text-gray-900 uppercase tracking-tight text-center leading-tight">{home}</span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-1 px-3">
          {isLive ? (
            <motion.span
              className="font-black text-xl tabular-nums text-red-600"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {dispScore}
            </motion.span>
          ) : (
            <span className="font-black text-xl tabular-nums text-gray-900">{dispScore}</span>
          )}
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            {match.status === 'SCHEDULED' ? fmtTime(match.utcDate) : match.status === 'LIVE' ? 'Live' : 'Full Time'}
          </span>
        </div>

        {/* Away */}
        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <TeamFlag teamName={away} pulse={isLive} size="md" />
          <span className="text-xs font-black text-gray-900 uppercase tracking-tight text-center leading-tight">{away}</span>
        </div>
      </div>

      {/* Venue & time */}
      <div className="px-4 pb-3 border-t border-gray-100 pt-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-400 font-semibold truncate">{match.venue}</span>
        <span className="text-[10px] text-gray-500 font-bold shrink-0 ml-2">{fmtDate(match.utcDate)}</span>
      </div>
    </motion.div>
  );
}

// ─── Match Event Item ─────────────────────────────────────────────
function EventItem({ event }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0"
    >
      {/* Animated event widget — replaces emoji */}
      <MatchEventIcon type={event.type} color={event.color} size={18} animate />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-none text-white"
            style={{ backgroundColor: event.color }}
          >
            {event.label}
          </span>
          <span className="text-[10px] font-black text-gray-500">{event.minute}'</span>
        </div>
        <p className="text-xs font-bold text-gray-900 mt-0.5 truncate">{event.player}</p>
        <p className="text-[10px] text-gray-500 font-semibold">{event.team}</p>
      </div>
    </motion.div>
  );
}

// ─── Atmosphere Meter ─────────────────────────────────────────────
function AtmosphereMeter({ atmosphere, matchStatus }) {
  const color = atmosphere > 80 ? '#EF4444' : atmosphere > 60 ? '#F59E0B' : '#3B82F6';
  const label = atmosphere > 85 ? 'ELECTRIC!' : atmosphere > 70 ? 'INTENSE' : atmosphere > 50 ? 'BUILDING' : 'CALM';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
          <Activity size={11} /> Crowd Atmosphere
        </span>
        <span className="text-xs font-black" style={{ color }}>{label}</span>
      </div>
      <div className="h-3 bg-gray-100 border border-gray-200 rounded-none overflow-hidden">
        <motion.div
          className="h-full rounded-none"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${atmosphere}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase">
        <span>0%</span>
        <span className="font-black text-gray-600">{atmosphere}%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

// ─── Crowd Simulation Panel ───────────────────────────────────────
function CrowdPanel({ match, atmosphere, matchMinute }) {
  const { crowdDensityMap, currentOccupancy, currentVenue, venueCapacity } = useStadium();

  const zones = Object.entries(crowdDensityMap || {});
  const pct   = Math.round((currentOccupancy / venueCapacity) * 100);

  return (
    <div className="flex flex-col gap-4">
      {/* Venue occupancy */}
      <div className="bg-gray-50 border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
            <Users size={11} /> {currentVenue.name}
          </span>
          <span className="text-sm font-black text-gray-900">{pct}% Full</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-none overflow-hidden">
          <motion.div
            className={`h-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-green-500'}`}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 font-semibold">
          {currentOccupancy.toLocaleString()} / {venueCapacity.toLocaleString()} spectators
        </p>
      </div>

      {/* Zone grid */}
      <div className="grid grid-cols-4 gap-2">
        {zones.slice(0, 8).map(([zone, data]) => {
          const d = data.density ?? 0;
          const color = d >= 85 ? '#EF4444' : d >= 60 ? '#F59E0B' : '#10B981';
          return (
            <div key={zone} className="bg-white border border-gray-200 p-2 text-center">
              <div className="text-[9px] font-black text-gray-500 uppercase mb-1">Zone {zone}</div>
              <div className="text-base font-black" style={{ color }}>{d}%</div>
            </div>
          );
        })}
      </div>

      {/* Atmosphere meter */}
      <AtmosphereMeter atmosphere={atmosphere} matchStatus={match?.status} />
    </div>
  );
}

// ─── Standings Table ──────────────────────────────────────────────
function StandingsTable({ standings }) {
  // Filter to only include 'TOTAL' standing tables to avoid Home/Away duplicates
  const overallStandings = standings?.filter(s => !s.type || s.type === 'TOTAL') || [];
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);

  if (!overallStandings?.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Trophy className="mx-auto mb-2 opacity-30" size={28} />
        <p className="text-xs font-bold">Standings load after the tournament groups are set.</p>
        <p className="text-[10px] mt-1 text-gray-300">Add your football-data.org key in Settings to fetch live standings.</p>
      </div>
    );
  }

  // Ensure index is valid
  const activeIdx = selectedGroupIdx < overallStandings.length ? selectedGroupIdx : 0;
  const activeGroup = overallStandings[activeIdx];

  const getGroupName = (group, idx) => {
    if (group.group) {
      // "GROUP_A" -> "Group A", "GROUP_L" -> "Group L"
      return group.group.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    if (group.stage && group.stage !== 'ALL') {
      return group.stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    return `Group ${idx + 1}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Pane: Group Selectors */}
      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
        <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase mb-1">
          Select Group Table
        </span>
        {overallStandings.map((group, gi) => {
          const isSelected = activeIdx === gi;
          return (
            <button
              key={gi}
              type="button"
              onClick={() => setSelectedGroupIdx(gi)}
              className={`w-full flex items-center justify-between px-4 py-3 border-2 transition-all cursor-pointer text-left
                ${isSelected
                  ? 'border-blue-600 bg-blue-50 text-blue-900 font-black shadow-[3px_3px_0px_#2563EB]'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center gap-2">
                <Trophy size={12} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
                <span className="text-xs uppercase tracking-wider">{getGroupName(group, gi)}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-bold">
                {group.table?.length || 0} teams
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Pane: Selected Group Standings View */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {activeGroup && (
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border-2 border-gray-900 shadow-[6px_6px_0px_#111827]"
          >
            {/* Header */}
            <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between border-b-2 border-gray-900">
              <span className="text-xs font-black uppercase tracking-wider">
                {getGroupName(activeGroup, activeIdx)} Standings Table
              </span>
              <span className="text-[9px] text-green-400 font-black uppercase tracking-widest">
                Top 2 Qualify
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-[9px] font-black text-gray-500 uppercase w-12 text-center">Pos</th>
                    <th className="px-4 py-3 text-[9px] font-black text-gray-500 uppercase">Team</th>
                    <th className="px-3 py-3 text-[9px] font-black text-gray-500 uppercase text-center w-10">P</th>
                    <th className="px-3 py-3 text-[9px] font-black text-gray-500 uppercase text-center w-10">W</th>
                    <th className="px-3 py-3 text-[9px] font-black text-gray-500 uppercase text-center w-10">D</th>
                    <th className="px-3 py-3 text-[9px] font-black text-gray-500 uppercase text-center w-10">L</th>
                    <th className="px-3 py-3 text-[9px] font-black text-gray-500 uppercase text-center w-12">GD</th>
                    <th className="px-4 py-3 text-[9px] font-black text-gray-900 uppercase text-center font-extrabold w-12 bg-gray-50 border-l border-gray-200">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeGroup.table || []).map((row, ri) => {
                    const isQualifying = ri < 2;
                    return (
                      <tr
                        key={ri}
                        className={`border-b border-gray-100 transition-colors hover:bg-gray-50/50
                          ${isQualifying ? 'bg-green-50/40' : ''}`}
                      >
                        <td className="px-4 py-2.5 text-center font-black text-gray-700 border-r border-gray-100">
                          {isQualifying ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-green-600 text-white rounded-full text-[10px]">
                              {row.position}
                            </span>
                          ) : (
                            row.position
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-gray-900">
                          <span className="flex items-center gap-2">
                            {row.team?.name}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-600 font-semibold">{row.playedGames}</td>
                        <td className="px-3 py-2.5 text-center text-green-600 font-bold">{row.won}</td>
                        <td className="px-3 py-2.5 text-center text-amber-600 font-medium">{row.draw}</td>
                        <td className="px-3 py-2.5 text-center text-red-500 font-medium">{row.lost}</td>
                        <td className={`px-3 py-2.5 text-center font-bold
                          ${row.goalDifference > 0 ? 'text-green-600' : row.goalDifference < 0 ? 'text-red-500' : 'text-gray-500'}`}
                        >
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="px-4 py-2.5 text-center font-black text-gray-900 bg-gray-50/40 border-l border-gray-200">
                          {row.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function LiveMatches() {
  const { footballApiKey, currentVenue } = useStadium();
  const {
    matches, liveMatch, standings, matchEvents,
    atmosphere, isLoading, error, lastUpdated,
    matchMinute, liveScore, getFlag, refresh,
  } = useFootballAPI();

  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [venueTime, setVenueTime] = useState(() => getVenueLocalTime(currentVenue?.timezone));

  // Live venue clock — updates every second
  useEffect(() => {
    const tick = () => setVenueTime(getVenueLocalTime(currentVenue?.timezone));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [currentVenue?.timezone]);

  // Auto-select live match
  useEffect(() => {
    const live = matches.find(m => m.status === 'LIVE');
    if (live) {
      setSelectedMatchId(live.id);
      setActiveTab('live');
    }
  }, [matches]);

  const selectedMatch = matches.find(m => m.id === selectedMatchId) || liveMatch || matches[0];
  const hasLive       = matches.some(m => m.status === 'LIVE');
  const hasKey        = !!footballApiKey;

  const TABS = [
    { id: 'live',     label: 'LIVE',      disabled: !hasLive },
    { id: 'schedule', label: 'SCHEDULE'   },
    { id: 'crowd',    label: 'CROWD'      },
    { id: 'standings',label: 'STANDINGS'  },
  ];

  return (
    <PageTransition>
      <div className="pt-28 bg-gray-50 min-h-screen">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="bg-gray-900 text-white px-8 py-6 border-b-2 border-gray-700">
          <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                {/* Animated match icon — replaces ⚽ emoji */}
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center"
                >
                  <Swords size={20} className="text-white" />
                </motion.div>
                <h1 className="text-4xl font-black uppercase tracking-tight">Live Match Center</h1>
                {hasLive && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-[10px] font-black tracking-widest animate-pulse rounded-none">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    LIVE NOW
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm font-semibold">FIFA World Cup 2026 · Real-Time Data</p>
            </div>

            {/* Status strip */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Venue local time clock */}
              <div className="flex flex-col items-center border border-gray-600 px-3 py-1.5 bg-gray-800">
                <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest flex items-center gap-1">
                  <Clock size={9} /> VENUE TIME
                </span>
                <span className="text-sm font-black tabular-nums">{venueTime.time}</span>
                <span className="text-[9px] text-gray-400 font-semibold">{venueTime.offset}</span>
              </div>

              {/* API key status */}
              <div className={`flex items-center gap-2 px-3 py-2 border text-xs font-bold rounded-none ${
                hasKey
                  ? 'border-green-500 text-green-400 bg-green-900/20'
                  : 'border-amber-500 text-amber-400 bg-amber-900/20'
              }`}>
                {hasKey ? <Wifi size={12} /> : <WifiOff size={12} />}
                {hasKey ? 'Live API Connected' : 'Demo Mode — Add Key in Settings'}
              </div>

              {/* Last updated */}
              {lastUpdated && (
                <div className="text-[10px] text-gray-500 font-bold hidden md:block">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              )}

              {/* Refresh */}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider border border-white/20 rounded-none transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ── TAB BAR ────────────────────────────────────────────── */}
        <div className="bg-gray-800 border-b-2 border-gray-700">
          <div className="max-w-screen-2xl mx-auto flex">
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`relative px-8 py-4 text-xs font-black uppercase tracking-widest transition-all cursor-pointer border-r border-gray-700 last:border-0 ${
                    active
                      ? 'bg-white text-gray-900'
                      : tab.disabled
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.id === 'live' && hasLive && !active && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CONTENT ────────────────────────────────────────────── */}
        <div className="max-w-screen-2xl mx-auto p-6">
          <AnimatePresence mode="wait">

            {/* ── LIVE TAB ──────────────────────────────────────── */}
            {activeTab === 'live' && (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Live score hero */}
                {selectedMatch && selectedMatch.status === 'LIVE' && (
                  <div className="lg:col-span-3 bg-gradient-to-br from-gray-900 to-red-950 border-2 border-red-500 text-white p-8 shadow-[6px_6px_0px_#EF4444]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black tracking-widest text-red-400 uppercase">
                        {selectedMatch.stage} {selectedMatch.group ? `· ${selectedMatch.group}` : ''}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-black text-red-400 tracking-widest">
                          LIVE — {matchMinute ?? '?'}'
                        </span>
                      </div>
                    </div>

                    {/* Teams + Score */}
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1 text-center flex flex-col items-center">
                        <div className="mb-3">
                          <TeamFlag teamName={selectedMatch.homeTeam.name} pulse size="lg" />
                        </div>
                        <div className="text-xl font-black uppercase tracking-tight">{selectedMatch.homeTeam.name}</div>
                        <div className="text-[10px] text-gray-400 mt-1 font-bold">HOME</div>
                      </div>

                      <div className="text-center px-2 md:px-8 shrink-0">
                        <div className="text-4xl md:text-6xl font-black text-white tabular-nums leading-none whitespace-nowrap">
                          {liveScore.home ?? '0'} – {liveScore.away ?? '0'}
                        </div>
                        <div className="text-[9px] md:text-xs text-red-400 font-black mt-3 uppercase tracking-widest whitespace-nowrap">
                          Half Time · {matchMinute ?? 0}'
                        </div>
                      </div>

                      <div className="flex-1 text-center flex flex-col items-center">
                        <div className="mb-3">
                          <TeamFlag teamName={selectedMatch.awayTeam.name} pulse size="lg" />
                        </div>
                        <div className="text-xl font-black uppercase tracking-tight">{selectedMatch.awayTeam.name}</div>
                        <div className="text-[10px] text-gray-400 mt-1 font-bold">AWAY</div>
                      </div>
                    </div>

                    {/* Venue */}
                    <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-gray-400 font-semibold flex items-center justify-center gap-1.5">
                      <AlertCircle size={10} className="text-gray-500" />
                      {selectedMatch.venue}
                    </div>
                  </div>
                )}

                {/* Events feed */}
                <div className="lg:col-span-2 bg-white border-2 border-gray-200">
                  <div className="border-b-2 border-gray-900 px-4 py-3 bg-gray-900 text-white">
                    <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Zap size={12} /> Match Events Feed
                    </h2>
                  </div>
                  <div className="p-4 max-h-[400px] overflow-y-auto">
                    {matchEvents.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Clock className="mx-auto mb-2 opacity-30" size={24} />
                        <p className="text-xs font-bold">Awaiting match events...</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {matchEvents.map(e => <EventItem key={e.id} event={e} />)}
                      </AnimatePresence>
                    )}
                  </div>
                </div>

                {/* Crowd panel */}
                <div className="bg-white border-2 border-gray-200">
                  <div className="border-b-2 border-gray-900 px-4 py-3 bg-gray-900 text-white">
                    <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Users size={12} /> Crowd Monitor
                    </h2>
                  </div>
                  <div className="p-4">
                    <CrowdPanel
                      match={selectedMatch}
                      atmosphere={atmosphere}
                      matchMinute={matchMinute}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SCHEDULE TAB ──────────────────────────────────── */}
            {activeTab === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* API hint banner */}
                {!hasKey && (
                  <div className="mb-6 flex items-start gap-3 bg-amber-50 border-2 border-amber-400 p-4">
                    <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-amber-800">Demo Mode — Showing Realistic Fallback Matches</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Add a free <strong>football-data.org</strong> API key in{' '}
                        <strong>Settings → Football API Key</strong> to see real FIFA WC 2026 live data.{' '}
                        Sign up free at{' '}
                        <a href="https://www.football-data.org/client/register" target="_blank" rel="noreferrer" className="underline font-black">
                          football-data.org
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <MatchCardSkeleton key={i} />
                    ))}
                  </div>
                ) : error && !matches.length ? (
                  <div className="flex items-center gap-3 p-4 border-2 border-red-400 bg-red-50">
                    <AlertCircle className="text-red-500 shrink-0" />
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {matches.map(m => (
                      <MatchCard
                        key={m.id}
                        match={m}
                        isLive={m.status === 'LIVE'}
                        matchMinute={m.status === 'LIVE' ? matchMinute : null}
                        liveScore={liveScore}
                        getFlag={getFlag}
                        selected={selectedMatchId === m.id}
                        onClick={() => {
                          setSelectedMatchId(m.id);
                          if (m.status === 'LIVE') setActiveTab('live');
                        }}
                      />
                    ))}
                  </div>
                )}

                {matches.length === 0 && !isLoading && (
                  <div className="text-center py-16 text-gray-400">
                    <Trophy className="mx-auto mb-3 opacity-30" size={40} />
                    <p className="font-bold text-base">No matches today</p>
                    <p className="text-xs mt-1">Check back on a match day, or add your football API key in Settings.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── CROWD TAB ─────────────────────────────────────── */}
            {activeTab === 'crowd' && (
              <motion.div
                key="crowd"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Live crowd */}
                <div className="bg-white border-2 border-gray-200">
                  <div className="border-b-2 border-gray-900 px-4 py-3 bg-gray-900 text-white">
                    <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Users size={12} /> Stadium Crowd Monitor
                    </h2>
                  </div>
                  <div className="p-5">
                    <CrowdPanel
                      match={selectedMatch}
                      atmosphere={atmosphere}
                      matchMinute={matchMinute}
                    />
                  </div>
                </div>

                {/* Atmosphere & events */}
                <div className="bg-white border-2 border-gray-200">
                  <div className="border-b-2 border-gray-900 px-4 py-3 bg-gray-900 text-white">
                    <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Activity size={12} /> Fan Atmosphere Pulse
                    </h2>
                  </div>
                  <div className="p-5 flex flex-col gap-5">
                    {/* Big atmosphere dial */}
                    <div className="text-center">
                      <div
                        className="text-7xl font-black tabular-nums"
                        style={{
                          color: atmosphere > 80 ? '#EF4444' : atmosphere > 60 ? '#F59E0B' : '#3B82F6'
                        }}
                      >
                        {atmosphere}
                      </div>
                      <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                        Atmosphere Score
                      </div>
                    </div>

                    <AtmosphereMeter atmosphere={atmosphere} matchStatus={selectedMatch?.status} />

                    {/* Legend */}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { label: 'Goals Scored', color: '#10B981', count: matchEvents.filter(e => e.type === 'GOAL').length },
                        { label: 'Cards', color: '#F59E0B', count: matchEvents.filter(e => e.type.includes('CARD')).length },
                        { label: 'Total Events', color: '#3B82F6', count: matchEvents.length },
                      ].map(item => (
                        <div key={item.label} className="border border-gray-200 p-3 text-center">
                          <div className="text-2xl font-black" style={{ color: item.color }}>{item.count}</div>
                          <div className="text-[9px] text-gray-500 font-black uppercase mt-0.5">{item.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Note */}
                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 p-3">
                      <Info size={12} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-800 font-semibold">
                        Crowd density is simulated using match phase timing, weather conditions, and match events.
                        Real IoT sensor data would replace this in a production deployment.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STANDINGS TAB ─────────────────────────────────── */}
            {activeTab === 'standings' && (
              <motion.div
                key="standings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <div className="bg-white border-2 border-gray-200">
                  <div className="border-b-2 border-gray-900 px-4 py-3 bg-gray-900 text-white flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Trophy size={12} /> FIFA WC 2026 — Group Standings
                    </h2>
                    {!hasKey && (
                      <span className="text-[9px] text-amber-400 font-black uppercase tracking-wide">
                        Add API key for live standings
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    {isLoading ? (
                      <TableSkeleton rows={8} />
                    ) : (
                      <StandingsTable standings={standings} />
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </PageTransition>
  );
}
