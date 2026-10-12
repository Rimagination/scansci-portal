const state = {
  apps: [],
  query: "",
  activeFilter: "all",
  currentView: "online",
  viewMode: "all",
  me: null,
  favorites: new Set(),
  cardOrders: {},
  accountVersion: 0,
  authModalSource: "",
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
  catalogTitle: document.getElementById("catalogTitle"),
  orderStatus: document.getElementById("cardOrderStatus"),
  stats: document.querySelector(".stats-inline"),
  miniProgramNotice: document.querySelector(".miniprogram-notice"),
  openMiniProgramNoticeBtn: document.getElementById("openMiniProgramNoticeBtn"),
  miniProgramNoticePopover: document.getElementById("miniProgramNoticePopover"),
  onlineToolsView: document.getElementById("onlineToolsView"),
  openSourceView: document.getElementById("openSourceView"),
  easymdView: document.getElementById("easymdView"),
  easymdRoot: document.getElementById("easymdRoot"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  authDock: document.getElementById("authDock"),
  authModal: document.getElementById("authModal"),
  closeAuthModalBtn: document.getElementById("closeAuthModalBtn"),
  loginBtn: document.getElementById("loginBtn"),
  guestAuthCard: document.getElementById("guestAuthCard"),
  guestLoginBtn: document.getElementById("guestLoginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  githubLinkBtn: document.getElementById("githubLinkBtn"),
  userMiniCard: document.getElementById("userMiniCard"),
  userAccountBtn: document.getElementById("userAccountBtn"),
  userAccountMenu: document.getElementById("userAccountMenu"),
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

function viewFromLocation() {
  if (/^\/easymd(?:\/|$)/.test(window.location.pathname) || window.location.hash === "#easymd") return "easymd";
  if (window.location.hash === "#materials") return "materials";
  return window.location.hash === "#open-source" ? "open-source" : "online";
}

function urlForView(view) {
  if (view === "easymd") return "/easymd/";
  const query = window.location.pathname === "/" ? window.location.search : "";
  const hash = view === "materials" ? "#materials" : view === "open-source" ? "#open-source" : "#online-tools";
  return `/${query}${hash}`;
}

function setSidebarCollapsed(collapsed) {
  document.documentElement.classList.toggle("is-sidebar-collapsed", collapsed);
  if (els.sidebarToggle) {
    const label = collapsed ? "展开侧边栏" : "折叠侧边栏";
    els.sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
    els.sidebarToggle.setAttribute("aria-label", label);
    els.sidebarToggle.title = label;
  }
  try {
    window.localStorage.setItem("scansci:sidebarCollapsed", String(collapsed));
  } catch {
    // The navigation still works when browser storage is unavailable.
  }
}

async function loadEasyMD() {
  if (!els.easymdRoot || state.easymdLoading) return;
  state.easymdLoading = true;
  try {
    const editor = await import("/easymd/bootstrap.js?v=20261011-image-upload");
    await editor.mountEasyMD(els.easymdRoot);
    els.easymdRoot.setAttribute("aria-busy", "false");
  } catch (error) {
    state.easymdLoading = false;
    els.easymdRoot.setAttribute("aria-busy", "false");
    els.easymdRoot.replaceChildren();
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "重新打开编辑器";
    retry.className = "easymd-retry";
    retry.addEventListener("click", () => void loadEasyMD());
    els.easymdRoot.append(retry);
    console.error("Could not open EasyMD:", error);
  }
}

function restoreSidebar() {
  let collapsed = false;
  try {
    collapsed = window.localStorage.getItem("scansci:sidebarCollapsed") === "true";
  } catch {
    // Keep the expanded default when browser storage is unavailable.
  }
  setSidebarCollapsed(collapsed);
}

function updateNavViewState(view) {
  const favoritesView = state.viewMode === "favorites";
  els.navViewItems.forEach((item) => {
    const active = !favoritesView && item.dataset.view === view;
    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  els.navActions.forEach((item) => {
    const active = favoritesView && item.dataset.navAction === "favorites";
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
}

function setPortalView(view, options = {}) {
  const nextView = ["online", "materials", "open-source", "easymd"].includes(view) ? view : "online";
  const { updateHash = true } = options;
  if (state.currentView !== nextView) state.activeFilter = "all";
  finishCardDrag(false);
  state.currentView = nextView;
  renderCardOrderStatus();

  if (els.onlineToolsView) {
    els.onlineToolsView.hidden = !["online", "materials"].includes(nextView);
    els.onlineToolsView.dataset.portalView = nextView;
    els.onlineToolsView.setAttribute("aria-label", nextView === "materials" ? "素材库" : "在线轻工具");
  }
  if (els.catalogTitle) els.catalogTitle.hidden = nextView !== "materials";
  if (els.stats) els.stats.hidden = nextView === "materials";
  if (els.miniProgramNotice) els.miniProgramNotice.hidden = nextView === "materials";
  if (nextView !== "online") els.miniProgramNoticePopover?.hidePopover();
  if (els.filters) els.filters.hidden = nextView !== "online" || state.viewMode === "favorites";
  if (els.openSourceView) els.openSourceView.hidden = nextView !== "open-source";
  if (els.easymdView) els.easymdView.hidden = nextView !== "easymd";
  document.body.classList.toggle("is-easymd", nextView === "easymd");
  document.title = nextView === "easymd" ? "EasyMD | ScanSci" : nextView === "materials" ? "素材库 | ScanSci" : "ScanSci | 学术工具门户";
  if (nextView === "easymd") void loadEasyMD();
  updateNavViewState(nextView);

  if (els.count && nextView === "open-source") {
    const count = els.openSourceView?.querySelectorAll(".open-source-card").length || 0;
    els.count.textContent = `${count} 个开源工具`;
  }

  if (["online", "materials"].includes(nextView)) {
    renderFilters();
    renderGrid();
  }

  const targetUrl = urlForView(nextView);
  if (updateHash && `${window.location.pathname}${window.location.search}${window.location.hash}` !== targetUrl) {
    window.history.pushState(null, "", targetUrl);
    window.scrollTo(0, 0);
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
  els.miniProgramNoticePopover?.hidePopover();
  els.miniProgramPopup.hidden = false;
  document.body.classList.add("is-miniprogram-popup-open");
  window.setTimeout(() => {
    if (els.closeMiniProgramPopupBtn) els.closeMiniProgramPopupBtn.focus();
  }, 10);
}

function closeMiniProgramPopup() {
  if (!els.miniProgramPopup) return;
  els.miniProgramPopup.hidden = true;
  document.body.classList.remove("is-miniprogram-popup-open");
  els.openMiniProgramNoticeBtn?.focus({ preventScroll: true });
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

function readerAuthReturnTo() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("reader_login") !== "1") return "";
  try {
    const target = new URL(params.get("return_to") || "", window.location.origin);
    if (target.origin === "https://reader.scansci.com" && !target.username && !target.password) return target.href;
    if (target.origin !== window.location.origin || !/^\/reader(?:\/|$)/.test(target.pathname)) return "";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "";
  }
}

function finishAuthenticatedPromptFlow() {
  if (!state.me) return;
  const readerReturnTo = readerAuthReturnTo();
  if (readerReturnTo) {
    window.location.replace(readerReturnTo);
    return;
  }
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
    app.summary,
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

function getSectionApps() {
  const materials = state.currentView === "materials";
  return state.apps.filter((app) => (app.section === "materials") === materials);
}

function getVisibleApps() {
  const q = normalize(state.query);
  const favoritesView = state.viewMode === "favorites";
  const apps = favoritesView
    ? state.apps.filter((app) => isFavorite(app.id))
    : orderedCards(getSectionApps(), state.currentView);
  return apps.filter((app) => (favoritesView || state.currentView === "materials" || matchesFilter(app, state.activeFilter)) && matchesQuery(app, q));
}

function isFavorite(appId) {
  return state.favorites.has(String(appId));
}

function favoriteLabel(appId) {
  return isFavorite(appId) ? "取消常用" : "加入常用";
}

const cardOrderQueues = new Map();
const cardOrderFeedback = new Map();
let activeCardDrag = null;
let suppressCardClickUntil = 0;

function restoreCardOrders(payload = null) {
  state.accountVersion += 1;
  state.cardOrders = {};
  if (state.me) {
    for (const section of ["online", "materials", "open-source"]) {
      const ids = payload?.card_orders?.[section];
      if (Array.isArray(ids)) state.cardOrders[section] = [...new Set(ids.filter(id => typeof id === "string"))];
    }
  }
  cardOrderFeedback.clear();
  finishCardDrag(false);
  applyOpenSourceOrder();
  renderCardOrderStatus();
}

function orderedCards(cards, section) {
  const rank = new Map((state.cardOrders[section] || []).map((id, index) => [id, index]));
  return [...cards].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity));
}

function cardOrderHandle(id, name) {
  if (state.viewMode === "favorites") return "";
  const label = state.me ? `拖动调整 ${name} 顺序；也可使用方向键` : `登录后调整 ${name} 顺序`;
  return `<button class="card-order-handle" type="button" data-card-move="${escapeHtml(id)}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-vertical" aria-hidden="true"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg></button>`;
}

function initCardOrdering() {
  const grid = els.openSourceView?.querySelector(".open-source-grid");
  grid?.querySelectorAll("a.open-source-card").forEach((link, index) => {
    const card = document.createElement("article");
    card.className = "open-source-card";
    card.dataset.defaultOrder = String(index);
    card.dataset.appId = `open-source-${new URL(link.href).pathname.split("/").at(-1).toLowerCase().replace(/[^a-z0-9_-]/g, "-")}`;
    link.replaceWith(card);
    link.className = "open-source-card__link";
    card.append(link);
    card.insertAdjacentHTML("beforeend", cardOrderHandle(card.dataset.appId, link.querySelector("strong").textContent));
  });
  for (const collection of [els.grid, grid]) {
    collection?.addEventListener("pointerdown", beginCardDrag);
    collection?.addEventListener("keydown", onCardOrderKey);
    collection?.addEventListener("dragstart", event => {
      if (activeCardDrag?.card.contains(event.target)) event.preventDefault();
    });
    collection?.addEventListener("click", event => {
      if (event.target.closest(".card-order-handle")) {
        event.preventDefault();
        event.stopPropagation();
        if (!state.me) openAuthModal();
      }
    });
  }
  document.addEventListener("click", event => {
    if (performance.now() < suppressCardClickUntil && event.target.closest(".tool-card, .open-source-card")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressCardClickUntil = 0;
    }
  }, true);
}

function applyOpenSourceOrder() {
  const grid = els.openSourceView?.querySelector(".open-source-grid");
  if (!grid) return;
  const cards = [...grid.children].sort((a, b) => Number(a.dataset.defaultOrder) - Number(b.dataset.defaultOrder)).map(element => ({ id: element.dataset.appId, element }));
  for (const { element } of cards) {
    const name = element.querySelector("strong").textContent;
    const handle = element.querySelector(".card-order-handle");
    const label = state.me ? `拖动调整 ${name} 顺序；也可使用方向键` : `登录后调整 ${name} 顺序`;
    handle.title = label;
    handle.setAttribute("aria-label", label);
  }
  for (const { element } of orderedCards(cards, "open-source")) grid.append(element);
}

function renderCardOrderStatus() {
  if (!els.orderStatus) return;
  const feedback = cardOrderFeedback.get(state.currentView);
  els.orderStatus.hidden = !feedback;
  els.orderStatus.replaceChildren();
  if (!feedback) return;
  els.orderStatus.append(document.createTextNode(feedback.message));
  if (feedback.retry) {
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "card-order-retry";
    retry.textContent = "重新保存";
    retry.addEventListener("click", () => saveCardOrder(state.currentView));
    els.orderStatus.append(retry);
  }
}

function saveCardOrder(section) {
  const userId = state.me?.id;
  const version = state.accountVersion;
  const order = state.cardOrders[section];
  if (!userId || !order) return;
  cardOrderFeedback.set(section, { message: "正在保存卡片顺序…" });
  renderCardOrderStatus();
  const task = (cardOrderQueues.get(section) || Promise.resolve()).catch(() => {}).then(async () => {
    if (state.accountVersion !== version || state.cardOrders[section] !== order) return;
    try {
      const response = await apiFetch("/me/card-order", { method: "POST", body: JSON.stringify({ section, app_ids: order, expected_user_id: userId }) });
      if (state.accountVersion !== version) return;
      if (response.status === 401) {
        state.me = null;
        state.favorites = new Set();
        restoreCardOrders();
        renderAuth();
        renderGrid();
        setAuthHint("登录已过期，请重新登录。", "error");
        openAuthModal();
        return;
      }
      if (response.status === 409) {
        await loadMe();
        return;
      }
      const payload = await safeJson(response);
      if (!response.ok || !payload?.ok || payload.user_id !== userId) throw Error("card_order_save_failed");
      if (state.cardOrders[section] === order) cardOrderFeedback.delete(section);
    } catch {
      if (state.accountVersion === version && state.cardOrders[section] === order) {
        cardOrderFeedback.set(section, { message: "卡片顺序暂未保存，请重试。", retry: true });
      }
    }
    renderCardOrderStatus();
  });
  cardOrderQueues.set(section, task);
}

function moveCard(section, sourceId, targetId, after) {
  const all = section === "open-source"
    ? [...els.openSourceView.querySelector(".open-source-grid").children].map(el => ({ id: el.dataset.appId }))
    : state.apps.filter(app => (app.section === "materials") === (section === "materials"));
  const ids = orderedCards(all, section).map(app => app.id);
  if (!ids.includes(sourceId) || !ids.includes(targetId) || sourceId === targetId) return;
  const original = ids.join(",");
  ids.splice(ids.indexOf(sourceId), 1);
  ids.splice(ids.indexOf(targetId) + Number(after), 0, sourceId);
  if (ids.join(",") === original) return;
  state.cardOrders[section] = ids;
  if (section === "open-source") applyOpenSourceOrder();
  else renderGrid();
  saveCardOrder(section);
}

function onCardOrderKey(event) {
  const handle = event.target.closest(".card-order-handle");
  if (!handle || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  finishCardDrag(false);
  if (!state.me) { openAuthModal(); return; }
  const grid = event.currentTarget;
  const ids = [...grid.children].map(el => el.dataset.appId);
  const index = ids.indexOf(handle.dataset.cardMove);
  const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
  const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[event.key];
  const destination = event.key === "Home" ? 0 : event.key === "End" ? ids.length - 1 : Math.max(0, Math.min(ids.length - 1, index + delta));
  moveCard(state.currentView, ids[index], ids[destination], destination > index);
  grid.querySelector(`[data-card-move="${handle.dataset.cardMove}"]`)?.focus({ preventScroll: true });
}

function dragDestination(drag) {
  const bounds = drag.grid.getBoundingClientRect();
  if (drag.x < bounds.left || drag.x > bounds.right || drag.y < bounds.top || drag.y > bounds.bottom) return null;
  let nearest = null;
  let distance = Infinity;
  for (const card of drag.grid.children) {
    const rect = card.getBoundingClientRect();
    const value = Math.hypot(Math.max(rect.left - drag.x, 0, drag.x - rect.right), Math.max(rect.top - drag.y, 0, drag.y - rect.bottom));
    if (value < distance) { nearest = card; distance = value; }
  }
  if (!nearest || nearest === drag.card) return null;
  const rect = nearest.getBoundingClientRect();
  const after = drag.columns === 1 ? drag.y > rect.top + rect.height / 2 : drag.x > rect.left + rect.width / 2;
  return { card: nearest, after };
}

function drawCardDrag() {
  const drag = activeCardDrag;
  if (!drag?.preview) return;
  drag.preview.style.transform = `translate3d(${drag.left + drag.x - drag.startX}px, ${drag.top + drag.y - drag.startY}px, 0)`;
  const speed = drag.y < 64 ? -Math.ceil((64 - drag.y) / 5) : drag.y > innerHeight - 64 ? Math.ceil((drag.y - innerHeight + 64) / 5) : 0;
  if (speed) window.scrollBy(0, speed);
  drag.target?.card.classList.remove("is-card-drop-target");
  drag.target = dragDestination(drag);
  drag.target?.card.classList.add("is-card-drop-target");
  drag.frame = requestAnimationFrame(drawCardDrag);
}

function beginCardDrag(event) {
  if (state.viewMode === "favorites") return;
  const handle = event.target.closest(".card-order-handle");
  const card = event.target.closest(".tool-card, .open-source-card");
  if (!card || event.button !== 0 || !event.isPrimary || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!handle && (event.pointerType !== "mouse" || event.target.closest("button, input, select, textarea"))) return;
  if (!state.me) { if (handle) { event.preventDefault(); openAuthModal(); } return; }
  if (handle) event.preventDefault();
  finishCardDrag(false);
  const rect = card.getBoundingClientRect();
  handle?.focus({ preventScroll: true });
  activeCardDrag = { handle, captureTarget: handle || card, card, grid: event.currentTarget, section: state.currentView, pointer: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height, columns: getComputedStyle(event.currentTarget).gridTemplateColumns.split(" ").length };
  handle?.setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", moveCardDrag);
  window.addEventListener("pointerup", endCardDrag);
  window.addEventListener("pointercancel", cancelCardDrag);
  window.addEventListener("blur", cancelCardDrag);
}

function moveCardDrag(event) {
  const drag = activeCardDrag;
  if (!drag || event.pointerId !== drag.pointer) return;
  drag.x = event.clientX;
  drag.y = event.clientY;
  if (!drag.preview && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) >= 6) {
    drag.captureTarget.setPointerCapture(drag.pointer);
    drag.preview = drag.card.cloneNode(true);
    drag.preview.removeAttribute("data-app-id");
    drag.preview.setAttribute("aria-hidden", "true");
    drag.preview.inert = true;
    drag.preview.classList.add("card-drag-preview");
    drag.preview.style.width = `${drag.width}px`;
    drag.preview.style.height = `${drag.height}px`;
    document.body.append(drag.preview);
    drag.card.classList.add("is-card-dragging");
    document.body.classList.add("is-card-ordering");
    drawCardDrag();
  }
}

function endCardDrag(event) {
  if (event.pointerId !== activeCardDrag?.pointer) return;
  activeCardDrag.x = event.clientX;
  activeCardDrag.y = event.clientY;
  finishCardDrag(true);
}

function cancelCardDrag() { finishCardDrag(false); }

function finishCardDrag(commit) {
  const drag = activeCardDrag;
  if (!drag) return;
  activeCardDrag = null;
  const target = drag.preview ? dragDestination(drag) : null;
  cancelAnimationFrame(drag.frame);
  drag.preview?.remove();
  drag.target?.card.classList.remove("is-card-drop-target");
  drag.card.classList.remove("is-card-dragging");
  document.body.classList.remove("is-card-ordering");
  if (drag.captureTarget.hasPointerCapture(drag.pointer)) drag.captureTarget.releasePointerCapture(drag.pointer);
  window.removeEventListener("pointermove", moveCardDrag);
  window.removeEventListener("pointerup", endCardDrag);
  window.removeEventListener("pointercancel", cancelCardDrag);
  window.removeEventListener("blur", cancelCardDrag);
  if (drag.preview) suppressCardClickUntil = performance.now() + 350;
  if (commit && target) moveCard(drag.section, drag.card.dataset.appId, target.card.dataset.appId, target.after);
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
          <img src="${escapeHtml((app.cover || "/assets/covers/default.svg").replace(/^\.\//, "/"))}" alt="${escapeHtml(app.name)} 封面" loading="lazy" />
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
        <p class="tool-card__desc">${escapeHtml(String(app.summary || app.description || "").trim())}</p>
      </div>
      ${cardOrderHandle(appId, englishTitle)}
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
  updateNavViewState(state.currentView);
  if (els.filters) els.filters.hidden = state.currentView !== "online" || state.viewMode === "favorites";
  const visible = getVisibleApps();
  els.grid.innerHTML = visible.map((app) => cardTemplate(app)).join("");
  els.empty.hidden = visible.length !== 0;
  if (state.viewMode === "favorites") {
    els.count.textContent = `共 ${visible.length} 个收藏`;
  } else if (["online", "materials"].includes(state.currentView)) {
    const label = state.currentView === "materials" ? "素材库" : "在线轻工具";
    els.count.textContent = `共 ${visible.length} / ${getSectionApps().length} 个${label}`;
  }
  els.empty.textContent = state.viewMode === "favorites"
    ? "还没有收藏的卡片。点击卡片上的心形图标即可收藏。"
    : state.currentView === "materials" ? "未找到匹配素材库，请调整关键词。" : "未找到匹配轻工具，请调整关键词或分类。";

  els.grid.querySelectorAll('[data-action="favorite"]').forEach((btn) => {
    btn.addEventListener("click", onFavoriteClick);
  });

  els.grid.querySelectorAll('[data-action="open"]').forEach((link) => {
    link.addEventListener("click", onOpenToolClick);
  });

}

function renderAuth() {
  const loggedIn = !!state.me;
  if (!loggedIn && state.viewMode === "favorites") state.viewMode = "all";

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
    els.userAccountMenu?.hidePopover();
    setAuthHint("");
    return;
  }

  if (els.userAvatar) {
    els.userAvatar.src = state.me.avatar_url || "/assets/brand/dataraven-crow-only.svg";
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
    const res = await fetch("/data/apps.json?v=20261012-catalog-v2", { cache: "no-store" });
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
      restoreCardOrders();
      state.viewMode = "all";
      renderAuth();
      renderGrid();
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    state.me = payload?.user || null;
    state.favorites = new Set((payload?.favorites || []).map((x) => String(x)));
    restoreCardOrders(payload);
    finishAuthenticatedPromptFlow();
  } catch (err) {
    console.warn("Auth API unavailable, running as guest:", err);
    state.me = null;
    state.favorites = new Set();
    restoreCardOrders();
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
  restoreCardOrders();
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
    restoreCardOrders(payload);
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
      restoreCardOrders();
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
  initCardOrdering();
  if (els.openMiniProgramNoticeBtn && els.miniProgramNoticePopover) {
    const trigger = els.openMiniProgramNoticeBtn;
    const card = els.miniProgramNoticePopover;
    let pinned = false;
    let closeTimer;
    const position = () => {
      const rect = trigger.getBoundingClientRect();
      card.style.left = Math.max(12, Math.min(rect.left, innerWidth - card.offsetWidth - 12)) + "px";
      card.style.top = Math.max(12, Math.min(rect.bottom + 8 + card.offsetHeight > innerHeight ? rect.top - card.offsetHeight - 8 : rect.bottom + 8, innerHeight - card.offsetHeight - 12)) + "px";
    };
    const show = () => {
      clearTimeout(closeTimer);
      card.showPopover();
      position();
    };
    card.addEventListener("beforetoggle", event => {
      trigger.setAttribute("aria-expanded", String(event.newState === "open"));
      if (event.newState === "closed") {
        pinned = false;
        clearTimeout(closeTimer);
      }
    });
    trigger.addEventListener("click", event => {
      event.preventDefault();
      if (pinned && card.matches(":popover-open")) card.hidePopover();
      else {
        pinned = true;
        show();
      }
    });
    for (const element of [trigger, card]) {
      element.addEventListener("pointerenter", event => {
        if (event.pointerType === "mouse") show();
      });
      element.addEventListener("pointerleave", event => {
        if (event.pointerType === "mouse" && !pinned) closeTimer = setTimeout(() => card.hidePopover(), 180);
      });
    }
    window.addEventListener("scroll", () => card.hidePopover());
    window.addEventListener("resize", () => {
      if (card.matches(":popover-open")) position();
    });
  }
  els.userAccountMenu?.addEventListener("toggle", event => {
    const open = event.newState === "open";
    els.userAccountBtn.setAttribute("aria-expanded", String(open));
    if (!open) return;
    const rect = els.userAccountBtn.getBoundingClientRect();
    const menu = els.userAccountMenu;
    menu.style.left = Math.max(12, Math.min(rect.left, innerWidth - menu.offsetWidth - 12)) + "px";
    menu.style.top = Math.max(12, Math.min(rect.top > innerHeight / 2 ? rect.top - menu.offsetHeight - 8 : rect.bottom + 8, innerHeight - menu.offsetHeight - 12)) + "px";
    menu.querySelector("button:not([hidden])")?.focus({ preventScroll: true });
  });
  window.addEventListener("resize", () => els.userAccountMenu?.hidePopover());
  els.sidebarToggle?.addEventListener("click", () => {
    setSidebarCollapsed(!document.documentElement.classList.contains("is-sidebar-collapsed"));
  });
  if (els.search) {
    els.search.addEventListener("input", () => {
      state.query = els.search.value || "";
      renderGrid();
    });
  }

  els.navViewItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      state.viewMode = "all";
      setPortalView(item.dataset.view || "online");
    });
  });

  window.addEventListener("hashchange", () => {
    setPortalView(viewFromLocation(), { updateHash: false });
  });

  window.addEventListener("popstate", () => {
    setPortalView(viewFromLocation(), { updateHash: false });
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
    els.closeMiniProgramPopupBtn.addEventListener("click", closeMiniProgramPopup);
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
      els.userAccountMenu?.hidePopover();
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
      state.viewMode = action === "favorites" ? "favorites" : "all";
      setPortalView("online");
      if (action === "favorites" && !state.me) {
        setAuthHint("请先登录，再查看收藏的卡片。", "error");
        openAuthModal();
      }
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
  restoreSidebar();
  bindEvents();
  setPortalView(viewFromLocation(), { updateHash: false });
  await loadApps();
  await loadMe();
  if (!state.me && readerAuthReturnTo()) openAuthModal();
  void loadStats();
}

void bootstrap();
