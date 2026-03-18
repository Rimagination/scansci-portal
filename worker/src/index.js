const PKCE_COOKIE = "__Host-scansci_pkce";
const SESSION_COOKIE = "__Host-scansci_session";
const EMAIL_PURPOSE_LOGIN = "email_login";
const CITATION_DOI_RE = /(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i;
const CITATION_REF_START_RE = /^\s*(?:\[(\d+)\]|(\d+)[.)]|（(\d+)）)\s*/;
const CITATION_YEAR_RE = /\b(19|20)\d{2}[a-z]?\b/i;
const CITATION_NUMERIC_CITATION_RE = /\[(\d+(?:\s*[-,;]\s*\d+)*)\]/g;
const CITATION_PAREN_YEAR_RE = /[\(\[\{]\s*((?:19|20)\d{2})[a-z]?\s*[\)\]\}]/i;
const CITATION_STYLE_TYPE_TAG_RE = /\[[A-Za-z\u4e00-\u9fff/]{1,8}\]/g;
const CITATION_MLA_DETAIL_RE = /\bvol\.|\bno\.|\bpp\./i;
const CITATION_STYLE_ORDER = [
  "apa",
  "modern-language-association",
  "china-national-standard-gb-t-7714-2015-numeric",
  "china-national-standard-gb-t-7714-2015-author-date",
  "ieee",
  "chicago-author-date",
];
const CITATION_SOURCE_ORDER = ["crossref", "openalex", "datacite", "semanticscholar"];
const CITATION_SOURCE_LABELS = {
  crossref: "Crossref",
  openalex: "OpenAlex",
  datacite: "DataCite",
  semanticscholar: "Semantic Scholar",
};
const CITATION_SOURCE_PRIORITY = {
  crossref: 4,
  openalex: 3,
  datacite: 2,
  semanticscholar: 1,
};
const CITATION_SUGGESTION_CACHE = new Map();

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error("Unhandled worker error", error);
      const message = String(error?.message || "");
      if (message.startsWith("Missing env var:")) {
        const missing = message.replace("Missing env var:", "").trim();
        return jsonResponse(request, env, { ok: false, error: "config_error", missing }, 500);
      }
      return jsonResponse(request, env, { ok: false, error: "internal_error" }, 500);
    }
  },
};

async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: standardHeaders(request, env) });
  }

  if (url.pathname === "/api/auth/github/start" && request.method === "GET") {
    return startGithubOAuth(request, env, { mode: "login" });
  }

  if (url.pathname === "/api/auth/github/link/start" && request.method === "GET") {
    return startGithubOAuth(request, env, { mode: "link" });
  }

  if (url.pathname === "/api/auth/github/callback" && request.method === "GET") {
    return handleGithubCallback(request, env);
  }

  if (url.pathname === "/api/auth/email/request-code" && request.method === "POST") {
    if (!isSameOriginPost(request, env)) {
      return jsonResponse(request, env, { ok: false, error: "forbidden" }, 403);
    }
    return handleEmailRequestCode(request, env);
  }

  if (url.pathname === "/api/auth/email/verify-code" && request.method === "POST") {
    if (!isSameOriginPost(request, env)) {
      return jsonResponse(request, env, { ok: false, error: "forbidden" }, 403);
    }
    return handleEmailVerifyCode(request, env);
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

  if (url.pathname === "/api/elsevier/serial-title" && request.method === "GET") {
    return handleElsevierSerialTitle(request, env);
  }

  if (
    (url.pathname === "/api/citation/analyze" || url.pathname === "/api/analyze") &&
    request.method === "POST"
  ) {
    return handleCitationAnalyze(request, env);
  }

  if (url.pathname === "/api/admin/elsevier/cache/upsert" && request.method === "POST") {
    return handleAdminElsevierCacheUpsert(request, env);
  }

  if (url.pathname === "/api/admin/elsevier/cache/batch-upsert" && request.method === "POST") {
    return handleAdminElsevierCacheBatchUpsert(request, env);
  }

  if (url.pathname === "/api/web/preview-image" && request.method === "GET") {
    return handleWebPreviewImage(request, env);
  }

  if (url.pathname === "/api/stats" && request.method === "GET") {
    return handleStats(request, env);
  }

  return jsonResponse(request, env, { ok: false, error: "not_found" }, 404);
}

async function startGithubOAuth(request, env, options = { mode: "login" }) {
  requireEnv(env, ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "JWT_SECRET"]);

  const mode = options.mode === "link" ? "link" : "login";
  let auth = null;
  if (mode === "link") {
    auth = await requireAuth(request, env);
    if (!auth) {
      return jsonResponse(request, env, { ok: false, error: "unauthorized" }, 401);
    }
  }

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
    mode,
    user_id: auth?.userId || null,
  };

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
    buildCookie(PKCE_COOKIE, utf8ToBase64Url(JSON.stringify(payload)), {
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
  const ghUser = await userRes.json();

  const emailRes = await fetch("https://api.github.com/user/emails", { headers: ghHeaders });
  let resolvedEmail = ghUser.email || null;
  if (emailRes.ok) {
    const emails = await emailRes.json();
    if (Array.isArray(emails) && emails.length) {
      const primaryVerified = emails.find((e) => e.primary && e.verified);
      const verified = emails.find((e) => e.verified);
      resolvedEmail = primaryVerified?.email || verified?.email || resolvedEmail;
    }
  }
  resolvedEmail = normalizeEmail(resolvedEmail);

  const githubId = String(ghUser.id || "");
  if (!githubId) {
    return jsonResponse(request, env, { ok: false, error: "github_id_missing" }, 502);
  }

  const mode = pkce.mode === "link" ? "link" : "login";
  const now = new Date().toISOString();
  let user = null;

  if (mode === "link") {
    const auth = await requireAuth(request, env);
    if (!auth) {
      return jsonResponse(request, env, { ok: false, error: "unauthorized" }, 401);
    }

    const existingLink = await env.DB.prepare("SELECT github_id, user_id FROM github_links WHERE github_id = ?")
      .bind(githubId)
      .first();

    if (existingLink && Number(existingLink.user_id) !== auth.userId) {
      return jsonResponse(request, env, { ok: false, error: "github_already_linked" }, 409);
    }

    await env.DB.prepare(
      `INSERT INTO github_links (github_id, user_id, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(github_id) DO UPDATE SET user_id = excluded.user_id, created_at = excluded.created_at`
    )
      .bind(githubId, auth.userId, now)
      .run();

    await env.DB.prepare(
      `UPDATE users
       SET email = COALESCE(email, ?),
           avatar_url = CASE WHEN avatar_url IS NULL OR avatar_url = '' THEN ? ELSE avatar_url END,
           updated_at = ?
       WHERE id = ?`
    )
      .bind(resolvedEmail, String(ghUser.avatar_url || ""), now, auth.userId)
      .run();

    if (resolvedEmail) {
      await markEmailVerified(env, auth.userId, resolvedEmail, now);
    }

    user = await getUserById(env, auth.userId);
  } else {
    user = await findUserByGithubId(env, githubId);

    if (!user) {
      await env.DB.prepare(
        `INSERT INTO users (github_id, login, email, avatar_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(githubId, String(ghUser.login || "github_user"), resolvedEmail, String(ghUser.avatar_url || ""), now, now)
        .run();

      user = await env.DB.prepare(
        "SELECT id, github_id, login, email, avatar_url FROM users WHERE github_id = ?"
      )
        .bind(githubId)
        .first();
    } else {
      if (String(user.github_id || "") === githubId) {
        await env.DB.prepare(
          `UPDATE users
           SET login = ?,
               email = COALESCE(?, email),
               avatar_url = ?,
               updated_at = ?
           WHERE id = ?`
        )
          .bind(String(ghUser.login || user.login || "github_user"), resolvedEmail, String(ghUser.avatar_url || ""), now, user.id)
          .run();
      } else {
        await env.DB.prepare(
          `UPDATE users
           SET email = COALESCE(email, ?),
               avatar_url = CASE WHEN avatar_url IS NULL OR avatar_url = '' THEN ? ELSE avatar_url END,
               updated_at = ?
           WHERE id = ?`
        )
          .bind(resolvedEmail, String(ghUser.avatar_url || ""), now, user.id)
          .run();
      }

      user = await getUserById(env, Number(user.id));
    }

    if (!user) {
      return jsonResponse(request, env, { ok: false, error: "user_upsert_failed" }, 500);
    }

    await env.DB.prepare(
      `INSERT INTO github_links (github_id, user_id, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(github_id) DO UPDATE SET user_id = excluded.user_id, created_at = excluded.created_at`
    )
      .bind(githubId, user.id, now)
      .run();

    if (resolvedEmail) {
      await markEmailVerified(env, user.id, resolvedEmail, now);
    }
  }

  if (!user) {
    return jsonResponse(request, env, { ok: false, error: "user_not_found" }, 500);
  }

  const returnTo = sanitizeReturnTo(pkce.return_to || "/");
  const redirectUrl = new URL(returnTo, publicOrigin);
  const headers = standardHeaders(request, env);
  headers.set("Location", redirectUrl.toString());
  await appendSessionCookie(headers, env, user);
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

async function handleEmailRequestCode(request, env) {
  requireEnv(env, ["JWT_SECRET"]);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, env, { ok: false, error: "invalid_json" }, 400);
  }

  const email = normalizeEmail(body?.email);
  if (!isValidEmail(email)) {
    return jsonResponse(request, env, { ok: false, error: "invalid_email" }, 400);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const ip = getClientIp(request);

  const perMinute = await env.DB.prepare(
    `SELECT COUNT(1) AS c FROM email_verification_codes
     WHERE email = ? AND purpose = ? AND created_unix >= ?`
  )
    .bind(email, EMAIL_PURPOSE_LOGIN, nowSec - 60)
    .first();

  if (Number(perMinute?.c || 0) >= 1) {
    return jsonResponse(request, env, { ok: false, error: "too_many_requests" }, 429);
  }

  const perIpMinute = await env.DB.prepare(
    `SELECT COUNT(1) AS c FROM email_verification_codes
     WHERE ip = ? AND created_unix >= ?`
  )
    .bind(ip, nowSec - 60)
    .first();

  if (Number(perIpMinute?.c || 0) >= 3) {
    return jsonResponse(request, env, { ok: false, error: "too_many_requests" }, 429);
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const ttlSeconds = parseInt(env.EMAIL_CODE_TTL_SECONDS || "600", 10);
  const expiresUnix = nowSec + (Number.isFinite(ttlSeconds) ? ttlSeconds : 600);
  const nowIso = new Date().toISOString();
  const codeHash = await hashEmailCode(email, EMAIL_PURPOSE_LOGIN, code, env.JWT_SECRET);

  await env.DB.prepare(
    `INSERT INTO email_verification_codes
      (email, purpose, code_hash, expires_unix, consumed_at, attempts, ip, created_unix, created_at)
     VALUES (?, ?, ?, ?, NULL, 0, ?, ?, ?)`
  )
    .bind(email, EMAIL_PURPOSE_LOGIN, codeHash, expiresUnix, ip, nowSec, nowIso)
    .run();

  const allowDevCode = String(env.ALLOW_DEV_EMAIL_CODE || "0") === "1";
  if (allowDevCode) {
    return jsonResponse(request, env, {
      ok: true,
      expires_in: expiresUnix - nowSec,
      dev_preview_code: code,
    });
  }

  requireEnv(env, ["RESEND_API_KEY", "EMAIL_FROM"]);
  const sendResult = await sendVerificationEmail(env, email, code, expiresUnix - nowSec);
  if (!sendResult.ok) {
    return jsonResponse(
      request,
      env,
      {
        ok: false,
        error: "provider_unavailable",
        provider_status: sendResult.status || null,
        provider_detail: sendResult.detail || null,
      },
      502
    );
  }

  return jsonResponse(request, env, { ok: true, expires_in: expiresUnix - nowSec });
}

async function handleEmailVerifyCode(request, env) {
  requireEnv(env, ["JWT_SECRET"]);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, env, { ok: false, error: "invalid_json" }, 400);
  }

  const email = normalizeEmail(body?.email);
  const code = String(body?.code || "").trim();
  if (!isValidEmail(email)) {
    return jsonResponse(request, env, { ok: false, error: "invalid_email" }, 400);
  }
  if (!/^\d{6}$/.test(code)) {
    return jsonResponse(request, env, { ok: false, error: "invalid_code" }, 400);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const nowIso = new Date().toISOString();
  const maxAttempts = parseInt(env.EMAIL_CODE_MAX_ATTEMPTS || "5", 10);

  const codeRow = await env.DB.prepare(
    `SELECT id, code_hash, attempts, expires_unix
     FROM email_verification_codes
     WHERE email = ? AND purpose = ? AND consumed_at IS NULL
     ORDER BY id DESC LIMIT 1`
  )
    .bind(email, EMAIL_PURPOSE_LOGIN)
    .first();

  if (!codeRow || Number(codeRow.expires_unix || 0) < nowSec) {
    return jsonResponse(request, env, { ok: false, error: "invalid_or_expired_code" }, 400);
  }

  const attempts = Number(codeRow.attempts || 0);
  if (attempts >= maxAttempts) {
    return jsonResponse(request, env, { ok: false, error: "too_many_attempts" }, 429);
  }

  const expectedHash = await hashEmailCode(email, EMAIL_PURPOSE_LOGIN, code, env.JWT_SECRET);
  if (expectedHash !== String(codeRow.code_hash || "")) {
    const newAttempts = attempts + 1;
    await env.DB.prepare(
      "UPDATE email_verification_codes SET attempts = ?, consumed_at = CASE WHEN ? >= ? THEN ? ELSE consumed_at END WHERE id = ?"
    )
      .bind(newAttempts, newAttempts, maxAttempts, nowIso, codeRow.id)
      .run();
    return jsonResponse(request, env, { ok: false, error: "invalid_code" }, 400);
  }

  await env.DB.prepare("UPDATE email_verification_codes SET consumed_at = ? WHERE id = ?")
    .bind(nowIso, codeRow.id)
    .run();

  let user = await findUserByEmail(env, email);
  if (!user) {
    const login = deriveLoginFromEmail(email);
    await env.DB.prepare(
      `INSERT INTO users (github_id, login, email, avatar_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(`email:${randomBase64Url(12)}`, login, email, "", nowIso, nowIso)
      .run();

    user = await findUserByEmail(env, email);
  } else {
    await env.DB.prepare("UPDATE users SET email = COALESCE(email, ?), updated_at = ? WHERE id = ?")
      .bind(email, nowIso, user.id)
      .run();
    user = await getUserById(env, Number(user.id));
  }

  if (!user) {
    return jsonResponse(request, env, { ok: false, error: "user_upsert_failed" }, 500);
  }

  await markEmailVerified(env, user.id, email, nowIso);

  const headers = standardHeaders(request, env);
  await appendSessionCookie(headers, env, user);
  const favorites = await getUserFavorites(env, user.id);
  const fullUser = await getUserById(env, user.id);

  return new Response(
    JSON.stringify({ ok: true, user: fullUser, favorites }),
    {
      status: 200,
      headers,
    }
  );
}

async function sendVerificationEmail(env, toEmail, code, ttlSeconds) {
  const subject = "ScanSci 邮箱验证码";
  const text = `你的 ScanSci 验证码是 ${code}，${Math.max(1, Math.floor(ttlSeconds / 60))} 分钟内有效。`;
  const html = `<p>你的 <strong>ScanSci</strong> 验证码是：</p><h2 style=\"letter-spacing:4px\">${code}</h2><p>${Math.max(
    1,
    Math.floor(ttlSeconds / 60)
  )} 分钟内有效，请勿泄露。</p>`;

  const resp = await fetch((env.RESEND_API_BASE || "https://api.resend.com").replace(/\/$/, "") + "/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [toEmail],
      subject,
      text,
      html,
    }),
  });

  if (resp.ok) {
    return { ok: true, status: resp.status };
  }

  let body = "";
  try {
    body = await resp.text();
  } catch (_) {}

  // Keep provider diagnostics in logs for faster production debugging.
  console.error("Resend email send failed", {
    status: resp.status,
    body: body ? body.slice(0, 600) : "",
  });

  return { ok: false, status: resp.status, detail: body ? body.slice(0, 280) : null };
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

  const user = await getUserById(env, auth.userId);
  if (!user) {
    return jsonResponse(request, env, { ok: false, error: "unauthorized" }, 401);
  }

  const favorites = await getUserFavorites(env, auth.userId);
  return jsonResponse(request, env, { ok: true, user, favorites });
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
    const existing = await env.DB.prepare("SELECT 1 FROM user_favorites WHERE user_id = ? AND app_id = ? LIMIT 1")
      .bind(auth.userId, appId)
      .first();

    let isFavorite = false;
    if (existing) {
      await env.DB.prepare("DELETE FROM user_favorites WHERE user_id = ? AND app_id = ?")
        .bind(auth.userId, appId)
        .run();
    } else {
      await env.DB.prepare("INSERT INTO user_favorites (user_id, app_id, created_at) VALUES (?, ?, ?)")
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

async function handleElsevierSerialTitle(request, env) {
  const url = new URL(request.url);
  const issn = String(url.searchParams.get("issn") || "").trim();
  if (!issn) {
    return jsonResponse(request, env, { ok: false, error: "missing_issn" }, 400);
  }
  const cacheKey = normalizeIssnKey(issn);
  if (!cacheKey) {
    return jsonResponse(request, env, { ok: false, error: "invalid_issn" }, 400);
  }

  const staleLimitSeconds = Math.max(0, parseInt(env.ELSEVIER_CACHE_STALE_SECONDS || "2592000", 10) || 2592000);
  const cached = await loadElsevierCacheByKey(env, cacheKey);
  if (cached && !cached.isExpired) {
    return jsonWithSourceHeader(request, env, cached.payload, "d1-cache-fresh", {
      "X-ScanSci-Elsevier-Cache-Key": cached.issnKey,
      "X-ScanSci-Elsevier-Updated-Unix": String(cached.updatedUnix),
    });
  }

  const canUseStale =
    !!cached &&
    cached.isExpired &&
    Number.isFinite(cached.expiresUnix) &&
    Math.floor(Date.now() / 1000) - cached.expiresUnix <= staleLimitSeconds;

  const apiKey = String(env.ELSEVIER_API_KEY || "").trim();
  if (!apiKey) {
    if (canUseStale) {
      return jsonWithSourceHeader(request, env, cached.payload, "d1-cache-stale-no-key", {
        "Warning": '110 - "Response is stale"',
      });
    }
    return jsonResponse(request, env, { ok: false, error: "missing_api_key" }, 503);
  }

  const preferSecondary =
    String(env.ELSEVIER_SECONDARY_FIRST || "").trim() === "1" &&
    !!normalizeBaseUrl(env.ELSEVIER_SECONDARY_PROXY_BASE || "");
  if (preferSecondary) {
    const secondaryFirst = await requestElsevierViaSecondaryProxy(env, issn);
    if (secondaryFirst.ok) {
      await upsertElsevierCacheRecord(env, {
        issn,
        payload: secondaryFirst.payload,
        source: "secondary-proxy-primary",
      });
      return jsonWithSourceHeader(request, env, secondaryFirst.payload, "secondary-proxy-primary");
    }
  }

  const variants = buildElsevierIssnVariants(issn);
  if (!variants.length) {
    return jsonResponse(request, env, { ok: false, error: "invalid_issn" }, 400);
  }

  const failures = [];
  let winner = null;

  for (const candidate of variants) {
    const result = await requestElsevierSerialTitle(candidate, apiKey, env);
    if (result.ok) {
      winner = result;
      break;
    }
    failures.push(result);
  }

  if (!winner) {
    const fallback = await requestElsevierViaSecondaryProxy(env, issn);
    if (fallback.ok) {
      await upsertElsevierCacheRecord(env, {
        issn,
        payload: fallback.payload,
        source: "secondary-proxy-fallback",
      });
      return jsonWithSourceHeader(request, env, fallback.payload, "secondary-proxy-fallback");
    }

    if (canUseStale) {
      return jsonWithSourceHeader(request, env, cached.payload, "d1-cache-stale-fallback", {
        "Warning": '110 - "Response is stale"',
      });
    }

    const primary = failures[0] || { status: 502, payload: null, text: "", reason: "elsevier_unreachable" };
    const status = Number(primary.status) || 502;
    return jsonResponse(
      request,
      env,
      {
        ok: false,
        error: primary.reason || "elsevier_http_error",
        status,
        details: primary.payload || (primary.text ? primary.text.slice(0, 1200) : null),
      },
      status
    );
  }

  await upsertElsevierCacheRecord(env, {
    issn,
    payload: winner.payload,
    source: "elsevier-live",
  });
  return jsonWithSourceHeader(request, env, winner.payload, "elsevier-live");
}

async function handleCitationAnalyze(request, env) {
  const body = await parseJsonBody(request);
  const text = String(body?.text || "").trim();
  const mode = body?.mode === "references" ? "references" : "full";
  if (!text) {
    return jsonResponse(request, env, { detail: "text is required" }, 400);
  }

  const parsed = parseCitationInput(text, mode);
  const refs = Array.isArray(parsed.references) ? parsed.references : [];
  const verifiedRefs = await mapLimit(refs, 2, async (ref) => verifyCitationReference(ref));
  const referenceResults = {};
  for (const item of verifiedRefs) {
    referenceResults[item.ref_id] = item;
  }

  const anchorResults = buildCitationAnchorResults(parsed.anchors || [], referenceResults);
  return jsonResponse(request, env, {
    parse: parsed,
    reference_results: referenceResults,
    anchor_results: anchorResults,
  });
}

function parseCitationInput(text, mode) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return { body_text: "", reference_text: "", references: [], anchors: [] };
  }

  let bodyText = "";
  let referenceText = "";
  if (mode === "references") {
    referenceText = normalized;
  } else {
    const split = splitCitationBodyAndReferences(normalized);
    bodyText = split.bodyText;
    referenceText = split.referenceText;
  }

  const references = parseCitationReferences(referenceText || normalized);
  const anchors = mode === "references" ? [] : parseCitationAnchors(bodyText, references);
  return {
    body_text: bodyText,
    reference_text: referenceText,
    references,
    anchors,
  };
}

function splitCitationBodyAndReferences(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const splitIndex = findCitationReferenceStartIndex(lines);
  if (!Number.isFinite(splitIndex) || splitIndex < 0) {
    return { bodyText: text, referenceText: "" };
  }
  return {
    bodyText: lines.slice(0, splitIndex).join("\n").trim(),
    referenceText: lines.slice(splitIndex).join("\n").trim(),
  };
}

function parseCitationReferences(referenceText) {
  if (!String(referenceText || "").trim()) return [];
  const lines = String(referenceText || "").replace(/\r\n/g, "\n").split("\n");
  const entries = [];
  let currentLines = [];

  for (const line of lines) {
    const stripped = String(line || "").trim();
    if (!stripped) continue;
    if (isCitationReferenceHeadingLine(stripped)) continue;

    if (shouldStartNewCitationReferenceEntry(stripped, currentLines)) {
      if (currentLines.length) entries.push(compactCitationSpaces(currentLines.join(" ")));
      currentLines = [stripped];
      continue;
    }

    if (currentLines.length) {
      currentLines.push(stripped);
    } else {
      // Handles references that are not explicitly indexed.
      currentLines = [stripped];
    }
  }
  if (currentLines.length) {
    entries.push(compactCitationSpaces(currentLines.join(" ")));
  }

  const refs = [];
  for (let fallbackIdx = 1; fallbackIdx <= entries.length; fallbackIdx += 1) {
    const entry = entries[fallbackIdx - 1];
    const line = compactCitationSpaces(entry);
    if (!line || !looksLikeCitationEntry(line)) continue;

    const startMatch = line.match(CITATION_REF_START_RE);
    const indexText = startMatch?.[1] || startMatch?.[2] || startMatch?.[3] || "";
    const index = indexText ? Number(indexText) : fallbackIdx;
    const cleaned = startMatch ? line.slice(startMatch[0].length).trim() : line;
    const doi = extractCitationDoi(cleaned);
    const year = extractCitationYear(cleaned);
    const title = extractCitationTitle(cleaned, year, doi);
    const authorsSegment = extractCitationAuthorsSegment(cleaned, year);
    const authors = extractCitationAuthors(authorsSegment);
    const firstAuthor = authors.length ? authors[0].split(",")[0].trim() : null;

    refs.push({
      ref_id: String(index || fallbackIdx),
      raw: line,
      index: Number.isFinite(index) ? index : fallbackIdx,
      authors,
      first_author: firstAuthor || null,
      year: Number.isFinite(year) ? year : null,
      title: title || null,
      doi: doi || null,
    });
  }
  return refs;
}

function findCitationReferenceStartIndex(lines) {
  for (let i = 0; i < lines.length; i += 1) {
    if (isCitationHeaderLike(lines[i])) {
      return i + 1;
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = String(lines[i] || "").trim();
    if (!line) continue;
    if (isCitationReferenceLike(line) && citationReferenceDensity(lines, i, 4) >= 2) {
      return i;
    }
    break;
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = String(lines[i] || "").trim();
    if (!isCitationReferenceLike(line)) continue;
    if (CITATION_REF_START_RE.test(line)) {
      const prev = i > 0 ? String(lines[i - 1] || "").trim() : "";
      if (i === 0 || !prev || isCitationHeaderLike(prev)) {
        return i;
      }
      const nonEmptyTail = lines
        .slice(i)
        .map((x) => String(x || "").trim())
        .filter(Boolean);
      if (nonEmptyTail.length <= 2 && nonEmptyTail.every((x) => isCitationReferenceLike(x))) {
        return i;
      }
    }
    if (citationReferenceDensity(lines, i, 5) >= 2) {
      return i;
    }
  }
  return null;
}

function citationReferenceDensity(lines, startIdx, nonEmptyWindow = 5) {
  let seen = 0;
  let count = 0;
  for (let i = startIdx; i < lines.length; i += 1) {
    const stripped = String(lines[i] || "").trim();
    if (!stripped) continue;
    seen += 1;
    if (isCitationReferenceLike(stripped)) count += 1;
    if (seen >= nonEmptyWindow) break;
  }
  return count;
}

function isCitationHeaderLike(line) {
  const candidate = String(line || "").trim();
  if (!candidate) return false;
  if (isCitationReferenceLike(candidate) || CITATION_REF_START_RE.test(candidate)) return false;
  const compact = candidate
    .toLowerCase()
    .replace(/[\s:：\-()（）[\]{}\.]/g, "");
  const keywords = ["references", "reference", "bibliography", "参考文献", "文献清单", "参考书目", "works cited"];
  return keywords.some((k) => compact.includes(k));
}

function isCitationReferenceLike(line) {
  const candidate = String(line || "").trim();
  if (!candidate) return false;
  const hasYear = CITATION_YEAR_RE.test(candidate);
  const hasDoi = Boolean(extractCitationDoi(candidate));
  const startsWithIndex = CITATION_REF_START_RE.test(candidate);
  const hasAuthorSignal = /\bet al\.|\b[A-Z][a-z]+,\s*[A-Z]|&| and |等/.test(candidate);
  const hasStyleTag = /\[[A-Za-z\u4e00-\u9fff/]{1,8}\]/.test(candidate);
  const hasQuoteTitle = /["“‘《](.+?)["”’》]/.test(candidate);
  const hasMlaSignal = CITATION_MLA_DETAIL_RE.test(candidate);
  return (
    (startsWithIndex && (hasYear || hasDoi || hasStyleTag)) ||
    ((hasYear || hasDoi) && (hasAuthorSignal || hasStyleTag || hasQuoteTitle || hasMlaSignal))
  );
}

function shouldStartNewCitationReferenceEntry(strippedLine, currentLines) {
  if (CITATION_REF_START_RE.test(strippedLine)) return true;
  if (!currentLines || !currentLines.length) return true;
  if (!isCitationReferenceLike(strippedLine)) return false;

  const currentText = compactCitationSpaces(currentLines.join(" "));
  if (extractCitationDoi(currentText)) return true;
  if (CITATION_YEAR_RE.test(currentText) && /[.。]\s*$/.test(currentLines[currentLines.length - 1])) return true;
  if (CITATION_YEAR_RE.test(currentText) && /^[A-Z][A-Za-z'`\-]+,\s+[A-Z]/.test(strippedLine)) return true;
  return false;
}

function isCitationReferenceHeadingLine(line) {
  const text = String(line || "").trim();
  if (!text) return false;
  const compactCn = text.replace(/\s+/g, "");
  if (/^(参考文献|参考文献清单|文献|引用文献)([（(].*[)）])?$/.test(compactCn)) {
    return true;
  }
  const compactEn = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[:：]/g, "")
    .trim();
  return /^(references?|reference list|bibliography|works cited)(\s*\(.*\))?$/.test(compactEn);
}

function looksLikeCitationEntry(line) {
  const text = String(line || "").trim();
  if (!text) return false;
  if (extractCitationDoi(text)) return true;
  if (CITATION_YEAR_RE.test(text)) return true;
  if (/^[A-Z][A-Za-z'`\-]+,\s*[A-Z]/.test(text)) return true;
  if (/[\u4e00-\u9fa5].{4,}(期刊|卷|页|doi|DOI|\d{4})/.test(text)) return true;
  return text.length >= 28;
}

function extractCitationDoi(text) {
  const match = String(text || "").match(CITATION_DOI_RE);
  if (!match) return "";
  return normalizeCitationDoi(match[1]);
}

function normalizeCitationDoi(raw) {
  let doi = String(raw || "").trim();
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  doi = doi.replace(/[.,;:!?"'`，。；：！？]+$/g, "");
  return doi.toLowerCase();
}

function compactCitationSpaces(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function extractCitationYear(cleanedRef) {
  if (!cleanedRef) return null;
  let scrubbed = String(cleanedRef);
  scrubbed = scrubbed.replace(/https?:\/\/\S+/gi, " ");
  scrubbed = scrubbed.replace(/\bdoi:\s*10\.\S+/gi, " ");

  const paren = scrubbed.match(CITATION_PAREN_YEAR_RE);
  if (paren?.[1]) {
    const n = Number(paren[1]);
    if (Number.isFinite(n)) return n;
  }

  const matches = [...scrubbed.matchAll(/\b(19|20)\d{2}[a-z]?\b/gi)];
  if (!matches.length) return null;

  const scored = matches.map((m) => {
    const token = String(m[0] || "");
    const start = Number(m.index || 0);
    const end = start + token.length;
    let score = 0;
    const left = scrubbed.slice(Math.max(0, start - 18), start).toLowerCase();
    const right = scrubbed.slice(end, Math.min(scrubbed.length, end + 18)).toLowerCase();
    const around = scrubbed.slice(Math.max(0, start - 8), Math.min(scrubbed.length, end + 8));
    if (/\d{4}\s*[-–]\s*\d{4}/.test(around)) score -= 4;
    if (/(from|between|since|期间|自)\s*$/i.test(left)) score -= 2;
    if (/(vol\.|no\.|pp\.|issue|卷|期)$/i.test(left)) score += 2;
    if (/^[\s,.;:)\]]/.test(right)) score += 1;
    if (start < 120) score += 1;
    if (start >= Math.max(0, scrubbed.length - 80)) score += 1;
    const year = Number(token.slice(0, 4));
    return { year, score, start };
  });

  scored.sort((a, b) => (b.score !== a.score ? b.score - a.score : b.start - a.start));
  return Number.isFinite(scored[0]?.year) ? scored[0].year : null;
}

function extractCitationAuthorsSegment(cleanedRef, year) {
  const text = String(cleanedRef || "");
  const quoteMatch = text.match(/["“‘《](.+?)["”’》]/);
  if (quoteMatch && Number.isFinite(quoteMatch.index) && quoteMatch.index > 0) {
    return text.slice(0, quoteMatch.index).trim().replace(/[ .;,]+$/, "");
  }

  if (Number.isFinite(year)) {
    const yearMatch = text.match(new RegExp(`\\(?\\b${year}[a-z]?\\b\\)?`, "i"));
    if (yearMatch && Number.isFinite(yearMatch.index) && yearMatch.index > 0 && yearMatch.index < 90) {
      return text.slice(0, yearMatch.index).trim().replace(/[ .;,]+$/, "");
    }
  }

  const firstDot = text.search(/[.。]/);
  if (firstDot > 0) {
    return text.slice(0, firstDot).trim().replace(/[ .;,]+$/, "");
  }
  return text.trim().replace(/[ .;,]+$/, "");
}

function extractCitationTitle(text, year, doi) {
  let candidate = String(text || "");
  if (doi) {
    candidate = candidate.replace(new RegExp(escapeRegExp(doi), "ig"), " ");
  }

  const quoteMatch = candidate.match(/["“‘《](.+?)["”’》]/);
  if (quoteMatch?.[1]) {
    const quoted = compactCitationSpaces(quoteMatch[1]);
    if (quoted.length >= 4) return quoted;
  }

  const gbMatch = candidate.match(/[.。]\s*([^。.\[\]]{4,}?)\s*\[[A-Za-z\u4e00-\u9fff/]{1,8}\]/);
  if (gbMatch?.[1]) {
    const gbTitle = compactCitationSpaces(gbMatch[1].replace(CITATION_STYLE_TYPE_TAG_RE, ""));
    if (gbTitle.length >= 4) return gbTitle;
  }

  // Common APA-like pattern: (2020). Title.
  const apaLike = candidate.match(
    /\(\s*(?:19|20)\d{2}[a-z]?\s*\)\s*\.?\s*([^.。]{4,260})[.。]/i
  );
  if (apaLike?.[1]) {
    return compactCitationSpaces(apaLike[1]);
  }

  if (Number.isFinite(year)) {
    const yearPattern = new RegExp(`\\(?\\b${year}[a-z]?\\b\\)?`, "ig");
    const first = candidate.search(yearPattern);
    if (first >= 0) {
      const matched = candidate.match(yearPattern)?.[0] || "";
      candidate = candidate.slice(first + matched.length);
    }
  }

  const parts = candidate
    .split(/[.。]\s*/)
    .map((p) => compactCitationSpaces(p.replace(CITATION_STYLE_TYPE_TAG_RE, "")))
    .filter(Boolean);
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    // Skip likely author segment like "Polack, F. P., Thomas, S. J."
    if (i === 0 && /,\s*[A-Z]\./.test(part) && parts.length > 1) continue;
    if (part.length < 6) continue;
    if (/https?:\/\//i.test(part)) continue;
    if (/^(?:doi:)?\s*10\./i.test(part)) continue;
    if (/^\d+$/.test(part)) continue;
    if (/^\(?\d{4}[a-z]?\)?$/i.test(part)) continue;
    if (CITATION_MLA_DETAIL_RE.test(part)) continue;
    if (/^[A-Z][A-Za-z'`\-]+,\s*[A-Z]/.test(part)) continue;
    if (part.includes("/") && part.length < 20) continue;
    return part;
  }
  return parts[0] || "";
}

function extractCitationAuthors(authorsSegment) {
  const segment = String(authorsSegment || "")
    .replace(CITATION_REF_START_RE, "")
    .replace(/\bet al\.?/gi, "")
    .trim();
  if (!segment) return [];

  const regexMatches = [...segment.matchAll(/([A-Z][A-Za-z'`\-]+,\s*(?:[A-Z]\.\s*){1,4})/g)].map((m) =>
    compactCitationSpaces(String(m[1] || "").replace(/[.,;]+$/g, ""))
  );
  if (regexMatches.length) {
    return [...new Set(regexMatches)].slice(0, 12);
  }

  const parts = segment
    .split(/\s*(?:;| and | & |，|、)\s*/i)
    .map((p) => compactCitationSpaces(p.replace(/[.,;]+$/g, "")))
    .filter(Boolean);
  return [...new Set(parts)].slice(0, 8);
}

function parseCitationAnchors(bodyText, references) {
  const text = String(bodyText || "");
  if (!text) return [];
  const anchors = [];
  let match;
  let seq = 1;
  while ((match = CITATION_NUMERIC_CITATION_RE.exec(text)) !== null) {
    const marker = match[0];
    const linked = expandCitationMarkerIds(match[1], references);
    const sentence = extractSentenceAround(text, match.index, match.index + marker.length);
    anchors.push({
      anchor_id: `A${seq}`,
      marker,
      start: match.index,
      end: match.index + marker.length,
      linked_ref_ids: linked,
      context: sentence,
      claim: sentence,
    });
    seq += 1;
  }
  return anchors;
}

function expandCitationMarkerIds(content, references) {
  const maxIndex = Math.max(50, ...references.map((r) => Number(r.index || 0)).filter(Boolean));
  const out = new Set();
  const blocks = String(content || "").split(/[;,]/).map((x) => x.trim()).filter(Boolean);
  for (const block of blocks) {
    const range = block.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start && end - start <= 20) {
        for (let i = start; i <= end && i <= maxIndex; i += 1) out.add(String(i));
      }
      continue;
    }
    const n = Number(block);
    if (Number.isFinite(n) && n > 0 && n <= maxIndex) out.add(String(n));
  }
  return [...out];
}

function extractSentenceAround(text, start, end) {
  const left = Math.max(0, String(text).lastIndexOf(".", start - 1), String(text).lastIndexOf("。", start - 1));
  const rightDot = String(text).indexOf(".", end);
  const rightCn = String(text).indexOf("。", end);
  const rightCandidates = [rightDot, rightCn].filter((x) => x >= 0);
  const right = rightCandidates.length ? Math.min(...rightCandidates) + 1 : String(text).length;
  return String(text).slice(left > 0 ? left + 1 : 0, right).trim();
}

async function verifyCitationReference(ref) {
  const doi = normalizeCitationDoi(ref?.doi || "");
  const crossrefMeta = await fetchCrossrefByReference(ref);
  const openalexMeta = await fetchOpenAlexByReference(ref);
  const dataciteMeta = await fetchDataCiteByReference(ref);
  const semanticMeta = await fetchSemanticScholarByReference(ref);

  const sourceMetadata = {
    crossref: crossrefMeta,
    openalex: openalexMeta,
    datacite: dataciteMeta,
    semanticscholar: semanticMeta,
  };
  const sourcesFound = citationSourcesFound(sourceMetadata);
  const official = pickBestCitationOfficial(ref, sourceMetadata);
  const sourceLinks = buildCitationSourceLinks(sourceMetadata, ref, official);

  if (!official) {
    if (doi) {
      const resolvable = await checkDoiResolvable(doi);
      if (resolvable) {
        return {
          ref_id: String(ref.ref_id),
          status: "yellow",
          label: citationStatusLabel("yellow"),
          reason: "DOI 可解析到落地页，但主数据源暂未返回结构化元数据，建议复核。",
          score: 0.42,
          official: {
            source: "doi",
            title: ref?.title || null,
            authors: ref?.authors || [],
            journal: null,
            year: Number(ref?.year || 0) || null,
            doi,
            url: `https://doi.org/${encodeURI(doi)}`,
            abstract: null,
          },
          conflicts: [],
          sources_found: [],
          source_links: sourceLinks,
          citation_suggestions: await buildCitationSuggestions(
            {
              title: ref?.title || "",
              authors: ref?.authors || [],
              journal: "",
              year: Number(ref?.year || 0) || null,
              doi,
            },
            doi
          ),
        };
      }
    }
    return {
      ref_id: String(ref.ref_id),
      status: "red",
      label: citationStatusLabel("red"),
      reason: "Crossref / OpenAlex / DataCite / Semantic Scholar 均未命中，疑似捏造或信息缺失。",
      score: 0.05,
      official: null,
      conflicts: [],
      sources_found: sourcesFound,
      source_links: sourceLinks,
      citation_suggestions: {},
    };
  }

  const observedYears = Object.values(sourceMetadata)
    .map((item) => Number(item?.year || 0))
    .filter((n) => Number.isFinite(n) && n > 1000);
  const { conflicts, status: evaluatedStatus, score: evaluatedScore } = computeCitationMetadataConflicts(
    ref,
    official,
    observedYears
  );

  let status = evaluatedStatus;
  let score = evaluatedScore;
  const citationSuggestions = await buildCitationSuggestions(official, official.doi || ref.doi || "");
  const sourceSummary = summarizeCitationSources(sourcesFound);

  if (status === "green" && sourcesFound.length >= 2) {
    score = Math.min(0.99, score + 0.02 * (sourcesFound.length - 1));
  } else if (status === "yellow" && sourcesFound.length >= 3) {
    score = Math.min(0.75, score + 0.05);
  }

  let reason = "";
  if (status === "green") {
    reason = `多源命中（${sourceSummary}），标题/年份整体匹配。`;
  } else if (status === "yellow") {
    reason = `多源命中（${sourceSummary}），但存在字段偏差（${conflicts.length} 项）。`;
  } else {
    reason = `多源命中（${sourceSummary}），但核心字段冲突（${conflicts.length} 项）。`;
  }

  return {
    ref_id: String(ref.ref_id),
    status,
    label: citationStatusLabel(status),
    reason,
    score: Number(score.toFixed(3)),
    official,
    conflicts: conflicts || [],
    sources_found: sourcesFound,
    source_links: sourceLinks,
    citation_suggestions: citationSuggestions,
  };
}

function buildCitationAnchorResults(anchors, referenceResults) {
  const out = [];
  for (const anchor of anchors) {
    const linked = (anchor?.linked_ref_ids || []).map((id) => referenceResults[String(id)]).filter(Boolean);
    const metadataScore = linked.length ? average(linked.map((r) => statusToScore(r.status))) : 0.35;
    const relevanceScore = linked.length ? average(linked.map((r) => Math.max(0.2, r.score || 0))) : 0.35;
    const supportScore = linked.length ? Math.max(0.2, Math.min(1, (metadataScore + relevanceScore) / 2)) : 0.35;
    const overall = average([metadataScore, relevanceScore, supportScore]);
    const overallStatus = scoreToCitationStatus(overall);

    const dimensions = {
      metadata: toCitationDimension(metadataScore, "元数据"),
      relevance: toCitationDimension(relevanceScore, "相关性"),
      support: toCitationDimension(supportScore, "支持度"),
    };

    out.push({
      anchor_id: anchor.anchor_id,
      marker: anchor.marker,
      linked_ref_ids: anchor.linked_ref_ids || [],
      overall_status: overallStatus,
      overall_label: citationStatusLabel(overallStatus),
      context: anchor.context || "",
      claim: anchor.claim || anchor.context || "",
      dimensions,
      linked_reference_results: linked,
      radar: {
        metadata: Number(metadataScore.toFixed(3)),
        relevance: Number(relevanceScore.toFixed(3)),
        support: Number(supportScore.toFixed(3)),
        overall: Number(overall.toFixed(3)),
      },
    });
  }
  return out;
}

function toCitationDimension(score, name) {
  const status = scoreToCitationStatus(score);
  return {
    status,
    label: `${name}${citationStatusLabel(status)}`,
    score: Number(score.toFixed(3)),
    reason: `${name}评分 ${Math.round(score * 100)} / 100`,
  };
}

function statusToScore(status) {
  if (status === "green") return 0.95;
  if (status === "yellow") return 0.62;
  if (status === "red") return 0.18;
  return 0.35;
}

function scoreToCitationStatus(score) {
  if (score >= 0.78) return "green";
  if (score >= 0.48) return "yellow";
  if (score > 0.001) return "red";
  return "white";
}

function citationStatusLabel(status) {
  if (status === "green") return "正常";
  if (status === "yellow") return "需复核";
  if (status === "red") return "高风险";
  return "证据不足";
}

function citationSourcesFound(sourceMetadata) {
  const found = [];
  for (const source of CITATION_SOURCE_ORDER) {
    if (sourceMetadata?.[source]) found.push(source);
  }
  return found;
}

function summarizeCitationSources(foundSources) {
  if (!Array.isArray(foundSources) || !foundSources.length) return "无";
  return foundSources.map((s) => CITATION_SOURCE_LABELS[s] || s).join(" / ");
}

function pickBestCitationOfficial(ref, sourceMetadata) {
  const candidates = Object.values(sourceMetadata || {}).filter(Boolean);
  if (!candidates.length) return null;
  const userTitle = String(ref?.title || "");
  if (!userTitle) {
    candidates.sort((a, b) => {
      const aKey =
        (CITATION_SOURCE_PRIORITY[a.source] || 0) * 100 +
        (a?.abstract ? 10 : 0) +
        (a?.doi ? 5 : 0);
      const bKey =
        (CITATION_SOURCE_PRIORITY[b.source] || 0) * 100 +
        (b?.abstract ? 10 : 0) +
        (b?.doi ? 5 : 0);
      return bKey - aKey;
    });
    return candidates[0];
  }

  candidates.sort((a, b) => {
    const aScore =
      simpleTextSimilarity(userTitle, a.title || "") * 1.2 +
      (a?.abstract ? 0.08 : 0) +
      (a?.doi ? 0.05 : 0) +
      (CITATION_SOURCE_PRIORITY[a.source] || 0) * 0.02;
    const bScore =
      simpleTextSimilarity(userTitle, b.title || "") * 1.2 +
      (b?.abstract ? 0.08 : 0) +
      (b?.doi ? 0.05 : 0) +
      (CITATION_SOURCE_PRIORITY[b.source] || 0) * 0.02;
    return bScore - aScore;
  });
  return candidates[0];
}

function buildCitationSourceLinks(sourceMetadata, reference, official) {
  const links = {};
  let preferredDoi = normalizeCitationDoi(official?.doi || "");
  if (!preferredDoi) {
    for (const source of CITATION_SOURCE_ORDER) {
      const candidate = sourceMetadata?.[source];
      if (candidate?.doi) {
        preferredDoi = normalizeCitationDoi(candidate.doi || "");
        if (preferredDoi) break;
      }
    }
  }
  if (!preferredDoi) {
    preferredDoi = normalizeCitationDoi(reference?.doi || "");
  }

  const crossrefMeta = sourceMetadata?.crossref;
  if (preferredDoi) {
    links.doi = `https://doi.org/${encodeURI(preferredDoi)}`;
    links.crossref = crossrefMeta?.url || links.doi;
    links.openalex = `https://openalex.org/works?filter=doi:${encodeURIComponent(preferredDoi)}`;
    links.datacite = `https://commons.datacite.org/doi.org/${encodeURI(preferredDoi)}`;
    links.semanticscholar = `https://www.semanticscholar.org/search?q=${encodeURIComponent(preferredDoi)}`;
  } else if (crossrefMeta?.url) {
    links.crossref = crossrefMeta.url;
  } else if (reference?.title) {
    links.crossref = `https://search.crossref.org/?q=${encodeURIComponent(reference.title)}`;
  }

  if (sourceMetadata?.openalex?.url) links.openalex = sourceMetadata.openalex.url;
  if (sourceMetadata?.semanticscholar?.url) links.semanticscholar = sourceMetadata.semanticscholar.url;
  if (sourceMetadata?.datacite?.doi) {
    links.datacite = `https://commons.datacite.org/doi.org/${encodeURI(sourceMetadata.datacite.doi)}`;
  }
  return links;
}

function computeCitationMetadataConflicts(reference, official, allOfficialYears = []) {
  const conflicts = [];
  let critical = false;
  const userDoi = normalizeCitationDoi(reference?.doi || "");
  const officialDoi = normalizeCitationDoi(official?.doi || "");
  const doiAligned = Boolean(userDoi && officialDoi && userDoi === officialDoi);

  let titleSim = null;
  let authorSim = null;

  if (userDoi && officialDoi && userDoi !== officialDoi) {
    conflicts.push({
      field: "doi",
      user_value: userDoi,
      official_value: officialDoi,
      level: "critical",
      similarity: null,
    });
    critical = true;
  }

  if (reference?.title && official?.title) {
    titleSim = simpleTextSimilarity(reference.title, official.title);
    if (doiAligned) {
      if (titleSim < 0.45) {
        conflicts.push({
          field: "title",
          user_value: reference.title,
          official_value: official.title,
          similarity: Number(titleSim.toFixed(3)),
          level: "warning",
        });
      }
    } else if (titleSim < 0.8) {
      conflicts.push({
        field: "title",
        user_value: reference.title,
        official_value: official.title,
        similarity: Number(titleSim.toFixed(3)),
        level: "critical",
      });
      critical = true;
    } else if (titleSim < 0.9) {
      conflicts.push({
        field: "title",
        user_value: reference.title,
        official_value: official.title,
        similarity: Number(titleSim.toFixed(3)),
        level: "warning",
      });
    }
  }

  if (reference?.first_author && Array.isArray(official?.authors) && official.authors.length) {
    const officialFirst = String(official.authors[0] || "").split(",")[0].trim();
    authorSim = simpleTextSimilarity(reference.first_author, officialFirst);
    const threshold = doiAligned ? 0.35 : 0.5;
    if (authorSim < threshold) {
      conflicts.push({
        field: "first_author",
        user_value: reference.first_author,
        official_value: officialFirst,
        similarity: Number(authorSim.toFixed(3)),
        level: "warning",
      });
    }
  }

  if (Number.isFinite(reference?.year) && Number.isFinite(official?.year)) {
    const knownYears = [...new Set((allOfficialYears || []).filter((y) => Number.isFinite(y)).map((y) => Number(y)))].sort(
      (a, b) => a - b
    );
    let yearGap = knownYears.includes(Number(reference.year))
      ? 0
      : Math.abs(Number(reference.year) - Number(official.year));
    const strongIdentity =
      doiAligned ||
      ((titleSim === null || titleSim >= 0.9) && (authorSim === null || authorSim >= 0.45));
    if (!(yearGap <= 1 || (strongIdentity && yearGap <= 2))) {
      let level = "warning";
      const weakIdentity =
        !doiAligned && (titleSim === null || titleSim < 0.75) && (authorSim === null || authorSim < 0.4);
      if (yearGap >= 5 && weakIdentity) {
        level = "critical";
        critical = true;
      }
      let officialYearValue = String(official.year);
      if (knownYears.length) {
        const text = knownYears.slice(0, 4).join("/");
        officialYearValue = knownYears.length > 4 ? `${official.year} (multi:${text}/...)` : `${official.year} (multi:${text})`;
      }
      conflicts.push({
        field: "year",
        user_value: String(reference.year),
        official_value: officialYearValue,
        similarity: null,
        level,
      });
    }
  }

  if (critical) return { conflicts, status: "red", score: 0.2 };
  if (conflicts.length) return { conflicts, status: "yellow", score: doiAligned ? 0.68 : 0.6 };
  return { conflicts, status: "green", score: doiAligned ? 0.97 : 0.95 };
}

function fallbackCitationAuthorList(authors, maxAuthors = 6) {
  const normalized = (authors || []).map((a) => compactCitationSpaces(a)).filter(Boolean);
  if (!normalized.length) return "Unknown";
  if (normalized.length <= maxAuthors) return normalized.join(", ");
  return `${normalized.slice(0, maxAuthors).join(", ")}, et al.`;
}

function buildFallbackCitationText(style, official, doi) {
  const title = compactCitationSpaces(official?.title || "");
  const year = official?.year ? String(official.year) : "n.d.";
  const journal = compactCitationSpaces(official?.journal || "");
  const authors = fallbackCitationAuthorList(official?.authors || []);
  const doiUrl = doi ? `https://doi.org/${doi}` : "";
  if (!title && !journal) return null;
  if (style === "apa") return compactCitationSpaces(`${authors}. (${year}). ${title}. ${journal}. ${doiUrl}`);
  if (style === "modern-language-association")
    return compactCitationSpaces(`${authors}. "${title}." ${journal}, ${year}, ${doiUrl}.`);
  if (style === "ieee") return compactCitationSpaces(`${authors}, "${title}," ${journal}, ${year}. ${doiUrl}`);
  if (style === "chicago-author-date") return compactCitationSpaces(`${authors}. ${year}. "${title}." ${journal}. ${doiUrl}`);
  if (style === "china-national-standard-gb-t-7714-2015-numeric")
    return compactCitationSpaces(`${authors}. ${title}[J]. ${journal}, ${year}. DOI:${doi || ""}`);
  if (style === "china-national-standard-gb-t-7714-2015-author-date")
    return compactCitationSpaces(`${authors}, ${year}. ${title}[J]. ${journal}. DOI:${doi || ""}`);
  return compactCitationSpaces(`${authors}. ${title}. ${journal}, ${year}. ${doiUrl}`);
}

function normalizeGbEnglishCitation(style, citationText, official) {
  if (!citationText) return citationText;
  if (!style.startsWith("china-national-standard-gb-t-7714-2015")) return citationText;
  const title = compactCitationSpaces(official?.title || "");
  const mixed = `${title} ${citationText}`;
  const latin = (mixed.match(/[A-Za-z]/g) || []).length;
  const cjk = (mixed.match(/[\u4e00-\u9fff]/g) || []).length;
  if (latin < 16 || cjk > 6) return citationText;
  return compactCitationSpaces(
    citationText.replace(/([,，]\s*)等([,，.。])/g, "$1et al$2").replace(/\s+等([,，.。])/g, " et al$1")
  );
}

async function fetchDoiBibliography(doi, style) {
  if (!doi) return null;
  const url = `https://doi.org/${encodeURI(doi)}`;
  const text = await fetchTextSafe(url, {
    headers: {
      Accept: `text/x-bibliography; style=${style}`,
      "User-Agent": "ScanSci-Worker",
    },
  });
  if (!text) return null;
  const cleaned = compactCitationSpaces(text);
  if (!cleaned) return null;
  if (cleaned.startsWith("{") && cleaned.includes("message-type") && /error/i.test(cleaned)) return null;
  return cleaned;
}

async function buildCitationSuggestions(official, doiLike) {
  const doi = normalizeCitationDoi(doiLike || "");
  const cacheKey = doi || "";
  if (cacheKey && CITATION_SUGGESTION_CACHE.has(cacheKey)) {
    return { ...CITATION_SUGGESTION_CACHE.get(cacheKey) };
  }

  const suggestions = {};
  if (doi) {
    const tasks = CITATION_STYLE_ORDER.map((style) => fetchDoiBibliography(doi, style));
    const results = await Promise.all(tasks);
    for (let i = 0; i < CITATION_STYLE_ORDER.length; i += 1) {
      const style = CITATION_STYLE_ORDER[i];
      const value = results[i];
      if (value) suggestions[style] = normalizeGbEnglishCitation(style, value, official);
    }
  }

  if (official) {
    for (const style of CITATION_STYLE_ORDER) {
      if (suggestions[style]) continue;
      const fallback = buildFallbackCitationText(style, official, doi);
      if (fallback) suggestions[style] = normalizeGbEnglishCitation(style, fallback, official);
    }
  }

  if (cacheKey && Object.keys(suggestions).length) {
    CITATION_SUGGESTION_CACHE.set(cacheKey, { ...suggestions });
  }
  return suggestions;
}

function extractCrossrefYear(message) {
  const readYear = (fieldName) => {
    const parts = message?.[fieldName]?.["date-parts"];
    if (Array.isArray(parts) && parts.length && Array.isArray(parts[0]) && parts[0].length) {
      const n = Number(parts[0][0]);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };
  for (const key of ["published-print", "issued", "published-online", "created", "deposited"]) {
    const y = readYear(key);
    if (y) return y;
  }
  return null;
}

function stripHtmlTags(text) {
  return compactCitationSpaces(String(text || "").replace(/<[^>]+>/g, " "));
}

function decodeOpenAlexAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== "object") return null;
  const words = [];
  for (const [token, positions] of Object.entries(invertedIndex)) {
    if (!Array.isArray(positions)) continue;
    for (const p of positions) {
      if (!Number.isFinite(Number(p))) continue;
      words.push([Number(p), token]);
    }
  }
  if (!words.length) return null;
  words.sort((a, b) => a[0] - b[0]);
  return compactCitationSpaces(words.map((x) => x[1]).join(" "));
}

function extractCrossrefAuthors(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((a) => compactCitationSpaces([a?.family, a?.given].filter(Boolean).join(", ")))
    .filter(Boolean)
    .slice(0, 12);
}

function extractOpenAlexAuthors(authorships) {
  if (!Array.isArray(authorships)) return [];
  return authorships
    .map((x) => compactCitationSpaces(x?.author?.display_name || ""))
    .filter(Boolean)
    .slice(0, 12);
}

function extractDataCiteAuthors(creators) {
  if (!Array.isArray(creators)) return [];
  return creators
    .map((c) => compactCitationSpaces(c?.name || [c?.familyName, c?.givenName].filter(Boolean).join(", ")))
    .filter(Boolean)
    .slice(0, 12);
}

function extractSemanticAuthors(authors) {
  if (!Array.isArray(authors)) return [];
  return authors.map((a) => compactCitationSpaces(a?.name || "")).filter(Boolean).slice(0, 12);
}

function appendQuery(url, params) {
  const qs = new URLSearchParams(params || {}).toString();
  return qs ? `${url}?${qs}` : url;
}

function citationFirstAuthorName(authors) {
  if (!Array.isArray(authors) || !authors.length) return "";
  return compactCitationSpaces(String(authors[0] || "").split(",")[0]).toLowerCase();
}

function scoreCitationCandidateForReference(ref, candidate) {
  const userTitle = compactCitationSpaces(ref?.title || "");
  const candidateTitle = compactCitationSpaces(candidate?.title || "");
  const titleSim = userTitle && candidateTitle ? simpleTextSimilarity(userTitle, candidateTitle) : 0;

  const userAuthor = compactCitationSpaces(ref?.first_author || "").toLowerCase();
  const candAuthor = citationFirstAuthorName(candidate?.authors || []);
  const authorSim = userAuthor && candAuthor ? simpleTextSimilarity(userAuthor, candAuthor) : 0.55;

  let yearScore = 0.65;
  if (Number.isFinite(ref?.year) && Number.isFinite(candidate?.year)) {
    const gap = Math.abs(Number(ref.year) - Number(candidate.year));
    if (gap === 0) yearScore = 1;
    else if (gap === 1) yearScore = 0.8;
    else if (gap === 2) yearScore = 0.6;
    else if (gap <= 4) yearScore = 0.35;
    else yearScore = 0.1;
  }

  const userDoi = normalizeCitationDoi(ref?.doi || "");
  const candDoi = normalizeCitationDoi(candidate?.doi || "");
  const doiBonus = userDoi && candDoi && userDoi === candDoi ? 0.3 : 0;

  const score = 0.72 * titleSim + 0.18 * authorSim + 0.1 * yearScore + doiBonus;
  return {
    score,
    titleSim,
  };
}

function pickBestCitationCandidateForReference(ref, candidates) {
  const list = (candidates || []).filter(Boolean);
  if (!list.length) return null;
  if (!ref?.title) return list[0];

  const scored = list
    .map((item) => ({ item, ...scoreCitationCandidateForReference(ref, item) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) return null;

  const userDoi = normalizeCitationDoi(ref?.doi || "");
  const bestDoi = normalizeCitationDoi(best.item?.doi || "");
  const doiAligned = userDoi && bestDoi && userDoi === bestDoi;

  if (!doiAligned && best.titleSim < 0.72) return null;
  if (!doiAligned && best.score < 0.58) return null;
  return best.item;
}

async function fetchCrossrefByReference(ref) {
  const doi = normalizeCitationDoi(ref?.doi || "");
  let message = null;
  if (doi) {
    const payload = await fetchJsonSafe(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: { Accept: "application/json" },
    });
    message = payload?.message || null;
  }
  if (!message && ref?.title) {
    const url = appendQuery("https://api.crossref.org/works", {
      "query.bibliographic": ref.title,
      rows: "8",
    });
    const payload = await fetchJsonSafe(url, { headers: { Accept: "application/json" } });
    const items = Array.isArray(payload?.message?.items) ? payload.message.items : [];
    const candidates = items.map((item) => {
      const title = Array.isArray(item.title) ? String(item.title[0] || "") : String(item.title || "");
      const journal = Array.isArray(item["container-title"])
        ? String(item["container-title"][0] || "")
        : String(item["container-title"] || "");
      return {
        source: "crossref",
        title: compactCitationSpaces(title) || null,
        authors: extractCrossrefAuthors(item.author),
        journal: compactCitationSpaces(journal) || null,
        year: extractCrossrefYear(item),
        doi: normalizeCitationDoi(item.DOI || "") || null,
        url: String(item.URL || "") || null,
        abstract: stripHtmlTags(item.abstract || ""),
      };
    });
    return pickBestCitationCandidateForReference(ref, candidates);
  }
  if (!message) return null;
  const title = Array.isArray(message.title) ? String(message.title[0] || "") : String(message.title || "");
  const journal = Array.isArray(message["container-title"])
    ? String(message["container-title"][0] || "")
    : String(message["container-title"] || "");
  return {
    source: "crossref",
    title: compactCitationSpaces(title) || null,
    authors: extractCrossrefAuthors(message.author),
    journal: compactCitationSpaces(journal) || null,
    year: extractCrossrefYear(message),
    doi: normalizeCitationDoi(message.DOI || doi) || null,
    url: String(message.URL || (doi ? `https://doi.org/${encodeURI(doi)}` : "")) || null,
    abstract: stripHtmlTags(message.abstract || ""),
  };
}

async function fetchOpenAlexByReference(ref) {
  const doi = normalizeCitationDoi(ref?.doi || "");
  let item = null;
  if (doi) {
    const payload = await fetchJsonSafe(
      appendQuery("https://api.openalex.org/works", { filter: `doi:https://doi.org/${doi}`, "per-page": "1" }),
      { headers: { Accept: "application/json" } }
    );
    item = payload?.results?.[0] || null;
  }
  if (!item && ref?.title) {
    const payload = await fetchJsonSafe(
      appendQuery("https://api.openalex.org/works", { search: ref.title, "per-page": "8" }),
      { headers: { Accept: "application/json" } }
    );
    const candidates = (payload?.results || []).map((work) => ({
      source: "openalex",
      title: compactCitationSpaces(work.display_name || "") || null,
      authors: extractOpenAlexAuthors(work.authorships),
      journal: compactCitationSpaces(work?.primary_location?.source?.display_name || "") || null,
      year: Number(work.publication_year || 0) || null,
      doi: normalizeCitationDoi(work.doi || "") || null,
      url: String(work.id || "") || null,
      abstract: decodeOpenAlexAbstract(work.abstract_inverted_index),
    }));
    return pickBestCitationCandidateForReference(ref, candidates);
  }
  if (!item) return null;
  return {
    source: "openalex",
    title: compactCitationSpaces(item.display_name || "") || null,
    authors: extractOpenAlexAuthors(item.authorships),
    journal: compactCitationSpaces(item?.primary_location?.source?.display_name || "") || null,
    year: Number(item.publication_year || 0) || null,
    doi: normalizeCitationDoi(item.doi || doi) || null,
    url: String(item.id || "") || null,
    abstract: decodeOpenAlexAbstract(item.abstract_inverted_index),
  };
}

async function fetchDataCiteByReference(ref) {
  const doi = normalizeCitationDoi(ref?.doi || "");
  let data = null;
  if (doi) {
    const payload = await fetchJsonSafe(`https://api.datacite.org/dois/${encodeURIComponent(doi)}`, {
      headers: { Accept: "application/json" },
    });
    data = payload?.data || null;
  }
  if (!data && ref?.title) {
    const url = appendQuery("https://api.datacite.org/dois", {
      query: ref.title,
      "page[size]": "8",
    });
    const payload = await fetchJsonSafe(url, { headers: { Accept: "application/json" } });
    const candidates = (payload?.data || []).map((row) => {
      const attrs = row?.attributes || {};
      const t = Array.isArray(attrs.titles) && attrs.titles[0] ? attrs.titles[0].title : "";
      let abstract = null;
      if (Array.isArray(attrs.descriptions)) {
        const first =
          attrs.descriptions.find((x) => String(x?.descriptionType || "").toLowerCase() === "abstract") ||
          attrs.descriptions[0];
        abstract = compactCitationSpaces(first?.description || "");
      }
      return {
        source: "datacite",
        title: compactCitationSpaces(t || "") || null,
        authors: extractDataCiteAuthors(attrs.creators),
        journal: compactCitationSpaces(attrs.publisher || "") || null,
        year: Number(attrs.publicationYear || 0) || null,
        doi: normalizeCitationDoi(attrs.doi || "") || null,
        url: String(attrs.url || "") || null,
        abstract: abstract || null,
      };
    });
    return pickBestCitationCandidateForReference(ref, candidates);
  }
  if (!data) return null;
  const attrs = data.attributes || {};
  const title = Array.isArray(attrs.titles) && attrs.titles[0] ? attrs.titles[0].title : "";
  const year = Number(attrs.publicationYear || 0) || null;
  const doiValue = normalizeCitationDoi(attrs.doi || doi) || null;
  const url = attrs.url || (doiValue ? `https://doi.org/${encodeURI(doiValue)}` : "");
  let abstract = null;
  if (Array.isArray(attrs.descriptions)) {
    const first = attrs.descriptions.find((x) => x?.descriptionType?.toLowerCase?.() === "abstract") || attrs.descriptions[0];
    abstract = compactCitationSpaces(first?.description || "");
  }
  return {
    source: "datacite",
    title: compactCitationSpaces(title || "") || null,
    authors: extractDataCiteAuthors(attrs.creators),
    journal: compactCitationSpaces(attrs.publisher || "") || null,
    year,
    doi: doiValue,
    url: String(url || "") || null,
    abstract: abstract || null,
  };
}

async function fetchSemanticScholarByReference(ref) {
  const doi = normalizeCitationDoi(ref?.doi || "");
  const fields = "title,year,authors,url,abstract,externalIds,journal,venue";
  let item = null;
  if (doi) {
    const url = appendQuery(`https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}`, {
      fields,
    });
    const payload = await fetchJsonSafe(url, { headers: { Accept: "application/json" } });
    item = payload && !payload.error ? payload : null;
  }
  if (!item && ref?.title) {
    const url = appendQuery("https://api.semanticscholar.org/graph/v1/paper/search", {
      query: ref.title,
      limit: "8",
      fields,
    });
    const payload = await fetchJsonSafe(url, { headers: { Accept: "application/json" } });
    const candidates = (payload?.data || []).map((row) => ({
      source: "semanticscholar",
      title: compactCitationSpaces(row.title || "") || null,
      authors: extractSemanticAuthors(row.authors),
      journal: compactCitationSpaces(row?.journal?.name || row?.venue || "") || null,
      year: Number(row.year || 0) || null,
      doi: normalizeCitationDoi(row?.externalIds?.DOI || "") || null,
      url: String(row.url || "") || null,
      abstract: compactCitationSpaces(row.abstract || "") || null,
    }));
    return pickBestCitationCandidateForReference(ref, candidates);
  }
  if (!item) return null;
  return {
    source: "semanticscholar",
    title: compactCitationSpaces(item.title || "") || null,
    authors: extractSemanticAuthors(item.authors),
    journal: compactCitationSpaces(item?.journal?.name || item?.venue || "") || null,
    year: Number(item.year || 0) || null,
    doi: normalizeCitationDoi(item?.externalIds?.DOI || doi) || null,
    url: String(item.url || "") || null,
    abstract: compactCitationSpaces(item.abstract || "") || null,
  };
}

async function fetchJsonSafe(url, options = {}, timeoutMs = 18000) {
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      if (!resp.ok) {
        if ((resp.status === 429 || resp.status >= 500) && attempt < maxAttempts - 1) {
          await sleep(220 * (attempt + 1));
          continue;
        }
        return null;
      }
      return await resp.json();
    } catch {
      if (attempt < maxAttempts - 1) {
        await sleep(220 * (attempt + 1));
        continue;
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

async function fetchTextSafe(url, options = {}, timeoutMs = 16000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function checkDoiResolvable(doi) {
  const target = `https://doi.org/${encodeURI(doi)}`;
  try {
    const headResp = await fetch(target, {
      method: "HEAD",
      redirect: "manual",
      headers: { Accept: "text/html", "User-Agent": "ScanSci-Worker" },
    });
    if (headResp.ok) return true;
    if ([301, 302, 303, 307, 308].includes(headResp.status)) return true;
    if (headResp.status === 405) {
      const getResp = await fetch(target, {
        method: "GET",
        redirect: "manual",
        headers: { Accept: "text/html", "User-Agent": "ScanSci-Worker" },
      });
      return getResp.ok || [301, 302, 303, 307, 308].includes(getResp.status);
    }
    return false;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapLimit(items, limit, mapper) {
  const list = Array.isArray(items) ? items : [];
  const out = new Array(list.length);
  let idx = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit || 1, list.length || 1)) }, async () => {
    while (true) {
      const current = idx;
      idx += 1;
      if (current >= list.length) break;
      out[current] = await mapper(list[current], current);
    }
  });
  await Promise.all(workers);
  return out;
}

function simpleTextSimilarity(a, b) {
  const left = normalizeSimpleText(a);
  const right = normalizeSimpleText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const leftSet = new Set(left.split(" "));
  const rightSet = new Set(right.split(" "));
  let inter = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) inter += 1;
  }
  const union = new Set([...leftSet, ...rightSet]).size;
  return union ? inter / union : 0;
}

function normalizeSimpleText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function average(values) {
  const nums = (values || []).map((x) => Number(x)).filter((x) => Number.isFinite(x));
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function escapeRegExp(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function handleAdminElsevierCacheUpsert(request, env) {
  if (!isAdminTokenValid(request, env)) {
    return jsonResponse(request, env, { ok: false, error: "forbidden" }, 403);
  }
  const body = await parseJsonBody(request);
  if (!body || typeof body !== "object") {
    return jsonResponse(request, env, { ok: false, error: "invalid_json" }, 400);
  }
  const result = await upsertElsevierCacheRecord(env, {
    issn: body.issn,
    payload: body.payload,
    ttlSeconds: body.ttlSeconds,
    source: body.source || "admin-upsert",
  });
  if (!result.ok) {
    return jsonResponse(request, env, { ok: false, error: result.error || "cache_upsert_failed" }, 400);
  }
  return jsonResponse(request, env, {
    ok: true,
    key: result.issnKey,
    expires_unix: result.expiresUnix,
  });
}

async function handleAdminElsevierCacheBatchUpsert(request, env) {
  if (!isAdminTokenValid(request, env)) {
    return jsonResponse(request, env, { ok: false, error: "forbidden" }, 403);
  }
  const body = await parseJsonBody(request);
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) {
    return jsonResponse(request, env, { ok: false, error: "missing_items" }, 400);
  }
  if (items.length > 100) {
    return jsonResponse(request, env, { ok: false, error: "too_many_items", max: 100 }, 400);
  }

  let success = 0;
  const failures = [];
  for (const item of items) {
    const result = await upsertElsevierCacheRecord(env, {
      issn: item?.issn,
      payload: item?.payload,
      ttlSeconds: item?.ttlSeconds,
      source: item?.source || "admin-batch-upsert",
    });
    if (result.ok) {
      success += 1;
    } else {
      failures.push({
        issn: String(item?.issn || ""),
        error: result.error || "cache_upsert_failed",
      });
    }
  }

  return jsonResponse(request, env, {
    ok: failures.length === 0,
    success,
    failed: failures.length,
    failures: failures.slice(0, 20),
  });
}

function isAdminTokenValid(request, env) {
  const configured = String(env.ADMIN_SYNC_TOKEN || "").trim();
  if (!configured) return false;
  const headerToken = String(request.headers.get("X-ScanSci-Admin-Token") || "").trim();
  if (!headerToken) return false;
  return timingSafeEqual(headerToken, configured);
}

function timingSafeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return result === 0;
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeIssnKey(raw) {
  const compact = String(raw || "").replace(/[^0-9Xx]/g, "").toUpperCase();
  if (!/^\d{7}[\dX]$/.test(compact)) return "";
  return compact;
}

function formatIssnDisplay(issnKey) {
  const key = normalizeIssnKey(issnKey);
  if (!key) return "";
  return `${key.slice(0, 4)}-${key.slice(4)}`;
}

async function loadElsevierCacheByKey(env, issnKey) {
  const key = normalizeIssnKey(issnKey);
  if (!key) return null;
  const row = await env.DB.prepare(
    "SELECT issn_key, issn_display, payload_json, source, updated_unix, expires_unix FROM elsevier_cache WHERE issn_key = ? LIMIT 1"
  )
    .bind(key)
    .first();
  if (!row || !row.payload_json) return null;
  const payload = safeJsonParse(row.payload_json);
  if (!payload || typeof payload !== "object") return null;
  const now = Math.floor(Date.now() / 1000);
  const expiresUnix = Number(row.expires_unix || 0);
  return {
    issnKey: key,
    issnDisplay: String(row.issn_display || formatIssnDisplay(key)),
    payload,
    source: String(row.source || ""),
    updatedUnix: Number(row.updated_unix || 0),
    expiresUnix,
    isExpired: Number.isFinite(expiresUnix) ? expiresUnix <= now : true,
  };
}

async function upsertElsevierCacheRecord(env, input) {
  const key = normalizeIssnKey(input?.issn);
  if (!key) return { ok: false, error: "invalid_issn" };
  const payload = input?.payload;
  if (!payload || typeof payload !== "object") return { ok: false, error: "invalid_payload" };
  const normalizedPayload = unwrapElsevierPayload(payload);
  if (!normalizedPayload) return { ok: false, error: "invalid_elsevier_payload" };

  const ttlDefault = Math.max(300, parseInt(env.ELSEVIER_CACHE_TTL_SECONDS || "604800", 10) || 604800);
  const ttlSeconds = Math.max(300, parseInt(String(input?.ttlSeconds || ttlDefault), 10) || ttlDefault);
  const nowUnix = Math.floor(Date.now() / 1000);
  const expiresUnix = nowUnix + ttlSeconds;
  const source = String(input?.source || "elsevier-live").slice(0, 120);
  const nowIso = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO elsevier_cache
      (issn_key, issn_display, payload_json, source, updated_unix, expires_unix, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(issn_key) DO UPDATE SET
       issn_display = excluded.issn_display,
       payload_json = excluded.payload_json,
       source = excluded.source,
       updated_unix = excluded.updated_unix,
       expires_unix = excluded.expires_unix,
       updated_at = excluded.updated_at`
  )
    .bind(key, formatIssnDisplay(key), JSON.stringify(normalizedPayload), source, nowUnix, expiresUnix, nowIso)
    .run();

  return { ok: true, issnKey: key, expiresUnix };
}

function jsonWithSourceHeader(request, env, payload, source, extraHeaders = {}) {
  const headers = standardHeaders(request, env);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("X-ScanSci-Elsevier-Source", String(source || "unknown"));
  if (String(source || "").startsWith("d1-cache")) {
    headers.set("Cache-Control", "public, max-age=300, s-maxage=300");
  } else {
    headers.set("Cache-Control", "public, max-age=120, s-maxage=180");
  }
  for (const [k, v] of Object.entries(extraHeaders || {})) {
    if (v !== undefined && v !== null) headers.set(k, String(v));
  }
  return new Response(JSON.stringify(payload), { status: 200, headers });
}

function normalizeBaseUrl(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  try {
    const u = new URL(text);
    if (!["http:", "https:"].includes(u.protocol)) return "";
    return u.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function unwrapElsevierPayload(payload) {
  if (payload && typeof payload === "object") {
    if (payload["serial-metadata-response"]) return payload;
    if (payload.payload && typeof payload.payload === "object" && payload.payload["serial-metadata-response"]) {
      return payload.payload;
    }
  }
  return null;
}

async function requestElsevierViaSecondaryProxy(env, issnRaw) {
  const base = normalizeBaseUrl(env.ELSEVIER_SECONDARY_PROXY_BASE || "");
  if (!base) return { ok: false };

  const issn = String(issnRaw || "").trim();
  if (!issn) return { ok: false };

  const candidates = [
    `${base}/api/elsevier/serial-title?issn=${encodeURIComponent(issn)}`,
    `${base}/elsevier/serial-title?issn=${encodeURIComponent(issn)}`,
  ];

  for (const url of candidates) {
    let resp;
    try {
      resp = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json", "User-Agent": "ScanSci-Worker/1.0 (+https://www.scansci.com)" },
        cf: { cacheTtl: 600, cacheEverything: false },
      });
    } catch {
      continue;
    }
    if (!resp.ok) continue;

    let body = null;
    try {
      body = await resp.json();
    } catch {
      body = null;
    }
    const payload = unwrapElsevierPayload(body);
    if (payload) return { ok: true, payload };
  }

  return { ok: false };
}

function buildElsevierIssnVariants(issnRaw) {
  const compact = String(issnRaw || "").replace(/[^0-9Xx]/g, "").toUpperCase();
  if (!compact) return [];
  const variants = new Set();
  if (compact.length === 8) {
    variants.add(`${compact.slice(0, 4)}-${compact.slice(4)}`);
  }
  variants.add(compact);
  return [...variants];
}

async function requestElsevierSerialTitle(issn, apiKey, env) {
  const publicOrigin = "https://www.scansci.com";
  const defaultTimeout = 3500;
  const parsedTimeout = Number.parseInt(String(env?.ELSEVIER_UPSTREAM_TIMEOUT_MS || ""), 10);
  const runtimeTimeout =
    Number.isFinite(parsedTimeout) && parsedTimeout >= 1200
      ? parsedTimeout
      : Number.parseInt(String(defaultTimeout), 10);
  const baseUrl =
    `https://api.elsevier.com/content/serial/title?` +
    `issn=${encodeURIComponent(issn)}&view=STANDARD&field=citeScoreYearInfoList,SJR,SNIP,subject-area`;

  const attempts = [
    {
      url: `${baseUrl}&apiKey=${encodeURIComponent(apiKey)}`,
      timeoutMs: runtimeTimeout,
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "ScanSci-Worker/1.0 (+https://www.scansci.com)",
        Origin: publicOrigin,
        Referer: `${publicOrigin}/`,
      },
    },
    {
      url: baseUrl,
      timeoutMs: runtimeTimeout,
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "ScanSci-Worker/1.0 (+https://www.scansci.com)",
        Origin: publicOrigin,
        Referer: `${publicOrigin}/`,
        "X-ELS-APIKey": apiKey,
      },
    },
    {
      url: `${baseUrl}&apiKey=${encodeURIComponent(apiKey)}`,
      timeoutMs: runtimeTimeout,
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "ScanSci-Worker/1.0 (+https://www.scansci.com)",
        Origin: publicOrigin,
        Referer: `${publicOrigin}/`,
        "X-ELS-APIKey": apiKey,
      },
    },
  ];

  const failures = [];
  for (const attempt of attempts) {
    const result = await requestElsevierOnce(attempt.url, attempt.headers, attempt.timeoutMs || null);
    if (result.ok) return result;
    failures.push(result);
  }

  return failures[0] || { ok: false, reason: "elsevier_unreachable", status: 502, payload: null, text: "" };
}

async function requestElsevierOnce(url, headers, timeoutMsRaw = null) {
  const timeoutMs = Math.max(1200, Number(timeoutMsRaw || 0) || Number.parseInt(String(timeoutMsRaw || "0"), 10) || 0);
  const controller = new AbortController();
  const timer = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
  let upstreamRes;
  try {
    upstreamRes = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      cf: { cacheTtl: 1800, cacheEverything: false },
    });
  } catch (error) {
    const isAbort = String(error?.name || "") === "AbortError";
    return {
      ok: false,
      reason: isAbort ? "elsevier_timeout" : "elsevier_unreachable",
      status: 502,
      payload: null,
      text: "",
    };
  } finally {
    if (timer) clearTimeout(timer);
  }

  const rawText = await upstreamRes.text();
  let payload = null;
  try {
    payload = JSON.parse(rawText);
  } catch {
    payload = null;
  }

  if (!upstreamRes.ok) {
    return {
      ok: false,
      reason: "elsevier_http_error",
      status: upstreamRes.status,
      payload,
      text: rawText,
    };
  }

  if (!payload || typeof payload !== "object") {
    return { ok: false, reason: "invalid_upstream_payload", status: 502, payload: null, text: rawText };
  }

  return { ok: true, payload };
}

async function handleWebPreviewImage(request, env) {
  const requestUrl = new URL(request.url);
  const raw = String(requestUrl.searchParams.get("url") || "").trim();
  if (!raw) {
    return jsonResponse(request, env, { ok: false, error: "missing_url" }, 400);
  }

  let targetUrl = "";
  try {
    targetUrl = normalizeRemoteHttpUrl(raw);
  } catch (err) {
    const reason = String(err?.message || "invalid_url");
    return jsonResponse(request, env, { ok: false, error: reason }, 400);
  }

  let resp;
  try {
    resp = await fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "ScanSci-Worker/1.0",
      },
      cf: { cacheTtl: 7200, cacheEverything: false },
    });
  } catch {
    return jsonResponse(request, env, { ok: false, error: "preview_fetch_failed" }, 502);
  }

  if (!resp.ok) {
    return jsonResponse(request, env, { ok: false, error: "preview_http_error", status: resp.status }, 502);
  }

  const contentType = String(resp.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    return jsonResponse(request, env, {
      ok: true,
      target_url: targetUrl,
      resolved_url: resp.url || targetUrl,
      cover_url: "",
      content_type: contentType,
    });
  }

  let html = "";
  try {
    html = await resp.text();
  } catch {
    html = "";
  }
  if (html.length > 1_500_000) html = html.slice(0, 1_500_000);

  const coverUrl = extractPreviewImageUrl(html, resp.url || targetUrl);
  return jsonResponse(request, env, {
    ok: true,
    target_url: targetUrl,
    resolved_url: resp.url || targetUrl,
    cover_url: coverUrl,
    content_type: contentType,
  });
}

function normalizeRemoteHttpUrl(raw) {
  let url;
  try {
    url = new URL(String(raw || "").trim());
  } catch {
    throw new Error("invalid_url");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid_url");
  if (isPrivateHostname(url.hostname)) throw new Error("unsafe_url");
  return url.toString();
}

function isPrivateHostname(hostname) {
  const host = String(hostname || "").trim().toLowerCase();
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".local")) return true;
  if (host === "::1") return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const octets = ipv4.slice(1).map((x) => Number(x));
    if (octets.some((x) => x < 0 || x > 255)) return true;
    const [a, b] = octets;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true;
  }

  if (host.includes(":")) {
    if (host.startsWith("fc") || host.startsWith("fd")) return true;
    if (host.startsWith("fe80")) return true;
  }

  return false;
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMetaContent(html, key) {
  const escaped = escapeRegex(String(key || "").toLowerCase());
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)\\s*=\\s*["']${escaped}["'][^>]+content\\s*=\\s*["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]+(?:property|name)\\s*=\\s*["']${escaped}["'][^>]*>`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return "";
}

function extractLinkContent(html, relName) {
  const escaped = escapeRegex(String(relName || "").toLowerCase());
  const patterns = [
    new RegExp(
      `<link[^>]+rel\\s*=\\s*["'][^"']*${escaped}[^"']*["'][^>]+href\\s*=\\s*["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<link[^>]+href\\s*=\\s*["']([^"']+)["'][^>]+rel\\s*=\\s*["'][^"']*${escaped}[^"']*["'][^>]*>`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return "";
}

function normalizePreviewImageUrl(raw, baseUrl) {
  let value = String(raw || "").trim();
  if (!value) return "";
  value = value.replace(/\\\//g, "/");
  if (value.startsWith("//")) value = `https:${value}`;
  value = value.replace(/^https\/\//i, "https://").replace(/^http\/\//i, "http://");
  value = value.replace(/^https?:\/\/https?:?\/\//i, "https://");
  try {
    const abs = new URL(value, baseUrl);
    if (!["http:", "https:"].includes(abs.protocol)) return "";
    return abs.toString();
  } catch {
    return "";
  }
}

function extractPreviewImageUrl(html, baseUrl) {
  const keys = [
    "og:image:secure_url",
    "og:image",
    "twitter:image",
    "twitter:image:src",
    "og:image:url",
  ];
  for (const key of keys) {
    const value = extractMetaContent(html, key);
    const normalized = normalizePreviewImageUrl(value, baseUrl);
    if (normalized) return normalized;
  }
  const linkImageSrc = extractLinkContent(html, "image_src");
  return normalizePreviewImageUrl(linkImageSrc, baseUrl);
}

async function getUserById(env, userId) {
  const user = await env.DB.prepare("SELECT id, github_id, login, email, avatar_url FROM users WHERE id = ?")
    .bind(userId)
    .first();
  if (!user) return null;

  const link = await env.DB.prepare("SELECT github_id FROM github_links WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first();

  const emailVerified = await env.DB.prepare(
    "SELECT 1 FROM user_email_verifications WHERE user_id = ? LIMIT 1"
  )
    .bind(userId)
    .first();

  const githubLinked = !!link || (typeof user.github_id === "string" && !user.github_id.startsWith("email:"));

  return {
    ...user,
    github_linked: githubLinked,
    email_verified: !!emailVerified,
  };
}

async function findUserByEmail(env, email) {
  const row = await env.DB.prepare(
    "SELECT id, github_id, login, email, avatar_url FROM users WHERE lower(email) = lower(?) ORDER BY id ASC LIMIT 1"
  )
    .bind(email)
    .first();
  return row || null;
}

async function findUserByGithubId(env, githubId) {
  const link = await env.DB.prepare("SELECT user_id FROM github_links WHERE github_id = ?")
    .bind(githubId)
    .first();

  if (link?.user_id) {
    return getUserById(env, Number(link.user_id));
  }

  const legacy = await env.DB.prepare(
    "SELECT id, github_id, login, email, avatar_url FROM users WHERE github_id = ?"
  )
    .bind(githubId)
    .first();

  if (legacy) return getUserById(env, Number(legacy.id));
  return null;
}

async function getUserFavorites(env, userId) {
  const favoritesRows = await env.DB.prepare(
    "SELECT app_id FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(userId)
    .all();
  return (favoritesRows.results || []).map((x) => x.app_id);
}

async function markEmailVerified(env, userId, email, nowIso) {
  await env.DB.prepare(
    `INSERT INTO user_email_verifications (user_id, email, verified_at, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, verified_at = excluded.verified_at`
  )
    .bind(userId, email, nowIso, nowIso)
    .run();
}

async function appendSessionCookie(headers, env, user) {
  const ttl = parseInt(env.SESSION_TTL_SECONDS || "2592000", 10);
  const ttlSec = Number.isFinite(ttl) ? ttl : 2592000;
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const token = await signJwt(
    {
      sub: String(user.id),
      github_id: String(user.github_id || ""),
      login: String(user.login || ""),
      email: user.email || null,
      avatar_url: user.avatar_url || null,
      iat: Math.floor(Date.now() / 1000),
      exp,
    },
    env.JWT_SECRET
  );

  headers.append(
    "Set-Cookie",
    buildCookie(SESSION_COOKIE, token, {
      path: "/",
      maxAge: ttlSec,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    })
  );
}

async function hashEmailCode(email, purpose, code, secret) {
  return sha256Hex(`${email}|${purpose}|${code}|${secret}`);
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

function deriveLoginFromEmail(email) {
  const local = String(email || "").split("@")[0] || "user";
  const normalized = local.toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 24);
  if (normalized.length >= 3) return normalized;
  return `user_${randomBase64Url(6).toLowerCase()}`;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

function getClientIp(request) {
  return String(request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown").slice(0, 120);
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
  const allowed = new Set(
    (env.CORS_ORIGINS || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  );
  allowed.add(getPublicOrigin(request, env));

  if (origin && allowed.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-ScanSci-Admin-Token");
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

// ── /api/stats ────────────────────────────────────────────────
// Fetches zone analytics from Cloudflare GraphQL API and caches
// the result for 10 minutes. Requires CF_API_TOKEN (secret) and
// CF_ZONE_ID (var) to be configured; returns nulls otherwise.

const STATS_CF_GQL = "https://api.cloudflare.com/client/v4/graphql";
const STATS_CACHE_URL = "https://www.scansci.com/_internal/stats-cache";
const STATS_CACHE_TTL = 600; // 10 minutes

const STATS_QUERY = `
  query($zoneTag:String!,$d30Start:String!,$d30End:String!,$h24Start:String!,$h24End:String!){
    viewer {
      zones(filter:{zoneTag:$zoneTag}) {
        d30: httpRequests1dGroups(limit:31, filter:{date_geq:$d30Start, date_leq:$d30End}) {
          uniq { uniques }
          sum  { requests }
        }
        h24: httpRequests1hGroups(limit:25, filter:{datetime_geq:$h24Start, datetime_leq:$h24End}) {
          uniq { uniques }
        }
      }
    }
  }
`;

async function handleStats(request, env) {
  // Check edge cache first
  const cache = caches.default;
  const cacheKey = new Request(STATS_CACHE_URL);
  const cached = await cache.match(cacheKey);
  if (cached) {
    const payload = await cached.json();
    return jsonResponse(request, env, payload);
  }

  // Without credentials, return nulls immediately
  if (!env.CF_API_TOKEN || !env.CF_ZONE_ID) {
    return jsonResponse(request, env, { visitors_24h: null, visitors_30d: null, requests_30d: null });
  }

  try {
    const now = new Date();
    const d30End   = now.toISOString().slice(0, 10);
    const d30Start = new Date(now - 30 * 864e5).toISOString().slice(0, 10);
    const h24End   = now.toISOString();
    const h24Start = new Date(now - 864e5).toISOString();

    const gqlRes = await fetch(STATS_CF_GQL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: STATS_QUERY,
        variables: { zoneTag: env.CF_ZONE_ID, d30Start, d30End, h24Start, h24End },
      }),
    });

    if (!gqlRes.ok) {
      return jsonResponse(request, env, { visitors_24h: null, visitors_30d: null, requests_30d: null });
    }

    const gqlData = await gqlRes.json();
    const zone = gqlData?.data?.viewer?.zones?.[0];
    if (!zone) {
      return jsonResponse(request, env, { visitors_24h: null, visitors_30d: null, requests_30d: null });
    }

    const visitors_24h  = (zone.h24 || []).reduce((s, g) => s + (g.uniq?.uniques  || 0), 0);
    const visitors_30d  = (zone.d30 || []).reduce((s, g) => s + (g.uniq?.uniques  || 0), 0);
    const requests_30d  = (zone.d30 || []).reduce((s, g) => s + (g.sum?.requests  || 0), 0);

    const payload = { visitors_24h, visitors_30d, requests_30d };

    // Store in edge cache
    await cache.put(
      cacheKey,
      new Response(JSON.stringify(payload), {
        headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${STATS_CACHE_TTL}` },
      }),
    );

    return jsonResponse(request, env, payload);
  } catch {
    return jsonResponse(request, env, { visitors_24h: null, visitors_30d: null, requests_30d: null });
  }
}
