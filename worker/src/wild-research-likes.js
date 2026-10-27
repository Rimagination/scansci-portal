import { readMediaBytes } from './reader-media.js';

export async function handleWildResearchLikes(request, env, { requireAuth, jsonResponse, getPublicOrigin }) {
  if (request.method === 'GET') {
    const auth = await requireAuth(request, env);
    const user = auth && await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(auth.userId).first();
    const { results = [] } = await env.DB.prepare(
      'SELECT entry_number, COUNT(*) AS total FROM wild_research_likes GROUP BY entry_number'
    ).all();
    const { results: secondResults = [] } = await env.DB.prepare(
      'SELECT entry_number, COUNT(*) AS total FROM wild_research_likes_season_two GROUP BY entry_number'
    ).all();
    const liked = user ? await env.DB.prepare(
      'SELECT entry_number FROM wild_research_likes WHERE user_id = ?'
    ).bind(user.id).all() : { results: [] };
    const secondLiked = user ? await env.DB.prepare(
      'SELECT entry_number FROM wild_research_likes_season_two WHERE user_id = ?'
    ).bind(user.id).all() : { results: [] };
    return jsonResponse(request, env, {
      ok: true,
      user_id: user?.id ?? null,
      counts: Object.fromEntries([...results, ...secondResults].map(row => [row.entry_number, row.total])),
      liked: [...liked.results, ...secondLiked.results].map(row => row.entry_number),
    });
  }

  if (request.method !== 'POST') {
    const response = jsonResponse(request, env, { ok: false, error: 'method_not_allowed' }, 405);
    response.headers.set('Allow', 'GET, POST, OPTIONS');
    return response;
  }

  if (request.headers.get('Origin') !== getPublicOrigin(request, env)) {
    return jsonResponse(request, env, { ok: false, error: 'forbidden' }, 403);
  }
  const auth = await requireAuth(request, env);
  if (!auth || !await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(auth.userId).first()) {
    return jsonResponse(request, env, { ok: false, error: 'unauthorized' }, 401);
  }
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return jsonResponse(request, env, { ok: false, error: 'invalid_content_type' }, 415);
  }
  let body;
  try {
    body = JSON.parse(new TextDecoder().decode(await readMediaBytes(request, 1024)));
  } catch (error) {
    const tooLarge = error.message === 'media_too_large';
    return jsonResponse(request, env, { ok: false, error: tooLarge ? 'request_too_large' : 'invalid_json' }, tooLarge ? 413 : 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)
      || !Number.isInteger(body.entry) || body.entry < 1 || body.entry > 81
      || typeof body.liked !== 'boolean'
      || !Object.keys(body).every(key => ['entry', 'liked', 'expected_user_id'].includes(key))) {
    return jsonResponse(request, env, { ok: false, error: 'invalid_like' }, 400);
  }
  if (body.expected_user_id !== undefined && body.expected_user_id !== auth.userId) {
    return jsonResponse(request, env, { ok: false, error: 'account_changed' }, 409);
  }
  const table = body.entry > 65 ? 'wild_research_likes_season_two' : 'wild_research_likes';
  if (body.liked) {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO ${table} (entry_number, user_id, created_at) VALUES (?, ?, ?)`
    ).bind(body.entry, auth.userId, new Date().toISOString()).run();
  } else {
    await env.DB.prepare(`DELETE FROM ${table} WHERE entry_number = ? AND user_id = ?`)
      .bind(body.entry, auth.userId).run();
  }
  const count = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM ${table} WHERE entry_number = ?`
  ).bind(body.entry).first();
  return jsonResponse(request, env, { ok: true, entry: body.entry, likes: count.total, liked: body.liked });
}
