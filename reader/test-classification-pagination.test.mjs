import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const helper = html.match(/    async function loadFilteredPaperPages\(\) \{[\s\S]*?\n    \}/)?.[0];
assert.ok(helper, "filtered pagination helper exists in Reader");

function createContext(matchPage = Infinity) {
  const context = {
    state: { view: "papers", classificationFilter: "hq:T1", jcrQuartile: "", casZone: "", error: "", loading: false },
    paperPage: 1,
    paperHasMore: true,
    papers: [{ matches: false }],
    journalClassificationLookupUnavailable: false,
    hasActivePaperFilters: () => true,
    paperMatches: paper => paper.matches,
    loadMorePapers: async () => {
      context.paperPage += 1;
      if (context.paperPage === matchPage) context.papers.push(...Array.from({ length: 8 }, () => ({ matches: true })));
      else context.papers.push({ matches: false });
      context.paperHasMore = context.paperPage < 8;
    },
  };
  vm.runInNewContext(`${helper}\nthis.run = loadFilteredPaperPages;`, context);
  return context;
}

test("filtered search continues across pages until matches appear", async () => {
  const context = createContext(3);
  await context.run();
  assert.equal(context.paperPage, 3);
  assert.equal(context.papers.filter(paper => paper.matches).length, 8);
});

test("filtered search caps automatic expansion at four extra pages", async () => {
  const context = createContext();
  await context.run();
  assert.equal(context.paperPage, 5);
});
