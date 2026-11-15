import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Quote, 
  FileSpreadsheet
} from 'lucide-react';
import { AuditSkeleton } from './Skeletons';

export default function NarrativeAuditView({ 
  analysis, 
  selectedSymbol, 
  onSelectSymbol, 
  portfolio = [],
  isLoading = false 
}) {
  if (isLoading || !analysis) {
    return <AuditSkeleton />;
  }

  // Honest refusal state for unindexed tickers
  if (analysis.provenance_status === 'market_data_only' || !analysis.narrative_audit) {
    return (
      <div className="space-y-4 pb-24 smooth-fade-in">
        {/* Ticker Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {portfolio.map((stock) => {
            const isSelected = selectedSymbol === stock.symbol;
            return (
              <button
                key={stock.symbol}
                onClick={() => onSelectSymbol(stock.symbol)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-[#1c1c1e] text-[#86868b] hover:text-white'
                }`}
              >
                {stock.symbol.replace('.NS', '')}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl bg-[#1c1c1e] border border-white/[0.08] p-6 space-y-3">
          <div className="text-xs uppercase tracking-wider text-[#86868b] font-mono">
            {analysis.symbol} • Narrative vs Numbers Audit
          </div>
          <h2 className="text-lg font-semibold text-white">
            Primary Transcripts Not Yet Indexed
          </h2>
          <p className="text-sm text-[#a1a1a6] leading-relaxed">
            Earnings concall transcripts and quarterly investor presentation audits are currently indexed for FINN benchmark holdings: <span className="text-white font-semibold">ZOMATO.NS</span>, <span className="text-white font-semibold">TATAMOTORS.NS</span>, and <span className="text-white font-semibold">RELIANCE.NS</span>.
          </p>
          <div className="p-3.5 rounded-xl bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 text-xs text-[#ff9f0a] leading-relaxed">
            FINN strictly enforces a zero-fabrication standard: management guidance promises, delivery verdicts, and credibility scores are never synthetically simulated without audited concall filings.
          </div>
        </div>
      </div>
    );
  }

  const audit = analysis.narrative_audit;

  const getVerdictStyle = (verdict) => {
    if (verdict.includes('Delivered') || verdict.includes('Exceeded')) {
      return {
        pill: 'text-[#30d158] bg-[#30d158]/10 border border-[#30d158]/20',
        icon: CheckCircle2,
      };
    } else if (verdict.includes('Missed') || verdict.includes('Squeeze')) {
      return {
        pill: 'text-[#ff453a] bg-[#ff453a]/10 border border-[#ff453a]/20',
        icon: AlertTriangle,
      };
    } else if (verdict.includes('Postponed') || verdict.includes('Deferred')) {
      return {
        pill: 'text-[#ff9f0a] bg-[#ff9f0a]/10 border border-[#ff9f0a]/20',
        icon: Clock,
      };
    }
    return {
      pill: 'text-white/80 bg-white/[0.08] border border-white/[0.12]',
      icon: Clock,
    };
  };

  return (
    <div className="space-y-4 pb-24 smooth-fade-in">
      
      {/* Ticker Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {portfolio.map((stock) => {
          const isSelected = selectedSymbol === stock.symbol;
          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectSymbol(stock.symbol)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all active:scale-95 ${
                isSelected
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'bg-[#1c1c1e] text-[#86868b] hover:text-white'
              }`}
            >
              {stock.symbol.replace('.NS', '')}
            </button>
          );
        })}
      </div>

      {/* Audit Banner with Credibility Score */}
      <div className="apple-card rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
              Forensic Audit • 4 Quarters
            </span>
            <h1 className="text-[20px] font-semibold text-white tracking-tight leading-tight">
              Narrative vs. Numbers: {analysis.company_name}
            </h1>
            <p className="text-xs text-[#a1a1a6] mt-1 leading-relaxed">
              {audit.summary}
            </p>
          </div>

          {/* Apple Health style Credibility Metric */}
          <div className="text-center p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] flex-shrink-0">
            <div className="text-[10px] uppercase font-semibold text-[#86868b]">Credibility</div>
            <div className="text-[24px] font-bold text-white tabular-numbers mt-0.5">
              {audit.credibility_score}
              <span className="text-xs text-[#515156] font-normal">/100</span>
            </div>
            <div className="text-[10px] font-medium text-[#30d158] mt-0.5">Verified</div>
          </div>
        </div>

        {/* Identified Divergences */}
        {audit.key_divergences_identified?.length > 0 && (
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs space-y-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ff9f0a]" />
              Identified Narrative Divergences
            </span>
            <ul className="text-[#a1a1a6] space-y-1.5 text-[12px] leading-relaxed">
              {audit.key_divergences_identified.map((div, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#ff9f0a] font-bold">•</span>
                  <span>{div}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 4 Quarters Audited Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
            Quarterly Breakdown (Concalls vs. Filings)
          </span>
          <span className="text-[11px] text-[#515156]">Primary Evidence</span>
        </div>

        {audit.quarters_audited.map((item, index) => {
          const vStyle = getVerdictStyle(item.verdict);
          const Icon = vStyle.icon;

          return (
            <div 
              key={index} 
              className="apple-card rounded-2xl p-4 space-y-3.5"
            >
              {/* Header: Quarter + Verdict Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-mono text-white px-2 py-0.5 rounded bg-white/[0.08]">
                  {item.quarter}
                </span>

                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${vStyle.pill}`}>
                  <Icon className="w-3 h-3" />
                  {item.verdict}
                </span>
              </div>

              {/* Concall Narrative */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] space-y-1">
                <div className="text-[10px] uppercase font-semibold text-[#86868b] flex items-center gap-1">
                  <Quote className="w-3 h-3" />
                  Concall Guidance (Narrative)
                </div>
                <div className="text-[13px] font-medium text-white">
                  "{item.management_guidance_claim}"
                </div>
                <p className="text-[11px] text-[#86868b] italic">
                  Citation: "{item.source_concall_quote}"
                </p>
              </div>

              {/* Reported Numbers */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] space-y-1">
                <div className="text-[10px] uppercase font-semibold text-[#86868b] flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3" />
                  Reported In Regulatory Filing (Numbers)
                </div>
                <div className="text-[13px] font-medium text-white">
                  {item.actual_reported_delivery}
                </div>
                <div className="text-[10px] text-[#515156] font-mono">
                  Source: {item.actual_filing_source}
                </div>
              </div>

              {/* Analysis */}
              <div className="pt-2 border-t border-white/[0.06] text-xs text-[#a1a1a6] leading-relaxed">
                <span className="font-semibold text-white">Institutional Analysis: </span>
                <span>{item.divergence_analysis}</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
