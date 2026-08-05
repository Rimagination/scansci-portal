#!/usr/bin/env node
/* eslint-disable no-console */

const ELSEVIER_API_KEY = String(process.env.ELSEVIER_API_KEY || "").trim();
const ADMIN_TOKEN = String(process.env.SCANSCI_ADMIN_SYNC_TOKEN || "").trim();
const WORKER_BASE = String(process.env.SCANSCI_WORKER_BASE || "https://www.scansci.com").trim().replace(/\/+$/, "");
const ISSN_SOURCE_URL = String(
  process.env.ISSN_SOURCE_URL || `${WORKER_BASE}/api/admin/journal-search/issns?limit=800`
).trim();
const ISSN_LIMIT = parseInt(process.env.ISSN_LIMIT || "800", 10);
const CONCURRENCY = Math.max(1, parseInt(process.env.CONCURRENCY || "6", 10));
const BATCH_SIZE = Math.max(1, Math.min(100, parseInt(process.env.BATCH_SIZE || "25", 10)));
const TTL_SECONDS = Math.max(300, parseInt(process.env.TTL_SECONDS || "1209600", 10));
const ONLY_ISSN = String(process.env.ONLY_ISSN || "").trim();
const PRIORITY_ISSN = String(process.env.PRIORITY_ISSN || "").trim();
const FAIL_ON_PRIORITY_MISS = String(process.env.FAIL_ON_PRIORITY_MISS || "0").trim() === "1";
const REQUEST_TIMEOUT_MS = Math.max(3000, parseInt(process.env.REQUEST_TIMEOUT_MS || "12000", 10));

function assertEnv() {
  const missing = [];
  if (!ELSEVIER_API_KEY) missing.push("ELSEVIER_API_KEY");
  if (!ADMIN_TOKEN) missing.push("SCANSCI_ADMIN_SYNC_TOKEN");
  if (!WORKER_BASE) missing.push("SCANSCI_WORKER_BASE");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

function normalizeIssn(raw) {
  const compact = String(raw || "").replace(/[^0-9Xx]/g, "").toUpperCase();
  if (!/^\d{7}[\dX]$/.test(compact)) return "";
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}

function uniqIssn(values) {
  const set = new Set();
  for (const value of values) {
    const issn = normalizeIssn(value);
    if (issn) set.add(issn);
  }
  return [...set];
}

async function fetchJson(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    const text = await resp.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { ok: resp.ok, status: resp.status, json, text };
  } finally {
    clearTimeout(timer);
  }
}

function extractIssnListFromSource(rawJson) {
  if (!rawJson) return [];

  let arr = [];
  if (Array.isArray(rawJson)) {
    arr = rawJson;
  } else if (Array.isArray(rawJson.journals)) {
    arr = rawJson.journals;
  } else if (Array.isArray(rawJson.items)) {
    arr = rawJson.items;
  } else if (Array.isArray(rawJson.results)) {
    arr = rawJson.results;
  } else {
    return [];
  }

  const values = [];
  for (const row of arr) {
    if (!row || typeof row !== "object") continue;
    values.push(row.issn, row.eissn, row.ISSN, row.EISSN, row["ISSN号"], row["eISSN"]);
    if (Array.isArray(row.issns)) values.push(...row.issns);
  }
  return uniqIssn(values);
}

async function loadSeedIssns() {
  if (ONLY_ISSN) {
    const direct = uniqIssn(ONLY_ISSN.split(",").map((x) => x.trim()));
    return direct.slice(0, ISSN_LIMIT);
  }

  const priority = uniqIssn(PRIORITY_ISSN.split(",").map((x) => x.trim()));
  const sourceHeaders = { Accept: "application/json", "User-Agent": "ScanSci-ElsevierSync/1.0" };
  const sourceUrl = new URL(ISSN_SOURCE_URL);
  const workerUrl = new URL(WORKER_BASE);
  if (sourceUrl.origin === workerUrl.origin && sourceUrl.pathname.startsWith("/api/admin/")) {
    sourceHeaders["X-ScanSci-Admin-Token"] = ADMIN_TOKEN;
  }
  const src = await fetchJson(ISSN_SOURCE_URL, { headers: sourceHeaders });
  if (!src.ok || !src.json) {
    if (priority.length) {
      console.warn(`[sync] ISSN source unavailable (${src.status}); continuing with priority ISSNs`);
      return priority.slice(0, ISSN_LIMIT);
    }
    throw new Error(`Failed to load ISSN source (${src.status}): ${ISSN_SOURCE_URL}`);
  }

  const list = extractIssnListFromSource(src.json);
  if (!list.length) {
    if (priority.length) {
      console.warn("[sync] ISSN source returned no usable rows; continuing with priority ISSNs");
      return priority.slice(0, ISSN_LIMIT);
    }
    throw new Error(`No ISSN extracted from source: ${ISSN_SOURCE_URL}`);
  }
  return [...new Set([...priority, ...list])].slice(0, ISSN_LIMIT);
}

function buildElsevierUrls(issn) {
  const compact = issn.replace("-", "");
  const variants = [issn, compact];
  return variants.map(
    (variant) =>
      `https://api.elsevier.com/content/serial/title?issn=${encodeURIComponent(
        variant
      )}&view=STANDARD&field=citeScoreYearInfoList,SJR,SNIP,subject-area`
  );
}

function unwrapElsevierPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload["serial-metadata-response"]) return payload;
  if (payload.payload && payload.payload["serial-metadata-response"]) return payload.payload;
  return null;
}

async function fetchElsevierPayload(issn) {
  const urls = buildElsevierUrls(issn);
  for (const url of urls) {
    const res = await fetchJson(
      url,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-ELS-APIKey": ELSEVIER_API_KEY,
          "User-Agent": "ScanSci-ElsevierSync/1.0",
        },
      },
      REQUEST_TIMEOUT_MS
    );
    if (!res.ok || !res.json) continue;
    const payload = unwrapElsevierPayload(res.json);
    if (payload) return payload;
  }
  return null;
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const current = index;
      index += 1;
      if (current >= items.length) break;
      results[current] = await mapper(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
}

async function batchUpsertToWorker(items) {
  if (!items.length) return { ok: true, success: 0, failed: 0 };
  const endpoint = `${WORKER_BASE}/api/admin/elsevier/cache/batch-upsert`;
  const res = await fetchJson(
    endpoint,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ScanSci-Admin-Token": ADMIN_TOKEN,
        "User-Agent": "ScanSci-ElsevierSync/1.0",
      },
      body: JSON.stringify({ items }),
    },
    REQUEST_TIMEOUT_MS
  );
  if (!res.ok || !res.json) {
    throw new Error(`Batch upsert failed (${res.status}): ${res.text?.slice(0, 400) || "empty response"}`);
  }
  return res.json;
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

async function main() {
  assertEnv();
  console.log(`[sync] source=${ISSN_SOURCE_URL}`);
  console.log(`[sync] worker=${WORKER_BASE}`);
  console.log(`[sync] limit=${ISSN_LIMIT} concurrency=${CONCURRENCY} batch=${BATCH_SIZE} ttl=${TTL_SECONDS}s`);

  const seedIssns = await loadSeedIssns();
  console.log(`[sync] seed issn count=${seedIssns.length}`);

  let okCount = 0;
  let failCount = 0;

  const mapped = await mapLimit(seedIssns, CONCURRENCY, async (issn) => {
    const payload = await fetchElsevierPayload(issn);
    if (!payload) {
      failCount += 1;
      return null;
    }
    okCount += 1;
    return {
      issn,
      payload,
      ttlSeconds: TTL_SECONDS,
      source: "gha-sync",
    };
  });

  const successItems = mapped.filter(Boolean);
  if (!successItems.length) {
    throw new Error("No Elsevier payload fetched successfully.");
  }

  const priority = uniqIssn(PRIORITY_ISSN.split(",").map((x) => x.trim()));
  const fetchedIssns = new Set(successItems.map((item) => item.issn));
  const missingPriority = priority.filter((issn) => !fetchedIssns.has(issn));
  if (missingPriority.length) {
    console.warn(`[sync] priority ISSNs missing=${missingPriority.join(",")}`);
    if (FAIL_ON_PRIORITY_MISS) {
      throw new Error(`Priority ISSN sync incomplete: ${missingPriority.join(",")}`);
    }
  }

  let workerSuccess = 0;
  let workerFailed = 0;
  for (const group of chunk(successItems, BATCH_SIZE)) {
    const res = await batchUpsertToWorker(group);
    workerSuccess += Number(res.success || 0);
    workerFailed += Number(res.failed || 0);
  }

  console.log(`[sync] elsevier success=${okCount} fail=${failCount}`);
  console.log(`[sync] worker upsert success=${workerSuccess} fail=${workerFailed}`);

  if (workerSuccess === 0) {
    throw new Error("Worker accepted zero cache records.");
  }
}

main().catch((err) => {
  console.error(`[sync] ERROR: ${String(err?.message || err)}`);
  process.exit(1);
});
