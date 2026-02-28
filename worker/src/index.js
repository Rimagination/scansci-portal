const PKCE_COOKIE = "__Host-scansci_pkce";
const SESSION_COOKIE = "__Host-scansci_session";
const EMAIL_PURPOSE_LOGIN = "email_login";

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

  if (url.pathname === "/api/admin/elsevier/cache/upsert" && request.method === "POST") {
    return handleAdminElsevierCacheUpsert(request, env);
  }

  if (url.pathname === "/api/admin/elsevier/cache/batch-upsert" && request.method === "POST") {
    return handleAdminElsevierCacheBatchUpsert(request, env);
  }

  if (url.pathname === "/api/web/preview-image" && request.method === "GET") {
    return handleWebPreviewImage(request, env);
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
