import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function Header({ 
  alertCount, 
  onOpenSettings, 
  onOpenSearch
}) {
  return (
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-2xl border-b border-white/[0.06] px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Apple-style minimalist brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
            <span className="text-[13px] font-semibold text-white tracking-wider">F</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-white">FINN</span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[#86868b] border border-white/[0.08]">
                Enam Research
              </span>
            </div>
          </div>
        </div>

        {/* Minimalist Controls */}
        <div className="flex items-center gap-2">
          {/* Market Status indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-[#86868b]" title="Grounded in audited Q2 FY25 regulatory filings & EOD snapshot">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]"></span>
            <span className="font-medium text-[#86868b]">Q2 FY25 Audit</span>
          </div>

          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[#86868b] hover:text-white transition-all flex items-center justify-center active:scale-95"
            title="Search Tickers"
            aria-label="Search Tickers"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Alerts Filter / Settings */}
          <button
            onClick={onOpenSettings}
            className="relative w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[#86868b] hover:text-white transition-all flex items-center justify-center active:scale-95"
            title="Filter Thresholds"
            aria-label="Filter Thresholds"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold bg-[#ff9f0a] text-black rounded-full flex items-center justify-center shadow-sm">
                {alertCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
