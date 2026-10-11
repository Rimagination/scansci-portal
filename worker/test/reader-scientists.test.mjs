import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { getScientistDirectory, scientistSearchTerms } from '../src/reader-scientists.js';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../sql/0012_reader_scientists.sql', import.meta.url), 'utf8'));
const first = 'a'.repeat(32), second = 'b'.repeat(32), third = 'c'.repeat(32);
const rows = [
  [first, 'Wang, Zhong Lin', 'Zhong Lin Wang', 'Chinese Academy of Sciences', 'Physics & Astronomy', 'Nanoscience', 1, 4, {localName:'王中林', photoUrl:'https://example.edu/wang.jpg', photoSource:'https://example.edu/wang', orcid:'0000-0002-5530-0380', orcidSource:'https://example.edu/wang'}],
  [second, 'Kresse, Georg', 'Georg Kresse', 'Universität Wien', 'Physics & Astronomy', 'Applied Physics', 2, 3, {photoUrl:'https://example.edu/unverified.jpg', orcid:'0000-0002-5530-0381', orcidSource:'https://example.edu/invalid', researchgate:'javascript:alert(1)', researchgateSource:'https://example.edu/profile'}],
  [third, 'Other, Researcher', 'Researcher Other', 'Another University', 'Clinical Medicine', 'Medicine', null, 1, {}],
];
const insert = sqlite.prepare('INSERT INTO reader_scientists (roster_id,roster_name,name,institution,country,field,subfield,annual_rank,career_rank,profile_json) VALUES (?,?,?,?,?,?,?,?,?,?)');
for (const [id,roster,name,institution,field,subfield,annual,career,profile] of rows) {
  insert.run(id,roster,name,institution,'chn',field,subfield,annual,career,JSON.stringify(profile));
  sqlite.prepare('INSERT INTO reader_scientists_search VALUES (?,?,?,?,?,?)').run(id,name,institution,field,subfield,profile.localName || '');
}
sqlite.prepare('INSERT INTO reader_scientists_metadata VALUES (?,?)').run('source',JSON.stringify({counts:{annual:2,career:3},edition:2026,citationYear:2025,fields:['Physics & Astronomy','Clinical Medicine']}));
const env = {DB:{prepare(sql){const statement=sqlite.prepare(sql); const bind=(args=[])=>({bind:(...next)=>bind(next),first:async()=>statement.get(...args)||null,all:async()=>({results:statement.all(...args)})}); return bind();}}};
const query = async search => getScientistDirectory(new Request(`https://www.scansci.com/api/reader/researchers${search}`), env);

let result = await query('?limit=1');
assert.equal(result.status,200); assert.equal(result.body.total,2); assert.equal(result.body.researchers[0].id,first); assert.equal(result.body.hasMore,true);
assert.equal(result.body.researchers[0].profile.orcid,'0000-0002-5530-0380');
result = await query('?limit=1&page=2');
assert.equal(result.body.researchers[0].id,second); assert.equal(result.body.hasMore,false);
assert.equal(result.body.researchers[0].profile.photoUrl,undefined); assert.equal(result.body.researchers[0].profile.orcid,undefined); assert.equal(result.body.researchers[0].profile.researchgate,undefined);
assert.equal((await query('?q=universitat')).body.researchers[0].id,second); // Accent-insensitive institution search.
assert.equal((await query('?q=%E7%8E%8B%E4%B8%AD%E6%9E%97')).body.researchers[0].id,first); // Verified Chinese alias.
assert.equal((await query('?list=career&field=Clinical%20Medicine')).body.researchers[0].id,third);
assert.equal((await query(`?id=${third}`)).body.researchers[0].id,third); // Direct-link lookup also finds career-only records.
assert.equal((await query('?q=%22%20OR%20%2A')).body.total,0); // FTS syntax is treated as text.
assert.equal((await query('?q=%27%3BDELETE%20FROM%20reader_scientists%3B--')).body.total,0);
assert.equal(sqlite.prepare('SELECT count(*) AS n FROM reader_scientists').get().n,3);
for (const invalid of ['?list=anything','?limit=49','?page=-1','?page=1.5','?id=wrong','?q='+ 'x'.repeat(161)]) assert.equal((await query(invalid)).status,400);
assert.equal(scientistSearchTerms('Georg-Kresse'), '"Georg"* AND "Kresse"*');
assert.equal((await getScientistDirectory(new Request('https://example.com/'),{})).status,503);
sqlite.close();
console.log('Passed: directory pagination, exact detail lookup, fields, Unicode search, query bounds and evidence-only identity links.');
