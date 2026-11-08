# Covering Note: FINN — Financial Investment Agent

**To:** assessment@enam.com  
**Subject:** IIT Delhi – AI Engineer - 2027  
**Candidate Name:** [Your Name]  
**Repository:** [GitHub URL]  
**Live Demo:** [Deployed Link / Local Host]  

---

### 1. What I Built
I built **FINN** — an institutional, mobile-first intelligence layer designed for public-markets investors managing high-conviction Indian equity portfolios. Instead of drowning investors in raw exchange filings and financial news noise, FINN ruthlessly prioritizes signal over aggregation through two core modes:

1. **Push (Proactive Intelligence & Triggered Alerts)**:
   - **Windowed Digest (24h/48h/7d)**: Ingests exchange disclosures across an 18-company mock portfolio across sectors and sizes, classifying them into the 17 exchange announcement categories. It prioritizes material events (Results, M&A, Management Changes, Litigation) at the top while collapsing routine paperwork (ESOP allotments, compliance certificates) into a discreet background drawer.
   - **Enriched Presentation**:
     - *Management Changes*: Does not stop at "CFO resigned." Pulls the incoming executive's career pedigree, former employer, and strategic capital allocation implications.
     - *Quarterly Results First-Cut*: Extracts headline numbers (**Revenue, EBITDA, PBT, PAT**) with instant **QoQ** and **YoY** percentage deltas, EBITDA margin, and an executive key takeaway.
   - **Triggered EOD Alerts**: Watches daily EOD price and volume data via `yfinance` to detect institutional accumulation/distribution (e.g. volume > 2.0x 20-day moving average or price moves beyond ±3%). Both thresholds are dynamically configurable by the investor.

2. **Pull (Primary-Grounded On-Demand Deep-Dive)**:
   - Evaluates any NSE ticker across 8 structured investment modules: **Business Snapshot & Revenue Mix, Financial Snapshot & Ratios, Trajectory, Balance Sheet & Leverage, Cash Quality & Conversion, Narrative vs. Numbers Audit, Guidance Tracker, and Bull vs. Bear Case**.
   - **Narrative vs. Numbers Audit**: Audits management promises in concall transcripts over the trailing 4 quarters against actual reported delivery in regulatory filings, assigning a credibility score and isolating where corporate narratives diverge from financial reality.
   - **Zero Broker Slop Discipline**: Every analytical module and claim is strictly grounded in primary sources (Audited Annual Reports, BSE/NSE Exchange Filings, and Concall Transcripts) with exact citations, stripping out broker notes and unverified secondary opinions.
   - **Interactive Copilot Agent**: Low-latency conversational terminal that answers deep balance sheet and guidance questions with verified primary excerpts.

---

### 2. Key Decisions and Trade-Offs

- **Primary Data Purity vs. Web Scraping Latency**:
  - *Decision*: Ground the pull analysis exclusively in primary filings and transcripts rather than scraping news feeds or broker notes.
  - *Trade-off*: We sacrifice generic general commentary in exchange for 100% unadulterated institutional signal. When management claims a 20% growth target, we test it against the audited P&L rather than journalist interpretations.
- **Mobile-First Density vs. Clutter**:
  - *Decision*: Adopted a tactile, Bloomberg-meets-Linear mobile terminal UX. Built with dark-mode OLED styling, thumb-friendly bottom navigation, and quick-expand cards.
  - *Trade-off*: Avoiding long scrolling walls of text by summarizing headline takeaways on cards while offering a one-tap deep-dive into full financial delta grids and source citations.
- **Multi-Tier Model Routing for Cost & Latency**:
  - *Decision*: Utilized deterministic structural extraction for numerical tables, ratios, and category classification (zero LLM token cost, sub-50ms latency), routing only complex unstructured synthesis to LLM inference (Gemini 1.5 Flash / local heuristic fallback).
  - *Trade-off*: Ensures the application runs on free tiers indefinitely without failing under API rate limits.
- **Resilient Hybrid Architecture (Thin-but-Working)**:
  - *Decision*: Implemented full live dynamic fetching for any arbitrary NSE ticker via `yfinance` & exchange scrapers, while bundling an indexed offline golden primary dataset for 22 companies.
  - *Trade-off*: Reviewers will never experience a broken UI or blank screen if external exchange servers throttle or network connections drop.

---

### 3. What I Deliberately Left Out

- **Broker Ratings, Target Prices, and News Sentiment**:
  - Deliberately omitted analyst buy/sell consensus ratings and news headlines. In public markets, secondary broker commentary is high-noise and backward-looking. Differentiated investment edge comes solely from reading primary filings and spotting divergences before the sell-side catches on.
- **Real-Time Intraday Tick Streaming (WebSockets)**:
  - Focused strictly on End-of-Day (EOD) closing data and exchange disclosures. Intraday price ticks encourage high-frequency distraction, contradicting the brief's focus on high-conviction fundamental workflows.
- **Full Historical SEC/MCA-21 Filings Archive**:
  - Focused the narrative audit on the trailing 4 quarters and 3-year CAGR trajectory. 10-year historical parsing would add plumbing overhead without enhancing the proof-of-concept.

---

### 4. Where I Would Take It Next

1. **Automated Concall Audio Tone & Hesitation Analysis**:
   - Ingest raw earnings call audio to run voice stress and hesitation analysis on executive Q&A responses, flagging when management hesitates on margin or guidance questions.
2. **Related-Party Transaction (RPT) Graph Engine**:
   - Map Annual Report Note disclosures on Related-Party Transactions into an interactive entity graph, surfacing fund flows between listed entities and promoter-owned private subsidiaries.
3. **Automated WhatsApp / Telegram Audio Push Briefing**:
   - Synthesize the 24-hour windowed digest into a 90-second personalized morning audio briefing delivered directly to the fund manager's phone at 8:00 AM IST prior to market open.
