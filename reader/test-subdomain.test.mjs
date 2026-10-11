import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import worker from './cloud-worker.mjs';

const origin = 'https://reader.scansci.com';
const env = (account = async () => Response.json({ ok: true })) => ({
  ACCOUNT_API: { fetch: account },
  ASSETS: { fetch: async request => new Response(new URL(request.url).pathname) },
});

test('Reader serves its own root and redirects legacy URLs with search and hash intact', async () => {
  assert.equal(await (await worker.fetch(new Request(origin), env())).text(), '/index.html');
  const legacy = await worker.fetch(new Request('https://www.scansci.com/reader/?review=1'), env());
  assert.equal(legacy.status, 301);
  assert.equal(legacy.headers.get('Location'), origin + '/?review=1');
  // Browsers retain the original fragment when Location does not provide one.
  const asset = await worker.fetch(new Request(origin + '/media.js'), env());
  assert.equal(await asset.text(), '/media.js');
  assert.equal((await worker.fetch(new Request('https://www.scansci.com/reader-malicious'), env())).status, 404);
});

test('Reader passes session cookies through the fixed account service and keeps responses private', async () => {
  let upstream;
  const response = await worker.fetch(new Request(origin + '/api/reader/openalex-key', {
    method: 'POST', headers: { Origin: origin, Cookie: '__Secure-scansci_session=test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: 'test-key' }),
  }), env(async request => {
    upstream = { url: request.url, origin: request.headers.get('Origin'), cookie: request.headers.get('Cookie'), body: await request.json() };
    return Response.json({ configured: true }, { headers: { 'Set-Cookie': '__Secure-scansci_session=; Domain=.scansci.com; Max-Age=0', 'Access-Control-Allow-Origin': 'https://www.scansci.com' } });
  }));
  assert.deepEqual(upstream, { url: 'https://www.scansci.com/api/reader/openalex-key', origin: 'https://www.scansci.com', cookie: '__Secure-scansci_session=test', body: { api_key: 'test-key' } });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  assert.match(response.headers.get('Set-Cookie'), /Domain=\.scansci\.com/);
});

test('foreign origins, missing write origins and unrelated account endpoints cannot cross the gateway', async () => {
  let calls = 0;
  const bindings = env(async () => { calls++; return Response.json({}); });
  for (const foreign of ['https://evil.example', 'https://reader.scansci.com.evil.example', 'null', null]) {
    const headers = foreign === null ? {} : { Origin: foreign };
    assert.equal((await worker.fetch(new Request(origin + '/api/auth/logout', { method: 'POST', headers }), bindings)).status, 403);
  }
  assert.equal((await worker.fetch(new Request(origin + '/api/admin/users'), bindings)).status, 404);
  assert.equal((await worker.fetch(new Request(origin + '/api/me', { method: 'POST', headers: { Origin: origin } }), bindings)).status, 405);
  assert.equal(calls, 0);
});

test('login only returns to the exact Reader origin or the legacy Reader path', async () => {
  const portal = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  const code = portal.match(/function readerAuthReturnTo\(\) \{[\s\S]*?\n\}/)[0];
  const check = target => vm.runInNewContext(code + '\nreaderAuthReturnTo()', {
    URL, URLSearchParams, window: { location: { origin: 'https://www.scansci.com', search: '?reader_login=1&return_to=' + encodeURIComponent(target) } },
  });
  assert.equal(check(origin + '/?q=earth#paper/doi%3A10.1'), origin + '/?q=earth#paper/doi%3A10.1');
  assert.equal(check('/reader/#settings/updates'), '/reader/#settings/updates');
  for (const bad of ['https://reader.scansci.com.evil.example/', 'http://reader.scansci.com/', 'https://evil.example/', 'https://user@reader.scansci.com/', '//evil.example/']) assert.equal(check(bad), '');
});
