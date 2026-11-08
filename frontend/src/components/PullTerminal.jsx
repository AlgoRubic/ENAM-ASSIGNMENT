import React, { useState } from 'react';
import { 
  Building2, 
  PieChart, 
  TrendingUp, 
  Scale, 
  Coins, 
  Compass, 
  Target, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  FileSearch,
  ExternalLink,
  ChevronRight,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export default function PullTerminal({ 
  analysis, 
  selectedSymbol, 
  onSelectSymbol, 
  portfolio = [],
  onOpenAuditTab 
}) {
  const [activeModule, setActiveModule] = useState('business');
  const [showCitationModal, setShowCitationModal] = useState(null);

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Grounding analysis in primary reports & concalls...</p>
      </div>
    );
  }

  const modules = [
    { id: 'business', label: '1. Business', icon: Building2 },
    { id: 'financials', label: '2. Financials', icon: PieChart },
    { id: 'trajectory', label: '3. Trajectory', icon: TrendingUp },
    { id: 'balance_sheet', label: '4. Balance Sheet', icon: Scale },
    { id: 'cash_quality', label: '5. Cash Quality', icon: Coins },
    { id: 'guidance', label: '6. Guidance', icon: Target },
    { id: 'bull_bear', label: '7. Bull vs Bear', icon: Compass },
  ];

  return (
    <div className="space-y-4 pb-24">
      
      {/* Quick Ticker Switcher Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {portfolio.map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => onSelectSymbol(stock.symbol)}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedSymbol === stock.symbol
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'bg-gray-800/80 text-gray-400 hover:text-white border border-gray-700/60'
            }`}
          >
            {stock.symbol.replace('.NS', '')}
          </button>
        ))}
      </div>

      {/* Terminal Hero Header: Live Price, Sector & Trajectory */}
      <div className="glass-panel rounded-2xl p-4 border border-gray-800/80 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                {analysis.company_name}
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700/60">
                NSE: {analysis.symbol}
              </span>
            </div>
            <div className="text-xs text-gray-400 font-medium mt-0.5">
              Sector: {analysis.sector}
            </div>
          </div>

          <div className="text-right">
            <div className="text-base font-black text-white">
              ₹{analysis.last_price?.toLocaleString('en-IN')}
            </div>
            <div className={`text-xs font-bold ${analysis.day_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {analysis.day_change_pct >= 0 ? '+' : ''}{analysis.day_change_pct}% Today
            </div>
          </div>
        </div>

        {/* Primary Source Discipline Stamp */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Primary Sources: FY24 Annual Report + Q2 FY25 Concall</span>
          </div>
          <span className="text-gray-500 font-mono">Zero Broker Slop</span>
        </div>
      </div>

      {/* Narrative vs Numbers Audit Highlight Banner */}
      <div 
        onClick={onOpenAuditTab}
        className="cursor-pointer glass-panel rounded-2xl p-3.5 border-l-4 border-l-cyan-500 border-gray-800/80 hover:border-cyan-500/50 transition-all flex items-center justify-between group"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Module 8 • Core Highlight
            </span>
            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
              Narrative vs. Numbers Audit
            </span>
          </div>
          <p className="text-xs text-gray-300">
            Credibility Score: <span className="font-bold text-cyan-400">{analysis.narrative_audit?.credibility_score}/100</span>. 
            Audited 4 quarters of concall guidance vs actual results delivery.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
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
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500 text-black shadow-md font-bold'
                  : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 border border-gray-700/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Module Content Panels */}
      <div className="glass-panel rounded-2xl p-4 border border-gray-800/80 space-y-4">
        
        {/* 1. BUSINESS SNAPSHOT */}
        {activeModule === 'business' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
                Core Operations & Model
              </h3>
              <p className="text-xs text-gray-200 leading-relaxed">
                {analysis.business_snapshot.core_description}
              </p>
            </div>

            {/* Segment Breakdown & Revenue Mix */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Segment Contribution & YoY Growth
              </h3>
              <div className="space-y-2.5">
                {analysis.business_snapshot.segments.map((seg, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-gray-800">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-white">{seg.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{seg.share_pct}% Mix</span>
                        <span className={`text-[11px] font-bold ${seg.growth_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({seg.growth_pct >= 0 ? '+' : ''}{seg.growth_pct}% YoY)
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" 
                        style={{ width: `${Math.min(seg.share_pct, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Citation Box */}
            {analysis.business_snapshot.primary_citations?.[0] && (
              <div className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-[11px] text-gray-400 space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <FileSearch className="w-3 h-3" />
                  Primary Citation: {analysis.business_snapshot.primary_citations[0].doc_type}
                </div>
                <div className="italic">
                  "{analysis.business_snapshot.primary_citations[0].exact_quote}"
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. FINANCIAL SNAPSHOT */}
        {activeModule === 'financials' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Headline Financial Metrics ({analysis.financial_snapshot.period})
              </h3>
              <span className="text-[11px] text-gray-400 font-mono">Unit: ₹ Cr</span>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400 font-medium">Revenue (TTM)</div>
                <div className="text-base font-bold text-white mt-0.5">
                  ₹{analysis.financial_snapshot.revenue_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400 font-medium">EBITDA ({analysis.financial_snapshot.ebitda_margin}%)</div>
                <div className="text-base font-bold text-white mt-0.5">
                  ₹{analysis.financial_snapshot.ebitda_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400 font-medium">PAT (Net Profit)</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  ₹{analysis.financial_snapshot.pat_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400 font-medium">Return on Equity (ROE)</div>
                <div className="text-base font-bold text-teal-300 mt-0.5">
                  {analysis.financial_snapshot.roe}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400 font-medium">ROCE</div>
                <div className="text-base font-bold text-teal-300 mt-0.5">
                  {analysis.financial_snapshot.roce}%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400 font-medium">Market Cap</div>
                <div className="text-base font-bold text-white mt-0.5">
                  ₹{analysis.financial_snapshot.market_cap_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>
            </div>

            {/* Citation */}
            {analysis.financial_snapshot.primary_citations?.[0] && (
              <div className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-[11px] text-gray-400 space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <FileSearch className="w-3 h-3" />
                  Primary Filing: {analysis.financial_snapshot.primary_citations[0].doc_type}
                </div>
                <div className="italic">
                  "{analysis.financial_snapshot.primary_citations[0].exact_quote}"
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. TRAJECTORY */}
        {activeModule === 'trajectory' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                Multi-Year Growth & Direction
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                  <div className="text-[10px] text-gray-400">Revenue CAGR (3-Yr)</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    +{analysis.trajectory.multi_year_cagr_revenue}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                  <div className="text-[10px] text-gray-400">Margin Trajectory</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {analysis.trajectory.margin_trend}
                  </div>
                </div>
              </div>
            </div>

            {/* Growing vs Compressing Segments */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Accelerating Segments
                </div>
                <ul className="list-disc list-inside text-gray-300 space-y-0.5">
                  {analysis.trajectory.growing_segments.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20">
                <div className="font-bold text-rose-400 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Compressing / Margin Drag Areas
                </div>
                <ul className="list-disc list-inside text-gray-300 space-y-0.5">
                  {analysis.trajectory.compressing_segments.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 4. BALANCE SHEET & LEVERAGE */}
        {activeModule === 'balance_sheet' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Capital Structure & Liquidity
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400">Debt to Equity (D/E)</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {analysis.balance_sheet.debt_to_equity}x
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400">Working Capital Cycle</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {analysis.balance_sheet.working_capital_days} Days
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400">Total Borrowings</div>
                <div className="text-base font-bold text-white mt-0.5">
                  ₹{analysis.balance_sheet.total_debt_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400">Cash War Chest</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  ₹{analysis.balance_sheet.cash_and_equiv_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs">
              <div className="font-bold text-indigo-300 mb-1">
                🛡️ Solvency Assessment
              </div>
              <p className="text-gray-300 leading-relaxed">
                {analysis.balance_sheet.risk_assessment}
              </p>
              <div className="mt-2 text-[11px] text-gray-400">
                Promoter Pledging: <span className="font-bold text-white">{analysis.balance_sheet.pledged_promoter_pct}%</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. CASH QUALITY & CONVERSION */}
        {activeModule === 'cash_quality' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Cash Flow vs Accounting Profit
              </h3>
              {analysis.cash_quality.divergence_flag ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  ⚠️ Divergence Detected
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  ✓ High Cash Quality
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400">Operating Cash Flow (CFO)</div>
                <div className="text-base font-bold text-white mt-0.5">
                  ₹{analysis.cash_quality.cfo_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400">Cash Conversion Ratio (CFO/PAT)</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {analysis.cash_quality.cash_conversion_ratio}x
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400">Free Cash Flow (FCF)</div>
                <div className="text-base font-bold text-teal-300 mt-0.5">
                  ₹{analysis.cash_quality.fcf_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400">Capital Expenditure</div>
                <div className="text-base font-bold text-white mt-0.5">
                  ₹{analysis.cash_quality.capital_expenditure_cr?.toLocaleString('en-IN')} Cr
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed p-3 rounded-xl bg-black/40 border border-gray-800">
              {analysis.cash_quality.commentary}
            </p>
          </div>
        )}

        {/* 6. GUIDANCE TRACKER */}
        {activeModule === 'guidance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Explicit Forward Targets ({analysis.guidance.fy_target})
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Tone: {analysis.guidance.management_tone}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400 font-medium">Top-Line Revenue Target</div>
                <div className="text-xs font-semibold text-white mt-1">
                  {analysis.guidance.revenue_guidance}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400 font-medium">Operating Margin Target</div>
                <div className="text-xs font-semibold text-emerald-400 mt-1">
                  {analysis.guidance.margin_guidance}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                <div className="text-[10px] text-gray-400 font-medium">Capex Commitment</div>
                <div className="text-xs font-semibold text-white mt-1">
                  {analysis.guidance.capex_guidance}
                </div>
              </div>
            </div>

            {analysis.guidance.primary_citations?.[0] && (
              <div className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-[11px] text-gray-400 space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <FileSearch className="w-3 h-3" />
                  Concall Transcript Audio Citation: {analysis.guidance.primary_citations[0].doc_type}
                </div>
                <div className="italic">
                  "{analysis.guidance.primary_citations[0].exact_quote}"
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. BULL VS BEAR CASE */}
        {activeModule === 'bull_bear' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Primary Grounded Thesis
            </h3>

            {/* Bull Points */}
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>The Bull Case (Primary Catalysts)</span>
              </div>
              <ul className="text-xs text-gray-200 space-y-1.5 list-disc list-inside">
                {analysis.bull_bear.bull_points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* Bear Points */}
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
              <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>The Bear Case (Primary Risks)</span>
              </div>
              <ul className="text-xs text-gray-200 space-y-1.5 list-disc list-inside">
                {analysis.bull_bear.bear_points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* Critical Swing Factor */}
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs">
              <span className="font-bold text-amber-300">🎯 Critical Swing Factor:</span>
              <p className="text-gray-200 mt-1 leading-relaxed">
                {analysis.bull_bear.critical_swing_factor}
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
