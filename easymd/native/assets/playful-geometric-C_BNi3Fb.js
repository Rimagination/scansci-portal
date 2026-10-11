var r=`/* ============================================\r
   Playful Geometric - 活泼几何风格\r
   Memphis 设计与现代波普艺术的融合\r
   结构网格 + 俏皮装饰 + 硬阴影 + 明亮纯色\r
   ============================================ */\r
\r
/* 配色定义（硬编码）\r
   背景色: #FFFDF5 (温暖奶油白 - 纸质感)\r
   前景色: #1E293B (石板色 800)\r
   主紫色: #8B5CF6 (Vivid Violet - 品牌主色)\r
   粉色: #F472B6 (Hot Pink - 俏皮活力)\r
   黄色: #FBBF24 (Amber/Yellow - 乐观积极)\r
   薄荷绿: #34D399 (Emerald/Mint - 清新感)\r
   边框色: #1E293B (深色边框 - 硬边界)\r
   柔和背景: #F1F5F9 (Slate 100)\r
   辅助灰: #64748B (Slate 500)\r
*/\r
\r
/* 容器 - 温暖纸质感背景配点阵装饰 */\r
#easymd {\r
  color: #1e293b;\r
  background-color: #fffdf5;\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\r
  font-size: 16px;\r
  line-height: 1.7;\r
  padding: 1.5em 1em;\r
  /* 几何点阵背景装饰 - Memphis 风格 */\r
  background-image: radial-gradient(circle, #e2e8f0 1.5px, transparent 1.5px);\r
  background-size: 24px 24px;\r
}\r
\r
/* ============================================\r
   标题 - 几何色块与硬阴影贴纸风格\r
   H1-H6 使用紫色系，逐级变淡；H4-H6 相同颜色\r
   ============================================ */\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  font-weight: 800;\r
  line-height: 1.25;\r
  margin-top: 1.2em;\r
  margin-bottom: 0.5em;\r
}\r
\r
/* H1 - 糖果色块标题，非对称圆角 */\r
#easymd h1 {\r
  font-size: 1.875em;\r
  padding: 0.4em 0.65em;\r
  background-color: #8b5cf6;\r
  color: #ffffff;\r
  border: 3px solid #1e293b;\r
  border-radius: 0 28px 0 28px;\r
  box-shadow: 6px 6px 0 #1e293b;\r
}\r
\r
/* H2 - 左侧彩色边框 + 粉色硬阴影 */\r
#easymd h2 {\r
  font-size: 1.5em;\r
  padding: 0.3em 0.6em;\r
  background-color: #fffdf5;\r
  color: #7c3aed;\r
  border: 3px solid #1e293b;\r
  border-left: 10px solid #8b5cf6;\r
  border-radius: 0 20px 20px 0;\r
  box-shadow: 5px 5px 0 #f472b6;\r
}\r
\r
/* H3 - 药丸形状黄色贴纸 */\r
#easymd h3 {\r
  font-size: 1.25em;\r
  padding: 0.25em 0.65em;\r
  color: #1e293b;\r
  background-color: #fbbf24;\r
  border: 2px solid #1e293b;\r
  border-radius: 9999px;\r
  display: inline-block;\r
  box-shadow: 4px 4px 0 #1e293b;\r
}\r
\r
/* H4-H6 使用相同颜色 */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #a78bfa;\r
}\r
\r
#easymd h4 {\r
  font-size: 1.125em;\r
  padding-left: 0.65em;\r
  border-left: 6px solid #a78bfa;\r
}\r
\r
#easymd h5,\r
#easymd h6 {\r
  font-size: 1em;\r
}\r
\r
/* 首个标题无顶部边距 */\r
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
   行内文本样式 - 活泼色彩与几何装饰\r
   ============================================ */\r
\r
/* 粗体 - 黄色高亮贴纸效果 */\r
#easymd strong,\r
#easymd b {\r
  font-weight: 700;\r
  color: #1e293b;\r
  background-color: #fbbf24;\r
  padding: 0.1em 0.3em;\r
  border-radius: 6px;\r
  box-shadow: 2px 2px 0 rgba(30, 41, 59, 0.2);\r
}\r
\r
/* 斜体 - 紫色强调 */\r
#easymd em,\r
#easymd i {\r
  font-style: italic;\r
  color: #8b5cf6;\r
  font-weight: 500;\r
}\r
\r
/* 删除线 - 粉色粗线条 */\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: #64748b;\r
  text-decoration: line-through;\r
  text-decoration-color: #f472b6;\r
  text-decoration-thickness: 3px;\r
}\r
\r
/* 标记 - 贴纸硬阴影风格 */\r
#easymd mark {\r
  background-color: #fbbf24;\r
  color: #1e293b;\r
  padding: 0.1em 0.4em;\r
  border: 2px solid #1e293b;\r
  border-radius: 10px;\r
  box-shadow: 3px 3px 0 #1e293b;\r
}\r
\r
#easymd small {\r
  font-size: 0.875em;\r
  color: #64748b;\r
}\r
\r
/* 上标下标 */\r
#easymd sup,\r
#easymd sub {\r
  font-size: 0.75em;\r
  line-height: 0;\r
}\r
\r
/* 上标 - 粉色药丸徽章 */\r
#easymd sup {\r
  vertical-align: super;\r
  color: #ffffff;\r
  font-weight: 700;\r
  background-color: #f472b6;\r
  padding: 0.15em 0.35em;\r
  border-radius: 9999px;\r
  border: 1px solid #1e293b;\r
}\r
\r
/* 下标 - 紫色强调 */\r
#easymd sub {\r
  vertical-align: sub;\r
  color: #8b5cf6;\r
  font-weight: 600;\r
}\r
\r
/* 插入文本 - 薄荷绿底部边框 */\r
#easymd ins {\r
  background-color: #34d399;\r
  text-decoration: none;\r
  padding: 0.1em 0.35em;\r
  border-radius: 8px;\r
  border-bottom: 2px solid #1e293b;\r
}\r
\r
/* 引用 */\r
#easymd q {\r
  quotes: '"' '"' '' ' ' '';\r
  color: #1e293b;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #f472b6;\r
  font-weight: 800;\r
  font-size: 1.25em;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #f472b6;\r
  font-weight: 800;\r
  font-size: 1.25em;\r
}\r
\r
/* 变量 - 紫色柔和背景 */\r
#easymd var {\r
  font-style: italic;\r
  font-weight: 600;\r
  color: #8b5cf6;\r
  background-color: rgba(139, 92, 246, 0.12);\r
  padding: 0.08em 0.25em;\r
  border-radius: 5px;\r
}\r
\r
/* 示例代码 - 几何边框 */\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #f1f5f9;\r
  color: #1e293b;\r
  padding: 0.15em 0.45em;\r
  border: 2px solid #1e293b;\r
  border-radius: 8px;\r
}\r
\r
/* 缩写 - 紫色点状下划线 */\r
#easymd abbr[title] {\r
  border-bottom: 2px dotted #8b5cf6;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 活泼几何风格\r
   ============================================ */\r
\r
#easymd a {\r
  color: #8b5cf6;\r
  text-decoration: none;\r
  font-weight: 500;\r
  background-color: rgba(139, 92, 246, 0.1);\r
  padding: 0.08em 0.25em;\r
  border-radius: 5px;\r
  border-bottom: 2px solid #8b5cf6;\r
}\r
\r
#easymd a:hover {\r
  color: #ffffff;\r
  background-color: #8b5cf6;\r
  border-bottom-color: #1e293b;\r
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
   列表 - 几何标记与活泼色彩\r
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
  margin-bottom: 0.4em;\r
}\r
\r
/* 列表标记 - 紫色粗体 */\r
#easymd li::marker {\r
  color: #8b5cf6;\r
  font-weight: 700;\r
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
  padding-left: 0.3em;\r
}\r
\r
#easymd input[type='checkbox'] {\r
  margin-top: 0.35em;\r
  width: 1.2em;\r
  height: 1.2em;\r
  accent-color: #8b5cf6;\r
  border: 2px solid #1e293b;\r
  border-radius: 5px;\r
}\r
\r
/* ============================================\r
   引用块 - 气泡贴纸风格\r
   ============================================ */\r
\r
#easymd blockquote {\r
  margin: 1em 0;\r
  padding: 0.8em 1.1em 0.8em 1.6em;\r
  background-color: #f472b6;\r
  color: #1e293b;\r
  border: 3px solid #1e293b;\r
  border-left: 10px solid #fbbf24;\r
  border-radius: 0 28px 28px 0;\r
  box-shadow: 6px 6px 0 #1e293b;\r
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
/* 嵌套引用 - 黄色变体 */\r
#easymd blockquote blockquote {\r
  margin-top: 0.8em;\r
  margin-bottom: 0;\r
  background-color: #fbbf24;\r
  border-left-color: #8b5cf6;\r
  border-radius: 0 20px 20px 0;\r
  box-shadow: 4px 4px 0 #1e293b;\r
}\r
\r
/* ============================================\r
   代码 - 几何贴纸风格\r
   ============================================ */\r
\r
/* 行内代码 - 黄色贴纸 */\r
#easymd code {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #fbbf24;\r
  color: #1e293b;\r
  padding: 0.15em 0.5em;\r
  border: 2px solid #1e293b;\r
  border-radius: 8px;\r
}\r
\r
/* 代码块容器 - 深色背景配紫色硬阴影 */\r
#easymd pre {\r
  margin: 1em 0;\r
  padding: 1.1em;\r
  background-color: #1e293b;\r
  border: 3px solid #1e293b;\r
  border-radius: 20px;\r
  box-shadow: 8px 8px 0 #8b5cf6;\r
  overflow-x: auto;\r
}\r
\r
/* 代码块内代码重置 */\r
#easymd pre code {\r
  background-color: transparent;\r
  color: #ffffff;\r
  padding: 0;\r
  border: none;\r
  border-radius: 0;\r
  font-size: 0.875em;\r
  line-height: 1.55;\r
}\r
\r
/* ============================================\r
   表格 - 网格几何风格\r
   ============================================ */\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 1em 0;\r
  border-collapse: collapse;\r
  font-size: 0.9375em;\r
  border: 3px solid #1e293b;\r
  border-radius: 16px;\r
  overflow: hidden;\r
  box-shadow: 6px 6px 0 #1e293b;\r
}\r
\r
/* 表头首行样式（替代 thead） */\r
#easymd tr:first-child th {\r
  background-color: #8b5cf6;\r
  color: #ffffff;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 0.55em 0.8em;\r
  border: 2px solid #1e293b;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: 700;\r
  background-color: #8b5cf6;\r
  color: #ffffff;\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background-color: rgba(139, 92, 246, 0.08);\r
}\r
\r
/* Frontmatter 表格 - 简洁无边框 */\r
#easymd .frontmatter-table {\r
  width: auto;\r
  margin-bottom: 1.5em;\r
  font-size: 0.875em;\r
  border: none;\r
  background-color: transparent;\r
  box-shadow: none;\r
  border-radius: 0;\r
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
  font-weight: 700;\r
  color: #8b5cf6;\r
  white-space: nowrap;\r
}\r
\r
#easymd .frontmatter-key::after {\r
  content: ':';\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #1e293b;\r
}\r
\r
/* ============================================\r
   分割线 - 彩虹几何装饰条\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.75em 0;\r
  border: none;\r
  height: 10px;\r
  background: repeating-linear-gradient(\r
    90deg,\r
    #8b5cf6 0px,\r
    #8b5cf6 24px,\r
    #f472b6 24px,\r
    #f472b6 48px,\r
    #fbbf24 48px,\r
    #fbbf24 72px,\r
    #34d399 72px,\r
    #34d399 96px\r
  );\r
  border-radius: 9999px;\r
}\r
\r
/* ============================================\r
   图片与媒体 - 贴纸框架风格\r
   ============================================ */\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  border: 4px solid #1e293b;\r
  border-radius: 20px;\r
  box-shadow: 8px 8px 0 #1e293b;\r
  margin: 1em 0;\r
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
/* 图片说明 - 药丸形状标签 */\r
#easymd figcaption {\r
  margin-top: 0.6em;\r
  font-size: 0.875em;\r
  color: #1e293b;\r
  font-weight: 600;\r
  padding: 0.35em 0.75em;\r
  background-color: #fbbf24;\r
  display: inline-block;\r
  border: 2px solid #1e293b;\r
  border-radius: 9999px;\r
  box-shadow: 3px 3px 0 #1e293b;\r
}\r
\r
/* ============================================\r
   脚注 - 几何分隔彩虹装饰\r
   ============================================ */\r
\r
#easymd .footnotes {\r
  margin-top: 2em;\r
  padding-top: 1.1em;\r
  border-top: 5px solid #fbbf24;\r
  font-size: 0.875em;\r
  color: #64748b;\r
  /* 彩虹条纹顶部装饰 */\r
  background-color: #fbbf24;\r
  background: linear-gradient(90deg, #fbbf24 0, #fbbf24 48px, #f472b6 48px, #f472b6 80px, transparent 80px);\r
  background-size: 100% 5px;\r
  background-repeat: no-repeat;\r
  background-position: top;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.5em;\r
}\r
\r
/* 脚注引用 - 药丸徽章 */\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #ffffff;\r
  font-weight: 700;\r
  background-color: #8b5cf6;\r
  padding: 0.15em 0.45em;\r
  border-radius: 9999px;\r
  border: 1px solid #1e293b;\r
}\r
\r
/* 脚注返回 - 黄色贴纸 */\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #1e293b;\r
  text-decoration: none;\r
  font-weight: 700;\r
  background-color: #fbbf24;\r
  padding: 0.12em 0.4em;\r
  border-radius: 6px;\r
  border: 1px solid #1e293b;\r
}\r
\r
/* ============================================\r
   定义列表 - 几何标签风格\r
   ============================================ */\r
\r
#easymd dl {\r
  margin: 1em 0;\r
}\r
\r
/* 定义术语 - 紫色贴纸标签 */\r
#easymd dt {\r
  font-weight: 700;\r
  color: #ffffff;\r
  margin-top: 0.6em;\r
  padding: 0.25em 0.55em;\r
  background-color: #8b5cf6;\r
  border: 2px solid #1e293b;\r
  border-radius: 10px;\r
  display: inline-block;\r
}\r
\r
#easymd dt:first-child {\r
  margin-top: 0;\r
}\r
\r
/* 定义描述 - 粉色左边框 */\r
#easymd dd {\r
  margin-left: 1.6em;\r
  margin-top: 0.3em;\r
  color: #1e293b;\r
  padding-left: 0.7em;\r
  border-left: 5px solid #f472b6;\r
}\r
\r
/* ============================================\r
   键盘按键 - 糖果按钮风格（硬阴影）\r
   ============================================ */\r
\r
#easymd kbd {\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\r
  font-size: 0.8125em;\r
  display: inline-block;\r
  padding: 0.25em 0.6em;\r
  background-color: #ffffff;\r
  border: 3px solid #1e293b;\r
  border-radius: 10px;\r
  box-shadow: 5px 5px 0 #1e293b;\r
  color: #1e293b;\r
  font-weight: 700;\r
}\r
\r
/* ============================================\r
   警告框 - 几何色块硬阴影风格\r
   ============================================ */\r
\r
#easymd .markdown-alert {\r
  margin: 1em 0;\r
  padding: 0.8em 1.1em;\r
  border: 3px solid #1e293b;\r
  border-radius: 0 20px 20px 20px;\r
  box-shadow: 5px 5px 0 #1e293b;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.45em;\r
  font-weight: 700;\r
  margin-bottom: 0.45em;\r
}\r
\r
/* Note - 紫色 */\r
#easymd .markdown-alert-note {\r
  background-color: rgba(139, 92, 246, 0.14);\r
  border-left: 8px solid #8b5cf6;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #7c3aed;\r
}\r
\r
/* Tip - 薄荷绿 */\r
#easymd .markdown-alert-tip {\r
  background-color: rgba(52, 211, 153, 0.16);\r
  border-left: 8px solid #34d399;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #059669;\r
}\r
\r
/* Important - 粉色 */\r
#easymd .markdown-alert-important {\r
  background-color: rgba(244, 114, 182, 0.14);\r
  border-left: 8px solid #f472b6;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #db2777;\r
}\r
\r
/* Warning - 黄色 */\r
#easymd .markdown-alert-warning {\r
  background-color: rgba(251, 191, 36, 0.22);\r
  border-left: 8px solid #fbbf24;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #d97706;\r
}\r
\r
/* Caution - 红色 */\r
#easymd .markdown-alert-caution {\r
  background-color: rgba(239, 68, 68, 0.12);\r
  border-left: 8px solid #ef4444;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #dc2626;\r
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
/* 公式块 - 白色卡片配紫色硬阴影 */\r
#easymd .math-display {\r
  margin: 1em 0;\r
  overflow-x: auto;\r
  text-align: center;\r
  padding: 0.85em;\r
  background-color: #ffffff;\r
  border: 3px solid #1e293b;\r
  border-radius: 16px;\r
  box-shadow: 5px 5px 0 #8b5cf6;\r
}\r
\r
/* ============================================\r
   折叠详情 - 可展开几何风格\r
   ============================================ */\r
\r
#easymd details {\r
  margin: 1em 0;\r
  padding: 0.6em 0.85em;\r
  background-color: #ffffff;\r
  border: 3px solid #1e293b;\r
  border-radius: 16px;\r
  box-shadow: 5px 5px 0 #1e293b;\r
}\r
\r
#easymd summary {\r
  font-weight: 700;\r
  cursor: pointer;\r
  color: #8b5cf6;\r
  padding: 0.3em 0;\r
}\r
\r
#easymd summary::marker {\r
  color: #f472b6;\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.55em;\r
  border-bottom: 3px solid #fbbf24;\r
  padding-bottom: 0.55em;\r
}\r
\r
/* ============================================\r
   嵌入媒体 - 贴纸框架\r
   ============================================ */\r
\r
#easymd iframe,\r
#easymd video {\r
  display: block;\r
  max-width: 100%;\r
  margin: 1em 0;\r
  border: 4px solid #1e293b;\r
  border-radius: 20px;\r
  box-shadow: 8px 8px 0 #1e293b;\r
}\r
\r
/* ============================================\r
   元信息与时间 - 薄荷绿药丸标签\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.875em;\r
  color: #1e293b;\r
  padding: 0.25em 0.6em;\r
  background-color: #34d399;\r
  border: 2px solid #1e293b;\r
  border-radius: 9999px;\r
  font-weight: 600;\r
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
