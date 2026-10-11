var r=`/* ============================================\r
   Ayu Light - Lapis 设计风格 + Ayu 配色方案\r
   融合 Typora Lapis 主题的经典排版美学\r
   与 Ayu Light 温暖橙色调配色\r
   ============================================ */\r
\r
/* 配色参考（硬编码自 palette/index.ts）\r
   背景: #fcfcfc\r
   次要背景: #f8f9fa\r
   小组件背景: #fafafa\r
   主文字: #5c6166\r
   次要文字: #828e9f\r
   注释: #787b80\r
   强调色: #f29718\r
   错误: #e65050\r
   成功: #6cbf43\r
   警告: #f2a300\r
   信息: #55b4d4\r
   代码色: #f07171\r
   边框: #e6e8eb\r
   高亮: #ffe294\r
*/\r
\r
/* 容器 */\r
#easymd {\r
  color: #5c6166;\r
  background-color: #fcfcfc;\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\r
  font-size: 16px;\r
  line-height: 1.6;\r
  padding: 1.5em 1em;\r
}\r
\r
/* ============================================\r
   标题 - H2 反白设计，同一色系逐级变淡\r
   ============================================ */\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  line-height: 1.35;\r
  margin-top: 1.2em;\r
  margin-bottom: 0.5em;\r
  font-weight: 600;\r
}\r
\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  font-weight: 500;\r
}\r
\r
/* H1 - 居中，底部橙色边框 */\r
#easymd h1 {\r
  font-size: 1.75em;\r
  color: #5c6166;\r
  text-align: center;\r
  padding-bottom: 0.5em;\r
  border-bottom: 2px solid #f29718;\r
}\r
\r
/* H2 - 反白设计：橙色背景 + 白色文字 */\r
#easymd h2 {\r
  font-size: 1.35em;\r
  color: #fcfcfc;\r
  background-color: #f29718;\r
  padding: 2px 12px;\r
  border-radius: 4px;\r
  display: inline-block;\r
  margin: 0.3em 0;\r
}\r
\r
#easymd h2 a {\r
  color: #fcfcfc;\r
}\r
\r
#easymd h2 code {\r
  background-color: #f29718;\r
  color: #fcfcfc;\r
}\r
\r
#easymd h2 strong {\r
  color: #fcfcfc;\r
}\r
\r
/* H3 - 橙色文字 */\r
#easymd h3 {\r
  font-size: 1.2em;\r
  color: #f29718;\r
}\r
\r
/* H4-H6 - 使用相同的次要色 */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  font-size: 1em;\r
  color: #828e9f;\r
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
  line-height: 1.8;\r
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
/* 加粗 - 使用橙色强调 */\r
#easymd strong,\r
#easymd b {\r
  font-weight: 600;\r
  color: #f29718;\r
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
  color: #828e9f;\r
  text-decoration: line-through;\r
}\r
\r
#easymd mark {\r
  background-color: #ffe294;\r
  color: #5c6166;\r
  padding: 1px 4px;\r
  border-radius: 2px;\r
}\r
\r
#easymd small {\r
  font-size: 0.875em;\r
  color: #828e9f;\r
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
  background-color: rgba(108, 191, 67, 0.15);\r
  text-decoration: none;\r
  padding: 0.1em 0.2em;\r
  border-radius: 2px;\r
}\r
\r
#easymd q {\r
  quotes: '"' '"' '' ' ' '';\r
  color: #5c6166;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #f29718;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #f29718;\r
}\r
\r
#easymd var {\r
  font-style: italic;\r
  color: #f07171;\r
}\r
\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.85em;\r
  background-color: #f8f9fa;\r
  padding: 0.1em 0.3em;\r
  border-radius: 3px;\r
}\r
\r
#easymd abbr[title] {\r
  border-bottom: 1px dotted #828e9f;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 橙色带下划线（Lapis 风格）\r
   ============================================ */\r
\r
#easymd a {\r
  color: #f29718;\r
  text-decoration: underline;\r
  text-underline-offset: 4px;\r
  text-decoration-thickness: 1px;\r
}\r
\r
#easymd a:hover {\r
  color: #ff7e33;\r
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
  color: #828e9f;\r
}\r
\r
#easymd rp {\r
  color: #828e9f;\r
}\r
\r
/* ============================================\r
   列表\r
   ============================================ */\r
\r
#easymd ul,\r
#easymd ol {\r
  margin-bottom: 1em;\r
  padding-left: 2em;\r
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
  margin-bottom: 0.4em;\r
  line-height: 1.7;\r
}\r
\r
#easymd li::marker {\r
  font-weight: bold;\r
  color: #828e9f;\r
}\r
\r
#easymd li > ul,\r
#easymd li > ol {\r
  margin-top: 0.4em;\r
  margin-bottom: 0.4em;\r
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
  margin-top: 0.35em;\r
  accent-color: #f29718;\r
}\r
\r
/* ============================================\r
   引用块 - 橙色左边框 + 浅色背景\r
   ============================================ */\r
\r
#easymd blockquote {\r
  display: block;\r
  font-size: 0.95em;\r
  overflow: auto;\r
  border-left: 3px solid #f29718;\r
  padding: 12px 20px;\r
  margin: 1em 0;\r
  background: #f8f9fa;\r
}\r
\r
#easymd blockquote p {\r
  margin-bottom: 0.5em;\r
  line-height: 1.7;\r
}\r
\r
#easymd blockquote p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
#easymd blockquote blockquote {\r
  margin-top: 0.5em;\r
  margin-bottom: 0;\r
  border-left-color: #e6e8eb;\r
}\r
\r
/* ============================================\r
   代码\r
   ============================================ */\r
\r
#easymd code {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.9em;\r
  background-color: #f8f9fa;\r
  color: #f29718;\r
  padding: 2px 4px;\r
  border-radius: 3px;\r
  word-break: break-all;\r
}\r
\r
#easymd pre {\r
  margin: 1em 0;\r
  padding: 1.2em;\r
  background-color: #f8f9fa;\r
  border-radius: 10px;\r
  overflow-x: auto;\r
  line-height: 1.6;\r
}\r
\r
#easymd pre code {\r
  background-color: transparent;\r
  color: inherit;\r
  padding: 0;\r
  border: none;\r
  border-radius: 0;\r
  font-size: 0.875em;\r
  line-height: 1.5;\r
}\r
\r
/* ============================================\r
   表格\r
   ============================================ */\r
\r
#easymd table {\r
  display: table;\r
  width: 100%;\r
  margin: 1em 0;\r
  border-collapse: collapse;\r
  border-spacing: 0;\r
  font-size: 0.95em;\r
  text-align: left;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 8px 12px;\r
  border: 1px solid #e6e8eb;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: bold;\r
  color: #f29718;\r
  text-align: center;\r
  min-width: 6em;\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background-color: #fafafa;\r
}\r
\r
#easymd .frontmatter-table {\r
  width: auto;\r
  margin-bottom: 1.5em;\r
  font-size: 0.875em;\r
  border: none;\r
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
  font-weight: 600;\r
  color: #f29718;\r
  white-space: nowrap;\r
}\r
\r
#easymd .frontmatter-key::after {\r
  content: ':';\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #828e9f;\r
}\r
\r
/* ============================================\r
   分割线\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.5em 0;\r
  border: none;\r
  border-top: 2px solid #e6e8eb;\r
  border-radius: 2px;\r
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
  margin: 1em auto;\r
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
  color: #828e9f;\r
}\r
\r
/* ============================================\r
   脚注\r
   ============================================ */\r
\r
#easymd .footnotes {\r
  margin-top: 1.5em;\r
  padding-top: 0.75em;\r
  border-top: 1px solid #e6e8eb;\r
  font-size: 0.875em;\r
  color: #828e9f;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.25em;\r
}\r
\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #f29718;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #f29718;\r
  text-decoration: none;\r
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
#easymd dt {\r
  font-weight: 600;\r
  color: #f29718;\r
  margin-top: 0.5em;\r
}\r
\r
#easymd dt:first-child {\r
  margin-top: 0;\r
}\r
\r
#easymd dd {\r
  margin-left: 1.25em;\r
  margin-top: 0.2em;\r
  color: #5c6166;\r
}\r
\r
/* ============================================\r
   键盘按键\r
   ============================================ */\r
\r
#easymd kbd {\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\r
  font-size: 0.8125em;\r
  display: inline-block;\r
  padding: 0.15em 0.4em;\r
  background-color: #f8f9fa;\r
  border: 1px solid #e6e8eb;\r
  border-radius: 3px;\r
  box-shadow: inset 0 -1px 0 #e6e8eb;\r
  color: #5c6166;\r
}\r
\r
/* ============================================\r
   警告框\r
   ============================================ */\r
\r
#easymd .markdown-alert {\r
  display: block;\r
  overflow: auto;\r
  margin: 1em 0;\r
  padding: 12px 20px;\r
  border-radius: 4px;\r
  border-left: 3px solid;\r
  background: #f8f9fa;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.4em;\r
  font-weight: 600;\r
  font-size: 1.1em;\r
  margin-bottom: 0.3em;\r
}\r
\r
#easymd .markdown-alert-note {\r
  background-color: rgba(85, 180, 212, 0.06);\r
  border-left-color: #55b4d4;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #55b4d4;\r
}\r
\r
#easymd .markdown-alert-tip {\r
  background-color: rgba(108, 191, 67, 0.06);\r
  border-left-color: #6cbf43;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #6cbf43;\r
}\r
\r
#easymd .markdown-alert-important {\r
  background-color: rgba(163, 122, 204, 0.06);\r
  border-left-color: #a37acc;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #a37acc;\r
}\r
\r
#easymd .markdown-alert-warning {\r
  background-color: rgba(242, 163, 0, 0.06);\r
  border-left-color: #f2a300;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #f2a300;\r
}\r
\r
#easymd .markdown-alert-caution {\r
  background-color: rgba(230, 80, 80, 0.06);\r
  border-left-color: #e65050;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #e65050;\r
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
}\r
\r
/* ============================================\r
   折叠详情\r
   ============================================ */\r
\r
#easymd details {\r
  margin: 1em 0;\r
  padding: 0.5em 0.75em;\r
  background-color: #f8f9fa;\r
  border: 1px solid #e6e8eb;\r
  border-radius: 8px;\r
}\r
\r
#easymd summary {\r
  font-weight: 600;\r
  cursor: pointer;\r
  color: #f29718;\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.5em;\r
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
  border-radius: 8px;\r
  border: 1px solid #e6e8eb;\r
}\r
\r
/* ============================================\r
   元信息与时间\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.875em;\r
  color: #828e9f;\r
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
