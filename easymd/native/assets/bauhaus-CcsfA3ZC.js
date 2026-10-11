const r=`/* ============================================\r
   Bauhaus - 包豪斯几何现代主义风格\r
   Form Follows Function | 形式追随功能\r
   三原色（红、蓝、黄）+ 粗黑边框 + 硬阴影\r
   构成主义布局，大胆不对称的功能性艺术\r
   ============================================ */\r
\r
/* 配色定义（硬编码）\r
   主红色: #D02020 (Bauhaus Red - 纯正三原色红)\r
   主蓝色: #1040C0 (Bauhaus Blue - 深邃原色蓝)\r
   主黄色: #F0C020 (Bauhaus Yellow - 明亮原色黄)\r
   黑色: #121212 (Stark Black - 结构色)\r
   白色: #FFFFFF (Pure White)\r
   浅灰: #F0F0F0 (Off-white Canvas)\r
   中灰: #E0E0E0 (Muted)\r
*/\r
\r
/* 容器 - 纯净画布背景 */\r
#easymd {\r
  color: #121212;\r
  background-color: #f0f0f0;\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\r
  font-size: 16px;\r
  line-height: 1.65;\r
  padding: 1.5em 1em;\r
  /* 几何点阵装饰 - 构成主义网格感 */\r
  background-image: radial-gradient(circle, #121212 1px, transparent 1px);\r
  background-size: 20px 20px;\r
  background-position: 0 0;\r
}\r
\r
/* ============================================\r
   标题 - 几何色块与构成主义边框\r
   H1-H6 使用蓝色系，逐级变淡；H4-H6 相同颜色\r
   ============================================ */\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  font-weight: 900;\r
  line-height: 1.2;\r
  margin-top: 1.25em;\r
  margin-bottom: 0.5em;\r
  text-transform: uppercase;\r
}\r
\r
/* H1 - 蓝色色块 + 红色左边框 + 黄色右侧装饰 */\r
#easymd h1 {\r
  font-size: 1.875em;\r
  padding: 0.4em 0.6em;\r
  background-color: #1040c0;\r
  color: #ffffff;\r
  border-left: 8px solid #d02020;\r
  border-right: 8px solid #f0c020;\r
  border-top: 4px solid #121212;\r
  border-bottom: 4px solid #121212;\r
  box-shadow: 6px 6px 0 #121212;\r
}\r
\r
/* H2 - 白底 + 蓝色粗左边框 + 红色底边 */\r
#easymd h2 {\r
  font-size: 1.5em;\r
  padding: 0.35em 0.6em;\r
  background-color: #ffffff;\r
  color: #1040c0;\r
  border: 4px solid #121212;\r
  border-left: 10px solid #1040c0;\r
  box-shadow: 5px 5px 0 #d02020;\r
}\r
\r
/* H3 - 黄色色块标签 */\r
#easymd h3 {\r
  font-size: 1.25em;\r
  padding: 0.25em 0.6em;\r
  color: #121212;\r
  background-color: #f0c020;\r
  border: 3px solid #121212;\r
  display: inline-block;\r
  box-shadow: 4px 4px 0 #121212;\r
}\r
\r
/* H4-H6 - 相同的蓝灰色调 */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #2a5090;\r
  text-transform: none;\r
}\r
\r
#easymd h4 {\r
  font-size: 1.125em;\r
  padding-left: 0.6em;\r
  border-left: 5px solid #2a5090;\r
  background-color: rgba(16, 64, 192, 0.08);\r
  background: linear-gradient(90deg, rgba(16, 64, 192, 0.08) 0%, transparent 100%);\r
}\r
\r
#easymd h5 {\r
  font-size: 1em;\r
  padding-bottom: 0.2em;\r
  border-bottom: 3px solid #f0c020;\r
  display: inline-block;\r
}\r
\r
#easymd h6 {\r
  font-size: 1em;\r
  padding-left: 0.5em;\r
  border-left: 3px dashed #2a5090;\r
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
   行内文本样式 - 三原色强调系统\r
   ============================================ */\r
\r
/* 加粗 - 红色强调 */\r
#easymd strong,\r
#easymd b {\r
  font-weight: 800;\r
  color: #d02020;\r
}\r
\r
/* 斜体 - 蓝色强调 */\r
#easymd em,\r
#easymd i {\r
  font-style: italic;\r
  color: #1040c0;\r
  font-weight: 500;\r
}\r
\r
/* 删除线 - 红色粗删除线 */\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: #666666;\r
  text-decoration: line-through;\r
  text-decoration-color: #d02020;\r
  text-decoration-thickness: 3px;\r
}\r
\r
/* 高亮 - 黄色色块 + 黑边框 */\r
#easymd mark {\r
  background-color: #f0c020;\r
  color: #121212;\r
  padding: 0.1em 0.35em;\r
  border: 2px solid #121212;\r
  box-shadow: 2px 2px 0 #121212;\r
  font-weight: 600;\r
}\r
\r
#easymd small {\r
  font-size: 0.875em;\r
  color: #444444;\r
}\r
\r
#easymd sup,\r
#easymd sub {\r
  font-size: 0.75em;\r
  line-height: 0;\r
}\r
\r
/* 上标 - 红色徽章 */\r
#easymd sup {\r
  vertical-align: super;\r
  color: #ffffff;\r
  font-weight: 700;\r
  background-color: #d02020;\r
  padding: 0.1em 0.35em;\r
  border: 1px solid #121212;\r
}\r
\r
/* 下标 - 蓝色 */\r
#easymd sub {\r
  vertical-align: sub;\r
  color: #1040c0;\r
  font-weight: 600;\r
}\r
\r
/* 插入 - 蓝色底边 */\r
#easymd ins {\r
  background-color: rgba(16, 64, 192, 0.1);\r
  text-decoration: none;\r
  padding: 0.1em 0.25em;\r
  border-bottom: 3px solid #1040c0;\r
}\r
\r
#easymd q {\r
  quotes: '«' '»' '"' '"';\r
  color: #121212;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #d02020;\r
  font-weight: 900;\r
  font-size: 1.15em;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #d02020;\r
  font-weight: 900;\r
  font-size: 1.15em;\r
}\r
\r
/* 变量 - 蓝色斜体 */\r
#easymd var {\r
  font-style: italic;\r
  font-weight: 700;\r
  color: #1040c0;\r
}\r
\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #ffffff;\r
  color: #121212;\r
  padding: 0.15em 0.4em;\r
  border: 3px solid #121212;\r
}\r
\r
#easymd abbr[title] {\r
  border-bottom: 3px dotted #1040c0;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 几何下划线风格\r
   ============================================ */\r
\r
#easymd a {\r
  color: #1040c0;\r
  text-decoration: none;\r
  font-weight: 600;\r
  background-image: linear-gradient(#d02020, #d02020);\r
  background-size: 100% 3px;\r
  background-position: 0 100%;\r
  background-repeat: no-repeat;\r
  padding-bottom: 2px;\r
}\r
\r
#easymd a:hover {\r
  color: #d02020;\r
  background-image: linear-gradient(#1040c0, #1040c0);\r
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
  color: #666666;\r
  font-weight: 600;\r
}\r
\r
#easymd rp {\r
  color: #888888;\r
}\r
\r
/* ============================================\r
   列表 - 几何方块标记\r
   ============================================ */\r
\r
#easymd ul,\r
#easymd ol {\r
  margin-bottom: 1em;\r
  padding-left: 1.75em;\r
}\r
\r
#easymd ul {\r
  list-style-type: square;\r
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
/* 列表标记 - 红色方块 */\r
#easymd li::marker {\r
  color: #d02020;\r
  font-weight: 900;\r
}\r
\r
#easymd li > ul,\r
#easymd li > ol {\r
  margin-top: 0.25em;\r
  margin-bottom: 0.25em;\r
}\r
\r
#easymd ul ul {\r
  list-style-type: disc;\r
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
#easymd input[type='checkbox'] {\r
  margin-top: 0.35em;\r
  width: 1.2em;\r
  height: 1.2em;\r
  accent-color: #d02020;\r
  border: 3px solid #121212;\r
}\r
\r
/* ============================================\r
   引用块 - 黄色色块 + 构成主义边框\r
   ============================================ */\r
\r
#easymd blockquote {\r
  margin: 1.25em 0;\r
  padding: 0.85em 1em;\r
  background-color: #f0c020;\r
  color: #121212;\r
  border: 4px solid #121212;\r
  border-left: 10px solid #d02020;\r
  box-shadow: 6px 6px 0 #121212;\r
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
/* 嵌套引用 - 蓝色变体 */\r
#easymd blockquote blockquote {\r
  margin-top: 0.75em;\r
  margin-bottom: 0;\r
  background-color: #ffffff;\r
  border-left: 8px solid #1040c0;\r
  box-shadow: 4px 4px 0 #121212;\r
}\r
\r
/* ============================================\r
   代码 - 几何边框与硬阴影\r
   ============================================ */\r
\r
/* 行内代码 - 白底红色文字 */\r
#easymd code {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #ffffff;\r
  color: #d02020;\r
  padding: 0.15em 0.45em;\r
  border: 3px solid #121212;\r
  font-weight: 600;\r
}\r
\r
/* 代码块 - 深蓝背景 + 红色顶边 */\r
#easymd pre {\r
  margin: 1.25em 0;\r
  padding: 1.1em;\r
  background-color: #1040c0;\r
  border: 4px solid #121212;\r
  border-top: 8px solid #d02020;\r
  box-shadow: 8px 8px 0 #f0c020;\r
  overflow-x: auto;\r
}\r
\r
#easymd pre code {\r
  background-color: transparent;\r
  color: #ffffff;\r
  padding: 0;\r
  border: none;\r
  font-size: 0.875em;\r
  line-height: 1.55;\r
  font-weight: 400;\r
}\r
\r
/* ============================================\r
   表格 - 网格系统风格\r
   ============================================ */\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 1.25em 0;\r
  border-collapse: collapse;\r
  font-size: 0.9375em;\r
  border: 4px solid #121212;\r
  box-shadow: 6px 6px 0 #121212;\r
}\r
\r
/* 表头首行样式（替代 thead） */\r
#easymd tr:first-child th {\r
  background-color: #1040c0;\r
  color: #ffffff;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 0.55em 0.8em;\r
  border: 3px solid #121212;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: 800;\r
  background-color: #1040c0;\r
  color: #ffffff;\r
  text-transform: uppercase;\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background-color: rgba(240, 192, 32, 0.15);\r
}\r
\r
/* Frontmatter 表格 */\r
#easymd .frontmatter-table {\r
  width: auto;\r
  margin-bottom: 1.5em;\r
  font-size: 0.875em;\r
  border: none;\r
  background-color: transparent;\r
  box-shadow: none;\r
}\r
\r
#easymd .frontmatter-table td {\r
  padding: 0.25em 0.8em 0.25em 0;\r
  border: none;\r
  vertical-align: top;\r
  background-color: transparent;\r
}\r
\r
#easymd .frontmatter-key {\r
  font-weight: 800;\r
  color: #1040c0;\r
  white-space: nowrap;\r
  text-transform: uppercase;\r
}\r
\r
#easymd .frontmatter-key::after {\r
  content: ':';\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #121212;\r
}\r
\r
/* ============================================\r
   分割线 - 三原色条纹\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.75em 0;\r
  border: none;\r
  height: 8px;\r
  background-color: #d02020;\r
  background: linear-gradient(90deg, #d02020 33.33%, #f0c020 33.33%, #f0c020 66.66%, #1040c0 66.66%);\r
  box-shadow: 4px 4px 0 #121212;\r
}\r
\r
/* ============================================\r
   图片与媒体 - 几何边框框架\r
   ============================================ */\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  border: 5px solid #121212;\r
  box-shadow: 8px 8px 0 #1040c0;\r
  margin: 1.25em 0;\r
}\r
\r
#easymd picture {\r
  display: block;\r
  margin: 1.25em 0;\r
}\r
\r
#easymd picture img {\r
  margin: 0;\r
}\r
\r
#easymd figure {\r
  margin: 1.25em 0;\r
  text-align: center;\r
}\r
\r
#easymd figure img {\r
  margin: 0 auto;\r
}\r
\r
/* 图片说明 - 黄色标签 */\r
#easymd figcaption {\r
  margin-top: 0.6em;\r
  font-size: 0.875em;\r
  color: #121212;\r
  font-weight: 700;\r
  padding: 0.3em 0.6em;\r
  background-color: #f0c020;\r
  display: inline-block;\r
  border: 3px solid #121212;\r
  box-shadow: 3px 3px 0 #121212;\r
  text-transform: uppercase;\r
}\r
\r
/* ============================================\r
   脚注 - 几何分隔\r
   ============================================ */\r
\r
#easymd .footnotes {\r
  margin-top: 2em;\r
  padding-top: 1.25em;\r
  border-top: 6px solid #d02020;\r
  font-size: 0.875em;\r
  color: #444444;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.5em;\r
}\r
\r
/* 脚注引用 - 红色徽章 */\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #ffffff;\r
  font-weight: 800;\r
  background-color: #d02020;\r
  padding: 0.12em 0.4em;\r
  border: 2px solid #121212;\r
  box-shadow: 1px 1px 0 #121212;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #121212;\r
  text-decoration: none;\r
  font-weight: 800;\r
  background-color: #f0c020;\r
  padding: 0.1em 0.35em;\r
  border: 2px solid #121212;\r
}\r
\r
/* ============================================\r
   定义列表\r
   ============================================ */\r
\r
#easymd dl {\r
  margin: 1em 0;\r
}\r
\r
/* 定义术语 - 蓝色标签 */\r
#easymd dt {\r
  font-weight: 800;\r
  color: #ffffff;\r
  margin-top: 0.6em;\r
  padding: 0.25em 0.55em;\r
  background-color: #1040c0;\r
  border: 3px solid #121212;\r
  box-shadow: 3px 3px 0 #121212;\r
  display: inline-block;\r
  text-transform: uppercase;\r
}\r
\r
#easymd dt:first-child {\r
  margin-top: 0;\r
}\r
\r
/* 定义描述 - 红色左边框 */\r
#easymd dd {\r
  margin-left: 1.5em;\r
  margin-top: 0.3em;\r
  color: #121212;\r
  padding-left: 0.6em;\r
  border-left: 5px solid #d02020;\r
}\r
\r
/* ============================================\r
   键盘按键 - 物理按钮风格\r
   ============================================ */\r
\r
#easymd kbd {\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\r
  font-size: 0.8125em;\r
  display: inline-block;\r
  padding: 0.2em 0.55em;\r
  background-color: #ffffff;\r
  border: 4px solid #121212;\r
  box-shadow: 4px 4px 0 #121212;\r
  color: #121212;\r
  font-weight: 700;\r
  text-transform: uppercase;\r
}\r
\r
/* ============================================\r
   警告框 - 色块硬阴影风格\r
   ============================================ */\r
\r
#easymd .markdown-alert {\r
  margin: 1.25em 0;\r
  padding: 0.85em 1.1em;\r
  border: 4px solid #121212;\r
  box-shadow: 5px 5px 0 #121212;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.45em;\r
  font-weight: 800;\r
  margin-bottom: 0.5em;\r
  text-transform: uppercase;\r
}\r
\r
/* Note - 蓝色 */\r
#easymd .markdown-alert-note {\r
  background-color: rgba(16, 64, 192, 0.12);\r
  border-left: 8px solid #1040c0;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #1040c0;\r
}\r
\r
/* Tip - 黄色 */\r
#easymd .markdown-alert-tip {\r
  background-color: #f0c020;\r
  border-left: 8px solid #121212;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #121212;\r
}\r
\r
/* Important - 深蓝 */\r
#easymd .markdown-alert-important {\r
  background-color: #1040c0;\r
  color: #ffffff;\r
  border-left: 8px solid #f0c020;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #ffffff;\r
}\r
\r
/* Warning - 黄色渐变 */\r
#easymd .markdown-alert-warning {\r
  background-color: rgba(240, 192, 32, 0.35);\r
  border-left: 8px solid #d02020;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #9a5a00;\r
}\r
\r
/* Caution - 红色 */\r
#easymd .markdown-alert-caution {\r
  background-color: #d02020;\r
  color: #ffffff;\r
  border-left: 8px solid #121212;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #ffffff;\r
}\r
\r
/* ============================================\r
   数学公式\r
   ============================================ */\r
\r
#easymd .math-inline {\r
  font-size: 1em;\r
  padding: 0 0.25em;\r
}\r
\r
/* 公式块 - 白色卡片配蓝色硬阴影 */\r
#easymd .math-display {\r
  margin: 1.25em 0;\r
  overflow-x: auto;\r
  text-align: center;\r
  padding: 0.9em;\r
  background-color: #ffffff;\r
  border: 4px solid #121212;\r
  box-shadow: 6px 6px 0 #1040c0;\r
}\r
\r
/* ============================================\r
   折叠详情 - 几何风格\r
   ============================================ */\r
\r
#easymd details {\r
  margin: 1.25em 0;\r
  padding: 0.6em 0.9em;\r
  background-color: #ffffff;\r
  border: 4px solid #121212;\r
  box-shadow: 5px 5px 0 #121212;\r
  /* 右侧装饰色条 */\r
  background-image: linear-gradient(90deg, transparent calc(100% - 1em), #1040c0 calc(100% - 1em));\r
}\r
\r
#easymd summary {\r
  font-weight: 800;\r
  cursor: pointer;\r
  color: #1040c0;\r
  padding: 0.3em 0;\r
  text-transform: uppercase;\r
}\r
\r
#easymd summary::marker {\r
  color: #d02020;\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.6em;\r
  border-bottom: 4px solid #f0c020;\r
  padding-bottom: 0.5em;\r
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
  margin: 1.25em 0;\r
  border: 5px solid #121212;\r
  box-shadow: 8px 8px 0 #d02020;\r
}\r
\r
/* ============================================\r
   元信息与时间\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.875em;\r
  color: #121212;\r
  padding: 0.2em 0.5em;\r
  background-color: #f0c020;\r
  border: 3px solid #121212;\r
  font-weight: 700;\r
  text-transform: uppercase;\r
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
