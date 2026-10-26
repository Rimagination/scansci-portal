import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("./data.json", import.meta.url), "utf8"));
const apps = JSON.parse(await readFile(new URL("../data/apps.json", import.meta.url), "utf8"));
assert.equal(apps.apps.find((app) => app.id === "ai-price")?.url, "/ai-prices/");
assert.deepEqual(data.products.map((product) => product.id), ["chatgpt", "claude", "grok", "gemini"]);
assert(data.prices.length >= 500);
assert(data.playRanges.length >= 20);
assert(Number.isFinite(data.usdCny) && data.usdCny > 0);

const plans = new Set(data.plans.map((plan) => `${plan.product}/${plan.id}/${plan.period}`));
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
console.log(`Verified ${data.products.length} official icons, ${data.prices.length} plan prices, and ${data.playRanges.length} Google Play ranges.`);
