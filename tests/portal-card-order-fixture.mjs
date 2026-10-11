import http from 'node:http';
import { readFileSync } from 'node:fs';
import worker from '../worker/src/index.js';
import { createSymbolsFixture } from '../worker/test/symbols-fixture.mjs';
const f = createSymbolsFixture();
f.sqlite.exec(readFileSync(new URL('../worker/sql/0013_user_card_orders.sql', import.meta.url), 'utf8'));
http.createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url, 'http://127.0.0.1:8782');
    if (url.pathname === '/__reset') {
      f.sqlite.exec('DELETE FROM user_card_orders');
      outgoing.writeHead(200, { 'Content-Type': 'application/json' });
      outgoing.end('{"ok":true}');
      return;
    }
    const user = Number(incoming.headers['x-test-user'] || 0);
    const bytes = [];
    for await (const chunk of incoming) bytes.push(chunk);
    const body = Buffer.concat(bytes);
    const headers = { Origin: 'https://www.scansci.com', 'Content-Type': 'application/json' };
    if (user) headers.Cookie = f.cookie(user);
    const response = await worker.fetch(new Request('https://www.scansci.com' + incoming.url, { method: incoming.method, headers, ...(body.length ? {body} : {}) }), f.env);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    outgoing.writeHead(500, { 'Content-Type': 'application/json' });
    outgoing.end(JSON.stringify({ok:false,error:error.message}));
  }
}).listen(8782, '127.0.0.1', () => process.stdout.write('Local account ordering fixture ready at 127.0.0.1:8782\n'));
