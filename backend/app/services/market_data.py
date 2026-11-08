"""
Market Data Service for FINN: EOD Price & Volume Tracking & Alert Engine.
Uses yfinance with high-speed in-memory caching and resilient offline fallback.
"""
import time
import math
import logging
from typing import Dict, List, Optional, Any
import yfinance as yf
from app.config import DEFAULT_PORTFOLIO, AD_HOC_TICKERS, DEFAULT_THRESHOLDS
from app.models.schemas import UnusualMoveAlert

logger = logging.getLogger(__name__)

# In-memory cache for market data to ensure sub-50ms mobile responsiveness
_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes

# Fallback reference prices and volumes for demo portfolio if internet is slow or offline
FALLBACK_METRICS = {
    "RELIANCE.NS": {"price": 1284.50, "change_pct": 2.85, "volume": 18450000, "avg_vol": 8200000},
    "TCS.NS": {"price": 4120.00, "change_pct": -0.65, "volume": 2100000, "avg_vol": 2350000},
    "HDFCBANK.NS": {"price": 1742.30, "change_pct": 1.40, "volume": 19800000, "avg_vol": 16200000},
    "INFY.NS": {"price": 1865.00, "change_pct": -1.25, "volume": 5800000, "avg_vol": 6100000},
    "TATAMOTORS.NS": {"price": 812.60, "change_pct": 3.95, "volume": 28400000, "avg_vol": 12100000}, # Spike!
    "ICICIBANK.NS": {"price": 1265.40, "change_pct": 0.85, "volume": 11400000, "avg_vol": 12500000},
    "ITC.NS": {"price": 482.10, "change_pct": -0.30, "volume": 9400000, "avg_vol": 10200000},
    "LT.NS": {"price": 3640.00, "change_pct": 4.10, "volume": 5100000, "avg_vol": 2200000}, # Spike!
    "SUNPHARMA.NS": {"price": 1790.00, "change_pct": 0.40, "volume": 1800000, "avg_vol": 2100000},
    "TITAN.NS": {"price": 3280.00, "change_pct": -2.40, "volume": 1400000, "avg_vol": 1100000},
    "BHARTIARTL.NS": {"price": 1590.20, "change_pct": 1.80, "volume": 6200000, "avg_vol": 5900000},
    "BAJFINANCE.NS": {"price": 6850.00, "change_pct": -3.85, "volume": 2600000, "avg_vol": 1150000}, # Plunge + Volume!
    "ZOMATO.NS": {"price": 264.50, "change_pct": 5.40, "volume": 64200000, "avg_vol": 29000000}, # Big Spike!
    "HAL.NS": {"price": 4350.00, "change_pct": 3.20, "volume": 4900000, "avg_vol": 2100000}, # Spike!
    "POLYCAB.NS": {"price": 6720.00, "change_pct": 1.15, "volume": 580000, "avg_vol": 620000},
    "TRENT.NS": {"price": 6480.00, "change_pct": 4.60, "volume": 3400000, "avg_vol": 1500000}, # Spike!
    "DEEPAKNTR.NS": {"price": 2780.00, "change_pct": -0.80, "volume": 420000, "avg_vol": 450000},
    "DIXON.NS": {"price": 14950.00, "change_pct": 3.45, "volume": 890000, "avg_vol": 380000}, # Spike!
    "CDSL.NS": {"price": 1580.00, "change_pct": 2.10, "volume": 1800000, "avg_vol": 1600000},
    "KAYNES.NS": {"price": 5420.00, "change_pct": 6.20, "volume": 1250000, "avg_vol": 480000}, # Surge!
    "DMART.NS": {"price": 3890.00, "change_pct": -1.10, "volume": 720000, "avg_vol": 790000},
    "BEL.NS": {"price": 298.00, "change_pct": 2.90, "volume": 16500000, "avg_vol": 14200000},
}


def sanitize_ticker(symbol: str) -> str:
    """Ensure ticker has proper exchange extension (defaults to .NS for Indian markets)."""
    symbol = symbol.strip().upper()
    if not symbol.endswith(".NS") and not symbol.endswith(".BO"):
        symbol = f"{symbol}.NS"
    return symbol


def fetch_ticker_eod(symbol: str) -> Dict[str, Any]:
    """Fetch current price, 1-day change, and 20-day average volume for a symbol."""
    sym = sanitize_ticker(symbol)
    now = time.time()

    if sym in _CACHE and (now - _CACHE[sym]["timestamp"] < CACHE_TTL_SECONDS):
        return _CACHE[sym]["data"]

    try:
        ticker = yf.Ticker(sym)
        # Fetch last 1 month of daily data to compute 20d average volume cleanly
        hist = ticker.history(period="1mo")
        if not hist.empty and len(hist) >= 2:
            current_close = float(hist["Close"].iloc[-1])
            prev_close = float(hist["Close"].iloc[-2])
            change_pct = round(((current_close - prev_close) / prev_close) * 100, 2)
            today_volume = int(hist["Volume"].iloc[-1])
            avg_20d_volume = int(hist["Volume"].tail(20).mean())
            volume_multiplier = round(today_volume / max(avg_20d_volume, 1), 2)

            data = {
                "symbol": sym,
                "price": round(current_close, 2),
                "change_pct": change_pct,
                "volume": today_volume,
                "avg_20d_volume": avg_20d_volume,
                "volume_multiplier": volume_multiplier,
                "live": True,
            }
            _CACHE[sym] = {"data": data, "timestamp": now}
            return data
    except Exception as e:
        logger.warning(f"Live yfinance fetch failed for {sym}: {e}. Utilizing golden reference store.")

    # Graceful fallback to golden benchmark data
    fb = FALLBACK_METRICS.get(sym, {
        "price": 1000.0,
        "change_pct": 1.5,
        "volume": 2000000,
        "avg_vol": 1500000
    })
    vol_mult = round(fb["volume"] / max(fb["avg_vol"], 1), 2)
    data = {
        "symbol": sym,
        "price": fb["price"],
        "change_pct": fb["change_pct"],
        "volume": fb["volume"],
        "avg_20d_volume": fb["avg_vol"],
        "volume_multiplier": vol_mult,
        "live": False,
    }
    _CACHE[sym] = {"data": data, "timestamp": now}
    return data


def scan_unusual_moves(
    tickers: Optional[List[Dict[str, Any]]] = None,
    volume_threshold: float = 2.0,
    price_change_threshold: float = 3.0
) -> List[UnusualMoveAlert]:
    """
    Evaluates End-of-Day data across portfolio and ad-hoc tickers to flag unusual moves:
    1. Volume > volume_threshold * 20-day average
    2. Absolute price change >= price_change_threshold (%)
    """
    if not tickers:
        tickers = DEFAULT_PORTFOLIO

    alerts: List[UnusualMoveAlert] = []

    for item in tickers:
        sym = item["symbol"]
        company_name = item.get("name", sym.replace(".NS", ""))
        metric = fetch_ticker_eod(sym)

        vol_mult = metric["volume_multiplier"]
        abs_change = abs(metric["change_pct"])

        is_vol_spike = vol_mult >= volume_threshold
        is_price_break = abs_change >= price_change_threshold

        if is_vol_spike or is_price_break:
            if is_vol_spike and is_price_break:
                alert_type = "VOLUME_AND_PRICE"
                reason = f"Heavy institutional activity: Volume at {vol_mult}x 20D average with {metric['change_pct']:+}% daily price move."
            elif is_vol_spike:
                alert_type = "HIGH_VOLUME"
                reason = f"Significant accumulation/distribution: Traded volume reached {vol_mult}x its 20-day moving average."
            elif metric["change_pct"] > 0:
                alert_type = "PRICE_SURGE"
                reason = f"Sharp upward momentum: Stock rose +{metric['change_pct']}% crossing the ±{price_change_threshold}% volatility threshold."
            else:
                alert_type = "PRICE_PLUNGE"
                reason = f"Sharp downward pressure: Stock slid {metric['change_pct']}% crossing the ±{price_change_threshold}% volatility threshold."

            alert = UnusualMoveAlert(
                id=f"alert-{sym.replace('.', '_')}-{int(time.time())}",
                symbol=sym,
                company_name=company_name,
                current_price=metric["price"],
                price_change_pct=metric["change_pct"],
                volume=metric["volume"],
                volume_avg_20d=metric["avg_20d_volume"],
                volume_multiplier=vol_mult,
                alert_type=alert_type,
                reasoning=reason,
                timestamp="Today (EOD)"
            )
            alerts.append(alert)

    # Sort alerts by volume multiplier and absolute price magnitude
    alerts.sort(key=lambda x: (x.volume_multiplier, abs(x.price_change_pct)), reverse=True)
    return alerts
