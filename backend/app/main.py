"""
Main FastAPI Application for FINN: Financial Investment Agent.
Institutional Mobile-First Intelligence Layer for Public Markets.
"""
import os
import logging
from typing import List, Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import (
    DEFAULT_PORTFOLIO,
    AD_HOC_TICKERS,
    ANNOUNCEMENT_CATEGORIES,
    DEFAULT_THRESHOLDS
)
from app.models.schemas import (
    PushDigestResponse,
    UnusualMoveAlert,
    CompanyPullAnalysis,
    CopilotQueryRequest,
    CopilotQueryResponse
)
from app.services.market_data import fetch_ticker_eod, scan_unusual_moves, sanitize_ticker
from app.services.announcements import get_windowed_digest
from app.services.fundamentals import build_dynamic_pull_analysis
from app.services.agent_copilot import answer_investor_query

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("finn.app")

app = FastAPI(
    title="FINN - Financial Investment Agent API",
    description="Mobile-first intelligence layer for public-markets investors. Push digest & alerts + Pull primary fundamentals.",
    version="1.0.0"
)

# Enable CORS for local Vite development and mobile browsers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory user settings for customizable thresholds
current_thresholds = dict(DEFAULT_THRESHOLDS)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "agent": "FINN Financial Investment Agent",
        "version": "1.0.0",
        "active_portfolio_count": len(DEFAULT_PORTFOLIO),
        "primary_discipline": "Primary Sources Only (Audited Reports + Concall Transcripts)",
    }


@app.get("/api/portfolio")
def get_portfolio():
    """
    Returns the user's mock portfolio of 18 Indian companies across sectors
    with current EOD prices and daily percentage change.
    """
    results = []
    for item in DEFAULT_PORTFOLIO:
        eod = fetch_ticker_eod(item["symbol"])
        results.append({
            "symbol": item["symbol"],
            "name": item["name"],
            "sector": item["sector"],
            "cap": item.get("cap", "Large"),
            "price": eod["price"],
            "change_pct": eod["change_pct"],
            "volume": eod["volume"],
            "volume_multiplier": eod["volume_multiplier"],
            "live": eod.get("live", False),
        })
    return {"portfolio": results, "ad_hoc_tickers": AD_HOC_TICKERS}


@app.get("/api/push/digest")
def get_digest(
    window_hours: int = Query(24, description="Digest window in hours (e.g. 24, 48, 168)"),
    high_signal_only: bool = Query(False, description="Filter only high signal filings"),
    symbol: Optional[str] = Query(None, description="Optional symbol filter")
):
    """
    Push Feed - Windowed Digest:
    Surfaces every corporate announcement across the portfolio filtered and prioritized.
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
    volume_mult: Optional[float] = Query(None, description="Volume multiplier threshold (e.g. 2.0x)"),
    price_pct: Optional[float] = Query(None, description="Price change threshold in % (e.g. 3.0%)")
):
    """
    Push Feed - Triggered Alerts:
    Monitors portfolio for:
    1. Volume > X times recent 20-day moving average.
    2. Daily price movement beyond ±X%.
    Thresholds are fully configurable by the investor.
    """
    v_thresh = volume_mult if volume_mult is not None else current_thresholds["volume_multiplier"]
    p_thresh = price_pct if price_pct is not None else current_thresholds["price_change_pct"]

    alerts = scan_unusual_moves(
        tickers=DEFAULT_PORTFOLIO,
        volume_threshold=v_thresh,
        price_change_threshold=p_thresh
    )
    return {
        "volume_threshold": v_thresh,
        "price_threshold_pct": p_thresh,
        "alert_count": len(alerts),
        "alerts": [a.model_dump() for a in alerts]
    }


@app.get("/api/pull/analysis/{symbol}", response_model=CompanyPullAnalysis)
def get_company_analysis(symbol: str):
    """
    Pull Terminal - On-Demand Company Analysis:
    Grounded strictly in primary sources (Annual Reports + Concall Transcripts).
    Returns all 8 evaluation modules:
    1. Business Snapshot
    2. Financial Snapshot
    3. Trajectory
    4. Balance Sheet
    5. Cash Quality (CFO vs PAT cash conversion)
    6. Narrative vs. Numbers (Guidance Promised vs Reported Delivery over 4 quarters)
    7. Guidance Tracker
    8. Grounded Bull vs. Bear Case

    Works for ANY NSE ticker!
    """
    try:
        analysis = build_dynamic_pull_analysis(symbol)
        return analysis
    except Exception as e:
        logger.error(f"Error computing pull analysis for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/copilot/query", response_model=CopilotQueryResponse)
def query_copilot(req: CopilotQueryRequest):
    """
    Interactive Copilot Agent:
    Answers investor inquiries with strict grounding in primary transcripts & reports.
    """
    return answer_investor_query(req.symbol, req.question)


class ThresholdUpdate(BaseModel):
    volume_multiplier: float
    price_change_pct: float

@app.get("/api/config/thresholds")
def get_threshold_config():
    return current_thresholds

@app.post("/api/config/thresholds")
def update_threshold_config(payload: ThresholdUpdate):
    current_thresholds["volume_multiplier"] = payload.volume_multiplier
    current_thresholds["price_change_pct"] = payload.price_change_pct
    return {"status": "updated", "thresholds": current_thresholds}
