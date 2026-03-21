import fs from "node:fs/promises";
import process from "node:process";

import {
  SUBMISSION_STATS_PARSER_VERSION,
  normalizeSubmissionStatRecord,
  parseSubmissionStatsBySource,
} from "../src/submission-stats.mjs";

const DEFAULT_API_BASE = "https://www.scansci.com/api";
const MAX_BATCH_SIZE = 100;

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node sync_submission_stats.mjs <sources.json>");
    process.exit(1);
  }

  const adminToken = String(process.env.ADMIN_SYNC_TOKEN || "").trim();
  if (!adminToken) {
    console.error("Missing ADMIN_SYNC_TOKEN");
    process.exit(1);
  }

  const apiBase = String(process.env.SUBMISSION_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, "");
  const raw = await fs.readFile(inputPath, "utf8");
  const items = JSON.parse(raw);
  if (!Array.isArray(items) || !items.length) {
    console.error("Input JSON must be a non-empty array.");
    process.exit(1);
  }

  const normalizedItems = [];
  const skipped = [];

  for (const item of items) {
    const sourceUrl = String(item?.source_url || item?.sourceUrl || "").trim();
    const sourceName = String(item?.source_name || item?.sourceName || "").trim();
    const issn = String(item?.issn || "").trim();
    if (!sourceUrl || !sourceName || !issn) {
      skipped.push({ issn, source_name: sourceName, reason: "missing_seed_fields" });
      continue;
    }

    try {
      const html = await fetchHtml(sourceUrl);
      const parsed = parseSubmissionStatsBySource(sourceName, html);
      if (!hasSubmissionMetrics(parsed)) {
        skipped.push({ issn, source_name: sourceName, reason: "no_metrics_detected" });
        continue;
      }

      const normalized = normalizeSubmissionStatRecord({
        ...item,
        ...parsed,
        parser_version: SUBMISSION_STATS_PARSER_VERSION,
        fetched_at: new Date().toISOString(),
        raw_json: {
          parser_version: SUBMISSION_STATS_PARSER_VERSION,
          parsed,
          source_url: sourceUrl,
        },
      });

      if (!normalized.ok) {
        skipped.push({ issn, source_name: sourceName, reason: normalized.error || "normalize_failed" });
        continue;
      }

      normalizedItems.push({
        issn,
        ...normalized.record,
      });
    } catch (error) {
      skipped.push({
        issn,
        source_name: sourceName,
        reason: String(error?.message || "fetch_or_parse_failed"),
      });
    }
  }

  if (!normalizedItems.length) {
    console.log(JSON.stringify({ ok: true, uploaded: 0, skipped }, null, 2));
    return;
  }

  const results = [];
  for (let i = 0; i < normalizedItems.length; i += MAX_BATCH_SIZE) {
    const batch = normalizedItems.slice(i, i + MAX_BATCH_SIZE);
    const resp = await fetch(`${apiBase}/admin/submission-stats/batch-upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-ScanSci-Admin-Token": adminToken,
      },
      body: JSON.stringify({ items: batch }),
    });
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(`Batch upsert failed: HTTP ${resp.status} ${JSON.stringify(payload)}`);
    }
    results.push(payload);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        uploaded: normalizedItems.length,
        skipped,
        results,
      },
      null,
      2
    )
  );
}

function hasSubmissionMetrics(parsed) {
  return Boolean(
    parsed &&
      (parsed.review_time_days !== undefined ||
        parsed.review_time_label ||
        parsed.first_decision_days !== undefined ||
        parsed.accept_rate_pct !== undefined ||
        parsed.sample_size !== undefined ||
        parsed.overall_score !== undefined)
  );
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const resp = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": "ScanSciSubmissionSync/1.0 (+https://www.scansci.com)",
      },
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    return await resp.text();
  } finally {
    clearTimeout(timer);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
