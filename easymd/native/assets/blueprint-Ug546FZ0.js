var r=`/* ============================================\r
   Blueprint - 蓝图技术文档风格\r
\r
   设计灵感：Zed 官网 agentic-engineering 页面\r
   干净专业的技术文档美学，暖冷色调对比\r
\r
   设计哲学：\r
   - 专业 — 技术文档的精确与可信\r
   - 简洁 — 去除冗余，聚焦内容\r
   - 层次 — 蓝色强调，灰色辅助\r
   - 温暖 — 奶油背景中和冷调文字\r
\r
   配色系统（硬编码）：\r
   - 背景色: #f5f4ef (cream-50)\r
   - 正文色: #1e293b (offgray-800)\r
   - 次要文字: #475569 (offgray-600)\r
   - 辅助灰: #64748b (offgray-500)\r
   - 强调蓝: #0751cf (accent-blue)\r
   - 标题蓝: #1d4ed8 (blue-700)\r
   - 边框色: #e2e8f0 (offgray-200)\r
   - 代码背景: #f8fafc (offgray-50)\r
   - 浅蓝背景: #dbeafe (blue-100)\r
   ============================================ */\r
\r
/* 容器 - 奶油白背景，专业技术感 */\r
#easymd {\r
  color: #1e293b;\r
  background-color: #f5f4ef;\r
  font-family:\r
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei',\r
    sans-serif;\r
  font-size: 16px;\r
  line-height: 1.7;\r
  padding: 1.25em 1em;\r
  border: 1px solid #e2e8f0;\r
}\r
\r
/* ============================================\r
   标题 - 蓝色系，逐级变淡\r
   衬线字体，技术文档层次感\r
   ============================================ */\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  font-family: Georgia, 'Times New Roman', 'Songti SC', 'SimSun', serif;\r
  font-weight: 600;\r
  line-height: 1.3;\r
  margin-top: 1.25em;\r
  margin-bottom: 0.4em;\r
}\r
\r
#easymd h1 {\r
  font-size: 1.875em;\r
  color: #0751cf;\r
  text-align: center;\r
  padding-bottom: 0.4em;\r
  margin-bottom: 0.6em;\r
  border-bottom: 1px solid #e2e8f0;\r
}\r
\r
#easymd h2 {\r
  font-size: 1.5em;\r
  color: #1d4ed8;\r
  padding-bottom: 0.25em;\r
  border-bottom: 1px solid #e2e8f0;\r
}\r
\r
#easymd h3 {\r
  font-size: 1.25em;\r
  color: #334155;\r
}\r
\r
#easymd h3::before {\r
  content: '#';\r
  color: #93c5fd;\r
  margin-right: 0.3em;\r
  font-weight: 400;\r
}\r
\r
/* H4-H6 - 统一灰色 */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #475569;\r
}\r
\r
#easymd h4 {\r
  font-size: 1.125em;\r
}\r
\r
#easymd h5 {\r
  font-size: 1em;\r
  font-style: italic;\r
}\r
\r
#easymd h6 {\r
  font-size: 0.9375em;\r
  font-style: italic;\r
}\r
\r
/* 首个标题无上边距 */\r
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
   段落 - 舒适阅读\r
   ============================================ */\r
\r
#easymd p {\r
  margin-bottom: 0.9em;\r
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
  font-weight: 600;\r
  color: #0f172a;\r
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
  color: #94a3b8;\r
  text-decoration: line-through;\r
}\r
\r
#easymd mark {\r
  background-color: #dbeafe;\r
  color: #1e293b;\r
  padding: 0.1em 0.2em;\r
}\r
\r
#easymd small {\r
  font-size: 0.875em;\r
  color: #64748b;\r
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
  background-color: #e0f2fe;\r
  text-decoration: none;\r
  padding: 0.1em 0.2em;\r
}\r
\r
#easymd q {\r
  quotes: '"' '"' '' ' ' '';\r
  color: #1e293b;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #3b82f6;\r
  font-weight: 600;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #3b82f6;\r
  font-weight: 600;\r
}\r
\r
#easymd var {\r
  font-style: italic;\r
  color: #334155;\r
}\r
\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #f8fafc;\r
  color: #475569;\r
  padding: 0.1em 0.3em;\r
  border: 1px solid #e2e8f0;\r
}\r
\r
#easymd abbr[title] {\r
  border-bottom: 1px dotted #3b82f6;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 强调蓝\r
   ============================================ */\r
\r
#easymd a {\r
  color: #0751cf;\r
  text-decoration: none;\r
  border-bottom: 1px solid #93c5fd;\r
}\r
\r
#easymd a:hover {\r
  color: #1d4ed8;\r
  border-bottom-color: #1d4ed8;\r
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
  color: #64748b;\r
}\r
\r
#easymd rp {\r
  color: #94a3b8;\r
}\r
\r
/* ============================================\r
   列表\r
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
  color: #3b82f6;\r
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
  accent-color: #3b82f6;\r
}\r
\r
/* ============================================\r
   引用块 - 蓝色左边框\r
   ============================================ */\r
\r
#easymd blockquote {\r
  margin: 1em 0;\r
  padding: 0.6em 1em;\r
  border-left: 3px solid #3b82f6;\r
  background-color: #faf9f6;\r
  color: #334155;\r
  font-style: italic;\r
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
  margin-top: 0.5em;\r
  margin-bottom: 0;\r
  border-left-color: #93c5fd;\r
  background-color: #f8fafc;\r
}\r
\r
/* ============================================\r
   代码 - 技术文档风格\r
   ============================================ */\r
\r
#easymd code {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #f0f9ff;\r
  color: #0369a1;\r
  padding: 0.15em 0.35em;\r
  border: 1px solid #bae6fd;\r
}\r
\r
#easymd pre {\r
  margin: 1em 0;\r
  padding: 0.875em 1em;\r
  background-color: #f8fafc;\r
  border: 1px solid #e2e8f0;\r
  border-top: 3px solid #3b82f6;\r
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
   表格 - 简洁边框设计\r
   ============================================ */\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 1em 0;\r
  border-collapse: collapse;\r
  font-size: 0.9375em;\r
}\r
\r
#easymd tr:first-child th {\r
  background-color: #f8fafc;\r
  color: #1e293b;\r
  border-bottom: 2px solid #cbd5e1;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 0.5em 0.75em;\r
  border: 1px solid #e2e8f0;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: 600;\r
  background-color: #f8fafc;\r
  color: #334155;\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background-color: #faf9f6;\r
}\r
\r
/* Frontmatter 表格 */\r
#easymd .frontmatter-table {\r
  width: auto;\r
  margin-bottom: 1.25em;\r
  font-size: 0.875em;\r
  border: none;\r
  border-bottom: 1px solid #e2e8f0;\r
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
  font-weight: 600;\r
  color: #334155;\r
  white-space: nowrap;\r
}\r
\r
#easymd .frontmatter-key::after {\r
  content: ':';\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #475569;\r
}\r
\r
/* ============================================\r
   分割线 - 蓝灰点状线\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.25em 0;\r
  border: none;\r
  border-top: 1px dashed #cbd5e1;\r
  height: 0;\r
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
  border: 1px solid #e2e8f0;\r
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
  color: #64748b;\r
  font-style: italic;\r
}\r
\r
/* ============================================\r
   脚注\r
   ============================================ */\r
\r
#easymd .footnotes {\r
  margin-top: 1.5em;\r
  padding-top: 0.75em;\r
  border-top: 1px solid #e2e8f0;\r
  font-size: 0.875em;\r
  color: #64748b;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.25em;\r
}\r
\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #0751cf;\r
  font-weight: 600;\r
  text-decoration: none;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #0751cf;\r
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
  color: #1e293b;\r
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
  color: #475569;\r
}\r
\r
/* ============================================\r
   键盘按键\r
   ============================================ */\r
\r
#easymd kbd {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.8125em;\r
  display: inline-block;\r
  padding: 0.15em 0.4em;\r
  background-color: #f8fafc;\r
  border: 1px solid #cbd5e1;\r
  border-bottom: 2px solid #94a3b8;\r
  color: #1e293b;\r
}\r
\r
/* ============================================\r
   警告框 - 蓝灰色调\r
   ============================================ */\r
\r
#easymd .markdown-alert {\r
  margin: 1em 0;\r
  padding: 0.625em 1em;\r
  border: 1px solid;\r
  border-left: 3px solid;\r
  background-color: #f8fafc;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.4em;\r
  font-weight: 600;\r
  margin-bottom: 0.3em;\r
}\r
\r
/* Note - 蓝色 */\r
#easymd .markdown-alert-note {\r
  background-color: #f0f9ff;\r
  border-color: #7dd3fc;\r
  border-left-color: #0ea5e9;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #0369a1;\r
}\r
\r
/* Tip - 青绿色 */\r
#easymd .markdown-alert-tip {\r
  background-color: #f0fdfa;\r
  border-color: #5eead4;\r
  border-left-color: #14b8a6;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #0f766e;\r
}\r
\r
/* Important - 靛蓝色 */\r
#easymd .markdown-alert-important {\r
  background-color: #eef2ff;\r
  border-color: #a5b4fc;\r
  border-left-color: #6366f1;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #4338ca;\r
}\r
\r
/* Warning - 琥珀色 */\r
#easymd .markdown-alert-warning {\r
  background-color: #fffbeb;\r
  border-color: #fcd34d;\r
  border-left-color: #f59e0b;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #b45309;\r
}\r
\r
/* Caution - 红色 */\r
#easymd .markdown-alert-caution {\r
  background-color: #fef2f2;\r
  border-color: #fca5a5;\r
  border-left-color: #ef4444;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #b91c1c;\r
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
  background-color: #f8fafc;\r
  border: 1px solid #e2e8f0;\r
  border-left: 3px solid #3b82f6;\r
}\r
\r
#easymd summary {\r
  font-weight: 600;\r
  cursor: pointer;\r
  color: #334155;\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.5em;\r
  padding-bottom: 0.5em;\r
  border-bottom: 1px solid #e2e8f0;\r
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
  border: 1px solid #e2e8f0;\r
}\r
\r
/* ============================================\r
   元信息与时间\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.875em;\r
  color: #64748b;\r
  font-style: normal;\r
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
