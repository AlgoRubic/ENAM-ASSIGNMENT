import React from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Quote, 
  FileSpreadsheet, 
  ShieldCheck, 
  ArrowUpRight 
} from 'lucide-react';

export default function NarrativeAuditView({ analysis, selectedSymbol, onSelectSymbol, portfolio = [] }) {
  if (!analysis || !analysis.narrative_audit) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>Loading Narrative vs Numbers Audit...</p>
      </div>
    );
  }

  const audit = analysis.narrative_audit;

  const getVerdictStyle = (verdict) => {
    if (verdict.includes('Delivered') || verdict.includes('Exceeded')) {
      return {
        bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        icon: CheckCircle2,
      };
    } else if (verdict.includes('Missed') || verdict.includes('Squeeze')) {
      return {
        bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
        icon: AlertTriangle,
      };
    } else if (verdict.includes('Postponed') || verdict.includes('Deferred')) {
      return {
        bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        icon: Clock,
      };
    }
    return {
      bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
      icon: Clock,
    };
  };

  return (
    <div className="space-y-4 pb-24">
      
      {/* Ticker Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {portfolio.map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => onSelectSymbol(stock.symbol)}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedSymbol === stock.symbol
                ? 'bg-cyan-500 text-black shadow-md font-bold'
                : 'bg-gray-800/80 text-gray-400 hover:text-white border border-gray-700/60'
            }`}
          >
            {stock.symbol.replace('.NS', '')}
          </button>
        ))}
      </div>

      {/* Audit Banner with Credibility Score */}
      <div className="glass-panel rounded-2xl p-4 border border-cyan-500/30 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Core ENAM Signal
              </span>
              <span className="text-xs text-gray-400">4-Quarter Analysis</span>
            </div>
            <h1 className="text-base font-bold text-white mt-1">
              Narrative vs. Numbers: {analysis.company_name}
            </h1>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              {audit.summary}
            </p>
          </div>

          {/* Credibility Gauge */}
          <div className="text-center p-3 rounded-2xl bg-black/50 border border-cyan-500/30 flex-shrink-0">
            <div className="text-[10px] font-bold uppercase text-gray-400">Credibility</div>
            <div className="text-2xl font-black text-cyan-400 mt-0.5">
              {audit.credibility_score}
              <span className="text-xs text-gray-500 font-normal">/100</span>
            </div>
            <div className="text-[9px] font-semibold text-emerald-400">High Trust</div>
          </div>
        </div>

        {/* Key Divergences Highlight */}
        {audit.key_divergences_identified?.length > 0 && (
          <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800 text-xs space-y-1.5">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Identified Guidance Divergences & Adjustments:
            </span>
            <ul className="list-disc list-inside text-gray-300 space-y-1 text-[11px] leading-relaxed">
              {audit.key_divergences_identified.map((div, idx) => (
                <li key={idx}>{div}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 4 Quarters Audited Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            Quarterly Promise vs. Delivery Breakdown
          </h2>
          <span className="text-[11px] text-gray-500">Concalls vs. Filings</span>
        </div>

        {audit.quarters_audited.map((item, index) => {
          const vStyle = getVerdictStyle(item.verdict);
          const Icon = vStyle.icon;

          return (
            <div 
              key={index} 
              className="glass-panel rounded-2xl p-4 border border-gray-800 space-y-3 relative overflow-hidden"
            >
              {/* Top Row: Quarter + Verdict Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black font-mono text-white px-2 py-0.5 rounded bg-gray-800 border border-gray-700">
                  {item.quarter}
                </span>

                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${vStyle.bg}`}>
                  <Icon className="w-3 h-3" />
                  {item.verdict}
                </span>
              </div>

              {/* What Management Promised (Concall) */}
              <div className="p-3 rounded-xl bg-black/40 border border-gray-800/90 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Quote className="w-3 h-3" />
                  The Concall Narrative (Guidance Promised)
                </div>
                <div className="text-xs font-semibold text-white">
                  "{item.management_guidance_claim}"
                </div>
                <p className="text-[11px] text-gray-400 italic">
                  Exact Citation: "{item.source_concall_quote}"
                </p>
              </div>

              {/* What Was Actually Reported in Exchange Results */}
              <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/90 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3" />
                  The Regulatory Numbers (Delivery In Filing)
                </div>
                <div className="text-xs font-semibold text-white">
                  {item.actual_reported_delivery}
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  Audited Primary Source: {item.actual_filing_source}
                </div>
              </div>

              {/* Divergence & Institutional Analysis */}
              <div className="pt-2 border-t border-gray-800/80 text-xs text-gray-300">
                <span className="font-semibold text-white">Analysis: </span>
                <span>{item.divergence_analysis}</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
