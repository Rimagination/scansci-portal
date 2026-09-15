import test from 'node:test';
import assert from 'node:assert/strict';
import {handleSymbols} from '../src/symbols.js';
import {createSymbolsFixture} from './symbols-fixture.mjs';
test('official provenance, direct publication and ordinary-user spoof resistance', async () => {
 const f=createSymbolsFixture();
 const tools={requireAuth:async r=>({userId:Number(r.headers.get('x-test-user'))}),getUserById:async(e,id)=>e.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first(),isAdminUser:async u=>u.id===2};
 const body={svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle r="3"/></svg>',title:'Bird',author:'ScanSci',license:'CC-BY-4.0',category:'animals',tags:['鸟类'],rights_confirmed:true};
 const call=(id,upload)=>handleSymbols(new Request('https://www.scansci.com/api/symbols',{method:upload?'POST':'GET',headers:{Origin:'https://www.scansci.com','Content-Type':'application/json','x-test-user':String(id)},...(upload?{body:JSON.stringify({...body,...upload})}:{})}),f.env,tools);
 try {
  const a=await (await call(2,{})).json(); assert.equal(a.status,'published');
  const b=await (await call(1,{official:1,status:'published'})).json();assert.equal(b.status,'pending');
  f.sqlite.prepare('UPDATE symbols SET reviewer_id=3 WHERE id=?').run(a.id);
  const items=(await (await call(0)).json()).items;assert.equal(items.length,1);assert.equal(items[0].official,1);assert.equal(items[0].author,'ScanSci');assert.equal(items[0].license,'CC-BY-4.0');
 } finally {f.sqlite.close();}
});
