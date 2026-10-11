import { readMediaBytes, PDF_LIMIT } from "./reader-media.js";
const OPENALEX_API_BASE = "https://api.openalex.org";
const CREDENTIAL_AAD_PREFIX = "scansci.reader.openalex.v1.user:";
const CREDENTIAL_KEY_VERSION = 1;
const MAX_BODY_BYTES = 8192;
const MAX_REQUESTS_PER_MINUTE = 120;
const ALLOWED_PATHS = new Set(["/works", "/sources", "/pdf"]);
const ALLOWED_PARAMS = new Set(["search", "filter", "per_page", "select", "sort", "page", "cursor"]);

export async function handleOpenAlexKeyStatus(request, env, tools) {
  const auth = await tools.requireAuth(request, env);
  if (!auth) return tools.jsonResponse(request, env, { ok: false, error: "unauthorized" }, 401);
  if (!isReaderOrigin(request, env, false)) return tools.jsonResponse(request, env, { ok: false, error: "forbidden" }, 403);

  const row = await env.DB.prepare(
    "SELECT 1 AS configured FROM user_openalex_credentials WHERE user_id = ? LIMIT 1"
  ).bind(auth.userId).first();
  return tools.jsonResponse(request, env, {
    ok: true,
    configured: Boolean(row),
    ready: Boolean(decodeEncryptionKey(env.READER_CREDENTIALS_ENCRYPTION_KEY)),
  });
}

export async function handleOpenAlexKeyWrite(request, env, tools) {
  if (!isReaderOrigin(request, env, true)) return tools.jsonResponse(request, env, { ok: false, error: "forbidden" }, 403);
  const auth = await tools.requireAuth(request, env);
  if (!auth) return tools.jsonResponse(request, env, { ok: false, error: "unauthorized" }, 401);

  const parsed = await readJsonBody(request);
  if (parsed.error) return tools.jsonResponse(request, env, { ok: false, error: parsed.error }, parsed.status);

  if (parsed.body.clear === true) {
    await env.DB.prepare("DELETE FROM user_openalex_credentials WHERE user_id = ?").bind(auth.userId).run();
    return tools.jsonResponse(request, env, { ok: true, configured: false });
  }

  const apiKey = typeof parsed.body.api_key === "string" ? parsed.body.api_key.trim() : "";
  if (!apiKey || apiKey.length > 1024 || /[\u0000-\u001f\u007f]/u.test(apiKey)) {
    return tools.jsonResponse(request, env, { ok: false, error: "invalid_api_key" }, 400);
  }
  const encryptionKey = decodeEncryptionKey(env.READER_CREDENTIALS_ENCRYPTION_KEY);
  if (!encryptionKey) return tools.jsonResponse(request, env, { ok: false, error: "credential_storage_unavailable" }, 503);

  const encrypted = await encryptApiKey(apiKey, auth.userId, encryptionKey);
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO user_openalex_credentials (user_id, key_ciphertext, key_iv, key_version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      key_ciphertext = excluded.key_ciphertext,
      key_iv = excluded.key_iv,
      key_version = excluded.key_version,
      updated_at = excluded.updated_at
  `).bind(auth.userId, encrypted.ciphertext, encrypted.iv, CREDENTIAL_KEY_VERSION, now, now).run();

  return tools.jsonResponse(request, env, { ok: true, configured: true });
}

export async function handleOpenAlexProxy(request, env, tools) {
  if (!isReaderOrigin(request, env, true)) return tools.jsonResponse(request, env, { ok: false, error: "forbidden" }, 403);
  const auth = await tools.requireAuth(request, env);
  if (!auth) return tools.jsonResponse(request, env, { ok: false, error: "unauthorized" }, 401);

  const parsed = await readJsonBody(request);
  if (parsed.error) return tools.jsonResponse(request, env, { ok: false, error: parsed.error }, parsed.status);
  const target = buildOpenAlexUrl(parsed.body);
  if (!target) return tools.jsonResponse(request, env, { ok: false, error: "invalid_query" }, 400);

  const encryptionKey = decodeEncryptionKey(env.READER_CREDENTIALS_ENCRYPTION_KEY);
  if (!encryptionKey) return tools.jsonResponse(request, env, { ok: false, error: "credential_storage_unavailable" }, 503);
  const row = await env.DB.prepare(
    "SELECT key_ciphertext, key_iv, key_version FROM user_openalex_credentials WHERE user_id = ? LIMIT 1"
  ).bind(auth.userId).first();
  if (!row) return tools.jsonResponse(request, env, { ok: false, error: "credential_not_configured" }, 409);

  let apiKey;
  try {
    if (Number(row.key_version) !== CREDENTIAL_KEY_VERSION) throw new Error("unsupported_key_version");
    apiKey = await decryptApiKey(row, auth.userId, encryptionKey);
  } catch {
    return tools.jsonResponse(request, env, { ok: false, error: "credential_unavailable" }, 503);
  }

  const windowStart = Math.floor(Date.now() / 60000);
  const usage = await env.DB.prepare(`
    INSERT INTO user_openalex_usage_limits (user_id, window_start, request_count)
    VALUES (?, ?, 1)
    ON CONFLICT(user_id) DO UPDATE SET
      request_count = CASE WHEN window_start = excluded.window_start THEN request_count + 1 ELSE 1 END,
      window_start = excluded.window_start
    RETURNING request_count
  `).bind(auth.userId, windowStart).first();
  if (Number(usage?.request_count) > MAX_REQUESTS_PER_MINUTE) {
    return tools.jsonResponse(request, env, { ok: false, error: "rate_limited" }, 429);
  }

  try {
    const upstream = await fetch(target, {
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (upstream.status === 401 || upstream.status === 403) {
      return tools.jsonResponse(request, env, { ok: false, error: "credential_rejected" }, 502);
    }
    if (!upstream.ok) {
      return tools.jsonResponse(request, env, { ok: false, error: "upstream_unavailable" }, upstream.status === 429 ? 429 : 502);
    }
    const text = await upstream.text();
    if (new TextEncoder().encode(text).byteLength > 7 * 1024 * 1024) {
      return tools.jsonResponse(request, env, { ok: false, error: "upstream_response_too_large" }, 502);
    }
    const data = JSON.parse(text);
    if (parsed.body.path === "/pdf") {
      const work = data.results?.[0];
      const id = String(work?.id || "").match(/^https:\/\/openalex\.org\/(W\d+)$/)?.[1];
      if (!id || !work.has_content?.pdf || String(work.doi || "").replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() !== parsed.body.params.doi.toLowerCase()) return tools.jsonResponse(request, env, { ok: false, error: "pdf_not_available" }, 404);
      // Fixed content host: neither the client nor upstream metadata can supply a fetch URL.
      const pdf = await fetch(`https://content.openalex.org/works/${id}.pdf`, {
        redirect: "error", headers: { Accept: "application/pdf", Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(15000),
      });
      if (!pdf.ok) return tools.jsonResponse(request, env, { ok: false, error: "pdf_not_available" }, 502);
      const bytes = await readMediaBytes(pdf, PDF_LIMIT);
      if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-")) return tools.jsonResponse(request, env, { ok: false, error: "invalid_pdf" }, 502);
      return new Response(bytes, { headers: { "Content-Type": "application/pdf", "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" } });
    }
    return tools.jsonResponse(request, env, data);
  } catch {
    return tools.jsonResponse(request, env, { ok: false, error: "upstream_unavailable" }, 502);
  }
}

function buildOpenAlexUrl(body) {
  if (!body || typeof body !== "object" || !ALLOWED_PATHS.has(body.path)) return null;
  if (!body.params || typeof body.params !== "object" || Array.isArray(body.params)) return null;
  if (body.path === "/pdf") {
    const doi = body.params.doi;
    if (Object.keys(body.params).length !== 1 || typeof doi !== "string" || !/^10\.\d{4,9}\/[^\s\x00-\x1f"<>]{1,240}$/.test(doi)) return null;
    const url = new URL("/works", OPENALEX_API_BASE);
    url.search = new URLSearchParams({ filter: `doi:https://doi.org/${doi.toLowerCase()},has_content.pdf:true`, select: "id,doi,has_content", per_page: "1" }).toString();
    return url;
  }
  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(body.params)) {
    if (!ALLOWED_PARAMS.has(key) || (typeof rawValue !== "string" && typeof rawValue !== "number")) return null;
    const value = String(rawValue);
    if (value.length > 4096 || /[\u0000-\u001f\u007f]/u.test(value)) return null;
    if (key === "per_page" && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 100)) return null;
    params.set(key, value);
  }
  if ([...params].reduce((size, [key, value]) => size + key.length + value.length, 0) > 7000) return null;
  const url = new URL(body.path, OPENALEX_API_BASE);
  url.search = params.toString();
  return url;
}

async function readJsonBody(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type") || "")) {
    return { error: "content_type_required", status: 415 };
  }
  const contentLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return { error: "request_too_large", status: 413 };
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return { error: "request_too_large", status: 413 };
  try {
    const body = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body)
      ? { body }
      : { error: "invalid_json", status: 400 };
  } catch {
    return { error: "invalid_json", status: 400 };
  }
}

function isReaderOrigin(request, env, required) {
  const origin = request.headers.get("Origin");
  if (!origin) return !required;
  try {
    const publicOrigin = new URL(env.PUBLIC_ORIGIN || request.url).origin;
    return new URL(origin).origin === publicOrigin;
  } catch {
    return false;
  }
}

function decodeEncryptionKey(encodedValue) {
  const encoded = String(encodedValue || "").trim();
  if (!encoded || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(encoded)) return null;
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    if (binary.length !== 32) return null;
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function encryptApiKey(apiKey, userId, encryptionKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey("raw", encryptionKey, "AES-GCM", false, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: credentialAad(userId) },
    key,
    new TextEncoder().encode(apiKey)
  );
  return { ciphertext: encodeBase64(new Uint8Array(ciphertext)), iv: encodeBase64(iv) };
}

async function decryptApiKey(row, userId, encryptionKey) {
  const key = await crypto.subtle.importKey("raw", encryptionKey, "AES-GCM", false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(row.key_iv), additionalData: credentialAad(userId) },
    key,
    decodeBase64(row.key_ciphertext)
  );
  return new TextDecoder().decode(plaintext);
}

function credentialAad(userId) {
  return new TextEncoder().encode(`${CREDENTIAL_AAD_PREFIX}${Number(userId)}`);
}

function encodeBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value) {
  const binary = atob(String(value || ""));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}
