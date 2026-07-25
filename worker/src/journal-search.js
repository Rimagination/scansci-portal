const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 20;
const MAX_QUERY_CHARS = 120;
const MAX_DETAIL_BATCH_SIZE = 50;

const PUBLIC_COLUMNS = [
  "id",
  "title",
  "issn",
  "eissn",
  "cn_number",
  "if_2023",
  "if_year",
  "jcr_quartile",
  "cas_2025",
  "is_top",
  "hq_level",
  "pku_core",
  "cssci_type",
  "cscd_type",
  "warning_latest",
  "xuankan_2026",
  "xuankan_warning",
  "ni_journal",
  "ni_new",
  "tags_json",
];

const SELECT_PUBLIC_COLUMNS = PUBLIC_COLUMNS.map((name) => `js.${name}`).join(", ");

export function buildJournalSearchMatchQuery(rawQuery) {
  const tokens = String(rawQuery || "")
    .toLowerCase()
    .slice(0, MAX_QUERY_CHARS)
    .match(/[\p{L}\p{N}]+/gu);
  if (!tokens?.length) return "";
  return [...new Set(tokens)]
    .slice(0, 8)
    .map((token) => `${token}*`)
    .join(" ");
}

export function normalizeJournalSearchLimit(rawLimit) {
  const parsed = Number.parseInt(String(rawLimit ?? ""), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, parsed));
}

export function normalizeJournalSearchQuery(rawQuery) {
  return String(rawQuery || "").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_CHARS);
}

export function normalizeJournalSearchItem(row) {
  const tags = parseTags(row?.tags_json ?? row?.tags);
  return {
    id: toInteger(row?.id),
    title: toStringValue(row?.title),
    issn: toStringValue(row?.issn),
    eissn: toStringValue(row?.eissn),
    cn_number: toStringValue(row?.cn_number),
    if_2023: toNullableNumber(row?.if_2023),
    if_year: toStringValue(row?.if_year),
    jcr_quartile: toStringValue(row?.jcr_quartile),
    cas_2025: toStringValue(row?.cas_2025),
    is_top: toNullableBoolean(row?.is_top),
    hq_level: toStringValue(row?.hq_level),
    pku_core: toBoolean(row?.pku_core),
    cssci_type: toStringValue(row?.cssci_type),
    cscd_type: toStringValue(row?.cscd_type),
    warning_latest: toStringValue(row?.warning_latest),
    xuankan_2026: toStringValue(row?.xuankan_2026),
    xuankan_warning: toBoolean(row?.xuankan_warning),
    ni_journal: toNullableBoolean(row?.ni_journal),
    ni_new: toNullableBoolean(row?.ni_new),
    tags,
    score: toNullableNumber(row?.score ?? row?.rank) ?? 0,
  };
}

export function normalizeJournalSearchRecord(input) {
  const publicItem = normalizeJournalSearchItem(input);
  const tags = Array.isArray(publicItem.tags) ? publicItem.tags : [];
  const explicitAbbreviations = parseAbbreviations(input?.abbreviations ?? input?.abbreviation ?? input?.abbrJournal);
  const abbrs = buildJournalAbbrVariants(publicItem.title, explicitAbbreviations);
  const searchText = [
    publicItem.title,
    publicItem.issn,
    compactIdentifier(publicItem.issn),
    publicItem.eissn,
    compactIdentifier(publicItem.eissn),
    publicItem.cn_number,
    compactIdentifier(publicItem.cn_number),
    publicItem.cas_2025,
    publicItem.hq_level,
    publicItem.cssci_type,
    publicItem.cscd_type,
    publicItem.warning_latest,
    publicItem.xuankan_2026,
    tags.join(" "),
    explicitAbbreviations.join(" "),
    abbrs.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  if (!publicItem.id || !publicItem.title) {
    return { ok: false, error: "missing_id_or_title" };
  }

  return {
    ok: true,
    record: {
      ...publicItem,
      tags_json: JSON.stringify(tags),
      abbrs: abbrs.join(" "),
      quality_score: computeJournalQualityScore(publicItem),
      search_text: searchText,
    },
  };
}

export async function queryJournalSearch(env, options = {}) {
  const query = normalizeJournalSearchQuery(options.query);
  const limit = normalizeJournalSearchLimit(options.limit);
  const minIf = toNullableNumber(options.minIF ?? options.min_if);
  if (!query) {
    return { ok: true, query, limit, items: [], source: "journal-search-empty" };
  }
  if (!env?.DB?.prepare) {
    return { ok: false, query, limit, items: [], source: "journal-search-unavailable", error: "search_unavailable" };
  }

  const matchQuery = buildJournalSearchMatchQuery(query);
  if (!matchQuery) {
    return { ok: true, query, limit, items: [], source: "journal-search-empty" };
  }

  const lowerQuery = query.toLowerCase();
  if (isJournalSearchFilterOnlyQuery(query)) {
    return { ok: true, query, limit, items: [], source: "journal-search-filter-token" };
  }

  const rawCompactQuery = lowerQuery.replace(/[^0-9x]/g, "");
  const compactQuery = /^[0-9x]{4,}$/i.test(rawCompactQuery) ? rawCompactQuery : "__no_identifier_match__";
  const abbrQuery = normalizeAbbrValue(query);
  const abbrExactPattern = /^[a-z0-9]{2,10}$/.test(abbrQuery) ? `% ${abbrQuery} %` : "__no_abbr_match__";
  const prefixQuery = `${lowerQuery.replace(/[%_]/g, "")}%`;
  const exactAbbrItems = await queryJournalSearchExactAbbr(env, abbrExactPattern, minIf, limit);
  if (exactAbbrItems.length) {
    return { ok: true, query, limit, items: exactAbbrItems.slice(0, limit), source: "journal-search-abbr-exact" };
  }
  const sql = `
    SELECT ${SELECT_PUBLIC_COLUMNS},
      bm25(journal_search_fts, 8.0, 5.0, 5.0, 5.0, 2.0, 1.0) AS rank
    FROM journal_search_fts
    JOIN journal_search js ON js.id = journal_search_fts.rowid
    WHERE journal_search_fts MATCH ?
      AND (? IS NULL OR js.if_2023 >= ?)
    ORDER BY
      CASE
        WHEN LOWER(js.title) = ? THEN 0
        WHEN REPLACE(LOWER(js.issn), '-', '') = ? THEN 0
        WHEN REPLACE(LOWER(js.eissn), '-', '') = ? THEN 0
        WHEN (' ' || LOWER(js.abbrs) || ' ') LIKE ? THEN 0
        WHEN LOWER(js.title) LIKE ? THEN 1
        WHEN LOWER(js.issn) LIKE ? THEN 1
        WHEN LOWER(js.eissn) LIKE ? THEN 1
        WHEN LOWER(js.cn_number) LIKE ? THEN 1
        ELSE 2
      END,
      js.quality_score DESC,
      rank,
      COALESCE(js.if_2023, -1) DESC,
      js.title ASC
    LIMIT ?
  `;

  try {
    const { results } = await env.DB.prepare(sql)
      .bind(
        matchQuery,
        minIf,
        minIf,
        lowerQuery,
        compactQuery,
        compactQuery,
        abbrExactPattern,
        prefixQuery,
        prefixQuery,
        prefixQuery,
        prefixQuery,
        Math.min(limit * 2, MAX_LIMIT * 2)
      )
      .all();
    const ftsItems = (Array.isArray(results) ? results : []).map(normalizeJournalSearchItem);
    const items = mergeJournalSearchItems([], ftsItems, limit);
    return { ok: true, query, limit, items, source: "journal-search-d1" };
  } catch (error) {
    console.warn("Journal search query failed", error);
    return { ok: false, query, limit, items: [], source: "journal-search-error", error: "search_failed" };
  }
}

async function queryJournalSearchExactAbbr(env, abbrExactPattern, minIf, limit) {
  if (!abbrExactPattern || abbrExactPattern === "__no_abbr_match__") return [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT ${SELECT_PUBLIC_COLUMNS}, 0 AS rank
       FROM journal_search js
       WHERE (' ' || LOWER(js.abbrs) || ' ') LIKE ?
         AND (? IS NULL OR js.if_2023 >= ?)
       ORDER BY js.quality_score DESC, COALESCE(js.if_2023, -1) DESC, js.title ASC
       LIMIT ?`
    )
      .bind(abbrExactPattern, minIf, minIf, limit)
      .all();
    return (Array.isArray(results) ? results : []).map(normalizeJournalSearchItem);
  } catch (error) {
    console.warn("Journal exact abbreviation query failed", error);
    return [];
  }
}

function mergeJournalSearchItems(primary, secondary, limit) {
  const seen = new Set();
  const out = [];
  for (const item of [...primary, ...secondary]) {
    const id = toInteger(item?.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

export async function queryJournalDetail(env, options = {}) {
  const id = toInteger(options.id);
  if (!id) {
    return { ok: false, id, source: "journal-detail-invalid", error: "invalid_id" };
  }
  if (!env?.DB?.prepare) {
    return { ok: false, id, source: "journal-detail-unavailable", error: "detail_unavailable" };
  }

  try {
    const row = await env.DB.prepare(
      `SELECT id, detail_json, related_json, updated_at
       FROM journal_detail
       WHERE id = ?`
    )
      .bind(id)
      .first();
    if (!row) {
      const fallback = await queryJournalDetailSearchFallback(env, id);
      if (fallback) return fallback;
      return { ok: false, id, source: "journal-detail-d1", error: "journal_not_found" };
    }
    const journal = safeJsonParse(row.detail_json, null);
    const related = safeJsonParse(row.related_json, []);
    if (!journal || typeof journal !== "object") {
      return { ok: false, id, source: "journal-detail-d1", error: "invalid_detail_payload" };
    }
    return {
      ok: true,
      id,
      journal,
      related: Array.isArray(related) ? related : [],
      updated_at: toStringValue(row.updated_at),
      source: "journal-detail-d1",
    };
  } catch (error) {
    console.warn("Journal detail query failed", error);
    return { ok: false, id, source: "journal-detail-error", error: "detail_failed" };
  }
}

async function queryJournalDetailSearchFallback(env, id) {
  try {
    const row = await env.DB.prepare(
      `SELECT ${SELECT_PUBLIC_COLUMNS}
       FROM journal_search js
       WHERE js.id = ?
       LIMIT 1`
    )
      .bind(id)
      .first();
    if (!row) return null;
    return {
      ok: true,
      id,
      journal: normalizeJournalSearchItem(row),
      related: [],
      updated_at: toStringValue(row.updated_at),
      source: "journal-detail-search-fallback",
    };
  } catch (error) {
    console.warn("Journal detail search fallback failed", error);
    return null;
  }
}

export async function upsertJournalSearchItems(env, items) {
  if (!env?.DB?.prepare) return { ok: false, error: "search_unavailable" };
  if (!Array.isArray(items) || !items.length) return { ok: false, error: "missing_items" };
  if (items.length > 100) return { ok: false, error: "too_many_items", max: 100 };

  const failures = [];
  const records = [];
  for (const item of items) {
    const normalized = normalizeJournalSearchRecord(item);
    if (!normalized.ok) {
      failures.push({ id: item?.id ?? null, title: String(item?.title || ""), error: normalized.error });
      continue;
    }
    records.push(normalized.record);
  }

  if (records.length) {
    const nowIso = new Date().toISOString();
    const statements = records.flatMap((record) => buildJournalSearchStatements(env, record, nowIso));
    const result = await runD1Statements(env, statements);
    if (!result.ok) {
      for (const record of records) {
        failures.push({ id: record.id, title: record.title, error: result.error });
      }
    }
  }

  return {
    ok: failures.length === 0,
    success: records.length - Math.max(0, failures.length - (items.length - records.length)),
    failed: failures.length,
    failures: failures.slice(0, 20),
  };
}

export async function upsertJournalDetailItems(env, items) {
  if (!env?.DB?.prepare) return { ok: false, error: "detail_unavailable" };
  if (!Array.isArray(items) || !items.length) return { ok: false, error: "missing_items" };
  if (items.length > MAX_DETAIL_BATCH_SIZE) return { ok: false, error: "too_many_items", max: MAX_DETAIL_BATCH_SIZE };

  const failures = [];
  const records = [];
  for (const item of items) {
    const normalized = normalizeJournalDetailRecord(item);
    if (!normalized.ok) {
      failures.push({ id: item?.id ?? item?.journal?.id ?? null, error: normalized.error });
      continue;
    }
    records.push(normalized.record);
  }

  if (records.length) {
    const nowIso = new Date().toISOString();
    const statements = records.map((record) => buildJournalDetailStatement(env, record, nowIso));
    const result = await runD1Statements(env, statements);
    if (!result.ok) {
      for (const record of records) {
        failures.push({ id: record.id, error: result.error });
      }
    }
  }

  return {
    ok: failures.length === 0,
    success: records.length - Math.max(0, failures.length - (items.length - records.length)),
    failed: failures.length,
    failures: failures.slice(0, 20),
  };
}

export function normalizeJournalDetailRecord(input) {
  const journal = input?.journal && typeof input.journal === "object" ? input.journal : input;
  const id = toInteger(journal?.id);
  if (!id || !journal?.title) {
    return { ok: false, error: "missing_id_or_title" };
  }
  const related = Array.isArray(input?.related) ? input.related : [];
  return {
    ok: true,
    record: {
      id,
      detail_json: JSON.stringify(journal),
      related_json: JSON.stringify(related.slice(0, 24)),
    },
  };
}

function buildJournalDetailStatement(env, record, nowIso) {
  return env.DB.prepare(
    `INSERT INTO journal_detail (id, detail_json, related_json, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       detail_json = excluded.detail_json,
       related_json = excluded.related_json,
       updated_at = excluded.updated_at`
  ).bind(record.id, record.detail_json, record.related_json, nowIso);
}

function buildJournalSearchStatements(env, record, nowIso) {
  return [
    env.DB.prepare(
      `INSERT INTO journal_search
        (id, title, issn, eissn, cn_number, if_2023, if_year, jcr_quartile, cas_2025, is_top,
         hq_level, pku_core, cssci_type, cscd_type, warning_latest, xuankan_2026, xuankan_warning,
         ni_journal, ni_new, tags_json, abbrs, quality_score, search_text, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         issn = excluded.issn,
         eissn = excluded.eissn,
         cn_number = excluded.cn_number,
         if_2023 = excluded.if_2023,
         if_year = excluded.if_year,
         jcr_quartile = excluded.jcr_quartile,
         cas_2025 = excluded.cas_2025,
         is_top = excluded.is_top,
         hq_level = excluded.hq_level,
         pku_core = excluded.pku_core,
         cssci_type = excluded.cssci_type,
         cscd_type = excluded.cscd_type,
         warning_latest = excluded.warning_latest,
         xuankan_2026 = excluded.xuankan_2026,
         xuankan_warning = excluded.xuankan_warning,
         ni_journal = excluded.ni_journal,
         ni_new = excluded.ni_new,
         tags_json = excluded.tags_json,
         abbrs = excluded.abbrs,
         quality_score = excluded.quality_score,
         search_text = excluded.search_text,
         updated_at = excluded.updated_at`
    ).bind(
      record.id,
      record.title,
      record.issn,
      record.eissn,
      record.cn_number,
      record.if_2023,
      record.if_year,
      record.jcr_quartile,
      record.cas_2025,
      booleanToInt(record.is_top),
      record.hq_level,
      booleanToInt(record.pku_core),
      record.cssci_type,
      record.cscd_type,
      record.warning_latest,
      record.xuankan_2026,
      booleanToInt(record.xuankan_warning),
      nullableBooleanToInt(record.ni_journal),
      nullableBooleanToInt(record.ni_new),
      record.tags_json,
      record.abbrs,
      record.quality_score,
      record.search_text,
      nowIso
    ),
    env.DB.prepare("DELETE FROM journal_search_fts WHERE rowid = ?").bind(record.id),
    env.DB.prepare(
      `INSERT INTO journal_search_fts(rowid, title, issn, eissn, cn_number, tags, search_text)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(record.id, record.title, record.issn, record.eissn, record.cn_number, record.tags.join(" "), record.search_text),
  ];
}

async function runD1Statements(env, statements) {
  if (!statements.length) return { ok: true };
  try {
    if (typeof env.DB.batch === "function") {
      await env.DB.batch(statements);
    } else {
      for (const statement of statements) {
        await statement.run();
      }
    }
    return { ok: true };
  } catch (error) {
    console.warn("Journal D1 batch failed", error);
    return { ok: false, error: "journal_d1_batch_failed" };
  }
}

function computeJournalQualityScore(row) {
  let score = 0;
  const impact = toNullableNumber(row?.if_2023);
  if (impact !== null) score += Math.min(80, impact / 8);
  if (row?.jcr_quartile === "Q1") score += 40;
  if (String(row?.cas_2025 || "").trim() === "1区") score += 30;
  return Math.round(score * 1000) / 1000;
}

function compactIdentifier(value) {
  return String(value || "").replace(/[^0-9Xx]/g, "").toUpperCase();
}

function normalizeAbbrValue(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function isJournalSearchFilterOnlyQuery(query) {
  const normalized = String(query || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  const compact = normalizeAbbrValue(query);
  if (!normalized && !compact) return false;
  if (/^q[1-4]$/.test(compact)) return true;
  if (/^[1-4][区區]$/.test(normalized)) return true;
  if (/^新锐[1-4][区區]$/.test(normalized)) return true;
  if (/^(中科院|中国科学院|中科院top|中国科学院top)$/.test(normalized)) return true;
  if (/^(cas|top|hq|t[1-4]|scie|ssci|esci|ahci)$/.test(compact)) return true;
  if (/^(高质量|高质量目录)$/.test(normalized)) return true;
  return false;
}

function parseAbbreviations(raw) {
  const values = Array.isArray(raw)
    ? raw
    : String(raw || "")
        .split(/[;,|]+/)
        .filter(Boolean);
  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

function buildJournalAbbrVariants(title, explicitAbbreviations = []) {
  const variants = new Set(buildTitleAbbrVariants(title));
  for (const abbreviation of explicitAbbreviations) {
    const normalized = normalizeAbbrValue(abbreviation);
    if (normalized.length >= 2) variants.add(normalized);
  }
  return [...variants];
}

function buildTitleAbbrVariants(title) {
  const stopwords = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to", "with"]);
  const titleText = String(title || "");
  const words = String(title || "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (!words.length) return [];

  const variants = new Set();
  const hasLowercase = /[a-z]/.test(titleText);
  const allInitials = words.map((word) => word[0]).join("").toLowerCase();
  if (allInitials.length >= 2) variants.add(allInitials);

  const coreWords = words.filter((word) => !stopwords.has(word.toLowerCase()));
  const coreInitials = coreWords.map((word) => word[0]).join("").toLowerCase();
  if (coreInitials.length >= 2) variants.add(coreInitials);
  const coreAcronymAware = coreWords
    .map((word) => (hasLowercase && /^[A-Z0-9]{2,6}$/.test(word) ? word : word[0]))
    .join("")
    .toLowerCase();
  if (coreAcronymAware.length >= 2) variants.add(coreAcronymAware);

  if (coreWords.length >= 2) {
    variants.add((coreWords[0][0] + coreWords[1][0]).toLowerCase());
  }

  return [...variants];
}

function parseTags(raw) {
  if (Array.isArray(raw)) return raw.map((item) => String(item || "").trim()).filter(Boolean);
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item || "").trim()).filter(Boolean);
  } catch {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function safeJsonParse(raw, fallback) {
  if (raw === null || raw === undefined || raw === "") return fallback;
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function toStringValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function toInteger(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value) {
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
}

function toNullableBoolean(value) {
  if (value === null || value === undefined || value === "") return null;
  return toBoolean(value);
}

function booleanToInt(value) {
  return toBoolean(value) ? 1 : 0;
}

function nullableBooleanToInt(value) {
  const parsed = toNullableBoolean(value);
  return parsed === null ? null : parsed ? 1 : 0;
}
