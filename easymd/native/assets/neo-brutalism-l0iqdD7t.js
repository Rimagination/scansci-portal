const r=`/* ============================================\r
   Neo-Brutalism - 新粗野主义风格\r
   RAW. LOUD. UNAPOLOGETIC.\r
   厚重黑色边框 + 硬阴影 + 高饱和色块\r
   DIY/朋克/印刷文化的反设计美学\r
   ============================================ */\r
\r
/* 配色定义（硬编码）\r
   背景色: #FFFDF5 (奶油白 - 模拟旧报纸/牛皮纸)\r
   主黑色: #000000 (纯黑 - 结构色)\r
   强调红: #FF4757 (热辣红 - 主强调色)\r
   强调黄: #FECA57 (荧光黄 - 高亮/标记)\r
   强调青: #00D2D3 (电光青 - 链接/交互)\r
   强调紫: #A29BFE (柔和紫 - 辅助背景)\r
   灰白色: #F1F2F6 (浅灰 - 交替行)\r
   白色: #FFFFFF (纯白 - 容器)\r
*/\r
\r
/* 容器 - 奶油白纸张背景 */\r
#easymd {\r
  color: #000000;\r
  background-color: #fffdf5;\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\r
  font-size: 16px;\r
  line-height: 1.7;\r
  padding: 1.5em 1em;\r
  /* 添加纸张纹理感 */\r
  background-image: repeating-linear-gradient(\r
    0deg,\r
    transparent,\r
    transparent 1px,\r
    rgba(0, 0, 0, 0.008) 1px,\r
    rgba(0, 0, 0, 0.008) 2px\r
  );\r
}\r
\r
/* ============================================\r
   标题 - 厚重边框与硬阴影\r
   H1-H6 使用黑色系，逐级变淡；H4-H6 相同色值\r
   ============================================ */\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  font-weight: 900;\r
  line-height: 1.15;\r
  margin-top: 1.25em;\r
  margin-bottom: 0.5em;\r
}\r
\r
/* H1 - 最醒目：黄色背景+厚边框+大硬阴影 */\r
#easymd h1 {\r
  font-size: 1.875em;\r
  padding: 0.4em 0.6em;\r
  background-color: #feca57;\r
  color: #000000;\r
  border: 5px solid #000000;\r
  box-shadow: 8px 8px 0 #000000;\r
  text-transform: uppercase;\r
}\r
\r
/* H2 - 白色背景+红色左边框+硬阴影 */\r
#easymd h2 {\r
  font-size: 1.5em;\r
  padding: 0.35em 0.6em;\r
  background-color: #ffffff;\r
  color: #000000;\r
  border: 4px solid #000000;\r
  border-left: 10px solid #ff4757;\r
  box-shadow: 6px 6px 0 #000000;\r
}\r
\r
/* H3 - 青色背景条 */\r
#easymd h3 {\r
  font-size: 1.25em;\r
  padding: 0.25em 0.5em;\r
  color: #000000;\r
  background-color: #00d2d3;\r
  border: 4px solid #000000;\r
  box-shadow: 4px 4px 0 #000000;\r
  display: inline-block;\r
}\r
\r
/* H4-H6 - 相同的深灰色 */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #1a1a1a;\r
}\r
\r
#easymd h4 {\r
  font-size: 1.125em;\r
  padding-left: 0.6em;\r
  border-left: 6px solid #000000;\r
  background-color: rgba(254, 202, 87, 0.2);\r
}\r
\r
#easymd h5 {\r
  font-size: 1em;\r
  text-transform: uppercase;\r
  padding-bottom: 0.2em;\r
  border-bottom: 3px solid #000000;\r
  display: inline-block;\r
}\r
\r
#easymd h6 {\r
  font-size: 1em;\r
  text-transform: uppercase;\r
  padding-left: 0.5em;\r
  border-left: 4px dashed #000000;\r
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
/* 加粗 - 黄色高亮块 */\r
#easymd strong,\r
#easymd b {\r
  font-weight: 900;\r
  color: #000000;\r
  background-color: #feca57;\r
  padding: 0.08em 0.25em;\r
  border: 2px solid #000000;\r
}\r
\r
/* 斜体 - 红色下划线 */\r
#easymd em,\r
#easymd i {\r
  font-style: italic;\r
  color: #000000;\r
  border-bottom: 3px solid #ff4757;\r
}\r
\r
/* 删除线 - 粗红色删除 */\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: #666666;\r
  text-decoration: line-through;\r
  text-decoration-color: #ff4757;\r
  text-decoration-thickness: 4px;\r
}\r
\r
/* 高亮 - 黄色标记+边框+阴影 */\r
#easymd mark {\r
  background-color: #feca57;\r
  color: #000000;\r
  padding: 0.12em 0.35em;\r
  border: 3px solid #000000;\r
  box-shadow: 3px 3px 0 #000000;\r
  font-weight: 700;\r
}\r
\r
#easymd small {\r
  font-size: 0.875em;\r
  color: #333333;\r
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
  font-weight: 800;\r
  background-color: #ff4757;\r
  padding: 0.12em 0.3em;\r
  border: 2px solid #000000;\r
}\r
\r
#easymd sub {\r
  vertical-align: sub;\r
  color: #000000;\r
  font-weight: 700;\r
}\r
\r
/* 插入 - 青色底纹 */\r
#easymd ins {\r
  background-color: #00d2d3;\r
  text-decoration: none;\r
  padding: 0.1em 0.3em;\r
  border-bottom: 4px solid #000000;\r
  color: #000000;\r
}\r
\r
#easymd q {\r
  quotes: '"' '"' '' ' ' '';\r
  color: #000000;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #ff4757;\r
  font-weight: 900;\r
  font-size: 1.25em;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #ff4757;\r
  font-weight: 900;\r
  font-size: 1.25em;\r
}\r
\r
/* 变量 - 紫色背景 */\r
#easymd var {\r
  font-style: italic;\r
  font-weight: 700;\r
  color: #000000;\r
  background-color: #a29bfe;\r
  padding: 0.08em 0.25em;\r
  border: 2px solid #000000;\r
}\r
\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #ffffff;\r
  color: #000000;\r
  padding: 0.18em 0.4em;\r
  border: 3px solid #000000;\r
  box-shadow: 2px 2px 0 #000000;\r
}\r
\r
#easymd abbr[title] {\r
  border-bottom: 4px dotted #000000;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 青色底纹+粗下划线\r
   ============================================ */\r
\r
#easymd a {\r
  color: #000000;\r
  text-decoration: none;\r
  background-color: #00d2d3;\r
  padding: 0.08em 0.2em;\r
  border-bottom: 4px solid #000000;\r
  font-weight: 600;\r
}\r
\r
#easymd a:hover {\r
  color: #000000;\r
  background-color: #feca57;\r
  box-shadow: 3px 3px 0 #000000;\r
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
  color: #333333;\r
  font-weight: 700;\r
}\r
\r
#easymd rp {\r
  color: #666666;\r
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
  margin-bottom: 0.4em;\r
}\r
\r
#easymd li::marker {\r
  color: #ff4757;\r
  font-weight: 900;\r
}\r
\r
#easymd li > ul,\r
#easymd li > ol {\r
  margin-top: 0.3em;\r
  margin-bottom: 0.3em;\r
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
  margin-top: 0.4em;\r
  width: 1.3em;\r
  height: 1.3em;\r
  accent-color: #ff4757;\r
  border: 4px solid #000000;\r
}\r
\r
/* ============================================\r
   引用块 - 紫色色块+硬阴影\r
   ============================================ */\r
\r
#easymd blockquote {\r
  margin: 1.25em 0;\r
  padding: 0.85em 1.1em;\r
  background-color: #a29bfe;\r
  color: #000000;\r
  border: 5px solid #000000;\r
  border-left: 12px solid #ff4757;\r
  box-shadow: 8px 8px 0 #000000;\r
}\r
\r
#easymd blockquote p {\r
  margin-bottom: 0.6em;\r
}\r
\r
#easymd blockquote p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
#easymd blockquote blockquote {\r
  margin-top: 0.85em;\r
  margin-bottom: 0;\r
  background-color: #feca57;\r
  border-left: 10px solid #00d2d3;\r
  box-shadow: 5px 5px 0 #000000;\r
}\r
\r
/* ============================================\r
   代码 - 厚边框与硬阴影\r
   ============================================ */\r
\r
/* 行内代码 - 黄色背景 */\r
#easymd code {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #feca57;\r
  color: #000000;\r
  padding: 0.18em 0.45em;\r
  border: 3px solid #000000;\r
  font-weight: 600;\r
}\r
\r
/* 代码块 - 黑色背景+红色阴影 */\r
#easymd pre {\r
  margin: 1.25em 0;\r
  padding: 1.1em;\r
  background-color: #000000;\r
  border: 5px solid #000000;\r
  box-shadow: 10px 10px 0 #ff4757;\r
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
   表格 - 网格与硬边框\r
   ============================================ */\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 1.25em 0;\r
  border-collapse: collapse;\r
  font-size: 0.9375em;\r
  border: 5px solid #000000;\r
  box-shadow: 8px 8px 0 #000000;\r
}\r
\r
/* 表头首行样式（替代 thead） */\r
#easymd tr:first-child th {\r
  background-color: #feca57;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 0.55em 0.8em;\r
  border: 3px solid #000000;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: 900;\r
  background-color: #feca57;\r
  color: #000000;\r
  text-transform: uppercase;\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background-color: #f1f2f6;\r
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
  padding: 0.3em 0.8em 0.3em 0;\r
  border: none;\r
  vertical-align: top;\r
  background-color: transparent;\r
}\r
\r
#easymd .frontmatter-key {\r
  font-weight: 900;\r
  color: #000000;\r
  white-space: nowrap;\r
  background-color: #feca57;\r
  padding: 0.12em 0.35em;\r
  border: 3px solid #000000;\r
  text-transform: uppercase;\r
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
   分割线 - 粗犷几何\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.75em 0;\r
  border: none;\r
  height: 8px;\r
  background-color: #000000;\r
  box-shadow: 5px 5px 0 #ff4757;\r
}\r
\r
/* ============================================\r
   图片与媒体 - 厚边框框架\r
   ============================================ */\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  border: 5px solid #000000;\r
  box-shadow: 8px 8px 0 #000000;\r
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
#easymd figcaption {\r
  margin-top: 0.6em;\r
  font-size: 0.875em;\r
  color: #000000;\r
  font-weight: 800;\r
  padding: 0.3em 0.6em;\r
  background-color: #feca57;\r
  display: inline-block;\r
  border: 4px solid #000000;\r
  box-shadow: 4px 4px 0 #000000;\r
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
  border-top: 5px solid #000000;\r
  font-size: 0.875em;\r
  color: #333333;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.5em;\r
}\r
\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #ffffff;\r
  font-weight: 900;\r
  background-color: #ff4757;\r
  padding: 0.15em 0.45em;\r
  border: 2px solid #000000;\r
  box-shadow: 1px 1px 0 #000000;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #000000;\r
  text-decoration: none;\r
  font-weight: 900;\r
  background-color: #00d2d3;\r
  padding: 0.12em 0.35em;\r
  border: 2px solid #000000;\r
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
  font-weight: 900;\r
  color: #000000;\r
  margin-top: 0.6em;\r
  padding: 0.25em 0.5em;\r
  background-color: #feca57;\r
  border: 4px solid #000000;\r
  box-shadow: 3px 3px 0 #000000;\r
  display: inline-block;\r
  text-transform: uppercase;\r
}\r
\r
#easymd dt:first-child {\r
  margin-top: 0;\r
}\r
\r
#easymd dd {\r
  margin-left: 1.5em;\r
  margin-top: 0.3em;\r
  color: #000000;\r
  padding-left: 0.6em;\r
  border-left: 5px solid #ff4757;\r
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
  padding: 0.25em 0.55em;\r
  background-color: #ffffff;\r
  border: 4px solid #000000;\r
  box-shadow: 5px 5px 0 #000000;\r
  color: #000000;\r
  font-weight: 800;\r
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
  border: 5px solid #000000;\r
  box-shadow: 6px 6px 0 #000000;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.45em;\r
  font-weight: 900;\r
  margin-bottom: 0.5em;\r
  text-transform: uppercase;\r
}\r
\r
/* Note - 青绿 */\r
#easymd .markdown-alert-note {\r
  background-color: #00d2d3;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #000000;\r
}\r
\r
/* Tip - 黄色 */\r
#easymd .markdown-alert-tip {\r
  background-color: #feca57;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #000000;\r
}\r
\r
/* Important - 紫色 */\r
#easymd .markdown-alert-important {\r
  background-color: #a29bfe;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #000000;\r
}\r
\r
/* Warning - 橙黄 */\r
#easymd .markdown-alert-warning {\r
  background-color: #fdcb6e;\r
  border-left: 12px solid #e17055;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #000000;\r
}\r
\r
/* Caution - 红色 */\r
#easymd .markdown-alert-caution {\r
  background-color: #ff4757;\r
  color: #ffffff;\r
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
#easymd .math-display {\r
  margin: 1.25em 0;\r
  overflow-x: auto;\r
  text-align: center;\r
  padding: 0.85em;\r
  background-color: #ffffff;\r
  border: 5px solid #000000;\r
  box-shadow: 8px 8px 0 #000000;\r
}\r
\r
/* ============================================\r
   折叠详情 - 可展开硬边框\r
   ============================================ */\r
\r
#easymd details {\r
  margin: 1.25em 0;\r
  padding: 0.6em 0.9em;\r
  background-color: #ffffff;\r
  border: 5px solid #000000;\r
  box-shadow: 6px 6px 0 #000000;\r
}\r
\r
#easymd summary {\r
  font-weight: 900;\r
  cursor: pointer;\r
  color: #000000;\r
  padding: 0.3em 0;\r
  text-transform: uppercase;\r
}\r
\r
#easymd summary::marker {\r
  color: #ff4757;\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.6em;\r
  border-bottom: 4px solid #feca57;\r
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
  border: 5px solid #000000;\r
  box-shadow: 8px 8px 0 #000000;\r
}\r
\r
/* ============================================\r
   元信息与时间\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.875em;\r
  color: #000000;\r
  padding: 0.25em 0.55em;\r
  background-color: #00d2d3;\r
  border: 3px solid #000000;\r
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
