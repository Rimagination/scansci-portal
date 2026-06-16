import test from "node:test";
import assert from "node:assert/strict";

import {
  buildJcarLookupPlan,
  normalizeJcarRiskRecord,
  queryJcarRisk,
} from "../src/journal-car-risk.js";
import { handleJournalCarRiskRequest } from "../src/journal-car-risk-worker.js";

test("buildJcarLookupPlan prefers ISSN lookup before title fallback", () => {
  const plan = buildJcarLookupPlan({
    issn: "20411723",
    eissn: "2041-1723",
    title: "Nature Communications",
  });

  assert.deepEqual(plan.map((item) => item.type), ["issn", "issn", "title"]);
  assert.equal(plan[0].params.issn, "2041-1723");
  assert.equal(plan[1].params.issn, "2041-1723");
  assert.equal(plan[2].params.name, "Nature Communications");
});

test("normalizeJcarRiskRecord keeps compact CAR fields and maps risk labels", () => {
  const item = normalizeJcarRiskRecord({
    id: 777,
    fullName: "Nature Communications",
    name: "NATURE COMMUNICATIONS",
    issn: "2041-1723",
    carIndex: "2.17",
    carIndexLastYear: "2.64",
    carIndexBeforeLastYear: "1.54",
    carIndexGrowthRate: "0.82",
    sciRiskRank: "\u4f4e",
    sciRiskRankLastYear: "\u4f4e",
    curYearArticleCount: "6373",
    lastYearArticleCount: "12635",
    curYearProblemArticleCount: "138",
    lastYearProblemArticleCount: "333",
    ifs: "15.7",
    partCas: "1",
    partJcr: "1",
    publisher: "Springer Nature",
    privateField: "drop me",
  });

  assert.deepEqual(Object.keys(item), [
    "id",
    "title",
    "name",
    "issn",
    "car_index",
    "car_index_last_year",
    "car_index_before_last_year",
    "car_index_growth_rate",
    "risk_rank",
    "risk_rank_label",
    "risk_rank_raw",
    "risk_rank_last_year",
    "current_year_article_count",
    "last_year_article_count",
    "current_year_problem_article_count",
    "last_year_problem_article_count",
    "impact_factor",
    "cas_partition",
    "jcr_quartile",
    "publisher",
    "source_url",
  ]);
  assert.equal(item.car_index, 2.17);
  assert.equal(item.risk_rank, "low");
  assert.equal(item.risk_rank_label, "Low");
  assert.equal(item.current_year_problem_article_count, 138);
  assert.equal(item.source_url, "https://www.jcarindex.com/#/view?id=777");
  assert.equal(item.privateField, undefined);
});

test("queryJcarRisk returns the matching JCAR record using an injected fetcher", async () => {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(String(url));
    return new Response(
      JSON.stringify({
        status: true,
        code: 200,
        data: {
          records: [
            {
              id: 777,
              fullName: "Nature Communications",
              name: "NATURE COMMUNICATIONS",
              issn: "2041-1723",
              carIndex: 2.17,
              sciRiskRank: "\u4f4e",
            },
          ],
          total: 1,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const result = await queryJcarRisk({ issn: "2041-1723", title: "Nature Communications" }, { fetcher });

  assert.equal(result.ok, true);
  assert.equal(result.item.title, "Nature Communications");
  assert.equal(result.item.risk_rank, "low");
  assert.equal(result.source, "jcarindex");
  assert.equal(calls.length, 1);
  assert.match(calls[0], /issn=2041-1723/);
});

test("handleJournalCarRiskRequest returns normalized CAR payload for the public route", async () => {
  const fetcher = async () =>
    new Response(
      JSON.stringify({
        status: true,
        data: {
          records: [
            {
              id: 493,
              fullName: "Journal of Cleaner Production",
              issn: "0959-6526",
              carIndex: 1.47,
              sciRiskRank: "\u4f4e",
            },
          ],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  const request = new Request(
    "https://www.scansci.com/api/journals/car-risk?issn=0959-6526&title=Journal%20of%20Cleaner%20Production",
    { headers: { Origin: "https://journal.scansci.com" } }
  );

  const response = await handleJournalCarRiskRequest(request, { fetcher });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://journal.scansci.com");
  assert.equal(payload.ok, true);
  assert.equal(payload.item.title, "Journal of Cleaner Production");
  assert.equal(payload.item.risk_rank, "low");
  assert.equal(payload.source, "jcarindex");
});

test("handleJournalCarRiskRequest serves repeated lookups from cache", async () => {
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return new Response(
      JSON.stringify({
        status: true,
        data: {
          records: [
            {
              id: 777,
              fullName: "Nature Communications",
              issn: "2041-1723",
              carIndex: 2.17,
              sciRiskRank: "\u4f4e",
            },
          ],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };
  const store = new Map();
  const cache = {
    async match(request) {
      return store.get(String(request.url))?.clone() || null;
    },
    async put(request, response) {
      store.set(String(request.url), response.clone());
    },
  };
  const request = new Request(
    "https://www.scansci.com/api/journals/car-risk?issn=2041-1723&title=Nature%20Communications"
  );

  const first = await handleJournalCarRiskRequest(request, { fetcher, cache });
  await first.json();
  const second = await handleJournalCarRiskRequest(request, { fetcher, cache });
  const payload = await second.json();

  assert.equal(calls, 1);
  assert.equal(second.headers.get("X-ScanSci-Cache"), "HIT");
  assert.equal(payload.item.title, "Nature Communications");
});
