const r=`/* ============================================\r
   Sketch - Hand-Drawn Imperfection Style\r
   手绘风格 | 铅笔草图美学\r
\r
   设计哲学：\r
   拒绝数字化的精确与冷漠，拥抱有机的不规则性\r
   像是在纸上的涂鸦、便利贴墙上的草图、\r
   餐巾纸上的灵感笔记\r
\r
   核心原则：\r
   - 没有直线：每个边框都使用不规则的 border-radius\r
   - 真实纹理：点阵背景模拟笔记本纸张\r
   - 硬偏移阴影：无模糊，创造剪贴纸拼贴效果\r
   - 手写感：接近涂鸦和马克笔的视觉效果\r
   - 刻意的"杂乱"：不对称、重叠，看起来是草稿状态\r
\r
   配色系统：\r
   - 温暖纸张 #fdfbf7（背景）\r
   - 铅笔黑 #2d2d2d（主文字，非纯黑更有机）\r
   - 旧纸张 #e5e0d8（辅助背景/擦除痕迹）\r
   - 红色马克笔 #ff4d4d（主强调色）\r
   - 蓝色圆珠笔 #2d5da1（次强调色/链接）\r
   - 便签黄 #fff9c4（高亮/引用）\r
   - 木纹边 #c9c3b8（柔和边框）\r
   ============================================ */\r
\r
/* 容器 - 笔记本纸张纹理 */\r
#easymd {\r
  color: #2d2d2d;\r
  background-color: #fdfbf7;\r
  /* 点阵纹理模拟笔记本方格纸 */\r
  background-image: radial-gradient(#e5e0d8 1px, transparent 1px);\r
  background-size: 20px 20px;\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\r
  font-size: 16px;\r
  line-height: 1.7;\r
  padding: 1.5em 1em;\r
}\r
\r
/* ============================================\r
   标题 - 马克笔/铅笔风格\r
   H1-H6 使用红色系，逐级变淡；H4-H6 相同颜色\r
   ============================================ */\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  font-weight: 700;\r
  line-height: 1.3;\r
  margin-top: 1.25em;\r
  margin-bottom: 0.55em;\r
}\r
\r
/* H1 - 粗马克笔风格，虚线下划线 */\r
#easymd h1 {\r
  font-size: 1.875em;\r
  color: #c93030;\r
  padding-bottom: 0.4em;\r
  /* 虚线边框模拟手绘下划线 */\r
  border-bottom: 4px dashed #c93030;\r
}\r
\r
/* H2 - 左侧马克笔边条 + 浅背景 */\r
#easymd h2 {\r
  font-size: 1.5em;\r
  color: #d94545;\r
  padding: 0.3em 0.6em;\r
  border-left: 5px solid #d94545;\r
  background-color: rgba(255, 77, 77, 0.06);\r
  /* 不规则圆角：右侧看起来像手绘 */\r
  border-radius: 0 12px 8px 0;\r
}\r
\r
/* H3 - 内联标签风格 */\r
#easymd h3 {\r
  font-size: 1.25em;\r
  color: #ff4d4d;\r
  display: inline-block;\r
  padding: 0.15em 0.5em;\r
  background-color: rgba(255, 77, 77, 0.08);\r
  border: 2px solid #ff4d4d;\r
  /* 不规则手绘边框 */\r
  border-radius: 4px 12px 6px 10px;\r
}\r
\r
/* H4-H6 - 相同的柔和红色 */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #ff6b6b;\r
}\r
\r
#easymd h4 {\r
  font-size: 1.125em;\r
  padding-left: 0.5em;\r
  border-left: 3px dashed #ff6b6b;\r
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
   行内文本样式 - 手绘标记效果\r
   ============================================ */\r
\r
/* 加粗 - 红色马克笔高亮底纹 */\r
#easymd strong,\r
#easymd b {\r
  font-weight: 700;\r
  color: #c93030;\r
  /* 底部高亮效果，像用荧光笔划过 */\r
  background: linear-gradient(180deg, transparent 55%, rgba(255, 77, 77, 0.18) 55%);\r
}\r
\r
/* 斜体 - 蓝色圆珠笔 */\r
#easymd em,\r
#easymd i {\r
  font-style: italic;\r
  color: #2d5da1;\r
}\r
\r
/* 删除线 - 波浪线删除效果 */\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: #888888;\r
  text-decoration: line-through;\r
  text-decoration-style: wavy;\r
  text-decoration-color: #ff4d4d;\r
  text-decoration-thickness: 2px;\r
}\r
\r
/* 高亮 - 便签黄底色 + 手绘阴影 */\r
#easymd mark {\r
  background-color: #fff9c4;\r
  color: #2d2d2d;\r
  padding: 0.12em 0.35em;\r
  border: 1px solid #e5d98a;\r
  /* 不规则圆角 */\r
  border-radius: 3px 8px 5px 10px;\r
  box-shadow: 2px 2px 0 rgba(45, 45, 45, 0.1);\r
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
/* 上标 - 红色小标签 */\r
#easymd sup {\r
  vertical-align: super;\r
  color: #ff4d4d;\r
  font-weight: 600;\r
}\r
\r
/* 下标 - 蓝色 */\r
#easymd sub {\r
  vertical-align: sub;\r
  color: #2d5da1;\r
}\r
\r
/* 插入文本 - 蓝色下划线 */\r
#easymd ins {\r
  background-color: rgba(45, 93, 161, 0.1);\r
  text-decoration: none;\r
  padding: 0.1em 0.25em;\r
  border-bottom: 2px solid #2d5da1;\r
  border-radius: 2px;\r
}\r
\r
/* 引用 */\r
#easymd q {\r
  quotes: '"' '"' '' ' ' '';\r
  color: #2d2d2d;\r
  font-style: italic;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #ff4d4d;\r
  font-weight: 700;\r
  font-size: 1.15em;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #ff4d4d;\r
  font-weight: 700;\r
  font-size: 1.15em;\r
}\r
\r
/* 变量 - 蓝色斜体 */\r
#easymd var {\r
  font-style: italic;\r
  font-weight: 600;\r
  color: #2d5da1;\r
}\r
\r
/* 示例/等宽文本 - 虚线边框 */\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #f8f6f2;\r
  color: #2d2d2d;\r
  padding: 0.15em 0.4em;\r
  border: 1px dashed #2d2d2d;\r
  border-radius: 3px 6px 4px 8px;\r
}\r
\r
/* 缩写 - 虚线下划线 */\r
#easymd abbr[title] {\r
  border-bottom: 2px dotted #ff4d4d;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 手绘虚线下划线\r
   ============================================ */\r
\r
#easymd a {\r
  color: #2d5da1;\r
  text-decoration: none;\r
  /* 虚线下划线模拟手绘 */\r
  background-image: linear-gradient(90deg, #2d5da1 60%, transparent 60%);\r
  background-size: 5px 2px;\r
  background-position: 0 100%;\r
  background-repeat: repeat-x;\r
  padding-bottom: 2px;\r
}\r
\r
#easymd a:hover {\r
  color: #ff4d4d;\r
  background-image: linear-gradient(90deg, #ff4d4d 60%, transparent 60%);\r
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
   列表 - 手绘标记\r
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
/* 列表标记 - 红色马克笔 */\r
#easymd li::marker {\r
  color: #ff4d4d;\r
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
  padding-left: 0.25em;\r
}\r
\r
#easymd input[type='checkbox'] {\r
  margin-top: 0.35em;\r
  width: 1.15em;\r
  height: 1.15em;\r
  accent-color: #ff4d4d;\r
  border: 2px solid #2d2d2d;\r
  border-radius: 3px;\r
}\r
\r
/* ============================================\r
   引用块 - 便签纸风格\r
   ============================================ */\r
\r
#easymd blockquote {\r
  margin: 1.15em 0;\r
  padding: 0.85em 1.1em;\r
  background-color: #fff9c4;\r
  color: #2d2d2d;\r
  /* 厚边框 + 红色左边 */\r
  border: 2px solid #2d2d2d;\r
  border-left: 5px solid #ff4d4d;\r
  /* 不规则手绘圆角 */\r
  border-radius: 4px 16px 12px 6px;\r
  /* 硬偏移阴影 - 剪贴画效果 */\r
  box-shadow: 4px 4px 0 rgba(45, 45, 45, 0.12);\r
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
/* 嵌套引用 - 柔和变体 */\r
#easymd blockquote blockquote {\r
  margin-top: 0.65em;\r
  margin-bottom: 0;\r
  background-color: #fdfbf7;\r
  border-color: #c9c3b8;\r
  border-left-color: #2d5da1;\r
  box-shadow: 3px 3px 0 rgba(45, 45, 45, 0.08);\r
  border-radius: 3px 12px 8px 5px;\r
}\r
\r
/* ============================================\r
   代码 - 打字机/手写笔记风格\r
   ============================================ */\r
\r
/* 行内代码 - 轻微边框 */\r
#easymd code {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: #f8f6f2;\r
  color: #c93030;\r
  padding: 0.15em 0.45em;\r
  border: 1px solid #2d2d2d;\r
  /* 不规则手绘圆角 */\r
  border-radius: 3px 7px 4px 9px;\r
  box-shadow: 1px 1px 0 rgba(45, 45, 45, 0.15);\r
}\r
\r
/* 代码块 - 纸张背景 + 蓝色左边框 */\r
#easymd pre {\r
  margin: 1.15em 0;\r
  padding: 1.1em;\r
  background-color: #fdfbf7;\r
  border: 2px solid #2d2d2d;\r
  border-left: 5px solid #2d5da1;\r
  /* 不规则圆角 */\r
  border-radius: 6px 12px 8px 10px;\r
  box-shadow: 4px 4px 0 rgba(45, 45, 45, 0.12);\r
  overflow-x: auto;\r
}\r
\r
/* 代码块内的代码重置 */\r
#easymd pre code {\r
  background-color: transparent;\r
  color: inherit;\r
  padding: 0;\r
  border: none;\r
  border-radius: 0;\r
  box-shadow: none;\r
  font-size: 0.875em;\r
  line-height: 1.55;\r
}\r
\r
/* ============================================\r
   表格 - 笔记本网格风格\r
   ============================================ */\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 1.15em 0;\r
  border-collapse: separate;\r
  border-spacing: 0;\r
  font-size: 0.9375em;\r
  border: 2px solid #2d2d2d;\r
  /* 不规则圆角 */\r
  border-radius: 6px 14px 10px 8px;\r
  box-shadow: 4px 4px 0 rgba(45, 45, 45, 0.1);\r
  overflow: hidden;\r
}\r
\r
/* 表头首行样式（替代 thead） */\r
#easymd tr:first-child th {\r
  background-color: #fff9c4;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 0.55em 0.8em;\r
  /* 虚线边框模拟手绘格子 */\r
  border: 1px dashed #2d2d2d;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: 700;\r
  color: #2d2d2d;\r
  border-bottom: 2px solid #2d2d2d;\r
  border-top: none;\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background-color: rgba(229, 224, 216, 0.25);\r
}\r
\r
/* Frontmatter 元数据表格 */\r
#easymd .frontmatter-table {\r
  width: auto;\r
  margin-bottom: 1.5em;\r
  font-size: 0.875em;\r
  border: none;\r
  box-shadow: none;\r
  background-color: transparent;\r
  border-radius: 0;\r
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
  color: #2d5da1;\r
  white-space: nowrap;\r
}\r
\r
#easymd .frontmatter-key::after {\r
  content: ':';\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #2d2d2d;\r
}\r
\r
/* ============================================\r
   分割线 - 虚线铅笔线\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.5em 0;\r
  border: none;\r
  height: 3px;\r
  /* 虚线模拟手绘分割线 */\r
  background-color: #2d2d2d;\r
  background: repeating-linear-gradient(90deg, #2d2d2d 0px, #2d2d2d 10px, transparent 10px, transparent 16px);\r
}\r
\r
/* ============================================\r
   图片与媒体 - 拍立得/剪贴风格\r
   ============================================ */\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  border: 3px solid #2d2d2d;\r
  /* 不规则手绘边框 */\r
  border-radius: 5px 10px 7px 12px;\r
  box-shadow: 4px 4px 0 rgba(45, 45, 45, 0.12);\r
  margin: 1.15em 0;\r
}\r
\r
#easymd picture {\r
  display: block;\r
  margin: 1.15em 0;\r
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
/* 图片说明 - 手写便签风格 */\r
#easymd figcaption {\r
  margin-top: 0.55em;\r
  font-size: 0.875em;\r
  color: #666666;\r
  font-style: italic;\r
}\r
\r
/* ============================================\r
   脚注 - 页边注释风格\r
   ============================================ */\r
\r
#easymd .footnotes {\r
  margin-top: 1.75em;\r
  padding-top: 1em;\r
  /* 虚线上边框 */\r
  border-top: 2px dashed #2d2d2d;\r
  font-size: 0.875em;\r
  color: #666666;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.5em;\r
}\r
\r
/* 脚注引用 - 便签黄标签 */\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #c93030;\r
  font-weight: 700;\r
  background-color: #fff9c4;\r
  padding: 0.08em 0.35em;\r
  border: 1px solid #e5d98a;\r
  border-radius: 3px;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #2d5da1;\r
  text-decoration: none;\r
  font-weight: 700;\r
}\r
\r
/* ============================================\r
   定义列表 - 草稿笔记风格\r
   ============================================ */\r
\r
#easymd dl {\r
  margin: 1.1em 0;\r
}\r
\r
#easymd dt {\r
  font-weight: 700;\r
  color: #c93030;\r
  margin-top: 0.6em;\r
  padding-left: 0.5em;\r
  border-left: 3px solid #ff4d4d;\r
}\r
\r
#easymd dt:first-child {\r
  margin-top: 0;\r
}\r
\r
#easymd dd {\r
  margin-left: 1.5em;\r
  margin-top: 0.25em;\r
  color: #2d2d2d;\r
  padding-left: 0.5em;\r
  border-left: 2px dashed #e5e0d8;\r
}\r
\r
/* ============================================\r
   键盘按键 - 物理按键风格\r
   ============================================ */\r
\r
#easymd kbd {\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\r
  font-size: 0.8125em;\r
  display: inline-block;\r
  padding: 0.18em 0.5em;\r
  background-color: #fdfbf7;\r
  border: 2px solid #2d2d2d;\r
  /* 不规则圆角 */\r
  border-radius: 4px 7px 5px 8px;\r
  /* 硬阴影创造立体按钮效果 */\r
  box-shadow: 2px 2px 0 #2d2d2d;\r
  color: #2d2d2d;\r
  font-weight: 600;\r
}\r
\r
/* ============================================\r
   警告框 - 手绘标注框\r
   ============================================ */\r
\r
#easymd .markdown-alert {\r
  margin: 1.15em 0;\r
  padding: 0.8em 1.05em;\r
  border: 2px solid;\r
  /* 不规则手绘圆角 */\r
  border-radius: 5px 14px 8px 12px;\r
  box-shadow: 3px 3px 0 rgba(45, 45, 45, 0.08);\r
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
/* Note - 蓝色圆珠笔 */\r
#easymd .markdown-alert-note {\r
  background-color: rgba(45, 93, 161, 0.06);\r
  border-color: #2d5da1;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #2d5da1;\r
}\r
\r
/* Tip - 绿色马克笔 */\r
#easymd .markdown-alert-tip {\r
  background-color: rgba(76, 175, 80, 0.06);\r
  border-color: #4caf50;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #3d8b40;\r
}\r
\r
/* Important - 紫色荧光笔 */\r
#easymd .markdown-alert-important {\r
  background-color: rgba(156, 39, 176, 0.06);\r
  border-color: #9c27b0;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #7b1fa2;\r
}\r
\r
/* Warning - 橙色警告 */\r
#easymd .markdown-alert-warning {\r
  background-color: rgba(255, 152, 0, 0.08);\r
  border-color: #ff9800;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #e68900;\r
}\r
\r
/* Caution - 红色马克笔 */\r
#easymd .markdown-alert-caution {\r
  background-color: rgba(255, 77, 77, 0.06);\r
  border-color: #ff4d4d;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #c93030;\r
}\r
\r
/* ============================================\r
   数学公式\r
   ============================================ */\r
\r
#easymd .math-inline {\r
  font-size: 1em;\r
  padding: 0 0.2em;\r
}\r
\r
#easymd .math-display {\r
  margin: 1.15em 0;\r
  overflow-x: auto;\r
  text-align: center;\r
  padding: 0.75em;\r
  background-color: rgba(229, 224, 216, 0.25);\r
  border-radius: 5px 10px 7px 12px;\r
}\r
\r
/* ============================================\r
   折叠详情 - 可展开笔记\r
   ============================================ */\r
\r
#easymd details {\r
  margin: 1.15em 0;\r
  padding: 0.6em 0.85em;\r
  background-color: #f8f6f2;\r
  border: 2px solid #2d2d2d;\r
  /* 不规则圆角 */\r
  border-radius: 6px 12px 8px 10px;\r
  box-shadow: 3px 3px 0 rgba(45, 45, 45, 0.1);\r
}\r
\r
#easymd summary {\r
  font-weight: 700;\r
  cursor: pointer;\r
  color: #2d5da1;\r
  padding: 0.25em 0;\r
}\r
\r
#easymd summary::marker {\r
  color: #ff4d4d;\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.55em;\r
  padding-bottom: 0.5em;\r
  border-bottom: 1px dashed #e5e0d8;\r
}\r
\r
/* ============================================\r
   嵌入媒体 - 剪贴框架\r
   ============================================ */\r
\r
#easymd iframe,\r
#easymd video {\r
  display: block;\r
  max-width: 100%;\r
  margin: 1.15em 0;\r
  border: 3px solid #2d2d2d;\r
  border-radius: 5px 10px 7px 12px;\r
  box-shadow: 4px 4px 0 rgba(45, 45, 45, 0.12);\r
}\r
\r
/* ============================================\r
   元信息与时间 - 手写标注\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.875em;\r
  color: #666666;\r
  font-style: italic;\r
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
