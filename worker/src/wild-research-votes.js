import '../../wild/data/season-two.js';
import { readMediaBytes } from './reader-media.js';

// The deployed Worker and gallery use the same list of eligible works.
const entries = new Set(globalThis.WILD_RESEARCHERS.map(entry => entry.number));
const table = 'wild_research_votes_season_two';

export async function handleWildResearchVotes(request, env, { requireAuth, jsonResponse, getPublicOrigin }) {
  const end = Date.parse(env.WILD_VOTE_END || '');
  if (!Number.isFinite(end)) throw new Error('wild_vote_end_not_configured');
  const now = Date.now();
  const open = now < end;

  if (request.method === 'GET') {
    const auth = await requireAuth(request, env);
    const user = auth && await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(auth.userId).first();
    const { results = [] } = await env.DB.prepare(
      `SELECT entry_number, COUNT(*) AS total FROM ${table} GROUP BY entry_number`
    ).all();
    const selected = user ? await env.DB.prepare(
      `SELECT entry_number FROM ${table} WHERE user_id = ? ORDER BY entry_number`
    ).bind(user.id).all() : { results: [] };
    return jsonResponse(request, env, {
      ok: true, user_id: user?.id ?? null, open,
      closes_at: new Date(end).toISOString(), server_time: new Date(now).toISOString(),
      counts: Object.fromEntries(results.map(row => [row.entry_number, row.total])),
      selected: selected.results.map(row => row.entry_number),
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
  if (!open) return jsonResponse(request, env, { ok: false, error: 'voting_closed' }, 403);
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
      || !Number.isInteger(body.entry) || !entries.has(body.entry)
      || typeof body.selected !== 'boolean'
      || !Object.keys(body).every(key => ['entry', 'selected', 'expected_user_id'].includes(key))) {
    return jsonResponse(request, env, { ok: false, error: 'invalid_vote' }, 400);
  }
  if (body.expected_user_id !== undefined && body.expected_user_id !== auth.userId) {
    return jsonResponse(request, env, { ok: false, error: 'account_changed' }, 409);
  }
  const acceptedAt = Date.now();
  if (acceptedAt >= end) return jsonResponse(request, env, { ok: false, error: 'voting_closed' }, 403);

  if (body.selected) {
    // A single atomic write chooses one of three unique slots; parallel requests
    // cannot exceed the limit even when they reach the server together.
    await env.DB.prepare(`
      INSERT OR IGNORE INTO ${table} (user_id, entry_number, vote_slot, created_at)
      SELECT ?, ?, slots.slot, ?
      FROM (SELECT 1 AS slot UNION ALL SELECT 2 UNION ALL SELECT 3) AS slots
      WHERE NOT EXISTS (SELECT 1 FROM ${table} AS v WHERE v.user_id = ? AND v.vote_slot = slots.slot)
      ORDER BY slots.slot LIMIT 1
    `).bind(auth.userId, body.entry, new Date(acceptedAt).toISOString(), auth.userId).run();
  } else {
    await env.DB.prepare(`DELETE FROM ${table} WHERE user_id = ? AND entry_number = ?`)
      .bind(auth.userId, body.entry).run();
  }

  const selected = await env.DB.prepare(
    `SELECT entry_number FROM ${table} WHERE user_id = ? ORDER BY entry_number`
  ).bind(auth.userId).all();
  const chosen = selected.results.map(row => row.entry_number);
  const count = await env.DB.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE entry_number = ?`)
    .bind(body.entry).first();
  if (body.selected && !chosen.includes(body.entry)) {
    return jsonResponse(request, env, { ok: false, error: 'vote_limit', selected: chosen }, 409);
  }
  return jsonResponse(request, env, { ok: true, entry: body.entry, votes: count.total, selected: chosen });
}
