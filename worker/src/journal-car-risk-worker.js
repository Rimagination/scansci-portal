import { queryJcarRisk } from "./journal-car-risk.js";

const CORS_ORIGINS = [
  "https://www.scansci.com",
  "https://journal.scansci.com",
];
const CAR_NOTE =
  "CAR index is an external academic integrity signal from JCAR and should not be treated as a direct exclusion verdict.";

export default {
  async fetch(request, env, ctx) {
    return handleJournalCarRiskRequest(request, { context: ctx });
  },
};

export async function handleJournalCarRiskRequest(request, options = {}) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: standardHeaders(request) });
  }

  const url = new URL(request.url);
  if (request.method !== "GET" || url.pathname !== "/api/journals/car-risk") {
    return jsonResponse(request, { ok: false, error: "not_found" }, 404);
  }

  const cache = options.cache || globalThis.caches?.default || null;
  const cacheKey = buildCacheKey(url);
  const cached = cache ? await cache.match(cacheKey) : null;
  if (cached) {
    const payload = await cached.json();
    const response = jsonResponse(request, payload, 200);
    response.headers.set("X-ScanSci-Cache", "HIT");
    return response;
  }

  const result = await queryJcarRisk(
    {
      issn: url.searchParams.get("issn") || "",
      eissn: url.searchParams.get("eissn") || "",
      title: url.searchParams.get("title") || "",
    },
    { fetcher: options.fetcher }
  );

  const payload = {
    ok: result.ok,
    ...result,
    note: CAR_NOTE,
  };
  const response = jsonResponse(request, payload, result.ok ? 200 : 502);
  response.headers.set("X-ScanSci-Cache", "MISS");

  if (cache && result.ok) {
    const cacheResponse = new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=21600",
      },
    });
    const cacheWrite = cache.put(cacheKey, cacheResponse);
    if (options.context?.waitUntil) {
      options.context.waitUntil(cacheWrite);
    } else {
      await cacheWrite;
    }
  }

  return response;
}

function buildCacheKey(url) {
  const keyUrl = new URL("https://cache.scansci.internal/journal-car-risk");
  for (const key of ["issn", "eissn", "title"]) {
    const value = String(url.searchParams.get(key) || "").replace(/\s+/g, " ").trim();
    if (value) keyUrl.searchParams.set(key, value);
  }
  return new Request(keyUrl.toString(), { method: "GET" });
}

function standardHeaders(request) {
  const headers = new Headers({
    "Cache-Control": "public, max-age=3600, s-maxage=21600",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
  });
  const origin = request.headers.get("Origin");
  if (origin && CORS_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Vary", "Origin");
  }
  return headers;
}

function jsonResponse(request, payload, status = 200) {
  const headers = standardHeaders(request);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(payload), { status, headers });
}
