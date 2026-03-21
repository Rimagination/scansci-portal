import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import worker from "../src/index.js";

class FakeD1Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = String(sql || "").replace(/\s+/g, " ").trim();
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async first() {
    return this.db.executeFirst(this.sql, this.args);
  }

  async all() {
    return { results: this.db.executeAll(this.sql, this.args) };
  }

  async run() {
    this.db.executeRun(this.sql, this.args);
    return { success: true };
  }
}

class FakeD1Database {
  constructor(seed = {}) {
    this.users = Array.isArray(seed.users) ? seed.users.map((item) => ({ ...item })) : [];
    this.githubLinks = Array.isArray(seed.githubLinks) ? seed.githubLinks.map((item) => ({ ...item })) : [];
    this.emailVerifications = Array.isArray(seed.emailVerifications)
      ? seed.emailVerifications.map((item) => ({ ...item }))
      : [];
    this.externalStats = Array.isArray(seed.externalStats) ? seed.externalStats.map((item) => ({ ...item })) : [];
    this.userRatings = Array.isArray(seed.userRatings) ? seed.userRatings.map((item) => ({ ...item })) : [];
  }

  prepare(sql) {
    return new FakeD1Statement(this, sql);
  }

  executeFirst(sql, args) {
    if (sql.startsWith("SELECT id, github_id, login, email, avatar_url FROM users WHERE id = ?")) {
      const userId = Number(args[0]);
      const user = this.users.find((item) => Number(item.id) === userId);
      return user ? { ...user } : null;
    }

    if (sql.startsWith("SELECT github_id FROM github_links WHERE user_id = ? LIMIT 1")) {
      const userId = Number(args[0]);
      const row = this.githubLinks.find((item) => Number(item.user_id) === userId);
      return row ? { github_id: row.github_id } : null;
    }

    if (sql.startsWith("SELECT 1 FROM user_email_verifications WHERE user_id = ? LIMIT 1")) {
      const userId = Number(args[0]);
      const row = this.emailVerifications.find((item) => Number(item.user_id) === userId);
      return row ? { 1: 1 } : null;
    }

    if (sql.includes("COUNT(*) AS total_ratings") && sql.includes("FROM journal_user_ratings")) {
      const issnKey = String(args[0] || "");
      const rows = this.userRatings.filter((item) => item.issn_key === issnKey);
      const total = rows.length;
      const avg = (field) =>
        total ? rows.reduce((sum, item) => sum + Number(item[field] || 0), 0) / total : null;
      return {
        total_ratings: total,
        speed_avg: avg("speed_score"),
        editor_avg: avg("editor_score"),
        recommend_avg: avg("recommend_score"),
        overall_avg: total
          ? rows.reduce((sum, item) => sum + (item.speed_score + item.editor_score + item.recommend_score) / 3, 0) / total
          : null,
      };
    }

    if (sql.startsWith("SELECT issn_display, speed_score, editor_score, recommend_score, updated_at FROM journal_user_ratings")) {
      const userId = Number(args[0]);
      const issnKey = String(args[1] || "");
      const row = this.userRatings.find((item) => Number(item.user_id) === userId && item.issn_key === issnKey);
      return row ? { ...row } : null;
    }

    throw new Error(`Unhandled first() SQL in test fake: ${sql}`);
  }

  executeAll(sql, args) {
    if (sql.includes("FROM journal_submission_stats_external")) {
      const issnKey = String(args[0] || "");
      const sourceType = String(args[1] || "");
      return this.externalStats
        .filter((item) => item.issn_key === issnKey && item.source_type === sourceType && item.status === "active")
        .sort((a, b) => String(b.updated_at || b.fetched_at || "").localeCompare(String(a.updated_at || a.fetched_at || "")))
        .map((item) => ({ ...item }));
    }

    throw new Error(`Unhandled all() SQL in test fake: ${sql}`);
  }

  executeRun(sql, args) {
    if (sql.startsWith("INSERT INTO journal_user_ratings")) {
      const [
        userId,
        issnKey,
        issnDisplay,
        speedScore,
        editorScore,
        recommendScore,
        createdAt,
        updatedAt,
      ] = args;
      const existing = this.userRatings.find(
        (item) => Number(item.user_id) === Number(userId) && item.issn_key === String(issnKey)
      );
      if (existing) {
        existing.issn_display = String(issnDisplay);
        existing.speed_score = Number(speedScore);
        existing.editor_score = Number(editorScore);
        existing.recommend_score = Number(recommendScore);
        existing.updated_at = String(updatedAt);
      } else {
        this.userRatings.push({
          user_id: Number(userId),
          issn_key: String(issnKey),
          issn_display: String(issnDisplay),
          speed_score: Number(speedScore),
          editor_score: Number(editorScore),
          recommend_score: Number(recommendScore),
          created_at: String(createdAt),
          updated_at: String(updatedAt),
        });
      }
      return;
    }

    if (sql.startsWith("INSERT INTO journal_submission_stats_external")) {
      const [
        issnKey,
        issnDisplay,
        sourceName,
        sourceType,
        reviewTimeDays,
        reviewTimeLabel,
        firstDecisionDays,
        acceptRatePct,
        sampleSize,
        overallScore,
        sourceUrl,
        updatedAt,
        fetchedAt,
        parserVersion,
        rawJson,
        status,
        createdAt,
      ] = args;

      const existing = this.externalStats.find(
        (item) =>
          item.issn_key === String(issnKey) &&
          item.source_name === String(sourceName) &&
          item.source_url === String(sourceUrl)
      );
      const next = {
        issn_key: String(issnKey),
        issn_display: String(issnDisplay),
        source_name: String(sourceName),
        source_type: String(sourceType),
        review_time_days: reviewTimeDays === null ? null : Number(reviewTimeDays),
        review_time_label: reviewTimeLabel === null ? null : String(reviewTimeLabel || ""),
        first_decision_days: firstDecisionDays === null ? null : Number(firstDecisionDays),
        accept_rate_pct: acceptRatePct === null ? null : Number(acceptRatePct),
        sample_size: sampleSize === null ? null : Number(sampleSize),
        overall_score: overallScore === null ? null : Number(overallScore),
        source_url: String(sourceUrl),
        updated_at: updatedAt ? String(updatedAt) : "",
        fetched_at: String(fetchedAt),
        parser_version: String(parserVersion),
        raw_json: rawJson,
        status: String(status),
        created_at: String(createdAt),
      };

      if (existing) {
        Object.assign(existing, next, { created_at: existing.created_at });
      } else {
        this.externalStats.push(next);
      }
      return;
    }

    throw new Error(`Unhandled run() SQL in test fake: ${sql}`);
  }
}

function createEnv(seed = {}) {
  return {
    JWT_SECRET: "test-secret",
    PUBLIC_ORIGIN: "https://www.scansci.com",
    CORS_ORIGINS: "https://www.scansci.com,https://journal.scansci.com",
    ADMIN_SYNC_TOKEN: "admin-token",
    DB: new FakeD1Database(seed),
  };
}

async function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.webcrypto.subtle.sign("HMAC", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

function base64Url(value) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function bytesToBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function makeRequest(path, env, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.authUserId) {
    const token = await signJwt(
      {
        sub: String(options.authUserId),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      env.JWT_SECRET
    );
    headers.set("Cookie", `__Secure-scansci_session=${encodeURIComponent(token)}`);
  }

  const request = new Request(`https://www.scansci.com${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return worker.fetch(request, env);
}

test("GET /api/journals/:issn/submission-stats returns official, community, and my rating", async () => {
  const env = createEnv({
    users: [{ id: 1, github_id: "gh_1", login: "alice", email: "alice@example.com", avatar_url: "" }],
    externalStats: [
      {
        issn_key: "00280836",
        issn_display: "0028-0836",
        source_name: "Elsevier",
        source_type: "official",
        review_time_days: 19,
        review_time_label: "19 days",
        first_decision_days: 19,
        accept_rate_pct: 23,
        sample_size: null,
        overall_score: null,
        source_url: "https://example.com/elsevier",
        updated_at: "2026-03-20T00:00:00.000Z",
        fetched_at: "2026-03-21T00:00:00.000Z",
        parser_version: "v1",
        status: "active",
      },
      {
        issn_key: "00280836",
        issn_display: "0028-0836",
        source_name: "LetPub",
        source_type: "community",
        review_time_days: 60,
        review_time_label: "2 months",
        first_decision_days: null,
        accept_rate_pct: 48,
        sample_size: 37,
        overall_score: 8.6,
        source_url: "https://example.com/letpub",
        updated_at: "2026-03-18T00:00:00.000Z",
        fetched_at: "2026-03-21T00:00:00.000Z",
        parser_version: "v1",
        status: "active",
      },
    ],
    userRatings: [
      {
        user_id: 1,
        issn_key: "00280836",
        issn_display: "0028-0836",
        speed_score: 4,
        editor_score: 5,
        recommend_score: 4,
        created_at: "2026-03-20T00:00:00.000Z",
        updated_at: "2026-03-20T00:00:00.000Z",
      },
    ],
  });

  const resp = await makeRequest("/api/journals/0028-0836/submission-stats", env, { authUserId: 1 });
  assert.equal(resp.status, 200);

  const payload = await resp.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.official_sources.length, 1);
  assert.equal(payload.community_sources.length, 1);
  assert.equal(payload.user_rating_summary.total_ratings, 1);
  assert.equal(payload.viewer_authenticated, true);
  assert.deepEqual(payload.my_rating, {
    issn: "0028-0836",
    speed_score: 4,
    editor_score: 5,
    recommend_score: 4,
    updated_at: "2026-03-20T00:00:00.000Z",
  });
});

test("GET /api/journals/:issn/submission-stats returns stable empty state", async () => {
  const env = createEnv();
  const resp = await makeRequest("/api/journals/0028-0836/submission-stats", env);
  assert.equal(resp.status, 200);

  const payload = await resp.json();
  assert.deepEqual(payload.official_sources, []);
  assert.deepEqual(payload.community_sources, []);
  assert.deepEqual(payload.user_rating_summary, {
    total_ratings: 0,
    speed_avg: null,
    editor_avg: null,
    recommend_avg: null,
    overall_avg: null,
  });
  assert.equal(payload.my_rating, null);
  assert.equal(payload.viewer_authenticated, false);
});

test("POST /api/journals/:issn/ratings rejects unauthenticated and invalid payloads", async () => {
  const env = createEnv({
    users: [{ id: 1, github_id: "gh_1", login: "alice", email: "alice@example.com", avatar_url: "" }],
  });

  const unauthorizedResp = await makeRequest("/api/journals/0028-0836/ratings", env, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { speed_score: 5, editor_score: 4, recommend_score: 5 },
  });
  assert.equal(unauthorizedResp.status, 401);

  const invalidIssnResp = await makeRequest("/api/journals/not-an-issn/ratings", env, {
    method: "POST",
    authUserId: 1,
    headers: { "Content-Type": "application/json" },
    body: { speed_score: 5, editor_score: 4, recommend_score: 5 },
  });
  assert.equal(invalidIssnResp.status, 400);

  const invalidScoreResp = await makeRequest("/api/journals/0028-0836/ratings", env, {
    method: "POST",
    authUserId: 1,
    headers: { "Content-Type": "application/json" },
    body: { speed_score: 6, editor_score: 4, recommend_score: 5 },
  });
  assert.equal(invalidScoreResp.status, 400);
});

test("POST /api/journals/:issn/ratings upserts without duplicating rows", async () => {
  const env = createEnv({
    users: [{ id: 1, github_id: "gh_1", login: "alice", email: "alice@example.com", avatar_url: "" }],
  });

  const firstResp = await makeRequest("/api/journals/0028-0836/ratings", env, {
    method: "POST",
    authUserId: 1,
    headers: { "Content-Type": "application/json" },
    body: { speed_score: 3, editor_score: 4, recommend_score: 5 },
  });
  assert.equal(firstResp.status, 200);
  assert.equal(env.DB.userRatings.length, 1);

  const secondResp = await makeRequest("/api/journals/0028-0836/ratings", env, {
    method: "POST",
    authUserId: 1,
    headers: { "Content-Type": "application/json" },
    body: { speed_score: 5, editor_score: 5, recommend_score: 4 },
  });
  assert.equal(secondResp.status, 200);
  assert.equal(env.DB.userRatings.length, 1);

  const payload = await secondResp.json();
  assert.equal(payload.user_rating_summary.total_ratings, 1);
  assert.deepEqual(payload.my_rating, {
    issn: "0028-0836",
    speed_score: 5,
    editor_score: 5,
    recommend_score: 4,
    updated_at: env.DB.userRatings[0].updated_at,
  });
});

test("POST /api/admin/submission-stats/batch-upsert writes normalized official and community records", async () => {
  const env = createEnv();

  const resp = await makeRequest("/api/admin/submission-stats/batch-upsert", env, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ScanSci-Admin-Token": "admin-token",
    },
    body: {
      items: [
        {
          issn: "0028-0836",
          source_name: "Elsevier",
          source_url: "https://example.com/elsevier",
          review_time_days: 19,
          first_decision_days: 19,
          accept_rate_pct: 23,
          fetched_at: "2026-03-21T00:00:00.000Z",
        },
        {
          issn: "0028-0836",
          source_name: "LetPub",
          source_url: "https://example.com/letpub",
          review_time_days: 60,
          accept_rate_pct: 48,
          sample_size: 37,
          overall_score: 8.6,
          fetched_at: "2026-03-21T00:00:00.000Z",
        },
      ],
    },
  });

  assert.equal(resp.status, 200);
  const payload = await resp.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.success, 2);
  assert.equal(env.DB.externalStats.length, 2);
  assert.equal(env.DB.externalStats[0].source_type, "official");
  assert.equal(env.DB.externalStats[1].source_type, "community");
});
