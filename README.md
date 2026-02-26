# ScanSci Portal

ScanSci 的统一入口门户（静态前端）+ Cloudflare Worker API（登录与用户行为）。

## 目录

- `index.html` / `styles.css` / `app.js`：门户前端（GitHub Pages）
- `data/apps.json`：应用卡片数据源
- `assets/covers/`：卡片封面
- `worker/`：Cloudflare Worker + D1（OAuth、会话、用户行为）

## 架构

- 前端：`www.scansci.com`（GitHub Pages）
- API：`www.scansci.com/api/*`（Cloudflare Worker 路由）
- 数据库：Cloudflare D1

这样前端调用 `/api/*` 是同域路径，不需要额外 CORS 配置。

## API（Worker）

- `GET /api/auth/github/start`
- `GET /api/auth/github/callback`
- `POST /api/auth/logout`
- `GET /api/me`
- `POST /api/actions`
- `GET /api/actions?type=favorite|recent`

## 安全策略

- GitHub OAuth 使用 Authorization Code + PKCE
- `client_secret` 仅存放在 Worker Secrets
- 会话使用 `HttpOnly + Secure + SameSite=Lax` Cookie
- 写接口（POST）校验 `Origin`（同源请求）

## Worker 部署

1. 在 Cloudflare 创建 D1 数据库并执行 `worker/sql/0001_init.sql`
2. 编辑 `worker/wrangler.toml`：填入 `database_id`
3. 设置 secrets：
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `JWT_SECRET`
4. 部署 Worker 并绑定路由 `www.scansci.com/api/*`

本地开发示例：

```bash
cd worker
wrangler d1 migrations apply scansci_auth --local
wrangler dev
```

## 上新流程

1. 新应用独立部署到二级域名
2. 在 `data/apps.json` 新增一条记录
3. 提交后门户自动新增卡片
