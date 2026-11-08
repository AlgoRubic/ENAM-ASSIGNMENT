import React, { useState } from 'react';
import { Search, X, TrendingUp, Sparkles, Building2, ChevronRight } from 'lucide-react';

export default function CompanySearchModal({ 
  isOpen, 
  onClose, 
  onSelectSymbol, 
  portfolio = [],
  adHocTickers = [] 
}) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredPortfolio = portfolio.filter(p => 
    p.symbol.toLowerCase().includes(query.toLowerCase()) ||
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.sector?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredAdHoc = adHocTickers.filter(a => 
    a.symbol.toLowerCase().includes(query.toLowerCase()) ||
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    let sym = query.trim().toUpperCase();
    if (!sym.endsWith('.NS') && !sym.endsWith('.BO')) {
      sym = `${sym}.NS`;
    }
    onSelectSymbol(sym);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0d131f] border border-gray-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Search NSE Stocks</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl bg-gray-800 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleCustomSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type any NSE ticker or name (e.g. INFY, HAL, BEL)..."
            autoFocus
            className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {query.trim() && (
            <button
              type="submit"
              className="absolute right-2 top-2 px-3 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400"
            >
              Go
            </button>
          )}
        </form>

        {/* Search Results / Lists */}
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-1">
          
          {/* Ad-Hoc On-Demand Research Set (Outside Portfolio) */}
          {filteredAdHoc.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Ad-Hoc Demo Tickers (Outside Portfolio)</span>
              </div>
              <div className="space-y-1">
                {filteredAdHoc.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => {
                      onSelectSymbol(stock.symbol);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-2xl bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                        {stock.name}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {stock.symbol} • {stock.sector}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Companies */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>Core Portfolio ({filteredPortfolio.length})</span>
            </div>
            <div className="space-y-1">
              {filteredPortfolio.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => {
                    onSelectSymbol(stock.symbol);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-gray-900/60 hover:bg-gray-800 border border-gray-800 flex items-center justify-between group transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                      {stock.name}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {stock.symbol} • {stock.sector}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">
                      ₹{stock.price?.toLocaleString('en-IN')}
                    </div>
                    <div className={`text-[10px] font-bold ${stock.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stock.change_pct >= 0 ? '+' : ''}{stock.change_pct}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
