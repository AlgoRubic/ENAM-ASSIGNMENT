import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  SlidersHorizontal,
  FileText,
  Calendar,
  Zap
} from 'lucide-react';
import { FeedSkeleton } from './Skeletons';

export default function PushFeed({ 
  digest, 
  alerts = [], 
  windowHours, 
  setWindowHours, 
  highSignalOnly, 
  setHighSignalOnly,
  onSelectSymbol,
  onOpenSettings,
  isLoading = false
}) {
  const [showRoutine, setShowRoutine] = useState(false);
  const [alertFilter, setAlertFilter] = useState('all'); // 'all' | 'market' | 'filings'
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  if (isLoading || !digest) {
    return <FeedSkeleton />;
  }

  const windows = [
    { label: '24h', value: 24, description: 'Today' },
    { label: '48h', value: 48, description: '2 Days' },
    { label: '7D', value: 168, description: 'Weekly Review' },
    { label: 'All', value: 720, description: 'Full History' },
  ];

  const getTimelineSummary = () => {
    const totalEvents = digest?.high_signal_announcements?.length || 0;
    const totalAlerts = alerts?.length || 0;
    if (windowHours <= 24) {
      return {
        title: "Today's Intraday & Overnight Feed",
        sub: `${totalAlerts} triggered alerts • ${totalEvents} material exchange filings.`
      };
    } else if (windowHours <= 48) {
      return {
        title: "Trailing 48-Hour Digest",
        sub: `${totalAlerts} triggered alerts • ${totalEvents} disclosures including yesterday's close.`
      };
    } else if (windowHours <= 168) {
      return {
        title: "Weekly Portfolio Review (7 Days)",
        sub: `${totalAlerts} triggered alerts • ${totalEvents} material corporate actions across the portfolio.`
      };
    }
    return {
      title: "Cumulative Corporate Timeline",
      sub: `Full archive: ${totalAlerts} threshold alerts • ${totalEvents} verified disclosures.`
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

  // Group announcements by Date Group
  const groupedAnnouncements = (digest?.high_signal_announcements || []).reduce((acc, item) => {
    const group = item.dateGroup || (item.timestamp?.includes('hour') ? 'Today' : item.timestamp?.includes('Yesterday') ? 'Yesterday' : 'Earlier this Week');
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
          {windows.map((w) => (
            <button
              key={w.value}
              onClick={() => setWindowHours(w.value)}
              className={`flex-1 py-1 text-xs transition-all rounded-lg ${
                windowHours === w.value
                  ? 'bg-[#2c2c2e] text-white font-semibold shadow-sm'
                  : 'text-[#86868b] hover:text-[#d1d1d6] font-medium'
              }`}
            >
              {w.label}
            </button>
          ))}
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
                        <div className="mt-1 flex items-center gap-2 text-xs">
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
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[11px] text-[#86868b] font-medium">
                          {alert.title}
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

      {/* Corporate Filings Feed (Chronologically Grouped) */}
      <div className="space-y-4 pt-2">
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
                          <div className="text-[10px] uppercase text-[#86868b] font-medium">PAT (Net Profit)</div>
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

                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#86868b] hover:text-white flex items-center gap-1 text-[11px] transition-colors"
                      >
                        <span>Filing PDF</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
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
