import { handleWildResearchLikes } from './wild-research-likes.js';

async function requireAuth(request, env) {
  const response = await env.AUTH.fetch(new Request(`${env.PUBLIC_ORIGIN}/api/me`, {
    headers: { Cookie: request.headers.get('Cookie') || '' },
  }));
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('auth_service_unavailable');
  const userId = Number((await response.json()).user?.id);
  return Number.isSafeInteger(userId) && userId > 0 ? { userId } : null;
}

function jsonResponse(_request, _env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { Allow: 'GET, POST, OPTIONS' } });
    }
    try {
      return await handleWildResearchLikes(request, env, {
        requireAuth,
        jsonResponse,
        getPublicOrigin: () => env.PUBLIC_ORIGIN,
      });
    } catch (error) {
      console.error('Wild research likes failed', error);
      return jsonResponse(request, env, { ok: false, error: 'internal_error' }, 503);
    }
  },
};
