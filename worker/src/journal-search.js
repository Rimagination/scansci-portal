const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 20;
const MAX_QUERY_CHARS = 120;

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
  const abbrs = buildTitleAbbrVariants(publicItem.title);
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
  const rawCompactQuery = lowerQuery.replace(/[^0-9x]/g, "");
  const compactQuery = /^[0-9x]{4,}$/i.test(rawCompactQuery) ? rawCompactQuery : "__no_identifier_match__";
  const prefixQuery = `${lowerQuery.replace(/[%_]/g, "")}%`;
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
        prefixQuery,
        prefixQuery,
        prefixQuery,
        prefixQuery,
        limit
      )
      .all();
    const items = (Array.isArray(results) ? results : []).map(normalizeJournalSearchItem);
    return { ok: true, query, limit, items, source: "journal-search-d1" };
  } catch (error) {
    console.warn("Journal search query failed", error);
    return { ok: false, query, limit, items: [], source: "journal-search-error", error: "search_failed" };
  }
}

export async function upsertJournalSearchItems(env, items) {
  if (!env?.DB?.prepare) return { ok: false, error: "search_unavailable" };
  if (!Array.isArray(items) || !items.length) return { ok: false, error: "missing_items" };
  if (items.length > 100) return { ok: false, error: "too_many_items", max: 100 };

  let success = 0;
  const failures = [];
  for (const item of items) {
    const normalized = normalizeJournalSearchRecord(item);
    if (!normalized.ok) {
      failures.push({ id: item?.id ?? null, title: String(item?.title || ""), error: normalized.error });
      continue;
    }
    const result = await upsertJournalSearchRecord(env, normalized.record);
    if (result.ok) {
      success += 1;
    } else {
      failures.push({ id: normalized.record.id, title: normalized.record.title, error: result.error });
    }
  }

  return {
    ok: failures.length === 0,
    success,
    failed: failures.length,
    failures: failures.slice(0, 20),
  };
}

async function upsertJournalSearchRecord(env, record) {
  const nowIso = new Date().toISOString();
  try {
    await env.DB.prepare(
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
    )
      .bind(
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
      )
      .run();

    await env.DB.prepare("DELETE FROM journal_search_fts WHERE rowid = ?").bind(record.id).run();
    await env.DB.prepare(
      `INSERT INTO journal_search_fts(rowid, title, issn, eissn, cn_number, tags, search_text)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(record.id, record.title, record.issn, record.eissn, record.cn_number, record.tags.join(" "), record.search_text)
      .run();
    return { ok: true };
  } catch (error) {
    console.warn("Journal search upsert failed", error);
    return { ok: false, error: "journal_search_upsert_failed" };
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

function buildTitleAbbrVariants(title) {
  const stopwords = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to", "with"]);
  const words = String(title || "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (!words.length) return [];

  const variants = new Set();
  const allInitials = words.map((word) => word[0]).join("").toLowerCase();
  if (allInitials.length >= 2) variants.add(allInitials);

  const coreWords = words.filter((word) => !stopwords.has(word.toLowerCase()));
  const coreInitials = coreWords.map((word) => word[0]).join("").toLowerCase();
  if (coreInitials.length >= 2) variants.add(coreInitials);

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
