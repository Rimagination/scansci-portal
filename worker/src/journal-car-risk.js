const JCAR_LIST_ENDPOINT = "https://www.jcarindex.com/ifs/public/jcar/getJournalList";
const JCAR_SOURCE_BASE = "https://www.jcarindex.com/#/view";
const DEFAULT_PARAMS = {
  page: "1",
  pageSize: "5",
  sortKey: "viewNum",
  sortDirection: "desc",
};

export function buildJcarLookupPlan(input = {}) {
  const plan = [];
  const addIssnLookup = (value) => {
    const issn = normalizeIssn(value);
    if (!issn) return;
    plan.push({
      type: "issn",
      params: { ...DEFAULT_PARAMS, issn },
    });
  };

  addIssnLookup(input.issn);
  addIssnLookup(input.eissn);

  const title = normalizeTitleForQuery(input.title);
  if (title) {
    plan.push({
      type: "title",
      params: { ...DEFAULT_PARAMS, name: title },
    });
  }

  return plan;
}

export function normalizeJcarRiskRecord(record = {}) {
  const rank = normalizeRiskRank(record.sciRiskRank);
  const id = toNullableInteger(record.id);

  return {
    id,
    title: toStringValue(record.fullName || record.title || record.name),
    name: toStringValue(record.name),
    issn: toStringValue(record.issn),
    car_index: toNullableNumber(record.carIndex),
    car_index_last_year: toNullableNumber(record.carIndexLastYear),
    car_index_before_last_year: toNullableNumber(record.carIndexBeforeLastYear),
    car_index_growth_rate: toNullableNumber(record.carIndexGrowthRate),
    risk_rank: rank.value,
    risk_rank_label: rank.label,
    risk_rank_raw: toStringValue(record.sciRiskRank),
    risk_rank_last_year: normalizeRiskRank(record.sciRiskRankLastYear).value,
    current_year_article_count: toNullableInteger(record.curYearArticleCount),
    last_year_article_count: toNullableInteger(record.lastYearArticleCount),
    current_year_problem_article_count: toNullableInteger(record.curYearProblemArticleCount),
    last_year_problem_article_count: toNullableInteger(record.lastYearProblemArticleCount),
    impact_factor: toNullableNumber(record.ifs),
    cas_partition: toStringValue(record.partCas),
    jcr_quartile: formatJcrQuartile(record.partJcr),
    publisher: toStringValue(record.publisher),
    source_url: id === null ? "" : `${JCAR_SOURCE_BASE}?id=${encodeURIComponent(String(id))}`,
  };
}

export async function queryJcarRisk(input = {}, options = {}) {
  const fetcher = options.fetcher || fetch;
  const plan = buildJcarLookupPlan(input);
  if (!plan.length) {
    return { ok: true, item: null, source: "jcarindex", reason: "missing_query" };
  }

  let lastStatus = null;
  for (const lookup of plan) {
    const url = buildJcarListUrl(lookup.params);
    let response;
    try {
      response = await fetcher(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        cf: { cacheTtl: 21600, cacheEverything: false },
      });
    } catch (error) {
      console.warn("JCAR lookup failed", error);
      return { ok: false, item: null, source: "jcarindex", error: "jcar_fetch_failed" };
    }

    if (!response?.ok) {
      lastStatus = response?.status || null;
      continue;
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      console.warn("JCAR payload parse failed", error);
      return { ok: false, item: null, source: "jcarindex", error: "jcar_invalid_json" };
    }

    const records = Array.isArray(payload?.data?.records) ? payload.data.records : [];
    const match = pickBestJcarRecord(records, input, lookup);
    if (match) {
      return {
        ok: true,
        item: normalizeJcarRiskRecord(match),
        source: "jcarindex",
        lookup: lookup.type,
      };
    }
  }

  return {
    ok: true,
    item: null,
    source: "jcarindex",
    reason: "not_found",
    upstream_status: lastStatus,
  };
}

function buildJcarListUrl(params) {
  const url = new URL(JCAR_LIST_ENDPOINT);
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function pickBestJcarRecord(records, input, lookup) {
  if (!records.length) return null;

  const lookupIssn = normalizeIssn(lookup?.params?.issn);
  if (lookupIssn) {
    const exactIssn = records.find((record) => recordHasIssn(record, lookupIssn));
    if (exactIssn) return exactIssn;
  }

  const wantedIssns = [normalizeIssn(input.issn), normalizeIssn(input.eissn)].filter(Boolean);
  const matchingIssn = records.find((record) => wantedIssns.some((issn) => recordHasIssn(record, issn)));
  if (matchingIssn) return matchingIssn;

  const wantedTitle = normalizeTitleForMatch(input.title);
  if (wantedTitle) {
    const exactTitle = records.find((record) => normalizeTitleForMatch(record.fullName || record.title || record.name) === wantedTitle);
    if (exactTitle) return exactTitle;

    const containingTitle = records.find((record) => {
      const candidate = normalizeTitleForMatch(record.fullName || record.title || record.name);
      return candidate.includes(wantedTitle) || wantedTitle.includes(candidate);
    });
    if (containingTitle) return containingTitle;
  }

  return records[0];
}

function recordHasIssn(record, issn) {
  return [record?.issn, record?.eissn].some((value) => normalizeIssn(value) === issn);
}

function normalizeIssn(value) {
  const compact = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^0-9X]/g, "");
  if (compact.length !== 8) return "";
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}

function normalizeTitleForQuery(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

function normalizeTitleForMatch(value) {
  return normalizeTitleForQuery(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeRiskRank(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "high" || value.includes("high") || value.includes("\u9ad8")) {
    return { value: "high", label: "High" };
  }
  if (value === "medium" || value === "mid" || value.includes("medium") || value.includes("\u4e2d")) {
    return { value: "medium", label: "Medium" };
  }
  if (value === "low" || value.includes("low") || value.includes("\u4f4e")) {
    return { value: "low", label: "Low" };
  }
  return { value: "unknown", label: "Unknown" };
}

function formatJcrQuartile(value) {
  const parsed = toNullableInteger(value);
  if (parsed !== null && parsed >= 1 && parsed <= 4) return `Q${parsed}`;
  return toStringValue(value);
}

function toStringValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}
