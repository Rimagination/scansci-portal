# ScanSci Portal

统一入口门户（静态站点）：
- 左侧固定导航：品牌、全局搜索、分类过滤
- 右侧自适应网格：`repeat(auto-fill, minmax(280px, 1fr))`
- 卡片数据源：`data/apps.json`

## 上新流程
1. 部署新工具到独立二级域名。
2. 在 `data/apps.json` 追加一条工具记录。
3. 提交部署后，首页会自动渲染新卡片。

## 建议域名
- 门户：`www.scansci.com`
- DataRaven：`dataset.scansci.com`
- Journal Scout：`journal.scansci.com`
- Citation Integrity Lab：`citation.scansci.com`

