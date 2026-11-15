# FINN — Financial Investment Agent
**To:** assessment@enam.com
**Subject:** IIT Delhi – AI Engineer - 2027

> [!WARNING]
> **SUBMISSION BLOCKERS — REPLACE PLACEHOLDERS BELOW BEFORE SENDING TO `assessment@enam.com`:**
> - **Candidate:** **[SUBMISSION BLOCKER: Insert Candidate Full Name & Contact]**
> - **GitHub Repository:** **https://github.com/AlgoRubic/ENAM-ASSIGNMENT**
> - **Deployed Mobile Demo:** **[SUBMISSION BLOCKER: Replace temporary URL with permanent deployed URL]** https://folder-sql-coral-certain.trycloudflare.com
> - **AI Build History & Logs:** **[SUBMISSION BLOCKER: Add both public chat links — Codex/ChatGPT and Antigravity — see AI_BUILD_HISTORY.md]**

---

## Executive Summary
FINN is an institutional mobile-first financial intelligence agent built for public-markets investors. It operates on two foundational rails:
1. **Push Feed**: High-signal windowed announcements digest (filtering routine certificates/ESOPs and prioritizing material corporate actions) and unified alerts (monitoring daily price breaks, volume surges >2x 20D average, and material regulatory filings).
2. **Pull Terminal**: On-demand primary research engine grounded strictly in indexed Q2 FY25 exchange filings, earnings-call transcript (Tata Motors), and investor presentation (Reliance) for benchmark holdings (**ZOMATO.NS**, **TATAMOTORS.NS**, and **RELIANCE.NS**), with an evidence-first "What Changed?" card and one-tap source drawer.

In strict adherence to the challenge brief, FINN enforces a **zero-fabrication data trust standard**:
- Verified companies return primary-grounded modules with real filing IDs, page references, and SHA-256 document checksums.
- Real NSE tickers not yet indexed return `market_data_only` with subjective modules set to `null` (never synthetic estimates or hallucinated concall quotes).
- Invalid tickers (e.g., `INVALIDXYZ.NS`) return **HTTP 404** with `provenance_status: unavailable`.

---

## Technical Architecture & Implementation Status

| Feature / Module | Implementation & Verification Status |
|---|---|
| **Primary Document Store** | Indexed Q2 FY25 exchange filings (quarter ended Sep 30, 2024), earnings-call transcript (Tata Motors), and investor presentation (Reliance) for **ZOMATO.NS**, **TATAMOTORS.NS**, and **RELIANCE.NS**. Stored in `backend/app/data/verified_primary_store.py` with downloaded PDFs in `backend/app/data/documents/`. |
| **Authentic Document Hashes** | Real SHA-256 checksums computed directly on downloaded official filings (e.g. Zomato `6e9351...`, Tata Motors `e8dc4c...`, Reliance `f78f4a...`). |
| **"What Changed?" Card** | Evidence-first card in Pull Terminal highlighting the latest material corporate development, prior expectation contradicted, investor impact, and a one-tap primary evidence drawer. |
| **Exchange Ingestion Feed** | Persistent SQLite `announcements_feed` table recording `filing_id`, `original_url`, `publication_timestamp`, `fetch_timestamp`, `document_hash`, and `extraction_status` (`VERIFIED_EXTRACTED`). Queryable via `/api/push/feed/db`. |
| **Sub-15ms Page Load** | SQLite persistent cache (`finn.db`) pre-seeded with portfolio stocks, eliminating blocking sequential Yahoo Finance network requests. |
| **Configurable Alert Engine** | Unified alert stream covering volume multipliers (1.0x–10.0x), price change bands (±0.5%–50.0%), and material exchange filings. Bounds validated on backend and persisted in SQLite. |
| **Honest Refusal & 404** | Invalid symbols return clean HTTP 404. Unindexed NSE tickers return `market_data_only` without relabelling or disguising data. |
| **Evidence Health Panel** | Reviewer-facing mobile card reachable from the top Header (`Evidence 18/18` pill) and Audit tab, powered by `GET /api/audit/summary`. Dynamically reports indexed ticker count/list, local PDF count, verified citation count, formula-audit status, market-data status/as-of, active feed mode, and explicit submission blockers with honest green/amber states and drill-down metrics. |
| **Frontend UI/UX** | Apple-grade dark theme (OLED `#000000`, frosted glass, iOS segmented controls, smooth shimmer skeletons). 0 oxlint warnings, 0 build errors. Accessible modal dialogs with Escape key listeners. |
| **Automated Test Suite** | 15 pytest tests covering known ticker provenance, unindexed refusal, 404 handling, copilot honest refusal & cash-conversion routing, boundary validation, SQLite persistence, evidence SHA-256 hashes, unified alerts, SQLite exchange feed, ISO timestamp window filtering (excluding 2024 filings from live 24h windows), live-first vs cached/demo market data status & as-of dates, explicit numeric formula verification (`EBITDA/Revenue`, `PAT/Revenue`, `CFO/PAT`, `CFO-Capex`), strict cryptographic PDF provenance with verbatim quote matching, and `/api/audit/summary` live telemetry & drift detection. |

---

## Verified Primary Documents & Checksums

| Company | Reporting Period | Official Source Document | SHA-256 Checksum |
|---|---|---|---|
| **Zomato Ltd (Eternal)** | Q2 FY25 (Sep 30, 2024) | [Shareholder Letter & Results PDF](https://b.zmtcdn.com/investor-relations/0b2742ccddafa54e6310991ec25670ae_1729591296.pdf) | `6e9351a0eb33236f208a911270351a70d1be3d3a945e937678b01428ae8e70c5` |
| **Tata Motors Ltd** | Q2 FY25 (Sep 30, 2024) | [Consolidated Results Press Release](https://www.tatamotors.com/wp-content/uploads/2024/11/Tata-Motors-Group-Q2-FY25-press-release.pdf) | `e8dc4cea6b055952994b8224a5bb3ffd1b21b14b7c51bed7294cb57c17d8644f` |
| **Tata Motors Ltd** | Q2 FY25 (Nov 08, 2024) | [Earnings Call Transcript PDF](https://www.tatamotors.com/wp-content/uploads/2024/11/TML-Q2-FY25-Earnings-Call-Transcript.pdf) | `8c30918d2ff6c23b4051738ad3c106e071ecfa282042855f6568cbb2d94ef552` |
| **Reliance Industries** | Q2 FY25 (Sep 30, 2024) | [Financial Performance Release](https://rilstaticasset.akamaized.net/sites/default/files/2024-10/14102024-Media-Release-RIL-Q2-FY2024-25-Financial-and-Operational-Performance.pdf) | `f78f4ade6ab7640fb74560b76505754fe5751c3602d61925c764c177875d1097` |
| **Reliance Industries** | Q2 FY25 (Oct 14, 2024) | [Analyst Presentation PDF](https://rilstaticasset.akamaized.net/sites/default/files/2024-10/RIL-2Q-FY25-Analyst-Presentation-14Oct24.pdf) | `bddbd34e1019000a1a1c760f744e639eaf048d3f8854c7654654aa5e225714d5` |

Local document copies are also served directly via FastAPI at `/api/documents/download/{filename}` for guaranteed offline demo resilience.

---

## Getting Started & Local Reproduction

### Prerequisites
- Python 3.10+
- Node.js 18+

### Setup & Run
```powershell
# 1. Run the auto-bootstrapping launcher (creates virtualenv, installs pip & npm deps, starts both servers)
./run.ps1
# or on CMD:
run.bat
```
- Backend API runs on: `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
- Frontend App runs on: `http://localhost:5173`

### Run Verification Test Suite
```powershell
# 1. Automated provenance & verbatim quote audit across 5 official PDF documents
./venv/Scripts/python backend/verify_provenance.py

# 2. Comprehensive pytest suite (isolated DB, 0 mutations to committed database)
./venv/Scripts/pytest backend/tests/test_provenance_and_integrity.py -v
```
All 15 automated tests pass (15/15).
