"""
Pydantic Schemas for FINN: Financial Investment Agent.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Push Schemas ---

class FinancialDelta(BaseModel):
    current: float
    previous_qoq: Optional[float] = None
    previous_yoy: Optional[float] = None
    delta_qoq_pct: Optional[float] = None
    delta_yoy_pct: Optional[float] = None

class ResultsBreakdown(BaseModel):
    period: str  # e.g., "Q2 FY25"
    unit: str = "₹ Cr"
    revenue: FinancialDelta
    ebitda: FinancialDelta
    pbt: FinancialDelta
    pat: FinancialDelta
    ebitda_margin_pct: float
    pat_margin_pct: float
    key_takeaway: str

class ExecutiveBio(BaseModel):
    name: str
    role: str
    incoming_or_outgoing: str  # "incoming" | "outgoing"
    previous_firm: Optional[str] = None
    previous_role: Optional[str] = None
    career_summary: str
    linkedin_url: Optional[str] = None
    strategic_implication: str

class AnnouncementItem(BaseModel):
    id: str
    symbol: str
    company_name: str
    timestamp: str
    title: str
    category: str  # One of the 17 categories
    priority: int  # 1 (Highest) to 6 (Routine / collapsed)
    is_material: bool
    summary_one_liner: str
    full_text_excerpt: Optional[str] = None
    source_url: Optional[str] = None
    # Special enrichments
    results_breakdown: Optional[ResultsBreakdown] = None
    executive_bio: Optional[ExecutiveBio] = None

class UnusualMoveAlert(BaseModel):
    id: str
    symbol: str
    company_name: str
    current_price: float
    price_change_pct: float
    volume: int
    volume_avg_20d: int
    volume_multiplier: float
    alert_type: str  # "HIGH_VOLUME", "PRICE_SURGE", "PRICE_PLUNGE", "VOLUME_AND_PRICE"
    reasoning: str
    timestamp: str

class PushDigestResponse(BaseModel):
    window_hours: int
    total_announcements: int
    material_count: int
    collapsed_routine_count: int
    alerts: List[UnusualMoveAlert]
    high_signal_announcements: List[AnnouncementItem]
    routine_announcements: List[AnnouncementItem]

# --- Pull Schemas (Primary Sources Grounded) ---

class PrimarySourceCitation(BaseModel):
    doc_type: str  # "Annual Report FY24", "Concall Transcript Q2 FY25", "BSE Filing"
    period: str
    page_or_time: Optional[str] = None
    exact_quote: str

class BusinessSnapshot(BaseModel):
    core_description: str
    segments: List[Dict[str, Any]]  # segment name, share_pct, growth_pct
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
    margin_trend: str  # "Expanding", "Compressing", "Stable"
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
    cfo_cr: float  # Cash from Operations
    pat_cr: float
    cash_conversion_ratio: float  # CFO / PAT (e.g. > 1.0 is healthy)
    fcf_cr: float  # Free Cash Flow
    capital_expenditure_cr: float
    divergence_flag: bool  # True if PAT is growing but CFO is collapsing (Red flag)
    commentary: str
    primary_citations: List[PrimarySourceCitation]

class AuditItem(BaseModel):
    quarter: str
    management_guidance_claim: str
    source_concall_quote: str
    actual_reported_delivery: str
    actual_filing_source: str
    verdict: str  # "Delivered / Exceeded", "Missed / Margin Squeeze", "Postponed / Deferred", "In Progress"
    divergence_analysis: str

class NarrativeVsNumbersAudit(BaseModel):
    summary: str
    credibility_score: int  # 1 to 100
    quarters_audited: List[AuditItem]
    key_divergences_identified: List[str]

class GuidanceTracker(BaseModel):
    fy_target: str
    revenue_guidance: str
    margin_guidance: str
    capex_guidance: str
    management_tone: str  # "Aggressively Bullish", "Prudently Optimistic", "Cautious / Headwinds"
    primary_citations: List[PrimarySourceCitation]

class BullBearCase(BaseModel):
    bull_points: List[str]
    bear_points: List[str]
    critical_swing_factor: str
    grounded_in_docs: List[str]

class CompanyPullAnalysis(BaseModel):
    symbol: str
    company_name: str
    sector: str
    last_price: float
    day_change_pct: float
    business_snapshot: BusinessSnapshot
    financial_snapshot: FinancialSnapshot
    trajectory: Trajectory
    balance_sheet: BalanceSheetHealth
    cash_quality: CashQuality
    narrative_audit: NarrativeVsNumbersAudit
    guidance: GuidanceTracker
    bull_bear: BullBearCase

# --- Copilot / Search Schemas ---

class CopilotQueryRequest(BaseModel):
    symbol: Optional[str] = None
    question: str

class CopilotQueryResponse(BaseModel):
    symbol: Optional[str] = None
    answer: str
    grounded_citations: List[PrimarySourceCitation]
    key_takeaway: str
    confidence: float
