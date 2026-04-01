import fs from "node:fs/promises";
import process from "node:process";

import { normalizeSubmissionStatRecord, normalizeIssnKey } from "../src/submission-stats.mjs";

const DEFAULT_API_BASE = "https://www.scansci.com/api";
const MAX_BATCH_SIZE = 100;
const PARSER_VERSION = "2026-04-01-letpub-insights-v1";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.inputPath) {
    console.error(
      "Usage: node sync_letpub_comment_insights.mjs <letpub-json> [--dry-run] [--out <normalized.json>]"
    );
    process.exit(1);
  }

  const payload = JSON.parse(await fs.readFile(args.inputPath, "utf8"));
  const journals = Array.isArray(payload?.journals) ? payload.journals : [];
  if (!journals.length) {
    throw new Error("Input file has no journals array.");
  }

  const nowIso = new Date().toISOString();
  const selectedByIssn = new Map();
  const skipped = [];
  let replacedByLargerSample = 0;

  for (const journal of journals) {
    const rawIssn = String(journal?.issn || "").trim();
    const issnKey = normalizeIssnKey(rawIssn);
    if (!issnKey) {
      skipped.push({ journal_id: journal?.journal_id, journal_name: journal?.journal_name, reason: "invalid_issn" });
      continue;
    }

    const comments = Array.isArray(journal?.comments) ? journal.comments : [];
    if (!comments.length) {
      skipped.push({ journal_id: journal?.journal_id, journal_name: journal?.journal_name, reason: "no_comments" });
      continue;
    }

    const built = buildLetpubSourceRecord(journal, comments, nowIso, payload?.generated_at);
    const normalized = normalizeSubmissionStatRecord(built);
    if (!normalized.ok) {
      skipped.push({
        journal_id: journal?.journal_id,
        journal_name: journal?.journal_name,
        reason: normalized.error || "normalize_failed",
      });
      continue;
    }

    const item = {
      issn: normalized.record.issn_display,
      ...normalized.record,
    };

    const existing = selectedByIssn.get(normalized.record.issn_key);
    if (!existing) {
      selectedByIssn.set(normalized.record.issn_key, item);
      continue;
    }

    const currentSample = Number(item.sample_size || 0);
    const existingSample = Number(existing.sample_size || 0);
    if (currentSample > existingSample) {
      selectedByIssn.set(normalized.record.issn_key, item);
      replacedByLargerSample += 1;
    }
  }

  const items = [...selectedByIssn.values()];
  const summary = {
    ok: true,
    input_journals: journals.length,
    normalized_items: items.length,
    skipped: skipped.length,
    replaced_by_larger_sample: replacedByLargerSample,
  };

  if (args.outPath) {
    await fs.writeFile(args.outPath, JSON.stringify({ summary, items, skipped }, null, 2), "utf8");
  }

  if (args.dryRun) {
    console.log(JSON.stringify({ ...summary, sample_items: items.slice(0, 3), skipped: skipped.slice(0, 20) }, null, 2));
    return;
  }

  const adminToken = String(process.env.ADMIN_SYNC_TOKEN || "").trim();
  if (!adminToken) {
    throw new Error("Missing ADMIN_SYNC_TOKEN");
  }

  const apiBase = String(process.env.SUBMISSION_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, "");
  const uploadResults = [];
  for (let i = 0; i < items.length; i += MAX_BATCH_SIZE) {
    const batch = items.slice(i, i + MAX_BATCH_SIZE);
    const resp = await fetch(`${apiBase}/admin/submission-stats/batch-upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-ScanSci-Admin-Token": adminToken,
      },
      body: JSON.stringify({ items: batch }),
    });
    const body = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(`Batch upsert failed: HTTP ${resp.status} ${JSON.stringify(body)}`);
    }
    uploadResults.push(body);
  }

  console.log(
    JSON.stringify(
      {
        ...summary,
        uploaded_items: items.length,
        skipped_sample: skipped.slice(0, 20),
        results: uploadResults,
      },
      null,
      2
    )
  );
}

function parseArgs(argv) {
  const out = {
    inputPath: "",
    dryRun: false,
    outPath: "",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "");
    if (!token) continue;
    if (token === "--dry-run") {
      out.dryRun = true;
      continue;
    }
    if (token === "--out") {
      out.outPath = String(argv[i + 1] || "").trim();
      i += 1;
      continue;
    }
    if (!out.inputPath) {
      out.inputPath = token;
    }
  }
  return out;
}

function buildLetpubSourceRecord(journal, comments, nowIso, datasetGeneratedAt = "") {
  const parsedComments = comments.map((comment) => parseCommentRecord(comment)).filter(Boolean);
  const cycleDaysValues = parsedComments.map((item) => item.cycleDays).filter((n) => Number.isFinite(n));
  const scoreValues = parsedComments.map((item) => item.score).filter((n) => Number.isFinite(n));

  const resultCounter = new Map();
  const cycleCounter = new Map();
  const tagCounter = new Map();
  const directionCounter = new Map();
  let acceptedCount = 0;
  let rejectedCount = 0;
  let knownDecisionCount = 0;

  let latestUpdatedAt = "";
  let latestUpdatedEpoch = 0;
  let latestMonth = "";
  let recentCommentCount12m = 0;
  const nowEpoch = Date.now();

  for (const item of parsedComments) {
    bumpCounter(resultCounter, item.resultLabel);
    bumpCounter(cycleCounter, item.cycleBucket);
    for (const tag of item.tags) bumpCounter(tagCounter, tag);
    for (const direction of item.researchDirections) bumpCounter(directionCounter, direction);

    if (item.resultCode === "accepted") {
      acceptedCount += 1;
      knownDecisionCount += 1;
    } else if (item.resultCode === "rejected") {
      rejectedCount += 1;
      knownDecisionCount += 1;
    }

    if (item.updatedAtEpoch > latestUpdatedEpoch) {
      latestUpdatedEpoch = item.updatedAtEpoch;
      latestUpdatedAt = item.updatedAtIso;
      latestMonth = item.month;
    }
    if (item.publishedAtEpoch > 0 && nowEpoch - item.publishedAtEpoch <= 366 * 24 * 3600 * 1000) {
      recentCommentCount12m += 1;
    }
  }

  const sampleSize = parsedComments.length;
  const acceptedRatePct =
    knownDecisionCount >= 5
      ? round1((acceptedCount / knownDecisionCount) * 100)
      : sampleSize
        ? round1((acceptedCount / sampleSize) * 100)
        : null;
  const reviewP50 = percentile(cycleDaysValues, 0.5);
  const reviewP75 = percentile(cycleDaysValues, 0.75);
  const overallScore = scoreValues.length ? round1(mean(scoreValues)) : null;

  const summarySamples = parsedComments
    .slice()
    .sort((a, b) => b.publishedAtEpoch - a.publishedAtEpoch)
    .slice(0, 8)
    .map((item) => ({
      month: item.month,
      result: item.resultLabel,
      cycle_bucket: item.cycleBucket,
      likes_bucket: item.likesBucket,
      tags: item.tags.slice(0, 4),
    }));

  const commentInsights = {
    schema_version: PARSER_VERSION,
    generated_at: nowIso,
    sample_size: sampleSize,
    accepted_rate_pct: acceptedRatePct,
    review_time_days_p50: reviewP50,
    review_time_days_p75: reviewP75,
    recent_comment_count_12m: recentCommentCount12m,
    updated_month: latestMonth,
    result_distribution: buildDistribution(resultCounter, sampleSize),
    cycle_distribution: buildDistribution(cycleCounter, sampleSize),
    tags_top: topCounter(tagCounter, 10),
    research_directions_top: topCounter(directionCounter, 10),
    summary_samples: summarySamples,
  };

  const sourceUrl = normalizeHttpUrl(journal?.detail_url) || buildLetpubDetailUrl(journal?.journal_id);
  return {
    issn: String(journal?.issn || "").trim(),
    source_name: "LetPub",
    source_type: "community",
    source_url: sourceUrl,
    review_time_days: reviewP50,
    review_time_label: reviewP50 === null ? "" : `${reviewP50} days (median from anonymized comments)`,
    first_decision_days: null,
    accept_rate_pct: acceptedRatePct,
    sample_size: sampleSize || null,
    overall_score: overallScore,
    updated_at: latestUpdatedAt,
    fetched_at: nowIso,
    parser_version: PARSER_VERSION,
    raw_json: {
      source: "letpub",
      source_dataset_generated_at: String(datasetGeneratedAt || ""),
      comment_insights: commentInsights,
    },
  };
}

function parseCommentRecord(comment) {
  const submissionResult = String(comment?.submission_result || "").trim();
  const resultCode = classifyResult(submissionResult);
  const resultLabel = resultLabelFromCode(resultCode);
  const cycleDays = parseCycleDays(comment?.submission_cycle);
  const cycleBucket = classifyCycleBucket(cycleDays);
  const tags = extractCommentTags(comment?.experience_text);
  const score = normalizeNumber(comment?.journal_score);
  const likes = normalizeInt(comment?.likes);
  const dislikes = normalizeInt(comment?.dislikes);
  const likesBucket = classifyLikesBucket(likes, dislikes);
  const researchDirections = Array.isArray(comment?.research_directions)
    ? comment.research_directions.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 6)
    : [];

  const publishedAtIso = normalizeDateIso(comment?.published_at);
  const updatedAtIso = normalizeDateIso(comment?.updated_at) || publishedAtIso;
  const publishedAtEpoch = publishedAtIso ? Date.parse(publishedAtIso) : 0;
  const updatedAtEpoch = updatedAtIso ? Date.parse(updatedAtIso) : 0;
  const month = (publishedAtIso || updatedAtIso || "").slice(0, 7);

  return {
    resultCode,
    resultLabel,
    cycleDays,
    cycleBucket,
    tags,
    score,
    likesBucket,
    researchDirections,
    month,
    publishedAtIso,
    updatedAtIso,
    publishedAtEpoch,
    updatedAtEpoch,
  };
}

function classifyResult(rawText) {
  const text = String(rawText || "").toLowerCase();
  if (!text) return "unknown";
  if (/(录用|接收|accept)/i.test(text)) return "accepted";
  if (/(拒稿|拒|rejected|reject|desk)/i.test(text)) return "rejected";
  if (/(大修|小修|返修|修回|revision|revise|major|minor)/i.test(text)) return "revision";
  return "unknown";
}

function resultLabelFromCode(code) {
  if (code === "accepted") return "accepted";
  if (code === "rejected") return "rejected";
  if (code === "revision") return "revision";
  return "unknown";
}

function parseCycleDays(rawText) {
  const text = String(rawText || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!text || /(未知|不详|结果未知)/.test(text)) return null;

  const match = text.match(
    /([0-9]+(?:\.[0-9]+)?)\s*(?:-|~|至|到|to)?\s*([0-9]+(?:\.[0-9]+)?)?\s*(个月|月|months?|month|mos?|mo|weeks?|week|wks?|wk|days?|day|天|d)/i
  );
  if (!match) return null;

  const left = Number(match[1]);
  const right = match[2] ? Number(match[2]) : left;
  if (!Number.isFinite(left) || !Number.isFinite(right)) return null;

  const value = (left + right) / 2;
  if (value <= 0) return null;
  const unit = String(match[3] || "");
  if (/个月|月|month|mo/.test(unit)) return round1(value * 30);
  if (/week|wk|周/.test(unit)) return round1(value * 7);
  if (/day|天|d/.test(unit)) return round1(value);
  return null;
}

function classifyCycleBucket(days) {
  if (!Number.isFinite(days)) return "unknown";
  if (days <= 30) return "within_1_month";
  if (days <= 90) return "month_1_to_3";
  if (days <= 180) return "month_3_to_6";
  return "over_6_months";
}

function extractCommentTags(rawText) {
  const text = String(rawText || "").toLowerCase();
  if (!text) return [];

  const tagRules = [
    ["major_revision", /(大修|major revision|major revise)/i],
    ["minor_revision", /(小修|minor revision|minor revise)/i],
    ["quick_review", /(速度快|很快|效率高|快审|fast|quick|rapid)/i],
    ["slow_review", /(很慢|太慢|耗时长|slow)/i],
    ["high_apc", /(版面费|费用高|太贵|昂贵|apc)/i],
    ["desk_reject", /(编辑拒|desk reject)/i],
    ["detailed_review", /(意见中肯|意见详细|审稿人.*专业|detailed review)/i],
  ];

  const out = [];
  for (const [tag, pattern] of tagRules) {
    if (pattern.test(text)) out.push(tag);
  }
  return out.slice(0, 6);
}

function classifyLikesBucket(likes, dislikes) {
  const total = likes + dislikes;
  if (total <= 0) return "none";
  const delta = likes - dislikes;
  if (delta >= 5) return "high_positive";
  if (delta >= 1) return "positive";
  if (delta <= -5) return "high_negative";
  if (delta < 0) return "negative";
  return "mixed";
}

function normalizeDateIso(rawValue) {
  const text = String(rawValue || "").trim();
  if (!text) return "";
  const parsed = new Date(text);
  if (!Number.isFinite(parsed.getTime())) return "";
  return parsed.toISOString();
}

function normalizeHttpUrl(rawUrl) {
  const text = String(rawUrl || "").trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function buildLetpubDetailUrl(journalId) {
  const id = normalizeInt(journalId);
  if (!id) return "https://www.letpub.com.cn/";
  return `https://www.letpub.com.cn/index.php?journalid=${id}&page=journalapp&view=detail`;
}

function bumpCounter(counter, key) {
  const normalized = String(key || "").trim();
  if (!normalized) return;
  counter.set(normalized, Number(counter.get(normalized) || 0) + 1);
}

function topCounter(counter, maxItems = 10) {
  return [...counter.entries()]
    .sort((a, b) => {
      if (a[1] !== b[1]) return b[1] - a[1];
      return String(a[0]).localeCompare(String(b[0]));
    })
    .slice(0, maxItems)
    .map(([tag, count]) => ({ tag, count }));
}

function buildDistribution(counter, total) {
  if (!total || total <= 0) return [];
  return [...counter.entries()]
    .sort((a, b) => {
      if (a[1] !== b[1]) return b[1] - a[1];
      return String(a[0]).localeCompare(String(b[0]));
    })
    .map(([label, count]) => ({ label, count, pct: round1((count / total) * 100) }));
}

function percentile(values, pct) {
  if (!Array.isArray(values) || !values.length) return null;
  const sorted = values.filter((n) => Number.isFinite(n)).slice().sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * pct;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return round1(sorted[lower]);
  const weight = index - lower;
  return round1(sorted[lower] + (sorted[upper] - sorted[lower]) * weight);
}

function mean(values) {
  if (!Array.isArray(values) || !values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeInt(value) {
  const parsed = parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round1(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 10) / 10;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
