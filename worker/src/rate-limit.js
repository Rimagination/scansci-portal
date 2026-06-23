const DEFAULT_JOURNAL_API_LIMIT = 3000;
const DEFAULT_JOURNAL_API_WINDOW_SECONDS = 600;

export async function checkJournalApiRateLimit(request, env, options = {}) {
  const limit = readPositiveInteger(env?.JOURNAL_API_RATE_LIMIT_MAX, DEFAULT_JOURNAL_API_LIMIT);
  const windowSeconds = readPositiveInteger(
    env?.JOURNAL_API_RATE_LIMIT_WINDOW_SECONDS,
    DEFAULT_JOURNAL_API_WINDOW_SECONDS
  );
  const nowSec = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(nowSec / windowSeconds) * windowSeconds;
  const reset = windowStart + windowSeconds;

  if (String(env?.JOURNAL_API_RATE_LIMIT_DISABLED || "") === "1" || !env?.DB?.prepare) {
    return { allowed: true, limit, count: 0, remaining: limit, reset };
  }

  const scope = String(options.scope || "journal-api");
  const ip = getClientIp(request);
  const key = await buildRateLimitKey(scope, ip, windowStart);

  try {
    await env.DB.prepare(
      `INSERT INTO api_rate_limits (key, scope, window_start, count, updated_at)
       VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         count = count + 1,
         updated_at = excluded.updated_at`
    )
      .bind(key, scope, windowStart, new Date().toISOString())
      .run();

    const row = await env.DB.prepare("SELECT count FROM api_rate_limits WHERE key = ?").bind(key).first();
    const count = Number(row?.count || 0);
    return {
      allowed: count <= limit,
      limit,
      count,
      remaining: Math.max(0, limit - count),
      reset,
    };
  } catch (error) {
    console.warn("Journal API rate limit check failed", error);
    return { allowed: true, limit, count: 0, remaining: limit, reset };
  }
}

export function applyRateLimitHeaders(headers, state) {
  if (!state) return;
  headers.set("X-RateLimit-Limit", String(state.limit));
  headers.set("X-RateLimit-Remaining", String(Math.max(0, state.remaining)));
  headers.set("X-RateLimit-Reset", String(state.reset));
  if (!state.allowed) {
    const retryAfter = Math.max(1, state.reset - Math.floor(Date.now() / 1000));
    headers.set("Retry-After", String(retryAfter));
  }
}

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getClientIp(request) {
  const cfIp = String(request.headers.get("CF-Connecting-IP") || "").trim();
  if (cfIp) return cfIp;
  const forwarded = String(request.headers.get("X-Forwarded-For") || "").split(",")[0].trim();
  return forwarded || "unknown";
}

async function buildRateLimitKey(scope, ip, windowStart) {
  const hash = await sha256Hex(`${scope}:${ip}`);
  return `${scope}:${windowStart}:${hash.slice(0, 32)}`;
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
