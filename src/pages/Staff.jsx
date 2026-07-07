import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Shield, Users, Briefcase, Zap,
  Radio, Send, Clock, RefreshCw
} from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { useAIAction } from '../hooks/useAI';
import PageHeader from '../components/PageHeader';
import GlowButton from '../components/GlowButton';
import LiveBadge from '../components/LiveBadge';
import PageTransition from '../components/PageTransition';

const ROLES = ['Security', 'Medical Coordinator', 'Volunteer Steward', 'Concessions Operator'];

export default function Staff() {
  const { t } = useTranslation();
  const {
    staffOnDuty,
    currentMatchAtVenue,
    currentVenue,
    updateStaffStatus,
    reassignStaff
  } = useStadium();

  // ── Filters & Forms ──
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All');
  const [commsMessage, setCommsMessage] = useState('');
  const [briefingTopic, setBriefingTopic] = useState('Crowd Management');
  const [briefingText, setBriefingText] = useState('');
  
  const { callAI, loading: aiLoading } = useAIAction();
  const [toastMsg, setToastMsg] = useState('');

  // ── Virtual Scroll state ──
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef(null);

  // Fetch pre-match briefing on mount
  useEffect(() => {
    handleGenerateBriefing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateBriefing = async () => {
    setBriefingText('');
    const scenario = `${briefingTopic} protocols: ${currentMatchAtVenue.homeTeam.name} vs ${currentMatchAtVenue.awayTeam.name} at ${currentVenue.name}.`;
    const res = await callAI('getStaffProtocol', scenario, 'All Staff Members');
    if (res.success) {
      setBriefingText(res.data);
    } else {
      setBriefingText(`1. Arrive at assigned zone 3 hours prior to kickoff.
2. Confirm radio operation on Channel 4.
3. Position safety barriers at ticket boundaries.
4. Support ticket validator scans during crowd peaks.
5. Report any access control anomalies to dispatcher.`);
    }
  };

  const handleSendComms = (e) => {
    e.preventDefault();
    if (!commsMessage.trim()) return;
    setToastMsg(`Radio Broadcast: "${commsMessage}"`);
    setCommsMessage('');
    setTimeout(() => setToastMsg(''), 4000);
  };

  // ── Performance: Memoize filtered staff roster ──
  const filteredStaff = useMemo(() => {
    return staffOnDuty.filter(s => {
      const matchRole = selectedRoleFilter === 'All' || s.role === selectedRoleFilter;
      const matchZone = selectedZoneFilter === 'All' || s.zone === selectedZoneFilter;
      return matchRole && matchZone;
    });
  }, [staffOnDuty, selectedRoleFilter, selectedZoneFilter]);

  // ── Virtual Scroll calculations (Row height = 58px, Container viewport = 348px) ──
  const rowHeight = 58;
  const containerHeight = 348;
  const totalCount = filteredStaff.length;

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const endIndex = Math.min(totalCount, Math.ceil((scrollTop + containerHeight) / rowHeight) + 2);
  const visibleStaff = useMemo(() => {
    return filteredStaff.slice(startIndex, endIndex);
  }, [filteredStaff, startIndex, endIndex]);

  const paddingTop = startIndex * rowHeight;
  const paddingBottom = Math.max(0, (totalCount - endIndex) * rowHeight);

  // Scroll handler to trigger re-renders only on boundary index changes
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  const zonesList = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'VIP Suites', 'Media Zone'];

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-6 mt-14">
      {/* Tactical radio toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] bg-[#00FF87] text-[#060D1A] font-heading font-bold text-xs px-6 py-3 rounded-xl border border-white/20 flex items-center gap-2"
          >
            <Radio size={14} className="animate-pulse" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title={t('staff.title')}
        subtitle="Manage logistics, task assignment, and AI support briefings for on-duty stadium personnel."
        icon={Briefcase}
        actions={
          <div className="flex items-center gap-2">
            <LiveBadge status="live" label="STAFF LOGS" />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* LEFT COLUMN: AI Briefings */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/60 rounded-2xl flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                  <Zap size={14} className="text-[#00FF87]" />
                  AI pre-match briefings
                </h3>
                <span className="text-[9px] text-[#4A6580] font-bold uppercase tracking-wider font-mono">
                  Claude Dispatcher
                </span>
              </div>

              {/* Topic selector with aria-labels */}
              <div className="grid grid-cols-3 gap-1.5 mb-4" role="tablist">
                {['Crowd Management', 'Medical Hazard', 'Evacuation'].map(topic => (
                  <button
                    key={topic}
                    onClick={() => setBriefingTopic(topic)}
                    aria-label={`Select ${topic} briefing template`}
                    role="tab"
                    aria-selected={briefingTopic === topic}
                    className={`py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all ${
                      briefingTopic === topic
                        ? 'border-[#00D4FF] bg-[#00D4FF]/10 text-[#00D4FF]'
                        : 'border-[#0F2340] text-[#4A6580] hover:text-[#E8F4FD]'
                    }`}
                  >
                    {topic.split(' ')[0]}
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl border border-[#0F2340] bg-[#0A192F]/60 text-xs leading-relaxed min-h-[160px]">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <RefreshCw size={18} className="animate-spin text-[#00D4FF]" />
                    <span className="text-[10px] text-[#4A6580] animate-pulse">Generating operational briefs...</span>
                  </div>
                ) : (
                  <div className="space-y-1 text-[#E8F4FD]">
                    {briefingText.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <GlowButton
              onClick={handleGenerateBriefing}
              disabled={aiLoading}
              aria-label="Generate new AI pre-match briefing report"
              className="w-full mt-4 justify-center"
            >
              <RefreshCw size={11} /> Generate New Briefing
            </GlowButton>
          </div>

          <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl">
            <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2 mb-2">
              <Radio size={14} className="text-[#FF3366]" />
              Staff Radio channel
            </h3>
            <p className="text-[10px] text-[#4A6580] mb-4">
              Push text-to-speech broadcast commands straight to stewards' tactical radios.
            </p>

            <form onSubmit={handleSendComms} className="flex gap-2">
              <input
                type="text"
                value={commsMessage}
                onChange={(e) => setCommsMessage(e.target.value)}
                placeholder="All stewards, assist at Gate D queue overflow..."
                aria-label="Staff radio tactical message"
                className="flex-1 bg-[#0A192F] border border-[#0F2340] rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#00D4FF]"
              />
              <button
                type="submit"
                disabled={!commsMessage.trim()}
                aria-label="Broadcast tactical message"
                className="px-4 rounded-xl bg-[#FF3366] hover:bg-[#FF5588] text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Virtualized Staff Roster Table */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="glass-card p-5 border border-[#00D4FF]/10 bg-[#0D1B2E]/40 rounded-2xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-white/5 pb-4">
                <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                  <Users size={14} className="text-[#00D4FF]" />
                  Active Roster ({filteredStaff.length})
                </h3>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    aria-label="Filter staff by tactical role"
                    className="bg-[#0A192F] border border-[#0F2340] rounded-xl px-3 py-1.5 text-[10px] text-white font-bold uppercase focus:border-[#00D4FF]"
                  >
                    <option value="All">All Roles</option>
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                  <select
                    value={selectedZoneFilter}
                    onChange={(e) => setSelectedZoneFilter(e.target.value)}
                    aria-label="Filter staff by assigned stadium zone"
                    className="bg-[#0A192F] border border-[#0F2340] rounded-xl px-3 py-1.5 text-[10px] text-white font-bold uppercase focus:border-[#00D4FF]"
                  >
                    <option value="All">All Zones</option>
                    {zonesList.map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Virtual Scroll Container ── */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="overflow-y-auto border border-[#0F2340] rounded-xl bg-[#060D1A]/50"
                style={{ height: containerHeight }}
              >
                <div style={{ paddingTop, paddingBottom }}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#0F2340] text-[#4A6580] uppercase tracking-wider font-semibold bg-[#0A192F]/80 sticky top-0 z-20">
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Zone</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {totalCount === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-[#4A6580] text-xs">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Briefcase size={28} className="opacity-20 animate-pulse text-[#00D4FF] mb-1" />
                              <p className="font-semibold text-white">No personnel found</p>
                              <p className="text-[10px] text-[#4A6580] max-w-[220px] mx-auto leading-normal">
                                Try clearing your search query or adjusting the role filter to find active volunteers and coordinators.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        visibleStaff.map(staff => (
                          <tr
                            key={staff.id}
                            style={{ height: rowHeight }}
                            className="border-b border-white/5 hover:bg-white/[0.01] transition-colors"
                          >
                            <td className="py-2 px-3">
                              <div>
                                <p className="font-semibold text-white">{staff.name}</p>
                                <span className="text-[9px] text-[#4A6580] font-mono">{staff.badge}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-[#4A6580]">{staff.role.split(' ')[0]}</td>
                            <td className="py-2 px-3">
                              <select
                                value={staff.zone}
                                onChange={(e) => reassignStaff(staff.id, e.target.value)}
                                aria-label={`Reassign zone for ${staff.name}`}
                                className="bg-[#0A192F] border border-transparent rounded-lg px-1.5 py-0.5 text-xs text-[#00D4FF] focus:border-[#00D4FF]"
                              >
                                {zonesList.map(z => (
                                  <option key={z} value={z}>{z}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={staff.status}
                                onChange={(e) => updateStaffStatus(staff.id, e.target.value)}
                                aria-label={`Change shift status for ${staff.name}`}
                                className={`bg-transparent border border-transparent rounded-lg px-1.5 py-0.5 text-xs font-bold ${
                                  staff.status === 'active'      ? 'text-[#00FF87]' :
                                  staff.status === 'responding'  ? 'text-[#FF3366]' :
                                  staff.status === 'break'       ? 'text-[#FFB800]' : 'text-[#4A6580]'
                                }`}
                              >
                                <option value="active" className="bg-[#0D1B2E] text-white">Active</option>
                                <option value="responding" className="bg-[#0D1B2E] text-white">Responding</option>
                                <option value="break" className="bg-[#0D1B2E] text-white">Break</option>
                                <option value="offline" className="bg-[#0D1B2E] text-white">Offline</option>
                              </select>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                onClick={() => {
                                  updateStaffStatus(staff.id, 'responding');
                                  setToastMsg(`Tactical incident dispatched to ${staff.name} at ${staff.zone}`);
                                  setTimeout(() => setToastMsg(''), 4000);
                                }}
                                aria-label={`Dispatch emergency response ticket to ${staff.name}`}
                                className="text-[10px] text-[#00D4FF] hover:text-[#33DDFF] font-semibold border border-[#00D4FF]/20 hover:border-[#00D4FF] px-2 py-0.5 rounded-lg bg-transparent transition-all"
                              >
                                Dispatch
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-[#4A6580] mt-4 pt-3 border-t border-white/5">
              Updates in real-time according to dispatch and volunteer logs.
            </p>
          </div>
        </div>
      </div>
      </div>
    </PageTransition>
  );
}
