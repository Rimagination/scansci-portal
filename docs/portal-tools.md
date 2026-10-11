# ScanSci 内置工具

主站侧栏「素材库」打开 `/#materials`，包含「科研素材库」和「Logo 库」两张卡片，分别进入 `/symbols/` 和 `/logos/`。目录通过 `data/apps.json` 的 `section: "materials"` 归类；在线轻工具展示其他条目，Reader 仍在在线轻工具中。「EasyMD」打开 `/easymd/`，直接在主站 DOM 内运行编辑组件，使用主站配色和导航。编辑器首次进入时加载，切换主站栏目时保留同一个实例。

主站侧栏用 Lucide PanelLeftClose / PanelLeftOpen，记住浏览器中的折叠偏好；EasyMD 组件工具用 Lucide Shapes 设计图标，放在标题 EasyMD 前面，提供独立的打开/收起状态。桌面收起时直接释放组件栏宽度，手机从同一标题按钮打开组件菜单。工具栏通用操作使用 Lucide，微信导出和知乎导出复用原站品牌图标（绿色微信、蓝色知乎），发送到公众号使用绿色 Send。桌面支持左右编辑与预览，手机使用编辑/预览切换。首次进入显示原有手机外框，包含黑色边框、摄像头和圆角屏幕；预览模式继续使用原编辑器的偏好与窄窗口适配。主站的装饰背景隐藏规则仅作用于布局直接子元素。

## 卡片排序与账号菜单

登录后，在线轻工具、素材库和开源工具都可调整卡片顺序，各栏目分别保存到账号。桌面按住卡片图片、标题或空白处拖动；右下角的小型 Lucide GripVertical 按钮支持鼠标、触摸及方向键，Home / End 移到首尾。普通点击继续打开工具，收藏按钮保留原操作。手机正文区域继续正常滚动，拖动按钮靠近屏幕边缘时自动滚动。

放开后自动保存，失败时提供「重新保存」。刷新或其他设备登录后从 `GET /api/me` 恢复 `card_orders`；新增卡片追加在现有顺序后，筛选时保留完整栏目顺序。前端按栏目排队写入，账号切换会丢弃旧请求的回写。

头像和用户名组成账号菜单按钮。退出与 GitHub 关联放入原生 Popover，点击空白或 Escape 可收起；退出恢复默认卡片顺序。

服务使用 `POST /api/me/card-order`，JSON 包含 `section`、`app_ids`、`expected_user_id`。写入限当前认证账号和主站 Origin，最多 200 个唯一 ID / 32 KB；新表见 `worker/sql/0013_user_card_orders.sql`。部署先执行此新增迁移，再发布 Worker 和网页。

`tests/portal-card-order.check.js` 使用真实 Worker 与本地 SQLite 测试账号，覆盖整卡拖动、手机原生触摸与自动滚动、键盘、账号隔离、刷新及新设备恢复、连续排序、失败重试与头像菜单。运行 `node tests/portal-card-order-fixture.mjs` 后用 Playwright CLI `run-code` 执行；本地测试服务仅监听 loopback，不写入线上用户记录。

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
node --test tests/anon-prompt.test.mjs tests/easymd-worker.test.mjs tests/easymd-wechat.test.mjs
```

`/easymd/`、`/easymd/about/`、`/easymd/docs/mcp/`、`/easymd/docs/skill/` 均生成可直接刷新访问的主站页面。同步发布 HTML、bootstrap 和 native 资源。客户端对应源码包位于 `/easymd/source/easymd-native-source.zip`。

## 服务与账户

主站账户区域继续使用 ScanSci 现有登录机制。编辑草稿保存在当前浏览器；此次没有添加草稿的账户同步。

独立 Cloudflare Worker `scansci-easymd-api` 在主站处理图片上传、公众号授权、账户查询、草稿同步、解除连接与微信消息回调，复用 EasyMD 的服务处理函数。授权数据放在独立 D1 `scansci_easymd_private`，使用 AES-256-GCM 加密；OAuth state 使用带期限的单次原子消费。签名会话 Cookie 限定在 `/easymd/`；旧图片和 MCP 代理服务不接收这些 Cookie，也不能写回同名 Cookie。

图片通过 `POST /easymd/api/upload/image` 保存到专用 KV `scansci-easymd-images`，单图上限 5MB；返回 `/easymd/uploads/images/日期/随机标识.扩展名`，支持 GET/HEAD 和图片安全响应头。上传失败保留编辑器正文和光标，不插入无效图片链接。原有 `/easymd/uploads/` 链接继续代理读取。KV 跨地区同步可能需要约 60 秒；启用 R2 后可迁移图片存储。定向验证：`node --test tests/easymd-images.test.mjs tests/easymd-worker.test.mjs`。

刷新令牌使用条件更新，解除连接或换号后旧请求不会恢复旧账户；最终写入草稿前核对连接代次。微信消息使用验签、微信 32 字节 PKCS7 解密和受限流读取，超限即取消。

```powershell
node scripts/build-easymd-wechat.mjs
npx --offline wrangler deploy --config easymd/wrangler.toml
```

当前已配置私有存储和服务器加密密钥；尚未登记 ScanSci 的微信第三方平台 AppID / AppSecret，扫码直写草稿未启用。页面此时提供「复制排版」和「打开公众号后台」，普通管理员可将排版粘贴到图文草稿。平台接入准备见 [公众号服务接入](easymd-wechat.md)。真实文章不会在验证中发送。

## 验证

`tests/portal-tools.check.js` 是 Playwright CLI `run-code` 检查函数，覆盖桌面、较小窗口和手机：入口、Lucide 图标状态、组件插入、实时预览、复制/导出、草稿、路由、刷新、折叠偏好、登录入口和页面边界。默认本地地址 `http://127.0.0.1:8768`，本地仅模拟生产账户读取；线上将 origin 改为 `https://www.scansci.com` 后使用真实服务。

EasyMD 测试在客户端构建配置下运行，避免旧服务端构建配置中的未暴露传递依赖：

```powershell
node node_modules/vitest/vitest.mjs run --config vite.scansci.config.ts --exclude '**/.worktrees/**'
node node_modules/typescript/bin/tsc --noEmit
```
