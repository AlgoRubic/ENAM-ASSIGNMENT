"""
Fundamentals Engine for FINN:
Enforces strict primary data integrity.
- Verified primary-source analysis for indexed companies (Zomato, Tata Motors, Reliance).
- Honest 'market_data_only' state for other valid NSE tickers (no hallucinated guidance or audits).
- Explicit 404 for invalid/unknown tickers. Never invents financial facts.
"""
import logging
from typing import Dict, Any, Optional
import yfinance as yf

from app.models.schemas import (
    CompanyPullAnalysis,
    BusinessSnapshot,
    FinancialSnapshot,
    Trajectory,
    BalanceSheetHealth,
    CashQuality,
    NarrativeVsNumbersAudit,
    AuditItem,
    GuidanceTracker,
    BullBearCase,
    WhatChangedCard,
    EvidenceDrawerItem,
    PrimarySourceCitation
)
from app.data.verified_primary_store import VERIFIED_PRIMARY_STORE
from app.services.market_data import fetch_ticker_eod, sanitize_ticker

logger = logging.getLogger(__name__)


class TickerNotFoundError(Exception):
    """Raised when a ticker cannot be resolved on NSE/BSE exchanges."""
    pass


def get_company_analysis(symbol: str) -> CompanyPullAnalysis:
    """
    Returns primary-grounded financial analysis with strict data provenance.
    Raises TickerNotFoundError (HTTP 404) if symbol is invalid.
    """
    sym = sanitize_ticker(symbol)

    # 1. Check if symbol is in the verified primary store
    if sym in VERIFIED_PRIMARY_STORE:
        raw = VERIFIED_PRIMARY_STORE[sym]
        eod = fetch_ticker_eod(sym)

        # Build Primary Citations
        biz_cits = [PrimarySourceCitation(**c) for c in raw["business_snapshot"]["primary_citations"]]
        biz = BusinessSnapshot(
            core_description=raw["business_snapshot"]["core_description"],
            segments=raw["business_snapshot"]["segments"],
            revenue_mix=raw["business_snapshot"]["revenue_mix"],
            primary_citations=biz_cits
        )

        fin_cits = [PrimarySourceCitation(**c) for c in raw["financial_snapshot"]["primary_citations"]]
        fin = FinancialSnapshot(
            period=raw["financial_snapshot"]["period"],
            revenue_cr=raw["financial_snapshot"]["revenue_cr"],
            ebitda_cr=raw["financial_snapshot"]["ebitda_cr"],
            pat_cr=raw["financial_snapshot"]["pat_cr"],
            ebitda_margin=raw["financial_snapshot"]["ebitda_margin"],
            pat_margin=raw["financial_snapshot"]["pat_margin"],
            roce=raw["financial_snapshot"]["roce"],
            roe=raw["financial_snapshot"]["roe"],
            pe_ratio=raw["financial_snapshot"].get("pe_ratio"),
            market_cap_cr=raw["financial_snapshot"]["market_cap_cr"],
            primary_citations=fin_cits
        )

        traj_cits = [PrimarySourceCitation(**c) for c in raw["trajectory"]["primary_citations"]]
        traj = Trajectory(
            multi_year_cagr_revenue=raw["trajectory"]["multi_year_cagr_revenue"],
            multi_year_cagr_pat=raw["trajectory"]["multi_year_cagr_pat"],
            margin_trend=raw["trajectory"]["margin_trend"],
            growing_segments=raw["trajectory"]["growing_segments"],
            compressing_segments=raw["trajectory"]["compressing_segments"],
            primary_citations=traj_cits
        )

        bal_cits = [PrimarySourceCitation(**c) for c in raw["balance_sheet"]["primary_citations"]]
        bal = BalanceSheetHealth(
            total_debt_cr=raw["balance_sheet"]["total_debt_cr"],
            cash_and_equiv_cr=raw["balance_sheet"]["cash_and_equiv_cr"],
            debt_to_equity=raw["balance_sheet"]["debt_to_equity"],
            working_capital_days=raw["balance_sheet"]["working_capital_days"],
            contingent_liabilities_cr=raw["balance_sheet"]["contingent_liabilities_cr"],
            pledged_promoter_pct=raw["balance_sheet"]["pledged_promoter_pct"],
            risk_assessment=raw["balance_sheet"]["risk_assessment"],
            primary_citations=bal_cits
        )

        cash_cits = [PrimarySourceCitation(**c) for c in raw["cash_quality"]["primary_citations"]]
        cash = CashQuality(
            cfo_cr=raw["cash_quality"]["cfo_cr"],
            pat_cr=raw["cash_quality"]["pat_cr"],
            cash_conversion_ratio=raw["cash_quality"]["cash_conversion_ratio"],
            fcf_cr=raw["cash_quality"]["fcf_cr"],
            capital_expenditure_cr=raw["cash_quality"]["capital_expenditure_cr"],
            divergence_flag=raw["cash_quality"]["divergence_flag"],
            commentary=raw["cash_quality"]["commentary"],
            primary_citations=cash_cits
        )

        audits = []
        for a in raw["narrative_audit"]["quarters_audited"]:
            ev = EvidenceDrawerItem(**a["evidence"]) if "evidence" in a and a["evidence"] else None
            audits.append(AuditItem(
                quarter=a["quarter"],
                reporting_date=a["reporting_date"],
                management_guidance_claim=a["management_guidance_claim"],
                source_concall_quote=a["source_concall_quote"],
                actual_reported_delivery=a["actual_reported_delivery"],
                actual_filing_source=a["actual_filing_source"],
                verdict=a["verdict"],
                divergence_analysis=a["divergence_analysis"],
                evidence=ev
            ))

        narrative = NarrativeVsNumbersAudit(
            summary=raw["narrative_audit"]["summary"],
            credibility_score=raw["narrative_audit"]["credibility_score"],
            quarters_audited=audits,
            key_divergences_identified=raw["narrative_audit"]["key_divergences_identified"]
        )

        guid_cits = [PrimarySourceCitation(**c) for c in raw["guidance"]["primary_citations"]]
        guid = GuidanceTracker(
            fy_target=raw["guidance"]["fy_target"],
            revenue_guidance=raw["guidance"]["revenue_guidance"],
            margin_guidance=raw["guidance"]["margin_guidance"],
            capex_guidance=raw["guidance"]["capex_guidance"],
            management_tone=raw["guidance"]["management_tone"],
            primary_citations=guid_cits
        )

        bull_bear = BullBearCase(
            bull_points=raw["bull_bear"]["bull_points"],
            bear_points=raw["bull_bear"]["bear_points"],
            critical_swing_factor=raw["bull_bear"]["critical_swing_factor"],
            grounded_in_docs=raw["bull_bear"]["grounded_in_docs"]
        )

        what_changed = None
        if "what_changed" in raw:
            wc = raw["what_changed"]
            ev_wc = EvidenceDrawerItem(**wc["evidence"])
            what_changed = WhatChangedCard(
                event_title=wc["event_title"],
                what_changed=wc["what_changed"],
                prior_guidance_contradicted=wc["prior_guidance_contradicted"],
                investor_impact=wc["investor_impact"],
                confidence_level=wc["confidence_level"],
                filing_date=wc["filing_date"],
                evidence=ev_wc
            )

        return CompanyPullAnalysis(
            symbol=sym,
            company_name=raw["name"],
            sector=raw["sector"],
            provenance_status=raw["provenance_status"],
            provenance_note=raw["provenance_note"],
            data_source=raw["data_source"],
            last_price=eod["price"],
            day_change_pct=eod["change_pct"],
            volume=eod.get("volume"),
            volume_multiplier=eod.get("volume_multiplier"),
            market_cap_cr=fin.market_cap_cr,
            pe_ratio=fin.pe_ratio,
            what_changed=what_changed,
            business_snapshot=biz,
            financial_snapshot=fin,
            trajectory=traj,
            balance_sheet=bal,
            cash_quality=cash,
            narrative_audit=narrative,
            guidance=guid,
            bull_bear=bull_bear
        )

    # 2. Check if it is a genuine listed stock on Yahoo Finance
    eod = fetch_ticker_eod(sym)
    if not eod.get("valid", False):
        # Symbol is completely invalid / unrecognized
        raise TickerNotFoundError(f"Symbol '{sym}' could not be resolved on the National Stock Exchange of India (NSE).")

    # If it is a real listed ticker without indexed documents:
    # RETURN HONEST MARKET DATA ONLY. NEVER INVENT FINANCIAL STATEMENTS.
    company_name = sym.replace(".NS", "").replace(".BO", "")
    try:
        t = yf.Ticker(sym)
        info = t.info or {}
        if not info or info.get("regularMarketPrice") is None:
            raise TickerNotFoundError(f"Symbol '{sym}' not found on NSE.")
        company_name = info.get("shortName") or info.get("longName") or company_name
        sector = info.get("sector", "NSE Listed Equities")
        mcap = round((info.get("marketCap", 0) or 0) / 1e7, 2)
        pe = round(info.get("trailingPE", 0) or 0, 2) if info.get("trailingPE") else None
    except TickerNotFoundError:
        raise
    except Exception:
        sector = "NSE Listed Equities"
        mcap = None
        pe = None

    return CompanyPullAnalysis(
        symbol=sym,
        company_name=company_name,
        sector=sector,
        provenance_status="market_data_only",
        provenance_note=(
            f"Live market price & volume data is tracked via NSE. "
            f"However, verified primary documents (Annual Reports and Concall Transcripts) have not been ingested "
            f"into FINN's pipeline for this ticker. FINN strictly refuses to hallucinate corporate guidance, "
            f"narrative audits, or financial projections."
        ),
        data_source="live_exchange_feed",
        last_price=eod["price"],
        day_change_pct=eod["change_pct"],
        volume=eod.get("volume"),
        volume_multiplier=eod.get("volume_multiplier"),
        market_cap_cr=mcap,
        pe_ratio=pe,
        what_changed=None,
        business_snapshot=None,
        financial_snapshot=None,
        trajectory=None,
        balance_sheet=None,
        cash_quality=None,
        narrative_audit=None,
        guidance=None,
        bull_bear=None
    )


# Alias for backward compatibility
build_dynamic_pull_analysis = get_company_analysis

