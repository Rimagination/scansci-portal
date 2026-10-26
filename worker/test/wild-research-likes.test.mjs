import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../src/wild-research-worker.js';
import authWorker from '../src/index.js';
import { createSymbolsFixture } from './symbols-fixture.mjs';

function fixture() {
  const f = createSymbolsFixture();
  f.sqlite.exec(readFileSync(new URL('../sql/0013_user_card_orders.sql', import.meta.url), 'utf8'));
  f.sqlite.exec(readFileSync(new URL('../sql/0020_wild_research_likes.sql', import.meta.url), 'utf8'));
  f.env.AUTH = { fetch: request => authWorker.fetch(request, f.env) };
  const request = (method, { user = 1, origin = 'https://www.scansci.com', body, type = 'application/json' } = {}) => {
    const headers = {};
    if (user) headers.Cookie = f.cookie(user);
    if (origin) headers.Origin = origin;
    if (body !== undefined) headers['Content-Type'] = type;
    return worker.fetch(new Request('https://www.scansci.com/api/wild-research/likes', {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    }), f.env);
  };
  return { ...f, request };
}

test('likes are public counts, scoped to account and entry, and idempotent', async () => {
  const f = fixture();
  try {
    const read = async (user = null) => (await f.request('GET', { user })).json();
    assert.deepEqual((await read()).counts, {});
    assert.equal((await f.request('POST', { body: { entry: 61, liked: true, expected_user_id: 1 } })).status, 200);
    assert.equal((await f.request('POST', { body: { entry: 61, liked: true } })).status, 200);
    assert.equal((await f.request('POST', { user: 2, body: { entry: 61, liked: true } })).status, 200);
    assert.equal((await f.request('POST', { body: { entry: 1, liked: true } })).status, 200);
    assert.deepEqual((await read()).counts, { 1: 1, 61: 2 });
    assert.deepEqual((await read(1)).liked.sort((a, b) => a - b), [1, 61]);
    assert.deepEqual((await read(2)).liked, [61]);
    assert.equal((await f.request('POST', { body: { entry: 61, liked: false } })).status, 200);
    assert.deepEqual((await read()).counts, { 1: 1, 61: 1 });
    f.sqlite.exec('DELETE FROM users WHERE id = 2');
    assert.deepEqual((await read()).counts, { 1: 1 });
  } finally { f.sqlite.close(); }
});

test('only authenticated same-origin users can change a like, with bounded validated input', async () => {
  const f = fixture();
  try {
    const valid = { entry: 1, liked: true };
    assert.equal((await f.request('POST', { user: null, body: valid })).status, 401);
    for (const origin of [null, 'https://evil.example', 'https://reader.scansci.com']) {
      assert.equal((await f.request('POST', { origin, body: valid })).status, 403);
    }
    for (const body of [{ entry: 0, liked: true }, { entry: 66, liked: true }, { entry: '1', liked: true }, { entry: 1, liked: 1 }, { ...valid, votes: 999 }, null]) {
      assert.equal((await f.request('POST', { body })).status, 400);
    }
    assert.equal((await f.request('POST', { body: valid, type: 'text/plain' })).status, 415);
    assert.equal((await f.request('POST', { body: { ...valid, expected_user_id: 2 } })).status, 409);
    assert.equal((await f.request('PUT')).status, 405);
    assert.deepEqual((await (await f.request('GET', { user: null })).json()).counts, {});
  } finally { f.sqlite.close(); }
});
