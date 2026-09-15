import { validateSvg, MAX_SVG_BYTES } from './svg-validation.js';
import { handleSymbolSocial } from './symbol-social.js';

const CATEGORIES = new Set(['plants','animals','biology','ecology','earth','laboratory','medicine','engineering','other']);
const LICENSES = new Set(['CC0-1.0','CC-BY-4.0']);
const COLUMNS = "id,title,description,author,category,tags_json,license,source_url,status,created_at,published_at,reason,official";
const PAGE_SIZE = 24;
function fail(status, message) { const e = new Error(message); e.status = status; throw e; }
function text(value, max, required = false, multiline = false) {
  const controls = multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/;
  if (typeof value !== 'string' || value.length > max || controls.test(value)) fail(400, '文字字段无效或过长。');
  const result = value.trim();
  if (required && !result) fail(400, '请填写所有必填字段。');
  return result;
}
export async function readLimitedJson(request, limit = MAX_SVG_BYTES * 6 + 8192) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) fail(415, '请使用 JSON 上传。');
  if (Number(request.headers.get('Content-Length')) > limit) fail(413, '上传内容过大。');
  if (!request.body) fail(400, '上传内容为空。');
  const reader = request.body.getReader(), chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); fail(413, '上传内容过大。'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch { fail(400, 'JSON 格式无效。'); }
}
export function submissionFields(body) {
  if (body.rights_confirmed !== true) fail(400, '请确认拥有分享权限并同意所选许可。');
  if (!CATEGORIES.has(body.category) || !LICENSES.has(body.license)) fail(400, '请选择有效分类和许可。');
  if (!Array.isArray(body.tags) || body.tags.length > 8) fail(400, '标签最多 8 个。');
  const source = text(body.source_url ?? '', 500);
  if (source) {
    let url;
    try { url = new URL(source); } catch { fail(400, '来源链接无效。'); }
    if (url.protocol !== 'https:' || url.username || url.password) fail(400, '来源链接需使用不含账号密码的 HTTPS 地址。');
  }
  return {
    title: text(body.title, 80, true), description: text(body.description ?? '', 1000, false, true),
    author: text(body.author, 80, true), category: body.category,
    tags: [...new Set(body.tags.map(tag => text(tag, 24, true)))], license: body.license, source_url: source,
  };
}
function item(row, scope) {
  const result = { ...row, tags: JSON.parse(row.tags_json), preview_url: `/api/symbols/${row.id}/file`, download_url: `/api/symbols/${row.id}/file?download=1` };
  delete result.tags_json;
  if (scope === 'public') delete result.reason;
  return result;
}

export async function handleSymbols(request, env, authTools) {
  const reply = (payload, status = 200) => Response.json(payload, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  try {
    if (env.SYMBOLS_ENABLED !== '1') fail(503, '素材库投稿服务尚未开放。');
    const url = new URL(request.url), path = url.pathname;
    if (!['GET','POST'].includes(request.method)) fail(405, '不支持此请求方法。');
    // This subpage only needs same-origin writes, not the portal's broader subdomain CORS policy.
    if (request.method === 'POST' && request.headers.get('Origin') !== url.origin) fail(403, '请从本站页面提交。');
    let identity;
    async function user() {
      if (identity === undefined) {
        const auth = await authTools.requireAuth(request, env);
        identity = auth ? await authTools.getUserById(env, auth.userId) : null;
      }
      return identity;
    }
    async function member() { const current = await user(); if (!current) fail(401, '请先登录 ScanSci。'); return current; }
    async function admin() { const current = await member(); if (!await authTools.isAdminUser(current, env)) fail(403, '需要审核员权限。'); return current; }
    const social = await handleSymbolSocial(request, env, { user, member, reply, fail, readLimitedJson });
    if (social) return social;
    if (path === '/api/symbols/session' && request.method === 'GET') {
      const current = await user();
      return reply({ ok: true, user: current ? { id: current.id, login: current.login } : null, can_review: current ? await authTools.isAdminUser(current, env) : false });
    }
    if (path === '/api/symbols' && request.method === 'GET') {
      const scope = url.searchParams.get('scope') || 'public';
      if (!['public','mine','review'].includes(scope)) fail(400, '无效列表范围。');
      const q = text(url.searchParams.get('q') || '', 80), category = url.searchParams.get('category') || '';
      if (category && !CATEGORIES.has(category)) fail(400, '无效分类。');
      const page = Number(url.searchParams.get('page') || 1);
      if (!Number.isInteger(page) || page < 1 || page > 1000) fail(400, '无效页码。');
      const where = [], args = [];
      if (scope === 'mine') { where.push('user_id = ?'); args.push((await member()).id); }
      else { if (scope === 'review') await admin(); where.push('status = ?'); args.push(scope === 'review' ? 'pending' : 'published'); }
      if (category) { where.push('category = ?'); args.push(category); }
      if (q) {
        const escaped = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
        where.push("(title LIKE ? ESCAPE '\\' OR author LIKE ? ESCAPE '\\' OR tags_json LIKE ? ESCAPE '\\')");
        args.push(escaped, escaped, escaped);
      }
      const rows = await env.DB.prepare(`SELECT ${COLUMNS} FROM symbols WHERE ${where.join(' AND ')} ORDER BY ${scope === 'public' ? 'published_at' : 'created_at'} DESC,id DESC LIMIT ? OFFSET ?`).bind(...args, PAGE_SIZE + 1, (page - 1) * PAGE_SIZE).all();
      return reply({ ok: true, items: rows.results.slice(0, PAGE_SIZE).map(row => item(row, scope)), page, has_more: rows.results.length > PAGE_SIZE });
    }
    if (path === '/api/symbols' && request.method === 'POST') {
      const current = await member();
      const body = await readLimitedJson(request);
      const official = await authTools.isAdminUser(current, env);
      const fields = submissionFields(official ? { ...body, author: 'ScanSci', license: 'CC-BY-4.0', rights_confirmed: true } : body);
      const status = official ? 'published' : 'pending';
      const quota = official ? { daily: 200, pending: 50, total: 2000 } : { daily: 20, pending: 50, total: 200 };
      let svg;
      try { svg = validateSvg(body.svg); } catch (error) { fail(400, error.message); }
      const hashBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(svg));
      const hash = Array.from(new Uint8Array(hashBytes), n => n.toString(16).padStart(2, '0')).join('');
      const id = crypto.randomUUID(), now = new Date().toISOString(), day = new Date(Date.now() - 86400000).toISOString();
      // ponytail: SVG text lives in D1 (200 KiB/file; 200/user, 2000/admin).
      // Move bodies to R2 when measured storage usage warrants it; metadata/API can stay unchanged.
      const result = await env.DB.prepare(`INSERT INTO symbols (id,user_id,title,description,author,category,tags_json,license,source_url,svg,sha256,created_at,status,reviewer_id,reviewed_at,published_at,official)
        SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        WHERE (SELECT COUNT(*) FROM symbols WHERE user_id = ? AND created_at > ?) < ?
          AND (SELECT COUNT(*) FROM symbols WHERE user_id = ? AND status = 'pending') < ?
          AND (SELECT COUNT(*) FROM symbols WHERE user_id = ?) < ?
          AND NOT EXISTS (SELECT 1 FROM symbols WHERE user_id = ? AND sha256 = ?)`)
        .bind(id,current.id,fields.title,fields.description,fields.author,fields.category,JSON.stringify(fields.tags),fields.license,fields.source_url,svg,hash,now,status,official ? current.id : null,official ? now : null,official ? now : null,official ? 1 : 0,current.id,day,quota.daily,current.id,quota.pending,current.id,quota.total,current.id,hash).run();
      if (!result.meta.changes) {
        const duplicate = await env.DB.prepare('SELECT id FROM symbols WHERE user_id = ? AND sha256 = ?').bind(current.id,hash).first();
        fail(duplicate ? 409 : 429, duplicate ? '你已提交过相同素材，请查看我的投稿。' : `已达到投稿限额（滚动 24 小时 ${quota.daily} 件、待审 ${quota.pending} 件、累计 ${quota.total} 件）。`);
      }
      return reply({ ok: true, id, status }, 201);
    }
    const match = path.match(/^\/api\/symbols\/([a-f0-9-]{36})\/(file|moderate)$/);
    if (!match) fail(404, '素材不存在。');
    const [, id, action] = match;
    if (action === 'file' && request.method === 'GET') {
      const row = await env.DB.prepare('SELECT user_id,status,svg FROM symbols WHERE id = ?').bind(id).first();
      if (!row) fail(404, '素材不存在。');
      if (row.status !== 'published') {
        const current = await user();
        if (!current || (current.id !== row.user_id && !await authTools.isAdminUser(current, env))) fail(404, '素材不存在。');
      }
      return new Response(row.svg, { headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8', 'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "sandbox; default-src 'none'; style-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        'Cross-Origin-Resource-Policy': 'same-origin', 'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store',
        'Content-Disposition': `${url.searchParams.get('download') === '1' ? 'attachment' : 'inline'}; filename="scansci-${id}.svg"`,
      } });
    }
    if (action === 'moderate' && request.method === 'POST') {
      const current = await admin(), body = await readLimitedJson(request, 4096);
      if (!['published','rejected'].includes(body.status)) fail(400, '审核状态无效。');
      const reason = text(body.reason ?? '', 500, body.status === 'rejected', true);
      const row = await env.DB.prepare('SELECT id FROM symbols WHERE id = ?').bind(id).first();
      if (!row) fail(404, '素材不存在。');
      const now = new Date().toISOString();
      await env.DB.batch([
        env.DB.prepare('UPDATE symbols SET status=?,reason=?,reviewer_id=?,reviewed_at=?,published_at=? WHERE id=?').bind(body.status,reason,current.id,now,body.status === 'published' ? now : null,id),
        env.DB.prepare('INSERT INTO symbol_reviews (symbol_id,reviewer_id,status,reason,created_at) VALUES (?,?,?,?,?)').bind(id,current.id,body.status,reason,now),
      ]);
      return reply({ ok: true, id, status: body.status });
    }
    fail(405, '不支持此请求方法。');
  } catch (error) {
    if (!error.status) console.error('Symbols API failed', error);
    return reply({ ok: false, error: error.status ? error.message : '素材服务暂不可用，请稍后重试。' }, error.status || 503);
  }
}
