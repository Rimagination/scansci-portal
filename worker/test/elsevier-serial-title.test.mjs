import test from "node:test";
import assert from "node:assert/strict";

import worker, { requestElsevierSerialTitle } from "../src/index.js";

const SERIAL_PAYLOAD = {
  "serial-metadata-response": {
    entry: [
      {
        "dc:title": "Nature Communications",
        citeScoreYearInfoList: {
          citeScoreYearInfo: [
            {
              "@year": "2025",
              citeScoreInformationList: [
                {
                  citeScoreInfo: [
                    {
                      citeScore: "17.2",
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
  },
};

class FakeD1Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = String(sql || "").replace(/\s+/g, " ").trim();
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async first() {
    return this.db.first(this.sql, this.args);
  }

  async run() {
    this.db.run(this.sql, this.args);
    return { success: true };
  }
}

class FakeD1Database {
  constructor(seed = {}) {
    this.elsevierCache = new Map(Object.entries(seed.elsevierCache || {}));
    this.runCalls = [];
  }

  prepare(sql) {
    return new FakeD1Statement(this, sql);
  }

  first(sql, args) {
    if (sql.includes("FROM elsevier_cache WHERE issn_key = ?")) {
      const row = this.elsevierCache.get(String(args[0] || ""));
      return row ? { ...row } : null;
    }
    throw new Error(`Unhandled first SQL: ${sql}`);
  }

  run(sql, args) {
    this.runCalls.push({ sql, args });
  }
}

test("requestElsevierSerialTitle asks for CITESCORE view before field-filtered fallback", async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return new Response(JSON.stringify(SERIAL_PAYLOAD), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await requestElsevierSerialTitle("0959-6526", "test-key", {
      ELSEVIER_UPSTREAM_TIMEOUT_MS: "2000",
    });

    assert.equal(result.ok, true);
    assert.match(urls[0], /view=CITESCORE/);
    assert.doesNotMatch(urls[0], /field=/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("serial title route serves expired D1 cache when live Elsevier fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        "service-error": {
          status: {
            statusCode: "GENERAL_SYSTEM_ERROR",
            statusText: "System Error Occurred",
          },
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );

  const expiredUnix = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60;
  const env = {
    PUBLIC_ORIGIN: "https://www.scansci.com",
    CORS_ORIGINS: "https://journal.scansci.com",
    ELSEVIER_API_KEY: "test-key",
    DB: new FakeD1Database({
      elsevierCache: {
        "20411723": {
          issn_key: "20411723",
          issn_display: "2041-1723",
          payload_json: JSON.stringify(SERIAL_PAYLOAD),
          source: "gha-sync",
          updated_unix: expiredUnix - 60,
          expires_unix: expiredUnix,
        },
      },
    }),
  };

  try {
    const response = await worker.fetch(
      new Request("https://www.scansci.com/api/elsevier/serial-title?issn=2041-1723", {
        headers: { Origin: "https://journal.scansci.com" },
      }),
      env
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-ScanSci-Elsevier-Source"), "d1-cache-stale-fallback");
    assert.equal(payload["serial-metadata-response"].entry[0]["dc:title"], "Nature Communications");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("serial title route strips API keys from cached Elsevier links", async () => {
  const nowUnix = Math.floor(Date.now() / 1000);
  const payloadWithSecretLink = {
    "serial-metadata-response": {
      link: [
        {
          "@href":
            "https://api.elsevier.com/content/serial/title?issn=20411723&apiKey=secret-cache-key&view=STANDARD",
        },
      ],
      entry: SERIAL_PAYLOAD["serial-metadata-response"].entry,
    },
  };
  const env = {
    PUBLIC_ORIGIN: "https://www.scansci.com",
    CORS_ORIGINS: "https://journal.scansci.com",
    DB: new FakeD1Database({
      elsevierCache: {
        "20411723": {
          issn_key: "20411723",
          issn_display: "2041-1723",
          payload_json: JSON.stringify(payloadWithSecretLink),
          source: "gha-sync",
          updated_unix: nowUnix,
          expires_unix: nowUnix + 3600,
        },
      },
    }),
  };

  const response = await worker.fetch(
    new Request("https://www.scansci.com/api/elsevier/serial-title?issn=2041-1723", {
      headers: { Origin: "https://journal.scansci.com" },
    }),
    env
  );
  const text = await response.text();
  const payload = JSON.parse(text);
  const href = payload["serial-metadata-response"].link[0]["@href"];

  assert.equal(response.status, 200);
  assert.doesNotMatch(text, /secret-cache-key/);
  assert.doesNotMatch(text, /apiKey=/i);
  assert.equal(href, "https://api.elsevier.com/content/serial/title?issn=20411723&view=STANDARD");
});
