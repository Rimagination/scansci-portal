import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from '../easymd/worker.mjs';

const origin = 'https://www.scansci.com';
const endpoint = origin + '/easymd/api/upload/image';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jk1sAAAAASUVORK5CYII=', 'base64');
function storage() {
  const values = new Map();
  return { values, IMAGES: {
    async put(key, value, { metadata }) { values.set(key, { value, metadata }); },
    async getWithMetadata(key, options) {
      assert.equal(options.type, 'arrayBuffer');
      return values.get(key) || { value: null, metadata: null };
    },
  } };
}
function upload(bytes = png, type = 'image/png', name = 'image.png', requestOrigin = origin) {
  const body = new FormData();
  body.set('file', new Blob([bytes], { type }), name);
  body.set('name', name);
  return new Request(endpoint, { method: 'POST', headers: requestOrigin ? { origin: requestOrigin } : {}, body });
}

test('uploaded PNG and SVG bytes persist and can be read with GET and HEAD', async () => {
  const bindings = storage();
  for (const [bytes, type, name] of [[png, 'image/png', '../image.html'], [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), 'image/svg+xml', 'figure.svg']]) {
    const saved = await worker.fetch(upload(bytes, type, name), bindings);
    assert.equal(saved.status, 200);
    const { url } = await saved.json();
    assert.match(url, /^https:\/\/www\.scansci\.com\/easymd\/uploads\/images\/\d{4}-\d{2}-\d{2}\/[\da-f-]+\.(png|svg)$/);
    const image = await worker.fetch(new Request(url), bindings);
    assert.equal(image.status, 200);
    assert.equal(image.headers.get('content-type'), type);
    assert.equal(image.headers.get('content-length'), String(bytes.length));
    assert.match(image.headers.get('content-security-policy'), /sandbox/);
    assert.equal(image.headers.get('x-content-type-options'), 'nosniff');
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), bytes);
    const head = await worker.fetch(new Request(url, { method: 'HEAD' }), bindings);
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('content-type'), type);
    assert.equal(await head.text(), '');
  }
  assert.equal(bindings.values.size, 2);
});

test('invalid inputs and writes from other sites never reach image storage', async () => {
  const bindings = storage();
  for (const [request, status] of [
    [upload(png, 'text/html'), 400], [upload(png, 'image/png', ''), 400],
    [upload(new Uint8Array(), 'image/png'), 400], [upload(png, 'image/png', 'x'.repeat(257)), 400],
    [upload(png, 'image/png', 'image.png', 'https://evil.example'), 403],
    [upload(png, 'image/png', 'image.png', null), 403],
    [new Request(endpoint, { headers: { origin } }), 405],
    [new Request(endpoint, { method: 'POST', headers: { origin, 'content-type': 'multipart/form-data; boundary=missing' }, body: 'broken' }), 400],
  ]) assert.equal((await worker.fetch(request, bindings)).status, status);
  assert.equal(bindings.values.size, 0);
});

test('the 5MB file boundary is enforced separately from multipart overhead', async () => {
  const bindings = storage();
  assert.equal((await worker.fetch(upload(new Uint8Array(5 * 1024 * 1024)), bindings)).status, 200);
  assert.equal((await worker.fetch(upload(new Uint8Array(5 * 1024 * 1024 + 1)), bindings)).status, 413);
  assert.equal(bindings.values.size, 1);
});

test('oversized bodies are cancelled even when Content-Length is absent', async () => {
  for (const contentLength of [undefined, String(6 * 1024 * 1024)]) {
    let cancelled = false;
    const body = new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(6 * 1024 * 1024)); },
      cancel() { cancelled = true; },
    });
    const request = new Request(endpoint, { method: 'POST', duplex: 'half', body, headers: {
      origin, 'content-type': 'multipart/form-data; boundary=probe', ...(contentLength ? { 'content-length': contentLength } : {}),
    } });
    const bindings = storage();
    assert.equal((await worker.fetch(request, bindings)).status, 413);
    assert.equal(cancelled, true);
    assert.equal(bindings.values.size, 0);
  }
});

test('missing storage, failed writes and missing keys produce uncached failures', async () => {
  const missingBinding = await worker.fetch(upload());
  assert.equal(missingBinding.status, 503);
  assert.equal(missingBinding.headers.get('cache-control'), 'no-store');
  const failed = await worker.fetch(upload(), { IMAGES: { async put() { throw new Error('Offline'); } } });
  assert.equal(failed.status, 503);
  assert.equal((await failed.json()).url, undefined);
  const missing = await worker.fetch(new Request(origin + '/easymd/uploads/images/2026-10-11/00000000-0000-0000-0000-000000000000.png'), storage());
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('cache-control'), 'no-store');
});
