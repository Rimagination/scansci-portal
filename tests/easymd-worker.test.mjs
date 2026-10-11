import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import worker from '../easymd/worker.mjs';

const originalFetch = globalThis.fetch;
let forwarded;
before(() => { globalThis.fetch = async (url, init) => {
  forwarded = { url, ...init };
  const headers = new Headers({ 'cache-control': 'public, max-age=3600', 'location': '/?connected=1' });
  headers.append('set-cookie', 'easymd_wechat_browser=tool; Domain=easymd.vercel.app; Path=/; HttpOnly; Secure; SameSite=Lax');
  headers.append('set-cookie', 'scansci_session=must-not-replace; Path=/');
  return new Response('ok', { headers });
}; });
after(() => { globalThis.fetch = originalFetch; });

test('tool requests keep the main account cookie and authorization private', async () => {
  const response = await worker.fetch(new Request('https://www.scansci.com/easymd/api/wechat/draft/session', { headers: {
    cookie: 'scansci_session=private; easymd_wechat_browser=tool; other=private', authorization: 'Bearer main-token',
  } }));
  assert.equal(forwarded.url, 'https://easymd.vercel.app/api/wechat/draft/session');
  assert.equal(forwarded.headers.get('cookie'), 'easymd_wechat_browser=tool');
  assert.equal(forwarded.headers.has('authorization'), false);
  assert.equal(forwarded.headers.get('origin'), 'https://easymd.vercel.app');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('set-cookie'), /Path=\/easymd\//);
  assert.doesNotMatch(response.headers.get('set-cookie'), /Domain=|scansci_session/);
  assert.equal(response.headers.get('location'), 'https://www.scansci.com/easymd/?connected=1');
});

test('the proxy rejects unknown paths and cross-site or origin-less API writes', async () => {
  for (const path of ['/easymd/api/admin', '/easymd/uploads/../../private', '/reader/api/wechat/draft']) {
    assert.equal((await worker.fetch(new Request('https://www.scansci.com' + path))).status, 404);
  }
  for (const origin of [null, 'https://evil.example']) {
    const headers = origin ? { origin } : {};
    const response = await worker.fetch(new Request('https://www.scansci.com/easymd/api/wechat/draft', { method: 'POST', headers, body: 'test' }));
    assert.equal(response.status, 403);
  }
});

test('same-origin API bodies and MCP transport headers retain their meaning', async () => {
  const request = new Request('https://www.scansci.com/easymd/api/upload/image', { method: 'POST', headers: { origin: 'https://www.scansci.com', 'content-type': 'text/plain' }, body: 'image bytes' });
  assert.equal((await worker.fetch(request)).status, 200);
  assert.equal(await new Response(forwarded.body).text(), 'image bytes');
  assert.equal(forwarded.headers.get('content-type'), 'text/plain');
  await worker.fetch(new Request('https://www.scansci.com/easymd/mcp', { method: 'POST', headers: { 'mcp-session-id': 'abc', authorization: 'Bearer tool-token' }, body: '{}' }));
  assert.equal(forwarded.headers.get('mcp-session-id'), 'abc');
  assert.equal(forwarded.headers.get('authorization'), 'Bearer tool-token');
});

test('uploads are read-only and unavailable upstreams produce a usable failure', async () => {
  assert.equal((await worker.fetch(new Request('https://www.scansci.com/easymd/uploads/image.png', { method: 'DELETE' }))).status, 403);
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Offline'); };
  try {
    assert.equal((await worker.fetch(new Request('https://www.scansci.com/easymd/api/wechat/draft/session'))).status, 502);
  } finally { globalThis.fetch = fetchBefore; }
});

test('trusted WeChat authorization redirects keep the callback on the tool origin', async () => {
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 302, headers: { location: 'https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=app&redirect_uri=' + encodeURIComponent('https://easymd.vercel.app/api/wechat/callback?state=bound') } });
  try {
    const response = await worker.fetch(new Request('https://www.scansci.com/easymd/api/wechat/authorize'));
    const url = new URL(response.headers.get('location'));
    assert.equal(url.origin, 'https://mp.weixin.qq.com');
    assert.equal(url.searchParams.get('redirect_uri'), 'https://www.scansci.com/easymd/api/wechat/callback?state=bound');
  } finally { globalThis.fetch = fetchBefore; }
});

test('local uploads use the tool path while external CDN URLs retain their origin', async () => {
  const fetchBefore = globalThis.fetch;
  try {
    for (const [source, expected] of [
      ['/uploads/picture.png', 'https://www.scansci.com/easymd/uploads/picture.png'],
      ['https://easymd.vercel.app/uploads/picture.png', 'https://www.scansci.com/easymd/uploads/picture.png'],
      ['https://cdn.example/picture.png', 'https://cdn.example/picture.png'],
    ]) {
      globalThis.fetch = async () => Response.json({ url: source, other: 'retained' });
      const response = await worker.fetch(new Request('https://www.scansci.com/easymd/api/upload/image', { method: 'POST', headers: { origin: 'https://www.scansci.com' }, body: 'image' }));
      assert.deepEqual(await response.json(), { url: expected, other: 'retained' });
    }
  } finally { globalThis.fetch = fetchBefore; }
});

test('uploaded SVG cannot execute scripts as a main-site document', async () => {
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = async () => new Response('<svg><script>alert(1)</script></svg>', { headers: { 'content-type': 'image/svg+xml' } });
  try {
    const response = await worker.fetch(new Request('https://www.scansci.com/easymd/uploads/image.svg'));
    assert.match(response.headers.get('content-security-policy'), /sandbox/);
    assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  } finally { globalThis.fetch = fetchBefore; }
});
