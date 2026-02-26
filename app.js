const state = {
  apps: [],
  query: "",
  activeCategory: "全部",
  me: null,
  favorites: new Set(),
};

const API_BASE = "/api";

const els = {
  search: document.getElementById("globalSearch"),
  filters: document.getElementById("categoryFilters"),
  grid: document.getElementById("toolGrid"),
  empty: document.getElementById("emptyState"),
  error: document.getElementById("errorState"),
  count: document.getElementById("toolCount"),
  authGuest: document.getElementById("authGuest"),
  authUser: document.getElementById("authUser"),
  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  userAvatar: document.getElementById("userAvatar"),
  userName: document.getElementById("userName"),
  userEmail: document.getElementById("userEmail"),
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

function isFavorite(appId) {
  return state.favorites.has(String(appId));
}

function renderFilters() {
  if (!els.filters) return;
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

function favoriteButtonText(appId) {
  return isFavorite(appId) ? "已收藏" : "加入常用";
}

function cardTemplate(app) {
  const appId = String(app.id || "");
  const favoriteCls = isFavorite(appId) ? " is-active" : "";
  return `
    <article class="tool-card" data-app-id="${escapeHtml(appId)}">
      <a class="tool-card__link" href="${escapeHtml(app.url || "#")}" target="_self" rel="noopener" data-action="open">
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
        </div>
      </a>
      <div class="tool-card__meta">
        <span class="tool-card__category">${escapeHtml(app.category || "未分类")}</span>
        <div class="tool-card__meta-actions">
          <button class="tool-card__fav${favoriteCls}" type="button" data-app-id="${escapeHtml(appId)}" data-action="favorite">${favoriteButtonText(appId)}</button>
          <a class="tool-card__action" href="${escapeHtml(app.url || "#")}" target="_self" rel="noopener">立即使用 →</a>
        </div>
      </div>
    </article>
  `;
}

function renderGrid() {
  if (!els.grid || !els.empty || !els.count) return;
  const visible = getVisibleApps();
  els.grid.innerHTML = visible.map((app) => cardTemplate(app)).join("");
  els.empty.hidden = visible.length !== 0;
  els.count.textContent = `共 ${visible.length} / ${state.apps.length} 个应用`;

  els.grid.querySelectorAll('[data-action="favorite"]').forEach((btn) => {
    btn.addEventListener("click", onFavoriteClick);
  });

  els.grid.querySelectorAll('[data-action="open"]').forEach((link) => {
    link.addEventListener("click", onOpenToolClick);
  });
}

function renderAuth() {
  if (!els.authGuest || !els.authUser) return;
  const loggedIn = !!state.me;
  els.authGuest.hidden = loggedIn;
  els.authUser.hidden = !loggedIn;

  if (!loggedIn) return;
  if (els.userAvatar) {
    els.userAvatar.src = state.me.avatar_url || "./assets/brand/dataraven-crow-only.svg";
  }
  if (els.userName) {
    els.userName.textContent = state.me.login || "GitHub 用户";
  }
  if (els.userEmail) {
    els.userEmail.textContent = state.me.email || "未公开邮箱";
  }
}

async function loadApps() {
  try {
    const res = await fetch("./data/apps.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    state.apps = Array.isArray(payload?.apps) ? payload.apps : [];
    if (els.error) els.error.hidden = true;
    renderFilters();
    renderGrid();
  } catch (err) {
    console.error("Failed to load app catalog:", err);
    if (els.error) els.error.hidden = false;
    if (els.count) els.count.textContent = "加载失败";
  }
}

async function apiFetch(path, init = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
}

async function loadMe() {
  try {
    const res = await apiFetch("/me", { method: "GET" });
    if (res.status === 401) {
      state.me = null;
      state.favorites = new Set();
      renderAuth();
      renderGrid();
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    state.me = payload?.user || null;
    state.favorites = new Set((payload?.favorites || []).map((x) => String(x)));
  } catch (err) {
    console.warn("Auth API unavailable, running as guest:", err);
    state.me = null;
    state.favorites = new Set();
  }
  renderAuth();
  renderGrid();
}

function goToLogin() {
  const returnTo = `${window.location.pathname}${window.location.search}`;
  const url = `${API_BASE}/auth/github/start?return_to=${encodeURIComponent(returnTo)}`;
  window.location.href = url;
}

async function logout() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch (err) {
    console.warn("Logout failed:", err);
  }
  state.me = null;
  state.favorites = new Set();
  renderAuth();
  renderGrid();
}

async function onFavoriteClick(event) {
  event.preventDefault();
  event.stopPropagation();

  const btn = event.currentTarget;
  if (!(btn instanceof HTMLElement)) return;
  const appId = btn.dataset.appId;
  if (!appId) return;

  if (!state.me) {
    goToLogin();
    return;
  }

  btn.setAttribute("disabled", "disabled");
  try {
    const res = await apiFetch("/actions", {
      method: "POST",
      body: JSON.stringify({
        app_id: appId,
        action_type: "favorite_toggle",
        payload: { source: "portal_card" },
      }),
    });

    if (res.status === 401) {
      state.me = null;
      state.favorites = new Set();
      renderAuth();
      renderGrid();
      goToLogin();
      return;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    const active = !!payload?.is_favorite;
    if (active) state.favorites.add(String(appId));
    else state.favorites.delete(String(appId));
    renderGrid();
  } catch (err) {
    console.error("Failed to toggle favorite:", err);
  } finally {
    btn.removeAttribute("disabled");
  }
}

async function trackOpenTool(appId) {
  if (!state.me || !appId) return;
  try {
    await apiFetch("/actions", {
      method: "POST",
      keepalive: true,
      body: JSON.stringify({
        app_id: appId,
        action_type: "open_tool",
        payload: { source: "portal_card" },
      }),
    });
  } catch (err) {
    console.warn("track open failed:", err);
  }
}

function onOpenToolClick(event) {
  const link = event.currentTarget;
  if (!(link instanceof HTMLElement)) return;
  const card = link.closest(".tool-card");
  if (!(card instanceof HTMLElement)) return;
  const appId = card.dataset.appId;
  if (appId) {
    void trackOpenTool(appId);
  }
}

function bindEvents() {
  if (els.search) {
    els.search.addEventListener("input", () => {
      state.query = els.search.value || "";
      renderGrid();
    });
  }

  if (els.loginBtn) {
    els.loginBtn.addEventListener("click", goToLogin);
  }

  if (els.logoutBtn) {
    els.logoutBtn.addEventListener("click", () => {
      void logout();
    });
  }
}

async function bootstrap() {
  bindEvents();
  await loadApps();
  await loadMe();
}

void bootstrap();
