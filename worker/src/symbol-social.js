import { STATIC_SYMBOL_IDS } from './symbol-static-ids.js';

const staticIds = JSON.stringify(STATIC_SYMBOL_IDS);
const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
// A dynamic record wins over a static name collision, including withdrawal.
const visible = `EXISTS (SELECT 1 FROM symbols WHERE id=c.id AND status='published')
  OR (EXISTS (SELECT 1 FROM json_each(?) WHERE value=c.id)
      AND NOT EXISTS (SELECT 1 FROM symbols WHERE id=c.id))`;

async function stats(env, ids, current, saved = false) {
  const candidates = saved
    ? "SELECT symbol_id AS id FROM symbol_reactions WHERE user_id=? AND kind='save'"
    : 'SELECT value AS id FROM json_each(?)';
  const rows = await env.DB.prepare(`WITH candidates AS (${candidates})
    SELECT c.id,
      (SELECT COUNT(*) FROM symbol_reactions WHERE symbol_id=c.id AND kind='like') AS likes,
      (SELECT COUNT(*) FROM symbol_reactions WHERE symbol_id=c.id AND kind='save') AS saves,
      (SELECT COUNT(*) FROM symbol_downloads WHERE symbol_id=c.id) AS downloads,
      EXISTS (SELECT 1 FROM symbol_reactions WHERE symbol_id=c.id AND kind='like' AND user_id=?) AS liked,
      EXISTS (SELECT 1 FROM symbol_reactions WHERE symbol_id=c.id AND kind='save' AND user_id=?) AS saved
    FROM candidates c WHERE ${visible}`)
    .bind(saved ? current.id : JSON.stringify(ids), current?.id ?? -1, current?.id ?? -1, staticIds).all();
  return rows.results.map(row => ({ ...row, liked: Boolean(row.liked), saved: Boolean(row.saved) }));
}

export async function handleSymbolSocial(request, env, { user, member, reply, fail, readLimitedJson }) {
  const url = new URL(request.url);
  if (url.pathname === '/api/symbols/social') {
    if (request.method !== 'GET') fail(405, '不支持此请求方法。');
    const scope = url.searchParams.get('scope');
    if (scope && scope !== 'saved') fail(400, '无效列表范围。');
    if (scope === 'saved') return reply({ ok: true, items: await stats(env, [], await member(), true) });
    const requested = (url.searchParams.get('ids') || '').split(',');
    if (requested.length > 100 || requested.some(id => !idPattern.test(id))) fail(400, '请提供 1 至 100 个有效素材 ID。');
    const ids = [...new Set(requested)];
    return reply({ ok: true, items: await stats(env, ids, await user()) });
  }
  const match = url.pathname.match(/^\/api\/symbols\/([^/]+)\/(reaction|download)$/);
  if (!match) return null;
  if (request.method !== 'POST') fail(405, '不支持此请求方法。');
  const [, id, action] = match;
  if (!idPattern.test(id)) fail(404, '素材不存在。');
  const current = action === 'reaction' ? await member() : await user();
  if (!(await stats(env, [id], current)).length) fail(404, '素材不存在。');
  // The visibility condition is repeated in each write to avoid a withdrawal race.
  if (action === 'reaction') {
    const body = await readLimitedJson(request, 1024);
    if (!['like','save'].includes(body.kind) || typeof body.active !== 'boolean') fail(400, '点赞或收藏参数无效。');
    if (body.active) {
      await env.DB.prepare(`INSERT OR IGNORE INTO symbol_reactions (symbol_id,user_id,kind,created_at)
        SELECT c.id,?,?,? FROM (SELECT ? AS id) c WHERE ${visible}`)
        .bind(current.id, body.kind, new Date().toISOString(), id, staticIds).run();
    } else {
      await env.DB.prepare(`DELETE FROM symbol_reactions WHERE symbol_id=? AND user_id=? AND kind=?
        AND EXISTS (SELECT 1 FROM (SELECT ? AS id) c WHERE ${visible})`)
        .bind(id, current.id, body.kind, id, staticIds).run();
    }
  } else {
    const day = new Date().toISOString().slice(0, 10);
    let actor = current ? `user:${current.id}` : null;
    if (!actor) {
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip || !env.JWT_SECRET) fail(503, '下载统计暂不可用。');
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const hash = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`symbol-download:${day}:${ip}`));
      actor = 'anonymous:' + Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('');
    }
    // Counts explicit download clicks, not confirmed transfers. One actor/day/item.
    await env.DB.prepare(`INSERT OR IGNORE INTO symbol_downloads (symbol_id,actor,day)
      SELECT c.id,?,? FROM (SELECT ? AS id) c WHERE ${visible}`).bind(actor, day, id, staticIds).run();
  }
  const [item] = await stats(env, [id], current);
  if (!item) fail(404, '素材不存在。');
  return reply({ ok: true, item });
}
