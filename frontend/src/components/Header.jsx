import React from 'react';
import { Bell, Sliders, ShieldCheck, Search, Activity } from 'lucide-react';

export default function Header({ 
  alertCount, 
  onOpenSettings, 
  onOpenSearch, 
  activeTab,
  selectedSymbol,
  portfolio = [] 
}) {
  const currentItem = portfolio.find(p => p.symbol === selectedSymbol);

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-xl border-b border-gray-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Brand & Market Status */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center font-black text-black text-sm tracking-wider shadow-lg shadow-emerald-500/20">
              F
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#090d16]"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white">FINN</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI Agent
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>NSE / BSE • Primary Intelligence</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 text-gray-300 transition-colors"
            title="Search any NSE stock"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Triggered Alerts Badge */}
          <button
            onClick={onOpenSettings}
            className="relative p-2 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 text-gray-300 transition-colors"
            title="Configure Alert Thresholds"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] text-[10px] font-bold bg-amber-500 text-black rounded-full flex items-center justify-center ring-2 ring-[#090d16]">
                {alertCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
