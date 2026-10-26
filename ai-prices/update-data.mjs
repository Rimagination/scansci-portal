import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("./", import.meta.url);
const plans = [
  ["chatgpt", "chatgpt-go", "ChatGPT Go", "month"],
  ["chatgpt", "chatgpt-plus", "ChatGPT Plus", "month"],
  ["chatgpt", "chatgpt-pro-20x", "ChatGPT Pro 200", "month"],
  ["claude", "claude-pro", "Claude Pro", "month"],
  ["claude", "claude-max-5x", "Claude Max 5x", "month"],
  ["claude", "claude-max-20x", "Claude Max 20x", "month"],
  ["grok", "supergrok-lite", "SuperGrok Lite", "month"],
  ["grok", "supergrok", "SuperGrok", "month"],
  ["grok", "supergrok-heavy", "SuperGrok Heavy", "month"],
  ["gemini", "google-ai-plus", "Google AI Plus (400 GB)", "month"],
  ["gemini", "google-ai-pro", "Google AI Pro", "month"],
  ["gemini", "google-ai-ultra", "Google AI Ultra 20x", "month"],
];
const officialWebPlans = [
  ["chatgpt", "chatgpt-pro-5x", "ChatGPT Pro 100", "month"],
  ["chatgpt", "chatgpt-pro-50x", "ChatGPT Pro 500", "month"],
  ["gemini", "google-ai-ultra-5x", "Google AI Ultra 5x", "month"],
];
const annualPlans = [
  ["chatgpt", "chatgpt-plus-year", "ChatGPT Plus", "year"],
  ["claude", "claude-pro-year", "Claude Pro", "year"],
];

const products = [
  { id: "chatgpt", name: "ChatGPT", provider: "OpenAI", logo: "./assets/chatgpt.jpg", description: { zh: "OpenAI 的通用 AI 助手，支持写作、推理、搜索、图像和语音。", en: "OpenAI's AI assistant for writing, reasoning, search, images, and voice." } },
  { id: "claude", name: "Claude", provider: "Anthropic", logo: "./assets/claude.jpg", description: { zh: "Anthropic 的 AI 助手，适合写作、分析、编程与长文处理。", en: "Anthropic's AI assistant for writing, analysis, coding, and long documents." } },
  { id: "grok", name: "Grok", provider: "xAI", logo: "./assets/grok.jpg", description: { zh: "xAI 的 AI 助手，提供聊天、搜索和创作功能。", en: "xAI's assistant for chat, search, and creation." } },
  { id: "gemini", name: "Gemini", provider: "Google", logo: "./assets/gemini.jpg", description: { zh: "Google 的 AI 助手，提供搜索、写作和多模态工具。", en: "Google's AI assistant for search, writing, and multimodal tools." } },
  { id: "meta-ai", name: "Meta AI", provider: "Meta", logo: "./assets/meta-ai.jpg", appStore: "https://apps.apple.com/us/app/meta-ai/id1558240027", metaOne: { source: "https://about.fb.com/news/2026/09/introducing-meta-one-subscription-service-more-features-ai/", plans: [{ name: "Core", monthlyUsd: 7.99 }, { name: "Premium", monthlyUsd: 19.99 }] }, description: { zh: "Meta 的 AI 助手，支持聊天、搜索、创作及图像和视频生成。", en: "Meta's AI assistant for chat, search, creation, and image and video generation." } },
];

const liveWebPlans = {
  chatgpt: { "chatgpt-go": "chatgpt-go", "chatgpt-plus": "chatgpt-plus", "chatgpt-pro-200": "chatgpt-pro-20x" },
  gemini: { "gemini-plus": "google-ai-plus", "gemini-pro": "google-ai-pro", "gemini-ultra-20x": "google-ai-ultra" },
};
const googleMarkets = "AE AG AL AM AO AS AT AU AW AZ BA BD BE BF BG BH BJ BM BO BR BS BW BY BZ CA CH CI CL CM CO CR CV CY CZ DE DK DO DZ EC EE EG ES FI FJ FM FO FR GA GB GE GH GI GL GP GR GT GU GW HK HN HR HT HU ID IE IL IN IQ IS IT JM JO JP KE KG KH KR KW KY KZ LA LB LI LK LT LU LV MA MC MD MH MK ML MM MO MP MQ MT MU MV MX MY MZ NA NE NG NI NL NO NP NZ OM PA PE PF PG PH PK PL PR PT PW PY QA RE RO RS RU RW SA SC SE SG SI SK SL SM SN SV TG TH TJ TM TN TO TR TT TW TZ UA UG US UY VE VG VI VN YE YT ZA ZM ZW".split(" ");
const googlePlans = {
  PRICE_GEN_AI_PLUS_MONTHLY: "google-ai-plus",
  PRICE_GEN_AI_PRO_MONTHLY: "google-ai-pro",
  PRICE_GEN_AI_ULTRA_100_MONTHLY: "google-ai-ultra-5x",
  PRICE_GEN_AI_ULTRA_200_MONTHLY: "google-ai-ultra",
};
const googleFeedVersion = "2026_07_28";
const googleFeedObservedAt = "2026-07-28T00:28:00Z";
const openaiPlans = { go: "chatgpt-go", plus: "chatgpt-plus", prolite: "chatgpt-pro-5x", pro: "chatgpt-pro-20x", promax: "chatgpt-pro-50x" };
const openaiMarkets = "AE AR AT AU BE BG BO BR CA CL CO CY CZ DE DK EE EG ES FI FR GB GF GP GR HK HR HU ID IE IL IN IS IT JP KR KZ LT LU LV MF MQ MT MX MY NG NL NO NZ PE PH PK PL PT QA RE RO RS SE SG SI SK TH TR TW UA US VN YT ZA".split(" ");

export function parsePlanPriceUSGrid(html, product, rate) {
  const table = html.match(/<table class="data-table channel-grid">([\s\S]*?)<\/table>/)?.[1];
  if (!table) throw new Error(`No PlanPrice channel grid: ${product}`);
  const rows = [];
  for (const match of table.matchAll(/<tr data-h-plan="([^"]+)">([\s\S]*?)<\/tr>/g)) {
    const plan = liveWebPlans[product]?.[match[1]];
    const cellMatch = match[2].match(/(<td data-qa="price-cell"[^>]*data-status="verified"[^>]*data-channel="web"[^>]*data-period="month"[^>]*>)([\s\S]*?)<\/td>/);
    const cell = cellMatch?.[2];
    if (!plan || !cell) continue;
    const amount = cell.match(/data-qa="amount">\$([\d,.]+)</)?.[1];
    const source = cell.match(/<dd><a href="(https:[^"]+)"/)?.[1];
    const observedAt = cell.match(/<time[^>]*datetime="([^"]+)"[^>]*data-qa="observed"/)?.[1];
    if (!amount || !source || !observedAt) continue;
    const tax = cellMatch[1].match(/data-tax="([^"]+)"/)?.[1];
    rows.push({ product, plan, period: "month", market: "US", country: "US", channel: "web", local: `$${amount}`, currency: "USD", cny: Number(amount.replaceAll(",", "")) * rate, source, upstream: `https://plan-price.com/en/${product}/`, observedAt, taxIncluded: tax === "included" ? true : tax === "excluded" ? false : null });
  }
  if (rows.length !== Object.keys(liveWebPlans[product]).length) throw new Error(`Incomplete live web grid: ${product}`);
  return rows;
}

function localPrice(value) {
  return value.replace(/Rp\s*([\d.,]+)(ribu|juta)/i, (_, number, unit) => {
    const amount = Number(number.replaceAll(".", "").replace(",", ".")) * (unit.toLowerCase() === "ribu" ? 1_000 : 1_000_000);
    return `Rp ${Math.round(amount).toLocaleString("en-US")}`;
  });
}

async function getJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": "ScanSci-AI-Price/1.0 (public price comparison)" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

export function extractBiwuPlanId(html) {
  const planId = html.match(/planId\\":\\"([^\\"]+)/)?.[1];
  if (!/^[a-z0-9_-]+__[a-z0-9_-]+$/.test(planId || "")) throw new Error("BiWu plan ID missing");
  return planId;
}

export function parseBiwuOffers(page, product, plan, period, upstream) {
  if (page.ok !== true || !Array.isArray(page.rows) || !Number.isInteger(page.total)) throw new Error(`Invalid BiWu offers: ${plan}`);
  return page.rows.map((item) => {
    if (item.channelSlug !== "app_store" || item.status !== "available" || item.priceKind !== "exact" || !/^[A-Z]{2}$/.test(item.countryCode) || !/^[A-Z]{3}$/.test(item.currencyCode) || !Number.isFinite(item.cnyPrice) || item.cnyPrice <= 0 || !item.sourceUrl?.startsWith("https://apps.apple.com/")) throw new Error(`Invalid BiWu offer: ${plan}/${item.countryCode}`);
    return { product, plan, period, market: item.countryCode, country: item.countryLabel, channel: "ios", local: localPrice(item.priceText), currency: item.currencyCode, cny: item.cnyPrice, source: item.sourceUrl, upstream, observedAt: item.lastCheckedAt || item.fetchedAt };
  });
}

const localAmount = (amount, currency) => `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)} ${currency}`;
const toCny = (amount, currency, rates) => amount / rates.rates[currency] * rates.rates.CNY;

export function parseOpenAIConfigs(snapshot, rates, now) {
  const rows = [];
  for (const market of snapshot.markets || []) {
    const observedAt = market.observedAt || snapshot.observedAt;
    if (!/^[A-Z]{2}$/.test(market.code) || !/^[A-Z]{3}$/.test(market.currency || "") || !Number.isFinite(Date.parse(observedAt)) || Date.parse(now) - Date.parse(observedAt) > 30 * 86_400_000 || !rates.rates[market.currency]) continue;
    for (const [field, plan] of Object.entries(openaiPlans)) {
      const price = market[field];
      if (!Number.isFinite(price?.amount) || price.amount <= 0 || !["inclusive", "exclusive"].includes(price.tax)) continue;
      rows.push({ product: "chatgpt", plan, period: "month", market: market.code, country: market.code, channel: "web", local: localAmount(price.amount, market.currency), currency: market.currency, cny: toCny(price.amount, market.currency, rates), source: "https://chatgpt.com/pricing/", upstream: `https://chatgpt.com/backend-api/checkout_pricing_config/configs/${market.code}`, observedAt, taxIncluded: price.tax === "inclusive" });
    }
  }
  return rows;
}

export async function refreshOpenAIConfigs(snapshot, now) {
  const url = (code) => `https://chatgpt.com/backend-api/checkout_pricing_config/configs/${code}`;
  const headers = { "User-Agent": "ScanSci-AI-Price/1.0 (public price comparison)" };
  const current = new Map((snapshot.markets || []).map((market) => [market.code, { ...market, observedAt: market.observedAt || snapshot.observedAt }]));
  let refreshed = 0;
  async function update(code) {
    try {
      const result = await fetch(url(code), { headers });
      if (!result.ok) return;
      const data = await result.json();
      if (data.country_code !== code || !/^[A-Z]{3}$/.test(data.currency_config?.symbol_code || "")) return;
      const config = data.currency_config;
      current.set(code, { code, currency: config.symbol_code, observedAt: now, ...Object.fromEntries(Object.keys(openaiPlans).map((key) => [key, config[key]?.month && { amount: config[key].month.amount, tax: config[key].month.tax }])) });
      refreshed++;
    } catch { /* Keep the last verified snapshot for this market. */ }
  }
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => { while (next < openaiMarkets.length) await update(openaiMarkets[next++]); }));
  return refreshed ? { observedAt: now, markets: [...current.values()].sort((a, b) => a.code.localeCompare(b.code)) } : snapshot;
}

export function parseGoogleFeed(feed, code, rates, observedAt) {
  if (feed.COUNTRY_CODE !== code || !/^[A-Z]{3}$/.test(feed.CURRENCY_CODE || "") || !rates.rates[feed.CURRENCY_CODE]) return [];
  return Object.entries(googlePlans).flatMap(([field, plan]) => {
    const amount = feed[field];
    if (!Number.isFinite(amount) || amount <= 0) return [];
    return [{ product: "gemini", plan, period: "month", market: code, country: code, channel: "web", local: localAmount(amount, feed.CURRENCY_CODE), currency: feed.CURRENCY_CODE, cny: toCny(amount, feed.CURRENCY_CODE, rates), source: `https://one.google.com/intl/ALL_${code.toLowerCase()}/about/feeds/pricing_${googleFeedVersion}.json`, upstream: "Google One public pricing feed", observedAt, taxIncluded: null }];
  });
}

async function getGoogleRows(rates, now) {
  if (Date.parse(now) - Date.parse(googleFeedObservedAt) > 180 * 86_400_000) {
    console.warn(`Google pricing feed ${googleFeedVersion} is over 180 days old; skipping its prices until the feed version is reviewed.`);
    return [];
  }
  const rows = [];
  let next = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < googleMarkets.length) {
      const code = googleMarkets[next++];
      const url = `https://one.google.com/intl/ALL_${code.toLowerCase()}/about/feeds/pricing_${googleFeedVersion}.json`;
      const response = await fetch(url, { headers: { "User-Agent": "ScanSci-AI-Price/1.0 (public price comparison)" } });
      if (response.status === 404) continue;
      if (!response.ok) throw new Error(`Google feed ${response.status}: ${code}`);
      const observedAt = response.headers.get("last-modified");
      rows.push(...parseGoogleFeed(await response.json(), code, rates, observedAt && Number.isFinite(Date.parse(observedAt)) ? new Date(observedAt).toISOString() : googleFeedObservedAt));
    }
  }));
  if (rows.length < 300) throw new Error(`Incomplete Google feed: ${rows.length} rows`);
  return rows;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const existing = JSON.parse(await readFile(new URL("data.json", root), "utf8").catch(() => "{}"));
  const rates = await getJson("https://open.er-api.com/v6/latest/USD");
  if (rates.result !== "success" || !Number.isFinite(rates.rates?.CNY)) throw new Error("No USD/CNY rate");
  const imported = [];
  for (const [product, plan, name, period] of plans) {
    const url = `https://biwu.ai/en/prices/${plan}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    const planId = extractBiwuPlanId(await response.text());
    const rows = [];
    let total = 0;
    for (let pageNumber = 1; pageNumber <= 20; pageNumber++) {
      const api = `https://biwu.ai/api/official-prices/offers?planId=${encodeURIComponent(planId)}&page=${pageNumber}&pageSize=100`;
      const page = await getJson(api);
      total = page.total;
      const batch = parseBiwuOffers(page, product, plan, period, api);
      if (!batch.length) throw new Error(`Empty BiWu page: ${plan}/${pageNumber}`);
      rows.push(...batch);
      if (rows.length >= total) break;
    }
    if (rows.length !== total || total < 10 || new Set(rows.map((row) => row.market)).size !== total) throw new Error(`Incomplete BiWu markets: ${plan}, ${rows.length}/${total}`);
    imported.push(...rows);
  }
  const releaseIndex = await getJson("https://plan-price.com/data/releases/index.json");
  const releases = Array.isArray(releaseIndex) ? releaseIndex : releaseIndex.releases;
  const latest = releases?.map((release) => typeof release === "string" ? release : release.release_id ?? release.id ?? release.date).sort().at(-1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(latest || "")) throw new Error("No PlanPrice release");
  const base = `https://plan-price.com/data/releases/${latest}/`;
  const observations = await getJson(`${base}observations.json`);
  for (const item of observations) {
    if (!plans.some(([product]) => product === item.product_id) || !(item.channel === "web" || (item.channel === "ios" && item.period === "year"))) continue;
    const amount = Number(item.amount);
    const usdRate = rates.rates[item.currency];
    if (!Number.isFinite(amount) || !Number.isFinite(usdRate) || !usdRate) continue;
    const plan = item.period === "year" ? `${item.plan_id}-year` : item.plan_id;
    imported.push({ product: item.product_id, plan, period: item.period, market: item.market_id, country: item.market_id, channel: item.channel, local: `${item.amount} ${item.currency}`, currency: item.currency, cny: amount / usdRate * rates.rates.CNY, source: item.source_url, upstream: "https://plan-price.com/data/", observedAt: item.observed_at, taxIncluded: item.tax_included });
  }
  for (const product of Object.keys(liveWebPlans)) {
    const response = await fetch(`https://plan-price.com/en/${product}/`);
    if (!response.ok) throw new Error(`${response.status} PlanPrice ${product}`);
    imported.push(...parsePlanPriceUSGrid(await response.text(), product, rates.rates.CNY));
  }
  const snapshot = JSON.parse(await readFile(new URL("openai-config-snapshot.json", root), "utf8"));
  const openai = await refreshOpenAIConfigs(snapshot, generatedAt);
  imported.push(...parseOpenAIConfigs(openai, rates, generatedAt));
  imported.push(...await getGoogleRows(rates, generatedAt));
  const unique = new Map();
  for (const item of imported) {
    const key = `${item.product}/${item.plan}/${item.period}/${item.market}/${item.channel}`;
    const previous = unique.get(key);
    if (!previous || Date.parse(item.observedAt) >= Date.parse(previous.observedAt)) unique.set(key, item);
  }
  if (unique.size < 500) throw new Error(`Incomplete price data: ${unique.size}`);
  const activeOfficialWebPlans = officialWebPlans.filter(([, id]) => [...unique.values()].some((row) => row.plan === id));
  const output = { generatedAt, iosSource: "BiWu.Ai public offers API; each row links to the corresponding Apple listing", webSource: `OpenAI and Google official feeds; PlanPrice CC BY 4.0, release ${latest}`, rateSource: `open.er-api.com, ${rates.time_last_update_utc}`, usdCny: rates.rates.CNY, products, plans: [...plans, ...activeOfficialWebPlans, ...annualPlans].map(([product, id, name, period]) => ({ product, id, name, period })), prices: [...unique.values()] };
  await writeFile(new URL("data.json", root), `${JSON.stringify(output, null, 2)}\n`);
  if (openai !== snapshot) await writeFile(new URL("openai-config-snapshot.json", root), `${JSON.stringify(openai, null, 2)}\n`);
  console.log(`Updated ${unique.size} plan prices (${generatedAt})`);
  if (existing.generatedAt) console.log(`Previous snapshot: ${existing.generatedAt}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
