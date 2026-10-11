import { readMediaBytes } from './reader-media.js';

const SECTIONS = new Set(['online', 'materials', 'open-source']);
const ID = /^[a-z0-9][a-z0-9_-]{0,79}$/;

export async function getUserCardOrders(env, userId) {
  const rows = await env.DB.prepare('SELECT section, app_ids_json FROM user_card_orders WHERE user_id = ?').bind(userId).all();
  const orders = {};
  for (const row of rows.results || []) {
    if (SECTIONS.has(row.section)) orders[row.section] = JSON.parse(row.app_ids_json);
  }
  return orders;
}

export async function handleCardOrderWrite(request, env, tools) {
  const auth = await tools.requireAuth(request, env);
  if (!auth || !await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(auth.userId).first()) {
    return tools.jsonResponse(request, env, { ok: false, error: 'unauthorized' }, 401);
  }
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return tools.jsonResponse(request, env, { ok: false, error: 'invalid_content_type' }, 415);
  }
  let body;
  try {
    body = JSON.parse(new TextDecoder().decode(await readMediaBytes(request, 32768)));
  } catch (error) {
    const tooLarge = error.message === 'media_too_large';
    return tools.jsonResponse(request, env, { ok: false, error: tooLarge ? 'request_too_large' : 'invalid_json' }, tooLarge ? 413 : 400);
  }
  if (!body || Array.isArray(body) || typeof body !== 'object' || !SECTIONS.has(body.section)
      || !Object.keys(body).every(key => ['section', 'app_ids', 'expected_user_id'].includes(key))
      || !Array.isArray(body.app_ids) || body.app_ids.length > 200
      || !body.app_ids.every(id => typeof id === 'string' && ID.test(id))
      || new Set(body.app_ids).size !== body.app_ids.length) {
    return tools.jsonResponse(request, env, { ok: false, error: 'invalid_card_order' }, 400);
  }
  if (body.expected_user_id !== undefined && body.expected_user_id !== auth.userId) {
    return tools.jsonResponse(request, env, { ok: false, error: 'account_changed' }, 409);
  }
  await env.DB.prepare(`INSERT INTO user_card_orders (user_id, section, app_ids_json, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, section) DO UPDATE SET app_ids_json = excluded.app_ids_json, updated_at = excluded.updated_at`)
    .bind(auth.userId, body.section, JSON.stringify(body.app_ids), new Date().toISOString()).run();
  return tools.jsonResponse(request, env, { ok: true, user_id: auth.userId, section: body.section, app_ids: body.app_ids });
}
