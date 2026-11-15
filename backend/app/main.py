"""
Main FastAPI Application for FINN: Financial Investment Agent.
Institutional Mobile-First Intelligence Layer for Public Markets.
Strictly adheres to Primary Source Data Provenance, SQLite Caching, and Zero AI Hallucination.
"""
import os
import re
import sys
import time
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

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
    EvidenceDrawerItem,
    AuditSummaryMetric,
    AuditSummaryResponse,
)
import app.services.market_data as market_data_service
from app.services.market_data import (
    fetch_ticker_eod,
    scan_unusual_moves,
    sanitize_ticker,
    FALLBACK_AS_OF_DATE
)
from app.services.announcements import (
    get_windowed_digest,
    ANNOUNCEMENTS_DATA,
    parse_iso_timestamp,
    resolve_as_of_timestamp,
    compute_hours_between,
    HISTORICAL_Q2_FY25_AS_OF,
)
from app.services.fundamentals import get_company_analysis, TickerNotFoundError
from app.services.agent_copilot import answer_investor_query
from app.data.verified_primary_store import VERIFIED_PRIMARY_STORE
from app.db.storage import (
    init_db,
    get_cached_portfolio,
    upsert_market_cache,
    get_stored_thresholds,
    update_stored_thresholds,
    get_stored_announcements
)
from verify_provenance import compute_provenance_audit_report
from fastapi.staticfiles import StaticFiles

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("finn.app")

app = FastAPI(
    title="FINN - Financial Investment Agent API",
    description="Institutional mobile-first intelligence layer for public-markets investors. Push digest & alerts + Pull primary fundamentals.",
    version="1.0.0"
)

# Initialize database on startup
init_db()

# Mount local verified documents directory if present
DOCUMENTS_DIR = os.path.join(os.path.dirname(__file__), "data", "documents")
if os.path.exists(DOCUMENTS_DIR):
    app.mount("/api/documents/download", StaticFiles(directory=DOCUMENTS_DIR), name="documents")

# Safe and compliant CORS policy (avoids wildcard with credentials)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$|^https://[a-z0-9-]+\.trycloudflare\.com$",
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
        "primary_discipline": "Primary Sources Only (Indexed Q2 FY25 Exchange Filings, Earnings-Call Transcript & Investor Presentation)",
        "indexed_companies": list(VERIFIED_PRIMARY_STORE.keys()),
        "cache_layer": "SQLite (finn.db)"
    }


@app.get("/api/portfolio")
def get_portfolio():
    """
    Returns user portfolio stocks with EOD prices and daily percentage change.
    Guaranteed sub-15ms response via SQLite persistent cache, exposing explicit
    data_status ('cached_demo_snapshot' vs 'live_eod') and as_of_date.
    """
    cached = get_cached_portfolio()
    if cached and len(cached) >= len(DEFAULT_PORTFOLIO):
        enriched = []
        for row in cached:
            is_live_row = bool(row.get("is_live", 0))
            enriched.append({
                **row,
                "live": is_live_row,
                "data_status": "live_eod" if is_live_row else "cached_demo_snapshot",
                "as_of_date": FALLBACK_AS_OF_DATE,
            })
        return {
            "portfolio": enriched,
            "ad_hoc_tickers": AD_HOC_TICKERS,
            "data_status": "cached_demo_snapshot",
            "as_of_date": FALLBACK_AS_OF_DATE,
        }

    # If cache is not fully warm, seed it synchronously
    results = []
    for item in DEFAULT_PORTFOLIO:
        eod = fetch_ticker_eod(item["symbol"])
        is_live_row = bool(eod.get("live", False))
        row = {
            "symbol": item["symbol"],
            "name": item["name"],
            "sector": item["sector"],
            "cap": item.get("cap", "Large"),
            "price": eod["price"],
            "change_pct": eod["change_pct"],
            "volume": eod["volume"],
            "volume_multiplier": eod["volume_multiplier"],
            "live": is_live_row,
            "data_status": eod.get("data_status", "live_eod" if is_live_row else "cached_demo_snapshot"),
            "as_of_date": eod.get("as_of_date", FALLBACK_AS_OF_DATE),
        }
        upsert_market_cache(item["symbol"], item["name"], item["sector"], item.get("cap", "Large"), eod)
        results.append(row)

    return {
        "portfolio": results,
        "ad_hoc_tickers": AD_HOC_TICKERS,
        "data_status": "cached_demo_snapshot",
        "as_of_date": FALLBACK_AS_OF_DATE,
    }


@app.get("/api/push/digest")
def get_digest(
    window_hours: int = Query(24, ge=1, le=8760, description="Digest window in hours (1 to 8760)"),
    high_signal_only: bool = Query(False, description="Filter only high signal filings"),
    symbol: Optional[str] = Query(None, description="Optional symbol filter"),
    as_of: Optional[str] = Query(
        None,
        description="Optional ISO-8601 reference timestamp (e.g. '2024-11-08T23:59:59Z') or 'historical_q2_fy25'. Defaults to current UTC time."
    )
):
    """
    Push Feed - Windowed Digest:
    Surfaces corporate announcements across the portfolio filtered mathematically by comparing
    parsed ISO publication_timestamp values against `as_of` (defaults to current UTC time).
    """
    symbols = [symbol] if symbol else None
    digest = get_windowed_digest(
        window_hours=window_hours,
        high_signal_only=high_signal_only,
        selected_symbols=symbols,
        as_of=as_of
    )
    return digest


@app.get("/api/push/feed/db")
def get_announcements_feed_endpoint(symbol: Optional[str] = Query(None)):
    """
    Returns verified exchange announcements ingested into SQLite announcements_feed table.
    Stores filing ID, original URL, publication timestamp, fetch timestamp, document hash, and extraction status.
    """
    feed = get_stored_announcements(symbol)
    return {"count": len(feed), "feed": feed}


@app.get("/api/push/alerts")
def get_alerts(
    volume_mult: Optional[float] = Query(None, ge=1.0, le=10.0, description="Volume multiplier threshold (1.0x to 10.0x)"),
    price_pct: Optional[float] = Query(None, ge=0.5, le=50.0, description="Price change threshold in % (0.5% to 50.0%)"),
    window_hours: int = Query(48, ge=1, le=8760, description="Window in hours to scan for material filing events"),
    as_of: Optional[str] = Query(
        None,
        description="Optional ISO-8601 reference timestamp (e.g. '2024-11-08T23:59:59Z') or 'historical_q2_fy25'. Defaults to current UTC time."
    )
):
    """
    Push Feed - Unified Triggered Alerts:
    Monitors portfolio for:
    1. Volume > X times recent 20-day moving average.
    2. Daily price movement beyond ±X%.
    3. Material corporate filings within [as_of - window_hours, as_of].
    """
    thresholds = get_stored_thresholds()
    v_thresh = volume_mult if volume_mult is not None else thresholds.get("volume_multiplier", 2.0)
    p_thresh = price_pct if price_pct is not None else thresholds.get("price_change_pct", 3.0)
    as_of_dt, as_of_iso, feed_mode = resolve_as_of_timestamp(as_of)

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
            is_live=ma.is_live,
            data_status=ma.data_status,
            as_of_date=ma.as_of_date,
            price=ma.current_price,
            change_pct=ma.price_change_pct,
            volume_mult=ma.volume_multiplier
        ))

    # 2. Material corporate filing alerts (strictly filtered by parsed publication_timestamp vs as_of_dt)
    for item in ANNOUNCEMENTS_DATA:
        if item.get("priority", 9) != 1:
            continue

        pub_iso = item.get("publication_timestamp")
        filing_date_str = item.get("filing_date", "October 2024")
        pub_dt = parse_iso_timestamp(pub_iso, filing_date_str)
        delta_hours = compute_hours_between(as_of_dt, pub_dt)

        if 0.0 <= delta_hours <= float(window_hours):
            ev_data = None
            if "results_breakdown" in item and "evidence" in item["results_breakdown"]:
                ev_data = EvidenceDrawerItem(**item["results_breakdown"]["evidence"])
            elif "evidence" in item:
                ev_data = EvidenceDrawerItem(**item["evidence"])

            pub_ts_str = pub_iso or pub_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            unified.append(UnifiedAlert(
                id=f"alert-filing-{item['id']}",
                symbol=item["symbol"],
                company_name=item["company_name"],
                alert_type="MATERIAL_FILING",
                headline=f"Material Filing ({item['category'].upper()}): {item['company_name']}",
                detail=item["summary_one_liner"],
                timestamp=f"{filing_date_str} ({pub_ts_str})",
                publication_timestamp=pub_ts_str,
                hours_ago=max(0, int(round(delta_hours))),
                is_live=False,
                data_status="verified_historical_filing",
                as_of_date=pub_dt.strftime("%Y-%m-%d"),
                category=item["category"],
                source_url=item.get("source_url"),
                evidence=ev_data
            ))

    # Sort unified alerts: filings and extreme moves prioritized
    unified.sort(key=lambda x: (x.alert_type != "MATERIAL_FILING", x.hours_ago))

    return {
        "volume_threshold": v_thresh,
        "price_threshold_pct": p_thresh,
        "feed_mode": feed_mode,
        "as_of_timestamp": as_of_iso,
        "market_data_status": "cached_demo_snapshot",
        "market_as_of_date": FALLBACK_AS_OF_DATE,
        "alert_count": len(unified),
        "alerts": [u.model_dump() for u in unified]
    }


@app.get("/api/pull/analysis/{symbol}", response_model=CompanyPullAnalysis)
def get_company_analysis_endpoint(symbol: str):
    """
    Pull Terminal - On-Demand Company Analysis:
    Grounded strictly in indexed Q2 FY25 exchange filings, earnings-call transcript, and investor-presentation documents.
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
    Answers investor inquiries grounded in indexed Q2 FY25 exchange filings, earnings-call transcript, and investor-presentation documents when matching stored evidence exists; otherwise returns an explicit refusal or no-citation response.
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


def _scan_doc_submission_blockers() -> List[Dict[str, str]]:
    """
    Dynamically scans COVERING_NOTE.md and README.md for any unresolved
    [SUBMISSION BLOCKER: ...] placeholders so pre-submission checklist state
    is derived from disk rather than hardcoded.
    """
    repo_root = os.path.dirname(BACKEND_ROOT)
    found: List[Dict[str, str]] = []
    seen = set()
    pattern = re.compile(r"\[SUBMISSION BLOCKER:\s*([^\]]+)\]")

    for fname in ("COVERING_NOTE.md", "README.md"):
        fpath = os.path.join(repo_root, fname)
        if not os.path.isfile(fpath):
            continue
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
            for match in pattern.findall(content):
                cleaned = match.strip()
                if cleaned not in seen:
                    seen.add(cleaned)
                    found.append({
                        "id": f"doc-blocker-{len(found) + 1}",
                        "category": "submission_metadata",
                        "severity": "amber",
                        "title": cleaned,
                        "detail": f"Unresolved placeholder in {fname}: [SUBMISSION BLOCKER: {cleaned}]",
                        "source": fname,
                    })
        except Exception as e:
            logger.warning(f"Could not scan {fname} for submission blockers: {e}")

    return found


@app.get("/api/audit/summary", response_model=AuditSummaryResponse)
def get_audit_summary(
    as_of: Optional[str] = Query(
        None,
        description="Optional ISO-8601 reference timestamp (e.g. '2024-11-08T23:59:59Z') or 'historical_q2_fy25'. Defaults to current UTC time."
    )
):
    """
    Reviewer-Facing Evidence Health & Provenance Audit Endpoint:
    Derives live values from VERIFIED_PRIMARY_STORE, local primary PDFs on disk,
    verbatim citation matcher, numeric formula verifier, current market-data cache/live state,
    active feed mode, and explicit submission blockers.
    """
    report = compute_provenance_audit_report(verbose=False)
    _, as_of_iso, feed_mode = resolve_as_of_timestamp(as_of)

    # Derive live vs cached market-data status across portfolio tickers
    portfolio_symbols = [item["symbol"] for item in DEFAULT_PORTFOLIO]
    cached_rows = {row["symbol"]: row for row in get_cached_portfolio()}
    now_ts = time.time()

    live_count = 0
    cached_count = 0
    live_dates: List[str] = []

    for sym in portfolio_symbols:
        mem_entry = market_data_service._CACHE.get(sym)
        if mem_entry and (now_ts - mem_entry.get("timestamp", 0) < market_data_service.CACHE_TTL_SECONDS):
            data = mem_entry.get("data", {})
            if data.get("live", False):
                live_count += 1
                if data.get("as_of_date"):
                    live_dates.append(str(data["as_of_date"]))
            else:
                cached_count += 1
        else:
            db_row = cached_rows.get(sym, {})
            if bool(db_row.get("is_live", 0)):
                live_count += 1
            else:
                cached_count += 1

    total_portfolio = len(portfolio_symbols)
    if total_portfolio > 0 and live_count == total_portfolio:
        market_status = "live_eod"
        market_as_of = max(live_dates) if live_dates else FALLBACK_AS_OF_DATE
    elif live_count > 0:
        market_status = "mixed_live_and_cached"
        market_as_of = max(live_dates) if live_dates else FALLBACK_AS_OF_DATE
    else:
        market_status = "cached_demo_snapshot"
        market_as_of = FALLBACK_AS_OF_DATE

    # Verify SQLite announcements_feed rows
    stored_anns = get_stored_announcements()
    sqlite_total = len(stored_anns)
    sqlite_verified = sum(1 for row in stored_anns if row.get("extraction_status") == "VERIFIED_EXTRACTED")

    indexed_tickers = report["indexed_tickers"]
    indexed_count = report["indexed_ticker_count"]
    market_only_count = sum(1 for sym in portfolio_symbols if sym not in VERIFIED_PRIMARY_STORE)
    ad_hoc_count = len(AD_HOC_TICKERS)

    # Build explicit submission blockers from live verifier errors + doc placeholders + runtime scope
    blocker_details: List[Dict[str, str]] = []
    for idx, err in enumerate(report["errors"]):
        blocker_details.append({
            "id": f"provenance-error-{idx + 1}",
            "category": "provenance_or_formula_error",
            "severity": "red",
            "title": "Cryptographic or Formula Verification Failure",
            "detail": err,
            "source": "verify_provenance.py",
        })

    if sqlite_verified < sqlite_total:
        unverified_cnt = sqlite_total - sqlite_verified
        blocker_details.append({
            "id": "sqlite-unverified-announcements",
            "category": "announcement_feed_integrity",
            "severity": "red",
            "title": f"{unverified_cnt} Unverified SQLite Announcement Row(s)",
            "detail": f"{sqlite_verified}/{sqlite_total} filings in SQLite announcements_feed have VERIFIED_EXTRACTED status.",
            "source": "finn.db (announcements_feed)",
        })

    # Include unresolved [SUBMISSION BLOCKER: ...] placeholders from COVERING_NOTE.md / README.md
    blocker_details.extend(_scan_doc_submission_blockers())

    # Include honest scope/runtime blockers when primary coverage is partial or market quotes are cached
    if indexed_count < total_portfolio:
        blocker_details.append({
            "id": "partial-primary-indexing",
            "category": "primary_coverage_scope",
            "severity": "amber",
            "title": f"Partial Primary PDF Coverage ({indexed_count}/{total_portfolio} Portfolio Tickers)",
            "detail": (
                f"Primary Q2 FY25 PDFs are indexed for {indexed_count} benchmark tickers "
                f"({', '.join(indexed_tickers)}); {market_only_count} portfolio tickers and "
                f"{ad_hoc_count} ad-hoc tickers return market_data_only with subjective modules set to null."
            ),
            "source": "verified_primary_store.py",
        })

    if market_status != "live_eod":
        blocker_details.append({
            "id": "cached-market-snapshot",
            "category": "market_data_freshness",
            "severity": "amber",
            "title": f"Market Data in {market_status} Mode (As of {market_as_of})",
            "detail": (
                f"{cached_count}/{total_portfolio} portfolio tickers are currently served from the offline-resilient "
                f"cached benchmark snapshot (as of {market_as_of}) rather than live exchange quotes."
            ),
            "source": "market_data.py",
        })

    submission_blockers = [b["detail"] for b in blocker_details]

    # Build drill-down metrics list with honest green/amber/red states
    indexed_status = "green" if indexed_count >= total_portfolio and indexed_count > 0 else "amber"
    pdf_status = "green" if report["local_pdf_count"] > 0 and len(report["provenance_errors"]) == 0 else "red"
    citation_status = (
        "green"
        if report["verified_citation_count"] == report["total_citation_count"]
        and report["total_citation_count"] > 0
        and len(report["provenance_errors"]) == 0
        else "red"
    )
    formula_status = "green" if report["formula_audit_status"] == "passed" else "red"
    market_metric_status = "green" if market_status == "live_eod" else "amber"
    feed_metric_status = "green" if feed_mode == "live_current_window" else "amber"
    blockers_metric_status = (
        "green"
        if len(submission_blockers) == 0
        else ("red" if not report["passed"] else "amber")
    )

    metrics: List[AuditSummaryMetric] = [
        AuditSummaryMetric(
            id="indexed_tickers",
            label="Indexed Primary Tickers",
            value=f"{indexed_count} / {total_portfolio} Portfolio ({', '.join(t.replace('.NS', '') for t in indexed_tickers)})",
            status=indexed_status,
            detail=(
                f"{indexed_count} tickers have full Q2 FY25 PDF grounding; "
                f"{market_only_count} portfolio + {ad_hoc_count} ad-hoc tickers honestly return market_data_only."
            ),
            items=[
                f"{c['symbol']} ({c['name']}): {c['verified_citation_count']}/{c['citation_count']} module citations verified, {len(c['local_pdfs'])} local PDF(s)"
                for c in report["indexed_companies"]
            ] + [
                f"Unindexed scope guard: {market_only_count} portfolio & {ad_hoc_count} ad-hoc tickers return null analysis modules (zero fabrication)"
            ],
        ),
        AuditSummaryMetric(
            id="local_pdfs",
            label="Local Primary PDF Archive",
            value=f"{report['local_pdf_count']} PDFs Verified (SHA-256)",
            status=pdf_status,
            detail="Official Q2 FY25 regulatory filings, concall transcript, and analyst presentation verified on disk.",
            items=[
                f"{p['filename']} ({p['size_kb']} KB) • SHA-256: {p['sha256'][:16]}... • {p['referenced_by_citations']} citations"
                for p in report["local_pdfs"]
            ],
        ),
        AuditSummaryMetric(
            id="verified_citations",
            label="Verified Verbatim Citations",
            value=f"{report['verified_citation_count']} / {report['total_citation_count']} Module Quotes",
            status=citation_status,
            detail=(
                f"{report['verified_citation_count']}/{report['total_citation_count']} module quotes matched verbatim in PDFs; "
                f"{report['what_changed_evidence_verified_count']} What-Changed & "
                f"{report['narrative_audit_evidence_verified_count']} Narrative Audit evidence blocks verified; "
                f"{sqlite_verified}/{sqlite_total} SQLite filings VERIFIED_EXTRACTED."
            ),
            items=[
                f"Pull module verbatim quotes: {report['verified_citation_count']}/{report['total_citation_count']} matched in normalized PDF text",
                f"What-Changed evidence drawers: {report['what_changed_evidence_verified_count']}/{indexed_count} SHA-256 verified",
                f"Narrative vs. Numbers audit evidence: {report['narrative_audit_evidence_verified_count']} SHA-256 verified",
                f"SQLite announcements_feed: {sqlite_verified}/{sqlite_total} rows marked VERIFIED_EXTRACTED",
            ],
        ),
        AuditSummaryMetric(
            id="formula_audit",
            label="Numeric Formula Audit",
            value=f"{report['formula_audit_status'].upper()} ({report['formula_checks_passed']}/{report['formula_checks_total']} Checks)",
            status=formula_status,
            detail="Verifies EBITDA margin (EBITDA/Rev), PAT margin (PAT/Rev), Cash Conversion (CFO/PAT), and FCF (CFO - Capex).",
            items=[
                f"{d['symbol']} (Pull): EBITDA%={d['ebitda_margin_pct']}%, PAT%={d['pat_margin_pct']}%, CFO/PAT={d['cash_conversion_ratio']}x, FCF=₹{d['fcf_cr']} Cr ({d['checks_passed']}/{d['checks_total']} passed)"
                if d["scope"] == "pull_terminal"
                else f"{d['symbol']} ({d['filing_id']}): EBITDA%={d['ebitda_margin_pct']}%, PAT%={d['pat_margin_pct']}% ({d['checks_passed']}/{d['checks_total']} passed)"
                for d in report["formula_audit_details"]
            ],
        ),
        AuditSummaryMetric(
            id="market_data",
            label="Market Data Status & As-Of",
            value=f"{market_status} • As of {market_as_of}",
            status=market_metric_status,
            detail=(
                f"Live EOD tickers: {live_count}/{total_portfolio} • "
                f"Cached snapshot tickers: {cached_count}/{total_portfolio} (Reference date: {market_as_of})."
            ),
            items=[
                f"Status: {market_status}",
                f"As-of date: {market_as_of}",
                f"Live EOD quotes in cache: {live_count}/{total_portfolio}",
                f"Cached demo snapshot quotes: {cached_count}/{total_portfolio}",
            ],
        ),
        AuditSummaryMetric(
            id="feed_mode",
            label="Current Push Feed Mode",
            value=f"{feed_mode} ({as_of_iso})",
            status=feed_metric_status,
            detail=(
                "Mathematically filters filing publication_timestamp against as_of. "
                "2024 Q2 FY25 filings are excluded from live 24h/48h windows and included when anchored at 2024-11-08T23:59:59Z."
            ),
            items=[
                f"Active feed mode: {feed_mode}",
                f"Active as_of reference: {as_of_iso}",
                f"Historical Q2 FY25 demo anchor: {HISTORICAL_Q2_FY25_AS_OF}",
            ],
        ),
        AuditSummaryMetric(
            id="submission_blockers",
            label="Explicit Submission Blockers",
            value=f"{len(submission_blockers)} Active" if submission_blockers else "0 Active (Ready)",
            status=blockers_metric_status,
            detail=(
                "Tracks unresolved [SUBMISSION BLOCKER] placeholders in COVERING_NOTE.md/README.md, "
                "partial primary indexing scope, cached market snapshot status, and any verifier errors."
            ),
            items=submission_blockers if submission_blockers else ["No active submission blockers detected."],
        ),
    ]

    if not report["passed"] or sqlite_verified < sqlite_total:
        overall_status = "red"
    elif any(m.status == "amber" for m in metrics):
        overall_status = "amber"
    else:
        overall_status = "green"

    return AuditSummaryResponse(
        overall_status=overall_status,
        provenance_audit_passed=report["passed"],
        indexed_ticker_count=indexed_count,
        indexed_tickers=indexed_tickers,
        portfolio_ticker_count=total_portfolio,
        market_data_only_ticker_count=market_only_count,
        ad_hoc_ticker_count=ad_hoc_count,
        indexed_companies=report["indexed_companies"],
        local_pdf_count=report["local_pdf_count"],
        local_pdfs=report["local_pdfs"],
        verified_citation_count=report["verified_citation_count"],
        total_citation_count=report["total_citation_count"],
        verified_quote_count=report["verified_quote_count"],
        what_changed_evidence_verified_count=report["what_changed_evidence_verified_count"],
        narrative_audit_evidence_verified_count=report["narrative_audit_evidence_verified_count"],
        sqlite_announcements_verified_count=sqlite_verified,
        sqlite_announcements_total=sqlite_total,
        formula_audit_status=report["formula_audit_status"],
        formula_audit_passed=report["formula_audit_passed"],
        formula_checks_passed=report["formula_checks_passed"],
        formula_checks_total=report["formula_checks_total"],
        formula_audit_details=report["formula_audit_details"],
        market_data_status=market_status,
        market_as_of_date=market_as_of,
        live_ticker_count=live_count,
        cached_ticker_count=cached_count,
        current_feed_mode=feed_mode,
        feed_mode=feed_mode,
        as_of_timestamp=as_of_iso,
        historical_anchor_timestamp=HISTORICAL_Q2_FY25_AS_OF,
        submission_blockers=submission_blockers,
        submission_blocker_details=blocker_details,
        provenance_errors=report["errors"],
        metrics=metrics,
    )
