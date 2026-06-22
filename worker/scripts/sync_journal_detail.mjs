#!/usr/bin/env node
/* eslint-disable no-console */

import fs from "node:fs/promises";
import path from "node:path";

const ADMIN_TOKEN = String(process.env.SCANSCI_ADMIN_SYNC_TOKEN || process.env.ADMIN_SYNC_TOKEN || "").trim();
const WORKER_BASE = String(process.env.SCANSCI_WORKER_BASE || "https://www.scansci.com").trim().replace(/\/+$/, "");
const JOURNALS_SOURCE = String(process.argv[2] || process.env.JOURNAL_DETAIL_SOURCE || "").trim();
const RELATED_SOURCE = String(process.argv[3] || process.env.JOURNAL_RELATED_SOURCE || "").trim();
const BATCH_SIZE = Math.max(1, Math.min(50, Number.parseInt(process.env.BATCH_SIZE || "25", 10)));
const LIMIT = Math.max(0, Number.parseInt(process.env.LIMIT || "0", 10) || 0);
const RELATED_LIMIT = Math.max(0, Math.min(24, Number.parseInt(process.env.RELATED_LIMIT || "12", 10) || 12));
const REQUEST_TIMEOUT_MS = Math.max(3000, Number.parseInt(process.env.REQUEST_TIMEOUT_MS || "30000", 10));

function assertEnv() {
  const missing = [];
  if (!ADMIN_TOKEN) missing.push("SCANSCI_ADMIN_SYNC_TOKEN");
  if (!WORKER_BASE) missing.push("SCANSCI_WORKER_BASE");
  if (!JOURNALS_SOURCE) missing.push("JOURNAL_DETAIL_SOURCE or first CLI arg");
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

async function loadJson(source) {
  if (/^https?:\/\//i.test(source)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(source, {
        headers: { Accept: "application/json", "User-Agent": "ScanSci-JournalDetailSync/1.0" },
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

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function values(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
}

function indexByField(rows, field) {
  const index = new Map();
  for (const row of rows) {
    const id = Number(row?.id);
    if (!Number.isFinite(id)) continue;
    for (const raw of values(row?.[field])) {
      const key = normalizeKey(raw);
      if (!key) continue;
      if (!index.has(key)) index.set(key, new Set());
      index.get(key).add(id);
    }
  }
  return index;
}

function addCandidates(out, index, rawValues) {
  for (const raw of values(rawValues)) {
    const key = normalizeKey(raw);
    const ids = index.get(key);
    if (!ids) continue;
    for (const id of ids) out.add(id);
  }
}

function setOf(value) {
  return new Set(values(value).map(normalizeKey).filter(Boolean));
}

function intersection(left, right) {
  const out = [];
  for (const item of left) {
    if (right.has(item)) out.push(item);
  }
  return out;
}

function similarity(base, candidate) {
  let score = 0;
  let fieldPriority = 0;
  const reasons = [];
  const sub = intersection(setOf(base.cas_subcategories), setOf(candidate.cas_subcategories));
  const major = intersection(setOf(base.cas_categories), setOf(candidate.cas_categories));
  const hqFields = intersection(setOf(base.hq_fields), setOf(candidate.hq_fields));
  const hqSubfields = intersection(setOf(base.hq_subfields), setOf(candidate.hq_subfields));

  if (sub.length) {
    score += 520 + Math.min(sub.length, 4) * 58;
    fieldPriority += 4000 + sub.length * 100;
    reasons.push(`同领域：中科院小类（${sub[0]}）`);
  }
  if (hqSubfields.length) {
    score += 390 + Math.min(hqSubfields.length, 3) * 46;
    fieldPriority += 3800 + hqSubfields.length * 80;
    reasons.push(`同领域：科协子领域（${hqSubfields[0]}）`);
  }
  if (hqFields.length) {
    score += 320 + Math.min(hqFields.length, 4) * 38;
    fieldPriority += 3000 + hqFields.length * 60;
    reasons.push(`同领域：科协目录（${hqFields[0]}）`);
  }
  if (major.length) {
    score += 220 + Math.min(major.length, 2) * 28;
    fieldPriority += 2000 + major.length * 40;
    reasons.push(`同领域：中科院大类（${major[0]}）`);
  }
  if (base.cas_2025 && base.cas_2025 === candidate.cas_2025) {
    score += 56;
    reasons.push("同中科院分区");
  }
  if (base.jcr_quartile && base.jcr_quartile === candidate.jcr_quartile) {
    score += 34;
    reasons.push("同JCR分区");
  }
  if (base.hq_level && base.hq_level === candidate.hq_level) score += 10;
  return { score, fieldPriority, reasons };
}

function buildRelatedFactory(relatedRows) {
  const byId = new Map();
  for (const row of relatedRows) {
    const id = Number(row?.id);
    if (Number.isFinite(id)) byId.set(id, row);
  }
  const indexes = {
    cas_subcategories: indexByField(relatedRows, "cas_subcategories"),
    cas_categories: indexByField(relatedRows, "cas_categories"),
    hq_fields: indexByField(relatedRows, "hq_fields"),
    hq_subfields: indexByField(relatedRows, "hq_subfields"),
  };

  return function relatedFor(journal) {
    if (!RELATED_LIMIT) return [];
    const id = Number(journal?.id);
    const base = byId.get(id);
    if (!base) return [];

    const candidateIds = new Set();
    addCandidates(candidateIds, indexes.cas_subcategories, base.cas_subcategories);
    addCandidates(candidateIds, indexes.hq_subfields, base.hq_subfields);
    addCandidates(candidateIds, indexes.hq_fields, base.hq_fields);
    addCandidates(candidateIds, indexes.cas_categories, base.cas_categories);
    candidateIds.delete(id);

    const ranked = [];
    for (const candidateId of candidateIds) {
      const candidate = byId.get(candidateId);
      if (!candidate) continue;
      const sim = similarity(base, candidate);
      if (sim.score <= 0) continue;
      ranked.push({ candidate, sim });
    }
    ranked.sort((a, b) => {
      if (b.sim.fieldPriority !== a.sim.fieldPriority) return b.sim.fieldPriority - a.sim.fieldPriority;
      if (b.sim.score !== a.sim.score) return b.sim.score - a.sim.score;
      return String(a.candidate.title || "").localeCompare(String(b.candidate.title || ""));
    });
    return ranked.slice(0, RELATED_LIMIT).map(({ candidate, sim }) => ({
      ...candidate,
      _relatedScore: Math.round(sim.score * 1000) / 1000,
      _relatedReasons: sim.reasons,
      _relatedFieldPriority: sim.fieldPriority,
    }));
  };
}

async function postBatch(items, batchIndex) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${WORKER_BASE}/api/admin/journal-detail/batch-upsert`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-ScanSci-Admin-Token": ADMIN_TOKEN,
        "User-Agent": "ScanSci-JournalDetailSync/1.0",
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
  const journalsPayload = await loadJson(JOURNALS_SOURCE);
  const relatedPayload = RELATED_SOURCE ? await loadJson(RELATED_SOURCE) : null;
  const allJournals = extractItems(journalsPayload);
  const relatedRows = extractItems(relatedPayload);
  if (!allJournals.length) throw new Error(`No journal rows found in ${JOURNALS_SOURCE}`);
  const journals = LIMIT ? allJournals.slice(0, LIMIT) : allJournals;
  const relatedFor = buildRelatedFactory(relatedRows);

  console.log(`Syncing ${journals.length} journal detail rows from ${JOURNALS_SOURCE}`);
  console.log(`Related source rows: ${relatedRows.length}`);
  let success = 0;
  for (let offset = 0; offset < journals.length; offset += BATCH_SIZE) {
    const batch = journals.slice(offset, offset + BATCH_SIZE).map((journal) => ({
      journal,
      related: relatedFor(journal),
    }));
    const batchNo = Math.floor(offset / BATCH_SIZE) + 1;
    const result = await postBatch(batch, batchNo);
    success += Number(result.success || 0);
    console.log(`batch ${batchNo}: success=${result.success} failed=${result.failed}`);
  }
  console.log(`Done. success=${success} total=${journals.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
