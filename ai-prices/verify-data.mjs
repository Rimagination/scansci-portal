import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { parseGoogleFeed, parseOpenAIConfigs, refreshOpenAIConfigs } from "./update-data.mjs";

const data = JSON.parse(await readFile(new URL("./data.json", import.meta.url), "utf8"));
const apps = JSON.parse(await readFile(new URL("../data/apps.json", import.meta.url), "utf8"));
assert.equal(apps.apps.find((app) => app.id === "ai-price")?.url, "/ai-prices/");
assert.deepEqual(data.products.map((product) => product.id), ["chatgpt", "claude", "grok", "gemini", "meta-ai"]);
const meta = data.products.find((product) => product.id === "meta-ai");
assert.equal(meta.appStore, "https://apps.apple.com/us/app/meta-ai/id1558240027");
assert.deepEqual(meta.metaOne.plans.map((plan) => plan.monthlyUsd), [7.99, 19.99]);
assert(new URL(meta.metaOne.source).hostname === "about.fb.com");
assert(data.prices.length >= 500);
assert(Number.isFinite(data.usdCny) && data.usdCny > 0);

const plans = new Set(data.plans.map((plan) => `${plan.product}/${plan.id}/${plan.period}`));
assert.equal(plans.size, data.plans.length);
for (const plan of data.plans) assert(data.prices.some((row) => row.product === plan.product && row.plan === plan.id && row.period === plan.period), `Empty plan: ${plan.id}`);
const unique = new Set();
for (const row of data.prices) {
  assert(plans.has(`${row.product}/${row.plan}/${row.period}`), `Unknown plan: ${row.plan}`);
  assert(/^[A-Z]{2}$/.test(row.market), `Invalid market: ${row.market}`);
  assert(["ios", "web"].includes(row.channel), `Invalid channel: ${row.channel}`);
  assert(Number.isFinite(row.cny) && row.cny > 0, `Invalid amount: ${row.plan}`);
  assert(new URL(row.source).protocol === "https:", `Invalid source: ${row.plan}`);
  const key = `${row.product}/${row.plan}/${row.period}/${row.market}/${row.channel}`;
  assert(!unique.has(key), `Duplicate price: ${key}`);
  unique.add(key);
}
for (const product of data.products) {
  const logo = new URL(product.logo, import.meta.url);
  assert((await stat(logo)).size > 1000, `Missing official app icon: ${product.id}`);
}
for (const product of ["chatgpt", "claude", "gemini"]) {
  assert(data.prices.some((row) => row.product === product && row.channel === "web"), `Missing web price: ${product}`);
}
assert(data.prices.filter((row) => row.plan === "chatgpt-plus" && row.channel === "ios").length >= 41);
assert(data.prices.filter((row) => row.channel === "web").every((row) => row.taxIncluded === null || typeof row.taxIncluded === "boolean"));
assert(data.plans.find((plan) => plan.id === "google-ai-plus")?.name.includes("400 GB"));
assert(data.prices.filter((row) => row.plan === "google-ai-pro" && row.channel === "web").every((row) => Date.parse(row.observedAt) <= Date.parse(data.generatedAt)));
const ph = data.prices.find((row) => row.plan === "chatgpt-plus" && row.market === "PH" && row.channel === "web");
if (ph) {
  assert(/^[\d,.]+ PHP$/.test(ph.local));
  assert(typeof ph.taxIncluded === "boolean");
  assert.equal(new URL(ph.source).hostname, "chatgpt.com");
}
const now = new Date().toISOString();
const sample = parseOpenAIConfigs({ observedAt: now, markets: [{ code: "PH", currency: "PHP", plus: { amount: 1100, tax: "inclusive", psp_override: { amount: 982.14, tax: "exclusive" } } }] }, { rates: { PHP: 50, CNY: 7 } }, now);
assert.equal(sample[0].local, "1,100 PHP");
assert.equal(sample[0].cny, 154);
assert.equal(parseGoogleFeed({ COUNTRY_CODE: "US", CURRENCY_CODE: "USD", PRICE_GEN_AI_PRO_MONTHLY: 19.99 }, "PH", { rates: { USD: 1, CNY: 7 } }, now).length, 0);
const previousFetch = globalThis.fetch;
const oldDate = "2026-10-01T00:00:00Z";
try {
  const prior = { observedAt: oldDate, markets: [{ code: "PH", currency: "PHP", plus: { amount: 1100, tax: "inclusive" } }] };
  globalThis.fetch = async (url) => url.endsWith("/BR") ? new Response(JSON.stringify({ country_code: "BR", currency_config: { symbol_code: "BRL", plus: { month: { amount: 99.9, tax: "exclusive" } } } })) : new Response("", { status: 403 });
  const refreshed = await refreshOpenAIConfigs(prior, now);
  assert.equal(refreshed.markets.find((market) => market.code === "PH").observedAt, oldDate);
  assert.equal(refreshed.markets.find((market) => market.code === "BR").observedAt, now);
  globalThis.fetch = async () => new Response("", { status: 403 });
  assert.equal(await refreshOpenAIConfigs(prior, now), prior);
} finally { globalThis.fetch = previousFetch; }
console.log(`Verified ${data.products.length} official icons and ${data.prices.length} plan prices.`);
