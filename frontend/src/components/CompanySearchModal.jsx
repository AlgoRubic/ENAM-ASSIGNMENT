import React, { useState } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#161618] border border-white/[0.1] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Search Stocks</h2>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.08] text-[#86868b] hover:text-white flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Apple Spotlight Search Bar */}
        <form onSubmit={handleCustomSubmit} className="relative">
          <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, ticker or sector (e.g. TCS, BEL)..."
            autoFocus
            className="w-full bg-[#242426] border border-transparent focus:border-white/20 rounded-xl pl-10 pr-12 py-2.5 text-xs text-white placeholder-[#86868b] focus:outline-none transition-colors"
          />
          {query.trim() && (
            <button
              type="submit"
              className="absolute right-2 top-1.5 px-2.5 py-1 rounded-lg bg-white text-black text-[11px] font-semibold"
            >
              Open
            </button>
          )}
        </form>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-1">
          
          {/* Ad-Hoc Demo Tickers */}
          {filteredAdHoc.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] px-1">
                Ad-Hoc Demo Companies (Outside Portfolio)
              </span>
              <div className="space-y-1">
                {filteredAdHoc.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => {
                      onSelectSymbol(stock.symbol);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {stock.name}
                      </div>
                      <div className="text-[11px] text-[#86868b]">
                        {stock.symbol} • {stock.sector}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#515156] group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Companies */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] px-1">
              Portfolio Holdings ({filteredPortfolio.length})
            </span>
            <div className="space-y-1">
              {filteredPortfolio.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => {
                    onSelectSymbol(stock.symbol);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] flex items-center justify-between transition-colors group"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {stock.name}
                    </div>
                    <div className="text-[11px] text-[#86868b]">
                      {stock.symbol} • {stock.sector}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-white tabular-numbers">
                      ₹{stock.price?.toLocaleString('en-IN')}
                    </div>
                    <div className={`text-[10px] font-semibold tabular-numbers ${
                      stock.change_pct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'
                    }`}>
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
