const state = {
  apps: [],
  query: "",
  activeFilter: "all",
  currentView: "online",
  viewMode: "all",
  me: null,
  favorites: new Set(),
  authModalSource: "",
};

const API_BASE = ["127.0.0.1", "localhost"].includes(window.location.hostname)
  ? "https://www.scansci.com/api"
  : "/api";

const MINIPROGRAM_POPUP_SEEN_KEY = "scansci:miniprogram-popup-seen";

const els = {
  search: document.getElementById("globalSearch"),
  filters: document.getElementById("categoryFilters"),
  grid: document.getElementById("toolGrid"),
  empty: document.getElementById("emptyState"),
  error: document.getElementById("errorState"),
  count: document.getElementById("toolCount"),
  onlineToolsView: document.getElementById("onlineToolsView"),
  openSourceView: document.getElementById("openSourceView"),
  authDock: document.getElementById("authDock"),
  authModal: document.getElementById("authModal"),
  closeAuthModalBtn: document.getElementById("closeAuthModalBtn"),
  loginBtn: document.getElementById("loginBtn"),
  guestAuthCard: document.getElementById("guestAuthCard"),
  guestLoginBtn: document.getElementById("guestLoginBtn"),
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
  miniProgramPopup: document.getElementById("miniProgramPopup"),
  openMiniProgramPopupBtn: document.getElementById("openMiniProgramPopupBtn"),
  closeMiniProgramPopupBtn: document.getElementById("closeMiniProgramPopupBtn"),
  navViewItems: document.querySelectorAll("[data-view]"),
  navActions: document.querySelectorAll("[data-nav-action]"),
};

const FILTERS = [
  { key: "all", label: "在线轻工具", terms: [] },
  { key: "presentation", label: "演示", terms: ["演示", "汇报", "slides", "presentation", "ppt"] },
  { key: "literature", label: "文献", terms: ["文献", "paper", "citation", "graph", "recommendation", "semantic-scholar"] },
  { key: "data", label: "数据", terms: ["数据", "dataset", "open data"] },
  { key: "journal", label: "期刊", terms: ["期刊", "journal", "jcr", "分区", "citescore", "影响因子"] },
  { key: "integrity", label: "引文", terms: ["引文", "参考文献", "integrity", "validation"] },
  { key: "agent", label: "技能", terms: ["agent", "skills", "research workflow", "bioinformatics", "statistics"] },
  { key: "assessment", label: "测评", terms: ["测评", "assessment", "academic personality", "test", "acti"] },
];

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

function isMiniProgramPopupOpen() {
  return !!els.miniProgramPopup && !els.miniProgramPopup.hidden;
}

function hasSeenMiniProgramPopup() {
  try {
    return window.sessionStorage?.getItem(MINIPROGRAM_POPUP_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markMiniProgramPopupSeen() {
  try {
    window.sessionStorage?.setItem(MINIPROGRAM_POPUP_SEEN_KEY, "1");
  } catch {
    // Session storage can be unavailable in strict privacy modes.
  }
}

function viewFromHash() {
  return window.location.hash === "#open-source" ? "open-source" : "online";
}

function hashForView(view) {
  return view === "open-source" ? "#open-source" : "#online-tools";
}

function updateNavViewState(view) {
  els.navViewItems.forEach((item) => {
    const active = item.dataset.view === view;
    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
}

function setPortalView(view, options = {}) {
  const nextView = view === "open-source" ? "open-source" : "online";
  const { updateHash = true } = options;
  state.currentView = nextView;

  if (els.onlineToolsView) els.onlineToolsView.hidden = nextView !== "online";
  if (els.openSourceView) els.openSourceView.hidden = nextView !== "open-source";
  updateNavViewState(nextView);

  if (els.count && nextView === "open-source") {
    const count = els.openSourceView?.querySelectorAll(".open-source-card").length || 0;
    els.count.textContent = `${count} 个开源工具`;
  }

  if (nextView === "online") {
    renderGrid();
  }

  if (updateHash && window.location.hash !== hashForView(nextView)) {
    window.history.pushState(null, "", hashForView(nextView));
  }
}

function anonPrompt() {
  return window.ScanSciAnonPrompt || null;
}

function normalizeAppUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  try {
    return new URL(value, window.location.href).href.replace(/\/$/, "");
  } catch {
    return value.replace(/\/$/, "");
  }
}

function isKnownAppUrl(url) {
  const value = normalizeAppUrl(url);
  if (!value) return false;
  return state.apps.some((app) => normalizeAppUrl(app.url) === value);
}

function navigateToTool(url) {
  const value = String(url || "").trim();
  if (!value || !isKnownAppUrl(value)) return;
  window.location.href = value;
}

function openAuthModal(source = "manual") {
  if (!els.authModal) return;
  state.authModalSource = source;
  els.authModal.hidden = false;
  document.body.classList.add("is-modal-open");
  window.setTimeout(() => {
    if (els.emailInput) els.emailInput.focus();
  }, 10);
}

function closeAuthModal() {
  if (!els.authModal) return;
  const source = state.authModalSource;
  state.authModalSource = "";
  els.authModal.hidden = true;
  document.body.classList.remove("is-modal-open");

  const prompt = anonPrompt();
  if (source === "anon-auto" && prompt) {
    prompt.markDismissed();
    const pendingUrl = prompt.consumePendingToolUrl();
    if (pendingUrl) navigateToTool(pendingUrl);
  }
}

function openMiniProgramPopup() {
  if (!els.miniProgramPopup) return;
  els.miniProgramPopup.hidden = false;
  document.body.classList.add("is-miniprogram-popup-open");
  window.setTimeout(() => {
    if (els.closeMiniProgramPopupBtn) els.closeMiniProgramPopupBtn.focus();
  }, 10);
}

function closeMiniProgramPopup(remember = true) {
  if (!els.miniProgramPopup) return;
  els.miniProgramPopup.hidden = true;
  document.body.classList.remove("is-miniprogram-popup-open");
  if (remember) markMiniProgramPopupSeen();
}

function autoOpenMiniProgramPopup() {
  if (!els.miniProgramPopup || hasSeenMiniProgramPopup()) return;
  window.setTimeout(() => {
    if (!hasSeenMiniProgramPopup() && !isModalOpen()) {
      openMiniProgramPopup();
    }
  }, 650);
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

function finishAuthenticatedPromptFlow() {
  const prompt = anonPrompt();
  if (!prompt || !state.me) return;
  const pendingUrl = prompt.consumePendingToolUrl();
  prompt.clearState();
  state.authModalSource = "";
  if (pendingUrl) navigateToTool(pendingUrl);
}

function appSearchText(app) {
  return [
    app.id,
    app.name,
    app.description,
    app.cover_title,
    app.cover_subtitle,
    app.status,
    app.category,
    ...(Array.isArray(app.tags) ? app.tags : []),
  ]
    .map((item) => normalize(item))
    .join(" ");
}

function matchesQuery(app, query) {
  if (!query) return true;
  const haystack = appSearchText(app);
  return haystack.includes(query);
}

function matchesFilter(app, filterKey) {
  const filter = FILTERS.find((item) => item.key === filterKey) || FILTERS[0];
  if (!filter.terms.length) return true;
  const haystack = appSearchText(app);
  return filter.terms.some((term) => haystack.includes(normalize(term)));
}

function getVisibleApps() {
  const q = normalize(state.query);
  return state.apps.filter((app) => matchesFilter(app, state.activeFilter) && matchesQuery(app, q));
}

function isFavorite(appId) {
  return state.favorites.has(String(appId));
}

function favoriteLabel(appId) {
  return isFavorite(appId) ? "取消常用" : "加入常用";
}

function compactDescription(app) {
  const description = String(app.description || "").trim();
  if (!description) return "";
  const firstSentence = description.match(/^[^。.!?！？]+[。.!?！？]?/)?.[0] || description;
  return firstSentence.length > 58 ? `${firstSentence.slice(0, 56)}…` : firstSentence;
}

function cardTemplate(app) {
  const appId = String(app.id || "");
  const appClass = appId.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const favoriteCls = isFavorite(appId) ? " is-active" : "";
  const appUrl = app.url || "#";
  const englishTitle = app.name || "Untitled Tool";
  const chineseTitle = app.category || "轻工具";
  const statusBadge = app.status
    ? `<span class="tool-card__status">${escapeHtml(app.status)}</span>`
    : "";

  return `
    <article class="tool-card tool-card--${escapeHtml(appClass)}" data-app-id="${escapeHtml(appId)}">
      <a class="tool-card__link" href="${escapeHtml(appUrl)}" target="_self" rel="noopener" data-action="open">
        <div class="tool-card__figure">
          ${statusBadge}
          <img src="${escapeHtml(app.cover || "./assets/covers/default.svg")}" alt="${escapeHtml(app.name)} 封面" loading="lazy" />
          <div class="tool-card__overlay">
            <span class="tool-card__cta">立即使用</span>
          </div>
        </div>
      </a>
      <div class="tool-card__body">
        <div class="tool-card__titlebar">
          <a class="tool-card__title-link" href="${escapeHtml(appUrl)}" target="_self" rel="noopener" data-action="open">
            <h3 class="tool-card__name">
              <span class="tool-card__name-main">${escapeHtml(englishTitle)}</span>
              <span class="tool-card__name-sub">${escapeHtml(chineseTitle)}</span>
            </h3>
          </a>
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
        </div>
        <p class="tool-card__desc">${escapeHtml(compactDescription(app))}</p>
      </div>
    </article>
  `;
}

function renderFilters() {
  if (!els.filters) return;
  els.filters.innerHTML = FILTERS
    .map((filter) => {
      const active = filter.key === state.activeFilter ? " is-active" : "";
      return `<button class="category-filter${active}" type="button" role="tab" aria-selected="${filter.key === state.activeFilter ? "true" : "false"}" data-filter="${escapeHtml(filter.key)}">${escapeHtml(filter.label)}</button>`;
    })
    .join("");

  els.filters.querySelectorAll(".category-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeFilter = btn.dataset.filter || "all";
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
  if (state.currentView === "online") {
    els.count.textContent = `共 ${visible.length} / ${state.apps.length} 个在线轻工具`;
  }
  els.empty.textContent = "未找到匹配轻工具，请调整关键词或分类。";

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
    els.authDock.hidden = false;
  }

  if (els.guestAuthCard) {
    els.guestAuthCard.hidden = loggedIn;
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
    const res = await fetch("./data/apps.json?v=5", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    state.apps = Array.isArray(payload?.apps) ? payload.apps : [];
    if (els.error) els.error.hidden = true;
    setStatVal("statTools", String(state.apps.length));
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
      state.viewMode = "all";
      renderAuth();
      renderGrid();
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    state.me = payload?.user || null;
    state.favorites = new Set((payload?.favorites || []).map((x) => String(x)));
    finishAuthenticatedPromptFlow();
  } catch (err) {
    console.warn("Auth API unavailable, running as guest:", err);
    state.me = null;
    state.favorites = new Set();
    state.viewMode = "all";
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
    finishAuthenticatedPromptFlow();
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
  if (!(link instanceof HTMLAnchorElement)) return;
  const card = link.closest(".tool-card");
  if (!(card instanceof HTMLElement)) return;
  const appId = card.dataset.appId;
  const toolUrl = link.href;

  if (!state.me) {
    const prompt = anonPrompt();
    const promptState = prompt ? prompt.recordToolOpen() : null;
    if (prompt && promptState && prompt.shouldPrompt(promptState) && isKnownAppUrl(toolUrl)) {
      event.preventDefault();
      prompt.setPendingToolUrl(toolUrl);
      openAuthModal("anon-auto");
      return;
    }
  }

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

  els.navViewItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      setPortalView(item.dataset.view || "online");
    });
  });

  window.addEventListener("hashchange", () => {
    setPortalView(viewFromHash(), { updateHash: false });
  });

  window.addEventListener("popstate", () => {
    setPortalView(viewFromHash(), { updateHash: false });
  });

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

  if (els.openMiniProgramPopupBtn) {
    els.openMiniProgramPopupBtn.addEventListener("click", openMiniProgramPopup);
  }

  if (els.closeMiniProgramPopupBtn) {
    els.closeMiniProgramPopupBtn.addEventListener("click", () => {
      closeMiniProgramPopup();
    });
  }

  if (els.miniProgramPopup) {
    els.miniProgramPopup.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.miniprogramClose === "true") {
        closeMiniProgramPopup();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (isModalOpen()) {
      closeAuthModal();
      return;
    }
    if (isMiniProgramPopupOpen()) {
      closeMiniProgramPopup();
    }
  });

  if (els.loginBtn) {
    els.loginBtn.addEventListener("click", goToGithubLogin);
  }

  if (els.guestLoginBtn) {
    els.guestLoginBtn.addEventListener("click", openAuthModal);
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

  els.navActions.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.navAction || "all";
      if (action === "favorites" && !state.me) {
        setAuthHint("请先登录，再查看收藏的轻工具。", "error");
        openAuthModal();
      }
      setPortalView("online");
      state.viewMode = "all";
      renderGrid();
    });
  });
}

// ── Stats ─────────────────────────────────────────────────────

function fmtK(n) {
  if (typeof n !== "number" || isNaN(n)) return "—";
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "w";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function setStatVal(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
}

async function loadStats() {
  try {
    const signal = typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(7000) : undefined;
    const res = await fetch(`${API_BASE}/stats`, { signal });
    if (!res.ok) return;
    const data = await res.json();
    if (data.visitors_24h != null) setStatVal("stat24h", fmtK(data.visitors_24h));
    if (data.visitors_30d != null) setStatVal("stat30d", fmtK(data.visitors_30d));
    if (data.requests_30d != null) setStatVal("statReq", fmtK(data.requests_30d));
  } catch {
    // stats are non-critical, fail silently
  }
}

// ── Bootstrap ─────────────────────────────────────────────────

async function bootstrap() {
  bindEvents();
  setPortalView(viewFromHash(), { updateHash: false });
  autoOpenMiniProgramPopup();
  await loadApps();
  await loadMe();
  void loadStats();
}

void bootstrap();
