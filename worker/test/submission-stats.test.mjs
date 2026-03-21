import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import {
  SUBMISSION_STATS_PARSER_VERSION,
  normalizeSubmissionStatRecord,
  parseDurationToDays,
  parseSubmissionStatsBySource,
  validateUserRatingInput,
} from "../src/submission-stats.mjs";

async function readFixture(name) {
  const url = new URL(`./fixtures/${name}`, import.meta.url);
  return fs.readFile(url, "utf8");
}

test("parseDurationToDays normalizes day, week, and month units", () => {
  assert.equal(parseDurationToDays("12 days"), 12);
  assert.equal(parseDurationToDays("2 weeks"), 14);
  assert.equal(parseDurationToDays("平均4.4月"), 132);
  assert.equal(parseDurationToDays("2-4 weeks"), 21);
});

test("validateUserRatingInput requires 1-5 scores", () => {
  assert.deepEqual(validateUserRatingInput({ speed_score: 5, editor_score: 4, recommend_score: 3 }), {
    ok: true,
    rating: {
      speed_score: 5,
      editor_score: 4,
      recommend_score: 3,
    },
  });
  assert.equal(validateUserRatingInput({ speed_score: 6, editor_score: 4, recommend_score: 3 }).ok, false);
});

test("normalizeSubmissionStatRecord canonicalizes and validates the payload", () => {
  const normalized = normalizeSubmissionStatRecord({
    issn: "0028-0836",
    source_name: "elsevier",
    source_url: "https://example.com/journal",
    review_time_days: 11.234,
    parser_version: SUBMISSION_STATS_PARSER_VERSION,
    raw_json: { ok: true },
  });

  assert.equal(normalized.ok, true);
  assert.equal(normalized.record.issn_key, "00280836");
  assert.equal(normalized.record.issn_display, "0028-0836");
  assert.equal(normalized.record.source_name, "Elsevier");
  assert.equal(normalized.record.source_type, "official");
  assert.equal(normalized.record.review_time_days, 11.2);
});

test("parseSubmissionStatsBySource handles Elsevier fixture", async () => {
  const html = await readFixture("submission-elsevier.html");
  const parsed = parseSubmissionStatsBySource("Elsevier", html);
  assert.equal(parsed.review_time_days, 57.4);
  assert.equal(parsed.first_decision_days, 19);
  assert.equal(parsed.accept_rate_pct, 23);
});

test("parseSubmissionStatsBySource handles Springer Nature fixture", async () => {
  const html = await readFixture("submission-springer.html");
  const parsed = parseSubmissionStatsBySource("Springer Nature", html);
  assert.equal(parsed.review_time_days, 11);
  assert.equal(parsed.first_decision_days, 11);
  assert.equal(parsed.accept_rate_pct, 31);
});

test("parseSubmissionStatsBySource handles MDPI fixture", async () => {
  const html = await readFixture("submission-mdpi.html");
  const parsed = parseSubmissionStatsBySource("MDPI", html);
  assert.equal(parsed.review_time_days, 14.5);
  assert.equal(parsed.first_decision_days, 14.5);
});

test("parseSubmissionStatsBySource handles SAGE fixture", async () => {
  const html = await readFixture("submission-sage.html");
  const parsed = parseSubmissionStatsBySource("SAGE", html);
  assert.equal(parsed.review_time_days, 24);
  assert.equal(parsed.first_decision_days, 24);
  assert.equal(parsed.accept_rate_pct, 18);
});

test("parseSubmissionStatsBySource handles LetPub fixture", async () => {
  const html = await readFixture("submission-letpub.html");
  const parsed = parseSubmissionStatsBySource("LetPub", html);
  assert.equal(parsed.review_time_days, 60);
  assert.equal(parsed.accept_rate_pct, 48);
  assert.equal(parsed.overall_score, 8.6);
  assert.equal(parsed.sample_size, 37);
});

test("parseSubmissionStatsBySource handles MedSci fixture", async () => {
  const html = await readFixture("submission-medsci.html");
  const parsed = parseSubmissionStatsBySource("MedSci", html);
  assert.equal(parsed.review_time_days, 132);
  assert.equal(parsed.accept_rate_pct, 53.8);
  assert.equal(parsed.overall_score, 7.2);
  assert.equal(parsed.sample_size, 12);
});
