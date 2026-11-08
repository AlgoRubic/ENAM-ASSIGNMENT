import React, { useState } from 'react';
import { 
  Building2, 
  PieChart, 
  TrendingUp, 
  Scale, 
  Coins, 
  Target, 
  Compass, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { TerminalSkeleton } from './Skeletons';

export default function PullTerminal({ 
  analysis, 
  selectedSymbol, 
  onSelectSymbol, 
  portfolio = [],
  onOpenAuditTab,
  isLoading = false 
}) {
  const [activeModule, setActiveModule] = useState('business');

  if (isLoading || !analysis) {
    return <TerminalSkeleton />;
  }

  const modules = [
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'financials', label: 'Financials', icon: PieChart },
    { id: 'trajectory', label: 'Trajectory', icon: TrendingUp },
    { id: 'balance_sheet', label: 'Balance Sheet', icon: Scale },
    { id: 'cash_quality', label: 'Cash Quality', icon: Coins },
    { id: 'guidance', label: 'Guidance', icon: Target },
    { id: 'bull_bear', label: 'Thesis', icon: Compass },
  ];

  const isPositive = analysis.day_change_pct >= 0;

  return (
    <div className="space-y-4 pb-24 smooth-fade-in">
      
      {/* Horizontal Ticker Switcher */}
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

      {/* Apple Stocks Style Hero Header */}
      <div className="apple-card rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-white tracking-tight leading-tight">
              {analysis.company_name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#86868b]">
              <span className="font-mono text-white/90">{analysis.symbol}</span>
              <span>•</span>
              <span>{analysis.sector}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[24px] font-bold text-white tabular-numbers tracking-tight">
              ₹{analysis.last_price?.toLocaleString('en-IN')}
            </div>
            <div className={`text-xs font-semibold tabular-numbers inline-flex items-center px-2 py-0.5 rounded-full ${
              isPositive ? 'bg-[#30d158]/10 text-[#30d158]' : 'bg-[#ff453a]/10 text-[#ff453a]'
            }`}>
              {isPositive ? '+' : ''}{analysis.day_change_pct}%
            </div>
          </div>
        </div>

        {/* Primary Source Discipline Stamp */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-[11px] text-[#86868b]">
          <div className="flex items-center gap-1.5 text-white/90 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#30d158]" />
            <span>Primary Sources: Audited Annual Report + Concall Transcripts</span>
          </div>
          <span className="text-[#515156] font-mono">Zero Broker Slop</span>
        </div>
      </div>

      {/* Narrative vs Numbers Audit Featured Callout */}
      <div 
        onClick={onOpenAuditTab}
        className="cursor-pointer apple-card rounded-2xl p-4 hover:border-white/20 transition-all flex items-center justify-between group active:scale-[0.99]"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.08] text-[#86868b]">
              Feature Highlight
            </span>
            <span className="text-xs font-semibold text-white">
              Narrative vs. Numbers Audit
            </span>
          </div>
          <p className="text-xs text-[#a1a1a6] leading-relaxed">
            Credibility Score: <span className="font-bold text-white">{analysis.narrative_audit?.credibility_score}/100</span>. 
            Audited 4 quarters of management promises vs delivered results.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-[#86868b] group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {modules.map((m) => {
          const Icon = m.icon;
          const isActive = activeModule === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'bg-[#1c1c1e] text-[#86868b] hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Module Content Panels */}
      <div className="apple-card rounded-2xl p-4 space-y-4">
        
        {/* 1. BUSINESS SNAPSHOT */}
        {activeModule === 'business' && (
          <div className="space-y-4 smooth-fade-in">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868b] mb-1.5">
                Business Overview
              </h3>
              <p className="text-[13px] text-[#f5f5f7] leading-relaxed">
                {analysis.business_snapshot.core_description}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868b] mb-2.5">
                Segment Contribution & Growth
              </h3>
              <div className="space-y-2.5">
                {analysis.business_snapshot.segments.map((seg, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                    <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                      <span className="text-white">{seg.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#86868b] tabular-numbers">{seg.share_pct}% mix</span>
                        <span className={`text-[11px] font-semibold tabular-numbers ${
                          seg.growth_pct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'
                        }`}>
                          ({seg.growth_pct >= 0 ? '+' : ''}{seg.growth_pct}% YoY)
                        </span>
                      </div>
                    </div>
                    {/* Apple Screen-Time style proportional bar */}
                    <div className="w-full h-1.5 bg-[#2c2c2e] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/80 rounded-full" 
                        style={{ width: `${Math.min(seg.share_pct, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Citation Box */}
            {analysis.business_snapshot.primary_citations?.[0] && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] text-[#86868b] space-y-1">
                <div className="font-semibold text-white/90">
                  Primary Source: {analysis.business_snapshot.primary_citations[0].doc_type}
                </div>
                <div className="italic text-[#a1a1a6]">
                  "{analysis.business_snapshot.primary_citations[0].exact_quote}"
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. FINANCIAL SNAPSHOT */}
        {activeModule === 'financials' && (
          <div className="space-y-4 smooth-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                Headline Figures ({analysis.financial_snapshot.period})
              </h3>
              <span className="text-[11px] text-[#515156]">Unit: ₹ Cr</span>
            </div>

            {/* Apple Key Statistics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b] font-medium">Revenue</div>
                <div className="text-[16px] font-semibold text-white tabular-numbers mt-0.5">
                  ₹{analysis.financial_snapshot.revenue_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b] font-medium">
                  EBITDA ({analysis.financial_snapshot.ebitda_margin}%)
                </div>
                <div className="text-[16px] font-semibold text-white tabular-numbers mt-0.5">
                  ₹{analysis.financial_snapshot.ebitda_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b] font-medium">PAT (Net Profit)</div>
                <div className="text-[16px] font-semibold text-[#30d158] tabular-numbers mt-0.5">
                  ₹{analysis.financial_snapshot.pat_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b] font-medium">Return on Equity</div>
                <div className="text-[16px] font-semibold text-white tabular-numbers mt-0.5">
                  {analysis.financial_snapshot.roe}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b] font-medium">ROCE</div>
                <div className="text-[16px] font-semibold text-white tabular-numbers mt-0.5">
                  {analysis.financial_snapshot.roce}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b] font-medium">Market Cap</div>
                <div className="text-[16px] font-semibold text-white tabular-numbers mt-0.5">
                  ₹{analysis.financial_snapshot.market_cap_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>
            </div>

            {analysis.financial_snapshot.primary_citations?.[0] && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] text-[#86868b] space-y-1">
                <div className="font-semibold text-white/90">
                  Primary Source: {analysis.financial_snapshot.primary_citations[0].doc_type}
                </div>
                <div className="italic text-[#a1a1a6]">
                  "{analysis.financial_snapshot.primary_citations[0].exact_quote}"
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. TRAJECTORY */}
        {activeModule === 'trajectory' && (
          <div className="space-y-4 smooth-fade-in">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868b] mb-2">
                Multi-Year Trajectory
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                  <div className="text-[10px] uppercase text-[#86868b]">3-Year Revenue CAGR</div>
                  <div className="text-[16px] font-semibold text-white tabular-numbers mt-0.5">
                    +{analysis.trajectory.multi_year_cagr_revenue}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                  <div className="text-[10px] uppercase text-[#86868b]">Margin Direction</div>
                  <div className="text-[16px] font-semibold text-white mt-0.5">
                    {analysis.trajectory.margin_trend}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] space-y-1">
                <div className="font-semibold text-white mb-1">
                  Growing Segments
                </div>
                <ul className="text-[#a1a1a6] space-y-1">
                  {analysis.trajectory.growing_segments.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] space-y-1">
                <div className="font-semibold text-white mb-1">
                  Compressing / Margin Drag Areas
                </div>
                <ul className="text-[#a1a1a6] space-y-1">
                  {analysis.trajectory.compressing_segments.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff9f0a]"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 4. BALANCE SHEET & LEVERAGE */}
        {activeModule === 'balance_sheet' && (
          <div className="space-y-4 smooth-fade-in">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
              Capital Structure & Liquidity
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b]">Debt to Equity (D/E)</div>
                <div className="text-[16px] font-semibold text-white tabular-numbers mt-0.5">
                  {analysis.balance_sheet.debt_to_equity}x
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b]">Working Capital Days</div>
                <div className="text-[16px] font-semibold text-white tabular-numbers mt-0.5">
                  {analysis.balance_sheet.working_capital_days} Days
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b]">Total Borrowings</div>
                <div className="text-[16px] font-semibold text-white tabular-numbers mt-0.5">
                  ₹{analysis.balance_sheet.total_debt_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b]">Cash War Chest</div>
                <div className="text-[16px] font-semibold text-[#30d158] tabular-numbers mt-0.5">
                  ₹{analysis.balance_sheet.cash_and_equiv_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs space-y-1">
              <div className="font-semibold text-white">
                Solvency & Risk Assessment
              </div>
              <p className="text-[#a1a1a6] leading-relaxed">
                {analysis.balance_sheet.risk_assessment}
              </p>
              <div className="pt-2 text-[11px] text-[#86868b]">
                Promoter Pledging: <span className="text-white font-medium">{analysis.balance_sheet.pledged_promoter_pct}%</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. CASH QUALITY & CONVERSION */}
        {activeModule === 'cash_quality' && (
          <div className="space-y-4 smooth-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                Cash Flow vs Accounting Profit
              </h3>
              {analysis.cash_quality.divergence_flag ? (
                <span className="text-[11px] text-[#ff453a] font-medium">
                  ⚠️ Divergence Flagged
                </span>
              ) : (
                <span className="text-[11px] text-[#30d158] font-medium">
                  ✓ High Cash Quality
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b]">Operating Cash Flow (CFO)</div>
                <div className="text-[16px] font-semibold text-white tabular-numbers mt-0.5">
                  ₹{analysis.cash_quality.cfo_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b]">Cash Conversion (CFO/PAT)</div>
                <div className="text-[16px] font-semibold text-[#30d158] tabular-numbers mt-0.5">
                  {analysis.cash_quality.cash_conversion_ratio}x
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b]">Free Cash Flow (FCF)</div>
                <div className="text-[16px] font-semibold text-white tabular-numbers mt-0.5">
                  ₹{analysis.cash_quality.fcf_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b]">Capital Expenditure</div>
                <div className="text-[16px] font-semibold text-white tabular-numbers mt-0.5">
                  ₹{analysis.cash_quality.capital_expenditure_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>
            </div>

            <p className="text-xs text-[#a1a1a6] leading-relaxed p-3.5 rounded-xl bg-black/40 border border-white/[0.04]">
              {analysis.cash_quality.commentary}
            </p>
          </div>
        )}

        {/* 6. GUIDANCE TRACKER */}
        {activeModule === 'guidance' && (
          <div className="space-y-4 smooth-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                Forward Guidance ({analysis.guidance.fy_target})
              </h3>
              <span className="text-[11px] text-[#ff9f0a] font-medium bg-[#ff9f0a]/10 px-2 py-0.5 rounded-full">
                Tone: {analysis.guidance.management_tone}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b] font-medium">Revenue Guidance</div>
                <div className="text-xs font-medium text-white mt-1">
                  {analysis.guidance.revenue_guidance}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b] font-medium">Margin Guidance</div>
                <div className="text-xs font-medium text-white mt-1">
                  {analysis.guidance.margin_guidance}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase text-[#86868b] font-medium">Capex Commitments</div>
                <div className="text-xs font-medium text-white mt-1">
                  {analysis.guidance.capex_guidance}
                </div>
              </div>
            </div>

            {analysis.guidance.primary_citations?.[0] && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] text-[#86868b] space-y-1">
                <div className="font-semibold text-white/90">
                  Concall Transcript Audio Citation: {analysis.guidance.primary_citations[0].doc_type}
                </div>
                <div className="italic text-[#a1a1a6]">
                  "{analysis.guidance.primary_citations[0].exact_quote}"
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. BULL VS BEAR CASE */}
        {activeModule === 'bull_bear' && (
          <div className="space-y-4 smooth-fade-in">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
              Primary Grounded Thesis
            </h3>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
              <div className="text-xs font-semibold text-[#30d158]">
                The Bull Case (Catalysts)
              </div>
              <ul className="text-xs text-[#d1d1d6] space-y-1.5 list-disc list-inside">
                {analysis.bull_bear.bull_points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
              <div className="text-xs font-semibold text-[#ff453a]">
                The Bear Case (Risks)
              </div>
              <ul className="text-xs text-[#d1d1d6] space-y-1.5 list-disc list-inside">
                {analysis.bull_bear.bear_points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs">
              <span className="font-semibold text-white">Critical Swing Factor: </span>
              <span className="text-[#a1a1a6]">{analysis.bull_bear.critical_swing_factor}</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
