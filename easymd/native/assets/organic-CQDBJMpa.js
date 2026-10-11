var r=`/* ============================================\r
   Organic - 侘寂陶艺风格 (Wabi-Sabi Pottery)\r
\r
   设计哲学：侘寂美学（Wabi-Sabi）\r
   接受不完美，拥抱时间的痕迹\r
   像是陶艺工作室中未上釉的器皿、\r
   锈迹斑驳的铁器、风化的砂岩、\r
   以及未漂白的手工和纸\r
\r
   核心原则：\r
   - 温暖的灰调：比纯白更有生命力\r
   - 质朴的赤褐：大地与陶土的色彩\r
   - 柔和的边界：如同手工打磨的器物边缘\r
   - 时间的质感：仿佛经历岁月沉淀的痕迹\r
\r
   配色系统（侘寂陶艺）：\r
   - 和纸灰 #F5F3EF（温暖的灰白纸张背景）\r
   - 墨炭色 #3D3835（主文字，有温度的深灰）\r
   - 锈铁红 #A65D4C（主强调色，锈迹斑斑的铁器）\r
   - 柿子橙 #D97742（链接与装饰，日本传统柿色）\r
   - 陶土棕 #8B6F5C（辅助色，未上釉的陶器）\r
   - 枯叶灰 #9A918A（次要文字，枯萎落叶）\r
   - 砂岩边 #D8D3CB（柔和边框，风化的石头）\r
   - 灰白纸 #EAE6E0（次要背景，未染的手工纸）\r
\r
   设计特点：\r
   - 温暖灰调创造宁静沉稳的阅读氛围\r
   - 赤褐色系传递手工与泥土的质朴之美\r
   - 圆角边框模拟手工器物的柔和轮廓\r
   - 衬线字体呼应传统书籍的人文气息\r
   ============================================ */\r
\r
/* 容器 - 温暖的和纸质感 */\r
#easymd {\r
  color: #3d3835;\r
  background-color: #f5f3ef;\r
  font-family: Georgia, 'Songti SC', 'Noto Serif SC', 'Times New Roman', serif;\r
  font-size: 16px;\r
  line-height: 1.75;\r
  padding: 1.5em 1.125em;\r
}\r
\r
/* ============================================\r
   标题 - 锈铁红色系，逐级变淡\r
   如同从古老铁器到新烧陶土的色彩层次\r
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
/* H1 - 深锈红，如古老铁器 */\r
#easymd h1 {\r
  font-size: 1.875em;\r
  color: #6d453a;\r
  text-align: center;\r
  padding-bottom: 0.45em;\r
  border-bottom: 3px solid #a65d4c;\r
}\r
\r
/* H2 - 锈铁边框，如手工锻打的铁条 */\r
#easymd h2 {\r
  font-size: 1.5em;\r
  color: #7a4f42;\r
  padding: 0.25em 0.85em;\r
  border-left: 4px solid #a65d4c;\r
  background-color: rgba(166, 93, 76, 0.08);\r
  background: linear-gradient(90deg, rgba(166, 93, 76, 0.08) 0%, transparent 100%);\r
  border-radius: 0 10px 10px 0;\r
}\r
\r
/* H3 - 如阳光照射下的陶土 */\r
#easymd h3 {\r
  font-size: 1.25em;\r
  color: #8b5a4a;\r
}\r
\r
#easymd h3::before {\r
  content: '◈';\r
  margin-right: 0.35em;\r
  color: #a65d4c;\r
  font-size: 0.85em;\r
}\r
\r
/* H4-H6 - 统一的陶土柔和色调 */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #9a7568;\r
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
   段落 - 自然的呼吸节奏\r
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
   行内文本样式 - 陶土与锈铁的色彩变化\r
   ============================================ */\r
\r
/* 粗体 - 深墨炭色强调 */\r
#easymd strong,\r
#easymd b {\r
  font-weight: 700;\r
  color: #6d453a;\r
}\r
\r
/* 斜体 - 柔和的陶土色 */\r
#easymd em,\r
#easymd i {\r
  font-style: italic;\r
  color: #8b5a4a;\r
}\r
\r
/* 删除线 - 枯叶凋零 */\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: #a8a099;\r
  text-decoration: line-through;\r
  text-decoration-color: #d97742;\r
}\r
\r
/* 高亮 - 柿子橙的温暖光晕 */\r
#easymd mark {\r
  background-color: #f0e6db;\r
  color: #3d3835;\r
  padding: 0.1em 0.3em;\r
  border-radius: 4px;\r
  box-shadow: 0 1px 3px rgba(166, 93, 76, 0.1);\r
}\r
\r
/* 小号文字 */\r
#easymd small {\r
  font-size: 0.875em;\r
  color: #9a918a;\r
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
/* 插入文本 - 新烧陶器的痕迹 */\r
#easymd ins {\r
  background-color: rgba(166, 93, 76, 0.1);\r
  text-decoration: none;\r
  padding: 0.1em 0.25em;\r
  border-radius: 3px;\r
  border-bottom: 2px solid rgba(166, 93, 76, 0.35);\r
}\r
\r
/* 行内引用 */\r
#easymd q {\r
  quotes: '"' '"' '' ' ' '';\r
  color: #3d3835;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #d97742;\r
  font-weight: 600;\r
  font-size: 1.1em;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #d97742;\r
  font-weight: 600;\r
  font-size: 1.1em;\r
}\r
\r
/* 变量 - 柿子橙色 */\r
#easymd var {\r
  font-style: italic;\r
  color: #d97742;\r
  font-weight: 500;\r
}\r
\r
/* 示例输出 */\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #eae6e0;\r
  color: #5a4d47;\r
  padding: 0.15em 0.35em;\r
  border-radius: 6px;\r
}\r
\r
/* 缩写 */\r
#easymd abbr[title] {\r
  border-bottom: 2px dotted #a65d4c;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 柿子橙，如成熟的果实\r
   ============================================ */\r
\r
#easymd a {\r
  color: #d97742;\r
  text-decoration: none;\r
  border-bottom: 1px solid rgba(217, 119, 66, 0.45);\r
}\r
\r
#easymd a:hover {\r
  color: #b8612f;\r
  border-bottom-color: #b8612f;\r
  background-color: rgba(217, 119, 66, 0.06);\r
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
  color: #9a918a;\r
}\r
\r
#easymd rp {\r
  color: #a8a099;\r
}\r
\r
/* ============================================\r
   列表 - 质朴的手工标记\r
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
/* 列表标记使用锈铁红 */\r
#easymd li::marker {\r
  color: #a65d4c;\r
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
  accent-color: #a65d4c;\r
}\r
\r
/* ============================================\r
   引用块 - 古旧书卷的质感\r
   ============================================ */\r
\r
#easymd blockquote {\r
  margin: 1.1em 0;\r
  padding: 1em 1.2em;\r
  background-color: #f0ebe5;\r
  border-left: 4px solid #a65d4c;\r
  border-radius: 0 14px 14px 0;\r
  color: #4a4340;\r
  box-shadow: 0 2px 10px rgba(166, 93, 76, 0.06);\r
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
/* 嵌套引用 - 更柔和的砂岩色 */\r
#easymd blockquote blockquote {\r
  margin-top: 0.75em;\r
  margin-bottom: 0;\r
  border-left-color: #d97742;\r
  background-color: #f7f4f0;\r
  border-radius: 0 10px 10px 0;\r
}\r
\r
/* ============================================\r
   代码 - 古籍批注的质感\r
   ============================================ */\r
\r
/* 行内代码 */\r
#easymd code {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #eae6e0;\r
  color: #b8612f;\r
  padding: 0.2em 0.45em;\r
  border-radius: 6px;\r
  border: 1px solid #d8d3cb;\r
}\r
\r
/* 代码块容器 */\r
#easymd pre {\r
  margin: 1.1em 0;\r
  padding: 1.2em;\r
  background-color: #f0ebe5;\r
  border: 1px solid #d8d3cb;\r
  border-radius: 16px;\r
  overflow-x: auto;\r
  box-shadow: inset 0 2px 5px rgba(166, 93, 76, 0.04);\r
}\r
\r
/* 代码块内代码重置 */\r
#easymd pre code {\r
  background-color: transparent;\r
  color: inherit;\r
  padding: 0;\r
  border: none;\r
  border-radius: 0;\r
  font-size: 0.875em;\r
  line-height: 1.6;\r
}\r
\r
/* ============================================\r
   表格 - 陶艺工作室分类表的感觉\r
   ============================================ */\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 1.1em 0;\r
  border-collapse: collapse;\r
  font-size: 0.9375em;\r
  border-radius: 12px;\r
  overflow: hidden;\r
  box-shadow: 0 2px 10px rgba(166, 93, 76, 0.06);\r
}\r
\r
/* 表头首行样式（替代 thead） */\r
#easymd tr:first-child th {\r
  background-color: #a65d4c;\r
  color: #f5f3ef;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 0.6em 0.85em;\r
  border: 1px solid #d8d3cb;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: 600;\r
  color: #6d453a;\r
  background-color: rgba(166, 93, 76, 0.08);\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background-color: #f7f5f2;\r
}\r
\r
/* Frontmatter 元数据表格 */\r
#easymd .frontmatter-table {\r
  width: auto;\r
  margin-bottom: 1.5em;\r
  font-size: 0.875em;\r
  border: none;\r
  box-shadow: none;\r
  border-radius: 0;\r
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
  color: #a65d4c;\r
  white-space: nowrap;\r
}\r
\r
#easymd .frontmatter-key::after {\r
  content: ':';\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #3d3835;\r
}\r
\r
/* ============================================\r
   分割线 - 如枯山水中的沙纹\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.5em 0;\r
  border: none;\r
  height: 3px;\r
  background-color: #a65d4c;\r
  background: linear-gradient(90deg, transparent 0%, #d8d3cb 18%, #a65d4c 50%, #d8d3cb 82%, transparent 100%);\r
  border-radius: 2px;\r
}\r
\r
/* ============================================\r
   图片与媒体 - 圆润有机边框\r
   如同手工相框的柔和轮廓\r
   ============================================ */\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  border-radius: 16px;\r
  margin: 1.1em 0;\r
  box-shadow: 0 4px 18px rgba(166, 93, 76, 0.1);\r
  border: 3px solid #f5f3ef;\r
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
  color: #9a918a;\r
  font-style: italic;\r
}\r
\r
/* ============================================\r
   脚注 - 古籍尾注的区域\r
   ============================================ */\r
\r
#easymd .footnotes {\r
  margin-top: 2.25em;\r
  padding-top: 1.1em;\r
  border-top: 2px solid #d8d3cb;\r
  font-size: 0.875em;\r
  color: #9a918a;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.25em;\r
}\r
\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #d97742;\r
  font-weight: 600;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #a65d4c;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   定义列表 - 陶艺术语解释\r
   ============================================ */\r
\r
#easymd dl {\r
  margin: 1.1em 0;\r
}\r
\r
#easymd dt {\r
  font-weight: 600;\r
  color: #7a4f42;\r
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
  color: #3d3835;\r
  padding-left: 0.75em;\r
  border-left: 3px solid #eae6e0;\r
}\r
\r
/* ============================================\r
   键盘按键 - 陶土质感的按钮\r
   ============================================ */\r
\r
#easymd kbd {\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\r
  font-size: 0.8125em;\r
  display: inline-block;\r
  padding: 0.2em 0.5em;\r
  background-color: #f0ebe5;\r
  border: 1px solid #d8d3cb;\r
  border-radius: 8px;\r
  box-shadow:\r
    0 3px 0 #c9c3b8,\r
    0 4px 6px rgba(166, 93, 76, 0.08);\r
  color: #6d453a;\r
}\r
\r
/* ============================================\r
   警告框 - 不同材质的手工标识\r
   每种类型对应不同的自然元素\r
   ============================================ */\r
\r
#easymd .markdown-alert {\r
  margin: 1.1em 0;\r
  padding: 0.85em 1.1em;\r
  border-radius: 12px;\r
  border-left: 4px solid;\r
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
/* Note - 青釉蓝（如同青瓷） */\r
#easymd .markdown-alert-note {\r
  background-color: rgba(107, 138, 158, 0.1);\r
  border-left-color: #6b8a9e;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #5a7a8e;\r
}\r
\r
/* Tip - 陶土棕（陶器的智慧） */\r
#easymd .markdown-alert-tip {\r
  background-color: rgba(139, 111, 92, 0.1);\r
  border-left-color: #8b6f5c;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #7a5f4e;\r
}\r
\r
/* Important - 紫砂色（珍贵的器物） */\r
#easymd .markdown-alert-important {\r
  background-color: rgba(139, 103, 115, 0.1);\r
  border-left-color: #8b6773;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #7a5865;\r
}\r
\r
/* Warning - 金秋黄（落叶的警示） */\r
#easymd .markdown-alert-warning {\r
  background-color: rgba(199, 163, 97, 0.12);\r
  border-left-color: #c7a361;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #a88d4a;\r
}\r
\r
/* Caution - 锈铁红（危险的锋利） */\r
#easymd .markdown-alert-caution {\r
  background-color: rgba(166, 93, 76, 0.1);\r
  border-left-color: #a65d4c;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #8b4d3e;\r
}\r
\r
/* ============================================\r
   数学公式 - 传统工艺的精确之美\r
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
  background-color: #f7f5f2;\r
  border-radius: 12px;\r
  border: 1px solid #d8d3cb;\r
}\r
\r
/* ============================================\r
   折叠详情 - 如同展开的陶艺笔记\r
   ============================================ */\r
\r
#easymd details {\r
  margin: 1.1em 0;\r
  padding: 0.75em 1.05em;\r
  background-color: #f0ebe5;\r
  border: 1px solid #d8d3cb;\r
  border-left: 4px solid #a65d4c;\r
  border-radius: 0 12px 12px 0;\r
}\r
\r
#easymd summary {\r
  font-weight: 600;\r
  cursor: pointer;\r
  color: #7a4f42;\r
}\r
\r
#easymd summary::marker {\r
  color: #a65d4c;\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.65em;\r
  padding-bottom: 0.55em;\r
  border-bottom: 1px dashed #d8d3cb;\r
}\r
\r
/* ============================================\r
   嵌入媒体 - 与图片保持一致的有机风格\r
   ============================================ */\r
\r
#easymd iframe,\r
#easymd video {\r
  display: block;\r
  max-width: 100%;\r
  margin: 1.1em 0;\r
  border-radius: 16px;\r
  border: 1px solid #d8d3cb;\r
  box-shadow: 0 4px 18px rgba(166, 93, 76, 0.1);\r
}\r
\r
/* ============================================\r
   元信息与时间 - 陶艺师的笔记\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.875em;\r
  color: #9a918a;\r
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
