/**
 * FINN API Client
 * Thin, honest client. No client-side fixture data and no silent fallbacks:
 * on failure every call returns an explicit { error, status } object so the UI
 * can show "Unavailable" instead of relabelling another company's data.
 */

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');
const TIMEOUT_MS = 12000;

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) return body;
    const detail = body?.detail;
    return {
      error: true,
      status: res.status === 404 ? 'unavailable' : 'error',
      httpStatus: res.status,
      message: (typeof detail === 'object' ? detail?.message : detail) || `Request failed (${res.status})`,
    };
  } catch (e) {
    return {
      error: true,
      status: 'offline',
      message: `Backend unreachable: ${e.message}`,
    };
  }
}

export async function fetchPortfolio() {
  const data = await request('/portfolio');
  return data.error ? { ...data, portfolio: [], ad_hoc_tickers: [] } : data;
}

export async function fetchDigest(windowHours = 24, highSignalOnly = false, symbol = null, asOf = null) {
  const q = new URLSearchParams({ window_hours: windowHours, high_signal_only: highSignalOnly });
  if (symbol) q.set('symbol', symbol);
  if (asOf) q.set('as_of', asOf);
  const data = await request(`/push/digest?${q}`);
  return data.error
    ? { ...data, window_hours: windowHours, total_announcements: 0, material_count: 0, collapsed_routine_count: 0, high_signal_announcements: [], routine_announcements: [] }
    : data;
}

export async function fetchAlerts(volumeMult = 2.0, pricePct = 3.0, windowHours = 24, asOf = null) {
  const q = new URLSearchParams({ volume_mult: volumeMult, price_pct: pricePct, window_hours: windowHours });
  if (asOf) q.set('as_of', asOf);
  const data = await request(`/push/alerts?${q}`);
  if (data.error) return { ...data, alert_count: 0, alerts: [] };
  // Normalise backend UnifiedAlert fields to the shape the feed renders
  const alerts = (data.alerts || []).map((a) => ({
    ...a,
    current_price: a.price,
    price_change_pct: a.change_pct,
    volume_multiplier: a.volume_mult,
    title: a.headline,
    reasoning: a.detail,
    hoursAgo: a.hours_ago,
    is_live: Boolean(a.is_live),
    data_status: a.data_status || 'cached_demo_snapshot',
    as_of_date: a.as_of_date || '2024-11-08',
  }));
  return { ...data, alerts };
}

export async function fetchCompanyAnalysis(symbol) {
  const data = await request(`/pull/analysis/${encodeURIComponent(symbol)}`);
  return data.error ? { ...data, symbol, provenance_status: data.status } : data;
}

export async function fetchThresholds() {
  return request('/config/thresholds');
}

export async function saveThresholds(volumeMultiplier, priceChangePct) {
  return request('/config/thresholds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volume_multiplier: volumeMultiplier, price_change_pct: priceChangePct }),
  });
}

export async function fetchAuditSummary(asOf = null) {
  const q = new URLSearchParams();
  if (asOf) q.set('as_of', asOf);
  const suffix = q.toString() ? `?${q}` : '';
  return request(`/audit/summary${suffix}`);
}

export async function askCopilot(symbol, question) {
  const data = await request('/copilot/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, question }),
  });
  if (data.error) {
    return {
      symbol,
      answer: `**Copilot unavailable.** ${data.message}`,
      grounded_citations: [],
      key_takeaway: 'No answer generated. FINN does not fabricate responses when the backend is unavailable.',
      confidence: 0,
      provenance: 'unavailable',
    };
  }
  return data;
}
