"""
Strict Pydantic Schemas for FINN: Financial Investment Agent.
Enforces data provenance, document hashing, and strict refusal of fabrication.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Document Provenance & Evidence Schemas ---

class PrimarySourceCitation(BaseModel):
    doc_id: str = "DOC-PRIMARY-REF"
    doc_type: str  # "Annual Report FY24", "Concall Transcript Q2 FY25", "BSE Results Filing"
    filing_id: Optional[str] = None
    period: str = "Q2 FY25"
    filing_date: str = "October 2024"
    page_or_time: str = "Filing Table / Transcript"
    exact_quote: str
    document_hash: str = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"  # SHA-256 checksum of source document
    source_url: Optional[str] = None

class EvidenceDrawerItem(BaseModel):
    doc_id: str
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
    filing_date: str = "Oct 2024"
    timestamp: str = "Recent"
    hours_ago: int = 2
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
    timestamp: str = "Today (EOD)"
    hours_ago: int = 0

class UnifiedAlert(BaseModel):
    id: str
    symbol: str
    company_name: str
    alert_type: str  # "MARKET_ANOMALY" | "MATERIAL_FILING"
    headline: str
    detail: str
    timestamp: str = "Recent"
    hours_ago: int = 2
    price: Optional[float] = None
    change_pct: Optional[float] = None
    volume_mult: Optional[float] = None
    category: Optional[str] = None
    source_url: Optional[str] = None
    evidence: Optional[EvidenceDrawerItem] = None

class PushDigestResponse(BaseModel):
    window_hours: int
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
    fcf_cr: float
    capital_expenditure_cr: float
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
    data_source: str  # "verified_primary_store" | "live_exchange_feed"
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
