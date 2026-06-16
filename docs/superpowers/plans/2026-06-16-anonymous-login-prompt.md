# Anonymous Login Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a frontend-only login/register prompt that appears on an anonymous user's fourth tool-open click, suppresses repeat prompts for the same local day after dismissal, and preserves authenticated user data behavior.

**Architecture:** Put anonymous prompt state management in a small browser-global helper file so the logic can be tested with Node without loading the whole portal. Integrate the helper into the existing `app.js` auth modal and tool-open click path; no Worker or D1 schema changes are needed.

**Tech Stack:** Static HTML, vanilla browser JavaScript, `localStorage`, existing ScanSci auth modal, Node's built-in `node:test`, PowerShell, optional local static server for manual QA.

---

## File Structure

- Create `anon-prompt.js`
  - Owns local anonymous prompt state.
  - Exposes `window.ScanSciAnonPrompt`.
  - Contains no DOM dependencies beyond optional access to `window.localStorage`.
- Create `tests/anon-prompt.test.mjs`
  - Loads `anon-prompt.js` into a Node VM sandbox.
  - Tests threshold, same-day dismissal, stale pending URL handling, and storage failure behavior.
- Modify `index.html`
  - Load `anon-prompt.js` before `app.js`.
  - Bump script cache versions.
- Modify `app.js`
  - Track whether the auth modal was opened by the anonymous prompt.
  - Count anonymous tool-open clicks.
  - On the fourth eligible click, prevent immediate navigation, open the modal, and store a pending tool URL.
  - On auto-prompt dismissal, mark today's dismissal and continue to the pending tool URL.
  - On successful login or `loadMe()` detecting a user, consume a fresh pending tool URL and clear anonymous prompt state.

No Worker files or SQL migrations should be changed.

---

### Task 1: Add Tested Anonymous Prompt State Helper

**Files:**
- Create: `anon-prompt.js`
- Create: `tests/anon-prompt.test.mjs`

- [ ] **Step 1: Write the failing Node tests**

Create `tests/anon-prompt.test.mjs`:

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    raw() {
      return values;
    },
  };
}

function loadHelper(options = {}) {
  const storage = options.storage || createStorage();
  const sandbox = {
    window: {
      localStorage: storage,
    },
    console,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const source = fs.readFileSync(new URL("../anon-prompt.js", import.meta.url), "utf8");
  vm.runInContext(source, sandbox, { filename: "anon-prompt.js" });
  return { helper: sandbox.window.ScanSciAnonPrompt, storage };
}

test("anonymous opens 1-3 stay below the prompt threshold and open 4 becomes eligible", () => {
  const { helper } = loadHelper();

  let state = helper.recordToolOpen();
  assert.equal(state.toolOpenCount, 1);
  assert.equal(helper.shouldPrompt(state, "2026-06-16"), false);

  state = helper.recordToolOpen();
  assert.equal(state.toolOpenCount, 2);
  assert.equal(helper.shouldPrompt(state, "2026-06-16"), false);

  state = helper.recordToolOpen();
  assert.equal(state.toolOpenCount, 3);
  assert.equal(helper.shouldPrompt(state, "2026-06-16"), false);

  state = helper.recordToolOpen();
  assert.equal(state.toolOpenCount, 4);
  assert.equal(helper.shouldPrompt(state, "2026-06-16"), true);
});

test("same-day dismissal suppresses another automatic prompt until a later local date", () => {
  const { helper } = loadHelper();
  for (let i = 0; i < 4; i += 1) helper.recordToolOpen();

  helper.markDismissed("2026-06-16");
  assert.equal(helper.shouldPrompt(helper.loadState(), "2026-06-16"), false);
  assert.equal(helper.shouldPrompt(helper.loadState(), "2026-06-17"), true);
});

test("pending tool urls are consumed once and stale urls are cleared", () => {
  const { helper } = loadHelper();
  const now = 1781596800000;

  helper.setPendingToolUrl("https://journal.scansci.com", now);
  assert.equal(helper.consumePendingToolUrl(now + 5 * 60 * 1000), "https://journal.scansci.com");
  assert.equal(helper.consumePendingToolUrl(now + 5 * 60 * 1000), "");

  helper.setPendingToolUrl("https://paperdeck.scansci.com", now);
  assert.equal(helper.consumePendingToolUrl(now + 11 * 60 * 1000), "");
});

test("invalid stored json and unavailable storage fail open without throwing", () => {
  const storage = createStorage();
  storage.setItem("scansci:anonPrompt:v1", "{not-json");
  const { helper } = loadHelper({ storage });

  assert.deepEqual(helper.loadState(), {});
  assert.doesNotThrow(() => helper.saveState({ toolOpenCount: 1 }));

  const throwingStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    },
  };
  const { helper: blockedHelper } = loadHelper({ storage: throwingStorage });
  assert.deepEqual(blockedHelper.loadState(), {});
  assert.doesNotThrow(() => blockedHelper.recordToolOpen());
  assert.equal(blockedHelper.consumePendingToolUrl(Date.now()), "");
});
```

- [ ] **Step 2: Run the test to verify it fails because the helper file does not exist**

Run:

```powershell
node --test tests\anon-prompt.test.mjs
```

Expected: FAIL with `ENOENT` for `anon-prompt.js`.

- [ ] **Step 3: Add the helper implementation**

Create `anon-prompt.js`:

```js
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
```

- [ ] **Step 4: Run the tests to verify the helper passes**

Run:

```powershell
node --test tests\anon-prompt.test.mjs
```

Expected: PASS for 4 tests.

- [ ] **Step 5: Commit the helper and tests**

Run:

```powershell
git add anon-prompt.js tests\anon-prompt.test.mjs
git commit -m "Add anonymous login prompt state helper"
```

Expected: commit succeeds and includes only those two files.

---

### Task 2: Wire The Prompt Into The Existing Portal UI

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Test: `tests/anon-prompt.test.mjs`

- [ ] **Step 1: Add script loading for the helper**

Modify the script block near the end of `index.html` from:

```html
  <script src="./app.js?v=20260522h"></script>
```

to:

```html
  <script src="./anon-prompt.js?v=20260616a"></script>
  <script src="./app.js?v=20260616a"></script>
```

- [ ] **Step 2: Add anonymous prompt runtime state and helpers to `app.js`**

In `app.js`, update the top-level `state` object from:

```js
const state = {
  apps: [],
  query: "",
  activeFilter: "all",
  viewMode: "all",
  me: null,
  favorites: new Set(),
};
```

to:

```js
const state = {
  apps: [],
  query: "",
  activeFilter: "all",
  viewMode: "all",
  me: null,
  favorites: new Set(),
  authModalSource: "",
};
```

After `isModalOpen()`, add:

```js
function anonPrompt() {
  return window.ScanSciAnonPrompt || null;
}

function isKnownAppUrl(url) {
  const value = String(url || "").trim();
  if (!value) return false;
  return state.apps.some((app) => String(app.url || "").trim() === value);
}

function navigateToTool(url) {
  const value = String(url || "").trim();
  if (!value || !isKnownAppUrl(value)) return;
  window.location.href = value;
}
```

- [ ] **Step 3: Let `openAuthModal` track auto-prompt source**

Change:

```js
function openAuthModal() {
  if (!els.authModal) return;
  els.authModal.hidden = false;
  document.body.classList.add("is-modal-open");
  window.setTimeout(() => {
    if (els.emailInput) els.emailInput.focus();
  }, 10);
}
```

to:

```js
function openAuthModal(source = "manual") {
  if (!els.authModal) return;
  state.authModalSource = source;
  els.authModal.hidden = false;
  document.body.classList.add("is-modal-open");
  window.setTimeout(() => {
    if (els.emailInput) els.emailInput.focus();
  }, 10);
}
```

- [ ] **Step 4: Make `closeAuthModal` handle auto-prompt dismissal and resume navigation**

Change:

```js
function closeAuthModal() {
  if (!els.authModal) return;
  els.authModal.hidden = true;
  document.body.classList.remove("is-modal-open");
}
```

to:

```js
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
```

- [ ] **Step 5: Add a post-login continuation helper**

After `setAuthHint`, add:

```js
function finishAuthenticatedPromptFlow() {
  const prompt = anonPrompt();
  if (!prompt || !state.me) return;
  const pendingUrl = prompt.consumePendingToolUrl();
  prompt.clearState();
  state.authModalSource = "";
  if (pendingUrl) navigateToTool(pendingUrl);
}
```

- [ ] **Step 6: Clear anonymous state after `loadMe()` finds a logged-in user**

In `loadMe()`, after:

```js
    state.me = payload?.user || null;
    state.favorites = new Set((payload?.favorites || []).map((x) => String(x)));
```

add:

```js
    finishAuthenticatedPromptFlow();
```

- [ ] **Step 7: Clear anonymous state after email verification login**

In `loginByEmailCode()`, after:

```js
    renderAuth();
    renderGrid();
```

add:

```js
    finishAuthenticatedPromptFlow();
```

- [ ] **Step 8: Add anonymous prompt behavior to tool-open clicks**

Change `onOpenToolClick` from:

```js
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
```

to:

```js
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
```

- [ ] **Step 9: Run the helper tests**

Run:

```powershell
node --test tests\anon-prompt.test.mjs
```

Expected: PASS for 4 tests.

- [ ] **Step 10: Commit the UI wiring**

Run:

```powershell
git add index.html app.js
git commit -m "Prompt anonymous users after repeated tool opens"
```

Expected: commit succeeds and includes only `index.html` and `app.js`.

---

### Task 3: Verify In A Local Browser

**Files:**
- No source changes expected unless verification finds a defect.

- [ ] **Step 1: Start a static server**

Run:

```powershell
python -m http.server 4177
```

Expected: server listens at `http://localhost:4177`.

- [ ] **Step 2: Open the portal in the browser**

Open:

```text
http://localhost:4177/
```

Expected: portal loads and shows the app catalog.

- [ ] **Step 3: Reset anonymous state in the browser console**

Run in the browser console:

```js
localStorage.removeItem("scansci:anonPrompt:v1");
```

Expected: no visible change.

- [ ] **Step 4: Verify opens 1-3 do not prompt**

In the browser console, run before each click to stay on the portal:

```js
window.addEventListener("beforeunload", (event) => event.preventDefault(), { once: true });
```

Click a tool link three times, returning to the portal if needed.

Expected:

- No automatic login modal opens on clicks 1, 2, or 3.
- `JSON.parse(localStorage.getItem("scansci:anonPrompt:v1")).toolOpenCount` becomes `3`.

- [ ] **Step 5: Verify open 4 prompts and pauses navigation**

Click a tool link a fourth time.

Expected:

- The login/register modal opens.
- The page remains on the portal.
- Local storage includes a fresh `pendingToolUrl`.

- [ ] **Step 6: Verify dismissal suppresses same-day prompt and resumes navigation**

Close the modal with the close button.

Expected:

- The browser navigates to the tool that was clicked.
- `dismissedDate` is today's local date.

Return to `http://localhost:4177/` and click another tool.

Expected:

- No automatic modal opens on the same local date.

- [ ] **Step 7: Verify manual login behavior still works**

Click the sidebar login card or login button.

Expected:

- The same login/register modal opens.
- Closing the manually opened modal does not force navigation to a pending tool URL.

- [ ] **Step 8: Stop the static server**

Stop the PowerShell process running `python -m http.server 4177` with `Ctrl+C`.

Expected: server exits.

- [ ] **Step 9: Commit any verification fixes**

If verification required code changes, run:

```powershell
git add app.js index.html anon-prompt.js tests\anon-prompt.test.mjs
git commit -m "Fix anonymous login prompt verification issues"
```

Expected: commit is only created if fixes were necessary.

---

## Self-Review

Spec coverage:

- Fourth anonymous tool-open prompt is covered by Task 1 tests and Task 2 click integration.
- Same-day dismissal suppression is covered by Task 1 tests and Task 2 modal close integration.
- Dismissal continuing to the originally clicked tool is covered by Task 2 pending URL handling and Task 3 browser verification.
- Successful login clearing local anonymous state is covered by Task 2 login integration.
- No backend or D1 migration is covered by the file structure and Task 2 scope.
- Capacity and data-durability requirements remain documented in the approved spec; no implementation task is needed because this change stores no durable anonymous data.

Completion scan:

- The plan contains only concrete implementation and verification steps.
- Every code-changing step includes concrete code.

Type consistency:

- Helper names are consistent across tests, helper implementation, and `app.js`: `recordToolOpen`, `shouldPrompt`, `markDismissed`, `setPendingToolUrl`, `consumePendingToolUrl`, and `clearState`.
- Local storage key is consistently `scansci:anonPrompt:v1`.
