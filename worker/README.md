# ScanSci API Worker

Cloudflare Worker + D1，实现：

- GitHub OAuth (Authorization Code + PKCE)
- HttpOnly Cookie 会话
- 用户收藏与行为记录

## 路由

- `GET /api/auth/github/start`
- `GET /api/auth/github/callback`
- `POST /api/auth/logout`
- `GET /api/me`
- `POST /api/actions`
- `GET /api/actions?type=favorite|recent`

## 环境变量

在 Cloudflare 设置 secrets：

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET`

在 `wrangler.toml` 设置：

- `PUBLIC_ORIGIN`（默认 `https://www.scansci.com`）
- `SESSION_TTL_SECONDS`（默认 30 天）
- `GITHUB_OAUTH_SCOPE`

## D1 表

执行：`sql/0001_init.sql`

- `users`
- `user_actions`
- `user_favorites`

## 本地调试

```bash
wrangler d1 migrations apply scansci_auth --local
wrangler dev
```

## 安全策略

- OAuth 使用 PKCE
- Session 存在 HttpOnly Cookie（不进入 localStorage）
- POST 接口校验 Origin（同源）
