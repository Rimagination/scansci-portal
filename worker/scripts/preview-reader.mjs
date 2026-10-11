// Local public Reader preview: real directory queries, no account credentials.
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { getScientistDirectory } from '../src/reader-scientists.js';
import { getReaderMedia } from '../src/reader-media.js';
import { getOrcidProfile } from '../src/orcid-profile.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const readerRoot = path.join(root, 'reader');
const database = new DatabaseSync(path.join(root, 'worker/data/reader-scientists/scientists.sqlite'), { readOnly: true });
const DB = {
  prepare(sql) {
    const statement = database.prepare(sql);
    const bound = (values = []) => ({
      bind: (...args) => bound(args),
      first: async () => statement.get(...values) || null,
      all: async () => ({ results: statement.all(...values) }),
    });
    return bound();
  },
};
const mime = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
function json(response, body, status) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(body));
}
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname.startsWith('/api/')) {
      if (request.method !== 'GET') { json(response, { ok: false, error: 'method_not_allowed' }, 405); return; }
      if (url.pathname === '/api/reader/media') {
        const result = await getReaderMedia(new Request(url), {});
        response.writeHead(result.status, Object.fromEntries(result.headers));
        response.end(Buffer.from(await result.arrayBuffer())); return;
      }
      if (url.pathname === '/api/reader/researchers') {
        const result = await getScientistDirectory(new Request(url), { DB });
        json(response, result.body, result.status); return;
      }
      if (url.pathname === '/api/orcid/profile') {
        const result = await getOrcidProfile(new Request(url), {});
        json(response, result.body, result.status); return;
      }
      json(response, { ok: false, error: url.pathname === '/api/me' ? 'unauthorized' : 'preview_endpoint_unavailable' }, url.pathname === '/api/me' ? 401 : 404); return;
    }
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
    if (url.pathname === '/' || url.pathname === '/reader') { response.writeHead(302, { Location: '/reader/' }); response.end(); return; }
    if (!url.pathname.startsWith('/reader/')) { response.writeHead(404); response.end(); return; }
    const relative = decodeURIComponent(url.pathname.slice('/reader/'.length)) || 'index.html';
    if (relative.split(/[\\/]/).some(part => part.startsWith('.'))) { response.writeHead(404); response.end(); return; }
    const target = path.resolve(readerRoot, relative);
    if (!target.startsWith(readerRoot + path.sep)) { response.writeHead(404); response.end(); return; }
    const file = await stat(target);
    if (!file.isFile()) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Content-Length': file.size, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    if (request.method === 'HEAD') response.end();
    else createReadStream(target).pipe(response);
  } catch (error) {
    if (!response.headersSent) response.writeHead(error.code === 'ENOENT' ? 404 : 500);
    response.end();
  }
});
server.listen(Number(process.env.READER_PREVIEW_PORT || 8766), '127.0.0.1', () => console.log(`Reader preview: http://127.0.0.1:${server.address().port}/reader/`));
