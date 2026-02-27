# ScanSci 部署说明

## 1. 域名与应用拆分

- `www.scansci.com`：门户（GitHub Pages 静态前端）
- `dataset.scansci.com`：DataRaven
- `journal.scansci.com`：Journal Scout
- `citation.scansci.com`：Citation Integrity Lab

三套应用继续独立仓库、独立发布。

## 2. Cloudflare DNS

在 `scansci.com` 下配置：

- `CNAME www -> <portal pages domain>`
- `CNAME dataset -> <dataraven pages domain>`
- `CNAME journal -> <journal pages domain>`
- `CNAME citation -> <citation pages domain>`

## 3. GitHub Pages

每个仓库根目录保留 `CNAME` 文件并在 `Settings -> Pages` 开启发布。

## 4. API 同域挂载（关键）

将 Cloudflare Worker 路由绑定为：

- `www.scansci.com/api/*`

这样前端直接调用 `/api/*`，不需要跨域改造。

## 5. D1 初始化

在 Worker 目录执行：

```bash
cd worker
wrangler d1 execute scansci_auth --remote --file=./sql/0001_init.sql
wrangler d1 execute scansci_auth --remote --file=./sql/0002_auth_methods.sql
```

## 6. Worker Secrets

```bash
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put EMAIL_FROM
```

## 7. OAuth 回调地址（GitHub）

在 GitHub OAuth App 里设置：

- Homepage URL: `https://www.scansci.com`
- Authorization callback URL: `https://www.scansci.com/api/auth/github/callback`

## 8. 门户上新流程

1. 新工具部署到新域名
2. 更新 `data/apps.json`
3. 提交后门户自动渲染新卡片
