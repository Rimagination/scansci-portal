import test from "node:test";
import assert from "node:assert/strict";

import worker, { requestElsevierSerialTitle } from "../src/index.js";

test("Elsevier live request uses the documented header first", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    return new Response(JSON.stringify({ "serial-metadata-response": { entry: [] } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await requestElsevierSerialTitle("0378-3774", "test-key", {
      ELSEVIER_UPSTREAM_TIMEOUT_MS: "2000",
    });
    assert.equal(result.ok, true);
    assert.match(requests[0].url, /view=CITESCORE/);
    assert.doesNotMatch(requests[0].url, /apiKey=/i);
    assert.equal(requests[0].options.headers["X-ELS-APIKey"], "test-key");
    assert.equal(requests[0].options.headers.Origin, undefined);
    assert.equal(requests[0].options.headers.Referer, undefined);
    assert.equal(requests[0].options.cf, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("private ISSN source rejects requests without the sync token", async () => {
  const response = await worker.fetch(
    new Request("https://www.scansci.com/api/admin/journal-search/issns?limit=2"),
    { ADMIN_SYNC_TOKEN: "test-admin" }
  );
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { ok: false, error: "forbidden" });
});
