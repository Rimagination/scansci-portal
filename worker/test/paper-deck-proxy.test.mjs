import test from "node:test";
import assert from "node:assert/strict";

import worker from "../paper-deck-proxy.js";

test("PaperDeck proxy answers root HEAD health checks without calling upstream", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response("unexpected");
  };

  try {
    const response = await worker.fetch(new Request("https://paperdeck.scansci.com/", { method: "HEAD" }));

    assert.equal(response.status, 200);
    assert.equal(called, false);
    assert.equal(response.headers.get("X-Proxy-By"), "Cloudflare-Worker-PaperDeck");
    assert.match(response.headers.get("Access-Control-Allow-Methods") || "", /HEAD/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("PaperDeck proxy still forwards normal GET requests to Hugging Face", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (request) => {
    calls.push(request);
    return new Response("<html>ok</html>", {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  };

  try {
    const response = await worker.fetch(new Request("https://paperdeck.scansci.com/cards?x=1"));

    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://rimagination-paper-deck.hf.space/cards?x=1");
    assert.equal(calls[0].headers.get("Host"), "rimagination-paper-deck.hf.space");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
