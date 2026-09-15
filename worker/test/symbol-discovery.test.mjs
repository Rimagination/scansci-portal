import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={};vm.runInNewContext(fs.readFileSync(new URL('../../symbols/discovery.js',import.meta.url),'utf8'),context);
const discovery=context.ScanSciSymbolDiscovery;
test('featured interleaves bird, plant, insect and ignores newest upload priority',()=>{
 const ids=discovery.featured.slice(0,3);
 const input=[{id:'new',published_at:'2099-01-01'},...ids.map(id=>({id})).reverse()];
 assert.deepEqual(Array.from(discovery.sort(input,'recommended').map(x=>x.id)),[...ids,'new']);
 assert.equal(discovery.sort(input,'latest')[0].id,'new');
 assert.equal(input[0].id,'new');
});
test('each metric sorts across static and uploaded assets, with deterministic ties',()=>{
 const input=[{id:'upload'},{id:discovery.featured[0]},{id:'other'}];
 const counts=new Map([['upload',{likes:3,saves:2,downloads:0}],['other',{likes:0,saves:5,downloads:8}]]);
 assert.equal(discovery.sort(input,'likes',counts)[0].id,'upload');
 assert.equal(discovery.sort(input,'saves',counts)[0].id,'other');
 assert.equal(discovery.sort(input,'downloads',counts)[0].id,'other');
 assert.equal(discovery.sort(input,'recommended',counts)[0].id,discovery.featured[0]);
});
