import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../src/wild-research-worker.js';
import authWorker from '../src/index.js';
import { createSymbolsFixture } from './symbols-fixture.mjs';

function fixture(t, time = '2026-11-17T12:00:00Z') {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse(time) });
  const f = createSymbolsFixture();
  for (const migration of ['0013_user_card_orders.sql', '0020_wild_research_likes.sql', '0021_wild_research_likes_season_two.sql', '0022_wild_research_votes_season_two.sql']) {
    f.sqlite.exec(readFileSync(new URL(`../sql/${migration}`, import.meta.url), 'utf8'));
  }
  f.env.WILD_VOTE_END = '2026-11-18T16:00:00Z';
  f.env.AUTH = { fetch: request => authWorker.fetch(request, f.env) };
  const request = (method, { user = 1, origin = 'https://www.scansci.com', body, type = 'application/json', path = 'votes' } = {}) => {
    const headers = {};
    if (user) headers.Cookie = f.cookie(user);
    if (origin) headers.Origin = origin;
    if (body !== undefined) headers['Content-Type'] = type;
    return worker.fetch(new Request(`https://www.scansci.com/api/wild-research/${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    }), f.env);
  };
  return { ...f, request };
}

test('votes are separate from likes, limited to three works, and can be changed', async t => {
  const f = fixture(t);
  try {
    const cast = (entry, selected = true, user = 1) => f.request('POST', { user, body: { entry, selected } });
    const read = async (user = null) => (await f.request('GET', { user })).json();
    assert.deepEqual((await read()).counts, {});
    assert.equal((await f.request('POST', { path: 'likes', body: { entry: 66, liked: true } })).status, 200);
    for (const entry of [66, 67, 68]) assert.equal((await cast(entry)).status, 200);
    assert.equal((await cast(66)).status, 200); // repeated requests are idempotent
    assert.equal((await cast(69)).status, 409);
    assert.deepEqual((await read(1)).selected, [66, 67, 68]);
    assert.deepEqual((await read()).counts, { 66: 1, 67: 1, 68: 1 });
    assert.deepEqual((await read()).selected, []);
    assert.equal((await cast(67, false)).status, 200);
    assert.equal((await cast(69)).status, 200);
    assert.equal((await cast(66, true, 2)).status, 200);
    assert.deepEqual((await read(1)).selected, [66, 68, 69]);
    assert.deepEqual((await read()).counts, { 66: 2, 68: 1, 69: 1 });
    const likes = await (await f.request('GET', { path: 'likes' })).json();
    assert.deepEqual(likes.counts, { 66: 1 });
  } finally { f.sqlite.close(); }
});

test('simultaneous requests cannot exceed the three database slots', async t => {
  const f = fixture(t);
  try {
    const responses = await Promise.all(Array.from({ length: 20 }, (_, i) =>
      f.request('POST', { body: { entry: 66 + i, selected: true } })));
    assert.equal(responses.filter(response => response.status === 200).length, 3);
    assert.equal(responses.filter(response => response.status === 409).length, 17);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM wild_research_votes_season_two WHERE user_id = 1').get().n, 3);
    assert.throws(() => f.sqlite.prepare(
      'INSERT INTO wild_research_votes_season_two (user_id, entry_number, vote_slot, created_at) VALUES (1, 90, 4, ?)'
    ).run('2026-11-17T12:00:00Z'));
    assert.throws(() => f.sqlite.prepare(
      'INSERT INTO wild_research_votes_season_two (user_id, entry_number, vote_slot, created_at) VALUES (1, 90, 1.5, ?)'
    ).run('2026-11-17T12:00:00Z'));
  } finally { f.sqlite.close(); }
});

test('the endpoint validates identity, origin, content, and the actual second-edition works', async t => {
  const f = fixture(t);
  try {
    const valid = { entry: 66, selected: true };
    assert.equal((await f.request('POST', { user: null, body: valid })).status, 401);
    for (const origin of [null, 'https://evil.example', 'https://reader.scansci.com']) {
      assert.equal((await f.request('POST', { origin, body: valid })).status, 403);
    }
    for (const body of [null, { entry: 1, selected: true }, { entry: 110, selected: true },
      { entry: '66', selected: true }, { entry: 66, selected: 1 }, { ...valid, votes: 10 }]) {
      assert.equal((await f.request('POST', { body })).status, 400);
    }
    assert.equal((await f.request('POST', { body: valid, type: 'text/plain' })).status, 415);
    assert.equal((await f.request('POST', { body: { ...valid, expected_user_id: 2 } })).status, 409);
    assert.equal((await f.request('PUT')).status, 405);
    assert.deepEqual((await (await f.request('GET', { user: null })).json()).counts, {});
  } finally { f.sqlite.close(); }
});

test('the server closes voting at midnight Beijing time and retains the final counts', async t => {
  const f = fixture(t, '2026-11-18T15:59:59.999Z');
  try {
    assert.equal((await f.request('POST', { body: { entry: 66, selected: true } })).status, 200);
    t.mock.timers.setTime(Date.parse('2026-11-18T16:00:00Z'));
    for (const selected of [true, false]) {
      const response = await f.request('POST', { body: { entry: 66, selected } });
      assert.equal(response.status, 403);
      assert.equal((await response.json()).error, 'voting_closed');
    }
    const result = await (await f.request('GET')).json();
    assert.equal(result.open, false);
    assert.deepEqual(result.counts, { 66: 1 });
    delete f.env.WILD_VOTE_END;
    assert.equal((await f.request('POST', { body: { entry: 67, selected: true } })).status, 503);
  } finally { f.sqlite.close(); }
});
