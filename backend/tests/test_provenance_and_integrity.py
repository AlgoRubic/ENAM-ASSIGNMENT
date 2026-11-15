"""
Comprehensive Test Suite for FINN Financial Investment Agent.
Verifies:
1. Strict Primary Document Provenance (Zomato, Tata Motors, Reliance).
2. Honest Refusal & Market-Data-Only for unindexed tickers (Zero Hallucination).
3. Explicit HTTP 404 for invalid/unresolvable tickers.
4. Threshold Boundary Validation & SQLite Persistence.
5. Primary Source Evidence Drawer Provenance & SHA-256 Document Hashes.
6. Unified Push Alerts (Market Anomalies + Material Exchange Filings).
"""
import os
import tempfile
import atexit
import pytest

# Ensure tests run against an isolated temporary database, NEVER mutating finn.db
TEST_DB_PATH = os.path.join(tempfile.gettempdir(), f"finn_test_isolated_{os.getpid()}.db")
os.environ["FINN_DB_PATH"] = TEST_DB_PATH

def _cleanup_test_db():
    try:
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)
    except Exception:
        pass

atexit.register(_cleanup_test_db)

from fastapi.testclient import TestClient
from app.main import app
from app.data.verified_primary_store import VERIFIED_PRIMARY_STORE

client = TestClient(app)


def test_health_check():
    """Verify health endpoint reports correct indexed status and honest Q2 FY25 primary discipline."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ZOMATO.NS" in data["indexed_companies"]
    assert "TATAMOTORS.NS" in data["indexed_companies"]
    assert "RELIANCE.NS" in data["indexed_companies"]
    assert data["cache_layer"] == "SQLite (finn.db)"
    assert "Q2 FY25" in data["primary_discipline"]
    assert "Annual Report" not in data["primary_discipline"]

    # Verify CopilotChat.jsx and main.py do not overclaim 'All queries are verified' or 'Annual Reports'
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    copilot_chat_path = os.path.join(repo_root, "frontend", "src", "components", "CopilotChat.jsx")
    main_py_path = os.path.join(repo_root, "backend", "app", "main.py")
    with open(copilot_chat_path, "r", encoding="utf-8") as f:
        copilot_ui_src = f.read()
    with open(main_py_path, "r", encoding="utf-8") as f:
        main_py_src = f.read()
    assert "All queries are verified" not in copilot_ui_src
    assert "matching stored evidence exists" in copilot_ui_src
    assert "Annual Report" not in main_py_src


def test_known_ticker_returns_verified_provenance():
    """
    CRITICAL CHECK: Verified tickers must return complete audited modules,
    'indexed_primary' provenance status, What-Changed card, and SHA-256 document checksums.
    """
    for symbol in ["ZOMATO.NS", "TATAMOTORS.NS", "RELIANCE.NS"]:
        response = client.get(f"/api/pull/analysis/{symbol}")
        assert response.status_code == 200, f"Failed for {symbol}: {response.text}"
        data = response.json()

        # Provenance verification
        assert data["provenance_status"] == "indexed_primary"
        assert data["data_source"] == "verified_primary_store"
        assert len(data["provenance_note"]) > 20

        # "What Changed?" Card verification
        assert data["what_changed"] is not None
        wc = data["what_changed"]
        assert len(wc["event_title"]) > 5
        assert len(wc["what_changed"]) > 10
        assert len(wc["prior_guidance_contradicted"]) > 10
        assert len(wc["investor_impact"]) > 10
        assert "2024" in wc["filing_date"], f"Filing date must match FY25 calendar: {wc['filing_date']}"

        # Evidence Drawer verification
        ev = wc["evidence"]
        assert ev["document_hash"] is not None
        assert len(ev["document_hash"]) == 64  # Valid SHA-256 length
        assert len(ev["exact_table_snippet"]) > 10

        # Financial Snapshot verification
        fin = data["financial_snapshot"]
        assert fin["revenue_cr"] > 0
        assert fin["ebitda_cr"] is not None
        assert fin["pat_cr"] is not None
        assert len(fin["primary_citations"]) >= 1

        # Narrative vs Numbers Audit verification (audited against verified filings)
        narrative = data["narrative_audit"]
        assert narrative["credibility_score"] >= 0 and narrative["credibility_score"] <= 100
        assert len(narrative["quarters_audited"]) >= 1
        for q in narrative["quarters_audited"]:
            assert q["verdict"] in [
                "Delivered / Exceeded",
                "Missed / Margin Squeeze",
                "Postponed / Deferred",
                "In Progress"
            ]
            assert len(q["source_concall_quote"]) > 5
            assert len(q["actual_filing_source"]) > 5


def test_unknown_ticker_honestly_refuses_fabrication():
    """
    CRITICAL CHECK: When querying a valid NSE stock without indexed primary documents (e.g., TCS.NS),
    the system must return 'market_data_only' and strictly set all 8 analysis modules to None.
    NEVER invent synthetic revenue, fake concall quotes, or arbitrary credibility scores!
    """
    response = client.get("/api/pull/analysis/TCS.NS")
    assert response.status_code == 200
    data = response.json()

    assert data["provenance_status"] == "market_data_only"
    assert data["last_price"] > 0
    assert "refuses to hallucinate" in data["provenance_note"]

    # All 8 subjective / detailed modules MUST be None
    assert data["what_changed"] is None
    assert data["business_snapshot"] is None
    assert data["financial_snapshot"] is None
    assert data["trajectory"] is None
    assert data["balance_sheet"] is None
    assert data["cash_quality"] is None
    assert data["narrative_audit"] is None
    assert data["guidance"] is None
    assert data["bull_bear"] is None


def test_invalid_ticker_returns_404():
    """
    CRITICAL CHECK: Unknown/invalid symbols (e.g. INVALIDXYZ.NS) must return HTTP 404.
    Must never invent ₹4,500 Cr revenue or 84/100 credibility scores.
    """
    response = client.get("/api/pull/analysis/INVALIDXYZ.NS")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    detail = data["detail"]
    if isinstance(detail, dict):
        assert detail.get("provenance_status") == "unavailable"
    else:
        assert "not found" in str(detail).lower() or "could not be resolved" in str(detail).lower()


def test_copilot_honest_refusal_for_unindexed():
    """
    Copilot must:
    1. Honestly decline to invent guidance for unindexed stocks.
    2. Route 'Analyze cash conversion ratio & FCF' to the cash-conversion branch (not balance-sheet).
    3. Return only real stored PrimarySourceCitation items with local_filename, SHA-256 document_hash,
       and verbatim exact_quote (never fake Page 72, Note 18, or 'Synthesized directly').
    """
    req_payload = {
        "symbol": "TCS.NS",
        "question": "What is the management forward guidance on margins?"
    }
    response = client.post("/api/copilot/query", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["provenance"] == "market_data_only"
    assert "not been indexed" in data["answer"].lower() or "not indexed" in data["answer"].lower()
    assert len(data["grounded_citations"]) == 0

    # Regression check (B1): Cash-conversion prompt routing must NOT enter balance-sheet branch
    for sym in ["ZOMATO.NS", "TATAMOTORS.NS", "RELIANCE.NS"]:
        cc_res = client.post(
            "/api/copilot/query",
            json={"symbol": sym, "question": "Analyze cash conversion ratio & FCF"}
        )
        assert cc_res.status_code == 200
        cc_data = cc_res.json()
        assert "Cash Flow & Conversion Analysis" in cc_data["answer"]
        assert "Cash Conversion Ratio = Operating Cash Flow (CFO) / Profit After Tax (PAT)" in cc_data["answer"]
        assert "Balance Sheet Grounding" not in cc_data["answer"]
        assert len(cc_data["grounded_citations"]) >= 1

    # Regression check (B2): No Copilot branch may return fabricated exact_quote citations
    test_prompts = [
        "Analyze cash conversion ratio & FCF",
        "Operating EBITDA margin trajectory",
        "Balance sheet debt and liquidity",
        "Audit Q2 FY25 guidance vs delivery",
        "Primary bull vs bear thesis",
        "Company overview",
    ]
    forbidden_fragments = [
        "Synthesized directly",
        "Page 72",
        "Note 18",
        "Page 12, Company Profile",
        "Consolidated EBITDA reached",
        "Consolidated total borrowings stood at",
        "Material risks encompass market competition",
    ]
    for sym in ["ZOMATO.NS", "TATAMOTORS.NS", "RELIANCE.NS"]:
        for prompt in test_prompts:
            r = client.post("/api/copilot/query", json={"symbol": sym, "question": prompt})
            assert r.status_code == 200
            r_data = r.json()
            for cit in r_data["grounded_citations"]:
                assert cit.get("local_filename") is not None
                assert len(cit.get("document_hash", "")) == 64
                quote = cit.get("exact_quote") or ""
                for bad in forbidden_fragments:
                    assert bad not in quote, f"Fabricated citation detected for {sym} ({prompt}): {quote}"
                    assert bad not in (cit.get("page_or_time") or "")


def test_threshold_boundary_validation_and_persistence():
    """
    Server-side parameter boundary validation:
    - volume_multiplier must be between 1.0 and 10.0
    - price_change_pct must be between 0.5 and 50.0
    - Successful updates must persist in SQLite
    """
    # 1. Invalid payload: volume_multiplier below minimum (0.5 < 1.0)
    bad_payload_low = {"volume_multiplier": 0.5, "price_change_pct": 3.0}
    res_low = client.post("/api/config/thresholds", json=bad_payload_low)
    assert res_low.status_code == 422  # Unprocessable Entity

    # 2. Invalid payload: price_change_pct above maximum (75 > 50)
    bad_payload_high = {"volume_multiplier": 2.0, "price_change_pct": 75.0}
    res_high = client.post("/api/config/thresholds", json=bad_payload_high)
    assert res_high.status_code == 422

    # 3. Valid update
    valid_payload = {"volume_multiplier": 2.5, "price_change_pct": 4.5}
    res_valid = client.post("/api/config/thresholds", json=valid_payload)
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert data["thresholds"]["volume_multiplier"] == 2.5
    assert data["thresholds"]["price_change_pct"] == 4.5

    # 4. Verify persistence via GET
    res_get = client.get("/api/config/thresholds")
    assert res_get.status_code == 200
    get_data = res_get.json()
    assert get_data["volume_multiplier"] == 2.5
    assert get_data["price_change_pct"] == 4.5


def test_evidence_endpoint_provenance_and_hash():
    """Verify the dedicated Evidence Drawer endpoint returns verified hashes."""
    res_zomato = client.get("/api/documents/ZOMATO.NS/evidence")
    assert res_zomato.status_code == 200
    z_data = res_zomato.json()
    assert z_data["provenance_status"] == "indexed_primary"
    assert z_data["what_changed_evidence"]["document_hash"] is not None
    assert len(z_data["what_changed_evidence"]["document_hash"]) == 64

    # Unindexed ticker returns 404 on evidence
    res_unknown = client.get("/api/documents/INVALIDXYZ.NS/evidence")
    assert res_unknown.status_code == 404


def test_unified_push_alerts_contain_both_anomalies_and_filings():
    """
    CRITICAL CHECK: Alert stream must be unified, returning:
    - Market anomaly alerts (price moves, volume spikes)
    - Material exchange filing alerts (results, demergers, M&A) when historical Q2 FY25 window is requested.
    """
    res = client.get("/api/push/alerts?volume_mult=2.0&price_pct=3.0&window_hours=48&as_of=2024-11-08T23:59:59Z")
    assert res.status_code == 200
    data = res.json()
    assert "alerts" in data
    alerts = data["alerts"]
    assert len(alerts) > 0

    alert_types = {a["alert_type"] for a in alerts}
    # Must contain both categories in the unified alert stream
    assert "MARKET_ANOMALY" in alert_types
    assert "MATERIAL_FILING" in alert_types

    # Check filing alert fields
    filing_alerts = [a for a in alerts if a["alert_type"] == "MATERIAL_FILING"]
    assert len(filing_alerts) >= 2
    for fa in filing_alerts:
        assert fa["category"] in [
            "results",
            "M&A",
            "management_change",
            "litigation",
            "capex",
            "investor_meetings",
            "fund_raise",
            "earnings_call",
        ]
        assert len(fa["detail"]) > 10
        assert "Today" not in fa["timestamp"]


def test_exchange_announcement_feed_db():
    """Verify SQLite announcements_feed stores filing ID, URL, ISO publication_timestamp, hash, status, and exact categories."""
    res = client.get("/api/push/feed/db")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    item0 = data["feed"][0]
    assert "filing_id" in item0
    assert "original_url" in item0
    assert "publication_timestamp" in item0
    assert item0["publication_timestamp"].endswith("Z") and "T" in item0["publication_timestamp"]
    assert "fetch_timestamp" in item0
    assert "document_hash" in item0
    assert len(item0["document_hash"]) == 64
    assert item0["extraction_status"] == "VERIFIED_EXTRACTED"

    # Regression check (A): Zomato QIP = fund_raise, Tata transcript = earnings_call
    by_id = {item["filing_id"]: item for item in data["feed"]}
    assert by_id["ann-zomato-qip"]["category"] == "fund_raise"
    assert by_id["ann-zomato-qip"]["publication_timestamp"] == "2024-10-22T16:00:00Z"
    assert by_id["ann-tatamotors-transcript"]["category"] == "earnings_call"
    assert by_id["ann-tatamotors-transcript"]["publication_timestamp"] == "2024-11-08T19:30:00Z"

    digest_res = client.get("/api/push/digest?window_hours=720&as_of=2024-11-08T23:59:59Z")
    assert digest_res.status_code == 200
    digest_by_id = {
        a["id"]: a for a in digest_res.json()["high_signal_announcements"]
    }
    assert digest_by_id["ann-zomato-qip"]["category"] == "fund_raise"
    assert digest_by_id["ann-tatamotors-transcript"]["category"] == "earnings_call"


def test_historical_2024_filings_excluded_from_current_24h_window_and_included_in_historical_window():
    """
    REGRESSION CHECK (Timestamp Truth & Window Filtering):
    1. Every record in ANNOUNCEMENTS_DATA uses a real ISO-8601 publication_timestamp (no synthetic timestamp_hours_ago).
    2. A 2024 filing is strictly excluded from a current 24h window (/api/push/digest?window_hours=24 and /api/push/alerts?window_hours=24).
    3. When the explicit historical window is requested (as_of=2024-11-08T23:59:59Z):
       - window_hours=24 includes only the Nov 8, 2024 filings and excludes Oct 2024 filings.
       - window_hours=720 includes the Oct 14 – Nov 8, 2024 Q2 FY25 filings.
    4. Historical items are never labeled 'Today' or 'Intraday'.
    """
    from app.services.announcements import ANNOUNCEMENTS_DATA, parse_iso_timestamp

    for item in ANNOUNCEMENTS_DATA:
        assert "timestamp_hours_ago" not in item, f"Synthetic timestamp_hours_ago found in {item['id']}"
        assert "publication_timestamp" in item
        dt = parse_iso_timestamp(item["publication_timestamp"])
        assert dt.year == 2024

    # 1. Current live 24h window -> must exclude all 2024 filings
    live_digest = client.get("/api/push/digest?window_hours=24").json()
    assert live_digest["feed_mode"] == "live_current_window"
    assert live_digest["total_announcements"] == 0
    assert live_digest["high_signal_announcements"] == []
    assert live_digest["routine_announcements"] == []

    live_alerts = client.get("/api/push/alerts?window_hours=24").json()
    live_filing_alerts = [a for a in live_alerts["alerts"] if a["alert_type"] == "MATERIAL_FILING"]
    assert live_filing_alerts == []

    # 2. Historical 24h window anchored at 2024-11-08T23:59:59Z -> includes Nov 8 filings only, excludes Oct filings
    hist_24h = client.get("/api/push/digest?window_hours=24&as_of=2024-11-08T23:59:59Z").json()
    assert hist_24h["feed_mode"] == "historical_q2_fy25_demo"
    assert hist_24h["as_of_timestamp"] == "2024-11-08T23:59:59Z"
    ids_24h = {a["id"] for a in hist_24h["high_signal_announcements"]}
    assert "ann-tatamotors-results" in ids_24h
    assert "ann-tatamotors-demerger" in ids_24h
    assert "ann-tatamotors-transcript" in ids_24h
    assert "ann-zomato-q2" not in ids_24h
    assert "ann-reliance-results" not in ids_24h

    # 3. Historical 720h (30D) window anchored at 2024-11-08T23:59:59Z -> includes Oct 14 – Nov 8 Q2 FY25 filings
    hist_720h = client.get("/api/push/digest?window_hours=720&as_of=2024-11-08T23:59:59Z").json()
    ids_720h = {a["id"] for a in hist_720h["high_signal_announcements"]}
    assert "ann-zomato-q2" in ids_720h
    assert "ann-zomato-qip" in ids_720h
    assert "ann-reliance-results" in ids_720h
    assert "ann-tatamotors-results" in ids_720h

    for ann in hist_720h["high_signal_announcements"]:
        assert "Today" not in ann["timestamp"]
        assert "Intraday" not in ann["timestamp"]
        assert ann["publication_timestamp"].startswith("2024-")


def test_fallback_market_data_exposes_cached_demo_status_and_as_of_date(monkeypatch):
    """
    REGRESSION CHECK (Live-First & Fallback Market Data Truth):
    1. fetch_ticker_eod attempts live EOD via _try_live_yfinance_eod first when prefer_live=True.
    2. When live EOD is unavailable, fallback/cached prices in market_data.py, /api/portfolio,
       /api/push/alerts, and /api/pull/analysis explicitly expose cached/demo status
       ('cached_demo_snapshot') and as_of_date ('2024-11-08'), and never label static prices as 'Today (EOD)'.
    """
    import app.services.market_data as md

    # Case 1: Live EOD succeeds -> must return live_eod with bar date
    md._CACHE.clear()
    live_called = []

    def fake_live_success(sym: str):
        live_called.append(sym)
        return {
            "symbol": sym,
            "price": 270.25,
            "change_pct": 1.50,
            "volume": 35000000,
            "avg_20d_volume": 28000000,
            "volume_multiplier": 1.25,
            "live": True,
            "data_status": "live_eod",
            "as_of_date": "2026-11-13",
            "valid": True,
        }

    monkeypatch.setattr(md, "_try_live_yfinance_eod", fake_live_success)
    live_metric = md.fetch_ticker_eod("ZOMATO.NS", prefer_live=True)
    assert "ZOMATO.NS" in live_called
    assert live_metric["live"] is True
    assert live_metric["data_status"] == "live_eod"
    assert live_metric["as_of_date"] == "2026-11-13"

    # Case 2: Live EOD unavailable -> must fall back honestly with cached_demo_snapshot and 2024-11-08
    md._CACHE.clear()
    monkeypatch.setattr(md, "_try_live_yfinance_eod", lambda sym: None)

    metric = md.fetch_ticker_eod("ZOMATO.NS", prefer_live=True)
    assert metric["live"] is False
    assert metric["data_status"] == "cached_demo_snapshot"
    assert metric["as_of_date"] == "2024-11-08"

    p_res = client.get("/api/portfolio")
    assert p_res.status_code == 200
    p_data = p_res.json()
    assert p_data["data_status"] == "cached_demo_snapshot"
    assert p_data["as_of_date"] == "2024-11-08"
    assert all(row["data_status"] == "cached_demo_snapshot" for row in p_data["portfolio"])
    assert all(row["as_of_date"] == "2024-11-08" for row in p_data["portfolio"])

    a_res = client.get("/api/push/alerts?window_hours=24")
    assert a_res.status_code == 200
    a_data = a_res.json()
    market_alerts = [a for a in a_data["alerts"] if a["alert_type"] == "MARKET_ANOMALY"]
    assert len(market_alerts) > 0
    for ma in market_alerts:
        assert ma["is_live"] is False
        assert ma["data_status"] == "cached_demo_snapshot"
        assert ma["as_of_date"] == "2024-11-08"
        assert "Cached Demo Snapshot (As of 2024-11-08)" in ma["timestamp"]
        assert "Today" not in ma["timestamp"]

    pull_res = client.get("/api/pull/analysis/ZOMATO.NS")
    assert pull_res.status_code == 200
    pull_data = pull_res.json()
    assert pull_data["market_data_status"] == "cached_demo_snapshot"
    assert pull_data["market_as_of_date"] == "2024-11-08"


def test_numeric_formulas_and_derived_ratios_are_explicit_and_consistent():
    """
    REGRESSION CHECK (Numeric Formula Truth):
    Every displayed derived ratio (EBITDA margin, PAT margin, Cash Conversion CFO/PAT, and FCF CFO-Capex)
    must mathematically match its source values and include an explicit formula string.
    """
    for sym in ["ZOMATO.NS", "TATAMOTORS.NS", "RELIANCE.NS"]:
        res = client.get(f"/api/pull/analysis/{sym}")
        assert res.status_code == 200
        data = res.json()

        fs = data["financial_snapshot"]
        exp_ebitda_m = round((fs["ebitda_cr"] / fs["revenue_cr"]) * 100.0, 2)
        exp_pat_m = round((fs["pat_cr"] / fs["revenue_cr"]) * 100.0, 2)
        assert fs["ebitda_margin"] == exp_ebitda_m
        assert fs["pat_margin"] == exp_pat_m
        assert "EBITDA / Revenue" in fs["ebitda_margin_formula"]
        assert "PAT / Revenue" in fs["pat_margin_formula"]

        cq = data["cash_quality"]
        exp_cc = round(cq["cfo_cr"] / cq["pat_cr"], 2)
        exp_fcf = round(cq["cfo_cr"] - cq["capital_expenditure_cr"], 2)
        assert cq["cash_conversion_ratio"] == exp_cc
        assert cq["fcf_cr"] == exp_fcf
        assert "CFO / PAT" in cq["cash_conversion_formula"]
        assert "CFO - Capex" in cq["fcf_formula"]

    digest = client.get("/api/push/digest?window_hours=720&as_of=2024-11-08T23:59:59Z").json()
    for ann in digest["high_signal_announcements"]:
        rb = ann.get("results_breakdown")
        if rb:
            rev = rb["revenue"]["current"]
            ebitda = rb["ebitda"]["current"]
            pat = rb["pat"]["current"]
            assert rb["ebitda_margin_pct"] == round((ebitda / rev) * 100.0, 2)
            assert rb["pat_margin_pct"] == round((pat / rev) * 100.0, 2)
            assert "EBITDA / Revenue" in rb["ebitda_margin_formula"]
            assert "PAT / Revenue" in rb["pat_margin_formula"]


def test_cryptographic_provenance_and_verbatim_quotes():
    """
    STRICT PROVENANCE & TRUTH AUDIT:
    Verifies that every single citation across all indexed companies:
    1. Points to an actual local PDF in backend/app/data/documents/
    2. Has a calculated SHA-256 hash strictly matching the stored hash
    3. Has an 'exact_quote' that exists verbatim in the normalized text of that PDF.
    4. Runs cleanly under a strict Windows CP1252 console encoding without UnicodeEncodeError.
    """
    import sys
    import subprocess
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    from verify_provenance import validate_provenance
    passed, errors = validate_provenance()
    assert passed is True, f"Provenance validation failed with {len(errors)} errors: {errors}"

    # Verify CLI execution under strict CP1252 console encoding
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "cp1252"
    script_path = os.path.join(backend_dir, "verify_provenance.py")
    proc = subprocess.run([sys.executable, script_path], env=env, capture_output=True, text=True, encoding="cp1252")
    assert proc.returncode == 0, f"verify_provenance.py failed under cp1252: {proc.stderr}"
    assert "Numeric Formulas Verified" in proc.stdout


def test_audit_summary_endpoint_derives_real_values_and_tracks_feed_and_market_modes(monkeypatch):
    """
    REGRESSION CHECK (Evidence Health Panel & GET /api/audit/summary):
    1. Derives indexed_ticker_count/list, local_pdf_count, verified_citation_count,
       formula_audit_status, market_data_status/as_of_date, current_feed_mode, and
       explicit submission_blockers from live store and verifier data.
    2. Dynamically tracks feed mode ('live_current_window' vs 'historical_q2_fy25_demo')
       and market data status ('cached_demo_snapshot' vs 'live_eod' / 'mixed_live_and_cached').
    """
    import time
    import app.services.market_data as md

    md._CACHE.clear()

    # 1. Default call (live current window, cached market snapshot)
    res_live_win = client.get("/api/audit/summary")
    assert res_live_win.status_code == 200
    data = res_live_win.json()

    assert data["provenance_audit_passed"] is True
    assert data["overall_status"] == "amber"
    assert data["indexed_ticker_count"] == len(VERIFIED_PRIMARY_STORE) == 3
    assert data["indexed_tickers"] == ["ZOMATO.NS", "TATAMOTORS.NS", "RELIANCE.NS"]
    assert data["portfolio_ticker_count"] == 18
    assert data["market_data_only_ticker_count"] == 15
    assert data["ad_hoc_ticker_count"] == 4
    assert data["local_pdf_count"] == 5
    assert len(data["local_pdfs"]) == 5
    for pdf in data["local_pdfs"]:
        assert len(pdf["sha256"]) == 64
        assert pdf["hash_verified"] is True

    assert data["verified_citation_count"] == 18
    assert data["total_citation_count"] == 18
    assert data["verified_quote_count"] == 18
    assert data["what_changed_evidence_verified_count"] == 3
    assert data["narrative_audit_evidence_verified_count"] == 3
    assert data["sqlite_announcements_verified_count"] == data["sqlite_announcements_total"] == 9
    assert data["formula_audit_status"] == "passed"
    assert data["formula_audit_passed"] is True
    assert data["formula_checks_passed"] == 18
    assert data["formula_checks_total"] == 18

    assert data["market_data_status"] == "cached_demo_snapshot"
    assert data["market_as_of_date"] == "2024-11-08"
    assert data["live_ticker_count"] == 0
    assert data["cached_ticker_count"] == 18

    assert data["current_feed_mode"] == "live_current_window"
    assert data["feed_mode"] == "live_current_window"

    # Submission blockers must be derived from COVERING_NOTE.md/README.md + runtime scope
    assert isinstance(data["submission_blockers"], list)
    assert len(data["submission_blockers"]) >= 5
    joined_blockers = " | ".join(data["submission_blockers"])
    assert "SUBMISSION BLOCKER" in joined_blockers
    assert "market_data_only" in joined_blockers
    assert "2024-11-08" in joined_blockers

    # Drill-down metrics check
    metrics_by_id = {m["id"]: m for m in data["metrics"]}
    assert set(metrics_by_id.keys()) == {
        "indexed_tickers",
        "local_pdfs",
        "verified_citations",
        "formula_audit",
        "market_data",
        "feed_mode",
        "submission_blockers",
    }
    assert metrics_by_id["local_pdfs"]["status"] == "green"
    assert metrics_by_id["verified_citations"]["status"] == "green"
    assert metrics_by_id["formula_audit"]["status"] == "green"
    assert metrics_by_id["indexed_tickers"]["status"] == "amber"
    assert metrics_by_id["market_data"]["status"] == "amber"
    assert metrics_by_id["feed_mode"]["status"] == "green"
    assert metrics_by_id["submission_blockers"]["status"] == "amber"

    # 2. Historical Q2 FY25 demo window
    res_hist = client.get("/api/audit/summary?as_of=2024-11-08T23:59:59Z")
    assert res_hist.status_code == 200
    hist_data = res_hist.json()
    assert hist_data["current_feed_mode"] == "historical_q2_fy25_demo"
    assert hist_data["as_of_timestamp"] == "2024-11-08T23:59:59Z"
    hist_metrics = {m["id"]: m for m in hist_data["metrics"]}
    assert hist_metrics["feed_mode"]["status"] == "amber"

    # 3. Live market data state reflection when _CACHE has a live EOD entry
    md._CACHE["ZOMATO.NS"] = {
        "timestamp": time.time(),
        "live_attempted": True,
        "data": {
            "symbol": "ZOMATO.NS",
            "price": 272.0,
            "change_pct": 1.2,
            "volume": 30000000,
            "avg_20d_volume": 25000000,
            "volume_multiplier": 1.2,
            "live": True,
            "data_status": "live_eod",
            "as_of_date": "2026-11-13",
            "valid": True,
        },
    }
    res_mixed = client.get("/api/audit/summary")
    assert res_mixed.status_code == 200
    mixed_data = res_mixed.json()
    assert mixed_data["market_data_status"] == "mixed_live_and_cached"
    assert mixed_data["live_ticker_count"] == 1
    assert mixed_data["cached_ticker_count"] == 17
    assert mixed_data["market_as_of_date"] == "2026-11-13"
    md._CACHE.clear()


def test_audit_summary_detects_formula_or_citation_drift_dynamically(monkeypatch):
    """
    REGRESSION CHECK (Zero Hardcoded Audit Claims):
    Proves GET /api/audit/summary dynamically runs formula and citation verification
    rather than returning hardcoded 'passed' or static counts.
    """
    zomato_fs = VERIFIED_PRIMARY_STORE["ZOMATO.NS"]["financial_snapshot"]
    monkeypatch.setitem(zomato_fs, "ebitda_margin", 99.99)

    res = client.get("/api/audit/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["provenance_audit_passed"] is False
    assert data["formula_audit_status"] == "failed"
    assert data["formula_audit_passed"] is False
    assert data["formula_checks_passed"] == 17
    assert data["formula_checks_total"] == 18
    assert data["overall_status"] == "red"
    assert any("EBITDA margin mismatch" in err for err in data["provenance_errors"])
    assert any("EBITDA margin mismatch" in b for b in data["submission_blockers"])
