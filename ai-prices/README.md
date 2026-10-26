# ScanSci AI 比价

静态页面入口：`/ai-prices/`。页面展示 ChatGPT、Claude、Grok、Gemini 和 Meta AI，支持中文与英文切换。已核对的套餐价格为公开来源快照；点击表格中的国家或地区名称核对官方页面。Meta One 只展示官方公布的美元起售价。

## 更新数据

运行 `node ai-prices/update-data.mjs`，再运行 `node ai-prices/verify-data.mjs`。GitHub Actions 的 `AI price snapshot` 工作流每天自动执行，也支持手动运行。导入失败时脚本不会覆盖现有快照。

- iOS 套餐地区价格：[BiWu.Ai 公开报价接口](https://biwu.ai/api/official-prices/offers?planId=chatgpt__plus-monthly&page=1&pageSize=100)，每条记录带 Apple 官方页面链接。该接口由其网站使用，未见稳定性承诺；导入脚本检查分页总数，失败时保留旧快照。
- 官网套餐价格：[PlanPrice 开放数据](https://plan-price.com/data/)及美国价格页面，采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 署名。
- Meta AI 核心体验免费及 Meta One Core/Premium 的美元月费起售价来自 [Meta 官方公告](https://about.fb.com/news/2026/09/introducing-meta-one-subscription-service-more-features-ai/)；[官方 App Store 页面](https://apps.apple.com/us/app/meta-ai/id1558240027)用于核对应用身份、免费下载和内购标识。公告明确说明价格会因地区、应用及账号变化，故不将起售价计入地区排行榜。
- 美元汇率：[open.er-api.com](https://open.er-api.com/v6/latest/USD)。

当前 Grok 官网缺少可核对的结构化套餐价格，因此页面仅显示已核对渠道。

## 官方应用图标

图标通过 Apple iTunes Lookup API 获取，保存在 `assets/`，入口封面嵌入同一图标文件的原始字节。

| 产品 | 发行方 | 官方页面 |
| --- | --- | --- |
| ChatGPT | OpenAI OpCo, LLC | https://apps.apple.com/app/id6448311069 |
| Claude | Anthropic PBC | https://apps.apple.com/app/id6473753684 |
| Grok | X Corp. | https://apps.apple.com/app/id6670324846 |
| Gemini | Google | https://apps.apple.com/app/id6477489729 |
| Meta AI | Meta Platforms, Inc. | https://apps.apple.com/app/id1558240027 |
