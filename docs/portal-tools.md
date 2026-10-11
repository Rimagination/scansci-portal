# ScanSci 内置工具

主站左侧的「Logo 库」打开现有 `/logos/`。「EasyMD」打开 `/easymd/`，直接在主站 DOM 内运行编辑组件，使用主站配色和导航。编辑器首次进入时加载，切换主站栏目时保留同一个实例。

主站侧栏用 Lucide PanelLeftClose / PanelLeftOpen，记住浏览器中的折叠偏好；EasyMD 组件工具用 Lucide Blocks，提供独立的打开/收起状态。工具栏复制和导出按钮也使用 Lucide。桌面支持左右编辑与预览，手机使用编辑/预览切换。

## 构建与路由

源组件来自 `D:/easymd`。独立客户端入口 `src/scansci-entry.tsx` 复用原编辑器、文件、排版、复制、预览与导出；使用内存路由显示工具文档，主站继续管理浏览器前进、后退和栏目地址。HTML 预览使用原有隔离的 `srcdoc` iframe。

`vite.scansci.config.ts` 生成 `/easymd/native/` 下的完整客户端产物。编辑器 CSS 限定在 `#easymdRoot`，弹出菜单和对话框也放在这个容器内。Worker 中的解析器使用无 DOM 的已安装入口。编辑器运行配置不读取项目 `.env`。

```powershell
# 在 D:/easymd 中执行
node node_modules/vite/bin/vite.js build --config vite.scansci.config.ts

# 在门户仓库中执行
node scripts/build-easymd-bootstrap.mjs
node scripts/build-easymd-page.mjs
node --check app.js
node --test tests/anon-prompt.test.mjs tests/easymd-worker.test.mjs
```

`/easymd/`、`/easymd/about/`、`/easymd/docs/mcp/`、`/easymd/docs/skill/` 均生成可直接刷新访问的主站页面。同步发布 HTML、bootstrap 和 native 资源。客户端对应源码包位于 `/easymd/source/easymd-native-source.zip`。

## 服务与账户

主站账户区域继续使用 ScanSci 现有登录机制。编辑草稿保存在当前浏览器；此次没有添加草稿的账户同步。

独立 Cloudflare Worker `scansci-easymd-api` 接入既有 EasyMD 服务，用固定上游处理图片导入/上传、MCP 和公众号相关端点。主站登录 Cookie 与账户令牌不会传给上游，仅传递工具自己的两种会话 Cookie，并将其限定在 `/easymd/`。写入 API 检查请求来源，上传文档使用 CSP sandbox；根相对上传 URL 会归一到工具目录，外部 CDN 地址保持原样。

```powershell
npx --offline wrangler deploy --config easymd/wrangler.toml
```

当前上游公众号状态接口返回 `configured:false`，公众号草稿发送需要先配置上游服务和微信授权回调域。上游现有授权 URL 还需携带其已创建的 `state`；此项未接入真实公众号授权验证。编辑、预览、复制和文件导出可独立使用。

## 验证

`tests/portal-tools.check.js` 是 Playwright CLI `run-code` 检查函数，覆盖桌面、较小窗口和手机：入口、Lucide 图标状态、组件插入、实时预览、复制/导出、草稿、路由、刷新、折叠偏好、登录入口和页面边界。默认本地地址 `http://127.0.0.1:8768`，本地仅模拟生产账户读取；线上将 origin 改为 `https://www.scansci.com` 后使用真实服务。

EasyMD 测试在客户端构建配置下运行，避免旧服务端构建配置中的未暴露传递依赖：

```powershell
node node_modules/vitest/vitest.mjs run --config vite.scansci.config.ts --exclude '**/.worktrees/**'
node node_modules/typescript/bin/tsc --noEmit
```
