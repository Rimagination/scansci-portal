import { queryJournalDetail, queryJournalSearch } from "./journal-search.js";

const CORS_ORIGINS = [
  "https://www.scansci.com",
  "https://journal.scansci.com",
];

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: standardHeaders(request) });
    }

    const url = new URL(request.url);
    if (request.method !== "GET" || !["/api/journals/search", "/api/journals/detail"].includes(url.pathname)) {
      return jsonResponse(request, { ok: false, error: "not_found" }, 404);
    }

    if (url.pathname === "/api/journals/detail") {
      const result = await queryJournalDetail(env, {
        id: url.searchParams.get("id") || "",
      });
      const status = result.ok ? 200 : result.error === "journal_not_found" ? 404 : 503;
      return jsonResponse(request, { ok: result.ok, ...result }, status);
    }

    const result = await queryJournalSearch(env, {
      query: url.searchParams.get("q") || "",
      limit: url.searchParams.get("limit") || "",
      minIF: url.searchParams.get("min_if") || url.searchParams.get("minIF") || "",
    });

    return jsonResponse(request, { ok: result.ok, ...result }, result.ok ? 200 : 503);
  },
};

function standardHeaders(request) {
  const headers = new Headers({
    "Cache-Control": "public, max-age=60, s-maxage=300",
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
