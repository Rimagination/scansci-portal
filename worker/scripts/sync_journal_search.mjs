#!/usr/bin/env node
/* eslint-disable no-console */

import fs from "node:fs/promises";
import path from "node:path";

const ADMIN_TOKEN = String(process.env.SCANSCI_ADMIN_SYNC_TOKEN || process.env.ADMIN_SYNC_TOKEN || "").trim();
const WORKER_BASE = String(process.env.SCANSCI_WORKER_BASE || "https://www.scansci.com").trim().replace(/\/+$/, "");
const SOURCE = String(
  process.argv[2] ||
    process.env.JOURNAL_SEARCH_SOURCE ||
    "https://journal.scansci.com/data/search_index.json"
).trim();
const BATCH_SIZE = Math.max(1, Math.min(100, Number.parseInt(process.env.BATCH_SIZE || "100", 10)));
const LIMIT = Math.max(0, Number.parseInt(process.env.LIMIT || "0", 10) || 0);
const REQUEST_TIMEOUT_MS = Math.max(3000, Number.parseInt(process.env.REQUEST_TIMEOUT_MS || "30000", 10));

function assertEnv() {
  const missing = [];
  if (!ADMIN_TOKEN) missing.push("SCANSCI_ADMIN_SYNC_TOKEN");
  if (!WORKER_BASE) missing.push("SCANSCI_WORKER_BASE");
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

async function loadJson(source) {
  if (/^https?:\/\//i.test(source)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(source, {
        headers: { Accept: "application/json", "User-Agent": "ScanSci-JournalSearchSync/1.0" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${source}`);
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  const resolved = path.resolve(source);
  const text = await fs.readFile(resolved, "utf8");
  return JSON.parse(text);
}

function extractItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.journals)) return payload.journals;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

async function postBatch(items, batchIndex) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${WORKER_BASE}/api/admin/journal-search/batch-upsert`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-ScanSci-Admin-Token": ADMIN_TOKEN,
        "User-Agent": "ScanSci-JournalSearchSync/1.0",
      },
      body: JSON.stringify({ items }),
      signal: controller.signal,
    });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    if (!response.ok || !json?.ok) {
      throw new Error(`batch ${batchIndex} failed (${response.status}): ${text.slice(0, 500)}`);
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  assertEnv();
  const payload = await loadJson(SOURCE);
  const allItems = extractItems(payload);
  if (!allItems.length) throw new Error(`No journal rows found in ${SOURCE}`);
  const items = LIMIT ? allItems.slice(0, LIMIT) : allItems;

  console.log(`Syncing ${items.length} journal search rows from ${SOURCE}`);
  let success = 0;
  for (let offset = 0; offset < items.length; offset += BATCH_SIZE) {
    const batch = items.slice(offset, offset + BATCH_SIZE);
    const batchNo = Math.floor(offset / BATCH_SIZE) + 1;
    const result = await postBatch(batch, batchNo);
    success += Number(result.success || 0);
    console.log(`batch ${batchNo}: success=${result.success} failed=${result.failed}`);
  }
  console.log(`Done. success=${success} total=${items.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
