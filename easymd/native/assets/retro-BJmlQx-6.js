var r=`/* ============================================\r
   Retro - 90年代早期互联网怀旧风格\r
   Windows 95 / Geocities / 早期网页美学\r
   Beveled 3D边框 + 系统字体 + 高对比度配色\r
   "丑萌"美学的终极呈现\r
   ============================================ */\r
\r
/* 配色定义（硬编码 - 无 CSS 变量）\r
   背景色: #c0c0c0 (Windows 95 银灰)\r
   主黑色: #000000 (纯黑)\r
   主蓝色: #0000ff (经典超链接蓝)\r
   访问过: #800080 (紫色)\r
   强调红: #ff0000 (纯红)\r
   高亮黄: #ffff00 (纯黄)\r
   成功绿: #00aa00 (深绿)\r
   亮绿: #00ff00 (Lime 绿)\r
   标题栏: #000080 (海军蓝)\r
   标题栏渐变: #1084d0 (天蓝)\r
   边框亮: #ffffff (白色高光)\r
   边框暗: #808080 (灰色阴影)\r
   内阴影暗: #404040\r
   内阴影亮: #dfdfdf\r
   面板黄: #ffffcc (淡黄面板)\r
   浅灰: #e8e8e8 (交替行)\r
   深灰: #404040 (次要文字)\r
   青色: #008080 (Teal)\r
*/\r
\r
/* ============================================\r
   容器 - Windows 95 风格主界面\r
   经典外凸 3D 边框效果\r
   ============================================ */\r
\r
#easymd {\r
  color: #000000;\r
  background-color: #c0c0c0;\r
  font-family: 'MS Sans Serif', 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif;\r
  font-size: 14px;\r
  line-height: 1.5;\r
  padding: 1em;\r
  /* 外凸边框效果 (Outset Bevel) */\r
  border: 2px solid;\r
  border-color: #ffffff #808080 #808080 #ffffff;\r
  box-shadow:\r
    inset -1px -1px 0 #404040,\r
    inset 1px 1px 0 #dfdfdf;\r
  /* 90年代瓷砖纹理背景 */\r
  background-image:\r
    linear-gradient(45deg, #b8b8b8 25%, transparent 25%), linear-gradient(-45deg, #b8b8b8 25%, transparent 25%),\r
    linear-gradient(45deg, transparent 75%, #b8b8b8 75%), linear-gradient(-45deg, transparent 75%, #b8b8b8 75%);\r
  background-size: 4px 4px;\r
  background-position:\r
    0 0,\r
    0 2px,\r
    2px -2px,\r
    -2px 0px;\r
}\r
\r
/* ============================================\r
   标题 - 海军蓝色系，逐级变淡\r
   H1-H3 各有独特样式，H4-H6 相同颜色\r
   ============================================ */\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  font-family: 'Arial Black', Impact, Haettenschweiler, Arial, sans-serif;\r
  font-weight: 700;\r
  line-height: 1.3;\r
  margin-top: 1em;\r
  margin-bottom: 0.5em;\r
}\r
\r
/* H1 - Windows 标题栏风格 (渐变标题) */\r
#easymd h1 {\r
  font-size: 1.75em;\r
  color: #ffffff;\r
  background: linear-gradient(to right, #000080, #1084d0);\r
  padding: 0.3em 0.5em;\r
  border: 2px solid;\r
  border-color: #ffffff #808080 #808080 #ffffff;\r
  text-shadow: 1px 1px 0 #000000;\r
}\r
\r
/* H2 - 凹槽分隔线风格 (Groove Effect) */\r
#easymd h2 {\r
  font-size: 1.4em;\r
  color: #000080;\r
  padding-bottom: 0.3em;\r
  border-bottom: 4px solid;\r
  border-bottom-color: #808080;\r
  box-shadow: 0 2px 0 #ffffff;\r
}\r
\r
/* H3 - 左边框强调 + 浅灰背景 */\r
#easymd h3 {\r
  font-size: 1.2em;\r
  color: #0000aa;\r
  padding: 0.2em 0.5em;\r
  border-left: 4px solid #000080;\r
  background-color: #e0e0e0;\r
}\r
\r
/* H4-H6 使用相同颜色 */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #0000cc;\r
}\r
\r
#easymd h4 {\r
  font-size: 1.1em;\r
  text-decoration: underline;\r
  text-decoration-color: #0000cc;\r
  text-underline-offset: 2px;\r
}\r
\r
#easymd h5,\r
#easymd h6 {\r
  font-size: 1em;\r
}\r
\r
#easymd h5::before {\r
  content: '>> ';\r
  color: #808080;\r
}\r
\r
#easymd h6::before {\r
  content: '>>> ';\r
  color: #808080;\r
}\r
\r
/* 首个标题无 margin-top */\r
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
  margin-bottom: 0.875em;\r
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
/* 加粗 - 红色强调 */\r
#easymd strong,\r
#easymd b {\r
  font-weight: 700;\r
  color: #ff0000;\r
}\r
\r
/* 斜体 - 海军蓝 */\r
#easymd em,\r
#easymd i {\r
  font-style: italic;\r
  color: #000080;\r
}\r
\r
/* 删除线 - 灰色文字 + 红色粗删除线 */\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: #808080;\r
  text-decoration: line-through;\r
  text-decoration-color: #ff0000;\r
  text-decoration-thickness: 2px;\r
}\r
\r
/* 高亮 - 黄色荧光笔 + 黑边框 */\r
#easymd mark {\r
  background-color: #ffff00;\r
  color: #000000;\r
  padding: 0.1em 0.2em;\r
  border: 1px solid #000000;\r
}\r
\r
#easymd small {\r
  font-size: 0.875em;\r
  color: #404040;\r
}\r
\r
#easymd sup,\r
#easymd sub {\r
  font-size: 0.75em;\r
  line-height: 0;\r
}\r
\r
/* 上标 - 红色粗体 */\r
#easymd sup {\r
  vertical-align: super;\r
  color: #ff0000;\r
  font-weight: 700;\r
}\r
\r
/* 下标 - 蓝色 */\r
#easymd sub {\r
  vertical-align: sub;\r
  color: #0000ff;\r
}\r
\r
/* 插入 - Lime 绿背景 */\r
#easymd ins {\r
  background-color: #00ff00;\r
  text-decoration: none;\r
  padding: 0.1em 0.2em;\r
  color: #000000;\r
}\r
\r
/* 引用 - 红色引号 */\r
#easymd q {\r
  quotes: '"' '"' '' ' ' '';\r
  color: #000080;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #ff0000;\r
  font-weight: 700;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #ff0000;\r
  font-weight: 700;\r
}\r
\r
/* 变量 - 紫色等宽 */\r
#easymd var {\r
  font-style: italic;\r
  font-weight: 600;\r
  color: #800080;\r
  font-family: 'Courier New', Courier, monospace;\r
}\r
\r
/* 示例输出 - 凹陷输入框风格 */\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'Courier New', Courier, monospace;\r
  font-size: 0.9em;\r
  background-color: #ffffff;\r
  color: #000000;\r
  padding: 0.1em 0.3em;\r
  border: 2px solid;\r
  border-color: #808080 #ffffff #ffffff #808080;\r
}\r
\r
/* 缩写 - 蓝色虚线下划线 */\r
#easymd abbr[title] {\r
  border-bottom: 1px dotted #0000ff;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 经典蓝色下划线\r
   蓝色 -> 红色(hover)\r
   ============================================ */\r
\r
#easymd a {\r
  color: #0000ff;\r
  text-decoration: underline;\r
}\r
\r
#easymd a:hover {\r
  color: #ff0000;\r
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
  color: #808080;\r
}\r
\r
#easymd rp {\r
  color: #808080;\r
}\r
\r
/* ============================================\r
   列表 - 经典圆点与数字\r
   ============================================ */\r
\r
#easymd ul,\r
#easymd ol {\r
  margin-bottom: 0.875em;\r
  padding-left: 1.75em;\r
}\r
\r
#easymd ul {\r
  list-style-type: disc;\r
}\r
\r
#easymd ol {\r
  list-style-type: decimal;\r
}\r
\r
#easymd li {\r
  margin-bottom: 0.3em;\r
}\r
\r
/* 列表标记 - 海军蓝粗体 */\r
#easymd li::marker {\r
  color: #000080;\r
  font-weight: 700;\r
}\r
\r
#easymd li > ul,\r
#easymd li > ol {\r
  margin-top: 0.25em;\r
  margin-bottom: 0.25em;\r
}\r
\r
/* 嵌套列表样式变化 */\r
#easymd ul ul {\r
  list-style-type: square;\r
}\r
\r
#easymd ul ul ul {\r
  list-style-type: circle;\r
}\r
\r
/* 任务列表 */\r
#easymd ul.contains-task-list {\r
  list-style-type: none;\r
  padding-left: 0;\r
}\r
\r
#easymd li.task-list-item {\r
  display: flex;\r
  align-items: flex-start;\r
  gap: 0.5em;\r
  padding-left: 0.25em;\r
}\r
\r
/* 复选框 - 3D 凹陷风格 */\r
#easymd input[type='checkbox'] {\r
  margin-top: 0.3em;\r
  width: 1.1em;\r
  height: 1.1em;\r
  accent-color: #000080;\r
  border: 2px solid;\r
  border-color: #808080 #ffffff #ffffff #808080;\r
}\r
\r
/* ============================================\r
   引用块 - 凹陷黄色面板风格\r
   ============================================ */\r
\r
#easymd blockquote {\r
  margin: 0.875em 0;\r
  padding: 0.75em 1em;\r
  background-color: #ffffcc;\r
  border: 2px solid;\r
  border-color: #808080 #ffffff #ffffff #808080;\r
  box-shadow:\r
    inset 1px 1px 0 #404040,\r
    inset -1px -1px 0 #dfdfdf;\r
  color: #000000;\r
}\r
\r
#easymd blockquote p {\r
  margin-bottom: 0.5em;\r
}\r
\r
#easymd blockquote p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
/* 嵌套引用 - 白色背景 + 蓝色左边框 */\r
#easymd blockquote blockquote {\r
  margin-top: 0.5em;\r
  margin-bottom: 0;\r
  background-color: #ffffff;\r
  border-left: 4px solid #000080;\r
}\r
\r
/* ============================================\r
   代码 - 终端/命令行风格\r
   ============================================ */\r
\r
/* 行内代码 - 白底红字 + 黑边框 */\r
#easymd code {\r
  font-family: 'Courier New', Courier, monospace;\r
  font-size: 0.9em;\r
  background-color: #ffffff;\r
  color: #ff0000;\r
  padding: 0.1em 0.35em;\r
  border: 1px solid #000000;\r
}\r
\r
/* 代码块 - 海军蓝背景 + 绿色文字 (终端风格) */\r
#easymd pre {\r
  margin: 0.875em 0;\r
  padding: 0.75em;\r
  background-color: #000080;\r
  border: 2px solid;\r
  border-color: #808080 #ffffff #ffffff #808080;\r
  box-shadow: inset 1px 1px 0 #000000;\r
  overflow-x: auto;\r
}\r
\r
#easymd pre code {\r
  background-color: transparent;\r
  color: #00ff00;\r
  padding: 0;\r
  border: none;\r
  font-size: 0.875em;\r
  line-height: 1.4;\r
}\r
\r
/* ============================================\r
   表格 - Windows 95 3D 边框风格\r
   ============================================ */\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 0.875em 0;\r
  border-collapse: collapse;\r
  font-size: 0.9375em;\r
  border: 2px solid;\r
  border-color: #808080 #ffffff #ffffff #808080;\r
  background-color: #ffffff;\r
}\r
\r
/* 表头首行样式 - 渐变应用于整行 */\r
#easymd thead tr {\r
  background-color: #000080;\r
  background: linear-gradient(to right, #000080, #1084d0);\r
}\r
\r
#easymd thead th {\r
  background-color: transparent;\r
  color: #ffffff;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 0.4em 0.6em;\r
  border: 1px solid #808080;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: 700;\r
  color: #ffffff;\r
  text-shadow: 1px 1px 0 #000000;\r
}\r
\r
/* 交替行背景 */\r
#easymd tbody tr:nth-child(even) {\r
  background-color: #e8e8e8;\r
}\r
\r
/* Frontmatter 表格 - 简化样式 */\r
#easymd .frontmatter-table {\r
  width: auto;\r
  margin-bottom: 1.25em;\r
  font-size: 0.875em;\r
  border: none;\r
  background-color: transparent;\r
}\r
\r
#easymd .frontmatter-table td {\r
  padding: 0.2em 0.6em 0.2em 0;\r
  border: none;\r
  vertical-align: top;\r
  background-color: transparent;\r
}\r
\r
#easymd .frontmatter-key {\r
  font-weight: 700;\r
  color: #000080;\r
  white-space: nowrap;\r
}\r
\r
#easymd .frontmatter-key::after {\r
  content: ':';\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #000000;\r
}\r
\r
/* ============================================\r
   分割线 - 3D 凹槽效果 (Groove)\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.25em 0;\r
  border: none;\r
  height: 4px;\r
  background-color: #808080;\r
  background: linear-gradient(to bottom, #808080 0%, #808080 50%, #ffffff 50%, #ffffff 100%);\r
}\r
\r
/* ============================================\r
   图片与媒体 - 凹陷边框框架\r
   ============================================ */\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  border: 2px solid;\r
  border-color: #808080 #ffffff #ffffff #808080;\r
  box-shadow: inset 1px 1px 0 #404040;\r
  margin: 0.875em 0;\r
}\r
\r
#easymd picture {\r
  display: block;\r
  margin: 0.875em 0;\r
}\r
\r
#easymd picture img {\r
  margin: 0;\r
}\r
\r
#easymd figure {\r
  margin: 0.875em 0;\r
  text-align: center;\r
}\r
\r
#easymd figure img {\r
  margin: 0 auto;\r
}\r
\r
/* 图片说明 - 斜体灰色 */\r
#easymd figcaption {\r
  margin-top: 0.4em;\r
  font-size: 0.875em;\r
  color: #404040;\r
  font-style: italic;\r
}\r
\r
/* ============================================\r
   脚注 - 分隔区域\r
   ============================================ */\r
\r
#easymd .footnotes {\r
  margin-top: 1.25em;\r
  padding-top: 0.75em;\r
  border-top: 2px solid #808080;\r
  font-size: 0.875em;\r
  color: #404040;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.5em;\r
}\r
\r
/* 脚注引用 - 海军蓝徽章 */\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #ffffff;\r
  font-weight: 700;\r
  background-color: #000080;\r
  padding: 0.1em 0.35em;\r
  text-decoration: none;\r
}\r
\r
/* 脚注返回链接 */\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #0000ff;\r
  text-decoration: underline;\r
  font-weight: 700;\r
}\r
\r
/* ============================================\r
   定义列表\r
   ============================================ */\r
\r
#easymd dl {\r
  margin: 0.875em 0;\r
}\r
\r
/* 定义术语 - 外凸按钮风格 */\r
#easymd dt {\r
  font-weight: 700;\r
  color: #000080;\r
  margin-top: 0.5em;\r
  background-color: #e0e0e0;\r
  padding: 0.2em 0.4em;\r
  border: 1px solid;\r
  border-color: #ffffff #808080 #808080 #ffffff;\r
  display: inline-block;\r
}\r
\r
#easymd dt:first-child {\r
  margin-top: 0;\r
}\r
\r
/* 定义描述 - 蓝色左边框 */\r
#easymd dd {\r
  margin-left: 1.5em;\r
  margin-top: 0.25em;\r
  color: #000000;\r
  padding-left: 0.5em;\r
  border-left: 3px solid #000080;\r
}\r
\r
/* ============================================\r
   键盘按键 - 3D 按钮风格\r
   ============================================ */\r
\r
#easymd kbd {\r
  font-family: 'Courier New', Courier, monospace;\r
  font-size: 0.8125em;\r
  display: inline-block;\r
  padding: 0.15em 0.5em;\r
  background-color: #c0c0c0;\r
  border: 2px solid;\r
  border-color: #ffffff #808080 #808080 #ffffff;\r
  box-shadow:\r
    inset -1px -1px 0 #404040,\r
    inset 1px 1px 0 #dfdfdf,\r
    2px 2px 0 #000000;\r
  color: #000000;\r
  font-weight: 600;\r
}\r
\r
/* ============================================\r
   警告框 - Windows 对话框风格\r
   ============================================ */\r
\r
#easymd .markdown-alert {\r
  margin: 0.875em 0;\r
  padding: 0.6em 0.75em;\r
  border: 2px solid;\r
  border-color: #ffffff #808080 #808080 #ffffff;\r
  box-shadow:\r
    inset -1px -1px 0 #404040,\r
    inset 1px 1px 0 #dfdfdf;\r
  background-color: #c0c0c0;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.4em;\r
  font-weight: 700;\r
  margin-bottom: 0.4em;\r
}\r
\r
/* Note - 蓝色信息框 */\r
#easymd .markdown-alert-note {\r
  background-color: #e0e8f0;\r
  border-left: 4px solid #000080;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #000080;\r
}\r
\r
/* Tip - 绿色提示框 */\r
#easymd .markdown-alert-tip {\r
  background-color: #e0f0e0;\r
  border-left: 4px solid #00aa00;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #00aa00;\r
}\r
\r
/* Important - 紫色重要框 */\r
#easymd .markdown-alert-important {\r
  background-color: #f0e0f0;\r
  border-left: 4px solid #800080;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #800080;\r
}\r
\r
/* Warning - 黄色警告框 */\r
#easymd .markdown-alert-warning {\r
  background-color: #fffff0;\r
  border-left: 4px solid #cc8800;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #cc8800;\r
}\r
\r
/* Caution - 红色危险框 */\r
#easymd .markdown-alert-caution {\r
  background-color: #fff0f0;\r
  border-left: 4px solid #ff0000;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #ff0000;\r
}\r
\r
/* ============================================\r
   数学公式\r
   ============================================ */\r
\r
#easymd .math-inline {\r
  font-size: 1em;\r
  padding: 0 0.2em;\r
  color: #000080;\r
}\r
\r
/* 公式块 - 凹陷白色面板 */\r
#easymd .math-display {\r
  margin: 0.875em 0;\r
  overflow-x: auto;\r
  text-align: center;\r
  padding: 0.6em;\r
  background-color: #ffffff;\r
  border: 2px solid;\r
  border-color: #808080 #ffffff #ffffff #808080;\r
  box-shadow: inset 1px 1px 0 #404040;\r
}\r
\r
/* ============================================\r
   折叠详情 - 可展开面板\r
   ============================================ */\r
\r
#easymd details {\r
  margin: 0.875em 0;\r
  padding: 0.4em 0.6em;\r
  background-color: #c0c0c0;\r
  border: 2px solid;\r
  border-color: #ffffff #808080 #808080 #ffffff;\r
  box-shadow:\r
    inset -1px -1px 0 #404040,\r
    inset 1px 1px 0 #dfdfdf;\r
}\r
\r
#easymd summary {\r
  font-weight: 700;\r
  cursor: pointer;\r
  color: #000080;\r
  padding: 0.2em 0;\r
}\r
\r
#easymd summary::marker {\r
  color: #000080;\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.4em;\r
  border-bottom: 1px solid #808080;\r
  padding-bottom: 0.4em;\r
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
  margin: 0.875em 0;\r
  border: 2px solid;\r
  border-color: #808080 #ffffff #ffffff #808080;\r
}\r
\r
/* ============================================\r
   元信息与时间 - 等宽徽章风格\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.875em;\r
  color: #404040;\r
  padding: 0.1em 0.35em;\r
  background-color: #e0e0e0;\r
  border: 1px solid;\r
  border-color: #ffffff #808080 #808080 #ffffff;\r
  font-family: 'Courier New', Courier, monospace;\r
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
