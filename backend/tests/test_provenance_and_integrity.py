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
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.data.verified_primary_store import VERIFIED_PRIMARY_STORE

client = TestClient(app)


def test_health_check():
    """Verify health endpoint reports correct indexed status and primary discipline."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ZOMATO.NS" in data["indexed_companies"]
    assert "TATAMOTORS.NS" in data["indexed_companies"]
    assert "RELIANCE.NS" in data["indexed_companies"]
    assert data["cache_layer"] == "SQLite (finn.db)"


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

        # Narrative vs Numbers 4-Quarter Audit verification
        narrative = data["narrative_audit"]
        assert narrative["credibility_score"] >= 0 and narrative["credibility_score"] <= 100
        assert len(narrative["quarters_audited"]) == 4
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
    """Copilot must honestly decline to invent guidance for unindexed stocks."""
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
    - Material exchange filing alerts (results, demergers, M&A)
    """
    res = client.get("/api/push/alerts?volume_mult=2.0&price_pct=3.0&window_hours=48")
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
        assert fa["category"] in ["results", "M&A", "management_change", "litigation"]
        assert len(fa["detail"]) > 10


def test_exchange_announcement_feed_db():
    """Verify SQLite announcements_feed stores filing ID, URL, publication date, hash, and status."""
    res = client.get("/api/push/feed/db")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    item0 = data["feed"][0]
    assert "filing_id" in item0
    assert "original_url" in item0
    assert "publication_timestamp" in item0
    assert "fetch_timestamp" in item0
    assert "document_hash" in item0
    assert len(item0["document_hash"]) == 64
    assert item0["extraction_status"] == "VERIFIED_EXTRACTED"
