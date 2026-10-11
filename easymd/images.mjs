import { readLimitedBytes } from './wechat/server.mjs';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
const IMAGE_TYPES = new Map([
  ['image/png', 'png'], ['image/jpeg', 'jpg'], ['image/gif', 'gif'],
  ['image/webp', 'webp'], ['image/svg+xml', 'svg'], ['image/avif', 'avif'],
  ['image/bmp', 'bmp'], ['image/tiff', 'tiff'], ['image/x-icon', 'ico'],
]);

function failure(error, status) {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function uploadImage(request, bindings) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
  if (!bindings.IMAGES) return failure('图片存储暂不可用，请稍后重试。', 503);
  if (!/^multipart\/form-data\s*;/i.test(request.headers.get('content-type') || '')) return failure('请求参数错误。', 400);

  let form;
  const tooLarge = new Error('图片大小不能超过 5MB。');
  try {
    if (Number(request.headers.get('content-length')) > MAX_REQUEST_BYTES) {
      await request.body?.cancel();
      throw tooLarge;
    }
    const bytes = await readLimitedBytes(request, MAX_REQUEST_BYTES, tooLarge);
    form = await new Response(bytes, { headers: { 'Content-Type': request.headers.get('content-type') } }).formData();
  } catch (error) {
    return failure(error === tooLarge ? tooLarge.message : '请求参数错误。', error === tooLarge ? 413 : 400);
  }

  const file = form.get('file');
  const name = form.get('name');
  if (!(file instanceof Blob) || typeof name !== 'string' || !name.trim() || name.length > 256) return failure('请求参数错误。', 400);
  const extension = IMAGE_TYPES.get(file.type);
  if (!extension) return failure('只支持上传图片文件。', 400);
  if (!file.size) return failure('图片内容为空。', 400);
  if (file.size > MAX_IMAGE_BYTES) return failure(tooLarge.message, 413);

  const key = `images/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  try {
    // ponytail: KV suits current 5MB images; other regions may lag up to 60s. Move to R2 when it is enabled and immediate global reads are needed.
    await bindings.IMAGES.put(key, await file.arrayBuffer(), { metadata: { contentType: file.type } });
  } catch (error) {
    console.error('EasyMD image storage failed:', error.message);
    return failure('图片保存失败，请稍后重试。', 503);
  }
  return Response.json({ url: `https://www.scansci.com/easymd/uploads/${key}` }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function readImage(request, bindings) {
  const key = new URL(request.url).pathname.slice('/easymd/uploads/'.length);
  if (!/^images\/\d{4}-\d{2}-\d{2}\/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\.(png|jpg|gif|webp|svg|avif|bmp|tiff|ico)$/.test(key)) return new Response('Not found', { status: 404 });
  if (!bindings.IMAGES) return failure('图片存储暂不可用，请稍后重试。', 503);
  try {
    const { value, metadata } = await bindings.IMAGES.getWithMetadata(key, { type: 'arrayBuffer', cacheTtl: 30 });
    if (!value) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return new Response(request.method === 'HEAD' ? null : value, { headers: {
      'Content-Type': metadata?.contentType || 'application/octet-stream',
      'Content-Length': String(value.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Security-Policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch (error) {
    console.error('EasyMD image read failed:', error.message);
    return failure('图片暂不可读取，请稍后重试。', 503);
  }
}
