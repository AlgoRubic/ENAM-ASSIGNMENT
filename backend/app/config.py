"""
Configuration and constants for FINN Investment Agent.
"""
from typing import List, Dict, Any

# 18 curated Indian portfolio companies covering diverse sectors and market caps
DEFAULT_PORTFOLIO: List[Dict[str, Any]] = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "sector": "Energy & Retail", "cap": "Large"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "sector": "IT Services", "cap": "Large"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "sector": "Banking & Finance", "cap": "Large"},
    {"symbol": "INFY.NS", "name": "Infosys", "sector": "IT Services", "cap": "Large"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "sector": "Automotive & EV", "cap": "Large"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "sector": "Banking & Finance", "cap": "Large"},
    {"symbol": "ITC.NS", "name": "ITC Ltd", "sector": "FMCG & Agri", "cap": "Large"},
    {"symbol": "LT.NS", "name": "Larsen & Toubro", "sector": "Capital Goods & Infra", "cap": "Large"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical", "sector": "Healthcare & Pharma", "cap": "Large"},
    {"symbol": "TITAN.NS", "name": "Titan Company", "sector": "Consumer Discretionary", "cap": "Large"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "sector": "Telecommunications", "cap": "Large"},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "sector": "NBFC / Retail Credit", "cap": "Large"},
    {"symbol": "ZOMATO.NS", "name": "Zomato Ltd (Eternal)", "sector": "Internet / Quick Commerce", "cap": "High Growth"},
    {"symbol": "HAL.NS", "name": "Hindustan Aeronautics", "sector": "Aerospace & Defence", "cap": "PSU Defense"},
    {"symbol": "POLYCAB.NS", "name": "Polycab India", "sector": "Wires, Cables & FMEG", "cap": "Mid/Large"},
    {"symbol": "TRENT.NS", "name": "Trent Ltd (Zudio/Westside)", "sector": "Fast Fashion Retail", "cap": "High Growth"},
    {"symbol": "DEEPAKNTR.NS", "name": "Deepak Nitrite", "sector": "Specialty Chemicals", "cap": "Mid Cap"},
    {"symbol": "DIXON.NS", "name": "Dixon Technologies", "sector": "Electronics Mfg (EMS)", "cap": "Mid/Growth"},
]

# 4 Demo ad-hoc research tickers outside portfolio to prove generalizability
AD_HOC_TICKERS: List[Dict[str, Any]] = [
    {"symbol": "CDSL.NS", "name": "Central Depository Services", "sector": "Capital Market Infra"},
    {"symbol": "KAYNES.NS", "name": "Kaynes Technology", "sector": "Electronics & IoT"},
    {"symbol": "DMART.NS", "name": "Avenue Supermarts", "sector": "Retail Supermarkets"},
    {"symbol": "BEL.NS", "name": "Bharat Electronics", "sector": "Defence Electronics"},
]

# 17 Official Announcement categories from the ENAM Challenge Reference Guide
ANNOUNCEMENT_CATEGORIES = [
    "results",
    "M&A",
    "fund_raise",
    "management_change",
    "litigation",
    "insider_trading",
    "earnings_call",
    "investor_meetings",
    "credit_rating",
    "dividend",
    "bonus_split",
    "capex",
    "press_release",
    "postal_ballot",
    "agm_egm",
    "pledging",
    "unclassified",
]

# High-signal priority tiers
HIGH_SIGNAL_CATEGORIES = {
    "results": 1,
    "M&A": 1,
    "management_change": 1,
    "litigation": 1,
    "capex": 2,
    "fund_raise": 2,
    "insider_trading": 2,
    "earnings_call": 3,
    "credit_rating": 3,
    "dividend": 3,
    "bonus_split": 3,
    "pledging": 3,
    "press_release": 4,
    "investor_meetings": 4,
    "postal_ballot": 5,
    "agm_egm": 5,
    "unclassified": 6,
}

# Alert Threshold Defaults
DEFAULT_THRESHOLDS = {
    "volume_multiplier": 2.0,  # e.g., volume > 2x 20-day moving average
    "price_change_pct": 3.0,   # absolute daily price change >= 3%
    "auto_enrich_bios": True,  # automatically look up executive background for management_change
    "auto_extract_results": True, # automatically extract headline numbers (Revenue, EBITDA, PBT, PAT)
}
