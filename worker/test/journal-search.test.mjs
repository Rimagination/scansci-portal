import test from "node:test";
import assert from "node:assert/strict";

import worker from "../src/index.js";
import {
  buildJournalSearchMatchQuery,
  normalizeJournalSearchItem,
  queryJournalSearch,
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

  async run() {
    this.db.executeRun(this.sql, this.args);
    return { success: true };
  }
}

class FakeD1Database {
  constructor(seed = {}) {
    this.searchRows = Array.isArray(seed.searchRows) ? seed.searchRows.map((item) => ({ ...item })) : [];
    this.allCalls = [];
    this.runCalls = [];
  }

  prepare(sql) {
    return new FakeD1Statement(this, sql);
  }

  executeAll(sql, args) {
    this.allCalls.push({ sql, args });
    if (!sql.includes("journal_search_fts")) {
      throw new Error(`unexpected search SQL: ${sql}`);
    }
    return this.searchRows.slice(0, Number(args.at(-1) || 12));
  }

  executeRun(sql, args) {
    this.runCalls.push({ sql, args });
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
