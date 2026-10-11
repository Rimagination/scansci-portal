var r=`/* ============================================\r
   Professional - 专业商务风格\r
\r
   设计哲学：通过古典克制传达排版优雅\r
   灵感来源：高端编辑出版物、文学杂志、\r
   奢侈品牌形象，以及百年印刷传统\r
\r
   情感关键词：\r
   - 永恒 — 超越潮流，历久弥新\r
   - 温暖 — 象牙白背景与金色点缀的人文质感\r
   - 精致 — 小型大写字母、精致规则线、宽裕留白\r
   - 文雅 — 属于思想与有意义沟通的世界\r
   - 自信 — 真正的优雅源于克制而非装饰\r
\r
   配色系统（硬编码）：\r
   - 象牙白背景: #FAFAF8\r
   - 深黑文字: #1A1A1A\r
   - 次级文字: #4A4A4A\r
   - 辅助灰色: #6B6B6B\r
   - 燃烧金色: #B8860B (Dark Goldenrod)\r
   - 浅金色: #D4A84B\r
   - 边框暖灰: #E8E4DF\r
   - 浅背景: #F5F3F0\r
   ============================================ */\r
\r
/* 容器 - 象牙白背景，传达专业信任感 */\r
#easymd {\r
  color: #1a1a1a;\r
  background-color: #fafaf8;\r
  font-family: Georgia, 'Times New Roman', 'Songti SC', 'SimSun', serif;\r
  font-size: 16px;\r
  line-height: 1.75;\r
  padding: 1.5em 1.25em;\r
}\r
\r
/* ============================================\r
   标题 - 深色系，逐级变淡\r
   衬线字体，古典比例，编辑风格\r
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
  line-height: 1.25;\r
  margin-top: 1.35em;\r
  margin-bottom: 0.5em;\r
}\r
\r
/* H1 - 头版标题风格，居中金色下划线 */\r
#easymd h1 {\r
  font-size: 1.875em;\r
  color: #0d0d0d;\r
  text-align: center;\r
  padding-bottom: 0.4em;\r
  margin-bottom: 0.6em;\r
  border-bottom: 2px solid #b8860b;\r
}\r
\r
/* H2 - 章节标题，细边框分隔 */\r
#easymd h2 {\r
  font-size: 1.5em;\r
  color: #1a1a1a;\r
  padding-bottom: 0.3em;\r
  border-bottom: 1px solid #e8e4df;\r
}\r
\r
/* H3 - 小节标题 */\r
#easymd h3 {\r
  font-size: 1.25em;\r
  color: #2d2d2d;\r
}\r
\r
/* H4-H6 - 次级标题，统一颜色 */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #4a4a4a;\r
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
   段落 - 两端对齐，舒适阅读\r
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
   行内文本样式 - 精致的文字处理\r
   ============================================ */\r
\r
/* 粗体 - 深黑强调 */\r
#easymd strong,\r
#easymd b {\r
  font-weight: 700;\r
  color: #0d0d0d;\r
}\r
\r
/* 斜体 */\r
#easymd em,\r
#easymd i {\r
  font-style: italic;\r
}\r
\r
/* 删除线 - 淡灰色表示废弃 */\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: #8a8a8a;\r
  text-decoration: line-through;\r
}\r
\r
/* 高亮 - 温暖的金色调 */\r
#easymd mark {\r
  background-color: #f5e6c8;\r
  color: #1a1a1a;\r
  padding: 0.1em 0.25em;\r
}\r
\r
/* 小号文字 */\r
#easymd small {\r
  font-size: 0.875em;\r
  color: #6b6b6b;\r
}\r
\r
/* 上下标 */\r
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
/* 插入文本 - 金色下划线 */\r
#easymd ins {\r
  background-color: #f0ebe3;\r
  text-decoration: none;\r
  padding: 0.1em 0.2em;\r
  border-bottom: 1px solid #b8860b;\r
}\r
\r
/* 行内引用 - 金色引号 */\r
#easymd q {\r
  quotes: '"' '"' '' ' ' '';\r
  color: #1a1a1a;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #b8860b;\r
  font-weight: 600;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #b8860b;\r
  font-weight: 600;\r
}\r
\r
/* 变量 - 斜体深色 */\r
#easymd var {\r
  font-style: italic;\r
  color: #2d2d2d;\r
}\r
\r
/* 示例输出 - 等宽字体 */\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #f5f3f0;\r
  color: #4a4a4a;\r
  padding: 0.1em 0.3em;\r
  border: 1px solid #e8e4df;\r
}\r
\r
/* 缩写 - 金色点状下划线 */\r
#easymd abbr[title] {\r
  border-bottom: 1px dotted #b8860b;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 燃烧金色点缀\r
   ============================================ */\r
\r
#easymd a {\r
  color: #b8860b;\r
  text-decoration: none;\r
  border-bottom: 1px solid #d4a84b;\r
}\r
\r
#easymd a:hover {\r
  color: #996f09;\r
  border-bottom-color: #996f09;\r
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
  color: #6b6b6b;\r
}\r
\r
#easymd rp {\r
  color: #8a8a8a;\r
}\r
\r
/* ============================================\r
   列表 - 经典有序排版\r
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
  margin-bottom: 0.25em;\r
}\r
\r
/* 列表标记使用金色 */\r
#easymd li::marker {\r
  color: #b8860b;\r
}\r
\r
#easymd li > ul,\r
#easymd li > ol {\r
  margin-top: 0.25em;\r
  margin-bottom: 0.25em;\r
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
  margin-top: 0.35em;\r
  accent-color: #b8860b;\r
}\r
\r
/* ============================================\r
   引用块 - 优雅左边框\r
   ============================================ */\r
\r
#easymd blockquote {\r
  margin: 1.1em 0;\r
  padding: 0.75em 1em;\r
  border-left: 3px solid #b8860b;\r
  background-color: #f5f3f0;\r
  color: #2d2d2d;\r
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
/* 嵌套引用 - 更浅的金色边框 */\r
#easymd blockquote blockquote {\r
  margin-top: 0.5em;\r
  margin-bottom: 0;\r
  border-left-color: #d4a84b;\r
  background-color: #f0ebe3;\r
}\r
\r
/* ============================================\r
   代码 - 精致的技术文档风格\r
   ============================================ */\r
\r
/* 行内代码 */\r
#easymd code {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #f5f3f0;\r
  color: #8b4513;\r
  padding: 0.15em 0.35em;\r
  border: 1px solid #e8e4df;\r
}\r
\r
/* 代码块容器 */\r
#easymd pre {\r
  margin: 1.1em 0;\r
  padding: 0.875em 1em;\r
  background-color: #f8f7f4;\r
  border: 1px solid #e8e4df;\r
  border-top: 2px solid #b8860b;\r
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
  line-height: 1.5;\r
}\r
\r
/* ============================================\r
   表格 - 精致的数据展示\r
   ============================================ */\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 1.1em 0;\r
  border-collapse: collapse;\r
  font-size: 0.9375em;\r
}\r
\r
/* 表头首行样式（替代 thead） */\r
#easymd tr:first-child th {\r
  background-color: transparent;\r
  border-bottom: 2px solid #1a1a1a;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 0.5em 0.75em;\r
  border: 1px solid #e8e4df;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: 700;\r
  background-color: #f8f7f4;\r
  color: #0d0d0d;\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background-color: #fafaf8;\r
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
  padding: 0.25em 0.75em 0.25em 0;\r
  border: none;\r
  vertical-align: top;\r
  background-color: transparent;\r
}\r
\r
#easymd .frontmatter-key {\r
  font-weight: 700;\r
  color: #2d2d2d;\r
  white-space: nowrap;\r
}\r
\r
#easymd .frontmatter-key::after {\r
  content: ':';\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #4a4a4a;\r
}\r
\r
/* ============================================\r
   分割线 - 简洁优雅的分隔\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.5em 0;\r
  border: none;\r
  height: 1px;\r
  background-color: #e8e4df;\r
}\r
\r
/* ============================================\r
   图片与媒体 - 精致边框处理\r
   ============================================ */\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  border: 1px solid #e8e4df;\r
  margin: 1.1em 0;\r
}\r
\r
#easymd picture {\r
  display: block;\r
  margin: 1.1em 0;\r
}\r
\r
#easymd picture img {\r
  display: block;\r
  margin: 0;\r
}\r
\r
#easymd figure {\r
  margin: 1.25em 0;\r
  text-align: center;\r
}\r
\r
#easymd figure img {\r
  display: block;\r
  margin: 0 auto;\r
}\r
\r
#easymd figcaption {\r
  margin-top: 0.5em;\r
  font-size: 0.875em;\r
  color: #6b6b6b;\r
  font-style: italic;\r
}\r
\r
/* ============================================\r
   脚注 - 编辑风格的注释区\r
   ============================================ */\r
\r
#easymd .footnotes {\r
  margin-top: 1.75em;\r
  padding-top: 0.75em;\r
  border-top: 1px solid #e8e4df;\r
  font-size: 0.875em;\r
  color: #6b6b6b;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.25em;\r
}\r
\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #b8860b;\r
  font-weight: 600;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #b8860b;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   定义列表 - 术语解释风格\r
   ============================================ */\r
\r
#easymd dl {\r
  margin: 1.1em 0;\r
}\r
\r
#easymd dt {\r
  font-weight: 700;\r
  color: #0d0d0d;\r
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
  color: #4a4a4a;\r
}\r
\r
/* ============================================\r
   键盘按键 - 经典按键风格\r
   ============================================ */\r
\r
#easymd kbd {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.8125em;\r
  display: inline-block;\r
  padding: 0.15em 0.4em;\r
  background-color: #f8f7f4;\r
  border: 1px solid #d4d0c8;\r
  border-bottom: 2px solid #b8b4ac;\r
  color: #1a1a1a;\r
}\r
\r
/* ============================================\r
   警告框 - 商务风格的提示框\r
   使用柔和的商务色调\r
   ============================================ */\r
\r
#easymd .markdown-alert {\r
  margin: 1.1em 0;\r
  padding: 0.625em 1em;\r
  border: 1px solid;\r
  border-left: 3px solid;\r
  background-color: #f8f7f4;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.4em;\r
  font-weight: 700;\r
  margin-bottom: 0.3em;\r
}\r
\r
/* Note - 深灰蓝（稳重信息） */\r
#easymd .markdown-alert-note {\r
  background-color: #f5f6f8;\r
  border-color: #8b95a5;\r
  border-left-color: #5c6b7f;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #5c6b7f;\r
}\r
\r
/* Tip - 橄榄绿（有益建议） */\r
#easymd .markdown-alert-tip {\r
  background-color: #f6f8f5;\r
  border-color: #8fa082;\r
  border-left-color: #6b8060;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #6b8060;\r
}\r
\r
/* Important - 深褐（重要事项） */\r
#easymd .markdown-alert-important {\r
  background-color: #f8f6f5;\r
  border-color: #a08575;\r
  border-left-color: #7a6455;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #7a6455;\r
}\r
\r
/* Warning - 金褐（注意警示） */\r
#easymd .markdown-alert-warning {\r
  background-color: #faf8f4;\r
  border-color: #c9a855;\r
  border-left-color: #b8860b;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #9a7209;\r
}\r
\r
/* Caution - 深红褐（危险警告） */\r
#easymd .markdown-alert-caution {\r
  background-color: #f9f5f5;\r
  border-color: #b08080;\r
  border-left-color: #8b5050;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #8b5050;\r
}\r
\r
/* ============================================\r
   数学公式 - 学术风格\r
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
}\r
\r
/* ============================================\r
   折叠详情 - 可展开内容区\r
   ============================================ */\r
\r
#easymd details {\r
  margin: 1.1em 0;\r
  padding: 0.5em 0.75em;\r
  background-color: #f8f7f4;\r
  border: 1px solid #e8e4df;\r
  border-left: 3px solid #b8860b;\r
}\r
\r
#easymd summary {\r
  font-weight: 700;\r
  cursor: pointer;\r
  color: #2d2d2d;\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.5em;\r
  padding-bottom: 0.5em;\r
  border-bottom: 1px solid #e8e4df;\r
}\r
\r
/* ============================================\r
   嵌入媒体 - 统一边框处理\r
   ============================================ */\r
\r
#easymd iframe,\r
#easymd video {\r
  display: block;\r
  max-width: 100%;\r
  margin: 1.1em 0;\r
  border: 1px solid #e8e4df;\r
}\r
\r
/* ============================================\r
   元信息与时间 - 编辑风格\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.875em;\r
  color: #6b6b6b;\r
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
