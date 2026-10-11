import { handlers as account } from '@/lib/wechat-draft/http/account'
import { handlers as authorize } from '@/lib/wechat-draft/http/authorize'
import { handlers as callback } from '@/lib/wechat-draft/http/callback'
import { handlers as component } from '@/lib/wechat-draft/http/component'
import { handlers as draft } from '@/lib/wechat-draft/http/draft'
import { withWechatEnvironment } from './environment.mjs'

export { readLimitedBytes } from '@/lib/wechat-draft/service'

const routes = {
  account, authorize, callback, component, draft,
  'draft/session': { GET: account.GET },
}

export function fetchWechatRequest(request: Request, bindings: Record<string, unknown>) {
  const path = new URL(request.url).pathname.slice('/easymd/api/wechat/'.length)
  const handler = routes[path]?.[request.method]
  if (!handler) return Promise.resolve(new Response('Method not allowed', { status: 405 }))
  return withWechatEnvironment(bindings, async () => {
    try {
      const response = await handler({ request })
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'no-store')
      headers.set('X-Content-Type-Options', 'nosniff')
      const cookies = headers.getSetCookie()
      headers.delete('set-cookie')
      for (const cookie of cookies) {
        headers.append('set-cookie', cookie.replace(/;\s*Path=[^;]*/gi, '') + '; Path=/easymd/')
      }
      return new Response(response.body, { status: response.status, headers })
    }
    catch {
      return Response.json({ error: '暂时无法完成操作，请稍后重试。' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
    }
  })
}
