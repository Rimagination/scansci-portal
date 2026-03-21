export const SUBMISSION_STATS_PARSER_VERSION = "2026-03-21-v1";

const SOURCE_ALIASES = new Map([
  ["elsevier", "Elsevier"],
  ["springer", "Springer Nature"],
  ["springer nature", "Springer Nature"],
  ["springernature", "Springer Nature"],
  ["mdpi", "MDPI"],
  ["sage", "SAGE"],
  ["letpub", "LetPub"],
  ["medsci", "MedSci"],
]);

const OFFICIAL_SOURCES = new Set(["Elsevier", "Springer Nature", "MDPI", "SAGE"]);
const COMMUNITY_SOURCES = new Set(["LetPub", "MedSci"]);

export function canonicalSubmissionSourceName(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  const key = text.toLowerCase().replace(/\s+/g, " ");
  return SOURCE_ALIASES.get(key) || text.slice(0, 80);
}

export function inferSubmissionSourceType(sourceName, preferredType = "") {
  const explicit = String(preferredType || "").trim().toLowerCase();
  if (explicit === "official" || explicit === "community") return explicit;
  const canonical = canonicalSubmissionSourceName(sourceName);
  if (OFFICIAL_SOURCES.has(canonical)) return "official";
  if (COMMUNITY_SOURCES.has(canonical)) return "community";
  return "";
}

export function normalizeIssnKey(raw) {
  const compact = String(raw || "").replace(/[^0-9Xx]/g, "").toUpperCase();
  if (!/^\d{7}[\dX]$/.test(compact)) return "";
  return compact;
}

export function formatIssnDisplay(raw) {
  const key = normalizeIssnKey(raw);
  if (!key) return "";
  return `${key.slice(0, 4)}-${key.slice(4)}`;
}

export function normalizeSubmissionStatRecord(input) {
  const issnKey = normalizeIssnKey(input?.issn);
  if (!issnKey) return { ok: false, error: "invalid_issn" };

  const sourceName = canonicalSubmissionSourceName(input?.source_name ?? input?.sourceName);
  if (!sourceName) return { ok: false, error: "invalid_source_name" };

  const sourceType = inferSubmissionSourceType(sourceName, input?.source_type ?? input?.sourceType);
  if (!sourceType) return { ok: false, error: "invalid_source_type" };

  const sourceUrl = normalizeHttpUrl(input?.source_url ?? input?.sourceUrl);
  if (!sourceUrl) return { ok: false, error: "invalid_source_url" };

  const nowIso = new Date().toISOString();
  const reviewTimeDays = normalizeNullableNumber(input?.review_time_days ?? input?.reviewTimeDays);
  const firstDecisionDays = normalizeNullableNumber(input?.first_decision_days ?? input?.firstDecisionDays);
  const acceptRatePct = normalizeNullableNumber(input?.accept_rate_pct ?? input?.acceptRatePct);
  const sampleSize = normalizeNullableInteger(input?.sample_size ?? input?.sampleSize);
  const overallScore = normalizeNullableNumber(input?.overall_score ?? input?.overallScore);
  const reviewTimeLabel = normalizeShortText(input?.review_time_label ?? input?.reviewTimeLabel, 120);
  const parserVersion = normalizeShortText(
    input?.parser_version ?? input?.parserVersion ?? SUBMISSION_STATS_PARSER_VERSION,
    80
  );
  const status = normalizeStatus(input?.status);
  const updatedAt = normalizeIsoDateTime(input?.updated_at ?? input?.updatedAt);
  const fetchedAt = normalizeIsoDateTime(input?.fetched_at ?? input?.fetchedAt) || nowIso;
  const rawJson = normalizeRawJson(input?.raw_json ?? input?.rawJson);

  return {
    ok: true,
    record: {
      issn_key: issnKey,
      issn_display: formatIssnDisplay(issnKey),
      source_name: sourceName,
      source_type: sourceType,
      review_time_days: reviewTimeDays,
      review_time_label: reviewTimeLabel,
      first_decision_days: firstDecisionDays,
      accept_rate_pct: acceptRatePct,
      sample_size: sampleSize,
      overall_score: overallScore,
      source_url: sourceUrl,
      updated_at: updatedAt,
      fetched_at: fetchedAt,
      parser_version: parserVersion || SUBMISSION_STATS_PARSER_VERSION,
      raw_json: rawJson,
      status,
    },
  };
}

export function validateUserRatingInput(body) {
  const speedScore = normalizeScore(body?.speed_score ?? body?.speedScore);
  const editorScore = normalizeScore(body?.editor_score ?? body?.editorScore);
  const recommendScore = normalizeScore(body?.recommend_score ?? body?.recommendScore);

  if (!speedScore || !editorScore || !recommendScore) {
    return { ok: false, error: "invalid_rating_scores" };
  }

  return {
    ok: true,
    rating: {
      speed_score: speedScore,
      editor_score: editorScore,
      recommend_score: recommendScore,
    },
  };
}

export function parseDurationToDays(raw) {
  const text = normalizeWhitespace(String(raw || "").replace(/平均|约|大约|中位数|median/gi, " "));
  if (!text) return null;
  const match = text.match(
    /([0-9]+(?:\.[0-9]+)?)(?:\s*(?:-|to|–|—)\s*([0-9]+(?:\.[0-9]+)?))?\s*(days?|day|d\b|weeks?|week|wks?|wk\b|months?|month|mos?|mo\b|天|周|月)/i
  );
  if (!match) return null;

  const left = Number(match[1]);
  const right = match[2] ? Number(match[2]) : left;
  if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
  const avg = (left + right) / 2;
  const unit = String(match[3] || "").toLowerCase();

  if (unit === "天" || unit.startsWith("day") || unit === "d") return roundMetric(avg);
  if (unit === "周" || unit.startsWith("week") || unit.startsWith("wk") || unit === "wks") return roundMetric(avg * 7);
  if (unit === "月" || unit.startsWith("month") || unit.startsWith("mo")) return roundMetric(avg * 30);
  return null;
}

export function parseSubmissionStatsBySource(sourceName, html) {
  const canonical = canonicalSubmissionSourceName(sourceName);
  const text = normalizeDocumentText(html);

  switch (canonical) {
    case "Elsevier":
      return parseElsevierSubmissionStats(text);
    case "Springer Nature":
      return parseSpringerSubmissionStats(text);
    case "MDPI":
      return parseMdpiSubmissionStats(text);
    case "SAGE":
      return parseSageSubmissionStats(text);
    case "LetPub":
      return parseLetpubSubmissionStats(text);
    case "MedSci":
      return parseMedsciSubmissionStats(text);
    default:
      return {};
  }
}

function parseElsevierSubmissionStats(text) {
  const reviewLabel = extractFirst(text, [
    /Review Time[^0-9]{0,24}([0-9]+(?:\.[0-9]+)?(?:\s*(?:-|to|–|—)\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:days?|weeks?|months?|天|周|月))/i,
  ]);
  const firstDecisionLabel = extractFirst(text, [
    /Time to (?:First )?Decision[^0-9]{0,24}([0-9]+(?:\.[0-9]+)?(?:\s*(?:-|to|–|—)\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:days?|weeks?|months?|天|周|月))/i,
  ]);
  const acceptRate = extractPercent(text, [/Acceptance Rate[^0-9]{0,12}([0-9]+(?:\.[0-9]+)?)\s*%/i]);

  return compactStats({
    review_time_days: parseDurationToDays(reviewLabel),
    review_time_label: reviewLabel,
    first_decision_days: parseDurationToDays(firstDecisionLabel),
    accept_rate_pct: acceptRate,
  });
}

function parseSpringerSubmissionStats(text) {
  const firstDecisionLabel = extractFirst(text, [
    /Submission to First Decision(?:\s*\(median\))?[^0-9]{0,18}([0-9]+(?:\.[0-9]+)?(?:\s*(?:-|to|–|—)\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:days?|weeks?|months?|天|周|月))/i,
  ]);
  const acceptRate = extractPercent(text, [/Acceptance Rate[^0-9]{0,12}([0-9]+(?:\.[0-9]+)?)\s*%/i]);

  return compactStats({
    review_time_days: parseDurationToDays(firstDecisionLabel),
    review_time_label: firstDecisionLabel,
    first_decision_days: parseDurationToDays(firstDecisionLabel),
    accept_rate_pct: acceptRate,
  });
}

function parseMdpiSubmissionStats(text) {
  const firstDecisionLabel = extractFirst(text, [
    /Median Time to First Decision[^0-9]{0,14}([0-9]+(?:\.[0-9]+)?(?:\s*(?:-|to|–|—)\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:days?|weeks?|months?|天|周|月))/i,
  ]);
  const reviewLabel = extractFirst(text, [
    /Review Time[^0-9]{0,18}([0-9]+(?:\.[0-9]+)?(?:\s*(?:-|to|–|—)\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:days?|weeks?|months?|天|周|月))/i,
  ]) || firstDecisionLabel;

  return compactStats({
    review_time_days: parseDurationToDays(reviewLabel),
    review_time_label: reviewLabel,
    first_decision_days: parseDurationToDays(firstDecisionLabel),
  });
}

function parseSageSubmissionStats(text) {
  const firstDecisionLabel = extractFirst(text, [
    /Time to First Decision[^0-9]{0,16}([0-9]+(?:\.[0-9]+)?(?:\s*(?:-|to|–|—)\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:days?|weeks?|months?|天|周|月))/i,
  ]);
  const acceptRate = extractPercent(text, [/Acceptance Rate[^0-9]{0,12}([0-9]+(?:\.[0-9]+)?)\s*%/i]);

  return compactStats({
    review_time_days: parseDurationToDays(firstDecisionLabel),
    review_time_label: firstDecisionLabel,
    first_decision_days: parseDurationToDays(firstDecisionLabel),
    accept_rate_pct: acceptRate,
  });
}

function parseLetpubSubmissionStats(text) {
  const reviewLabel = extractFirst(text, [
    /平均审稿速度[^0-9]{0,12}([0-9]+(?:\.[0-9]+)?(?:\s*(?:-|至|到|–|—)\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:天|周|月))/i,
    /审稿速度[^0-9]{0,12}([0-9]+(?:\.[0-9]+)?(?:\s*(?:-|至|到|–|—)\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:天|周|月))/i,
  ]);
  const acceptRate = extractPercent(text, [/投稿命中率[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)\s*%/i]);
  const overallScore = extractNumber(text, [/网友评分[^0-9]{0,12}([0-9]+(?:\.[0-9]+)?)/i, /实时评分[^0-9]{0,12}([0-9]+(?:\.[0-9]+)?)/i]);
  const sampleSize = extractInteger(text, [
    /经验分享[^0-9]{0,8}([0-9]{1,5})/i,
    /共有[^0-9]{0,8}([0-9]{1,5})[^0-9]{0,4}(?:条|篇)(?:经验|评论|投稿)/i,
  ]);

  return compactStats({
    review_time_days: parseDurationToDays(reviewLabel),
    review_time_label: reviewLabel,
    accept_rate_pct: acceptRate,
    overall_score: overallScore,
    sample_size: sampleSize,
  });
}

function parseMedsciSubmissionStats(text) {
  const reviewLabel = extractFirst(text, [
    /审稿周期[^0-9]{0,12}(?:平均)?\s*([0-9]+(?:\.[0-9]+)?(?:\s*(?:-|至|到|–|—)\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:天|周|月))/i,
    /审稿速度[^0-9]{0,12}(?:平均)?\s*([0-9]+(?:\.[0-9]+)?(?:\s*(?:-|至|到|–|—)\s*[0-9]+(?:\.[0-9]+)?)?\s*(?:天|周|月))/i,
  ]);
  const acceptRate = extractPercent(text, [/投稿命中率[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)\s*%/i]);
  const overallScore = extractNumber(text, [/评分[^0-9]{0,8}([0-9]+(?:\.[0-9]+)?)/i]);
  const sampleSize = extractInteger(text, [/投稿经验[^0-9]{0,8}([0-9]{1,5})/i, /经验分享[^0-9]{0,8}([0-9]{1,5})/i]);

  return compactStats({
    review_time_days: parseDurationToDays(reviewLabel),
    review_time_label: reviewLabel,
    accept_rate_pct: acceptRate,
    overall_score: overallScore,
    sample_size: sampleSize,
  });
}

function compactStats(input) {
  const result = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value === null || value === undefined || value === "") continue;
    result[key] = value;
  }
  return result;
}

function normalizeDocumentText(html) {
  const decoded = decodeHtmlEntities(String(html || ""));
  return normalizeWhitespace(decoded.replace(/<[^>]+>/g, " "));
}

function decodeHtmlEntities(input) {
  const named = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
  };
  return String(input || "")
    .replace(/&([a-z]+);/gi, (_, name) => named[name.toLowerCase()] ?? `&${name};`)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function normalizeWhitespace(input) {
  return String(input || "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function extractFirst(text, patterns) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (match && match[1]) return normalizeWhitespace(match[1]);
  }
  return "";
}

function extractPercent(text, patterns) {
  const value = extractFirst(text, patterns);
  if (!value) return null;
  const num = Number(String(value).replace(/[^\d.]+/g, ""));
  return Number.isFinite(num) ? roundMetric(num) : null;
}

function extractNumber(text, patterns) {
  const value = extractFirst(text, patterns);
  if (!value) return null;
  const num = Number(String(value).replace(/[^\d.]+/g, ""));
  return Number.isFinite(num) ? roundMetric(num) : null;
}

function extractInteger(text, patterns) {
  const value = extractFirst(text, patterns);
  if (!value) return null;
  const num = parseInt(String(value).replace(/[^\d]+/g, ""), 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function normalizeHttpUrl(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function normalizeNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? roundMetric(num) : null;
}

function normalizeNullableInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = parseInt(String(value), 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function normalizeShortText(value, maxLen) {
  const text = normalizeWhitespace(value);
  if (!text) return "";
  return text.slice(0, maxLen);
}

function normalizeIsoDateTime(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const parsed = new Date(text);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : "";
}

function normalizeRawJson(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "object" || Array.isArray(value)) return value;
  if (["string", "number", "boolean"].includes(typeof value)) return value;
  return null;
}

function normalizeStatus(value) {
  const text = String(value || "active").trim().toLowerCase();
  return text ? text.slice(0, 32) : "active";
}

function normalizeScore(value) {
  const num = parseInt(String(value || ""), 10);
  if (!Number.isFinite(num) || num < 1 || num > 5) return 0;
  return num;
}

function roundMetric(value) {
  return Math.round(Number(value) * 10) / 10;
}
