const state = {
  apps: [],
  query: "",
  activeCategory: "全部",
  me: null,
  favorites: new Set(),
};

const API_BASE = ["127.0.0.1", "localhost"].includes(window.location.hostname)
  ? "https://www.scansci.com/api"
  : "/api";

const els = {
  search: document.getElementById("globalSearch"),
  filters: document.getElementById("categoryFilters"),
  grid: document.getElementById("toolGrid"),
  empty: document.getElementById("emptyState"),
  error: document.getElementById("errorState"),
  count: document.getElementById("toolCount"),
  authDock: document.getElementById("authDock"),
  authModal: document.getElementById("authModal"),
  closeAuthModalBtn: document.getElementById("closeAuthModalBtn"),
  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  githubLinkBtn: document.getElementById("githubLinkBtn"),
  userMiniCard: document.getElementById("userMiniCard"),
  userAvatar: document.getElementById("userAvatar"),
  userName: document.getElementById("userName"),
  emailInput: document.getElementById("emailInput"),
  emailCodeInput: document.getElementById("emailCodeInput"),
  sendCodeBtn: document.getElementById("sendCodeBtn"),
  emailLoginBtn: document.getElementById("emailLoginBtn"),
  authHint: document.getElementById("authHint"),
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isModalOpen() {
  return !!els.authModal && !els.authModal.hidden;
}

function openAuthModal() {
  if (!els.authModal) return;
  els.authModal.hidden = false;
  document.body.classList.add("is-modal-open");
  window.setTimeout(() => {
    if (els.emailInput) els.emailInput.focus();
  }, 10);
}

function closeAuthModal() {
  if (!els.authModal) return;
  els.authModal.hidden = true;
  document.body.classList.remove("is-modal-open");
}

function setAuthHint(message, type = "info") {
  if (!els.authHint) return;
  if (!message) {
    els.authHint.hidden = true;
    els.authHint.textContent = "";
    els.authHint.classList.remove("is-error", "is-success");
    return;
  }
  els.authHint.hidden = false;
  els.authHint.textContent = message;
  els.authHint.classList.remove("is-error", "is-success");
  if (type === "error") els.authHint.classList.add("is-error");
  if (type === "success") els.authHint.classList.add("is-success");
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

function favoriteLabel(appId) {
  return isFavorite(appId) ? "取消常用" : "加入常用";
}

function cardTemplate(app) {
  const appId = String(app.id || "");
  const appClass = appId.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const favoriteCls = isFavorite(appId) ? " is-active" : "";

  return `
    <article class="tool-card tool-card--${escapeHtml(appClass)}" data-app-id="${escapeHtml(appId)}">
      <a class="tool-card__link" href="${escapeHtml(app.url || "#")}" target="_self" rel="noopener" data-action="open">
        <div class="tool-card__figure">
          <img src="${escapeHtml(app.cover || "./assets/covers/default.svg")}" alt="${escapeHtml(app.name)} 封面" loading="lazy" />
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
          <button
            class="tool-card__fav${favoriteCls}"
            type="button"
            data-app-id="${escapeHtml(appId)}"
            data-action="favorite"
            title="${favoriteLabel(appId)}"
            aria-label="${favoriteLabel(appId)}"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 20.4 4.8 14a4.7 4.7 0 0 1 6.5-6.8L12 8l.7-.8a4.7 4.7 0 0 1 6.5 6.8L12 20.4z"></path>
            </svg>
          </button>
          <a class="tool-card__action" href="${escapeHtml(app.url || "#")}" target="_self" rel="noopener">立即使用 →</a>
        </div>
      </div>
    </article>
  `;
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
  const loggedIn = !!state.me;

  if (els.authDock) {
    els.authDock.hidden = !loggedIn;
  }

  if (els.userMiniCard) {
    els.userMiniCard.hidden = !loggedIn;
  }

  if (!loggedIn) {
    setAuthHint("");
    return;
  }

  if (els.userAvatar) {
    els.userAvatar.src = state.me.avatar_url || "./assets/brand/dataraven-crow-only.svg";
    els.userAvatar.width = 34;
    els.userAvatar.height = 34;
    els.userAvatar.style.width = "34px";
    els.userAvatar.style.height = "34px";
    els.userAvatar.style.maxWidth = "34px";
    els.userAvatar.style.maxHeight = "34px";
    els.userAvatar.style.borderRadius = "50%";
    els.userAvatar.style.objectFit = "cover";
    els.userAvatar.style.objectPosition = "center";
    els.userAvatar.style.display = "block";
  }

  if (els.userName) {
    els.userName.textContent = state.me.login || "用户";
  }

  if (els.githubLinkBtn) {
    els.githubLinkBtn.hidden = !!state.me.github_linked;
  }

  if (isModalOpen()) {
    closeAuthModal();
  }
}

async function loadApps() {
  try {
    const res = await fetch("./data/apps.json", { cache: "force-cache" });
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

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function messageFromError(payload, fallback) {
  if (!payload?.error) return fallback;
  const map = {
    unauthorized: "请先登录后再操作。",
    invalid_email: "邮箱格式不正确。",
    invalid_code: "验证码不正确。",
    invalid_or_expired_code: "验证码无效或已过期。",
    too_many_requests: "请求过于频繁，请稍后再试。",
    too_many_attempts: "验证码尝试次数过多，请重新发送。",
    provider_unavailable: "邮件服务暂不可用，请稍后再试。",
    config_error: `服务端缺少配置：${payload?.missing || "未知"}`,
  };
  return map[payload.error] || fallback;
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

function goToGithubLogin() {
  const returnTo = `${window.location.pathname}${window.location.search}`;
  const url = `${API_BASE}/auth/github/start?return_to=${encodeURIComponent(returnTo)}`;
  window.location.href = url;
}

function goToGithubLink() {
  const returnTo = `${window.location.pathname}${window.location.search}`;
  const url = `${API_BASE}/auth/github/link/start?return_to=${encodeURIComponent(returnTo)}`;
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

async function requestEmailCode() {
  const email = String(els.emailInput?.value || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    setAuthHint("请输入有效邮箱地址。", "error");
    return;
  }

  if (els.sendCodeBtn) els.sendCodeBtn.setAttribute("disabled", "disabled");
  try {
    const res = await apiFetch("/auth/email/request-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    const payload = await safeJson(res);
    if (!res.ok) {
      setAuthHint(messageFromError(payload, "验证码发送失败，请稍后重试。"), "error");
      return;
    }

    let hint = "验证码已发送，请查收邮箱。";
    if (payload?.dev_preview_code) {
      hint += ` (开发码: ${payload.dev_preview_code})`;
    }
    setAuthHint(hint, "success");
  } catch (err) {
    console.error(err);
    setAuthHint("验证码发送失败，请稍后重试。", "error");
  } finally {
    if (els.sendCodeBtn) els.sendCodeBtn.removeAttribute("disabled");
  }
}

async function loginByEmailCode() {
  const email = String(els.emailInput?.value || "").trim().toLowerCase();
  const code = String(els.emailCodeInput?.value || "").trim();

  if (!isValidEmail(email)) {
    setAuthHint("请输入有效邮箱地址。", "error");
    return;
  }
  if (!/^\d{6}$/.test(code)) {
    setAuthHint("请输入6位数字验证码。", "error");
    return;
  }

  if (els.emailLoginBtn) els.emailLoginBtn.setAttribute("disabled", "disabled");
  try {
    const res = await apiFetch("/auth/email/verify-code", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
    const payload = await safeJson(res);
    if (!res.ok) {
      setAuthHint(messageFromError(payload, "邮箱登录失败，请重试。"), "error");
      return;
    }

    state.me = payload?.user || null;
    state.favorites = new Set((payload?.favorites || []).map((x) => String(x)));
    if (els.emailCodeInput) els.emailCodeInput.value = "";
    setAuthHint("");
    renderAuth();
    renderGrid();
  } catch (err) {
    console.error(err);
    setAuthHint("邮箱登录失败，请重试。", "error");
  } finally {
    if (els.emailLoginBtn) els.emailLoginBtn.removeAttribute("disabled");
  }
}

async function onFavoriteClick(event) {
  event.preventDefault();
  event.stopPropagation();

  const btn = event.currentTarget;
  if (!(btn instanceof HTMLElement)) return;
  const appId = btn.dataset.appId;
  if (!appId) return;

  if (!state.me) {
    setAuthHint("请先登录，再收藏常用工具。", "error");
    openAuthModal();
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
      setAuthHint("登录已过期，请重新登录。", "error");
      openAuthModal();
      return;
    }

    const payload = await safeJson(res);
    if (!res.ok) {
      console.error(payload);
      return;
    }

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

  if (els.closeAuthModalBtn) {
    els.closeAuthModalBtn.addEventListener("click", closeAuthModal);
  }

  if (els.authModal) {
    els.authModal.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.authClose === "true") {
        closeAuthModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isModalOpen()) {
      closeAuthModal();
    }
  });

  if (els.loginBtn) {
    els.loginBtn.addEventListener("click", goToGithubLogin);
  }

  if (els.githubLinkBtn) {
    els.githubLinkBtn.addEventListener("click", goToGithubLink);
  }

  if (els.logoutBtn) {
    els.logoutBtn.addEventListener("click", () => {
      void logout();
    });
  }

  if (els.sendCodeBtn) {
    els.sendCodeBtn.addEventListener("click", () => {
      void requestEmailCode();
    });
  }

  if (els.emailLoginBtn) {
    els.emailLoginBtn.addEventListener("click", () => {
      void loginByEmailCode();
    });
  }

  if (els.emailCodeInput) {
    els.emailCodeInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void loginByEmailCode();
      }
    });
  }
}

async function bootstrap() {
  bindEvents();
  await loadApps();
  await loadMe();
}

void bootstrap();
