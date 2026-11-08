# FINN: Mobile-First Financial Investment Agent
### Built for the ENAM Holdings AI Engineer Build Challenge (IIT Delhi – 2027)

> **"An investor today is drowning in information — prices, filings, announcements, results, macro. The scarce skill is not aggregating information. It's filtering it: surfacing the few things that actually matter and burying everything else, beautifully."**

---

## ⚡ Overview

FINN is an institutional-grade, mobile-first intelligence layer built for public-markets investors. It replaces noisy aggregators with high-conviction primary signal via two modes of interaction:

- **Push Mode**: The agent proactively surfaces what changed across your portfolio and why it matters.
  - **Windowed Digest (24h/48h/7d)**: Ingests exchange filings across 18 Indian companies, classifies them into 17 exchange categories, and highlights high-signal filings (Results, M&A, Management Changes, Litigation) while collapsing routine compliance paperwork.
  - **Results First-Cut**: Auto-extracts **Revenue, EBITDA, PBT, and PAT** with **QoQ** and **YoY** deltas and EBITDA margins.
  - **Executive Pedigree**: Automatically pulls incoming leadership bios, former roles, and strategic implications for management changes.
  - **Triggered EOD Alerts**: Watches daily volume and price moves, flagging unusual accumulation/distribution (e.g. Volume > 2.0x 20-day average or daily moves beyond ±3.0%), with configurable threshold sliders.

- **Pull Mode**: On-demand primary research grounded strictly in **Annual Reports + Concall Transcripts**.
  - **8 Core Investment Modules**: Business Snapshot & Revenue Mix, Financial Snapshot & Ratios, Multi-Year Trajectory, Balance Sheet & Leverage, Cash Quality & Conversion, Narrative vs. Numbers Audit, Guidance Tracker, and Grounded Bull vs. Bear Case.
  - **Narrative vs. Numbers Audit**: Audits management promises made in concall transcripts over the trailing 4 quarters against actual delivery in regulatory filings.
  - **Generalizes to ANY NSE Ticker**: Works dynamically for any NSE symbol (e.g. `RELIANCE.NS`, `TCS.NS`, `CDSL.NS`, `KAYNES.NS`, `BEL.NS`).
  - **Zero Broker Slop**: Strictly excludes secondary broker opinions and news commentary; every insight cites the exact document and page/timestamp.

---

## 🏗️ Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │          FINN Mobile Web Terminal            │
                       │   (React 19 + Tailwind CSS + Lucide Icons)   │
                       └──────────────────────┬───────────────────────┘
                                              │ REST / JSON
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │             FastAPI Backend                  │
                       │           (Python 3.10 + Uvicorn)            │
                       └───────┬──────────────┬──────────────┬────────┘
                               │              │              │
             ┌─────────────────▼──┐    ┌──────▼──────┐   ┌───▼──────────────────┐
             │   yfinance Engine  │    │ Announcements│   │ Fundamentals Engine  │
             │  • Live EOD Prices │    │ • 17 Classes│   │ • 8 Core Modules     │
             │  • 20D Volume Avg  │    │ • QoQ/YoY   │   │ • Cash Conversion    │
             │  • Anomaly Alerts  │    │ • Exec Bios │   │ • Narrative Audit    │
             └────────────────────┘    └─────────────┘   └──────────────────────┘
                                              │
                                   ┌──────────▼──────────┐
                                   │  Copilot AI Router  │
                                   │ • Primary Citations │
                                   │ • Gemini / Heuristic│
                                   └─────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### One-Click Launch (Windows)
Double-click `run.bat` or execute in PowerShell:
```powershell
.\run.ps1
```
This automatically boots:
- **Backend API**: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`)
- **Mobile Terminal**: `http://localhost:5173`

---

## 📱 Mobile Portfolio Set
- **Core 18 Portfolio Stocks**: RELIANCE, TCS, HDFCBANK, INFY, TATAMOTORS, ICICIBANK, ITC, LT, SUNPHARMA, TITAN, BHARTIARTL, BAJFINANCE, ZOMATO, HAL, POLYCAB, TRENT, DEEPAKNTR, DIXON.
- **Ad-Hoc Research Demo Tickers**: CDSL, KAYNES, DMART, BEL (+ Any custom NSE ticker).

---

## 📄 Submission Files
- `COVERING_NOTE.md` — Short writeup ready for `assessment@enam.com`.
- `backend/` — Full FastAPI server and data extraction services.
- `frontend/` — Mobile-first responsive web client.
