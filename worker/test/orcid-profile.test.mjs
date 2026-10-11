import test from "node:test";
import assert from "node:assert/strict";

import worker from "../src/index.js";
import { normalizeOrcidId } from "../src/orcid-profile.js";

const ORCID = "0000-0001-2345-6789";

test("normalizes ORCID IDs and verifies the checksum", () => {
  assert.equal(normalizeOrcidId(ORCID), ORCID);
  assert.equal(normalizeOrcidId(`https://orcid.org/${ORCID}`), ORCID);
  assert.equal(normalizeOrcidId("0000-0001-2345-678X"), "");
  assert.equal(normalizeOrcidId("0000-0001"), "");
});

test("the profile endpoint returns selected public fields and caches the access token", async () => {
  const originalFetch = globalThis.fetch;
  const calls = { token: 0, record: 0 };
  const publicRecord = {
    person: {
      name: { "given-names": { value: "Ada" }, "family-name": { value: "Lovelace" }, "credit-name": { value: "Ada Lovelace" } },
      biography: { content: "A public biography." },
      keywords: { keyword: [{ content: "computing" }, { content: "mathematics" }] },
      "researcher-urls": { "researcher-url": [{ "url-name": "Research page", url: { value: "https://example.org/ada" } }] },
      emails: { email: [{ email: "private@example.org" }] },
    },
    "activities-summary": {
      employments: { "affiliation-group": [{ summaries: [{ "employment-summary": { "role-title": "Professor", organization: { name: "Example University", address: { city: "London", country: "GB" } }, "start-date": { year: { value: "2020" } } } }] }] },
      educations: { "affiliation-group": [{ summaries: [{ "education-summary": { "role-title": "PhD", organization: { name: "Example College" }, "end-date": { year: { value: "2019" } } } }] }] },
      works: { group: [{ "work-summary": [{ title: { title: { value: "Research record" } }, type: "journal-article", "publication-date": { year: { value: "2024" } }, "external-ids": { "external-id": [{ "external-id-type": "doi", "external-id-value": "10.1000/test" }] } }] }] },
    },
  };

  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url === "https://orcid.org/oauth/token") {
      calls.token += 1;
      assert.equal(init.method, "POST");
      assert.equal(new URLSearchParams(init.body).get("scope"), "/read-public");
      return Response.json({ access_token: "test-access-token", expires_in: 3600 });
    }
    assert.equal(url, `https://pub.orcid.org/v3.0/${ORCID}/record`);
    calls.record += 1;
    assert.equal(init.headers.Authorization, "Bearer test-access-token");
    assert.equal(init.headers.Accept, "application/vnd.orcid+json");
    return Response.json(publicRecord);
  };

  try {
    const env = {
      ORCID_PUBLIC_CLIENT_ID: "test-client-orcid-profile",
      ORCID_PUBLIC_CLIENT_SECRET: "test-secret",
      PUBLIC_ORIGIN: "https://www.scansci.com",
      CORS_ORIGINS: "https://www.scansci.com",
    };
    const request = () => new Request(`https://www.scansci.com/api/orcid/profile?orcid=${ORCID}`);
    const first = await worker.fetch(request(), env);
    const second = await worker.fetch(request(), env);
    const payload = await first.json();

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.match(first.headers.get("Cache-Control"), /s-maxage=/);
    assert.equal(calls.token, 1);
    assert.equal(calls.record, 2);
    assert.equal(payload.profile.name, "Ada Lovelace");
    assert.equal(payload.profile.employments[0].organization, "Example University");
    assert.equal(payload.profile.educations[0].role, "PhD");
    assert.equal(payload.profile.works[0].doi, "10.1000/test");
    assert.deepEqual(payload.profile.keywords, ["computing", "mathematics"]);
    assert.equal(payload.profile.researcherUrls[0].url, "https://example.org/ada");
    assert.doesNotMatch(JSON.stringify(payload), /private@example\.org|test-secret|test-access-token/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the profile endpoint rejects invalid IDs and reports missing API credentials", async () => {
  const env = { PUBLIC_ORIGIN: "https://www.scansci.com" };
  const invalid = await worker.fetch(new Request("https://www.scansci.com/api/orcid/profile?orcid=0000-0001-2345-678X"), env);
  const unconfigured = await worker.fetch(new Request(`https://www.scansci.com/api/orcid/profile?orcid=${ORCID}`), env);
  const wrongMethod = await worker.fetch(new Request(`https://www.scansci.com/api/orcid/profile?orcid=${ORCID}`, { method: "POST" }), env);

  assert.equal(invalid.status, 400);
  assert.equal(unconfigured.status, 503);
  assert.equal(wrongMethod.status, 405);
});

test("the profile endpoint briefly caches unknown public IDs", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input) === "https://orcid.org/oauth/token"
    ? Response.json({ access_token: "test-access-token", expires_in: 3600 })
    : new Response("", { status: 404 });

  try {
    const env = {
      ORCID_PUBLIC_CLIENT_ID: "test-client-orcid-negative-cache",
      ORCID_PUBLIC_CLIENT_SECRET: "test-secret",
      PUBLIC_ORIGIN: "https://www.scansci.com",
      CORS_ORIGINS: "https://www.scansci.com",
    };
    const response = await worker.fetch(new Request(`https://www.scansci.com/api/orcid/profile?orcid=${ORCID}`), env);
    assert.equal(response.status, 404);
    assert.match(response.headers.get("Cache-Control"), /s-maxage=300/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
