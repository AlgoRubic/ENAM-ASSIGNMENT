import React, { useRef, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  SlidersHorizontal,
  FileText,
  Calendar,
  Zap,
  Volume2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Headphones,
  Bookmark,
  Share2,
  Clipboard,
  Check
} from 'lucide-react';
import { FeedSkeleton } from './Skeletons';

export default function PushFeed({ 
  digest, 
  alerts = [], 
  windowHours, 
  setWindowHours, 
  asOfTimestamp,
  setAsOfTimestamp,
  highSignalOnly, 
  setHighSignalOnly,
  onSelectSymbol,
  onOpenSettings,
  isLoading = false
}) {
  const [showRoutine, setShowRoutine] = useState(false);
  const [alertFilter, setAlertFilter] = useState('all'); // 'all' | 'market' | 'filings'
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [audioIndex, setAudioIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [audioError, setAudioError] = useState('');
  const [savedStories, setSavedStories] = useState(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(window.localStorage.getItem('finn-saved-stories') || '[]'); } catch { return []; }
  });
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [copiedStoryId, setCopiedStoryId] = useState(null);
  const [briefCopied, setBriefCopied] = useState(false);
  const speechSessionRef = useRef(0);

  const announcements = digest?.high_signal_announcements || [];
  const announcementSignature = announcements.map((item) => item.id).join('|');

  React.useEffect(() => {
    const resetTimer = setTimeout(() => {
      setAudioIndex((current) => Math.min(current, Math.max(announcements.length - 1, 0)));
      setIsSpeaking(false);
      setAudioError('');
    }, 0);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSessionRef.current += 1;
      window.speechSynthesis.cancel();
    }
    return () => clearTimeout(resetTimer);
  }, [announcementSignature, announcements.length]);

  React.useEffect(() => () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  if (isLoading || !digest) {
    return <FeedSkeleton />;
  }

  const activeAnnouncement = announcements[audioIndex];

  const stopAudio = () => {
    speechSessionRef.current += 1;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const playAudio = (index = audioIndex) => {
    const item = announcements[index];
    if (!item || typeof window === 'undefined' || !window.speechSynthesis) {
      setAudioError('Audio playback is not supported in this browser.');
      return;
    }

    const sessionId = ++speechSessionRef.current;
    window.speechSynthesis.cancel();
    const text = `${item.company_name}. ${item.title}. ${item.summary_one_liner || ''} ${item.results_breakdown?.key_takeaway || ''}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1;
    utterance.onend = () => {
      if (sessionId !== speechSessionRef.current) return;
      if (index < announcements.length - 1) {
        setAudioIndex(index + 1);
        playAudio(index + 1);
      } else {
        setIsSpeaking(false);
      }
    };
    utterance.onerror = () => {
      if (sessionId !== speechSessionRef.current) return;
      setIsSpeaking(false);
      setAudioError('Audio playback was interrupted. Try play again.');
    };
    setAudioIndex(index);
    setAudioError('');
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleAudio = () => {
    if (isSpeaking && typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.pause();
      }
      return;
    }
    playAudio(audioIndex);
  };

  const moveAudio = (direction) => {
    const nextIndex = Math.min(Math.max(audioIndex + direction, 0), Math.max(announcements.length - 1, 0));
    setAudioIndex(nextIndex);
    if (isSpeaking) playAudio(nextIndex);
  };

  const isSaved = (storyId) => savedStories.includes(storyId);

  const toggleSaved = (storyId) => {
    setSavedStories((current) => {
      const next = current.includes(storyId) ? current.filter((id) => id !== storyId) : [...current, storyId];
      if (typeof window !== 'undefined') window.localStorage.setItem('finn-saved-stories', JSON.stringify(next));
      return next;
    });
  };

  const shareStory = async (item) => {
    const text = `${item.company_name}: ${item.title}\n${item.summary_one_liner || ''}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: item.title, text });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedStoryId(item.id);
        setTimeout(() => setCopiedStoryId(null), 1800);
      }
    } catch {
      // Sharing can be cancelled by the user; keep the feed state unchanged.
    }
  };

  const copyMorningBrief = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    const brief = announcements.slice(0, 3).map((item, index) => `${index + 1}. ${item.company_name}: ${item.title}. ${item.summary_one_liner || ''}`).join('\n');
    await navigator.clipboard.writeText(`FINN MORNING BRIEF\n\n${brief}`);
    setBriefCopied(true);
    setTimeout(() => setBriefCopied(false), 1800);
  };

  const HISTORICAL_ANCHOR = '2024-11-08T23:59:59Z';
  const windows = [
    { label: 'Live 24h', value: 24, asOf: null, description: 'Current 24h' },
    { label: 'Nov 8 (24h)', value: 24, asOf: HISTORICAL_ANCHOR, description: 'Nov 8, 2024 (24h)' },
    { label: 'Nov 8 (48h)', value: 48, asOf: HISTORICAL_ANCHOR, description: 'Nov 7–8, 2024 (48h)' },
    { label: 'Q2 FY25 (30D)', value: 720, asOf: HISTORICAL_ANCHOR, description: 'Oct–Nov 2024 Archive' },
  ];

  const getTimelineSummary = () => {
    const totalEvents = digest?.high_signal_announcements?.length || 0;
    const totalAlerts = alerts?.length || 0;
    if (!asOfTimestamp) {
      return {
        title: `Live Current ${windowHours}h Window (As of ${digest?.as_of_timestamp || 'Current UTC'})`,
        sub: `${totalEvents} filings in current ${windowHours}h window (2024 Q2 FY25 filings are excluded from live 24h/48h windows).`
      };
    }
    if (windowHours <= 24) {
      return {
        title: `Historical Q2 FY25 Demo • 24h Window (As of ${asOfTimestamp})`,
        sub: `${totalAlerts} triggered alerts • ${totalEvents} verified filings published within 24h of Nov 8, 2024.`
      };
    } else if (windowHours <= 48) {
      return {
        title: `Historical Q2 FY25 Demo • 48h Window (As of ${asOfTimestamp})`,
        sub: `${totalAlerts} triggered alerts • ${totalEvents} verified disclosures published within 48h of Nov 8, 2024.`
      };
    }
    return {
      title: `Historical Q2 FY25 Demo • 30D Archive (As of ${asOfTimestamp})`,
      sub: `Cryptographic archive: ${totalAlerts} threshold alerts • ${totalEvents} verified Q2 FY25 disclosures (Oct–Nov 2024).`
    };
  };

  const timelineInfo = getTimelineSummary();

  // Filter alerts by sub-type
  const marketAlerts = alerts.filter(a => a.alert_type !== 'MATERIAL_FILING');
  const filingAlerts = alerts.filter(a => a.alert_type === 'MATERIAL_FILING');

  const displayedAlertsPool = alertFilter === 'market' 
    ? marketAlerts 
    : alertFilter === 'filings' 
    ? filingAlerts 
    : alerts;

  // Limit preview to 4 or 6 unless "showAllAlerts" is expanded
  const visibleAlerts = showAllAlerts ? displayedAlertsPool : displayedAlertsPool.slice(0, 5);

  // Group announcements strictly by actual filing_date (never 'Today', 'Yesterday', or 'Earlier this Week')
  const visibleAnnouncements = showSavedOnly ? announcements.filter((item) => isSaved(item.id)) : announcements;
  const groupedAnnouncements = visibleAnnouncements.reduce((acc, item) => {
    const group = `Filing Date: ${item.filing_date || 'October 2024'}`;
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4 pb-24 smooth-fade-in">
      
      {/* iOS-Style Segmented Control Toolbar */}
      <div className="flex items-center justify-between gap-3">
        {/* Window Selector */}
        <div className="flex-1 bg-[#1c1c1e] p-1 rounded-xl flex items-center">
          {windows.map((w) => {
            const isSelected = windowHours === w.value && Boolean(asOfTimestamp) === Boolean(w.asOf);
            return (
              <button
                key={`${w.label}-${w.value}`}
                onClick={() => {
                  setWindowHours(w.value);
                  if (setAsOfTimestamp) setAsOfTimestamp(w.asOf);
                }}
                className={`flex-1 py-1 text-xs transition-all rounded-lg ${
                  isSelected
                    ? 'bg-[#2c2c2e] text-white font-semibold shadow-sm'
                    : 'text-[#86868b] hover:text-[#d1d1d6] font-medium'
                }`}
              >
                {w.label}
              </button>
            );
          })}
        </div>

        {/* High Signal Toggle */}
        <button
          onClick={() => setHighSignalOnly(!highSignalOnly)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
            highSignalOnly 
              ? 'bg-white text-black border-white font-semibold' 
              : 'bg-[#1c1c1e] text-[#86868b] border-transparent hover:text-white'
          }`}
        >
          Signal Only
        </button>
      </div>

      {/* Timeline Status Callout */}
      <div className="apple-card rounded-2xl px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-white tracking-tight">
            {timelineInfo.title}
          </div>
          <div className="text-[11px] text-[#86868b] mt-0.5">
            {timelineInfo.sub}
          </div>
        </div>
        <div className="text-right flex-shrink-0 pl-2">
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.08] text-[#f5f5f7]">
            {alerts.length} Alerts
          </span>
        </div>
      </div>

      {/* TRIGGERED ALERTS (Expanded, Timeline-Aware, and Sub-Filtered) */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                Triggered Alerts ({alerts.length})
              </span>
            </div>
            <button
              onClick={onOpenSettings}
              className="text-[11px] text-[#86868b] hover:text-white transition-colors flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Thresholds</span>
            </button>
          </div>

          {/* Sub-Filters: All | Price & Vol | Material Filings */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() => setAlertFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                alertFilter === 'all'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#1c1c1e] text-[#86868b] hover:text-white'
              }`}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setAlertFilter('market')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                alertFilter === 'market'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#1c1c1e] text-[#86868b] hover:text-white'
              }`}
            >
              Price & Vol ({marketAlerts.length})
            </button>
            <button
              onClick={() => setAlertFilter('filings')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                alertFilter === 'filings'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#1c1c1e] text-[#86868b] hover:text-white'
              }`}
            >
              Material Filings ({filingAlerts.length})
            </button>
          </div>

          {/* Alert Cards Stream */}
          <div className="space-y-2">
            {visibleAlerts.map((alert) => {
              const isFilingAlert = alert.alert_type === 'MATERIAL_FILING';
              const isPositive = (alert.price_change_pct || 0) >= 0;

              return (
                <div 
                  key={alert.id}
                  onClick={() => onSelectSymbol(alert.symbol)}
                  className="cursor-pointer apple-card rounded-2xl p-4 hover:border-white/20 transition-all active:scale-[0.99] space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-white tracking-tight">
                          {alert.company_name}
                        </span>
                        <span className="text-[11px] font-mono text-[#86868b]">
                          {alert.symbol.replace('.NS', '')}
                        </span>
                        {isFilingAlert ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#2997ff] bg-[#2997ff]/10 px-2 py-0.5 rounded-md">
                            {alert.category?.replace('_', ' ')}
                          </span>
                        ) : null}
                      </div>

                      {/* Numbers / Sub-details */}
                      {!isFilingAlert ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-white tabular-numbers">
                            ₹{alert.current_price?.toLocaleString('en-IN')}
                          </span>
                          <span className={`inline-flex items-center font-semibold tabular-numbers ${
                            isPositive ? 'text-[#30d158]' : 'text-[#ff453a]'
                          }`}>
                            {isPositive ? '+' : ''}{alert.price_change_pct}%
                          </span>
                          <span className="text-[#3a3a3c]">•</span>
                          <span className="text-[11px] font-medium text-[#ff9f0a] bg-[#ff9f0a]/10 px-2 py-0.5 rounded-full">
                            {alert.volume_multiplier}x 20D Vol
                          </span>
                          <span className="text-[10px] font-mono text-[#86868b] bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-md">
                            {alert.is_live
                              ? `Live EOD (${alert.as_of_date})`
                              : `Cached / Demo (As of ${alert.as_of_date || '2024-11-08'})`}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[11px] text-[#86868b] font-medium">
                          {alert.title} • <span className="font-mono">{alert.timestamp}</span>
                        </div>
                      )}
                    </div>

                    {/* Icon Pill */}
                    {!isFilingAlert ? (
                      <div className={`p-1.5 rounded-full flex-shrink-0 ${
                        isPositive ? 'bg-[#30d158]/10 text-[#30d158]' : 'bg-[#ff453a]/10 text-[#ff453a]'
                      }`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-full bg-[#2997ff]/10 text-[#2997ff] flex-shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <p className="text-[12px] text-[#a1a1a6] leading-relaxed">
                    {alert.reasoning}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Show All / Show Less Toggle Button */}
          {displayedAlertsPool.length > 5 && (
            <button
              onClick={() => setShowAllAlerts(!showAllAlerts)}
              className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-[#86868b] hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <span>{showAllAlerts ? 'Show Less' : `View All ${displayedAlertsPool.length} Triggered Alerts`}</span>
              {showAllAlerts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      )}

      {/* Audio News Briefing */}
      {announcements.length > 0 && (
        <section className="apple-card rounded-2xl p-4 border border-[#2997ff]/20 bg-gradient-to-br from-[#101b2d] to-[#111114] space-y-3" aria-label="Audio news briefing">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#2997ff]/15 text-[#2997ff]"><Headphones className="w-4 h-4" /></div>
              <div>
                <div className="text-xs font-semibold text-white">Audio News Briefing</div>
                <div className="text-[11px] text-[#8fa8c4]">Listen through verified filings in signal order</div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#8fa8c4] bg-white/[0.06] px-2 py-1 rounded-md">
              {audioIndex + 1} / {announcements.length}
            </span>
          </div>

          <div className="rounded-xl bg-black/30 border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#8fa8c4] font-semibold">Now selected</div>
            <div className="text-[13px] font-semibold text-white mt-1 leading-snug">{activeAnnouncement?.title || 'Verified market update'}</div>
            <div className="text-[11px] text-[#a1a1a6] mt-1">{activeAnnouncement?.company_name} • {activeAnnouncement?.filing_date || 'Verified filing'}</div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => moveAudio(-1)} disabled={audioIndex === 0} aria-label="Previous news item" className="p-2 rounded-xl bg-white/[0.06] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.12]"><SkipBack className="w-4 h-4" /></button>
            <button type="button" onClick={toggleAudio} aria-label={isSpeaking ? 'Pause audio briefing' : 'Play audio briefing'} className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#e6e6e6]">
              {isSpeaking && typeof window !== 'undefined' && window.speechSynthesis?.paused ? <Play className="w-4 h-4" /> : isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isSpeaking ? (typeof window !== 'undefined' && window.speechSynthesis?.paused ? 'Resume briefing' : 'Pause briefing') : 'Play briefing'}
            </button>
            <button type="button" onClick={() => moveAudio(1)} disabled={audioIndex >= announcements.length - 1} aria-label="Next news item" className="p-2 rounded-xl bg-white/[0.06] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.12]"><SkipForward className="w-4 h-4" /></button>
            {isSpeaking && <button type="button" onClick={stopAudio} aria-label="Stop audio briefing" className="p-2 rounded-xl bg-[#ff453a]/10 text-[#ff453a] hover:bg-[#ff453a]/20"><Square className="w-4 h-4" /></button>}
          </div>

          <div className="flex items-center justify-between gap-3 text-[11px] text-[#8fa8c4]">
            <label className="flex items-center gap-2"><Volume2 className="w-3.5 h-3.5" /> Speed
              <select value={speechRate} onChange={(event) => setSpeechRate(Number(event.target.value))} className="bg-transparent text-white border border-white/[0.12] rounded-md px-1.5 py-1">
                <option value="0.85">0.85×</option><option value="1">1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option>
              </select>
            </label>
            <span>{isSpeaking ? 'Reading verified evidence' : 'Browser audio · no data leaves device'}</span>
          </div>
          {audioError && <div className="text-[11px] text-[#ff9f0a]" role="status">{audioError}</div>}
        </section>
      )}

      {/* Saved stories + shareable morning brief */}
      {announcements.length > 0 && (
        <section className="apple-card rounded-2xl p-3.5 space-y-3" aria-label="News utilities">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-white">News Desk</div>
              <div className="text-[11px] text-[#86868b]">Keep a shortlist and share a clean handoff</div>
            </div>
            <button type="button" onClick={copyMorningBrief} className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] text-[11px] text-white flex items-center gap-1.5 hover:bg-white/[0.14]">
              {briefCopied ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Clipboard className="w-3.5 h-3.5" />}
              {briefCopied ? 'Copied' : 'Copy morning brief'}
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button type="button" onClick={() => setShowSavedOnly(false)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap ${!showSavedOnly ? 'bg-white text-black' : 'bg-white/[0.06] text-[#86868b]'}`}>All verified news ({announcements.length})</button>
            <button type="button" onClick={() => setShowSavedOnly(true)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap flex items-center gap-1 ${showSavedOnly ? 'bg-[#ffcc00] text-black' : 'bg-white/[0.06] text-[#86868b]'}`}><Bookmark className="w-3 h-3" /> Saved ({savedStories.filter((id) => announcements.some((item) => item.id === id)).length})</button>
          </div>
          {showSavedOnly && visibleAnnouncements.length === 0 && <div className="text-[11px] text-[#86868b] py-1">No saved stories in this window. Tap the bookmark on any filing to keep it here.</div>}
        </section>
      )}

      {/* Corporate Filings Feed (Chronologically Grouped by Actual Filing Date) */}
      <div className="space-y-4 pt-2">
        {Object.keys(groupedAnnouncements).length === 0 && (
          <div className="apple-card rounded-2xl p-5 space-y-2 border border-white/[0.08]">
            <div className="text-xs font-semibold text-white">
              No Exchange Filings in Current {windowHours}h Window
            </div>
            <p className="text-[12px] text-[#a1a1a6] leading-relaxed">
              Verified Q2 FY25 filings are dated October–November 2024 and are mathematically excluded from the live {windowHours}-hour window. Select a Historical Q2 FY25 window (`Nov 8 (24h)` or `Q2 FY25 (30D)`) to inspect archived filings.
            </p>
            {setAsOfTimestamp && (
              <button
                onClick={() => {
                  setWindowHours(720);
                  setAsOfTimestamp(HISTORICAL_ANCHOR);
                }}
                className="mt-1 px-3 py-1.5 rounded-xl bg-white text-black text-xs font-semibold"
              >
                Switch to Historical Q2 FY25 Archive (As of Nov 8, 2024)
              </button>
            )}
          </div>
        )}
        {Object.entries(groupedAnnouncements).map(([groupTitle, items]) => (
          <div key={groupTitle} className="space-y-2.5">
            
            {/* Date Section Header */}
            <div className="flex items-center gap-2 px-1 pt-1">
              <Calendar className="w-3 h-3 text-[#86868b]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                {groupTitle} ({items.length})
              </span>
            </div>

            {items.map((item) => {
              const hasBreakdown = !!item.results_breakdown;
              const hasBio = !!item.executive_bio;

              return (
                <div 
                  key={item.id}
                  className="apple-card rounded-2xl p-4 space-y-3 hover:border-white/15 transition-all"
                >
                  {/* Header: Category Badge + Timestamp */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] bg-white/[0.06] px-2 py-0.5 rounded-md">
                        {item.category.replace('_', ' ')}
                      </span>
                      <button 
                        onClick={() => onSelectSymbol(item.symbol)}
                        className="text-xs font-semibold text-white hover:text-[#2997ff] transition-colors"
                      >
                        {item.company_name}
                      </button>
                    </div>
                    <span className="text-[11px] text-[#515156] font-medium">{item.timestamp}</span>
                  </div>

                  {/* Title & Core Summary */}
                  <div>
                    <h3 className="text-[14px] font-medium text-[#f5f5f7] leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[13px] text-[#a1a1a6] leading-relaxed">
                      {item.summary_one_liner}
                    </p>
                  </div>

                  {/* ENRICHMENT 1: Financial Results Grid */}
                  {hasBreakdown && (
                    <div className="mt-3 p-3.5 rounded-xl bg-black/50 border border-white/[0.08] space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">
                          Financial Results • {item.results_breakdown.period}
                        </span>
                        <span className="text-[11px] text-[#86868b]">
                          Unit: {item.results_breakdown.unit}
                        </span>
                      </div>

                      {/* 4 Quadrants: Revenue, EBITDA, PBT, PAT */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Revenue */}
                        <div className="p-2.5 rounded-lg bg-[#141417] border border-white/[0.04]">
                          <div className="text-[10px] uppercase text-[#86868b] font-medium">Revenue</div>
                          <div className="text-[14px] font-semibold text-white tabular-numbers mt-0.5">
                            ₹{item.results_breakdown.revenue.current.toLocaleString('en-IN')}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] tabular-numbers font-medium">
                            <span className={item.results_breakdown.revenue.delta_qoq_pct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}>
                              QoQ: {item.results_breakdown.revenue.delta_qoq_pct >= 0 ? '+' : ''}{item.results_breakdown.revenue.delta_qoq_pct}%
                            </span>
                            <span className={item.results_breakdown.revenue.delta_yoy_pct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}>
                              YoY: {item.results_breakdown.revenue.delta_yoy_pct >= 0 ? '+' : ''}{item.results_breakdown.revenue.delta_yoy_pct}%
                            </span>
                          </div>
                        </div>

                        {/* EBITDA */}
                        <div className="p-2.5 rounded-lg bg-[#141417] border border-white/[0.04]">
                          <div className="text-[10px] uppercase text-[#86868b] font-medium">
                            EBITDA ({item.results_breakdown.ebitda_margin_pct}%)
                          </div>
                          <div className="text-[14px] font-semibold text-white tabular-numbers mt-0.5">
                            ₹{item.results_breakdown.ebitda.current.toLocaleString('en-IN')}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] tabular-numbers font-medium">
                            <span className={item.results_breakdown.ebitda.delta_qoq_pct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}>
                              QoQ: {item.results_breakdown.ebitda.delta_qoq_pct >= 0 ? '+' : ''}{item.results_breakdown.ebitda.delta_qoq_pct}%
                            </span>
                            <span className={item.results_breakdown.ebitda.delta_yoy_pct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}>
                              YoY: {item.results_breakdown.ebitda.delta_yoy_pct >= 0 ? '+' : ''}{item.results_breakdown.ebitda.delta_yoy_pct}%
                            </span>
                          </div>
                        </div>

                        {/* PBT */}
                        <div className="p-2.5 rounded-lg bg-[#141417] border border-white/[0.04]">
                          <div className="text-[10px] uppercase text-[#86868b] font-medium">PBT</div>
                          <div className="text-[14px] font-semibold text-white tabular-numbers mt-0.5">
                            ₹{item.results_breakdown.pbt.current.toLocaleString('en-IN')}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] tabular-numbers font-medium">
                            <span className={item.results_breakdown.pbt.delta_qoq_pct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}>
                              QoQ: {item.results_breakdown.pbt.delta_qoq_pct >= 0 ? '+' : ''}{item.results_breakdown.pbt.delta_qoq_pct}%
                            </span>
                            <span className={item.results_breakdown.pbt.delta_yoy_pct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}>
                              YoY: {item.results_breakdown.pbt.delta_yoy_pct >= 0 ? '+' : ''}{item.results_breakdown.pbt.delta_yoy_pct}%
                            </span>
                          </div>
                        </div>

                        {/* PAT */}
                        <div className="p-2.5 rounded-lg bg-[#141417] border border-white/[0.04]">
                          <div className="text-[10px] uppercase text-[#86868b] font-medium">
                            PAT ({item.results_breakdown.pat_margin_pct}%)
                          </div>
                          <div className="text-[14px] font-semibold text-[#30d158] tabular-numbers mt-0.5">
                            ₹{item.results_breakdown.pat.current.toLocaleString('en-IN')}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] tabular-numbers font-medium">
                            <span className={item.results_breakdown.pat.delta_qoq_pct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}>
                              QoQ: {item.results_breakdown.pat.delta_qoq_pct >= 0 ? '+' : ''}{item.results_breakdown.pat.delta_qoq_pct}%
                            </span>
                            <span className={item.results_breakdown.pat.delta_yoy_pct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}>
                              YoY: {item.results_breakdown.pat.delta_yoy_pct >= 0 ? '+' : ''}{item.results_breakdown.pat.delta_yoy_pct}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-[#86868b] space-y-0.5 pt-1">
                        <div>{item.results_breakdown.ebitda_margin_formula || `EBITDA Margin = EBITDA / Revenue = ${item.results_breakdown.ebitda_margin_pct}%`}</div>
                        <div>{item.results_breakdown.pat_margin_formula || `PAT Margin = PAT / Revenue = ${item.results_breakdown.pat_margin_pct}%`}</div>
                      </div>

                      <p className="text-[11px] text-[#86868b] leading-relaxed pt-2 border-t border-white/[0.06]">
                        <span className="text-white font-medium">Analysis:</span> {item.results_breakdown.key_takeaway}
                      </p>
                    </div>
                  )}

                  {/* ENRICHMENT 2: Executive Pedigree */}
                  {hasBio && (
                    <div className="mt-3 p-3.5 rounded-xl bg-black/50 border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Executive Appointment</span>
                        <span className="text-[10px] text-[#86868b] uppercase tracking-wide">
                          {item.executive_bio.role}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-[#a1a1a6]">
                        <div className="font-medium text-white">
                          {item.executive_bio.name} • <span className="text-[#86868b]">Ex-{item.executive_bio.previous_firm}</span>
                        </div>
                        <p className="text-[12px] leading-relaxed text-[#86868b]">
                          {item.executive_bio.career_summary}
                        </p>
                        <div className="p-2 rounded-lg bg-[#141417] text-[11px] text-[#d1d1d6] border border-white/[0.04]">
                          <span className="text-white font-medium">Strategic Implications:</span> {item.executive_bio.strategic_implication}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                    <button
                      onClick={() => onSelectSymbol(item.symbol)}
                      className="text-white hover:text-[#2997ff] font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Open Terminal</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => toggleSaved(item.id)} aria-label={isSaved(item.id) ? 'Remove saved story' : 'Save story'} className={`flex items-center gap-1 text-[11px] transition-colors ${isSaved(item.id) ? 'text-[#ffcc00]' : 'text-[#86868b] hover:text-white'}`}>
                        <Bookmark className="w-3 h-3" fill={isSaved(item.id) ? 'currentColor' : 'none'} /> {isSaved(item.id) ? 'Saved' : 'Save'}
                      </button>
                      <button type="button" onClick={() => shareStory(item)} className="text-[#86868b] hover:text-white flex items-center gap-1 text-[11px] transition-colors">
                        {copiedStoryId === item.id ? <Check className="w-3 h-3 text-[#30d158]" /> : <Share2 className="w-3 h-3" />} {copiedStoryId === item.id ? 'Copied' : 'Share'}
                      </button>
                      {item.source_url && (
                        <a href={item.source_url} target="_blank" rel="noreferrer" className="text-[#86868b] hover:text-white flex items-center gap-1 text-[11px] transition-colors">
                          <span>Filing PDF</span><ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        ))}
      </div>

      {/* Routine Paperwork Collapsed Section */}
      {digest?.routine_announcements && digest.routine_announcements.length > 0 && !highSignalOnly && (
        <div className="apple-card rounded-2xl p-3.5">
          <button
            onClick={() => setShowRoutine(!showRoutine)}
            className="w-full flex items-center justify-between text-xs font-medium text-[#86868b] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Routine Disclosures ({digest.routine_announcements.length} Collapsed)</span>
            </div>
            {showRoutine ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showRoutine && (
            <div className="mt-3 space-y-2 pt-2 border-t border-white/[0.06]">
              {digest.routine_announcements.map((routine) => (
                <div key={routine.id} className="p-2 rounded-lg bg-black/40 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-white">{routine.company_name}</span>
                    <span className="text-[10px] text-[#515156]">{routine.timestamp}</span>
                  </div>
                  <div className="text-[11px] text-[#86868b]">{routine.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
