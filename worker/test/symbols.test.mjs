import test from 'node:test';
import assert from 'node:assert/strict';
import { handleSymbols } from '../src/symbols.js';
import { createSymbolsFixture } from './symbols-fixture.mjs';

const tools = {
  requireAuth: async request => {
    const value = request.headers.get('x-test-user');
    return value ? { userId: Number(value) } : null;
  },
  getUserById: async (env, id) => env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first(),
  isAdminUser: async user => user.id === 2,
};
const body = {
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle r="3"/></svg>',
  title: 'Bird', author: 'ScanSci', license: 'CC-BY-4.0', category: 'animals', tags: ['鸟类'], rights_confirmed: true,
};
function call(fixture, id, upload) {
  const headers = { Origin: 'https://www.scansci.com', 'Content-Type': 'application/json' };
  if (id) headers['x-test-user'] = String(id);
  return handleSymbols(new Request('https://www.scansci.com/api/symbols', {
    method: upload ? 'POST' : 'GET', headers,
    ...(upload ? { body: JSON.stringify({ ...body, ...upload }) } : {}),
  }), fixture.env, tools);
}

test('official provenance, direct publication and ordinary-user spoof resistance', async () => {
  const f = createSymbolsFixture();
  try {
    const official = await (await call(f, 2, {})).json();
    assert.equal(official.status, 'published');
    const spoof = await (await call(f, 1, { official: 1, status: 'published' })).json();
    assert.equal(spoof.status, 'pending');
    f.sqlite.prepare('UPDATE symbols SET reviewer_id=3 WHERE id=?').run(official.id);
    const items = (await (await call(f)).json()).items;
    assert.equal(items.length, 1);
    assert.equal(items[0].official, 1);
    assert.equal(items[0].author, 'ScanSci');
    assert.equal(items[0].license, 'CC-BY-4.0');
  } finally { f.sqlite.close(); }
});

test('verified administrators receive the expanded upload limits', async () => {
  const f = createSymbolsFixture();
  const insert = f.sqlite.prepare("INSERT INTO symbols (id,user_id,title,author,category,license,svg,sha256,created_at,status) VALUES (?,2,'seed','ScanSci','animals','CC-BY-4.0','<svg/>',?,?,'published')");
  try {
    for (let i = 0; i < 199; i++) insert.run(`seed-${i}`, `hash-${i}`, new Date().toISOString());
    assert.equal((await call(f, 2, { svg: body.svg.replace('circle', 'path') })).status, 201);
    const limited = await call(f, 2, { svg: body.svg.replace('circle', 'rect') });
    assert.equal(limited.status, 429);
    assert.match((await limited.json()).error, /24 小时 200 件.*累计 2000 件/);
  } finally { f.sqlite.close(); }
});
