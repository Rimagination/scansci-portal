const r=`/* ============================================\r
   Newsprint - 报纸印刷风格\r
   经典印刷美学，黑白高对比度\r
   严格网格层次，权威可信赖\r
   致敬传统新闻出版的黄金时代\r
   ============================================ */\r
\r
/* 配色定义（硬编码）\r
   背景色: #F9F9F7 (新闻纸白)\r
   主墨色: #111111 (油墨黑)\r
   次要黑: #2A2A2A\r
   正文色: #333333\r
   辅助灰: #555555\r
   浅灰色: #777777\r
   淡灰色: #999999\r
   分割线: #CCCCCC\r
   浅背景: #F0F0EE\r
   强调红: #B22222 (编辑红)\r
*/\r
\r
/* 容器 - 新闻纸质感背景 */\r
#easymd {\r
  color: #333333;\r
  background-color: #f9f9f7;\r
  font-family: Georgia, 'Times New Roman', 'Songti SC', 'SimSun', serif;\r
  font-size: 16px;\r
  line-height: 1.7;\r
  padding: 1.25em 1em;\r
}\r
\r
/* ============================================\r
   标题 - 报刊大字标题风格\r
   极具层次感的黑色系标题\r
   ============================================ */\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  font-family: Georgia, 'Times New Roman', 'Songti SC', 'SimSun', serif;\r
  font-weight: 700;\r
  line-height: 1.2;\r
  margin-top: 1.25em;\r
  margin-bottom: 0.4em;\r
}\r
\r
/* H1 - 头版头条风格 */\r
#easymd h1 {\r
  font-size: 2.25em;\r
  font-weight: 900;\r
  color: #111111;\r
  text-align: center;\r
  padding-bottom: 0.35em;\r
  margin-bottom: 0.5em;\r
  border-bottom: 3px double #111111;\r
  text-transform: uppercase;\r
}\r
\r
/* H2 - 专栏标题风格 */\r
#easymd h2 {\r
  font-size: 1.625em;\r
  color: #1a1a1a;\r
  padding-bottom: 0.25em;\r
  border-bottom: 2px solid #111111;\r
}\r
\r
/* H3 - 小节标题 */\r
#easymd h3 {\r
  font-size: 1.375em;\r
  color: #2a2a2a;\r
  padding-left: 0.5em;\r
  border-left: 4px solid #111111;\r
}\r
\r
/* H4-H6 - 次要标题，使用相同颜色 */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #444444;\r
}\r
\r
#easymd h4 {\r
  font-size: 1.125em;\r
  font-weight: 700;\r
}\r
\r
#easymd h5 {\r
  font-size: 1em;\r
  font-weight: 700;\r
  font-style: italic;\r
}\r
\r
#easymd h6 {\r
  font-size: 0.9375em;\r
  font-weight: 600;\r
  font-style: italic;\r
  text-transform: uppercase;\r
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
   段落 - 报刊正文排版\r
   ============================================ */\r
\r
#easymd p {\r
  margin-bottom: 0.9em;\r
  text-align: justify;\r
  text-justify: inter-character;\r
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
#easymd strong,\r
#easymd b {\r
  font-weight: 700;\r
  color: #111111;\r
}\r
\r
#easymd em,\r
#easymd i {\r
  font-style: italic;\r
}\r
\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: #888888;\r
  text-decoration: line-through;\r
  text-decoration-thickness: 1px;\r
}\r
\r
#easymd mark {\r
  background-color: #e8e8e6;\r
  color: #111111;\r
  padding: 0.1em 0.2em;\r
  border-bottom: 2px solid #111111;\r
}\r
\r
#easymd small {\r
  font-size: 0.875em;\r
  color: #666666;\r
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
}\r
\r
#easymd sub {\r
  vertical-align: sub;\r
}\r
\r
#easymd ins {\r
  background-color: #f0f0ee;\r
  text-decoration: none;\r
  padding: 0.1em 0.2em;\r
  border-bottom: 1px solid #111111;\r
}\r
\r
#easymd q {\r
  quotes: '"' '"' '' ' ' '';\r
  color: #222222;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #111111;\r
  font-weight: 700;\r
  font-size: 1.1em;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #111111;\r
  font-weight: 700;\r
  font-size: 1.1em;\r
}\r
\r
#easymd var {\r
  font-style: italic;\r
  font-weight: 600;\r
  color: #2a2a2a;\r
}\r
\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'Courier New', Courier, monospace;\r
  font-size: 0.875em;\r
  background-color: #f0f0ee;\r
  color: #222222;\r
  padding: 0.1em 0.3em;\r
  border: 1px solid #cccccc;\r
}\r
\r
#easymd abbr[title] {\r
  border-bottom: 1px dotted #111111;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 传统下划线风格\r
   ============================================ */\r
\r
#easymd a {\r
  color: #111111;\r
  text-decoration: underline;\r
  text-underline-offset: 2px;\r
  text-decoration-thickness: 1px;\r
}\r
\r
#easymd a:hover {\r
  color: #b22222;\r
  text-decoration-thickness: 2px;\r
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
}\r
\r
#easymd rp {\r
  color: #888888;\r
}\r
\r
/* ============================================\r
   列表 - 经典报刊列表\r
   ============================================ */\r
\r
#easymd ul,\r
#easymd ol {\r
  margin-bottom: 0.9em;\r
  padding-left: 1.6em;\r
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
  margin-bottom: 0.2em;\r
}\r
\r
#easymd li::marker {\r
  color: #111111;\r
  font-weight: 700;\r
}\r
\r
#easymd li > ul,\r
#easymd li > ol {\r
  margin-top: 0.2em;\r
  margin-bottom: 0.2em;\r
}\r
\r
#easymd ul ul {\r
  list-style-type: circle;\r
}\r
\r
#easymd ul ul ul {\r
  list-style-type: square;\r
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
  gap: 0.4em;\r
}\r
\r
#easymd input[type='checkbox'] {\r
  margin-top: 0.3em;\r
  accent-color: #111111;\r
}\r
\r
/* ============================================\r
   引用块 - 报刊引述风格\r
   ============================================ */\r
\r
#easymd blockquote {\r
  margin: 1em 0;\r
  padding: 0.75em 1em;\r
  border-left: 4px solid #111111;\r
  border-right: 1px solid #cccccc;\r
  background-color: #f5f5f3;\r
  color: #2a2a2a;\r
}\r
\r
#easymd blockquote p {\r
  margin-bottom: 0.4em;\r
}\r
\r
#easymd blockquote p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
#easymd blockquote blockquote {\r
  margin-top: 0.6em;\r
  margin-bottom: 0;\r
  border-left-color: #666666;\r
  border-right: none;\r
  background-color: #ededed;\r
}\r
\r
/* ============================================\r
   代码 - 打字机风格\r
   ============================================ */\r
\r
#easymd code {\r
  font-family: 'Courier New', Courier, monospace;\r
  font-size: 0.875em;\r
  background-color: #f0f0ee;\r
  color: #111111;\r
  padding: 0.15em 0.35em;\r
  border: 1px solid #cccccc;\r
}\r
\r
#easymd pre {\r
  margin: 1em 0;\r
  padding: 0.875em 1em;\r
  background-color: #f5f5f3;\r
  border: 1px solid #111111;\r
  border-top: 3px solid #111111;\r
  overflow-x: auto;\r
}\r
\r
#easymd pre code {\r
  background-color: transparent;\r
  color: inherit;\r
  padding: 0;\r
  border: none;\r
  font-size: 0.875em;\r
  line-height: 1.5;\r
}\r
\r
/* ============================================\r
   表格 - 经典报刊数据表\r
   ============================================ */\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 1em 0;\r
  border-collapse: collapse;\r
  font-size: 0.9375em;\r
  border: 1px solid #111111;\r
}\r
\r
/* 表头首行样式（替代 thead） */\r
#easymd tr:first-child th {\r
  color: #f9f9f7;\r
  font-weight: 700;\r
  background-color: #111111;\r
  border-bottom: 2px solid #111111;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 0.5em 0.75em;\r
  border: 1px solid #888888;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: 700;\r
  background-color: #e8e8e6;\r
  color: #111111;\r
  text-transform: uppercase;\r
  font-size: 0.875em;\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background-color: #f5f5f3;\r
}\r
\r
/* Frontmatter 表格 - 元信息展示 */\r
#easymd .frontmatter-table {\r
  width: auto;\r
  margin-bottom: 1.25em;\r
  font-size: 0.875em;\r
  border: none;\r
  border-bottom: 1px solid #111111;\r
}\r
\r
#easymd .frontmatter-table td {\r
  padding: 0.2em 0.75em 0.2em 0;\r
  border: none;\r
  vertical-align: top;\r
  background-color: transparent;\r
}\r
\r
#easymd .frontmatter-key {\r
  font-weight: 700;\r
  color: #111111;\r
  white-space: nowrap;\r
  text-transform: uppercase;\r
  font-size: 0.85em;\r
}\r
\r
#easymd .frontmatter-key::after {\r
  content: ':';\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #444444;\r
}\r
\r
/* ============================================\r
   分割线 - 报刊分隔符\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.5em 0;\r
  border: none;\r
  border-top: 3px double #111111;\r
  height: 0;\r
}\r
\r
/* ============================================\r
   图片与媒体 - 新闻图片框架\r
   ============================================ */\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  border: 1px solid #111111;\r
  margin: 1em 0;\r
}\r
\r
#easymd picture {\r
  display: block;\r
  margin: 1em 0;\r
}\r
\r
#easymd picture img {\r
  display: block;\r
  margin: 0;\r
}\r
\r
#easymd figure {\r
  margin: 1em 0;\r
  text-align: center;\r
}\r
\r
#easymd figure img {\r
  display: block;\r
  margin: 0 auto;\r
}\r
\r
#easymd figcaption {\r
  margin-top: 0.4em;\r
  font-size: 0.8125em;\r
  color: #555555;\r
  font-style: italic;\r
  text-align: center;\r
  padding: 0.25em 0;\r
  border-bottom: 1px solid #cccccc;\r
}\r
\r
/* ============================================\r
   脚注 - 报刊注释风格\r
   ============================================ */\r
\r
#easymd .footnotes {\r
  margin-top: 1.5em;\r
  padding-top: 0.75em;\r
  border-top: 2px solid #111111;\r
  font-size: 0.875em;\r
  color: #555555;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.25em;\r
}\r
\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #111111;\r
  font-weight: 700;\r
  text-decoration: none;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #111111;\r
  text-decoration: none;\r
  font-weight: 700;\r
}\r
\r
/* ============================================\r
   定义列表 - 术语解释\r
   ============================================ */\r
\r
#easymd dl {\r
  margin: 1em 0;\r
}\r
\r
#easymd dt {\r
  font-weight: 700;\r
  color: #111111;\r
  margin-top: 0.5em;\r
  padding-bottom: 0.1em;\r
  border-bottom: 1px solid #cccccc;\r
  display: inline-block;\r
}\r
\r
#easymd dt:first-child {\r
  margin-top: 0;\r
}\r
\r
#easymd dd {\r
  margin-left: 1.25em;\r
  margin-top: 0.25em;\r
  color: #444444;\r
}\r
\r
/* ============================================\r
   键盘按键 - 打字机按键风格\r
   ============================================ */\r
\r
#easymd kbd {\r
  font-family: 'Courier New', Courier, monospace;\r
  font-size: 0.8125em;\r
  display: inline-block;\r
  padding: 0.15em 0.4em;\r
  background-color: #f0f0ee;\r
  border: 1px solid #888888;\r
  border-bottom: 2px solid #666666;\r
  color: #111111;\r
  font-weight: 700;\r
}\r
\r
/* ============================================\r
   警告框 - 报刊公告风格\r
   黑白灰色调，严肃权威\r
   ============================================ */\r
\r
#easymd .markdown-alert {\r
  margin: 1em 0;\r
  padding: 0.625em 1em;\r
  border: 1px solid #111111;\r
  border-left: 4px solid #111111;\r
  background-color: #f5f5f3;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.4em;\r
  font-weight: 700;\r
  margin-bottom: 0.3em;\r
  text-transform: uppercase;\r
  font-size: 0.875em;\r
}\r
\r
/* Note - 中灰 */\r
#easymd .markdown-alert-note {\r
  background-color: #f5f5f5;\r
  border-color: #666666;\r
  border-left-color: #444444;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #444444;\r
}\r
\r
/* Tip - 浅灰 */\r
#easymd .markdown-alert-tip {\r
  background-color: #f8f8f6;\r
  border-color: #777777;\r
  border-left-color: #555555;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #555555;\r
}\r
\r
/* Important - 深黑 */\r
#easymd .markdown-alert-important {\r
  background-color: #f0f0ee;\r
  border-color: #333333;\r
  border-left-color: #111111;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #111111;\r
}\r
\r
/* Warning - 深灰 */\r
#easymd .markdown-alert-warning {\r
  background-color: #f6f6f4;\r
  border-color: #555555;\r
  border-left-color: #333333;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #333333;\r
}\r
\r
/* Caution - 编辑红 */\r
#easymd .markdown-alert-caution {\r
  background-color: #faf5f5;\r
  border-color: #b22222;\r
  border-left-color: #8b1a1a;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #8b1a1a;\r
}\r
\r
/* ============================================\r
   数学公式\r
   ============================================ */\r
\r
#easymd .math-inline {\r
  font-size: 1em;\r
}\r
\r
#easymd .math-display {\r
  margin: 1em 0;\r
  overflow-x: auto;\r
  text-align: center;\r
  padding: 0.75em;\r
  background-color: #f5f5f3;\r
  border-top: 1px solid #cccccc;\r
  border-bottom: 1px solid #cccccc;\r
}\r
\r
/* ============================================\r
   折叠详情 - 可展开栏目\r
   ============================================ */\r
\r
#easymd details {\r
  margin: 1em 0;\r
  padding: 0.5em 0.75em;\r
  background-color: #f5f5f3;\r
  border: 1px solid #888888;\r
  border-left: 3px solid #111111;\r
}\r
\r
#easymd summary {\r
  font-weight: 700;\r
  cursor: pointer;\r
  color: #222222;\r
  text-transform: uppercase;\r
  font-size: 0.9375em;\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.5em;\r
  padding-bottom: 0.5em;\r
  border-bottom: 1px solid #cccccc;\r
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
  border: 1px solid #111111;\r
}\r
\r
/* ============================================\r
   元信息与时间 - 报头日期风格\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.8125em;\r
  color: #666666;\r
  font-style: normal;\r
  text-transform: uppercase;\r
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
