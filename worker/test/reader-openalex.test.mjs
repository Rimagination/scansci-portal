import test from "node:test";
import assert from "node:assert/strict";

import worker from "../src/index.js";

const JWT_SECRET = "reader-openalex-test-jwt-secret";
const API_KEY = "openalex-personal-test-api-key-0123456789";
const ENCRYPTION_KEY = Buffer.alloc(32, 41).toString("base64");

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = String(sql || "").replace(/\s+/g, " ").trim();
    this.args = [];
  }

  bind(...args) { this.args = args; return this; }

  async first() {
    const userId = Number(this.args[0]);
    const row = this.db.rows.get(userId) || null;
    if (this.sql.startsWith("SELECT 1 AS configured")) return row ? { configured: 1 } : null;
    if (this.sql.startsWith("SELECT key_ciphertext")) return row;
    if (this.sql.startsWith("INSERT INTO user_openalex_usage_limits")) {
      const [, windowStart] = this.args;
      const previous = this.db.rateLimits.get(userId);
      const requestCount = previous?.window_start === windowStart ? previous.request_count + 1 : 1;
      this.db.rateLimits.set(userId, { window_start: windowStart, request_count: requestCount });
      return { request_count: requestCount };
    }
    throw new Error(`Unexpected SQL: ${this.sql}`);
  }

  async run() {
    const userId = Number(this.args[0]);
    if (this.sql.startsWith("DELETE FROM user_openalex_credentials")) {
      this.db.rows.delete(userId);
      return { success: true };
    }
    if (this.sql.startsWith("INSERT INTO user_openalex_credentials")) {
      const [, key_ciphertext, key_iv, key_version, created_at, updated_at] = this.args;
      const previous = this.db.rows.get(userId);
      this.db.rows.set(userId, {
        key_ciphertext,
        key_iv,
        key_version,
        created_at: previous?.created_at || created_at,
        updated_at,
      });
      return { success: true };
    }
    throw new Error(`Unexpected SQL: ${this.sql}`);
  }
}

class FakeD1Database {
  constructor() { this.rows = new Map(); this.rateLimits = new Map(); }
  prepare(sql) { return new FakeStatement(this, sql); }
}

async function authCookie(userId) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ sub: String(userId), exp: Math.floor(Date.now() / 1000) + 600 });
  const input = `${header}.${payload}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input))).toString("base64url");
  return `__Secure-scansci_session=${input}.${signature}`;
}

function createEnv(overrides = {}) {
  return {
    JWT_SECRET,
    PUBLIC_ORIGIN: "https://www.scansci.com",
    CORS_ORIGINS: "https://www.scansci.com,https://citation.scansci.com",
    READER_CREDENTIALS_ENCRYPTION_KEY: ENCRYPTION_KEY,
    DB: new FakeD1Database(),
    ...overrides,
  };
}

async function request(path, { userId = 1, method = "GET", body, origin = "https://www.scansci.com" } = {}) {
  const headers = { Cookie: await authCookie(userId) };
  if (origin) headers.Origin = origin;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return new Request(`https://www.scansci.com${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test("OpenAlex key is encrypted per account and the API only returns its configured state", async () => {
  const env = createEnv();
  const save = await worker.fetch(await request("/api/reader/openalex-key", { method: "POST", body: { api_key: API_KEY } }), env);
  const stored = env.DB.rows.get(1);
  const status = await worker.fetch(await request("/api/reader/openalex-key"), env);
  const payload = await status.json();

  assert.equal(save.status, 200);
  assert.deepEqual(await save.json(), { ok: true, configured: true });
  assert.ok(stored);
  assert.doesNotMatch(JSON.stringify(stored), new RegExp(API_KEY));
  assert.equal(status.status, 200);
  assert.deepEqual(payload, { ok: true, configured: true, ready: true });
  assert.doesNotMatch(JSON.stringify(payload), new RegExp(API_KEY));
});

test("OpenAlex proxy binds credentials to the account and sends the key only in Authorization", async () => {
  const env = createEnv();
  await worker.fetch(await request("/api/reader/openalex-key", { method: "POST", body: { api_key: API_KEY } }), env);
  const originalFetch = globalThis.fetch;
  let upstreamUrl;
  globalThis.fetch = async (input, init = {}) => {
    upstreamUrl = new URL(String(input));
    assert.equal(init.headers.Authorization, `Bearer ${API_KEY}`);
    assert.equal(upstreamUrl.origin, "https://api.openalex.org");
    assert.equal(upstreamUrl.searchParams.has("api_key"), false);
    return Response.json({ results: [{ id: "https://openalex.org/W1" }] });
  };

  try {
    const response = await worker.fetch(await request("/api/reader/openalex", {
      method: "POST",
      body: { path: "/works", params: { per_page: "20", filter: "type:article" } },
    }), env);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { results: [{ id: "https://openalex.org/W1" }] });

    const isolated = await worker.fetch(await request("/api/reader/openalex", {
      userId: 2,
      method: "POST",
      body: { path: "/works", params: { per_page: "20" } },
    }), env);
    assert.equal(isolated.status, 409);
    assert.deepEqual(await isolated.json(), { ok: false, error: "credential_not_configured" });

    env.DB.rows.set(2, { ...env.DB.rows.get(1) });
    const swapped = await worker.fetch(await request("/api/reader/openalex", {
      userId: 2,
      method: "POST",
      body: { path: "/works", params: { per_page: "20" } },
    }), env);
    assert.equal(swapped.status, 503);
    assert.deepEqual(await swapped.json(), { ok: false, error: "credential_unavailable" });
    assert.equal(upstreamUrl.searchParams.get("per_page"), "20");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("credential writes require the Reader origin and proxy targets stay within OpenAlex", async () => {
  const env = createEnv();
  const badOrigin = await worker.fetch(await request("/api/reader/openalex-key", {
    method: "POST",
    body: { api_key: API_KEY },
    origin: "https://citation.scansci.com",
  }), env);
  const badPath = await worker.fetch(await request("/api/reader/openalex", {
    method: "POST",
    body: { path: "https://attacker.example/collect", params: {} },
  }), env);
  const oversizedPage = await worker.fetch(await request("/api/reader/openalex", {
    method: "POST",
    body: { path: "/works", params: { per_page: "101" } },
  }), env);
  const unauthenticated = await worker.fetch(new Request("https://www.scansci.com/api/reader/openalex-key"), env);

  assert.equal(badOrigin.status, 403);
  assert.equal(badPath.status, 400);
  assert.equal(oversizedPage.status, 400);
  assert.equal(unauthenticated.status, 401);
  assert.equal(env.DB.rows.size, 0);
});

test("key deletion removes only the authenticated account's encrypted record", async () => {
  const env = createEnv();
  await worker.fetch(await request("/api/reader/openalex-key", { method: "POST", body: { api_key: API_KEY } }), env);
  const deleteResponse = await worker.fetch(await request("/api/reader/openalex-key", { method: "POST", body: { clear: true } }), env);
  const status = await worker.fetch(await request("/api/reader/openalex-key"), env);

  assert.equal(deleteResponse.status, 200);
  assert.deepEqual(await deleteResponse.json(), { ok: true, configured: false });
  assert.equal(status.status, 200);
  assert.deepEqual(await status.json(), { ok: true, configured: false, ready: true });
  assert.equal(env.DB.rows.size, 0);
});

test("an existing key can be cleared when encryption storage is unavailable", async () => {
  const env = createEnv();
  await worker.fetch(await request("/api/reader/openalex-key", { method: "POST", body: { api_key: API_KEY } }), env);
  delete env.READER_CREDENTIALS_ENCRYPTION_KEY;

  const status = await worker.fetch(await request("/api/reader/openalex-key"), env);
  const cleared = await worker.fetch(await request("/api/reader/openalex-key", { method: "POST", body: { clear: true } }), env);

  assert.deepEqual(await status.json(), { ok: true, configured: true, ready: false });
  assert.equal(cleared.status, 200);
  assert.deepEqual(await cleared.json(), { ok: true, configured: false });
  assert.equal(env.DB.rows.size, 0);
});

test("OpenAlex proxy rate limits each account before making another upstream request", async () => {
  const env = createEnv();
  await worker.fetch(await request("/api/reader/openalex-key", { method: "POST", body: { api_key: API_KEY } }), env);
  env.DB.rateLimits.set(1, { window_start: Math.floor(Date.now() / 60000), request_count: 120 });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("upstream should not be called"); };

  try {
    const response = await worker.fetch(await request("/api/reader/openalex", {
      method: "POST",
      body: { path: "/works", params: { per_page: "20" } },
    }), env);
    assert.equal(response.status, 429);
    assert.deepEqual(await response.json(), { ok: false, error: "rate_limited" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("PDF previews use the account credential and a fixed OpenAlex content host", async () => {
  const env = createEnv(), doi = "10.1000/reader-pdf";
  await worker.fetch(await request("/api/reader/openalex-key", { method: "POST", body: { api_key: API_KEY } }), env);
  const originalFetch = globalThis.fetch, calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input)); calls.push(url.href);
    assert.equal(init.headers.Authorization, `Bearer ${API_KEY}`);
    assert.equal(url.searchParams.has("api_key"), false);
    if (url.hostname === "api.openalex.org") {
      assert.equal(url.searchParams.get("filter"), `doi:https://doi.org/${doi},has_content.pdf:true`);
      return Response.json({ results: [{ id: "https://openalex.org/W42", doi: `https://doi.org/${doi}`, has_content: { pdf: true } }] });
    }
    assert.equal(url.href, "https://content.openalex.org/works/W42.pdf");
    assert.equal(init.redirect, "error");
    return new Response("%PDF-1.7\nactual-pdf", { headers: { "Content-Type": "application/pdf" } });
  };
  try {
    const response = await worker.fetch(await request("/api/reader/openalex", { method: "POST", body: { path: "/pdf", params: { doi } } }), env);
    assert.equal(response.status, 200); assert.equal(response.headers.get("Content-Type"), "application/pdf");
    assert.equal(response.headers.get("Cache-Control"), "private, max-age=3600");
    assert.match(await response.text(), /^%PDF-/); assert.equal(calls.length, 2);
    const isolated = await worker.fetch(await request("/api/reader/openalex", { userId: 2, method: "POST", body: { path: "/pdf", params: { doi } } }), env);
    assert.equal(isolated.status, 409); assert.equal(calls.length, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test("PDF previews reject supplied URLs, mismatched papers, and non-PDF content", async () => {
  const env = createEnv(), doi = "10.1000/reader-pdf-guards";
  await worker.fetch(await request("/api/reader/openalex-key", { method: "POST", body: { api_key: API_KEY } }), env);
  const originalFetch = globalThis.fetch;
  let matching = false, calls = 0;
  globalThis.fetch = async input => {
    calls++;
    if (new URL(String(input)).hostname === "api.openalex.org") return Response.json({ results: [{ id: "https://openalex.org/W43", doi: `https://doi.org/${matching ? doi : '10.1000/another-paper'}`, has_content: { pdf: true } }] });
    return new Response("<html>access denied</html>", { headers: { "Content-Type": "application/pdf" } });
  };
  try {
    const invalid = await worker.fetch(await request("/api/reader/openalex", { method: "POST", body: { path: "/pdf", params: { doi, url: "https://attacker.example/private" } } }), env);
    assert.equal(invalid.status, 400); assert.equal(calls, 0);
    const mismatch = await worker.fetch(await request("/api/reader/openalex", { method: "POST", body: { path: "/pdf", params: { doi } } }), env);
    assert.equal(mismatch.status, 404); assert.equal(calls, 1);
    matching = true;
    const badPdf = await worker.fetch(await request("/api/reader/openalex", { method: "POST", body: { path: "/pdf", params: { doi } } }), env);
    assert.equal(badPdf.status, 502); assert.equal((await badPdf.json()).error, "invalid_pdf");
  } finally { globalThis.fetch = originalFetch; }
});
