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

  assert.equal(Object.keys(helper.loadState()).length, 0);
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
  assert.equal(Object.keys(blockedHelper.loadState()).length, 0);
  assert.doesNotThrow(() => blockedHelper.recordToolOpen());
  assert.equal(blockedHelper.consumePendingToolUrl(Date.now()), "");
});
