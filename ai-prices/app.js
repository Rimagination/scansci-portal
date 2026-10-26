const copy = {
  zh: {
    searchLabel: "搜索 AI 应用或套餐", backToScansci: "返回 ScanSci", backToApps: "返回应用列表",
    category: "AI 助手", plans: "个套餐", noResults: "没有找到匹配的 AI 应用。", metaCardPlans: "基础免费 · 2 档付费方案", metaFree: "Meta AI 基础版", free: "免费", metaFreeDesc: "Meta 确认基础功能免费；App Store 标注可免费获取，提供应用内购买。", metaCoreDesc: "增加 Meta AI 图像和视频生成额度，并包含多款 Meta 应用权益。", metaPremiumDesc: "包含 Core 权益，提供更高的 Meta AI 创作额度。", metaAnnouncement: "Meta 官方价格说明", metaPriceVaries: "基础版免费和 Meta One 的美元月费起售价均来自 Meta 官方公告。Meta One 为跨应用订阅；实际价格、权益与可用性因地区、应用和账号而异，暂不计入地区排行榜。",
    plansComparison: "套餐比价", regionComparison: "地区比价", allChannels: "全部渠道",
    appStore: "App Store", web: "官网",
    globalPrice: "全球价格", country: "国家或地区", channel: "渠道", localPrice: "当地价格", converted: "折算价格", source: "来源",
    lowest: "最低标价", among: "在当前参与排序的地区与渠道中", distribution: "价格分布",
    dataNotes: "价格与数据说明", imported: "数据导入时间", iosNote: "App Store 标价来自 BiWu.Ai；每条记录链接到 Apple 应用页，税费与最终金额以结账页为准。", planNote: "官网标价来自 OpenAI、Google 的官方定价文件及 PlanPrice 开放数据；OpenAI 地区行链接到官方套餐页，具体地区价以结账页为准。", taxNote: "标价排序包含 App Store 标价与已标明含税的官网价；税前或税费待确认的官网价只展示，不参与排序。App Store 税费以结账页为准。", taxExclusive: "税前", taxUnknown: "税费待确认", iosTax: "税费以结账为准", noComparable: "暂无参与排序的报价", fxNote: "美元换算使用开放汇率数据，最终支付额以结账页为准。", missing: "暂无可核对的价格", noPlanData: "这个套餐当前没有可核对的渠道价格。", updated: "采集于", periodMonth: "月付", periodYear: "年付", openSource: "查看官方页面", compareRegion: "各地区渠道价格", noRegion: "该地区暂无具体套餐价格", copied: "链接已复制", sourceSnapshot: "上游数据快照", refresh: "页面显示的是已导入的价格快照，请在付款前打开官方页面核对。", sort: "切换排序", sourceTime: "采集时间"
  },
  en: {
    searchLabel: "Search AI apps or plans", backToScansci: "Back to ScanSci", backToApps: "Back to apps",
    category: "AI Assistant", plans: "plans", noResults: "No matching AI apps found.", metaCardPlans: "Free basics · 2 paid tiers", metaFree: "Meta AI (free)", free: "Free", metaFreeDesc: "Meta confirms the basic experience is free; the App Store lists a free download with in-app purchases.", metaCoreDesc: "Higher Meta AI image and video generation limits, plus benefits across Meta apps.", metaPremiumDesc: "Includes Core benefits with the highest Meta AI creation limits.", metaAnnouncement: "Meta's official pricing announcement", metaPriceVaries: "Meta's official announcement confirms the free experience and the starting monthly USD prices for Meta One. Meta One bundles benefits across Meta apps. Price, benefits, and availability vary by region, app, and account, so these prices are excluded from regional rankings.",
    plansComparison: "Plans Comparison", regionComparison: "Region Comparison", allChannels: "All channels",
    appStore: "App Store", web: "Web",
    globalPrice: "Global Price", country: "Country or region", channel: "Channel", localPrice: "Local price", converted: "Converted", source: "Source",
    lowest: "Lowest listed price", among: "Among ranked regions and channels", distribution: "Price distribution",
    dataNotes: "Price and data notes", imported: "Imported", iosNote: "App Store list prices come from BiWu.Ai. Each row links to an Apple app page; taxes and the final charge depend on checkout.", planNote: "Web list prices come from official OpenAI and Google pricing files and PlanPrice open data. OpenAI region links open its plan page; confirm the regional price at checkout.", taxNote: "Listed-price ranking includes App Store prices and tax-inclusive web prices. Pre-tax or tax-unconfirmed web prices are shown without a rank. App Store taxes depend on checkout.", taxExclusive: "Pre-tax", taxUnknown: "Tax unconfirmed", iosTax: "Tax at checkout", noComparable: "No ranked price available", fxNote: "USD conversions use public exchange rates. The final charge is shown at checkout.", missing: "No verified price available", noPlanData: "No verified channel price is available for this plan.", updated: "Collected", periodMonth: "Monthly", periodYear: "Annual", openSource: "Official page", compareRegion: "Channel prices by region", noRegion: "No plan price recorded for this region", copied: "Link copied", sourceSnapshot: "Upstream snapshot", refresh: "These are imported price snapshots. Verify the official page before paying.", sort: "Toggle sort", sourceTime: "Observed"
  }
};

const state = { data: null, lang: localStorage.getItem("scansci:ai-price-lang") === "en" ? "en" : "zh", currency: "CNY", tab: "plans", channel: "all", query: "", descending: false };
const $ = (id) => document.getElementById(id);
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const t = (key) => copy[state.lang][key] || key;
const langCode = () => state.lang === "zh" ? "zh-CN" : "en-US";
const date = (value) => value ? new Intl.DateTimeFormat(langCode(), { year: "numeric", month: "short", day: "numeric" }).format(new Date(value)) : "—";
const flag = (code) => /^[A-Z]{2}$/.test(code) ? `<img class="country-flag" src="https://flagcdn.com/24x18/${code === "TW" ? "cn" : code.toLowerCase()}.png" width="24" height="18" alt="${code === "TW" ? "CN" : code}" loading="lazy">` : "🌐";
const country = (code, fallback) => { if (code === "TW") return state.lang === "zh" ? "中国台湾" : "Taiwan, China"; try { return new Intl.DisplayNames([langCode()], { type: "region" }).of(code) || fallback || code; } catch { return fallback || code; } };
const safeUrl = (value) => { try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; } catch { return ""; } };
const amount = (row) => state.currency === "CNY" ? row.cny : row.cny / state.data.usdCny;
const money = (value) => new Intl.NumberFormat(langCode(), { style: "currency", currency: state.currency, maximumFractionDigits: 2 }).format(value);
const period = (value) => value === "year" ? t("periodYear") : t("periodMonth");
const channel = (value) => value === "ios" ? t("appStore") : t("web");
const sourceLink = (row, label) => { const url = safeUrl(row.source); return url ? `<a class="source-link${label ? " country-source" : ""}" href="${escape(url)}" target="_blank" rel="noopener noreferrer" title="${escape(row.observedAt ? `${t("openSource")} · ${t("sourceTime")}: ${date(row.observedAt)}` : t("openSource"))}">${escape(label || t("openSource"))} ↗</a>` : "—"; };

function route() {
  const params = new URLSearchParams(location.search);
  return { app: params.get("app"), plan: params.get("plan"), tab: params.get("tab") };
}
function go(app, plan, tab = "plans") {
  if (route().app !== app) state.channel = "all";
  const params = new URLSearchParams();
  if (app) params.set("app", app);
  if (plan) params.set("plan", plan);
  if (app && tab === "regions") params.set("tab", tab);
  history.pushState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}`);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function mark(product, large = false) { return `<span class="app-mark${large ? " large" : ""}"><img src="${escape(product.logo)}" alt="${escape(product.name)}" width="98" height="98"></span>`; }

function renderList() {
  const normalized = state.query.trim().toLocaleLowerCase();
  const products = state.data.products.filter((item) => !normalized || [item.name, item.provider, item.description.zh, item.description.en, ...state.data.plans.filter((p) => p.product === item.id).map((p) => p.name), ...(item.metaOne?.plans.map((p) => `Meta One ${p.name}`) || [])].join(" ").toLocaleLowerCase().includes(normalized));
  $("appGrid").innerHTML = products.map((product) => {
    const plans = state.data.plans.filter((item) => item.product === product.id);
    const hasWeb = state.data.prices.some((item) => item.product === product.id && item.channel === "web");
    return `<a class="app-card" href="?app=${encodeURIComponent(product.id)}" data-app="${escape(product.id)}"><div class="app-head">${mark(product)}<div class="app-headings"><h2>${escape(product.name)}</h2><p>${escape(product.provider)}</p></div><span class="app-arrow" aria-hidden="true">›</span></div><p class="app-desc">${escape(product.description[state.lang])}</p><div class="app-platforms"><span class="platform-chip">${t("appStore")}</span>${hasWeb ? `<span class="platform-chip">${t("web")}</span>` : ""}</div><div class="app-foot"><span class="category-chip">${t("category")}</span><span class="plan-count">${product.metaOne ? t("metaCardPlans") : `${plans.length} ${t("plans")}`}</span></div></a>`;
  }).join("");
  $("listEmpty").hidden = products.length > 0;
  $("listEmpty").textContent = t("noResults");
  $("appGrid").querySelectorAll("[data-app]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); go(link.dataset.app); }));
}

function relevantRows(product, plan) {
  return state.data.prices.filter((row) => row.product === product.id && row.plan === plan.id && row.period === plan.period);
}
const comparable = (row) => row.channel === "ios" || row.taxIncluded === true;
const compareRows = (a, b) => Number(comparable(b)) - Number(comparable(a)) || (a.cny - b.cny) * (state.descending ? -1 : 1);
const taxLabel = (row) => row.channel === "ios" ? `<small class="tax-note">${t("iosTax")}</small>` : row.taxIncluded !== true ? `<small class="tax-note">${t(row.taxIncluded === false ? "taxExclusive" : "taxUnknown")}</small>` : "";
function tableFor(rows, title) {
  if (!rows.length) return `<section class="panel"><p class="range-note">${t("noPlanData")}</p></section>`;
  const ordered = [...rows].sort(compareRows);
  return `<section class="panel"><div class="panel-pad"><h2>${escape(title)} · ${t("globalPrice")}</h2><p class="panel-meta">${rows.length} ${state.lang === "zh" ? "条有来源的报价" : "sourced prices"}</p><p class="panel-meta">${t("taxNote")}</p></div><table class="price-table"><thead><tr><th>#</th><th>${t("country")}</th><th>${t("channel")}</th><th>${t("localPrice")}</th><th>${t("converted")}</th></tr></thead><tbody>${ordered.map((row, index) => `<tr class="${!state.descending && index === 0 && comparable(row) ? "best-row" : ""}"><td class="rank">${comparable(row) ? index + 1 : "—"}</td><td>${flag(row.market)}${sourceLink(row, country(row.market, row.country))}<span class="mobile-channel">${row.channel === "ios" ? "iOS" : t("web")}</span></td><td>${channel(row.channel)}</td><td class="local-price">${escape(row.local)}${taxLabel(row)}</td><td class="equivalent">${money(amount(row))}<span class="mobile-tax">${taxLabel(row)}</span></td></tr>`).join("")}</tbody></table></section>`;
}
function sidePanels(rows) {
  const ordered = rows.filter(comparable).sort((a, b) => a.cny - b.cny);
  if (!ordered.length) return `<div class="side-stack"><section class="panel panel-pad"><p>${t("noComparable")}</p></section></div>`;
  const low = ordered[0];
  const highest = Math.max(...ordered.slice(0, 14).map((row) => row.cny));
  return `<aside class="side-stack"><section class="panel panel-pad"><div class="lowest-label">${t("lowest")}</div><div class="lowest-value">${money(amount(low))}</div><div class="lowest-place">${flag(low.market)} ${escape(country(low.market, low.country))} · ${channel(low.channel)}</div><p class="lowest-foot">${t("among")} · ${ordered.length} ${state.lang === "zh" ? "条记录" : "records"}</p></section><section class="panel panel-pad"><h3>${t("distribution")}</h3><div class="mini-chart">${ordered.slice(0, 14).map((row) => `<div class="bar-row" title="${escape(country(row.market, row.country))}: ${money(amount(row))}"><span>${escape(row.market)}</span><b style="width:${Math.max(8, Math.round(row.cny / highest * 100))}%"></b></div>`).join("")}</div></section><section class="panel panel-pad info-panel"><h3>${t("dataNotes")}</h3><p>${t("refresh")}</p></section></aside>`;
}
function regionView(rows, product) {
  const grouped = new Map();
  for (const row of rows) grouped.set(row.market, [...(grouped.get(row.market) || []), row]);
  const marketOrder = (market) => { const rows = grouped.get(market); const ranked = rows.filter(comparable); return [ranked.length ? 0 : 1, Math.min(...(ranked.length ? ranked : rows).map((row) => row.cny))]; };
  const markets = [...grouped.keys()].sort((a, b) => { const x = marketOrder(a), y = marketOrder(b); return x[0] - y[0] || x[1] - y[1]; });
  if (!markets.length) return `<section class="panel"><p class="range-note">${t("noPlanData")}</p></section>`;
  return `<div class="region-comparison">${markets.map((market) => {
    const group = grouped.get(market);
    return `<article class="region-card"><h3>${flag(market)} ${escape(country(market, group[0].country))}</h3>${group.sort(compareRows).map((row) => `<div class="region-line"><span>${channel(row.channel)}<br>${sourceLink(row)}</span><b>${money(amount(row))}<small>${escape(row.local)}${taxLabel(row)}</small></b></div>`).join("")}</article>`;
  }).join("")}</div>`;
}

function renderMetaDetail(product) {
  const offer = product.metaOne;
  $("detailView").innerHTML = `<section class="detail-hero">${mark(product, true)}<div class="hero-copy"><div class="hero-topline"><h1>${escape(product.name)}</h1></div><div class="hero-sub"><span>${escape(product.provider)}</span><span>·</span><span class="category-chip">${t("category")}</span></div><p>${escape(product.description[state.lang])}</p></div></section><div class="meta-grid"><article class="panel meta-card"><h2>${t("metaFree")}</h2><strong class="meta-value">${t("free")}</strong><p>${t("metaFreeDesc")}</p>${sourceLink({ source: product.appStore }, t("appStore"))}</article>${offer.plans.map((tier) => `<article class="panel meta-card"><h2>Meta One ${escape(tier.name)}</h2><strong class="meta-value">${state.lang === "zh" ? `US$${tier.monthlyUsd.toFixed(2)} / 月起` : `From US$${tier.monthlyUsd.toFixed(2)} / month`}</strong><p>${t(`meta${tier.name}Desc`)}</p></article>`).join("")}</div><p class="meta-footnote">${t("metaPriceVaries")} ${sourceLink({ source: offer.source }, t("metaAnnouncement"))}</p>`;
}

function renderDetail(product, selectedPlan, tab) {
  if (product.metaOne) { renderMetaDetail(product); return; }
  const plans = state.data.plans.filter((item) => item.product === product.id);
  const preferred = { chatgpt: "chatgpt-plus", claude: "claude-pro", grok: "supergrok", gemini: "google-ai-pro" };
  const plan = plans.find((item) => item.id === selectedPlan) || plans.find((item) => item.id === preferred[product.id]) || plans[0];
  state.tab = tab === "regions" ? "regions" : "plans";
  const rows = relevantRows(product, plan);
  const filtered = state.channel === "all" ? rows : rows.filter((row) => row.channel === state.channel);
  const content = state.tab === "regions" ? regionView(rows, product) : `<div class="comparison-grid"><div><div class="channel-tabs" role="tablist" aria-label="${t("channel")}">${[["all",t("allChannels")],["ios",t("appStore")],["web",t("web")]].map(([id,label]) => `<button type="button" data-channel="${id}" class="${state.channel === id ? "is-active" : ""}" aria-selected="${state.channel === id}">${label}</button>`).join("")}</div>${tableFor(filtered, plan.name)}</div>${sidePanels(filtered)}</div>`;
  const available = new Set(state.data.prices.filter((item) => item.product === product.id).map((item) => item.channel));
  $("detailView").innerHTML = `<section class="detail-hero">${mark(product, true)}<div class="hero-copy"><div class="hero-topline"><h1>${escape(product.name)}</h1><div class="hero-actions"><button type="button" id="sharePrice" aria-label="Share">↗</button></div></div><div class="hero-sub"><span>${escape(product.provider)}</span><span>·</span><span class="category-chip">${t("category")}</span><span>·</span>${available.has("ios") ? `<span class="platform-chip">iOS</span>` : ""}${available.has("web") ? `<span class="platform-chip">Web</span>` : ""}</div><p>${escape(product.description[state.lang])}</p></div></section><div class="detail-toolbar"><div class="detail-tabs" role="tablist"><button type="button" data-tab="plans" class="${state.tab === "plans" ? "is-active" : ""}" aria-selected="${state.tab === "plans"}">${t("plansComparison")}</button><button type="button" data-tab="regions" class="${state.tab === "regions" ? "is-active" : ""}" aria-selected="${state.tab === "regions"}">${t("regionComparison")}</button></div><div class="toolbar-right"><select class="currency-select" id="currencySelect" aria-label="Currency"><option value="CNY" ${state.currency === "CNY" ? "selected" : ""}>CNY ¥</option><option value="USD" ${state.currency === "USD" ? "selected" : ""}>USD $</option></select><button class="sort-button" id="sortButton" type="button" title="${t("sort")}" aria-label="${t("sort")}">⇅</button></div></div><div class="plan-tabs" role="tablist" aria-label="${t("plansComparison")}">${plans.map((item) => `<button type="button" data-plan="${escape(item.id)}" class="${item.id === plan.id ? "is-active" : ""}" aria-selected="${item.id === plan.id}">${escape(item.name)} <span class="period-chip ${item.period === "year" ? "year" : ""}">${item.period === "year" ? "1Y" : "1M"}</span></button>`).join("")}</div>${content}`;
  $("detailView").querySelectorAll("[data-plan]").forEach((button) => button.addEventListener("click", () => { state.channel = "all"; go(product.id, button.dataset.plan, state.tab); }));
  $("detailView").querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => go(product.id, plan.id, button.dataset.tab)));
  $("detailView").querySelectorAll("[data-channel]").forEach((button) => button.addEventListener("click", () => { state.channel = button.dataset.channel; render(); }));
  $("currencySelect").addEventListener("change", (event) => { state.currency = event.target.value; render(); });
  $("sortButton").addEventListener("click", () => { state.descending = !state.descending; render(); });
  $("sharePrice").addEventListener("click", async () => { try { await navigator.clipboard.writeText(location.href); $("sharePrice").title = t("copied"); } catch { /* Clipboard can be unavailable outside HTTPS. */ } });
}

function renderNote() {
  const d = state.data;
  $("dataNote").innerHTML = `<strong>${t("dataNotes")}</strong> · ${t("imported")}: ${date(d.generatedAt)}<br>${t("iosNote")} <a href="https://biwu.ai/en/about" target="_blank" rel="noopener noreferrer">BiWu.Ai ↗</a><br>${t("planNote")} <a href="https://chatgpt.com/pricing/" target="_blank" rel="noopener noreferrer">OpenAI ↗</a> · <a href="https://one.google.com/about/plans" target="_blank" rel="noopener noreferrer">Google One ↗</a> · <a href="https://plan-price.com/data/" target="_blank" rel="noopener noreferrer">PlanPrice ↗</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0 ↗</a>)<br>${t("taxNote")}<br>${t("fxNote")}`;
}
function render() {
  document.documentElement.lang = langCode();
  document.title = `${state.lang === "zh" ? "AI 比价" : "AI Price"} | ScanSci`;
  document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
  $("languageButton").textContent = state.lang === "zh" ? "EN" : "中";
  if (!state.data) return;
  const current = route();
  const product = state.data.products.find((item) => item.id === current.app);
  $("backToList").hidden = !product;
  $("backToList").setAttribute("aria-label", t("backToApps"));
  $("backToList").title = t("backToApps");
  $("listView").hidden = Boolean(product);
  $("detailView").hidden = !product;
  $("dataNote").hidden = Boolean(product?.metaOne);
  if (product) renderDetail(product, current.plan, current.tab);
  else renderList();
  renderNote();
}

$("backToList").addEventListener("click", () => { state.query = ""; $("appSearch").value = ""; $("searchPanel").hidden = true; go(); });
$("openSearch").addEventListener("click", () => { if (route().app) go(); $("searchPanel").hidden = false; $("appSearch").focus(); });
$("closeSearch").addEventListener("click", () => { $("searchPanel").hidden = true; $("appSearch").value = ""; state.query = ""; render(); });
$("appSearch").addEventListener("input", (event) => { state.query = event.target.value; renderList(); });
$("languageButton").addEventListener("click", () => { state.lang = state.lang === "zh" ? "en" : "zh"; localStorage.setItem("scansci:ai-price-lang", state.lang); render(); });
window.addEventListener("popstate", render);

try {
  // ponytail: hourly cache key may delay a fresh daily snapshot by up to one hour; use a release manifest if finer freshness is needed.
  const response = await fetch(`./data.json?h=${Math.floor(Date.now() / 3_600_000)}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Price data: ${response.status}`);
  state.data = await response.json();
  if (!Array.isArray(state.data.products) || !Array.isArray(state.data.prices)) throw new Error("Invalid price data");
  render();
} catch (error) {
  $("appGrid").innerHTML = `<p class="empty-state">${escape(error.message)}</p>`;
  console.error(error);
}
