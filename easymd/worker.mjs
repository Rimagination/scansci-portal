const UPSTREAM = 'https://easymd.vercel.app';
const ORIGIN = 'https://www.scansci.com';
const PREFIX = '/easymd';
const COOKIE_NAMES = new Set(['easymd_wechat_browser', 'easymd_wechat_draft_session']);
const API_PATHS = new Set(['/api/upload/image', '/api/import/wechat', '/api/wechat/draft/session', '/api/wechat/draft', '/api/wechat/authorize', '/api/wechat/callback', '/api/wechat/account']);

function toolUrl(value, pathPrefix) {
  try {
    const target = new URL(value, UPSTREAM);
    if (target.origin !== UPSTREAM || (pathPrefix && !target.pathname.startsWith(pathPrefix))) return value;
    return ORIGIN + (target.pathname.startsWith(PREFIX + '/') ? '' : PREFIX) + target.pathname + target.search + target.hash;
  } catch { return value; }
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.startsWith(PREFIX + '/') ? url.pathname.slice(PREFIX.length) : '';
    const isMcp = path === '/mcp';
    const isUpload = /^\/uploads\/[\w./-]+$/.test(path) && !path.split('/').includes('..');
    if (!isMcp && !isUpload && !API_PATHS.has(path)) return new Response('Not found', { status: 404 });
    const origin = request.headers.get('Origin');
    const write = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if ((origin && origin !== ORIGIN) || (write && !isMcp && origin !== ORIGIN)) {
      return Response.json({ error: '请求来源不受支持。' }, { status: 403 });
    }
    if (isUpload && !['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': ORIGIN,
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version',
      'Access-Control-Allow-Credentials': 'true',
      'Cache-Control': 'no-store',
    } });

    const headers = new Headers();
    for (const name of ['accept', 'accept-language', 'content-type', 'mcp-session-id', 'mcp-protocol-version', 'last-event-id']) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    if (isMcp && request.headers.has('authorization')) headers.set('authorization', request.headers.get('authorization'));
    // Forward only this tool's cookies; the ScanSci account session stays on the main site.
    const cookies = (request.headers.get('cookie') || '').split(';').map(value => value.trim()).filter(value => COOKIE_NAMES.has(value.split('=')[0]));
    if (cookies.length) headers.set('cookie', cookies.join('; '));
    headers.set('origin', UPSTREAM);

    let upstream;
    try {
      upstream = await fetch(UPSTREAM + path + url.search, {
        method: request.method, headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'manual',
      });
    } catch {
      return Response.json({ error: '暂时无法完成操作，请稍后重试。' }, { status: 502 });
    }
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete('set-cookie');
    for (const name of [...responseHeaders.keys()]) {
      if (name.startsWith('access-control-')) responseHeaders.delete(name);
    }
    const setCookies = upstream.headers.getSetCookie?.() || (upstream.headers.get('set-cookie') ? [upstream.headers.get('set-cookie')] : []);
    for (const cookie of setCookies) {
      if (!COOKIE_NAMES.has(cookie.split('=')[0])) continue;
      const scoped = cookie.replace(/;\s*Domain=[^;]*/gi, '').replace(/;\s*Path=[^;]*/gi, '') + '; Path=/easymd/';
      responseHeaders.append('set-cookie', scoped);
    }
    const location = responseHeaders.get('location');
    if (location) {
      const redirect = new URL(location, UPSTREAM);
      if (redirect.origin === UPSTREAM) {
        responseHeaders.set('location', toolUrl(location));
      } else if (redirect.origin === 'https://mp.weixin.qq.com' && redirect.pathname === '/cgi-bin/componentloginpage') {
        const callback = redirect.searchParams.get('redirect_uri');
        if (callback) {
          redirect.searchParams.set('redirect_uri', toolUrl(callback, '/api/wechat/callback'));
          responseHeaders.set('location', redirect.href);
        }
      }
    }
    let body;
    if (path === '/api/upload/image' && upstream.ok && responseHeaders.get('content-type')?.includes('application/json')) {
      try {
        const payload = await upstream.clone().json();
        if (typeof payload?.url === 'string') {
          const uploadUrl = toolUrl(payload.url, '/uploads/');
          if (uploadUrl !== payload.url) {
            body = JSON.stringify({ ...payload, url: uploadUrl });
            responseHeaders.delete('content-length');
            responseHeaders.delete('content-encoding');
          }
        }
      } catch { /* Preserve the upstream response if it did not return upload metadata. */ }
    }
    if (isUpload) {
      // User uploads remain viewable images without becoming active main-site documents.
      responseHeaders.set('content-security-policy', "sandbox; default-src 'none'; style-src 'unsafe-inline'");
      responseHeaders.set('x-content-type-options', 'nosniff');
    }
    if (!isUpload) responseHeaders.set('cache-control', 'no-store');
    if (origin === ORIGIN) {
      responseHeaders.set('access-control-allow-origin', ORIGIN);
      responseHeaders.set('access-control-allow-credentials', 'true');
    }
    return new Response(body ?? upstream.body, { status: upstream.status, headers: responseHeaders });
  },
};
