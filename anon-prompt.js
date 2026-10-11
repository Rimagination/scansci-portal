(function () {
  const STORAGE_KEY = "scansci:anonPrompt:v1";
  const PROMPT_THRESHOLD = 4;
  const PENDING_TTL_MS = 10 * 60 * 1000;

  function getStorage() {
    try {
      return window.localStorage || null;
    } catch {
      return null;
    }
  }

  function loadState() {
    const storage = getStorage();
    if (!storage) return {};
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveState(state) {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state || {}));
    } catch {
      // Anonymous prompting is non-critical. Fail open if storage is blocked.
    }
  }

  function clearState() {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore blocked storage.
    }
  }

  function todayLocalDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function recordToolOpen() {
    const state = loadState();
    const count = Number.parseInt(String(state.toolOpenCount || "0"), 10);
    state.toolOpenCount = Number.isFinite(count) && count > 0 ? count + 1 : 1;
    saveState(state);
    return state;
  }

  function shouldPrompt(state = loadState(), localDate = todayLocalDate()) {
    const count = Number.parseInt(String(state.toolOpenCount || "0"), 10);
    return count >= PROMPT_THRESHOLD && state.dismissedDate !== localDate;
  }

  function markDismissed(localDate = todayLocalDate()) {
    const state = loadState();
    state.dismissedDate = localDate;
    saveState(state);
    return state;
  }

  function setPendingToolUrl(url, now = Date.now()) {
    const cleanUrl = String(url || "").trim();
    if (!cleanUrl) return;
    const state = loadState();
    state.pendingToolUrl = cleanUrl;
    state.pendingToolSetAt = Number(now) || Date.now();
    saveState(state);
  }

  function consumePendingToolUrl(now = Date.now()) {
    const state = loadState();
    const url = String(state.pendingToolUrl || "").trim();
    const setAt = Number(state.pendingToolSetAt || 0);
    delete state.pendingToolUrl;
    delete state.pendingToolSetAt;
    saveState(state);
    if (!url || !Number.isFinite(setAt) || setAt <= 0) return "";
    if (Number(now) - setAt > PENDING_TTL_MS) return "";
    return url;
  }

  window.ScanSciAnonPrompt = {
    STORAGE_KEY,
    PROMPT_THRESHOLD,
    PENDING_TTL_MS,
    loadState,
    saveState,
    clearState,
    todayLocalDate,
    recordToolOpen,
    shouldPrompt,
    markDismissed,
    setPendingToolUrl,
    consumePendingToolUrl,
  };
})();
