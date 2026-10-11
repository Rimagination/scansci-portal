# ScanSci 公众号连接服务

目标体验：普通公众号管理员在 ScanSci 点「连接我的公众号」，使用管理员微信授权，再将当前文章写入自己的公众号草稿箱。用户不需要填写公众号 AppSecret。

## 当前可用

`https://www.scansci.com/easymd/` 可编辑、排版、复制微信富文本，并打开 `https://mp.weixin.qq.com/` 后台粘贴到图文草稿。微信导出为线条双气泡图标，公众号发送为 Send 图标。

服务 Worker 和独立私有 D1 已部署。微信平台 AppID / AppSecret 未配置，自动扫码授权及真实草稿写入未启用；测试使用内存 SQLite 和模拟微信响应，不向真实公众号发送文章。

## ScanSci 运营方接入

在 [微信开放平台](https://open.weixin.qq.com/) 创建 ScanSci 的第三方平台，并按平台界面完成测试与发布。此资料属于 ScanSci 服务端，普通公众号管理员仅执行扫码授权。

填写本服务的地址：

| 配置 | 地址 |
| --- | --- |
| 授权回调域 | `www.scansci.com` |
| 授权事件接收 URL | `https://www.scansci.com/easymd/api/wechat/component` |
| 授权完成回调 | `https://www.scansci.com/easymd/api/wechat/callback` |
| 账户状态 | `https://www.scansci.com/easymd/api/wechat/account` |

服务端已生成并配置 `WECHAT_COMPONENT_TOKEN`、`WECHAT_COMPONENT_ENCODING_AES_KEY` 和 `EASYMD_WECHAT_DATA_KEY`。平台登记时使用已保存的 Token / EncodingAESKey；加密密钥保持不变。密钥不进入静态页面、源码包或日志。

将平台提供的两项凭据写入 Worker Secret：

```powershell
npx --offline wrangler secret put WECHAT_COMPONENT_APPID --config easymd/wrangler.toml
npx --offline wrangler secret put WECHAT_COMPONENT_APPSECRET --config easymd/wrangler.toml
```

收到有效 `component_verify_ticket` 后，用平台配置的测试公众号执行一次真实扫码授权，确认公众号昵称、素材接口与图文草稿权限；然后按微信平台流程开放给其他管理员。接入检测和发布依赖微信平台登记信息，当前代码测试不替代该过程。

## 安全与验证

授权会话用签名 HttpOnly Cookie，并限定路径；state 绑定浏览器、十分钟过期且条件删除使其单次有效。令牌与刷新令牌使用 AES-GCM 保存，数据库键以 HMAC 混淆。并发刷新、解除和再次授权通过条件更新隔离；写入前检查连接代次。

`tests/easymd-wechat.test.mjs` 使用实际 SQLite SQL 检查微信回调、授权、单次状态消费、账户隔离、加密、草稿、解除、伪造签名、跨站写入及在途刷新。EasyMD 定向测试检查缺少 Content-Length 时超限立即取消。当前公众号连接按已授权浏览器识别；跨设备绑定到 ScanSci 账号尚未实现。
