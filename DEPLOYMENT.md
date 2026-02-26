# ScanSci 集成部署说明

## 1. 目标结构
- `www.scansci.com` -> 门户站（本目录 `scansci-portal`）
- `dataset.scansci.com` -> DataRaven
- `journal.scansci.com` -> Journal Scout
- `citation.scansci.com` -> Citation Integrity Lab

三个应用继续独立维护、独立部署，不合并代码库。

## 2. Cloudflare DNS
在 `scansci.com` 区域中新增/确认：
- `CNAME  www      <门户 GitHub Pages 域名>`
- `CNAME  dataset  <dataraven GitHub Pages 域名>`
- `CNAME  journal  <journal-scout GitHub Pages 域名>`
- `CNAME  citation <citation-integrity-lab GitHub Pages 域名>`

建议代理模式先使用 `DNS only`，验证完成后再切换是否代理。

## 3. GitHub Pages 绑定
各仓库根目录 `CNAME` 已配置：
- 门户：`www.scansci.com`
- DataRaven：`dataset.scansci.com`
- Journal Scout：`journal.scansci.com`
- Citation Integrity Lab：`citation.scansci.com`

在每个仓库 `Settings -> Pages` 中启用 Pages，对应分支发布。

## 4. 门户上新流程
1. 新工具先部署到新二级域名。
2. 在 `data/apps.json` 添加一条记录：
   - `id`, `name`, `description`, `cover`, `url`, `category`
3. 推送门户仓库，卡片自动渲染，无需改 HTML。

