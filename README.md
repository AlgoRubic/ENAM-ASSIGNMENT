# FINN — Financial Investment Agent
**To:** assessment@enam.com
**Subject:** IIT Delhi – AI Engineer - 2027

- **Candidate:** _[YOUR NAME]_
- **GitHub:** _[REPO URL]_
- **Live demo (phone):** _[DEPLOYED URL]_
- **AI build history:** _[LINKS TO AI SESSION LOGS]_

---

## What this is
FINN is a mobile-first prototype with two parts. **Push** is a portfolio digest plus alerts. **Pull** is on-demand company research. I deliberately narrowed the scope: research is limited to three companies, so the prototype stays small and honest rather than broad and invented.

## What actually works
| Area | Status |
|---|---|
| Pull research for **ZOMATO.NS, TATAMOTORS.NS, RELIANCE.NS** | Hand-curated store (`backend/app/data/verified_primary_store.py`). Each claim carries a document ID, period, filing date and page reference. |
| "What changed?" card + evidence drawer | Implemented. One tap opens the document ID, page, hash field, snippet and original URL. |
| Other valid NSE tickers | Returns `market_data_only`: price and volume only. Every research module is `null`. |
| Invalid tickers (e.g. `INVALIDXYZ`) | HTTP 404 with `provenance_status: unavailable`. |
| Copilot for unindexed tickers | Declines explicitly and returns no citations. |
| Alerts | Volume ≥ X× 20-day average, \|price move\| ≥ Y%, plus material-filing alerts. All are served from the backend. |
| Thresholds | Bounds-checked on the server (vol 1–10×, price 0.5–50%) and saved in SQLite. |
| Portfolio load | Served from the SQLite cache. Page load makes no sequential Yahoo calls. |
| Frontend | No client-side fixture data. A failed request shows an explicit Unavailable or Offline state. |
| Tests | `pytest`: 8 tests covering known ticker, unknown ticker, invalid ticker, copilot refusal, threshold bounds/persistence, evidence provenance, and unified alerts. |

## Known limitations (stated plainly)
- **No live exchange ingestion yet.** Announcements are a curated, server-side list. There is no NSE/BSE fetcher, scheduler or PDF parser.
- **Curated figures were entered by hand.** They have not been extracted automatically from downloaded PDFs. The `document_hash` values are **placeholders**, not hashes of downloaded files. Some `source_url`s may not resolve.
- Portfolio prices come from a seeded reference snapshot (`live: false`), not a live feed.
- Announcements for companies outside the three indexed names are illustrative demo fixtures.

## Next steps
1. A real BSE announcements poller for the three companies. Store the filing ID, URL, publish/fetch timestamps, SHA-256 of the downloaded PDF, and extraction status.
2. Extract Revenue/EBITDA/PBT/PAT from the result PDFs, compute QoQ/YoY, and link each figure to its source page.
3. A four-quarter guidance ledger linked to the actual transcript pages.

## Run
```powershell
./run.ps1          # creates venv, installs deps, starts API :8000 and UI :5173
./venv/Scripts/pytest
```
