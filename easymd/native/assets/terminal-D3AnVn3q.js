const r=`/* ============================================\r
   Terminal - 命令行界面风格\r
   Cyber-Industrial / Hacker / System-Level\r
   深色背景 + 经典绿色荧光 + CRT 美学\r
   ============================================ */\r
\r
/* 配色定义（硬编码）\r
   背景色: #0a0a0a (深黑)\r
   主绿色: #33ff00 (终端绿/磷光绿)\r
   暗绿色: #1f521f (边框/暗色)\r
   亮绿色: #2de02d, #28c928, #22aa22 (H2-H4 渐变)\r
   琥珀色: #ffb000 (警告/强调)\r
   青色: #00ffff (链接/变量)\r
   品红: #ff00ff (重要)\r
   红色: #ff3333 (错误/删除)\r
   灰色: #4a4a4a, #6b6b6b, #888888\r
*/\r
\r
/* 容器 - 终端窗口 */\r
#easymd {\r
  color: #33ff00;\r
  background-color: #0a0a0a;\r
  font-family:\r
    'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Fira Mono', 'Roboto Mono', 'Consolas', 'Liberation Mono', 'Menlo',\r
    'Courier New', monospace;\r
  font-size: 15px;\r
  line-height: 1.6;\r
  padding: 1.5em 1em;\r
  text-shadow: 0 0 5px rgba(51, 255, 0, 0.4);\r
  /* CRT 扫描线效果 */\r
  background-image: repeating-linear-gradient(\r
    0deg,\r
    transparent,\r
    transparent 2px,\r
    rgba(0, 0, 0, 0.06) 2px,\r
    rgba(0, 0, 0, 0.06) 4px\r
  );\r
}\r
\r
/* ============================================\r
   标题 - 命令提示符风格\r
   H1-H6 使用绿色系，逐级变淡\r
   ============================================ */\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  font-weight: 700;\r
  line-height: 1.3;\r
  margin-top: 1.2em;\r
  margin-bottom: 0.5em;\r
  text-transform: uppercase;\r
}\r
\r
/* H1 - 主命令/root 权限 */\r
#easymd h1 {\r
  font-size: 1.75em;\r
  color: #33ff00;\r
  text-shadow: 0 0 8px rgba(51, 255, 0, 0.6);\r
  padding-bottom: 0.3em;\r
  border-bottom: 2px solid #33ff00;\r
}\r
\r
#easymd h1::before {\r
  content: '# ';\r
  color: #ffb000;\r
}\r
\r
/* H2 - 模块/子目录 */\r
#easymd h2 {\r
  font-size: 1.4em;\r
  color: #2de02d;\r
  text-shadow: 0 0 6px rgba(45, 224, 45, 0.5);\r
  padding-left: 0.5em;\r
  border-left: 3px solid #2de02d;\r
}\r
\r
#easymd h2::before {\r
  content: '## ';\r
  color: #ffb000;\r
}\r
\r
/* H3 - 函数/命令 */\r
#easymd h3 {\r
  font-size: 1.2em;\r
  color: #28c928;\r
  text-shadow: 0 0 5px rgba(40, 201, 40, 0.4);\r
}\r
\r
#easymd h3::before {\r
  content: '> ';\r
  color: #ffb000;\r
}\r
\r
/* H4-H6 - 参数/选项 (相同颜色) */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #22aa22;\r
  text-shadow: 0 0 4px rgba(34, 170, 34, 0.3);\r
}\r
\r
#easymd h4 {\r
  font-size: 1.1em;\r
}\r
\r
#easymd h4::before {\r
  content: '$ ';\r
  color: #888888;\r
}\r
\r
#easymd h5,\r
#easymd h6 {\r
  font-size: 1em;\r
}\r
\r
#easymd h5::before {\r
  content: '~ ';\r
  color: #888888;\r
}\r
\r
#easymd h6::before {\r
  content: ':: ';\r
  color: #888888;\r
}\r
\r
#easymd > h1:first-child,\r
#easymd > h2:first-child,\r
#easymd > h3:first-child,\r
#easymd > h4:first-child,\r
#easymd > h5:first-child,\r
#easymd > h6:first-child {\r
  margin-top: 0;\r
}\r
\r
/* ============================================\r
   段落\r
   ============================================ */\r
\r
#easymd p {\r
  margin-bottom: 1em;\r
}\r
\r
#easymd p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
/* ============================================\r
   行内文本样式\r
   ============================================ */\r
\r
/* 加粗 - 琥珀色高亮 */\r
#easymd strong,\r
#easymd b {\r
  font-weight: 700;\r
  color: #ffb000;\r
  text-shadow: 0 0 5px rgba(255, 176, 0, 0.5);\r
}\r
\r
/* 斜体 - 青色 */\r
#easymd em,\r
#easymd i {\r
  font-style: italic;\r
  color: #00ffff;\r
}\r
\r
/* 删除线 - 灰色+红线 */\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: #666666;\r
  text-decoration: line-through;\r
  text-decoration-color: #ff3333;\r
  text-decoration-thickness: 2px;\r
}\r
\r
/* 高亮 - 反色块 */\r
#easymd mark {\r
  background-color: #ffb000;\r
  color: #0a0a0a;\r
  padding: 0.1em 0.3em;\r
  text-shadow: none;\r
}\r
\r
#easymd small {\r
  font-size: 0.875em;\r
  color: #888888;\r
}\r
\r
#easymd sup,\r
#easymd sub {\r
  font-size: 0.75em;\r
  line-height: 0;\r
}\r
\r
#easymd sup {\r
  vertical-align: super;\r
  color: #ffb000;\r
}\r
\r
#easymd sub {\r
  vertical-align: sub;\r
  color: #00ffff;\r
}\r
\r
/* 插入 - 绿色下划虚线 */\r
#easymd ins {\r
  background-color: rgba(51, 255, 0, 0.15);\r
  text-decoration: none;\r
  padding: 0.1em 0.2em;\r
  border-bottom: 1px dashed #33ff00;\r
}\r
\r
#easymd q {\r
  quotes: '"' '"' '' ' ' '';\r
  color: #33ff00;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #ffb000;\r
  font-weight: 700;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #ffb000;\r
  font-weight: 700;\r
}\r
\r
/* 变量 - 青色斜体 */\r
#easymd var {\r
  font-style: italic;\r
  font-weight: 600;\r
  color: #00ffff;\r
}\r
\r
/* 示例输出 */\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Menlo', monospace;\r
  font-size: 0.9em;\r
  background-color: #1a1a1a;\r
  color: #33ff00;\r
  padding: 0.15em 0.35em;\r
  border: 1px solid #1f521f;\r
}\r
\r
#easymd abbr[title] {\r
  border-bottom: 1px dotted #ffb000;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 青色高亮\r
   ============================================ */\r
\r
#easymd a {\r
  color: #00ffff;\r
  text-decoration: underline;\r
  text-decoration-color: #006666;\r
  text-underline-offset: 3px;\r
  text-shadow: 0 0 5px rgba(0, 255, 255, 0.4);\r
}\r
\r
#easymd a:hover {\r
  color: #33ff00;\r
  text-decoration-color: #33ff00;\r
  text-shadow: 0 0 8px rgba(51, 255, 0, 0.6);\r
}\r
\r
/* ============================================\r
   Ruby 注音\r
   ============================================ */\r
\r
#easymd ruby {\r
  ruby-align: center;\r
}\r
\r
#easymd rt {\r
  font-size: 0.5em;\r
  color: #888888;\r
}\r
\r
#easymd rp {\r
  color: #666666;\r
}\r
\r
/* ============================================\r
   列表 - 文件树风格 (tree 命令输出)\r
   ============================================ */\r
\r
#easymd ul,\r
#easymd ol {\r
  margin-bottom: 1em;\r
  padding-left: 1.75em;\r
}\r
\r
#easymd ul {\r
  list-style-type: none;\r
}\r
\r
#easymd ol {\r
  list-style-type: decimal;\r
}\r
\r
#easymd li {\r
  margin-bottom: 0.35em;\r
}\r
\r
/* 无序列表使用树形结构 */\r
#easymd ul > li::before {\r
  content: '├─ ';\r
  color: #1f521f;\r
}\r
\r
#easymd ul > li:last-child::before {\r
  content: '└─ ';\r
}\r
\r
#easymd li::marker {\r
  color: #ffb000;\r
  font-weight: 700;\r
}\r
\r
#easymd li > ul,\r
#easymd li > ol {\r
  margin-top: 0.25em;\r
  margin-bottom: 0.25em;\r
}\r
\r
/* 嵌套列表缩进 */\r
#easymd ul ul > li::before {\r
  content: '│  ├─ ';\r
}\r
\r
#easymd ul ul > li:last-child::before {\r
  content: '│  └─ ';\r
}\r
\r
#easymd ul ul ul > li::before {\r
  content: '│  │  ├─ ';\r
}\r
\r
#easymd ul ul ul > li:last-child::before {\r
  content: '│  │  └─ ';\r
}\r
\r
/* 任务列表 */\r
#easymd ul.contains-task-list {\r
  list-style-type: none;\r
  padding-left: 0;\r
}\r
\r
#easymd ul.contains-task-list > li::before {\r
  content: none;\r
}\r
\r
#easymd li.task-list-item {\r
  display: flex;\r
  align-items: flex-start;\r
  gap: 0.5em;\r
  padding-left: 0.25em;\r
}\r
\r
#easymd li.task-list-item::before {\r
  content: none;\r
}\r
\r
#easymd input[type='checkbox'] {\r
  margin-top: 0.35em;\r
  width: 1.1em;\r
  height: 1.1em;\r
  accent-color: #33ff00;\r
  border: 1px solid #33ff00;\r
}\r
\r
/* ============================================\r
   引用块 - 标准输出重定向 (stdout)\r
   ============================================ */\r
\r
#easymd blockquote {\r
  margin: 1em 0;\r
  padding: 0.75em 1em 0.75em 1.5em;\r
  background-color: #0d0d0d;\r
  border-left: 3px solid #ffb000;\r
  border-top: 1px solid #1f521f;\r
  border-right: 1px solid #1f521f;\r
  border-bottom: 1px solid #1f521f;\r
  color: #888888;\r
}\r
\r
#easymd blockquote p {\r
  margin-bottom: 0.5em;\r
  text-shadow: none;\r
}\r
\r
#easymd blockquote p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
#easymd blockquote blockquote {\r
  margin-top: 0.5em;\r
  margin-bottom: 0;\r
  border-left-color: #1f521f;\r
  background-color: #0a0a0a;\r
}\r
\r
/* ============================================\r
   代码 - 终端核心元素\r
   ============================================ */\r
\r
/* 行内代码 - 琥珀色命令 */\r
#easymd code {\r
  font-family: 'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Menlo', monospace;\r
  font-size: 0.9em;\r
  background-color: #1a1a1a;\r
  color: #ffb000;\r
  padding: 0.15em 0.4em;\r
  border: 1px solid #1f521f;\r
  text-shadow: none;\r
}\r
\r
/* 代码块 - 终端窗口 */\r
#easymd pre {\r
  margin: 1em 0;\r
  padding: 1em;\r
  background-color: #0d0d0d;\r
  border: 1px solid #1f521f;\r
  overflow-x: auto;\r
}\r
\r
#easymd pre code {\r
  background-color: transparent;\r
  color: #33ff00;\r
  padding: 0;\r
  border: none;\r
  font-size: 0.875em;\r
  line-height: 1.5;\r
  text-shadow: 0 0 3px rgba(51, 255, 0, 0.3);\r
}\r
\r
/* ============================================\r
   表格 - 数据库输出 / ASCII 表格\r
   ============================================ */\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 1em 0;\r
  border-collapse: collapse;\r
  font-size: 0.9375em;\r
  border: 1px solid #1f521f;\r
}\r
\r
/* 表头首行样式（替代 thead） */\r
#easymd tr:first-child th {\r
  background-color: #1a1a1a;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 0.5em 0.75em;\r
  border: 1px solid #1f521f;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: 700;\r
  color: #ffb000;\r
  text-transform: uppercase;\r
  text-shadow: 0 0 3px rgba(255, 176, 0, 0.3);\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background-color: rgba(31, 82, 31, 0.1);\r
}\r
\r
/* Frontmatter 表格 - 配置文件风格 */\r
#easymd .frontmatter-table {\r
  width: auto;\r
  margin-bottom: 1.5em;\r
  font-size: 0.875em;\r
  border: none;\r
  background-color: transparent;\r
}\r
\r
#easymd .frontmatter-table td {\r
  padding: 0.25em 0.75em 0.25em 0;\r
  border: none;\r
  vertical-align: top;\r
  background-color: transparent;\r
}\r
\r
#easymd .frontmatter-key {\r
  font-weight: 700;\r
  color: #00ffff;\r
  white-space: nowrap;\r
}\r
\r
#easymd .frontmatter-key::after {\r
  content: ':';\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #33ff00;\r
}\r
\r
/* ============================================\r
   分割线 - 虚线分隔符\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.5em 0;\r
  border: none;\r
  height: 3px;\r
  background-color: #1f521f;\r
  background: repeating-linear-gradient(90deg, #1f521f 0px, #1f521f 4px, transparent 4px, transparent 8px);\r
}\r
\r
/* ============================================\r
   图片与媒体\r
   ============================================ */\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  border: 1px solid #1f521f;\r
  margin: 1em 0;\r
  filter: saturate(0.8) contrast(1.1);\r
}\r
\r
#easymd picture {\r
  display: block;\r
  margin: 1em 0;\r
}\r
\r
#easymd picture img {\r
  margin: 0;\r
}\r
\r
#easymd figure {\r
  margin: 1em 0;\r
  text-align: center;\r
}\r
\r
#easymd figure img {\r
  margin: 0 auto;\r
}\r
\r
#easymd figcaption {\r
  margin-top: 0.5em;\r
  font-size: 0.875em;\r
  color: #888888;\r
  text-shadow: none;\r
}\r
\r
#easymd figcaption::before {\r
  content: '// ';\r
  color: #1f521f;\r
}\r
\r
/* ============================================\r
   脚注 - 注释块\r
   ============================================ */\r
\r
#easymd .footnotes {\r
  margin-top: 1.5em;\r
  padding-top: 1em;\r
  border-top: 1px dashed #1f521f;\r
  font-size: 0.875em;\r
  color: #888888;\r
}\r
\r
#easymd .footnotes::before {\r
  content: '/* FOOTNOTES */';\r
  display: block;\r
  color: #1f521f;\r
  margin-bottom: 0.5em;\r
  font-weight: 700;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.5em;\r
}\r
\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #0a0a0a;\r
  font-weight: 700;\r
  background-color: #ffb000;\r
  padding: 0.1em 0.35em;\r
  text-shadow: none;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #00ffff;\r
  text-decoration: none;\r
  font-weight: 700;\r
}\r
\r
/* ============================================\r
   定义列表 - 命令行帮助 (--flag)\r
   ============================================ */\r
\r
#easymd dl {\r
  margin: 1em 0;\r
}\r
\r
#easymd dt {\r
  font-weight: 700;\r
  color: #ffb000;\r
  margin-top: 0.5em;\r
  text-shadow: 0 0 3px rgba(255, 176, 0, 0.3);\r
}\r
\r
#easymd dt::before {\r
  content: '--';\r
  color: #1f521f;\r
  margin-right: 0.5em;\r
}\r
\r
#easymd dt:first-child {\r
  margin-top: 0;\r
}\r
\r
#easymd dd {\r
  margin-left: 1.5em;\r
  margin-top: 0.25em;\r
  color: #33ff00;\r
  padding-left: 0.5em;\r
  border-left: 1px solid #1f521f;\r
}\r
\r
/* ============================================\r
   键盘按键 - 快捷键风格\r
   ============================================ */\r
\r
#easymd kbd {\r
  font-family: 'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Menlo', monospace;\r
  font-size: 0.8125em;\r
  display: inline-block;\r
  padding: 0.15em 0.5em;\r
  background-color: #1a1a1a;\r
  border: 1px solid #33ff00;\r
  color: #33ff00;\r
  font-weight: 600;\r
  text-shadow: 0 0 3px rgba(51, 255, 0, 0.4);\r
}\r
\r
/* ============================================\r
   警告框 - 系统日志级别\r
   [INFO] [TIP] [IMPORTANT] [WARN] [ERROR]\r
   ============================================ */\r
\r
#easymd .markdown-alert {\r
  margin: 1em 0;\r
  padding: 0.75em 1em;\r
  border: 1px solid;\r
  text-shadow: none;\r
}\r
\r
#easymd .markdown-alert::before {\r
  font-weight: 700;\r
  margin-right: 0.5em;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.4em;\r
  font-weight: 700;\r
  margin-bottom: 0.4em;\r
  text-transform: uppercase;\r
}\r
\r
/* Note - 青色 [INFO] */\r
#easymd .markdown-alert-note {\r
  background-color: rgba(0, 255, 255, 0.05);\r
  border-color: #006666;\r
  border-left: 3px solid #00ffff;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #00ffff;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title::before {\r
  content: '[INFO]';\r
}\r
\r
/* Tip - 绿色 [TIP] */\r
#easymd .markdown-alert-tip {\r
  background-color: rgba(51, 255, 0, 0.05);\r
  border-color: #1f521f;\r
  border-left: 3px solid #33ff00;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #33ff00;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title::before {\r
  content: '[TIP]';\r
}\r
\r
/* Important - 品红 [IMPORTANT] */\r
#easymd .markdown-alert-important {\r
  background-color: rgba(255, 0, 255, 0.05);\r
  border-color: #660066;\r
  border-left: 3px solid #ff00ff;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #ff00ff;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title::before {\r
  content: '[IMPORTANT]';\r
}\r
\r
/* Warning - 琥珀色 [WARN] */\r
#easymd .markdown-alert-warning {\r
  background-color: rgba(255, 176, 0, 0.08);\r
  border-color: #664600;\r
  border-left: 3px solid #ffb000;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #ffb000;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title::before {\r
  content: '[WARN]';\r
}\r
\r
/* Caution - 红色 [ERROR] */\r
#easymd .markdown-alert-caution {\r
  background-color: rgba(255, 51, 51, 0.08);\r
  border-color: #661414;\r
  border-left: 3px solid #ff3333;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #ff3333;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title::before {\r
  content: '[ERROR]';\r
}\r
\r
/* ============================================\r
   数学公式\r
   ============================================ */\r
\r
#easymd .math-inline {\r
  font-size: 1em;\r
  padding: 0 0.2em;\r
  color: #00ffff;\r
}\r
\r
#easymd .math-display {\r
  margin: 1em 0;\r
  overflow-x: auto;\r
  text-align: center;\r
  padding: 0.75em;\r
  background-color: #0d0d0d;\r
  border: 1px solid #1f521f;\r
  color: #00ffff;\r
}\r
\r
/* ============================================\r
   折叠详情 - 可展开终端区块\r
   [+] / [-] 切换\r
   ============================================ */\r
\r
#easymd details {\r
  margin: 1em 0;\r
  padding: 0.5em 0.75em;\r
  background-color: #0d0d0d;\r
  border: 1px solid #1f521f;\r
}\r
\r
#easymd summary {\r
  font-weight: 700;\r
  cursor: pointer;\r
  color: #ffb000;\r
  padding: 0.25em 0;\r
  text-shadow: 0 0 3px rgba(255, 176, 0, 0.3);\r
}\r
\r
#easymd summary::before {\r
  content: '[+] ';\r
  color: #33ff00;\r
}\r
\r
#easymd summary::marker {\r
  content: '';\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.5em;\r
  border-bottom: 1px dashed #1f521f;\r
  padding-bottom: 0.5em;\r
}\r
\r
#easymd details[open] summary::before {\r
  content: '[-] ';\r
}\r
\r
/* ============================================\r
   嵌入媒体\r
   ============================================ */\r
\r
#easymd iframe,\r
#easymd video {\r
  display: block;\r
  max-width: 100%;\r
  margin: 1em 0;\r
  border: 1px solid #1f521f;\r
}\r
\r
/* ============================================\r
   元信息与时间 - 时间戳\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.875em;\r
  color: #888888;\r
  padding: 0.15em 0.4em;\r
  background-color: #1a1a1a;\r
  border: 1px solid #1f521f;\r
  text-shadow: none;\r
}\r
\r
#easymd .meta::before,\r
#easymd time::before {\r
  content: '@';\r
  color: #1f521f;\r
  margin-right: 0.25em;\r
}\r
\r
/* ============================================\r
   首行缩进变体\r
   ============================================ */\r
\r
#easymd.indent-first-line p {\r
  text-indent: 2em;\r
}\r
`;export{r as default};
