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
- `GET /api/journals/:issn/submission-stats`
- `POST /api/journals/:issn/ratings`
- `POST /api/actions`
- `GET /api/actions?type=favorite|recent`
- `GET /api/elsevier/serial-title?issn=xxxx-xxxx`
- `POST /api/admin/elsevier/cache/upsert`（管理员）
- `POST /api/admin/elsevier/cache/batch-upsert`（管理员）
- `POST /api/admin/submission-stats/batch-upsert`（管理员）
- `GET /api/web/preview-image?url=https://example.com`

## 环境变量

Secrets：

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `ELSEVIER_API_KEY`
- `ADMIN_SYNC_TOKEN`（用于 GitHub Actions 批量写入缓存）

Vars（wrangler.toml）：

- `PUBLIC_ORIGIN`
- `SESSION_TTL_SECONDS`
- `GITHUB_OAUTH_SCOPE`
- `EMAIL_CODE_TTL_SECONDS`
- `EMAIL_CODE_MAX_ATTEMPTS`
- `ALLOW_DEV_EMAIL_CODE`
- `CORS_ORIGINS`
- `ELSEVIER_SECONDARY_PROXY_BASE`（可选，Elsevier 直连失败时回退到二级代理，如 Vercel/Fly）
- `ELSEVIER_SECONDARY_FIRST`（可选，`1` 表示优先走二级代理，推荐在 Worker 出口受限时开启）
- `ELSEVIER_UPSTREAM_TIMEOUT_MS`（可选，Elsevier 直连超时毫秒，默认 `3500`）
- `ELSEVIER_CACHE_TTL_SECONDS`（可选，缓存有效期秒，默认 `604800`）
- `ELSEVIER_CACHE_STALE_SECONDS`（可选，允许返回过期缓存的宽限秒，默认 `2592000`）

## Elsevier 高可用策略（免费）

`/api/elsevier/serial-title` 采用以下顺序：

1. 先查 D1 缓存（命中即返回，毫秒级）
2. 缓存失效后尝试 Elsevier 直连（Worker 出口）
3. 直连失败时自动回退 `ELSEVIER_SECONDARY_PROXY_BASE`（可选）
4. 若存在“未过久”的过期缓存，优先返回过期缓存，避免前端报错

当 `ELSEVIER_SECONDARY_FIRST=1` 且配置了二级代理时，将优先请求二级代理（减少前端超时）。

## 管理员缓存写入

管理员接口使用 Header：

- `X-ScanSci-Admin-Token: <ADMIN_SYNC_TOKEN>`

`batch-upsert` body 示例：

```json
{
  "items": [
    {
      "issn": "0028-0836",
      "payload": { "serial-metadata-response": {} },
      "ttlSeconds": 604800,
      "source": "gha-sync"
    }
  ]
}
```

`submission-stats batch-upsert` body 示例：

```json
{
  "items": [
    {
      "issn": "0028-0836",
      "source_name": "Elsevier",
      "source_type": "official",
      "source_url": "https://www.example.com/journal",
      "review_time_days": 19,
      "first_decision_days": 19,
      "accept_rate_pct": 23,
      "fetched_at": "2026-03-21T00:00:00.000Z",
      "parser_version": "2026-03-21-v1",
      "raw_json": { "source": "etl" }
    }
  ]
}
```

## GitHub Actions 定时同步（推荐）

已提供工作流：

- `.github/workflows/elsevier-cache-sync.yml`

需要在 GitHub 仓库 Secrets 中设置：

- `ELSEVIER_API_KEY`
- `SCANSCI_ADMIN_SYNC_TOKEN`

并在 Worker Secrets 中设置同一值：

```bash
wrangler secret put ADMIN_SYNC_TOKEN
```

工作流会定时拉取 `https://journal.scansci.com/data/search_index.json` 的 ISSN 列表，
请求 Elsevier 后批量写入 D1 缓存。

## 投稿评价同步

- 解析与归一化逻辑：`src/submission-stats.mjs`
- 离线同步脚本：`scripts/sync_submission_stats.mjs`
- 解析测试样例：`test/fixtures/submission-*.html`

命令示例：

```bash
export ADMIN_SYNC_TOKEN=xxxx
node scripts/sync_submission_stats.mjs ./sources.json
```

`sources.json` 需要提供公开页面种子，例如：

```json
[
  {
    "issn": "0028-0836",
    "source_name": "Elsevier",
    "source_url": "https://www.example.com/journal"
  },
  {
    "issn": "0028-0836",
    "source_name": "LetPub",
    "source_url": "https://www.letpub.com.cn/index.php?page=journalapp&view=detail&journalid=123"
  }
]
```

## D1 SQL

按顺序执行：

- `sql/0001_init.sql`
- `sql/0002_auth_methods.sql`
- `sql/0003_elsevier_cache.sql`
- `sql/0004_submission_stats.sql`

## 本地调试

```bash
wrangler dev
```

## 安全策略

- OAuth 使用 PKCE
- Session 仅存 HttpOnly Cookie（不放 localStorage）
- POST 接口校验 Origin（同源）
- 验证码限频与尝试次数限制
