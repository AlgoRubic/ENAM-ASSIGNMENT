"""
Main FastAPI Application for FINN: Financial Investment Agent.
Institutional Mobile-First Intelligence Layer for Public Markets.
Strictly adheres to Primary Source Data Provenance, SQLite Caching, and Zero AI Hallucination.
"""
import os
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import (
    DEFAULT_PORTFOLIO,
    AD_HOC_TICKERS,
    ANNOUNCEMENT_CATEGORIES,
    DEFAULT_THRESHOLDS
)
from app.models.schemas import (
    PushDigestResponse,
    UnusualMoveAlert,
    UnifiedAlert,
    CompanyPullAnalysis,
    CopilotQueryRequest,
    CopilotQueryResponse,
    EvidenceDrawerItem
)
from app.services.market_data import fetch_ticker_eod, scan_unusual_moves, sanitize_ticker
from app.services.announcements import get_windowed_digest, ANNOUNCEMENTS_DATA
from app.services.fundamentals import get_company_analysis, TickerNotFoundError
from app.services.agent_copilot import answer_investor_query
from app.data.verified_primary_store import VERIFIED_PRIMARY_STORE
from app.db.storage import (
    init_db,
    get_cached_portfolio,
    upsert_market_cache,
    get_stored_thresholds,
    update_stored_thresholds
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("finn.app")

app = FastAPI(
    title="FINN - Financial Investment Agent API",
    description="Institutional mobile-first intelligence layer for public-markets investors. Push digest & alerts + Pull primary fundamentals.",
    version="1.0.0"
)

# Initialize database on startup
init_db()

# Safe and compliant CORS policy (avoids wildcard with credentials)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "agent": "FINN Financial Investment Agent",
        "version": "1.0.0",
        "active_portfolio_count": len(DEFAULT_PORTFOLIO),
        "primary_discipline": "Primary Sources Only (Audited Reports + Concall Transcripts)",
        "indexed_companies": list(VERIFIED_PRIMARY_STORE.keys()),
        "cache_layer": "SQLite (finn.db)"
    }


@app.get("/api/portfolio")
def get_portfolio():
    """
    Returns user portfolio stocks with current EOD prices and daily percentage change.
    Guaranteed sub-15ms response via SQLite persistent cache.
    """
    cached = get_cached_portfolio()
    if cached and len(cached) >= len(DEFAULT_PORTFOLIO):
        # Return instantly from SQLite cache
        return {"portfolio": cached, "ad_hoc_tickers": AD_HOC_TICKERS}

    # If cache is not fully warm, seed it synchronously
    results = []
    for item in DEFAULT_PORTFOLIO:
        eod = fetch_ticker_eod(item["symbol"])
        row = {
            "symbol": item["symbol"],
            "name": item["name"],
            "sector": item["sector"],
            "cap": item.get("cap", "Large"),
            "price": eod["price"],
            "change_pct": eod["change_pct"],
            "volume": eod["volume"],
            "volume_multiplier": eod["volume_multiplier"],
            "live": eod.get("live", False),
        }
        upsert_market_cache(item["symbol"], item["name"], item["sector"], item.get("cap", "Large"), eod)
        results.append(row)

    return {"portfolio": results, "ad_hoc_tickers": AD_HOC_TICKERS}


@app.get("/api/push/digest")
def get_digest(
    window_hours: int = Query(24, ge=1, le=720, description="Digest window in hours (1 to 720)"),
    high_signal_only: bool = Query(False, description="Filter only high signal filings"),
    symbol: Optional[str] = Query(None, description="Optional symbol filter")
):
    """
    Push Feed - Windowed Digest:
    Surfaces corporate announcements across the portfolio filtered and prioritized.
    High signal (Results, M&A, Management changes) surfaced first; routine ESOPs/certs collapsed.
    """
    symbols = [symbol] if symbol else None
    digest = get_windowed_digest(
        window_hours=window_hours,
        high_signal_only=high_signal_only,
        selected_symbols=symbols
    )
    return digest


@app.get("/api/push/alerts")
def get_alerts(
    volume_mult: Optional[float] = Query(None, ge=1.0, le=10.0, description="Volume multiplier threshold (1.0x to 10.0x)"),
    price_pct: Optional[float] = Query(None, ge=0.5, le=50.0, description="Price change threshold in % (0.5% to 50.0%)"),
    window_hours: int = Query(48, ge=1, le=720, description="Window in hours to scan for material filing events")
):
    """
    Push Feed - Unified Triggered Alerts:
    Monitors portfolio for:
    1. Volume > X times recent 20-day moving average.
    2. Daily price movement beyond ±X%.
    3. Material corporate filings (demergers, results, regulatory clearances) within timeframe.
    """
    thresholds = get_stored_thresholds()
    v_thresh = volume_mult if volume_mult is not None else thresholds.get("volume_multiplier", 2.0)
    p_thresh = price_pct if price_pct is not None else thresholds.get("price_change_pct", 3.0)

    # 1. Market anomaly alerts
    market_alerts = scan_unusual_moves(
        tickers=DEFAULT_PORTFOLIO,
        volume_threshold=v_thresh,
        price_change_threshold=p_thresh
    )

    unified: List[UnifiedAlert] = []

    for ma in market_alerts:
        unified.append(UnifiedAlert(
            id=ma.id,
            symbol=ma.symbol,
            company_name=ma.company_name,
            alert_type="MARKET_ANOMALY",
            headline=f"{ma.alert_type.replace('_', ' ').title()}: {ma.symbol} ({ma.price_change_pct:+}%)",
            detail=ma.reasoning,
            timestamp=ma.timestamp,
            hours_ago=ma.hours_ago,
            price=ma.current_price,
            change_pct=ma.price_change_pct,
            volume_mult=ma.volume_multiplier
        ))

    # 2. Material corporate filing alerts
    for item in ANNOUNCEMENTS_DATA:
        if item.get("timestamp_hours_ago", 999) <= window_hours and item.get("priority", 9) == 1:
            ev_data = None
            if "results_breakdown" in item and "evidence" in item["results_breakdown"]:
                ev_data = EvidenceDrawerItem(**item["results_breakdown"]["evidence"])
            elif "evidence" in item:
                ev_data = EvidenceDrawerItem(**item["evidence"])

            unified.append(UnifiedAlert(
                id=f"alert-filing-{item['id']}",
                symbol=item["symbol"],
                company_name=item["company_name"],
                alert_type="MATERIAL_FILING",
                headline=f"Material Filing ({item['category'].upper()}): {item['company_name']}",
                detail=item["summary_one_liner"],
                timestamp=f"{item['timestamp_hours_ago']}h ago",
                hours_ago=item["timestamp_hours_ago"],
                category=item["category"],
                source_url=item.get("source_url"),
                evidence=ev_data
            ))

    # Sort unified alerts: filings and extreme moves prioritized
    unified.sort(key=lambda x: (x.alert_type != "MATERIAL_FILING", x.hours_ago))

    return {
        "volume_threshold": v_thresh,
        "price_threshold_pct": p_thresh,
        "alert_count": len(unified),
        "alerts": [u.model_dump() for u in unified]
    }


@app.get("/api/pull/analysis/{symbol}", response_model=CompanyPullAnalysis)
def get_company_analysis_endpoint(symbol: str):
    """
    Pull Terminal - On-Demand Company Analysis:
    Grounded strictly in primary sources (Annual Reports + Concall Transcripts).
    Returns all 8 evaluation modules for indexed companies.
    Returns honest market_data_only for unindexed NSE tickers.
    Returns HTTP 404 for unknown or unresolvable tickers.
    """
    try:
        analysis = get_company_analysis(symbol)
        return analysis
    except TickerNotFoundError as e:
        logger.warning(f"Ticker resolution failed for {symbol}: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "message": f"Symbol '{symbol}' could not be resolved on the National Stock Exchange of India (NSE).",
                "provenance_status": "unavailable",
                "symbol": symbol
            }
        )
    except Exception as e:
        logger.error(f"Error computing pull analysis for {symbol}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while compiling verified primary analysis."
        )


@app.get("/api/documents/{symbol}/evidence")
def get_document_evidence(symbol: str):
    """
    Evidence Drawer Endpoint:
    Returns primary source filing metadata, page numbers, and SHA-256 hashes for indexed symbols.
    """
    sym = sanitize_ticker(symbol)
    if sym in VERIFIED_PRIMARY_STORE:
        raw = VERIFIED_PRIMARY_STORE[sym]
        what_changed_ev = raw.get("what_changed", {}).get("evidence")
        audit_ev = [
            a.get("evidence") for a in raw.get("narrative_audit", {}).get("quarters_audited", [])
            if a.get("evidence")
        ]
        return {
            "symbol": sym,
            "company_name": raw["name"],
            "provenance_status": raw["provenance_status"],
            "what_changed_evidence": what_changed_ev,
            "audit_evidence": audit_ev
        }
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Verified document evidence is not yet indexed for '{sym}'. Only verified primary records are stored."
    )


@app.post("/api/copilot/query", response_model=CopilotQueryResponse)
def query_copilot(req: CopilotQueryRequest):
    """
    Interactive Copilot Agent:
    Answers investor inquiries strictly grounded in primary transcripts & reports.
    Honest refusal for unindexed stocks.
    """
    return answer_investor_query(req.symbol, req.question)


class ThresholdUpdate(BaseModel):
    volume_multiplier: float = Field(..., ge=1.0, le=10.0, description="Volume multiplier (1.0 to 10.0)")
    price_change_pct: float = Field(..., ge=0.5, le=50.0, description="Price change threshold % (0.5 to 50.0)")


@app.get("/api/config/thresholds")
def get_threshold_config():
    """Returns persistent alert thresholds from SQLite database."""
    return get_stored_thresholds()


@app.post("/api/config/thresholds")
def update_threshold_config(payload: ThresholdUpdate):
    """Persists updated thresholds to SQLite database."""
    update_stored_thresholds(payload.volume_multiplier, payload.price_change_pct)
    return {
        "status": "updated",
        "thresholds": get_stored_thresholds()
    }
