import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { STATIC_SYMBOL_IDS } from '../src/symbol-static-ids.js';
import { createSymbolsFixture } from './symbols-fixture.mjs';

const publicId = '11111111-1111-4111-8111-111111111111';
const privateId = '22222222-2222-4222-8222-222222222222';
const staticId = STATIC_SYMBOL_IDS[0];
function fixture() {
  const f = createSymbolsFixture();
  const insert = f.sqlite.prepare("INSERT INTO symbols (id,user_id,title,author,category,license,svg,sha256,created_at,status) VALUES (?,1,'test','test','plants','CC-BY-4.0','<svg/>',?,'2026-09-15',?)");
  insert.run(publicId, 'public', 'published'); insert.run(privateId, 'private', 'pending');
  f.request = (path, { id, body, method = body ? 'POST' : 'GET', origin = 'https://www.scansci.com', ip = '192.0.2.1' } = {}) => {
    const headers = new Headers();
    if (id) headers.set('Cookie', f.cookie(id));
    if (origin) headers.set('Origin', origin);
    if (ip) headers.set('CF-Connecting-IP', ip);
    if (body) headers.set('Content-Type','application/json');
    return worker.fetch(new Request(`https://www.scansci.com/api/symbols${path}`, { method, headers, body:body ? JSON.stringify(body) : undefined }), f.env);
  };
  return f;
}
const reaction = (f, symbol, kind, active, id = 1) => f.request(`/${symbol}/reaction`, { id, body:{kind,active} });
const download = (f, symbol, options = {}) => f.request(`/${symbol}/download`, { method:'POST', ...options });

test('public stats include zeroes, static allowlist, booleans and exclude private/missing IDs', async () => {
  const f = fixture();
  try {
    assert.ok(staticId);
    const result = await f.request(`/social?ids=${publicId},${privateId},${staticId},unknown`);
    assert.equal(result.status,200); assert.equal(result.headers.get('Cache-Control'),'no-store');
    assert.deepEqual((await result.json()).items, [publicId,staticId].map(id => ({id,likes:0,saves:0,downloads:0,liked:false,saved:false})));
    for (const query of ['', '?ids=bad%27sql','?ids=' + Array(101).fill(publicId).join(','),'?scope=mine']) assert.equal((await f.request('/social'+query)).status,400);
    assert.equal((await f.request(`/social?ids=${publicId},${publicId}`)).status,200);
  } finally { f.sqlite.close(); }
});

test('reactions require auth and same origin; invalid inputs never create rows', async () => {
  const f = fixture();
  try {
    assert.equal((await reaction(f,publicId,'like',true,null)).status,401);
    assert.equal((await f.request('/social?scope=saved')).status,401);
    for (const origin of [null,'https://evil.test','https://dataset.scansci.com']) {
      assert.equal((await f.request(`/${publicId}/reaction`, {id:1,body:{kind:'like',active:true},origin})).status,403);
      assert.equal((await download(f,publicId,{origin})).status,403);
    }
    for (const body of [{kind:'other',active:true},{kind:'like',active:1},{kind:'save'}, {kind:'like',active:'false'}]) assert.equal((await f.request(`/${publicId}/reaction`,{id:1,body})).status,400);
    assert.equal((await f.request(`/${publicId}/reaction`,{id:1})).status,405);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM symbol_reactions').get().n,0);
  } finally { f.sqlite.close(); }
});

test('explicit like/save state is idempotent; counts and saved collections are user-isolated', async () => {
  const f = fixture();
  try {
    for (let i=0;i<2;i++) for (const kind of ['like','save']) assert.equal((await reaction(f,publicId,kind,true)).status,200);
    await reaction(f,staticId,'save',true,3);
    const second = await (await reaction(f,publicId,'like',true,3)).json();
    assert.deepEqual(second.item,{id:publicId,likes:2,saves:1,downloads:0,liked:true,saved:false});
    assert.deepEqual((await (await f.request('/social?scope=saved',{id:1})).json()).items.map(x=>x.id),[publicId]);
    assert.deepEqual((await (await f.request('/social?scope=saved',{id:3})).json()).items.map(x=>x.id),[staticId]);
    for (let i=0;i<2;i++) for (const kind of ['like','save']) await reaction(f,publicId,kind,false);
    const own = (await (await f.request(`/social?ids=${publicId}`,{id:1})).json()).items[0];
    assert.deepEqual(own,{id:publicId,likes:1,saves:0,downloads:0,liked:false,saved:false});
    assert.deepEqual((await (await f.request('/social?scope=saved',{id:1})).json()).items,[]);
    assert.equal((await (await f.request(`/social?ids=${publicId}`)).json()).items[0].liked,false);
  } finally { f.sqlite.close(); }
});

test('private, withdrawn and arbitrary IDs never accept interactions or expose saved state', async () => {
  const f = fixture();
  try {
    await reaction(f,publicId,'save',true);
    f.sqlite.prepare("UPDATE symbols SET status='rejected' WHERE id=?").run(publicId);
    for (const id of [privateId,publicId,'unknown','static-not-allowlisted']) {
      assert.equal((await reaction(f,id,'like',true)).status,404);
      assert.equal((await reaction(f,id,'save',false,2)).status,404);
      assert.equal((await download(f,id)).status,404);
    }
    assert.deepEqual((await (await f.request('/social?scope=saved',{id:1})).json()).items,[]);
    // A withdrawn dynamic collision cannot regain visibility through the static list.
    f.sqlite.prepare('UPDATE symbols SET id=? WHERE id=?').run(staticId,publicId);
    assert.equal((await reaction(f,staticId,'like',true)).status,404);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM symbol_downloads').get().n,0);
  } finally { f.sqlite.close(); }
});

test('download clicks deduplicate daily per actor and never store raw IP', async () => {
  const f = fixture();
  try {
    for(let i=0;i<2;i++) await download(f,staticId);
    assert.equal((await (await download(f,staticId,{ip:'192.0.2.2'})).json()).item.downloads,2);
    for(let i=0;i<2;i++) await download(f,staticId,{id:1,ip:`192.0.2.${i+3}`});
    assert.equal((await (await download(f,staticId,{id:3})).json()).item.downloads,4);
    const rows=f.sqlite.prepare('SELECT * FROM symbol_downloads').all();
    assert.equal(JSON.stringify(rows).includes('192.0.2'),false);
    assert.equal(rows.filter(r=>/^anonymous:[a-f0-9]{64}$/.test(r.actor)).length,2);
    f.sqlite.prepare("UPDATE symbol_downloads SET day='2020-01-01'").run();
    assert.equal((await (await download(f,staticId,{id:1})).json()).item.downloads,5);
    assert.equal((await download(f,staticId,{ip:null})).status,503);
    f.env.JWT_SECRET='';
    assert.equal((await download(f,staticId)).status,503);
  } finally { f.sqlite.close(); }
});
