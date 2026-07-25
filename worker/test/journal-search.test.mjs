import test from "node:test";
import assert from "node:assert/strict";

import worker from "../src/index.js";
import {
  buildJournalSearchMatchQuery,
  normalizeJournalSearchItem,
  queryJournalDetail,
  queryJournalSearch,
  upsertJournalSearchItems,
} from "../src/journal-search.js";

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

  async all() {
    return { results: this.db.executeAll(this.sql, this.args) };
  }

  async first() {
    return this.db.executeFirst(this.sql, this.args);
  }

  async run() {
    this.db.executeRun(this.sql, this.args);
    return { success: true };
  }
}

class FakeD1Database {
  constructor(seed = {}) {
    this.searchRows = Array.isArray(seed.searchRows) ? seed.searchRows.map((item) => ({ ...item })) : [];
    this.ftsRows = Array.isArray(seed.ftsRows) ? seed.ftsRows.map((item) => ({ ...item })) : this.searchRows;
    this.detailRows = Array.isArray(seed.detailRows) ? seed.detailRows.map((item) => ({ ...item })) : [];
    this.allCalls = [];
    this.firstCalls = [];
    this.runCalls = [];
    this.batchCalls = [];
  }

  prepare(sql) {
    return new FakeD1Statement(this, sql);
  }

  async batch(statements) {
    this.batchCalls.push(statements);
    for (const statement of statements) {
      await statement.run();
    }
    return statements.map(() => ({ success: true }));
  }

  executeAll(sql, args) {
    this.allCalls.push({ sql, args });
    if (sql.includes("FROM journal_search js") && sql.includes("LOWER(js.abbrs)")) {
      const pattern = String(args[0] || "").replace(/%/g, "").trim().toLowerCase();
      return this.searchRows
        .filter((row) => (` ${String(row.abbrs || "").toLowerCase()} `).includes(` ${pattern} `))
        .slice(0, Number(args.at(-1) || 12));
    }
    if (!sql.includes("journal_search_fts")) {
      throw new Error(`unexpected search SQL: ${sql}`);
    }
    return this.ftsRows.slice(0, Number(args.at(-1) || 12));
  }

  executeRun(sql, args) {
    this.runCalls.push({ sql, args });
  }

  executeFirst(sql, args) {
    this.firstCalls.push({ sql, args });
    if (sql.includes("journal_search")) {
      const id = Number(args[0]);
      return this.searchRows.find((row) => Number(row.id) === id) || null;
    }
    if (!sql.includes("journal_detail")) {
      throw new Error(`unexpected detail SQL: ${sql}`);
    }
    const id = Number(args[0]);
    return this.detailRows.find((row) => Number(row.id) === id) || null;
  }
}

test("buildJournalSearchMatchQuery tokenizes user text into safe FTS prefix terms", () => {
  assert.equal(buildJournalSearchMatchQuery("Nature Reviews Microbiology"), "nature* reviews* microbiology*");
  assert.equal(buildJournalSearchMatchQuery("1740-1526"), "1740* 1526*");
  assert.equal(buildJournalSearchMatchQuery("\"cancer\" OR 1=1"), "cancer* or* 1*");
  assert.equal(buildJournalSearchMatchQuery("中科院 1区"), "中科院* 1区*");
});

test("normalizeJournalSearchItem keeps only compact public fields", () => {
  const item = normalizeJournalSearchItem({
    id: "9",
    title: "NATURE REVIEWS MICROBIOLOGY",
    issn: "1740-1526",
    eissn: "1740-1534",
    cn_number: "",
    if_2023: "103.3",
    if_year: "2024",
    jcr_quartile: "Q1",
    cas_2025: "1区",
    is_top: 1,
    hq_level: "T2",
    pku_core: 0,
    cssci_type: "",
    cscd_type: "",
    warning_latest: "",
    xuankan_2026: "1区",
    xuankan_warning: 0,
    ni_journal: 0,
    ni_new: 1,
    tags_json: '["1区","Q1","SCIE"]',
    rank: -9.8,
    private_note: "drop me",
  });

  assert.deepEqual(Object.keys(item), [
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
    "tags",
    "score",
  ]);
  assert.equal(item.id, 9);
  assert.equal(item.if_2023, 103.3);
  assert.equal(item.is_top, true);
  assert.deepEqual(item.tags, ["1区", "Q1", "SCIE"]);
  assert.equal(item.private_note, undefined);
});

test("normalizeJournalSearchRecord derives a quality score for broad-query ranking", async () => {
  const { normalizeJournalSearchRecord } = await import("../src/journal-search.js");
  const normalized = normalizeJournalSearchRecord({
    id: 1,
    title: "CA-A CANCER JOURNAL FOR CLINICIANS",
    issn: "0007-9235",
    if_2023: 232.4,
    jcr_quartile: "Q1",
    cas_2025: "1区",
    tags: ["SCIE"],
  });

  assert.equal(normalized.ok, true);
  assert.equal(normalized.record.quality_score, 99.05);
  assert.match(normalized.record.search_text, /cacjfc/);
  assert.match(normalized.record.search_text, /00079235/);
});

test("normalizeJournalSearchRecord indexes explicit journal abbreviations", async () => {
  const { normalizeJournalSearchRecord } = await import("../src/journal-search.js");
  const normalized = normalizeJournalSearchRecord({
    id: 19471,
    title: "Transactions in GIS",
    issn: "1361-1682",
    eissn: "1467-9671",
    abbreviations: ["T GIS"],
    tags: ["SSCI"],
  });

  assert.equal(normalized.ok, true);
  assert.match(normalized.record.abbrs, /\btgis\b/);
  assert.match(normalized.record.search_text, /T GIS/);
  assert.match(normalized.record.search_text, /\btgis\b/);
});

test("queryJournalSearch reads D1 FTS and returns normalized top-n results", async () => {
  const db = new FakeD1Database({
    searchRows: [
      {
        id: 9,
        title: "NATURE REVIEWS MICROBIOLOGY",
        issn: "1740-1526",
        eissn: "1740-1534",
        tags_json: '["1区","Q1"]',
        rank: -10.5,
      },
      {
        id: 1,
        title: "CA-A CANCER JOURNAL FOR CLINICIANS",
        issn: "0007-9235",
        eissn: "1542-4863",
        tags_json: '["1区","Q1"]',
        rank: -1.2,
      },
    ],
  });

  const result = await queryJournalSearch({ DB: db }, { query: "nature reviews", limit: 1 });

  assert.equal(result.query, "nature reviews");
  assert.equal(result.limit, 1);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, 9);
  assert.equal(db.allCalls.length, 1);
  assert.match(db.allCalls[0].sql, /journal_search_fts/);
  assert.match(db.allCalls[0].sql, /quality_score DESC/);
  assert.equal(db.allCalls[0].args[0], "nature* reviews*");
  assert.notEqual(db.allCalls[0].args[4], "");
  assert.notEqual(db.allCalls[0].args[5], "");
});

test("queryJournalSearch short-circuits on exact abbreviation rows", async () => {
  const db = new FakeD1Database({
    searchRows: [
      {
        id: 19471,
        title: "Transactions in GIS",
        issn: "1361-1682",
        eissn: "1467-9671",
        abbrs: "tig tg tgis",
        if_2023: 2.4,
        if_year: "2025",
        jcr_quartile: "Q2",
        tags_json: '["SSCI","Q2"]',
      },
    ],
    ftsRows: [],
  });

  const result = await queryJournalSearch({ DB: db }, { query: "tgis", limit: 5 });

  assert.equal(result.ok, true);
  assert.equal(result.source, "journal-search-abbr-exact");
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].title, "Transactions in GIS");
  assert.equal(db.allCalls.length, 1);
  assert.match(db.allCalls[0].sql, /LOWER\(js\.abbrs\)/);
});

test("queryJournalSearch ignores filter-only quality tokens", async () => {
  const db = new FakeD1Database({
    searchRows: [{ id: 1, title: "NATURE", tags_json: '["Q1"]' }],
  });

  const result = await queryJournalSearch({ DB: db }, { query: "Q1", limit: 5 });

  assert.equal(result.ok, true);
  assert.equal(result.source, "journal-search-filter-token");
  assert.deepEqual(result.items, []);
  assert.equal(db.allCalls.length, 0);
});

test("worker journal search route returns JSON and avoids DB work for blank queries", async () => {
  const db = new FakeD1Database();
  const request = new Request("https://www.scansci.com/api/journals/search?q=%20%20&limit=20", {
    headers: { Origin: "https://journal.scansci.com" },
  });

  const response = await worker.fetch(request, {
    DB: db,
    CORS_ORIGINS: "https://journal.scansci.com",
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.deepEqual(payload.items, []);
  assert.equal(db.allCalls.length, 0);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://journal.scansci.com");
});

test("journal detail route returns one journal without exposing a list endpoint", async () => {
  const db = new FakeD1Database({
    detailRows: [
      {
        id: 18,
        detail_json: JSON.stringify({ id: 18, title: "NATURE", issn: "0028-0836" }),
        related_json: JSON.stringify([{ id: 19, title: "SCIENCE" }]),
        updated_at: "2026-06-23T00:00:00.000Z",
      },
    ],
  });

  const direct = await queryJournalDetail({ DB: db }, { id: 18 });
  assert.equal(direct.ok, true);
  assert.equal(direct.journal.title, "NATURE");
  assert.equal(direct.related.length, 1);

  const response = await worker.fetch(new Request("https://www.scansci.com/api/journals/detail?id=18"), {
    DB: db,
    CORS_ORIGINS: "https://journal.scansci.com",
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.journal.issn, "0028-0836");
  assert.equal(db.firstCalls.length, 2);
});

test("journal detail falls back to public search row when detail row is missing", async () => {
  const db = new FakeD1Database({
    searchRows: [
      {
        id: 385,
        title: "Environmental Science and Ecotechnology",
        issn: "2666-4984",
        eissn: "2666-4984",
        if_2023: 14.3,
        if_year: "2025",
        jcr_quartile: "Q1",
        cas_2025: "1区",
        is_top: 1,
        tags_json: '["1区","Q1","SCIE"]',
      },
    ],
  });

  const direct = await queryJournalDetail({ DB: db }, { id: 385 });
  assert.equal(direct.ok, true);
  assert.equal(direct.journal.title, "Environmental Science and Ecotechnology");
  assert.equal(direct.related.length, 0);
  assert.equal(direct.source, "journal-detail-search-fallback");

  const response = await worker.fetch(new Request("https://www.scansci.com/api/journals/detail?id=385"), {
    DB: db,
    CORS_ORIGINS: "https://journal.scansci.com",
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.journal.issn, "2666-4984");
  assert.equal(payload.source, "journal-detail-search-fallback");
});

test("journal search admin upsert batches D1 writes", async () => {
  const db = new FakeD1Database();
  const result = await upsertJournalSearchItems({ DB: db }, [
    {
      id: 1,
      title: "NATURE",
      issn: "0028-0836",
      eissn: "1476-4687",
      if_2023: 50,
      jcr_quartile: "Q1",
      tags: ["SCIE"],
    },
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.success, 1);
  assert.equal(db.batchCalls.length, 1);
  assert.equal(db.batchCalls[0].length, 3);
});
