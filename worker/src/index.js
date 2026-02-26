const PKCE_COOKIE = "__Host-scansci_pkce";
const SESSION_COOKIE = "__Host-scansci_session";

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error("Unhandled worker error", error);
      return jsonResponse(request, env, { ok: false, error: "internal_error" }, 500);
    }
  },
};

async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: standardHeaders(request, env),
    });
  }

  if (url.pathname === "/api/auth/github/start" && request.method === "GET") {
    return startGithubOAuth(request, env);
  }

  if (url.pathname === "/api/auth/github/callback" && request.method === "GET") {
    return handleGithubCallback(request, env);
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    if (!isSameOriginPost(request, env)) {
      return jsonResponse(request, env, { ok: false, error: "forbidden" }, 403);
    }
    return handleLogout(request, env);
  }

  if (url.pathname === "/api/me" && request.method === "GET") {
    return handleMe(request, env);
  }

  if (url.pathname === "/api/actions" && request.method === "POST") {
    if (!isSameOriginPost(request, env)) {
      return jsonResponse(request, env, { ok: false, error: "forbidden" }, 403);
    }
    return handleActionWrite(request, env);
  }

  if (url.pathname === "/api/actions" && request.method === "GET") {
    return handleActionRead(request, env);
  }

  return jsonResponse(request, env, { ok: false, error: "not_found" }, 404);
}

async function startGithubOAuth(request, env) {
  requireEnv(env, ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "JWT_SECRET"]);

  const requestUrl = new URL(request.url);
  const publicOrigin = getPublicOrigin(request, env);
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get("return_to") || "/");
  const verifier = randomBase64Url(64);
  const challenge = await sha256Base64Url(verifier);
  const state = randomBase64Url(24);

  const payload = {
    state,
    verifier,
    return_to: returnTo,
    created_at: Date.now(),
  };
  const payloadValue = utf8ToBase64Url(JSON.stringify(payload));

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", `${publicOrigin}/api/auth/github/callback`);
  authUrl.searchParams.set("scope", env.GITHUB_OAUTH_SCOPE || "read:user user:email");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const headers = standardHeaders(request, env);
  headers.set("Location", authUrl.toString());
  headers.append(
    "Set-Cookie",
    buildCookie(PKCE_COOKIE, payloadValue, {
      path: "/",
      maxAge: 600,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    })
  );

  return new Response(null, { status: 302, headers });
}

async function handleGithubCallback(request, env) {
  requireEnv(env, ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "JWT_SECRET"]);

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  if (!code || !state) {
    return jsonResponse(request, env, { ok: false, error: "missing_oauth_params" }, 400);
  }

  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const pkceRaw = cookies[PKCE_COOKIE];
  if (!pkceRaw) {
    return jsonResponse(request, env, { ok: false, error: "missing_pkce_cookie" }, 400);
  }

  let pkce;
  try {
    pkce = JSON.parse(base64UrlToUtf8(pkceRaw));
  } catch {
    return jsonResponse(request, env, { ok: false, error: "invalid_pkce_cookie" }, 400);
  }

  if (pkce.state !== state || !pkce.verifier) {
    return jsonResponse(request, env, { ok: false, error: "invalid_oauth_state" }, 400);
  }

  if (typeof pkce.created_at !== "number" || Date.now() - pkce.created_at > 10 * 60 * 1000) {
    return jsonResponse(request, env, { ok: false, error: "pkce_expired" }, 400);
  }

  const publicOrigin = getPublicOrigin(request, env);
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${publicOrigin}/api/auth/github/callback`,
      code_verifier: pkce.verifier,
    }),
  });

  if (!tokenRes.ok) {
    return jsonResponse(request, env, { ok: false, error: "oauth_exchange_failed" }, 502);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return jsonResponse(request, env, { ok: false, error: "missing_access_token" }, 502);
  }

  const ghHeaders = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "ScanSci-Worker",
  };

  const userRes = await fetch("https://api.github.com/user", { headers: ghHeaders });
  if (!userRes.ok) {
    return jsonResponse(request, env, { ok: false, error: "github_user_failed" }, 502);
  }
  const user = await userRes.json();

  const emailRes = await fetch("https://api.github.com/user/emails", { headers: ghHeaders });
  let resolvedEmail = user.email || null;
  if (emailRes.ok) {
    const emails = await emailRes.json();
    if (Array.isArray(emails) && emails.length) {
      const primaryVerified = emails.find((e) => e.primary && e.verified);
      const verified = emails.find((e) => e.verified);
      resolvedEmail = primaryVerified?.email || verified?.email || resolvedEmail;
    }
  }

  const githubId = String(user.id || "");
  if (!githubId) {
    return jsonResponse(request, env, { ok: false, error: "github_id_missing" }, 502);
  }

  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO users (github_id, login, email, avatar_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(github_id) DO UPDATE SET
       login = excluded.login,
       email = COALESCE(excluded.email, users.email),
       avatar_url = excluded.avatar_url,
       updated_at = excluded.updated_at`
  )
    .bind(githubId, String(user.login || ""), resolvedEmail, String(user.avatar_url || ""), now, now)
    .run();

  const dbUser = await env.DB.prepare(
    "SELECT id, github_id, login, email, avatar_url FROM users WHERE github_id = ?"
  )
    .bind(githubId)
    .first();

  if (!dbUser) {
    return jsonResponse(request, env, { ok: false, error: "user_upsert_failed" }, 500);
  }

  const ttl = parseInt(env.SESSION_TTL_SECONDS || "2592000", 10);
  const exp = Math.floor(Date.now() / 1000) + (Number.isFinite(ttl) ? ttl : 2592000);
  const token = await signJwt(
    {
      sub: String(dbUser.id),
      github_id: String(dbUser.github_id),
      login: String(dbUser.login || ""),
      email: dbUser.email || null,
      avatar_url: dbUser.avatar_url || null,
      iat: Math.floor(Date.now() / 1000),
      exp,
    },
    env.JWT_SECRET
  );

  const returnTo = sanitizeReturnTo(pkce.return_to || "/");
  const redirectUrl = new URL(returnTo, publicOrigin);

  const headers = standardHeaders(request, env);
  headers.set("Location", redirectUrl.toString());
  headers.append(
    "Set-Cookie",
    buildCookie(SESSION_COOKIE, token, {
      path: "/",
      maxAge: exp - Math.floor(Date.now() / 1000),
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    })
  );
  headers.append(
    "Set-Cookie",
    buildCookie(PKCE_COOKIE, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    })
  );

  return new Response(null, { status: 302, headers });
}

async function handleLogout(request, env) {
  const headers = standardHeaders(request, env);
  headers.append(
    "Set-Cookie",
    buildCookie(SESSION_COOKIE, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    })
  );
  return new Response(null, { status: 204, headers });
}

async function handleMe(request, env) {
  const auth = await requireAuth(request, env);
  if (!auth) {
    return jsonResponse(request, env, { ok: false, error: "unauthorized" }, 401);
  }

  const user = await env.DB.prepare(
    "SELECT id, github_id, login, email, avatar_url FROM users WHERE id = ?"
  )
    .bind(auth.userId)
    .first();

  if (!user) {
    return jsonResponse(request, env, { ok: false, error: "unauthorized" }, 401);
  }

  const favoritesRows = await env.DB.prepare(
    "SELECT app_id FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(auth.userId)
    .all();

  return jsonResponse(request, env, {
    ok: true,
    user,
    favorites: (favoritesRows.results || []).map((x) => x.app_id),
  });
}

async function handleActionWrite(request, env) {
  const auth = await requireAuth(request, env);
  if (!auth) {
    return jsonResponse(request, env, { ok: false, error: "unauthorized" }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, env, { ok: false, error: "invalid_json" }, 400);
  }

  const appId = String(body?.app_id || "").trim();
  const actionType = String(body?.action_type || "").trim();
  const payload = body?.payload ?? null;

  if (!appId || !actionType) {
    return jsonResponse(request, env, { ok: false, error: "invalid_payload" }, 400);
  }

  const now = new Date().toISOString();

  if (actionType === "favorite_toggle") {
    const existing = await env.DB.prepare(
      "SELECT 1 FROM user_favorites WHERE user_id = ? AND app_id = ? LIMIT 1"
    )
      .bind(auth.userId, appId)
      .first();

    let isFavorite = false;
    if (existing) {
      await env.DB.prepare("DELETE FROM user_favorites WHERE user_id = ? AND app_id = ?")
        .bind(auth.userId, appId)
        .run();
      isFavorite = false;
    } else {
      await env.DB.prepare(
        "INSERT INTO user_favorites (user_id, app_id, created_at) VALUES (?, ?, ?)"
      )
        .bind(auth.userId, appId, now)
        .run();
      isFavorite = true;
    }

    await env.DB.prepare(
      "INSERT INTO user_actions (user_id, app_id, action_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(auth.userId, appId, actionType, JSON.stringify({ ...(payload || {}), is_favorite: isFavorite }), now)
      .run();

    return jsonResponse(request, env, { ok: true, is_favorite: isFavorite });
  }

  await env.DB.prepare(
    "INSERT INTO user_actions (user_id, app_id, action_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(auth.userId, appId, actionType, JSON.stringify(payload), now)
    .run();

  return jsonResponse(request, env, { ok: true });
}

async function handleActionRead(request, env) {
  const auth = await requireAuth(request, env);
  if (!auth) {
    return jsonResponse(request, env, { ok: false, error: "unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "recent";

  if (type === "favorite") {
    const rows = await env.DB.prepare(
      "SELECT app_id, created_at FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC LIMIT 100"
    )
      .bind(auth.userId)
      .all();
    return jsonResponse(request, env, { ok: true, items: rows.results || [] });
  }

  const rows = await env.DB.prepare(
    "SELECT app_id, action_type, payload_json, created_at FROM user_actions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
  )
    .bind(auth.userId)
    .all();

  const items = (rows.results || []).map((row) => ({
    app_id: row.app_id,
    action_type: row.action_type,
    payload: safeJsonParse(row.payload_json),
    created_at: row.created_at,
  }));

  return jsonResponse(request, env, { ok: true, items });
}

function safeJsonParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function requireAuth(request, env) {
  if (!env.JWT_SECRET) return null;
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;

  const payload = await verifyJwt(token, env.JWT_SECRET || "");
  if (!payload) return null;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;

  const userId = Number(payload.sub);
  if (!Number.isFinite(userId) || userId <= 0) return null;
  return { userId, payload };
}

function parseCookies(cookieHeader) {
  const result = {};
  for (const pair of cookieHeader.split(";")) {
    const idx = pair.indexOf("=");
    if (idx <= 0) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    result[key] = decodeURIComponent(value);
  }
  return result;
}

function buildCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || "/"}`);
  if (typeof options.maxAge === "number") parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  parts.push(`SameSite=${options.sameSite || "Lax"}`);
  return parts.join("; ");
}

function sanitizeReturnTo(raw) {
  if (!raw || typeof raw !== "string") return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  return raw;
}

function isSameOriginPost(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return origin === getPublicOrigin(request, env);
}

function getPublicOrigin(request, env) {
  if (env.PUBLIC_ORIGIN) return env.PUBLIC_ORIGIN.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function standardHeaders(request, env) {
  const headers = new Headers();
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  const origin = request.headers.get("Origin");
  const allowed = new Set((env.CORS_ORIGINS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean));
  allowed.add(getPublicOrigin(request, env));

  if (origin && allowed.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  return headers;
}

function jsonResponse(request, env, payload, status = 200) {
  const headers = standardHeaders(request, env);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(payload), { status, headers });
}

function requireEnv(env, keys) {
  for (const key of keys) {
    if (!env[key]) {
      throw new Error(`Missing env var: ${key}`);
    }
  }
}

function randomBase64Url(bytesLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(bytesLength));
  return bytesToBase64Url(bytes);
}

async function sha256Base64Url(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return bytesToBase64Url(new Uint8Array(hash));
}

async function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = utf8ToBase64Url(JSON.stringify(header));
  const encodedPayload = utf8ToBase64Url(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function verifyJwt(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );
  if (!valid) return null;

  try {
    return JSON.parse(base64UrlToUtf8(encodedPayload));
  } catch {
    return null;
  }
}

function utf8ToBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  return bytesToBase64Url(bytes);
}

function base64UrlToUtf8(value) {
  const bytes = base64UrlToBytes(value);
  return new TextDecoder().decode(bytes);
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
