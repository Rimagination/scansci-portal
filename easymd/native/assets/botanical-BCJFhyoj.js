var r=`/* ============================================\r
   Botanical - 维多利亚植物图鉴风格\r
\r
   设计哲学：精致科学与古典优雅的融合\r
   灵感来源：18-19世纪的植物学图鉴、博物馆标本陈列、\r
   铜版印刷术、维多利亚时代的自然史出版物\r
\r
   情感关键词：\r
   - 精致 — 科学观察的细致入微\r
   - 冷静 — 理性与秩序的美感\r
   - 学术 — 知识殿堂的庄重气息\r
   - 永恒 — 穿越时光的经典美学\r
   - 收藏 — 珍稀标本的珍贵感\r
\r
   配色系统（与 Organic 的暖色大地风形成冷色调对比）：\r
   - 古书纸白 #F7F5F0（冷调象牙白，区别于 Organic 的米纸白）\r
   - 墨棕色 #2A2520（深沉文字色，带有古墨质感）\r
   - 铜版绿 #2E5D4E（主强调色，维多利亚图鉴的标志性冷绿）\r
   - 皇家蓝 #3D5A80（链接色，区别于 Organic 的赤陶土）\r
   - 标本绿 #4A7C6F（次要绿色）\r
   - 羊皮纸 #EDE9E0（次要背景）\r
   - 古铜边框 #D4CFC6（精致边框线）\r
   - 陈年墨 #5C5550（辅助文字）\r
\r
   设计特点：\r
   - 精确锐利的线条，模拟铜版雕刻\r
   - 小圆角或无圆角，体现科学严谨\r
   - 细致的边框装饰，如同图鉴页面\r
   - 衬线字体传递学术与历史厚重感\r
   ============================================ */\r
\r
/* 容器 - 古典图鉴的纸张质感 */\r
#easymd {\r
  color: #2a2520;\r
  background-color: #f7f5f0;\r
  font-family: Georgia, 'Songti SC', 'Noto Serif SC', 'Times New Roman', serif;\r
  font-size: 16px;\r
  line-height: 1.75;\r
  padding: 1.5em 1.25em;\r
}\r
\r
/* ============================================\r
   标题 - 铜版绿色系，逐级变淡\r
   如同植物图鉴中的分类层级\r
   ============================================ */\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  font-family: Georgia, 'Songti SC', 'Noto Serif SC', 'Times New Roman', serif;\r
  font-weight: 600;\r
  line-height: 1.35;\r
  margin-top: 1.35em;\r
  margin-bottom: 0.55em;\r
}\r
\r
/* H1 - 深铜版绿，图鉴标题 */\r
#easymd h1 {\r
  font-size: 1.875em;\r
  color: #2e5d4e;\r
  text-align: center;\r
  padding-bottom: 0.45em;\r
  border-bottom: 2px solid #2e5d4e;\r
}\r
\r
/* H2 - 章节标题，精致左边框 */\r
#easymd h2 {\r
  font-size: 1.5em;\r
  color: #2e5d4e;\r
  padding: 0.25em 0.75em;\r
  border-left: 3px solid #2e5d4e;\r
  background-color: rgba(46, 93, 78, 0.06);\r
  background: linear-gradient(90deg, rgba(46, 93, 78, 0.06) 0%, transparent 100%);\r
}\r
\r
/* H3 - 科属分类标题 */\r
#easymd h3 {\r
  font-size: 1.25em;\r
  color: #3a6b5a;\r
}\r
\r
#easymd h3::before {\r
  content: '§';\r
  margin-right: 0.35em;\r
  color: #4a7c6f;\r
  font-size: 0.9em;\r
}\r
\r
/* H4-H6 - 统一的次级标题色调 */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #4a7c6f;\r
}\r
\r
#easymd h4 {\r
  font-size: 1.125em;\r
}\r
\r
#easymd h5,\r
#easymd h6 {\r
  font-size: 1em;\r
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
   段落 - 学术文献的阅读节奏\r
   ============================================ */\r
\r
#easymd p {\r
  margin-bottom: 1em;\r
  text-align: justify;\r
}\r
\r
#easymd p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
/* ============================================\r
   行内文本样式 - 植物图鉴的标注风格\r
   ============================================ */\r
\r
/* 粗体 - 墨棕色强调 */\r
#easymd strong,\r
#easymd b {\r
  font-weight: 700;\r
  color: #2a2520;\r
}\r
\r
/* 斜体 - 拉丁学名风格 */\r
#easymd em,\r
#easymd i {\r
  font-style: italic;\r
  color: #3a6b5a;\r
}\r
\r
/* 删除线 - 陈旧记录 */\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: #9a9590;\r
  text-decoration: line-through;\r
  text-decoration-color: #7a7570;\r
}\r
\r
/* 高亮 - 标本标签感 */\r
#easymd mark {\r
  background-color: #e8e4d8;\r
  color: #2a2520;\r
  padding: 0.1em 0.3em;\r
  border: 1px solid #d4cfc6;\r
}\r
\r
/* 小号文字 */\r
#easymd small {\r
  font-size: 0.875em;\r
  color: #5c5550;\r
}\r
\r
/* 上标 */\r
#easymd sup {\r
  font-size: 0.75em;\r
  line-height: 0;\r
  vertical-align: super;\r
}\r
\r
/* 下标 */\r
#easymd sub {\r
  font-size: 0.75em;\r
  line-height: 0;\r
  vertical-align: sub;\r
}\r
\r
/* 插入文本 - 新发现标注 */\r
#easymd ins {\r
  background-color: rgba(46, 93, 78, 0.1);\r
  text-decoration: none;\r
  padding: 0.1em 0.25em;\r
  border-bottom: 1px solid #2e5d4e;\r
}\r
\r
/* 行内引用 */\r
#easymd q {\r
  quotes: '"' '"' '' ' ' '';\r
  color: #2a2520;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #3d5a80;\r
  font-weight: 600;\r
  font-size: 1.1em;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #3d5a80;\r
  font-weight: 600;\r
  font-size: 1.1em;\r
}\r
\r
/* 变量 - 学名标注色 */\r
#easymd var {\r
  font-style: italic;\r
  color: #3d5a80;\r
  font-weight: 500;\r
}\r
\r
/* 示例输出 */\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #ede9e0;\r
  color: #3a6b5a;\r
  padding: 0.15em 0.35em;\r
  border: 1px solid #d4cfc6;\r
}\r
\r
/* 缩写 */\r
#easymd abbr[title] {\r
  border-bottom: 1px dotted #2e5d4e;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 皇家蓝，区别于 Organic 的赤陶土\r
   ============================================ */\r
\r
#easymd a {\r
  color: #3d5a80;\r
  text-decoration: none;\r
  border-bottom: 1px solid rgba(61, 90, 128, 0.4);\r
}\r
\r
#easymd a:hover {\r
  color: #2c4460;\r
  border-bottom-color: #2c4460;\r
  background-color: rgba(61, 90, 128, 0.06);\r
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
  color: #5c5550;\r
}\r
\r
#easymd rp {\r
  color: #9a9590;\r
}\r
\r
/* ============================================\r
   列表 - 图鉴索引风格\r
   ============================================ */\r
\r
#easymd ul,\r
#easymd ol {\r
  margin-bottom: 1em;\r
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
  margin-bottom: 0.35em;\r
}\r
\r
/* 列表标记使用铜版绿 */\r
#easymd li::marker {\r
  color: #2e5d4e;\r
}\r
\r
#easymd li > ul,\r
#easymd li > ol {\r
  margin-top: 0.3em;\r
  margin-bottom: 0.3em;\r
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
  gap: 0.5em;\r
}\r
\r
#easymd input[type='checkbox'] {\r
  margin-top: 0.35em;\r
  accent-color: #2e5d4e;\r
}\r
\r
/* ============================================\r
   引用块 - 古籍引述风格\r
   ============================================ */\r
\r
#easymd blockquote {\r
  margin: 1.1em 0;\r
  padding: 1em 1.2em;\r
  background-color: #f0ede6;\r
  border-left: 3px solid #2e5d4e;\r
  border-right: 1px solid #d4cfc6;\r
  color: #3a3530;\r
}\r
\r
#easymd blockquote p {\r
  margin-bottom: 0.55em;\r
}\r
\r
#easymd blockquote p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
/* 嵌套引用 - 更浅的边框 */\r
#easymd blockquote blockquote {\r
  margin-top: 0.75em;\r
  margin-bottom: 0;\r
  border-left-color: #4a7c6f;\r
  border-right: none;\r
  background-color: #f5f3ed;\r
}\r
\r
/* ============================================\r
   代码 - 铜版印刷的技术文档\r
   ============================================ */\r
\r
/* 行内代码 */\r
#easymd code {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #ede9e0;\r
  color: #3d5a80;\r
  padding: 0.2em 0.45em;\r
  border: 1px solid #d4cfc6;\r
}\r
\r
/* 代码块容器 */\r
#easymd pre {\r
  margin: 1.1em 0;\r
  padding: 1.2em;\r
  background-color: #f0ede6;\r
  border: 1px solid #d4cfc6;\r
  border-top: 2px solid #2e5d4e;\r
  overflow-x: auto;\r
}\r
\r
/* 代码块内代码重置 */\r
#easymd pre code {\r
  background-color: transparent;\r
  color: inherit;\r
  padding: 0;\r
  border: none;\r
  font-size: 0.875em;\r
  line-height: 1.6;\r
}\r
\r
/* ============================================\r
   表格 - 植物分类学数据表\r
   ============================================ */\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 1.1em 0;\r
  border-collapse: collapse;\r
  font-size: 0.9375em;\r
  border: 1px solid #2e5d4e;\r
}\r
\r
/* 表头首行样式（替代 thead） */\r
#easymd tr:first-child th {\r
  background-color: #2e5d4e;\r
  color: #f7f5f0;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 0.6em 0.85em;\r
  border: 1px solid #d4cfc6;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: 600;\r
  color: #2e5d4e;\r
  background-color: rgba(46, 93, 78, 0.08);\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background-color: #f5f3ed;\r
}\r
\r
/* Frontmatter 元数据表格 */\r
#easymd .frontmatter-table {\r
  width: auto;\r
  margin-bottom: 1.5em;\r
  font-size: 0.875em;\r
  border: none;\r
}\r
\r
#easymd .frontmatter-table td {\r
  padding: 0.3em 0.75em 0.3em 0;\r
  border: none;\r
  vertical-align: top;\r
  background-color: transparent;\r
}\r
\r
#easymd .frontmatter-key {\r
  font-weight: 600;\r
  color: #2e5d4e;\r
  white-space: nowrap;\r
}\r
\r
#easymd .frontmatter-key::after {\r
  content: ':';\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #2a2520;\r
}\r
\r
/* ============================================\r
   分割线 - 铜版装饰线\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.5em 0;\r
  border: none;\r
  height: 1px;\r
  background-color: #2e5d4e;\r
  background: linear-gradient(90deg, transparent 0%, #d4cfc6 15%, #2e5d4e 50%, #d4cfc6 85%, transparent 100%);\r
}\r
\r
/* ============================================\r
   图片与媒体 - 标本图版边框\r
   精致的学术图版风格\r
   ============================================ */\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  margin: 1.1em 0;\r
  border: 1px solid #d4cfc6;\r
  box-shadow: 0 2px 8px rgba(42, 37, 32, 0.08);\r
}\r
\r
#easymd picture {\r
  display: block;\r
  margin: 1.1em 0;\r
}\r
\r
#easymd picture img {\r
  margin: 0;\r
}\r
\r
#easymd figure {\r
  margin: 1.35em 0;\r
  text-align: center;\r
}\r
\r
#easymd figure img {\r
  margin: 0 auto;\r
}\r
\r
#easymd figcaption {\r
  margin-top: 0.7em;\r
  font-size: 0.875em;\r
  color: #5c5550;\r
  font-style: italic;\r
}\r
\r
/* ============================================\r
   脚注 - 学术注释区\r
   ============================================ */\r
\r
#easymd .footnotes {\r
  margin-top: 2.25em;\r
  padding-top: 1.1em;\r
  border-top: 1px solid #2e5d4e;\r
  font-size: 0.875em;\r
  color: #5c5550;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.25em;\r
}\r
\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #3d5a80;\r
  font-weight: 600;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #2e5d4e;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   定义列表 - 术语词典风格\r
   ============================================ */\r
\r
#easymd dl {\r
  margin: 1.1em 0;\r
}\r
\r
#easymd dt {\r
  font-weight: 600;\r
  color: #2e5d4e;\r
  margin-top: 0.65em;\r
}\r
\r
#easymd dt:first-child {\r
  margin-top: 0;\r
}\r
\r
#easymd dd {\r
  margin-left: 1.35em;\r
  margin-top: 0.25em;\r
  color: #2a2520;\r
  padding-left: 0.75em;\r
  border-left: 2px solid #d4cfc6;\r
}\r
\r
/* ============================================\r
   键盘按键 - 古典打字机风格\r
   ============================================ */\r
\r
#easymd kbd {\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\r
  font-size: 0.8125em;\r
  display: inline-block;\r
  padding: 0.2em 0.5em;\r
  background-color: #f0ede6;\r
  border: 1px solid #d4cfc6;\r
  border-bottom: 2px solid #b8b4ac;\r
  color: #2a2520;\r
}\r
\r
/* ============================================\r
   警告框 - 植物图鉴的标注框\r
   使用冷色调，区别于 Organic 的暖色\r
   ============================================ */\r
\r
#easymd .markdown-alert {\r
  margin: 1.1em 0;\r
  padding: 0.85em 1.1em;\r
  border: 1px solid;\r
  border-left: 3px solid;\r
  background-color: #f5f3ed;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.45em;\r
  font-weight: 600;\r
  margin-bottom: 0.4em;\r
}\r
\r
/* Note - 石板蓝（冷静信息） */\r
#easymd .markdown-alert-note {\r
  background-color: #f3f5f8;\r
  border-color: #8b9cad;\r
  border-left-color: #5c7a95;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #5c7a95;\r
}\r
\r
/* Tip - 铜版绿（有益建议） */\r
#easymd .markdown-alert-tip {\r
  background-color: #f2f5f4;\r
  border-color: #7a9a8e;\r
  border-left-color: #2e5d4e;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #2e5d4e;\r
}\r
\r
/* Important - 深靛蓝（重要事项） */\r
#easymd .markdown-alert-important {\r
  background-color: #f4f5f8;\r
  border-color: #8090a5;\r
  border-left-color: #3d5a80;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #3d5a80;\r
}\r
\r
/* Warning - 琥珀棕（注意警示） */\r
#easymd .markdown-alert-warning {\r
  background-color: #f8f6f2;\r
  border-color: #c4a872;\r
  border-left-color: #a08550;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #8a7040;\r
}\r
\r
/* Caution - 勃艮第红（危险警告） */\r
#easymd .markdown-alert-caution {\r
  background-color: #f8f4f4;\r
  border-color: #a87575;\r
  border-left-color: #8b4a4a;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #8b4a4a;\r
}\r
\r
/* ============================================\r
   数学公式 - 学术公式展示\r
   ============================================ */\r
\r
#easymd .math-inline {\r
  font-size: 1em;\r
}\r
\r
#easymd .math-display {\r
  margin: 1.1em 0;\r
  overflow-x: auto;\r
  text-align: center;\r
  padding: 1em;\r
  background-color: #f5f3ed;\r
  border: 1px solid #d4cfc6;\r
}\r
\r
/* ============================================\r
   折叠详情 - 展开式学术注释\r
   ============================================ */\r
\r
#easymd details {\r
  margin: 1.1em 0;\r
  padding: 0.75em 1.05em;\r
  background-color: #f0ede6;\r
  border: 1px solid #d4cfc6;\r
  border-left: 3px solid #2e5d4e;\r
}\r
\r
#easymd summary {\r
  font-weight: 600;\r
  cursor: pointer;\r
  color: #2e5d4e;\r
}\r
\r
#easymd summary::marker {\r
  color: #2e5d4e;\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.65em;\r
  padding-bottom: 0.55em;\r
  border-bottom: 1px dashed #d4cfc6;\r
}\r
\r
/* ============================================\r
   嵌入媒体 - 与图片保持一致的学术风格\r
   ============================================ */\r
\r
#easymd iframe,\r
#easymd video {\r
  display: block;\r
  max-width: 100%;\r
  margin: 1.1em 0;\r
  border: 1px solid #d4cfc6;\r
  box-shadow: 0 2px 8px rgba(42, 37, 32, 0.08);\r
}\r
\r
/* ============================================\r
   元信息与时间 - 图鉴编目信息\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.875em;\r
  color: #5c5550;\r
  font-style: italic;\r
}\r
\r
/* ============================================\r
   首行缩进变体 - 传统书籍排版\r
   ============================================ */\r
\r
#easymd.indent-first-line p {\r
  text-indent: 2em;\r
}\r
`;export{r as default};
