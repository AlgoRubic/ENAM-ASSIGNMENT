"""
Strict Pydantic Schemas for FINN: Financial Investment Agent.
Enforces data provenance, document hashing, and strict refusal of fabrication.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Document Provenance & Evidence Schemas ---

class PrimarySourceCitation(BaseModel):
    doc_id: str = "DOC-PRIMARY-REF"
    doc_type: str  # e.g., "Shareholder Letter & Results (Q2 FY25)", "Press Release (Q2 FY25)"
    filing_id: Optional[str] = None
    local_filename: Optional[str] = None
    period: str = "Q2 FY25"
    filing_date: str = "October 2024"
    page_or_time: str = "Page 1"
    exact_quote: Optional[str] = None
    derived_summary: Optional[str] = None
    document_hash: str
    source_url: Optional[str] = None

class EvidenceDrawerItem(BaseModel):
    doc_id: str
    local_filename: Optional[str] = None
    title: str
    filing_date: str
    period: str
    page_number: str
    document_hash: str
    source_url: str
    exact_table_snippet: str
    context_note: str

# --- Push Schemas ---

class FinancialDelta(BaseModel):
    current: float
    previous_qoq: Optional[float] = None
    previous_yoy: Optional[float] = None
    delta_qoq_pct: Optional[float] = None
    delta_yoy_pct: Optional[float] = None

class ResultsBreakdown(BaseModel):
    period: str  # e.g., "Q2 FY25 (Ended Sep 30, 2024)"
    unit: str = "₹ Cr"
    revenue: FinancialDelta
    ebitda: FinancialDelta
    pbt: FinancialDelta
    pat: FinancialDelta
    ebitda_margin_pct: float
    pat_margin_pct: float
    ebitda_margin_formula: str = ""
    pat_margin_formula: str = ""
    key_takeaway: str
    evidence: Optional[EvidenceDrawerItem] = None

class ExecutiveBio(BaseModel):
    name: str
    role: str
    incoming_or_outgoing: str
    previous_firm: Optional[str] = None
    previous_role: Optional[str] = None
    career_summary: str
    strategic_implication: str
    evidence: Optional[EvidenceDrawerItem] = None

class WhatChangedCard(BaseModel):
    event_title: str
    what_changed: str
    prior_guidance_contradicted: str
    investor_impact: str
    confidence_level: str  # e.g., "High (Verified Primary Grounding)"
    filing_date: str
    evidence: EvidenceDrawerItem

class AnnouncementItem(BaseModel):
    id: str
    symbol: str
    company_name: str
    filing_date: str = "October 2024"
    publication_timestamp: str = "2024-10-22T15:30:00Z"
    timestamp: str = "October 2024"
    hours_ago: int = 0
    title: str
    category: str
    priority: int
    is_material: bool
    summary_one_liner: str
    source_url: Optional[str] = None
    document_hash: Optional[str] = None
    results_breakdown: Optional[ResultsBreakdown] = None
    executive_bio: Optional[ExecutiveBio] = None
    what_changed: Optional[WhatChangedCard] = None

class UnusualMoveAlert(BaseModel):
    id: str
    symbol: str
    company_name: str
    current_price: float
    price_change_pct: float
    volume: int
    volume_avg_20d: int
    volume_multiplier: float
    alert_type: str
    reasoning: str
    timestamp: str = "Cached Demo Snapshot (As of 2024-11-08)"
    hours_ago: int = 0
    is_live: bool = False
    data_status: str = "cached_demo_snapshot"
    as_of_date: str = "2024-11-08"

class UnifiedAlert(BaseModel):
    id: str
    symbol: str
    company_name: str
    alert_type: str  # "MARKET_ANOMALY" | "MATERIAL_FILING"
    headline: str
    detail: str
    timestamp: str = "Cached Demo Snapshot (As of 2024-11-08)"
    publication_timestamp: Optional[str] = None
    hours_ago: int = 0
    is_live: bool = False
    data_status: str = "cached_demo_snapshot"
    as_of_date: str = "2024-11-08"
    price: Optional[float] = None
    change_pct: Optional[float] = None
    volume_mult: Optional[float] = None
    category: Optional[str] = None
    source_url: Optional[str] = None
    evidence: Optional[EvidenceDrawerItem] = None

class PushDigestResponse(BaseModel):
    window_hours: int
    feed_mode: str = "live_current_window"
    as_of_timestamp: str = ""
    total_announcements: int
    material_count: int
    collapsed_routine_count: int
    alerts: List[UnifiedAlert] = []
    high_signal_announcements: List[AnnouncementItem] = []
    routine_announcements: List[AnnouncementItem] = []

# --- Pull Schemas (Primary Grounding & Provenance) ---

class BusinessSnapshot(BaseModel):
    core_description: str
    segments: List[Dict[str, Any]]
    revenue_mix: Dict[str, float]
    primary_citations: List[PrimarySourceCitation]

class FinancialSnapshot(BaseModel):
    period: str
    revenue_cr: float
    ebitda_cr: float
    pat_cr: float
    ebitda_margin: float
    pat_margin: float
    ebitda_margin_formula: str = ""
    pat_margin_formula: str = ""
    roce: float
    roe: float
    pe_ratio: Optional[float] = None
    market_cap_cr: float
    primary_citations: List[PrimarySourceCitation]

class Trajectory(BaseModel):
    multi_year_cagr_revenue: float
    multi_year_cagr_pat: float
    margin_trend: str
    growing_segments: List[str]
    compressing_segments: List[str]
    primary_citations: List[PrimarySourceCitation]

class BalanceSheetHealth(BaseModel):
    total_debt_cr: float
    cash_and_equiv_cr: float
    debt_to_equity: float
    working_capital_days: int
    contingent_liabilities_cr: float
    pledged_promoter_pct: float
    risk_assessment: str
    primary_citations: List[PrimarySourceCitation]

class CashQuality(BaseModel):
    cfo_cr: float
    pat_cr: float
    cash_conversion_ratio: float
    cash_conversion_formula: str = ""
    fcf_cr: float
    capital_expenditure_cr: float
    fcf_formula: str = ""
    divergence_flag: bool
    commentary: str
    primary_citations: List[PrimarySourceCitation]

class AuditItem(BaseModel):
    quarter: str
    reporting_date: str
    management_guidance_claim: str
    source_concall_quote: str
    actual_reported_delivery: str
    actual_filing_source: str
    verdict: str  # "Delivered / Exceeded", "Missed / Margin Squeeze", "Postponed / Deferred", "In Progress"
    divergence_analysis: str
    evidence: Optional[EvidenceDrawerItem] = None

class NarrativeVsNumbersAudit(BaseModel):
    summary: str
    credibility_score: int
    quarters_audited: List[AuditItem]
    key_divergences_identified: List[str]

class GuidanceTracker(BaseModel):
    fy_target: str
    revenue_guidance: str
    margin_guidance: str
    capex_guidance: str
    management_tone: str
    primary_citations: List[PrimarySourceCitation]

class BullBearCase(BaseModel):
    bull_points: List[str]
    bear_points: List[str]
    critical_swing_factor: str
    grounded_in_docs: List[str]

# Strict Provenance Representation
class CompanyPullAnalysis(BaseModel):
    symbol: str
    company_name: str
    sector: str
    provenance_status: str  # "indexed_primary" | "market_data_only" | "unavailable"
    provenance_note: str
    data_source: str  # "verified_primary_store" | "live_exchange_feed" | "cached_demo_snapshot"
    market_data_status: str = "cached_demo_snapshot"
    market_as_of_date: str = "2024-11-08"
    last_price: float
    day_change_pct: float
    volume: Optional[int] = None
    volume_multiplier: Optional[float] = None
    market_cap_cr: Optional[float] = None
    pe_ratio: Optional[float] = None
    what_changed: Optional[WhatChangedCard] = None
    # The 8 modules are strictly Optional: None when unindexed!
    business_snapshot: Optional[BusinessSnapshot] = None
    financial_snapshot: Optional[FinancialSnapshot] = None
    trajectory: Optional[Trajectory] = None
    balance_sheet: Optional[BalanceSheetHealth] = None
    cash_quality: Optional[CashQuality] = None
    narrative_audit: Optional[NarrativeVsNumbersAudit] = None
    guidance: Optional[GuidanceTracker] = None
    bull_bear: Optional[BullBearCase] = None

# --- Copilot / Query Schemas ---

class CopilotQueryRequest(BaseModel):
    symbol: Optional[str] = None
    question: str

class CopilotQueryResponse(BaseModel):
    symbol: str
    answer: str
    grounded_citations: List[PrimarySourceCitation] = []
    key_takeaway: str
    confidence: float = 1.0
    provenance: str = "indexed_primary"


# --- Evidence Health & Provenance Audit Summary Schemas ---

class AuditSummaryMetric(BaseModel):
    id: str
    label: str
    value: str
    status: str  # "green" | "amber" | "red"
    detail: str
    items: List[str] = []


class AuditSummaryResponse(BaseModel):
    overall_status: str  # "green" | "amber" | "red"
    provenance_audit_passed: bool
    indexed_ticker_count: int
    indexed_tickers: List[str]
    portfolio_ticker_count: int
    market_data_only_ticker_count: int
    ad_hoc_ticker_count: int
    indexed_companies: List[Dict[str, Any]] = []
    local_pdf_count: int
    local_pdfs: List[Dict[str, Any]] = []
    verified_citation_count: int
    total_citation_count: int
    verified_quote_count: int
    what_changed_evidence_verified_count: int
    narrative_audit_evidence_verified_count: int
    sqlite_announcements_verified_count: int
    sqlite_announcements_total: int
    formula_audit_status: str  # "passed" | "failed"
    formula_audit_passed: bool
    formula_checks_passed: int
    formula_checks_total: int
    formula_audit_details: List[Dict[str, Any]] = []
    market_data_status: str  # "live_eod" | "mixed_live_and_cached" | "cached_demo_snapshot"
    market_as_of_date: str
    live_ticker_count: int
    cached_ticker_count: int
    current_feed_mode: str  # "live_current_window" | "historical_q2_fy25_demo" | "custom_as_of_window"
    feed_mode: str
    as_of_timestamp: str
    historical_anchor_timestamp: str
    submission_blockers: List[str] = []
    submission_blocker_details: List[Dict[str, str]] = []
    provenance_errors: List[str] = []
    metrics: List[AuditSummaryMetric] = []
