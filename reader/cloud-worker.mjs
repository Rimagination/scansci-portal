import { getReaderMedia } from '../worker/src/reader-media.js';
import { getScientistDirectory } from '../worker/src/reader-scientists.js';
import { getOrcidProfile } from '../worker/src/orcid-profile.js';
import { queryJournalClassifications } from '../worker/src/journal-search.js';

const READER_ORIGIN = 'https://reader.scansci.com';
const ACCOUNT_ORIGIN = 'https://www.scansci.com';
const ACCOUNT_METHODS = new Map([
  ['/api/me', ['GET']],
  ['/api/auth/logout', ['POST']],
  ['/api/reader/openalex-key', ['GET', 'POST']],
  ['/api/reader/openalex', ['POST']],
]);

const json = (body, status = 200, cache = 'no-store') => Response.json(body, {
  status, headers: { 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.scansci.com' && /^\/reader(?:\/|$)/.test(url.pathname)) {
      return Response.redirect(READER_ORIGIN + url.pathname.replace(/^\/reader\/?/, '/') + url.search, 301);
    }
    if (url.origin !== READER_ORIGIN) return new Response('Not found', { status: 404 });
    if (/^\/reader(?:\/|$)/.test(url.pathname)) {
      return Response.redirect(READER_ORIGIN + url.pathname.replace(/^\/reader\/?/, '/') + url.search, 301);
    }
    if (!url.pathname.startsWith('/api/')) {
      if (url.pathname === '/') url.pathname = '/index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }

    const origin = request.headers.get('Origin');
    if ((origin && origin !== READER_ORIGIN) || (request.method === 'POST' && origin !== READER_ORIGIN)) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }
    if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
    const methods = ACCOUNT_METHODS.get(url.pathname);
    if (methods) {
      if (!methods.includes(request.method)) return json({ ok: false, error: 'method_not_allowed' }, 405);
      // Only validated same-origin Reader requests cross the account service boundary.
      const upstream = new Request(ACCOUNT_ORIGIN + url.pathname + url.search, request);
      upstream.headers.set('Origin', ACCOUNT_ORIGIN);
      upstream.headers.delete('Authorization');
      const upstreamResponse = await env.ACCOUNT_API.fetch(upstream);
      const response = new Response(upstreamResponse.body, upstreamResponse);
      response.headers.set('Cache-Control', 'no-store');
      response.headers.delete('Access-Control-Allow-Origin');
      response.headers.delete('Access-Control-Allow-Credentials');
      return response;
    }
    if (request.method !== 'GET') return json({ ok: false, error: 'method_not_allowed' }, 405);
    try {
      if (url.pathname === '/api/reader/media') return await getReaderMedia(request, env);
      if (url.pathname === '/api/reader/researchers') {
        const result = await getScientistDirectory(request, { ...env, DB: env.SCIENTISTS_DB });
        return json(result.body, result.status, result.cacheControl);
      }
      if (url.pathname === '/api/reader/journal-classifications') {
        const result = await queryJournalClassifications(env, { issns: url.searchParams.getAll('issn') });
        return json({ ok: result.ok, ...result }, result.ok ? 200 : 503);
      }
      if (url.pathname === '/api/orcid/profile') {
        const result = await getOrcidProfile(request, env);
        return json(result.body, result.status, result.cacheControl);
      }
      return json({ ok: false, error: 'not_found' }, 404);
    } catch {
      return json({ ok: false, error: 'service_unavailable' }, 503);
    }
  },
};
