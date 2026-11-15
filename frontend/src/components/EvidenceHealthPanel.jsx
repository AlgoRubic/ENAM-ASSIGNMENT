import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  X
} from 'lucide-react';

function getStatusBadgeStyle(status) {
  if (status === 'green') {
    return {
      dot: 'bg-[#30d158]',
      pill: 'text-[#30d158] bg-[#30d158]/10 border border-[#30d158]/25',
      label: 'VERIFIED',
    };
  }
  if (status === 'red') {
    return {
      dot: 'bg-[#ff453a]',
      pill: 'text-[#ff453a] bg-[#ff453a]/10 border border-[#ff453a]/25',
      label: 'BLOCKED',
    };
  }
  return {
    dot: 'bg-[#ff9f0a]',
    pill: 'text-[#ff9f0a] bg-[#ff9f0a]/10 border border-[#ff9f0a]/25',
    label: 'AMBER SCOPE',
  };
}

export default function EvidenceHealthPanel({
  auditSummary,
  isLoading = false,
  onRefresh,
  onSelectSymbol,
  onClose,
  defaultExpanded = true,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [openMetricId, setOpenMetricId] = useState('submission_blockers');

  if (isLoading && !auditSummary) {
    return (
      <div className="apple-card rounded-2xl p-4 border border-white/[0.08] space-y-2 animate-pulse">
        <div className="h-4 w-40 bg-white/[0.08] rounded" />
        <div className="h-3 w-64 bg-white/[0.06] rounded" />
      </div>
    );
  }

  if (!auditSummary || auditSummary.error) {
    return (
      <div
        className="apple-card rounded-2xl p-4 border border-[#ff453a]/30 space-y-2"
        role="region"
        aria-label="Evidence Health Panel"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ff453a]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#ff453a]">
              Evidence Health Unavailable
            </span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs text-[#86868b] hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
        <p className="text-xs text-[#a1a1a6] leading-relaxed">
          {auditSummary?.message || 'Unable to load /api/audit/summary from backend. FINN does not fabricate audit telemetry.'}
        </p>
      </div>
    );
  }

  const overallBadge = getStatusBadgeStyle(auditSummary.overall_status);
  const indexedTickers = auditSummary.indexed_tickers || [];
  const metrics = auditSummary.metrics || [];
  const submissionBlockers = auditSummary.submission_blockers || [];
  const localPdfs = auditSummary.local_pdfs || [];

  const toggleMetric = (id) => {
    setOpenMetricId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      className="apple-card rounded-2xl p-4 border border-white/[0.1] space-y-3.5 smooth-fade-in"
      aria-label="Evidence Health Panel"
    >
      {/* Top Compact Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck
              className={`w-4 h-4 ${
                auditSummary.overall_status === 'green'
                  ? 'text-[#30d158]'
                  : auditSummary.overall_status === 'red'
                  ? 'text-[#ff453a]'
                  : 'text-[#ff9f0a]'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-white">
              Evidence Health & Provenance Audit
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${overallBadge.pill}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${overallBadge.dot}`} />
              {auditSummary.overall_status.toUpperCase()} • {overallBadge.label}
            </span>
          </div>
          <p className="text-[11px] text-[#86868b] leading-relaxed">
            Live telemetry derived from <span className="font-mono text-[#d1d1d6]">/api/audit/summary</span>: primary store, local PDF SHA-256 verifier, formula checks & feed state.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Evidence Health"
              aria-label="Refresh Evidence Health"
              className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white flex items-center justify-center transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-white' : ''}`} />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse Evidence Health metrics' : 'Expand Evidence Health metrics'}
            className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[11px] font-medium text-[#d1d1d6] flex items-center gap-1 transition-colors"
          >
            <span>{isExpanded ? 'Hide' : 'Drill Down'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close Evidence Health panel"
              className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Compact 6-Cell Summary Strip (Always Visible) */}
      <div className="grid grid-cols-3 gap-2">
        {/* 1. Indexed Tickers */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-[#86868b] font-medium">Indexed Tickers</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                auditSummary.indexed_ticker_count >= auditSummary.portfolio_ticker_count
                  ? 'bg-[#30d158]'
                  : 'bg-[#ff9f0a]'
              }`}
            />
          </div>
          <div className="text-[13px] font-semibold text-white tabular-numbers mt-0.5">
            {auditSummary.indexed_ticker_count} / {auditSummary.portfolio_ticker_count}
          </div>
          <div className="text-[10px] text-[#86868b] font-mono truncate mt-0.5">
            {indexedTickers.map((t) => t.replace('.NS', '')).join(', ')}
          </div>
        </div>

        {/* 2. Local PDFs */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-[#86868b] font-medium">Local PDFs</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                auditSummary.local_pdf_count > 0 && auditSummary.provenance_audit_passed
                  ? 'bg-[#30d158]'
                  : 'bg-[#ff453a]'
              }`}
            />
          </div>
          <div className="text-[13px] font-semibold text-white tabular-numbers mt-0.5">
            {auditSummary.local_pdf_count} Verified
          </div>
          <div className="text-[10px] text-[#30d158] font-mono truncate mt-0.5">
            SHA-256 Match
          </div>
        </div>

        {/* 3. Verified Citations */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-[#86868b] font-medium">Citations</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                auditSummary.verified_citation_count === auditSummary.total_citation_count &&
                auditSummary.total_citation_count > 0
                  ? 'bg-[#30d158]'
                  : 'bg-[#ff453a]'
              }`}
            />
          </div>
          <div className="text-[13px] font-semibold text-white tabular-numbers mt-0.5">
            {auditSummary.verified_citation_count} / {auditSummary.total_citation_count}
          </div>
          <div className="text-[10px] text-[#30d158] font-mono truncate mt-0.5">
            Verbatim PDF
          </div>
        </div>

        {/* 4. Formula Audit */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-[#86868b] font-medium">Formula Audit</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                auditSummary.formula_audit_status === 'passed' ? 'bg-[#30d158]' : 'bg-[#ff453a]'
              }`}
            />
          </div>
          <div className="text-[13px] font-semibold text-white uppercase tabular-numbers mt-0.5">
            {auditSummary.formula_audit_status}
          </div>
          <div className="text-[10px] text-[#86868b] font-mono truncate mt-0.5">
            {auditSummary.formula_checks_passed}/{auditSummary.formula_checks_total} Ratios OK
          </div>
        </div>

        {/* 5. Market Data Status / As-Of */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-[#86868b] font-medium">Market Data</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                auditSummary.market_data_status === 'live_eod' ? 'bg-[#30d158]' : 'bg-[#ff9f0a]'
              }`}
            />
          </div>
          <div className="text-[11px] font-mono font-semibold text-white truncate mt-0.5">
            {auditSummary.market_data_status}
          </div>
          <div className="text-[10px] text-[#ff9f0a] font-mono truncate mt-0.5">
            As of {auditSummary.market_as_of_date}
          </div>
        </div>

        {/* 6. Current Feed Mode */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-[#86868b] font-medium">Feed Mode</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                auditSummary.current_feed_mode === 'live_current_window' ? 'bg-[#30d158]' : 'bg-[#ff9f0a]'
              }`}
            />
          </div>
          <div className="text-[11px] font-mono font-semibold text-white truncate mt-0.5">
            {auditSummary.current_feed_mode}
          </div>
          <div className="text-[10px] text-[#86868b] font-mono truncate mt-0.5">
            {auditSummary.as_of_timestamp}
          </div>
        </div>
      </div>

      {/* Quick Indexed Ticker Pills */}
      {indexedTickers.length > 0 && (
        <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
          <span className="text-[11px] text-[#86868b]">
            Indexed Primary Holdings ({auditSummary.indexed_ticker_count}):
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {indexedTickers.map((sym) => (
              <button
                key={sym}
                onClick={() => onSelectSymbol && onSelectSymbol(sym)}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/25 hover:bg-[#30d158]/20 transition-colors"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Drill-Down Metrics List */}
      {isExpanded && (
        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
              Metric Drill-Down ({metrics.length} Verifier Checks)
            </span>
            <span className="text-[10px] font-mono text-[#86868b]">
              Blockers: {submissionBlockers.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {metrics.map((metric) => {
              const badge = getStatusBadgeStyle(metric.status);
              const isOpen = openMetricId === metric.id;

              return (
                <div
                  key={metric.id}
                  className="rounded-xl bg-black/40 border border-white/[0.06] overflow-hidden"
                >
                  <button
                    onClick={() => toggleMetric(metric.id)}
                    aria-expanded={isOpen}
                    className="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${badge.dot}`} />
                        <span className="text-xs font-semibold text-white">
                          {metric.label}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${badge.pill}`}>
                          {metric.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#d1d1d6] mt-0.5 truncate">
                        {metric.value}
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-[#86868b] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-[#86868b] flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/[0.05] space-y-2 text-[11px]">
                      <p className="text-[#a1a1a6] leading-relaxed">{metric.detail}</p>
                      {metric.items && metric.items.length > 0 && (
                        <ul className="space-y-1 text-[#d1d1d6] font-mono text-[10.5px]">
                          {metric.items.map((itemText, idx) => (
                            <li
                              key={idx}
                              className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] break-words leading-relaxed"
                            >
                              {itemText}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Local PDF Direct Download Links */}
          {localPdfs.length > 0 && (
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
                <FileText className="w-3 h-3 text-[#30d158]" />
                <span>Verified Local PDFs ({auditSummary.local_pdf_count})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {localPdfs.map((pdf) => (
                  <span
                    key={pdf.filename}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-[#d1d1d6] border border-white/[0.06]"
                    title={`SHA-256: ${pdf.sha256}`}
                  >
                    {pdf.filename} ({pdf.size_kb} KB)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
