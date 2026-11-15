import React, { useState, useEffect } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';

export default function CompanySearchModal({ 
  isOpen, 
  onClose, 
  onSelectSymbol, 
  portfolio = [],
  adHocTickers = [] 
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
        className="w-full max-w-md bg-[#161618] border border-white/[0.1] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between">
          <h2 id="search-modal-title" className="text-base font-semibold text-white">Search Stocks</h2>
          <button 
            onClick={onClose}
            aria-label="Close search"
            className="w-8 h-8 rounded-full bg-white/[0.08] text-[#86868b] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Apple Spotlight Search Bar */}
        <form onSubmit={handleCustomSubmit} className="relative">
          <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, ticker or sector (e.g. TCS, BEL)..."
            autoFocus
            className="w-full bg-[#242426] border border-transparent focus:border-white/20 rounded-xl pl-10 pr-16 py-3 text-sm text-white placeholder-[#86868b] focus:outline-none transition-colors"
          />
          {query.trim() && (
            <button
              type="submit"
              className="absolute right-2 top-2 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold"
            >
              Open
            </button>
          )}
        </form>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-1">
          
          {/* Ad-Hoc Demo Tickers */}
          {filteredAdHoc.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b] px-1">
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
                    className="w-full text-left p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {stock.name}
                      </div>
                      <div className="text-xs text-[#86868b] mt-0.5">
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
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b] px-1">
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
                  className="w-full text-left p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-between transition-colors group"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {stock.name}
                    </div>
                    <div className="text-xs text-[#86868b] mt-0.5">
                      {stock.symbol} • {stock.sector}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    {stock.price && (
                      <span className="text-xs font-mono font-medium text-white">
                        ₹{stock.price.toLocaleString('en-IN')}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#515156] group-hover:text-white transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {filteredPortfolio.length === 0 && filteredAdHoc.length === 0 && (
            <div className="text-center py-8 text-xs text-[#86868b]">
              No direct matches found. Press &ldquo;Open&rdquo; or Enter to query NSE ticker &ldquo;{query.toUpperCase()}&rdquo; dynamically.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
