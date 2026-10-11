import assert from 'node:assert/strict';
import { createCipheriv, createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { after, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import worker from '../easymd/worker.mjs';

const origin = 'https://www.scansci.com';
const base = origin + '/easymd/api/wechat/';
const originalFetch = globalThis.fetch;
let draftSent;
let holdRefresh;
let signalRefresh;
before(() => { globalThis.fetch = async (url, init) => {
  const path = new URL(url).pathname;
  if (path.endsWith('api_component_token')) return Response.json({ component_access_token: 'component-access', expires_in: 7200 });
  if (path.endsWith('api_create_preauthcode')) return Response.json({ pre_auth_code: 'pre-auth-code' });
  if (path.endsWith('api_authorizer_token')) { signalRefresh?.(); await holdRefresh; return Response.json({ authorizer_access_token: 'refreshed-token', authorizer_refresh_token: 'refreshed-refresh', expires_in: 7200 }); }
  if (path.endsWith('api_query_auth')) return Response.json({ authorization_info: { authorizer_appid: 'wx-owned-account', authorizer_access_token: 'private-authorizer-token', authorizer_refresh_token: 'private-refresh-token', expires_in: 7200 } });
  if (path.endsWith('api_get_authorizer_info')) return Response.json({ authorizer_info: { nick_name: '测试公众号', user_name: 'gh_owned', principal_name: '测试机构' } });
  if (path === '/cgi-bin/draft/add') { draftSent = JSON.parse(init.body); return Response.json({ media_id: 'draft-result' }); }
  throw new Error('Unexpected external request: ' + path);
}; });
after(() => { globalThis.fetch = originalFetch; });

function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../easymd/wechat/schema.sql', import.meta.url), 'utf8'));
  const binding = { prepare(sql) {
    const query = sqlite.prepare(sql);
    let values = [];
    return {
      bind(...items) { values = items; return this; },
      async first(column) { const row = query.get(...values); return column ? row?.[column] ?? null : row ?? null; },
      async run() { return { meta: { changes: Number(query.run(...values).changes) } }; },
    };
  }, async batch(statements) { return Promise.all(statements.map(statement => statement.run())); } };
  return { binding, sqlite };
}
function setup() {
  const store = database();
  return { ...store, bindings: {
    VITE_APP_URL: origin + '/easymd/', WECHAT_DATA: store.binding,
    EASYMD_WECHAT_DATA_KEY: 'test-data-key'.repeat(4),
    WECHAT_COMPONENT_APPID: 'test-component-app', WECHAT_COMPONENT_APPSECRET: 'test-component-secret',
    WECHAT_COMPONENT_TOKEN: 'test-component-token',
    WECHAT_COMPONENT_ENCODING_AES_KEY: Buffer.alloc(32, 3).toString('base64').replace(/=+$/, ''),
  } };
}
function request(path, cookie, method = 'GET', body) {
  return new Request(base + path, { method, headers: { ...(cookie ? { cookie } : {}), ...(method === 'GET' ? {} : { origin }) }, body });
}
function sessionCookie(response) { return response.headers.get('set-cookie')?.split(';')[0]; }
function ticketRequest(bindings, nonce = 'nonce', messageType = 'component_verify_ticket') {
  const key = Buffer.from(bindings.WECHAT_COMPONENT_ENCODING_AES_KEY + '=', 'base64');
  const message = `<xml><InfoType><![CDATA[${messageType}]]></InfoType><ComponentVerifyTicket><![CDATA[test-ticket]]></ComponentVerifyTicket></xml>`;
  const length = Buffer.alloc(4); length.writeUInt32BE(Buffer.byteLength(message));
  const plain = Buffer.concat([Buffer.alloc(16, 7), length, Buffer.from(message), Buffer.from(bindings.WECHAT_COMPONENT_APPID)]);
  const padding = 32 - plain.length % 32;
  const cipher = createCipheriv('aes-256-cbc', key, key.subarray(0, 16)); cipher.setAutoPadding(false);
  const encrypted = Buffer.concat([cipher.update(Buffer.concat([plain, Buffer.alloc(padding, padding)])), cipher.final()]).toString('base64');
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHash('sha1').update([bindings.WECHAT_COMPONENT_TOKEN, timestamp, nonce, encrypted].sort().join('')).digest('hex');
  return new Request(base + `component?timestamp=${timestamp}&nonce=${nonce}&msg_signature=${signature}`, { method: 'POST', body: `<xml><Encrypt><![CDATA[${encrypted}]]></Encrypt></xml>` });
}
async function connect(bindings, cookie) {
  const response = await worker.fetch(request('authorize?returnTo=%2Feasymd%2F', cookie), bindings);
  assert.equal(response.status, 302);
  const authorization = new URL(response.headers.get('location'));
  assert.equal(authorization.origin, 'https://mp.weixin.qq.com');
  const callback = new URL(authorization.searchParams.get('redirect_uri'));
  assert.equal(callback.origin + callback.pathname, base + 'callback');
  assert.ok(callback.searchParams.get('state'));
  callback.searchParams.set('auth_code', 'authorization-code');
  return callback;
}

test('unconfigured service exposes status without pretending a user is connected', async () => {
  const response = await worker.fetch(request('account'));
  const data = await response.json();
  assert.equal(response.status, 200); assert.equal(data.configured, false); assert.equal(data.connected, false);
  assert.equal(data.account, null); assert.equal(response.headers.get('set-cookie'), null);
  assert.equal((await worker.fetch(request('component'))).status, 503);
});

test('official callback, user authorization, encrypted account, draft and disconnect work together', async () => {
  const { bindings, sqlite } = setup();
  try {
    assert.equal((await worker.fetch(ticketRequest(bindings), bindings)).status, 200);
    const first = await worker.fetch(request('account'), bindings);
    const cookie = sessionCookie(first); assert.ok(cookie);
    assert.match(first.headers.get('set-cookie'), /HttpOnly/); assert.match(first.headers.get('set-cookie'), /Path=\/easymd\//);
    const otherCookie = sessionCookie(await worker.fetch(request('account'), bindings));
    const callback = await connect(bindings, cookie);
    const wrong = await worker.fetch(new Request(callback, { headers: { cookie: otherCookie } }), bindings);
    assert.match(wrong.headers.get('location'), /authorization_expired/);
    const connected = await worker.fetch(new Request(callback, { headers: { cookie } }), bindings);
    assert.equal(connected.headers.get('location'), origin + '/easymd/?wechat=connected');
    const publicAccount = await (await worker.fetch(request('account', cookie), bindings)).json();
    assert.equal(publicAccount.account.nickname, '测试公众号'); assert.equal(publicAccount.connected, true);
    assert.doesNotMatch(JSON.stringify(publicAccount), /private-authorizer-token|private-refresh-token/);
    assert.equal((await (await worker.fetch(request('account', otherCookie), bindings)).json()).connected, false);
    for (const row of sqlite.prepare('SELECT encrypted_value FROM wechat_records').all()) {
      assert.match(row.encrypted_value, /^v1\./); assert.doesNotMatch(row.encrypted_value, /private-authorizer-token|test-ticket/);
    }
    const form = new FormData();
    for (const [name, value] of Object.entries({ title: '公众号草稿', html: '<section id="easymd"><h1>测试标题</h1><p>正文内容</p></section>', coverMediaId: 'existing-cover' })) form.set(name, value);
    const submitted = await worker.fetch(request('draft', cookie, 'POST', form), bindings);
    assert.equal(submitted.status, 200, await submitted.clone().text()); assert.equal((await submitted.json()).draftMediaId, 'draft-result');
    assert.equal(draftSent.articles[0].title, '公众号草稿');
    assert.equal((await worker.fetch(request('draft', otherCookie, 'POST', form), bindings)).status, 401);
    const replay = await worker.fetch(new Request(callback, { headers: { cookie } }), bindings);
    assert.match(replay.headers.get('location'), /authorization_expired/);
    assert.equal((await (await worker.fetch(request('account', cookie, 'DELETE'), bindings)).json()).connected, false);
  } finally { sqlite.close(); }
});

test('OAuth state is single-use under concurrent callbacks', async () => {
  const { bindings, sqlite } = setup();
  try {
    await worker.fetch(ticketRequest(bindings), bindings);
    const cookie = sessionCookie(await worker.fetch(request('account'), bindings));
    const callback = await connect(bindings, cookie);
    const responses = await Promise.all([0, 1].map(() => worker.fetch(new Request(callback, { headers: { cookie } }), bindings)));
    assert.equal(responses.filter(response => response.headers.get('location').includes('wechat=connected')).length, 1);
    assert.equal(responses.filter(response => response.headers.get('location').includes('authorization_expired')).length, 1);
  } finally { sqlite.close(); }
});

test('forged component messages and cross-site draft writes fail', async () => {
  const { bindings, sqlite } = setup();
  try {
    const forged = ticketRequest(bindings); const url = new URL(forged.url); url.searchParams.set('msg_signature', 'forged');
    assert.equal((await worker.fetch(new Request(url, { method: 'POST', body: await forged.text() }), bindings)).status, 403);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS total FROM wechat_records').get().total, 0);
    assert.equal((await worker.fetch(new Request(base + 'draft', { method: 'POST', headers: { origin: 'https://foreign.example' }, body: 'bad' }), bindings)).status, 403);
    assert.equal((await worker.fetch(new Request(base + 'draft', { method: 'POST', body: 'bad' }), bindings)).status, 403);
  } finally { sqlite.close(); }
});

for (const action of ['disconnect', 'reauthorize']) test(`an in-flight refresh cannot undo ${action}`, async () => {
  const { bindings, sqlite } = setup(); const originalNow = Date.now;
  try {
    await worker.fetch(ticketRequest(bindings), bindings);
    const cookie = sessionCookie(await worker.fetch(request('account'), bindings));
    const callback = await connect(bindings, cookie);
    await worker.fetch(new Request(callback, { headers: { cookie } }), bindings);
    Date.now = () => originalNow() + 3 * 60 * 60 * 1000;
    let releaseRefresh;
    holdRefresh = new Promise(resolve => { releaseRefresh = resolve; });
    const began = new Promise(resolve => { signalRefresh = resolve; });
    const form = new FormData(); form.set('title', '在途草稿'); form.set('html', '<section id="easymd"><p>正文</p></section>'); form.set('coverMediaId', 'cover');
    const pending = worker.fetch(request('draft', cookie, 'POST', form), bindings);
    await began;
    if (action === 'disconnect') {
      assert.equal((await (await worker.fetch(request('account', cookie, 'DELETE'), bindings)).json()).connected, false);
    } else {
      const nextCallback = await connect(bindings, cookie);
      assert.match((await worker.fetch(new Request(nextCallback, { headers: { cookie } }), bindings)).headers.get('location'), /wechat=connected/);
    }
    releaseRefresh();
    const response = await pending;
    assert.equal(response.status, 401, await response.clone().text());
    const state = await (await worker.fetch(request('account', cookie), bindings)).json();
    assert.equal(state.connected, action === 'reauthorize');
  } finally { Date.now = originalNow; holdRefresh = undefined; signalRefresh = undefined; sqlite.close(); }
});
