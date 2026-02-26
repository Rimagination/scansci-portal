const state = {
  apps: [],
  query: "",
  activeCategory: "全部",
};

const els = {
  search: document.getElementById("globalSearch"),
  filters: document.getElementById("categoryFilters"),
  grid: document.getElementById("toolGrid"),
  empty: document.getElementById("emptyState"),
  error: document.getElementById("errorState"),
  count: document.getElementById("toolCount"),
};

const DEFAULT_CATEGORIES = ["全部", "数据检索", "期刊分析", "学术核查"];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function buildCategories() {
  const categories = new Set(DEFAULT_CATEGORIES);
  for (const app of state.apps) {
    categories.add(app.category || "未分类");
  }
  return [...categories];
}

function matchesQuery(app, query) {
  if (!query) return true;
  const haystack = [
    app.id,
    app.name,
    app.description,
    app.category,
    ...(Array.isArray(app.tags) ? app.tags : []),
  ]
    .map((item) => normalize(item))
    .join(" ");
  return haystack.includes(query);
}

function matchesCategory(app, category) {
  if (category === "全部") return true;
  return (app.category || "未分类") === category;
}

function getVisibleApps() {
  const q = normalize(state.query);
  return state.apps.filter((app) => matchesCategory(app, state.activeCategory) && matchesQuery(app, q));
}

function renderFilters() {
  const categories = buildCategories();
  els.filters.innerHTML = categories
    .map((category) => {
      const active = category === state.activeCategory ? " is-active" : "";
      return `<button class="category-filter${active}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`;
    })
    .join("");

  els.filters.querySelectorAll(".category-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeCategory = btn.dataset.category || "全部";
      renderFilters();
      renderGrid();
    });
  });
}

function cardTemplate(app) {
  return `
    <a class="tool-card" href="${escapeHtml(app.url || "#")}" target="_self" rel="noopener">
      <div class="tool-card__figure">
        <img src="${escapeHtml(app.cover || "./assets/covers/default.svg")}" alt="${escapeHtml(app.name)} 封面" loading="lazy" />
        <div class="tool-card__fade" aria-hidden="true"></div>
        <div class="tool-card__overlay">
          <span class="tool-card__cta">立即使用</span>
        </div>
      </div>
      <div class="tool-card__body">
        <h3 class="tool-card__name">${escapeHtml(app.name || "未命名工具")}</h3>
        <p class="tool-card__desc">${escapeHtml(app.description || "")}</p>
        <div class="tool-card__meta">
          <span class="tool-card__category">${escapeHtml(app.category || "未分类")}</span>
          <span class="tool-card__action">立即使用 →</span>
        </div>
      </div>
    </a>
  `;
}

function renderGrid() {
  const visible = getVisibleApps();
  els.grid.innerHTML = visible.map((app) => cardTemplate(app)).join("");
  els.empty.hidden = visible.length !== 0;
  els.count.textContent = `共 ${visible.length} / ${state.apps.length} 个应用`;
}

async function loadApps() {
  try {
    const res = await fetch("./data/apps.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    state.apps = Array.isArray(payload?.apps) ? payload.apps : [];
    els.error.hidden = true;
    renderFilters();
    renderGrid();
  } catch (err) {
    console.error("Failed to load app catalog:", err);
    els.error.hidden = false;
    els.count.textContent = "加载失败";
  }
}

function bindEvents() {
  els.search.addEventListener("input", () => {
    state.query = els.search.value || "";
    renderGrid();
  });
}

bindEvents();
loadApps();
