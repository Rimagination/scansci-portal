import test from "node:test";
import assert from "node:assert/strict";

import worker from "../acti-proxy.js";

test("ACTI proxy maps the subdomain root to the GitHub Pages /acti/ path", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (request) => {
    calls.push(request);
    return new Response("<html>ok</html>", {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": "default-src 'self'",
      },
    });
  };

  try {
    const response = await worker.fetch(new Request("https://acti.scansci.com/?type=JRIA"));

    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://rimagination.github.io/acti/?type=JRIA");
    assert.equal(calls[0].headers.get("Host"), "rimagination.github.io");
    assert.equal(response.headers.get("content-security-policy"), null);
    assert.equal(response.headers.get("X-Proxy-By"), "Cloudflare-Worker-ACTI");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("ACTI proxy keeps asset requests under the upstream /acti/ prefix", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (request) => {
    calls.push(request);
    return new Response("asset", {
      headers: {
        "content-type": "image/png",
      },
    });
  };

  try {
    const response = await worker.fetch(new Request("https://acti.scansci.com/chars/JRIA.png"));

    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://rimagination.github.io/acti/chars/JRIA.png");
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
