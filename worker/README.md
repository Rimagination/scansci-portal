# ScanSci API Worker

Cloudflare Worker + D1，实现：

- GitHub OAuth 登录（Authorization Code + PKCE）
- 邮箱验证码登录/注册
- 已登录账号关联 GitHub
- HttpOnly Cookie 会话
- 用户收藏与行为记录

## 路由

- `GET /api/auth/github/start`
- `GET /api/auth/github/link/start`
- `GET /api/auth/github/callback`
- `POST /api/auth/email/request-code`
- `POST /api/auth/email/verify-code`
- `POST /api/auth/logout`
- `GET /api/me`
- `POST /api/actions`
- `GET /api/actions?type=favorite|recent`
- `GET /api/elsevier/serial-title?issn=xxxx-xxxx`
- `GET /api/web/preview-image?url=https://example.com`

## 环境变量

Secrets：

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `ELSEVIER_API_KEY`

Vars（wrangler.toml）：

- `PUBLIC_ORIGIN`
- `SESSION_TTL_SECONDS`
- `GITHUB_OAUTH_SCOPE`
- `EMAIL_CODE_TTL_SECONDS`
- `EMAIL_CODE_MAX_ATTEMPTS`
- `ALLOW_DEV_EMAIL_CODE`
- `CORS_ORIGINS`

## D1 SQL

按顺序执行：

- `sql/0001_init.sql`
- `sql/0002_auth_methods.sql`

## 本地调试

```bash
wrangler dev
```

## 安全策略

- OAuth 使用 PKCE
- Session 仅存 HttpOnly Cookie（不放 localStorage）
- POST 接口校验 Origin（同源）
- 验证码限频与尝试次数限制
