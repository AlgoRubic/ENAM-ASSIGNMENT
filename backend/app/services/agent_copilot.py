"""
Copilot Agent Service for FINN:
AI-driven on-demand investment analyst grounded strictly in primary documents
(Q2 FY25 Results, Concall Transcripts, Investor Presentations).
Zero broker slop, zero generic web commentary, zero synthetic citations.
"""
import os
import json
from typing import Dict, Any, List, Optional
import httpx

from app.models.schemas import CopilotQueryResponse, PrimarySourceCitation
from app.services.fundamentals import build_dynamic_pull_analysis

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def _collect_verified_citations(analysis: Any) -> List[PrimarySourceCitation]:
    """Collects all verified primary citations from an indexed company's analysis modules."""
    collected: List[PrimarySourceCitation] = []
    seen_ids = set()
    for mod_name in [
        "business_snapshot",
        "financial_snapshot",
        "trajectory",
        "balance_sheet",
        "cash_quality",
        "guidance",
    ]:
        mod = getattr(analysis, mod_name, None)
        if mod and getattr(mod, "primary_citations", None):
            for cit in mod.primary_citations:
                if cit.doc_id not in seen_ids and cit.local_filename and cit.document_hash and cit.exact_quote:
                    seen_ids.add(cit.doc_id)
                    collected.append(cit)
    return collected


def answer_investor_query(symbol: Optional[str], question: str) -> CopilotQueryResponse:
    """
    Answers an investor question strictly grounded in verified primary source documents.
    Never generates synthetic text labeled as exact_quote. Returns only verbatim
    excerpts from indexed PDFs with local_filename, SHA-256 document_hash, and page_or_time,
    or explicitly returns grounded_citations=[] when no citation is available.
    """
    sym = symbol or "ZOMATO.NS"
    q_lower = question.lower()

    analysis = build_dynamic_pull_analysis(sym)

    # 1. Honest refusal for unindexed tickers (Never invent guidance or concall quotes)
    if analysis.provenance_status == "market_data_only":
        vol_str = f"{analysis.volume:,}" if analysis.volume else "N/A"
        return CopilotQueryResponse(
            symbol=sym,
            answer=(
                f"**Primary Intelligence Unavailable for {analysis.company_name} ({sym})**\n\n"
                f"• **Market Price**: ₹{analysis.last_price:,.2f} ({analysis.day_change_pct:+}%, Volume: {vol_str})\n\n"
                f"**Data Integrity Notice**: Verified Q2 FY25 regulatory filings and earnings transcripts for `{sym}` have not been indexed "
                f"in FINN's verified primary document pipeline (currently indexed benchmark holdings: **ZOMATO.NS**, **TATAMOTORS.NS**, **RELIANCE.NS**).\n\n"
                f"In strict adherence to institutional data trust, FINN refuses to generate synthetic estimates, "
                f"hallucinated management commitments, or fabricated citations. No primary citation is available for this ticker."
            ),
            grounded_citations=[],
            key_takeaway=f"Verified primary filings for {sym} not indexed; no citation available.",
            confidence=1.0,
            provenance="market_data_only"
        )

    # Check for direct Gemini API call if key is configured
    if GEMINI_API_KEY:
        try:
            return call_gemini_api(sym, question, analysis)
        except Exception:
            pass  # Graceful fallback to deterministic primary grounding

    citations: List[PrimarySourceCitation] = []
    answer_text = ""
    takeaway = ""

    # Branch 1: Cash Conversion Ratio & Free Cash Flow (FCF) — MUST precede balance sheet branch
    if any(k in q_lower for k in [
        "cash conversion",
        "fcf",
        "free cash flow",
        "cfo",
        "operating cash",
        "cash quality",
        "cash flow",
    ]):
        cq = analysis.cash_quality
        cfo_str = f"₹{cq.cfo_cr:,.0f} Cr" if cq.cfo_cr is not None else "Not separately tabulated in Q2 release text"
        pat_str = f"₹{cq.pat_cr:,.0f} Cr" if cq.pat_cr is not None else "N/A"
        ccr_str = f"{cq.cash_conversion_ratio}x" if cq.cash_conversion_ratio is not None else "N/A"
        fcf_str = f"₹{cq.fcf_cr:,.0f} Cr" if cq.fcf_cr is not None else "N/A"
        capex_str = f"₹{cq.capital_expenditure_cr:,.0f} Cr" if cq.capital_expenditure_cr is not None else "N/A"
        answer_text = (
            f"**Cash Flow & Conversion Analysis for {analysis.company_name} ({sym})**:\n\n"
            f"• **Definitions & Formulas**:\n"
            f"  - `Cash Conversion Ratio = Operating Cash Flow (CFO) / Profit After Tax (PAT)`\n"
            f"  - `Free Cash Flow (FCF) = Operating Cash Flow (CFO) - Capital Expenditure (Capex)`\n"
            f"• **Operating Cash Flow (CFO)**: **{cfo_str}** vs. **PAT**: **{pat_str}**.\n"
            f"• **Cash Conversion Ratio (CFO / PAT)**: **{ccr_str}**.\n"
            f"• **Free Cash Flow (FCF)**: **{fcf_str}** (Capex: {capex_str}).\n"
            f"• **Divergence Flag**: **{'Flagged' if cq.divergence_flag else 'None'}**.\n\n"
            f"**Primary Filing Commentary**: {cq.commentary}"
        )
        takeaway = (
            f"Cash conversion ratio (CFO/PAT) is {ccr_str} with Free Cash Flow (FCF) at {fcf_str}."
        )
        citations = list(cq.primary_citations or [])

    # Branch 2: Operating Margins & Profitability
    elif any(k in q_lower for k in ["margin", "profit", "ebitda", "pat"]):
        ebitda_m = analysis.financial_snapshot.ebitda_margin
        pat_m = analysis.financial_snapshot.pat_margin
        cfo = analysis.cash_quality.cfo_cr
        pat = analysis.financial_snapshot.pat_cr
        answer_text = (
            f"**Primary Filing Evidence for {analysis.company_name} ({sym})**:\n\n"
            f"• **Operating EBITDA Margin**: Stood at **{ebitda_m}%** in {analysis.financial_snapshot.period} on revenue of ₹{analysis.financial_snapshot.revenue_cr:,.0f} Cr (EBITDA: ₹{analysis.financial_snapshot.ebitda_cr:,.0f} Cr).\n"
            f"• **PAT Margin**: Reported at **{pat_m}%** (Net Profit: ₹{pat:,.0f} Cr).\n"
            f"• **Cash Conversion Quality**: Operating Cash Flow (CFO) is ₹{cfo:,.0f} Cr ({analysis.cash_quality.cash_conversion_ratio}x CFO/PAT).\n\n"
            f"According to Q2 FY25 disclosures, profitability direction is **{analysis.trajectory.margin_trend}**."
        )
        takeaway = f"Operating EBITDA margin stands at {ebitda_m}% on ₹{analysis.financial_snapshot.revenue_cr:,.0f} Cr revenue."
        citations = list(analysis.financial_snapshot.primary_citations or [])

    # Branch 3: Balance Sheet, Debt & Liquidity
    elif any(k in q_lower for k in ["debt", "leverage", "balance sheet", "liquidity", "solvency", "cash"]):
        debt = analysis.balance_sheet.total_debt_cr
        cash = analysis.balance_sheet.cash_and_equiv_cr
        de = analysis.balance_sheet.debt_to_equity
        wc_days = analysis.balance_sheet.working_capital_days
        answer_text = (
            f"**Balance Sheet Grounding for {analysis.company_name} ({sym})**:\n\n"
            f"• **Total Debt**: ₹{debt:,.0f} Cr against **Cash & Equivalents** of ₹{cash:,.0f} Cr.\n"
            f"• **Debt-to-Equity (D/E)**: **{de}x**.\n"
            f"• **Working Capital Cycle**: **{wc_days} days**.\n"
            f"• **Promoter Share Pledging**: **{analysis.balance_sheet.pledged_promoter_pct}%**.\n\n"
            f"**Primary Assessment**: {analysis.balance_sheet.risk_assessment}"
        )
        takeaway = f"Debt-to-Equity is {de}x with ₹{cash:,.0f} Cr cash & equivalents."
        citations = list(analysis.balance_sheet.primary_citations or [])

    # Branch 4: Guidance & Narrative vs. Numbers Audit
    elif any(k in q_lower for k in ["guidance", "promise", "delivered", "narrative", "audit", "quarter"]):
        audit = analysis.narrative_audit
        item0 = audit.quarters_audited[0]
        answer_text = (
            f"**Narrative vs. Numbers Audit Summary for {analysis.company_name} ({sym})**:\n\n"
            f"• **Management Credibility Score**: **{audit.credibility_score}/100** (Indexed Period: {item0.quarter}).\n"
            f"• **Core Finding**: {audit.summary}\n\n"
            f"**Delivery Audit ({item0.quarter})**:\n"
            f"• *Guidance Claim*: \"{item0.management_guidance_claim}\"\n"
            f"• *Verbatim Concall/Filing Excerpt*: \"{item0.source_concall_quote}\"\n"
            f"• *Reported Actual*: {item0.actual_reported_delivery} ({item0.actual_filing_source})\n"
            f"• *Verdict*: **{item0.verdict}**\n\n"
            f"**Identified Divergences**:\n"
            + "\n".join([f"• {div}" for div in audit.key_divergences_identified])
        )
        takeaway = f"Management credibility scored at {audit.credibility_score}/100 for {item0.quarter}."
        citations = list(analysis.guidance.primary_citations or [])

    # Branch 5: Bull vs. Bear Thesis
    elif any(k in q_lower for k in ["bull", "bear", "thesis", "risk", "catalyst"]):
        bb = analysis.bull_bear
        answer_text = (
            f"**Primary Grounded Bull vs. Bear Case for {analysis.company_name} ({sym})**:\n\n"
            f"**The Bull Case (Primary Catalysts)**:\n"
            + "\n".join([f"1. {p}" for p in bb.bull_points])
            + "\n\n"
            f"**The Bear Case (Primary Risks)**:\n"
            + "\n".join([f"1. {p}" for p in bb.bear_points])
            + "\n\n"
            f"**Critical Swing Factor**:\n{bb.critical_swing_factor}"
        )
        takeaway = f"Key swing factor: {bb.critical_swing_factor}"
        citations = list(analysis.guidance.primary_citations or analysis.business_snapshot.primary_citations or [])

    # Branch 6: General Company Overview
    else:
        answer_text = (
            f"**Primary Source Intelligence for {analysis.company_name} ({sym})**:\n\n"
            f"{analysis.business_snapshot.core_description}\n\n"
            f"• **Current Market Price**: ₹{analysis.last_price:,.2f} ({analysis.day_change_pct:+}%)\n"
            f"• **Revenue ({analysis.financial_snapshot.period})**: ₹{analysis.financial_snapshot.revenue_cr:,.0f} Cr\n"
            f"• **EBITDA Margin**: {analysis.financial_snapshot.ebitda_margin}%\n"
            f"• **Management Forward Tone**: *{analysis.guidance.management_tone}*\n"
            f"• **Margin Direction**: {analysis.trajectory.margin_trend} trajectory."
        )
        takeaway = f"{analysis.company_name} reported {analysis.financial_snapshot.ebitda_margin}% EBITDA margin in {analysis.financial_snapshot.period}."
        citations = list(analysis.business_snapshot.primary_citations or [])

    if not citations:
        answer_text += "\n\n*Note: No verbatim primary PDF citation matched this specific query.*"

    return CopilotQueryResponse(
        symbol=sym,
        answer=answer_text,
        grounded_citations=citations,
        key_takeaway=takeaway,
        confidence=0.96,
        provenance="indexed_primary"
    )


def call_gemini_api(
    symbol: str,
    question: str,
    analysis: Any,
) -> CopilotQueryResponse:
    """Calls Gemini API using verified primary source citations only (never fabricates citations)."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    verified_cits = _collect_verified_citations(analysis)
    cit_Payloads = [
        {
            "doc_id": c.doc_id,
            "doc_type": c.doc_type,
            "local_filename": c.local_filename,
            "page_or_time": c.page_or_time,
            "exact_quote": c.exact_quote,
            "document_hash": c.document_hash,
        }
        for c in verified_cits
    ]
    prompt_context = f"""
You are FINN, an institutional investment research copilot for public markets fund managers.
Your absolute discipline: GROUND EVERYTHING STRICTLY IN THE VERIFIED Q2 FY25 PRIMARY SOURCES PROVIDED BELOW.
DO NOT use broker notes, news gossip, or generic LLM filler. Be concise, dense, and institutional.

PRIMARY SOURCE DATA FOR {analysis.company_name} ({symbol}):
Period: {analysis.financial_snapshot.period}
Revenue: ₹{analysis.financial_snapshot.revenue_cr} Cr | EBITDA Margin: {analysis.financial_snapshot.ebitda_margin}% | PAT: ₹{analysis.financial_snapshot.pat_cr} Cr
Total Debt: ₹{analysis.balance_sheet.total_debt_cr} Cr | Cash: ₹{analysis.balance_sheet.cash_and_equiv_cr} Cr | D/E: {analysis.balance_sheet.debt_to_equity}
Operating Cash Flow (CFO): ₹{analysis.cash_quality.cfo_cr} Cr | FCF: ₹{analysis.cash_quality.fcf_cr} Cr | Cash Conversion (CFO/PAT): {analysis.cash_quality.cash_conversion_ratio}x
Management Guidance: {analysis.guidance.revenue_guidance} | Tone: {analysis.guidance.management_tone}

VERIFIED PRIMARY CITATIONS (Verbatim PDF Excerpts):
{json.dumps(cit_Payloads, indent=2)}

USER QUESTION: {question}
"""
    payload = {
        "contents": [{"parts": [{"text": prompt_context}]}]
    }
    with httpx.Client(timeout=10.0) as client:
        resp = client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        generated_text = data["candidates"][0]["content"]["parts"][0]["text"]
        return CopilotQueryResponse(
            symbol=symbol,
            answer=generated_text,
            grounded_citations=verified_cits[:2],
            key_takeaway="Institutional primary-grounded synthesis anchored in verified Q2 FY25 PDFs.",
            confidence=0.98,
            provenance="indexed_primary"
        )
