import React, { useState } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  UserCheck, 
  FileText, 
  Clock, 
  Sliders,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function PushFeed({ 
  digest, 
  alerts = [], 
  windowHours, 
  setWindowHours, 
  highSignalOnly, 
  setHighSignalOnly,
  onSelectSymbol,
  onOpenSettings
}) {
  const [showRoutine, setShowRoutine] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const windows = [
    { label: '24h', value: 24 },
    { label: '48h', value: 48 },
    { label: '7 Days', value: 168 },
    { label: 'All', value: 720 },
  ];

  return (
    <div className="space-y-4 pb-20">
      
      {/* Time Window & Priority Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-3 border border-gray-800/80">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Digest Window:</span>
          </div>

          <button
            onClick={() => setHighSignalOnly(!highSignalOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors ${
              highSignalOnly 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-gray-800/80 text-gray-400 border border-gray-700/60'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>High Signal Only</span>
          </button>
        </div>

        {/* Window Selector Pills */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-xl">
          {windows.map((w) => (
            <button
              key={w.value}
              onClick={() => setWindowHours(w.value)}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                windowHours === w.value
                  ? 'bg-emerald-500 text-black shadow-sm font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Triggered Unusual Move Alerts (EOD Volume > 2x / Price > ±3%) */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Triggered EOD Alerts ({alerts.length})
              </h2>
            </div>
            <button
              onClick={onOpenSettings}
              className="text-[11px] text-gray-400 hover:text-gray-200 flex items-center gap-1 underline underline-offset-2"
            >
              <Sliders className="w-3 h-3" />
              Adjust Thresholds
            </button>
          </div>

          <div className="space-y-2">
            {alerts.map((alert) => {
              const isPositive = alert.price_change_pct >= 0;
              return (
                <div 
                  key={alert.id}
                  onClick={() => onSelectSymbol(alert.symbol)}
                  className="cursor-pointer glass-panel rounded-2xl p-3.5 border-l-4 border-l-amber-500 border-gray-800/80 hover:border-amber-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {alert.company_name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700/60">
                          {alert.symbol}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="font-bold text-white">₹{alert.current_price?.toLocaleString('en-IN')}</span>
                        <span className={`inline-flex items-center text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}{alert.price_change_pct}%
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-amber-400 font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                          {alert.volume_multiplier}x 20D Vol
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-gray-300 leading-relaxed">
                    {alert.reasoning}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Corporate Announcements Feed (Surfacing High-Signal Filings First) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Material Filings & Signals ({digest?.high_signal_announcements?.length || 0})
            </h2>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">
            Prioritized by Conviction
          </span>
        </div>

        {digest?.high_signal_announcements?.map((item) => {
          const isExpanded = expandedCard === item.id;
          const hasBreakdown = !!item.results_breakdown;
          const hasBio = !!item.executive_bio;

          return (
            <div 
              key={item.id}
              className="glass-panel rounded-2xl p-4 border border-gray-800/80 hover:border-gray-700/80 transition-all space-y-3"
            >
              {/* Card Header: Category Chip + Ticker + Timestamp */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    item.category === 'results' 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : item.category === 'management_change'
                      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      : item.category === 'M&A'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      : item.category === 'litigation'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  }`}>
                    {item.category.replace('_', ' ')}
                  </span>
                  <button 
                    onClick={() => onSelectSymbol(item.symbol)}
                    className="text-xs font-bold text-white hover:text-emerald-400 transition-colors"
                  >
                    {item.company_name}
                  </button>
                </div>
                <span className="text-[11px] text-gray-500">{item.timestamp}</span>
              </div>

              {/* Title & Core One-Liner */}
              <div>
                <h3 className="text-sm font-semibold text-gray-100 leading-snug">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-gray-300 leading-relaxed font-medium">
                  {item.summary_one_liner}
                </p>
              </div>

              {/* SPECIAL ENRICHMENT 1: Quarterly Results QoQ & YoY Delta Grid */}
              {hasBreakdown && (
                <div className="mt-3 p-3 rounded-xl bg-gray-900/90 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Results First-Cut ({item.results_breakdown.period})
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      Unit: {item.results_breakdown.unit}
                    </span>
                  </div>

                  {/* 4 Quadrants: Revenue, EBITDA, PBT, PAT */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Revenue */}
                    <div className="p-2 rounded-lg bg-black/40 border border-gray-800">
                      <div className="text-[10px] text-gray-400 font-medium">Revenue</div>
                      <div className="text-sm font-bold text-white">
                        ₹{item.results_breakdown.revenue.current.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span className={item.results_breakdown.revenue.delta_qoq_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          QoQ: {item.results_breakdown.revenue.delta_qoq_pct >= 0 ? '+' : ''}{item.results_breakdown.revenue.delta_qoq_pct}%
                        </span>
                        <span className={item.results_breakdown.revenue.delta_yoy_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          YoY: {item.results_breakdown.revenue.delta_yoy_pct >= 0 ? '+' : ''}{item.results_breakdown.revenue.delta_yoy_pct}%
                        </span>
                      </div>
                    </div>

                    {/* EBITDA */}
                    <div className="p-2 rounded-lg bg-black/40 border border-gray-800">
                      <div className="text-[10px] text-gray-400 font-medium">EBITDA ({item.results_breakdown.ebitda_margin_pct}%)</div>
                      <div className="text-sm font-bold text-white">
                        ₹{item.results_breakdown.ebitda.current.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span className={item.results_breakdown.ebitda.delta_qoq_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          QoQ: {item.results_breakdown.ebitda.delta_qoq_pct >= 0 ? '+' : ''}{item.results_breakdown.ebitda.delta_qoq_pct}%
                        </span>
                        <span className={item.results_breakdown.ebitda.delta_yoy_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          YoY: {item.results_breakdown.ebitda.delta_yoy_pct >= 0 ? '+' : ''}{item.results_breakdown.ebitda.delta_yoy_pct}%
                        </span>
                      </div>
                    </div>

                    {/* PBT */}
                    <div className="p-2 rounded-lg bg-black/40 border border-gray-800">
                      <div className="text-[10px] text-gray-400 font-medium">PBT</div>
                      <div className="text-sm font-bold text-white">
                        ₹{item.results_breakdown.pbt.current.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span className={item.results_breakdown.pbt.delta_qoq_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          QoQ: {item.results_breakdown.pbt.delta_qoq_pct >= 0 ? '+' : ''}{item.results_breakdown.pbt.delta_qoq_pct}%
                        </span>
                        <span className={item.results_breakdown.pbt.delta_yoy_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          YoY: {item.results_breakdown.pbt.delta_yoy_pct >= 0 ? '+' : ''}{item.results_breakdown.pbt.delta_yoy_pct}%
                        </span>
                      </div>
                    </div>

                    {/* PAT */}
                    <div className="p-2 rounded-lg bg-black/40 border border-gray-800">
                      <div className="text-[10px] text-gray-400 font-medium">PAT (Net Profit)</div>
                      <div className="text-sm font-bold text-emerald-400">
                        ₹{item.results_breakdown.pat.current.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span className={item.results_breakdown.pat.delta_qoq_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          QoQ: {item.results_breakdown.pat.delta_qoq_pct >= 0 ? '+' : ''}{item.results_breakdown.pat.delta_qoq_pct}%
                        </span>
                        <span className={item.results_breakdown.pat.delta_yoy_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          YoY: {item.results_breakdown.pat.delta_yoy_pct >= 0 ? '+' : ''}{item.results_breakdown.pat.delta_yoy_pct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-300 font-normal italic pt-1 border-t border-gray-800/80">
                    💡 {item.results_breakdown.key_takeaway}
                  </p>
                </div>
              )}

              {/* SPECIAL ENRICHMENT 2: Management Change Executive Bio & Context */}
              {hasBio && (
                <div className="mt-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      Incoming Leadership Background
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200 font-semibold uppercase">
                      {item.executive_bio.role}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-gray-300">
                    <div className="font-semibold text-white">
                      {item.executive_bio.name} • <span className="text-gray-400 font-normal">Ex-{item.executive_bio.previous_firm} ({item.executive_bio.previous_role})</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-gray-300">
                      {item.executive_bio.career_summary}
                    </p>
                    <div className="p-2 rounded bg-black/40 text-[11px] text-indigo-200 border border-indigo-500/20">
                      🎯 <span className="font-medium">Strategic Impact:</span> {item.executive_bio.strategic_implication}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Actions: BSE Filing Link & Research Deep Dive */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-xs">
                <button
                  onClick={() => onSelectSymbol(item.symbol)}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Pull Fundamentals</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>

                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-gray-200 flex items-center gap-1 text-[11px] transition-colors"
                  >
                    <span>Primary Filing (PDF)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Routine Filings Collapsible Drawer (Burying the noise cleanly) */}
      {digest?.routine_announcements && digest.routine_announcements.length > 0 && !highSignalOnly && (
        <div className="glass-panel rounded-2xl p-3 border border-gray-800/60">
          <button
            onClick={() => setShowRoutine(!showRoutine)}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span>Routine Disclosures & Filings ({digest.routine_announcements.length} Collapsed)</span>
            </div>
            {showRoutine ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showRoutine && (
            <div className="mt-3 space-y-2 pt-2 border-t border-gray-800/60">
              {digest.routine_announcements.map((routine) => (
                <div key={routine.id} className="p-2.5 rounded-xl bg-black/30 text-xs text-gray-400 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-300">{routine.company_name}</span>
                    <span className="text-[10px] text-gray-500">{routine.timestamp}</span>
                  </div>
                  <div className="text-gray-300 text-xs">{routine.title}</div>
                  <div className="text-[11px] text-gray-500 italic">{routine.summary_one_liner}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
