import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../src/index.js';
import { createSymbolsFixture } from './symbols-fixture.mjs';

function fixture() {
  const f = createSymbolsFixture();
  const migration = readFileSync(new URL('../sql/0013_user_card_orders.sql', import.meta.url), 'utf8');
  f.sqlite.exec(migration);
  f.sqlite.exec(migration);
  const request = (path, { user = 1, origin = 'https://www.scansci.com', method = 'GET', body, raw, type = 'application/json', extra = {} } = {}) => {
    const headers = { ...extra };
    if (user) headers.Cookie = f.cookie(user);
    if (origin) headers.Origin = origin;
    if (body !== undefined || raw !== undefined) headers['Content-Type'] = type;
    return worker.fetch(new Request('https://www.scansci.com' + path, { method, headers, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) }), f.env);
  };
  const save = (body, options = {}) => request('/api/me/card-order', { method: 'POST', body, ...options });
  return { ...f, request, save };
}

test('orders persist per user and per collection across account reads, preserving profile and favorites', async () => {
  const f = fixture();
  try {
    f.sqlite.exec("INSERT INTO user_favorites VALUES (1,'scansci-reader','2026-10-11')");
    for (const [section, app_ids] of [['online',['sci-skills','scansci-reader']],['materials',['scansci-logos','scansci-symbols']],['open-source',['open-source-easymd','open-source-easyslides']]]) {
      assert.equal((await f.save({ section, app_ids, expected_user_id: 1 })).status, 200);
    }
    const firstDevice = await (await f.request('/api/me')).json();
    const otherDevice = await (await f.request('/api/me')).json();
    assert.deepEqual(firstDevice.card_orders, otherDevice.card_orders);
    assert.deepEqual(firstDevice.card_orders.materials, ['scansci-logos','scansci-symbols']);
    assert.deepEqual(firstDevice.favorites, ['scansci-reader']);
    assert.equal(firstDevice.user.id, 1);
    assert.deepEqual((await (await f.request('/api/me', { user: 2 })).json()).card_orders, {});
    assert.equal((await f.save({ section: 'materials', app_ids: ['scansci-symbols'], expected_user_id: 2 }, { user: 2 })).status, 200);
    assert.deepEqual((await (await f.request('/api/me')).json()).card_orders.materials, ['scansci-logos','scansci-symbols']);
  } finally { f.sqlite.close(); }
});

test('writing requires a valid account and the portal origin; a changed account cannot receive a stale request', async () => {
  const f = fixture();
  const body = { section: 'online', app_ids: ['scansci-reader'], expected_user_id: 1 };
  try {
    assert.equal((await f.save(body, { user: null })).status, 401);
    for (const origin of [null, 'https://evil.example', 'https://citation.scansci.com']) assert.equal((await f.save(body, { origin })).status, 403);
    assert.equal((await f.request('/api/me/card-order', { method: 'POST', user: null, body, extra: { Cookie: '__Secure-scansci_session=invalid' } })).status, 401);
    assert.equal((await f.save(body, { user: 2 })).status, 409);
    assert.deepEqual((await (await f.request('/api/me', { user: 2 })).json()).card_orders, {});
    assert.equal((await f.save({ ...body, user_id: 2 })).status, 400);
    f.sqlite.exec('DELETE FROM users WHERE id=1');
    assert.equal((await f.save(body)).status, 401);
  } finally { f.sqlite.close(); }
});

test('invalid or oversized orders cannot replace an existing saved order', async () => {
  const f = fixture();
  try {
    await f.save({ section: 'online', app_ids: ['scansci-reader'] });
    for (const body of [null, [], { section: 'admin', app_ids: [] }, { section: 'online', app_ids: 'x' }, { section: 'online', app_ids: [1] }, { section: 'online', app_ids: ['a','a'] }, { section: 'online', app_ids: ['<script>'] }, { section: 'online', app_ids: ['a'.repeat(81)] }, { section: 'online', app_ids: Array.from({length:201}, (_,i) => 'a'+i) }]) {
      assert.equal((await f.save(body)).status, 400);
    }
    assert.equal((await f.request('/api/me/card-order', { method: 'POST', raw: '{broken' })).status, 400);
    assert.equal((await f.save({section:'online',app_ids:[]}, { type: 'text/plain' })).status, 415);
    assert.equal((await f.request('/api/me/card-order')).status, 405);
    assert.deepEqual((await (await f.request('/api/me')).json()).card_orders.online, ['scansci-reader']);
    let cancelled = false;
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(20000)); controller.enqueue(new Uint8Array(20000)); }, cancel() { cancelled = true; } });
    const response = await worker.fetch(new Request('https://www.scansci.com/api/me/card-order', { method: 'POST', headers: { Origin: 'https://www.scansci.com', Cookie: f.cookie(1), 'Content-Type': 'application/json' }, body: stream, duplex: 'half' }), f.env);
    assert.equal(response.status, 413);
    assert.equal(cancelled, true);
  } finally { f.sqlite.close(); }
});

test('updates are scoped atomic replacements, clearing and deleting an account leave other orders intact', async () => {
  const f = fixture();
  try {
    await f.save({ section: 'online', app_ids: ['a','b'] });
    await f.save({ section: 'online', app_ids: ['b','a'] });
    await f.save({ section: 'materials', app_ids: ['scansci-logos'] });
    await f.save({ section: 'online', app_ids: ['a'] }, { user: 2 });
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS total FROM user_card_orders').get().total, 3);
    await f.save({ section: 'online', app_ids: [] });
    assert.deepEqual((await (await f.request('/api/me')).json()).card_orders, { online: [], materials: ['scansci-logos'] });
    f.sqlite.exec('DELETE FROM users WHERE id=1');
    assert.deepEqual(f.sqlite.prepare('SELECT user_id,section FROM user_card_orders').all().map(row => ({...row})), [{user_id:2,section:'online'}]);
  } finally { f.sqlite.close(); }
});
