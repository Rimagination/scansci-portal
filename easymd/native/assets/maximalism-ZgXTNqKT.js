const r=`/* ============================================\r
   Maximalism - 极繁主义风格\r
   MORE IS MORE. 视觉过载的狂欢美学\r
   霓虹色彩 + 多层阴影 + 图案叠加 + 色彩碰撞\r
   ============================================ */\r
\r
/* 配色定义（硬编码）\r
   背景色: #0D0D1A (深宇宙紫黑 - 让一切色彩爆发)\r
   前景色: #FFFFFF (纯白 - 最高对比度)\r
   洋红色: #FF3AF2 (霓虹粉 - 电力能量)\r
   青绿色: #00F5D4 (电光青 - 数字光芒)\r
   黄色:   #FFE600 (尖叫黄 - 注意力抓取)\r
   橙色:   #FF6B35 (电光橙 - 温暖混沌)\r
   紫色:   #7B2FFF (鲜艳紫 - 神秘深度)\r
   柔紫色: #2D1B4E (暗紫容器 - 半透明背景)\r
*/\r
\r
/* 容器 - 深宇宙背景配多层图案叠加 */\r
#easymd {\r
  color: #ffffff;\r
  background-color: #0d0d1a;\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\r
  font-size: 16px;\r
  line-height: 1.75;\r
  padding: 1.5em 1em;\r
  /* 三层图案叠加：渐变光晕 + 渐变光晕 + 点阵 + 对角条纹 */\r
  background-image:\r
    radial-gradient(ellipse at 15% 25%, rgba(255, 58, 242, 0.12) 0%, transparent 45%),\r
    radial-gradient(ellipse at 85% 75%, rgba(0, 245, 212, 0.1) 0%, transparent 45%),\r
    radial-gradient(ellipse at 50% 50%, rgba(123, 47, 255, 0.08) 0%, transparent 50%),\r
    radial-gradient(circle, rgba(255, 58, 242, 0.04) 1.5px, transparent 1.5px),\r
    repeating-linear-gradient(\r
      45deg,\r
      transparent,\r
      transparent 12px,\r
      rgba(255, 230, 0, 0.025) 12px,\r
      rgba(255, 230, 0, 0.025) 24px\r
    );\r
  background-size:\r
    100% 100%,\r
    100% 100%,\r
    100% 100%,\r
    20px 20px,\r
    100% 100%;\r
}\r
\r
/* ============================================\r
   标题 - 多层阴影与霓虹发光\r
   H1-H6 使用洋红色系，逐级变淡；H4-H6 相同颜色\r
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
/* H1 - 最深洋红色，渐变背景+三层阴影堆叠 */\r
#easymd h1 {\r
  font-size: 1.875em;\r
  padding: 0.45em 0.65em;\r
  background: linear-gradient(135deg, #ff3af2 0%, #7b2fff 50%, #00f5d4 100%);\r
  color: #ffffff;\r
  border: 5px solid #ffe600;\r
  box-shadow:\r
    0 0 15px rgba(255, 58, 242, 0.35),\r
    5px 5px 0 #00f5d4,\r
    10px 10px 0 #ff3af2;\r
  text-shadow:\r
    1px 1px 0 #7b2fff,\r
    2px 2px 0 #ff3af2;\r
}\r
\r
/* H2 - 洋红色，霓虹边框+双层阴影 */\r
#easymd h2 {\r
  font-size: 1.5em;\r
  padding: 0.35em 0.55em;\r
  background: linear-gradient(135deg, rgba(45, 27, 78, 0.95) 0%, rgba(123, 47, 255, 0.3) 100%);\r
  color: #ff6bd6;\r
  border: 4px solid #ff3af2;\r
  border-left: 12px solid #00f5d4;\r
  box-shadow:\r
    0 0 10px rgba(255, 58, 242, 0.3),\r
    4px 4px 0 #ffe600,\r
    8px 8px 0 #ff6b35;\r
  text-shadow: 1px 1px 0 #7b2fff;\r
}\r
\r
/* H3 - 较淡洋红，左边框+发光 */\r
#easymd h3 {\r
  font-size: 1.25em;\r
  padding: 0.28em 0.55em;\r
  color: #ffa8f0;\r
  background: linear-gradient(90deg, rgba(255, 58, 242, 0.25) 0%, rgba(123, 47, 255, 0.1) 50%, transparent 100%);\r
  border-left: 10px solid #ff3af2;\r
  border-bottom: 4px dashed #00f5d4;\r
  box-shadow:\r
    0 0 8px rgba(255, 58, 242, 0.25),\r
    3px 3px 0 #ffe600;\r
  text-shadow: 1px 1px 0 #7b2fff;\r
}\r
\r
/* H4-H6 - 最淡的洋红色系，统一颜色 */\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #ffb8f0;\r
  text-shadow: 1px 1px 0 rgba(123, 47, 255, 0.5);\r
}\r
\r
#easymd h4 {\r
  font-size: 1.125em;\r
  padding: 0.2em 0.6em;\r
  border-left: 8px solid #ffb8f0;\r
  border-bottom: 3px dotted #7b2fff;\r
  background: linear-gradient(90deg, rgba(255, 58, 242, 0.15) 0%, rgba(123, 47, 255, 0.08) 50%, transparent 100%);\r
}\r
\r
#easymd h5 {\r
  font-size: 1em;\r
  padding-left: 0.55em;\r
  border-left: 6px dashed #ffb8f0;\r
}\r
\r
#easymd h6 {\r
  font-size: 1em;\r
  padding-left: 0.55em;\r
  border-left: 4px dotted #ffb8f0;\r
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
  color: rgba(255, 255, 255, 0.92);\r
}\r
\r
#easymd p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
/* ============================================\r
   行内文本样式 - 霓虹高亮与色彩碰撞\r
   ============================================ */\r
\r
/* 加粗 - 黄橙渐变+洋红边框（色彩碰撞） */\r
#easymd strong,\r
#easymd b {\r
  font-weight: 800;\r
  color: #0d0d1a;\r
  background: linear-gradient(135deg, #ffe600 0%, #ff6b35 100%);\r
  padding: 0.1em 0.35em;\r
  border: 3px solid #ff3af2;\r
  box-shadow:\r
    0 0 5px rgba(255, 230, 0, 0.3),\r
    2px 2px 0 #00f5d4;\r
}\r
\r
/* 斜体 - 青色发光 */\r
#easymd em,\r
#easymd i {\r
  font-style: italic;\r
  color: #00f5d4;\r
  text-shadow: 0 0 4px rgba(0, 245, 212, 0.35);\r
}\r
\r
/* 删除线 - 洋红粗线 */\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: rgba(255, 255, 255, 0.45);\r
  text-decoration: line-through;\r
  text-decoration-color: #ff3af2;\r
  text-decoration-thickness: 4px;\r
}\r
\r
/* 高亮 - 渐变背景+多层阴影 */\r
#easymd mark {\r
  background: linear-gradient(135deg, #ffe600 0%, #ff3af2 100%);\r
  color: #0d0d1a;\r
  padding: 0.15em 0.45em;\r
  border: 4px solid #0d0d1a;\r
  box-shadow:\r
    0 0 6px rgba(255, 230, 0, 0.35),\r
    2px 2px 0 #00f5d4,\r
    4px 4px 0 #7b2fff;\r
  font-weight: 800;\r
}\r
\r
#easymd small {\r
  font-size: 0.875em;\r
  color: rgba(255, 255, 255, 0.65);\r
}\r
\r
#easymd sup,\r
#easymd sub {\r
  font-size: 0.75em;\r
  line-height: 0;\r
  vertical-align: baseline;\r
}\r
\r
/* 上标 - 洋红徽章+发光 */\r
#easymd sup {\r
  vertical-align: super;\r
  color: #0d0d1a;\r
  font-weight: 800;\r
  background: linear-gradient(135deg, #ff3af2 0%, #7b2fff 100%);\r
  padding: 0.15em 0.4em;\r
  border: 2px solid #ffe600;\r
  box-shadow:\r
    0 0 5px rgba(255, 58, 242, 0.35),\r
    1px 1px 0 #00f5d4;\r
}\r
\r
/* 下标 - 青色 */\r
#easymd sub {\r
  vertical-align: sub;\r
  color: #00f5d4;\r
  font-weight: 700;\r
  text-shadow: 0 0 4px rgba(0, 245, 212, 0.3);\r
}\r
\r
/* 插入文本 - 青紫渐变 */\r
#easymd ins {\r
  background: linear-gradient(135deg, #00f5d4 0%, #7b2fff 100%);\r
  color: #ffffff;\r
  text-decoration: none;\r
  padding: 0.12em 0.4em;\r
  border: 3px solid #ffe600;\r
  box-shadow:\r
    0 0 5px rgba(0, 245, 212, 0.3),\r
    2px 2px 0 #ff3af2;\r
}\r
\r
#easymd q {\r
  quotes: '"' '"' '' ' ' '';\r
  color: #ffffff;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
  color: #ff3af2;\r
  font-weight: 900;\r
  font-size: 1.35em;\r
  text-shadow: 0 0 5px rgba(255, 58, 242, 0.4);\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
  color: #00f5d4;\r
  font-weight: 900;\r
  font-size: 1.35em;\r
  text-shadow: 0 0 5px rgba(0, 245, 212, 0.4);\r
}\r
\r
/* 变量 - 黄色底+虚线 */\r
#easymd var {\r
  font-style: italic;\r
  font-weight: 700;\r
  color: #ffe600;\r
  background-color: rgba(255, 230, 0, 0.18);\r
  padding: 0.1em 0.3em;\r
  border-bottom: 3px dashed #ffe600;\r
  text-shadow: 0 0 4px rgba(255, 230, 0, 0.25);\r
}\r
\r
/* 示例输出 - 紫色边框+发光 */\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background-color: rgba(45, 27, 78, 0.85);\r
  color: #00f5d4;\r
  padding: 0.18em 0.45em;\r
  border: 3px solid #7b2fff;\r
  box-shadow:\r
    0 0 5px rgba(123, 47, 255, 0.3),\r
    1px 1px 0 #ff3af2;\r
}\r
\r
/* 缩写 - 洋红点状下划线 */\r
#easymd abbr[title] {\r
  border-bottom: 4px dotted #ff3af2;\r
  cursor: help;\r
  text-decoration: none;\r
}\r
\r
/* ============================================\r
   链接 - 霓虹发光+色彩碰撞\r
   ============================================ */\r
\r
#easymd a {\r
  color: #00f5d4;\r
  text-decoration: none;\r
  font-weight: 600;\r
  padding: 0.08em 0.25em;\r
  border-bottom: 4px solid #ff3af2;\r
  background-color: rgba(0, 245, 212, 0.12);\r
  text-shadow: 0 0 5px rgba(0, 245, 212, 0.3);\r
}\r
\r
#easymd a:hover {\r
  color: #0d0d1a;\r
  background: linear-gradient(135deg, #00f5d4 0%, #ff3af2 100%);\r
  border-bottom-color: #ffe600;\r
  box-shadow:\r
    0 0 10px rgba(0, 245, 212, 0.4),\r
    0 0 20px rgba(255, 58, 242, 0.25);\r
  text-shadow: none;\r
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
  color: #ff3af2;\r
  font-weight: 600;\r
  text-shadow: 0 0 3px rgba(255, 58, 242, 0.3);\r
}\r
\r
#easymd rp {\r
  color: rgba(255, 255, 255, 0.45);\r
}\r
\r
/* ============================================\r
   列表 - 霓虹标记\r
   ============================================ */\r
\r
#easymd ul,\r
#easymd ol {\r
  margin-bottom: 1em;\r
  padding-left: 1.8em;\r
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
  margin-bottom: 0.45em;\r
  color: rgba(255, 255, 255, 0.92);\r
}\r
\r
#easymd li::marker {\r
  color: #ff3af2;\r
  font-weight: 900;\r
}\r
\r
#easymd li > ul,\r
#easymd li > ol {\r
  margin-top: 0.35em;\r
  margin-bottom: 0.35em;\r
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
  gap: 0.55em;\r
  padding-left: 0.35em;\r
}\r
\r
#easymd input[type='checkbox'] {\r
  margin-top: 0.38em;\r
  width: 1.3em;\r
  height: 1.3em;\r
  accent-color: #ff3af2;\r
  border: 4px solid #00f5d4;\r
  box-shadow: 0 0 5px rgba(255, 58, 242, 0.35);\r
}\r
\r
/* ============================================\r
   引用块 - 霓虹边框发光+多层阴影\r
   ============================================ */\r
\r
#easymd blockquote {\r
  margin: 1.25em 0;\r
  padding: 1em 1.3em;\r
  background: linear-gradient(135deg, rgba(45, 27, 78, 0.92) 0%, rgba(123, 47, 255, 0.25) 100%);\r
  color: #ffffff;\r
  border: 5px solid #ff3af2;\r
  border-left: 12px solid #00f5d4;\r
  box-shadow:\r
    0 0 12px rgba(255, 58, 242, 0.25),\r
    4px 4px 0 #ffe600,\r
    8px 8px 0 #ff6b35;\r
  /* 内部点阵装饰 */\r
  background-image:\r
    linear-gradient(135deg, rgba(45, 27, 78, 0.92) 0%, rgba(123, 47, 255, 0.25) 100%),\r
    radial-gradient(circle, rgba(255, 58, 242, 0.06) 1px, transparent 1px);\r
  background-size:\r
    100% 100%,\r
    16px 16px;\r
}\r
\r
#easymd blockquote p {\r
  margin-bottom: 0.65em;\r
  padding-left: 0;\r
}\r
\r
#easymd blockquote p:first-child::before {\r
  content: '"';\r
  font-size: 2.2em;\r
  font-weight: 900;\r
  color: #ff3af2;\r
  line-height: 1;\r
  text-shadow:\r
    1px 1px 0 #7b2fff,\r
    2px 2px 0 #00f5d4;\r
  margin-right: 0.2em;\r
  vertical-align: -0.2em;\r
}\r
\r
#easymd blockquote p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
/* 嵌套引用 - 色彩反转 */\r
#easymd blockquote blockquote {\r
  margin-top: 0.85em;\r
  margin-bottom: 0;\r
  background: linear-gradient(135deg, rgba(0, 245, 212, 0.18) 0%, rgba(255, 230, 0, 0.12) 100%);\r
  border-color: #ffe600;\r
  border-left-color: #ff3af2;\r
  box-shadow:\r
    0 0 8px rgba(255, 230, 0, 0.25),\r
    3px 3px 0 #7b2fff,\r
    6px 6px 0 #00f5d4;\r
}\r
\r
#easymd blockquote blockquote p:first-child::before {\r
  display: none;\r
}\r
\r
/* ============================================\r
   代码 - 霓虹终端风格\r
   ============================================ */\r
\r
/* 行内代码 - 紫粉渐变+青色边框（色彩碰撞） */\r
#easymd code {\r
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;\r
  font-size: 0.875em;\r
  background: linear-gradient(135deg, #7b2fff 0%, #ff3af2 100%);\r
  color: #ffffff;\r
  padding: 0.2em 0.55em;\r
  border: 3px solid #00f5d4;\r
  box-shadow:\r
    0 0 5px rgba(123, 47, 255, 0.35),\r
    1px 1px 0 #ffe600;\r
}\r
\r
/* 代码块 - 深色背景+三层阴影 */\r
#easymd pre {\r
  margin: 1.3em 0;\r
  padding: 1.3em;\r
  background: linear-gradient(180deg, #0d0d1a 0%, #1a0a2e 50%, #0d0d1a 100%);\r
  border: 5px solid #7b2fff;\r
  border-top: 8px solid #ff3af2;\r
  box-shadow:\r
    0 0 15px rgba(123, 47, 255, 0.3),\r
    5px 5px 0 #ff3af2,\r
    10px 10px 0 #00f5d4;\r
  overflow-x: auto;\r
  /* 内部条纹装饰 */\r
  background-image:\r
    linear-gradient(180deg, #0d0d1a 0%, #1a0a2e 50%, #0d0d1a 100%),\r
    repeating-linear-gradient(\r
      0deg,\r
      transparent,\r
      transparent 1px,\r
      rgba(123, 47, 255, 0.03) 1px,\r
      rgba(123, 47, 255, 0.03) 2px\r
    );\r
}\r
\r
#easymd pre code {\r
  background: transparent;\r
  color: #00f5d4;\r
  padding: 0;\r
  border: none;\r
  box-shadow: none;\r
  font-size: 0.875em;\r
  line-height: 1.65;\r
}\r
\r
/* ============================================\r
   表格 - 霓虹网格+多层阴影\r
   ============================================ */\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 1.3em 0;\r
  border-collapse: collapse;\r
  font-size: 0.9375em;\r
  border: 5px solid #ff3af2;\r
  box-shadow:\r
    0 0 12px rgba(255, 58, 242, 0.25),\r
    4px 4px 0 #00f5d4,\r
    8px 8px 0 #ffe600;\r
}\r
\r
/* 表头首行样式（替代 thead） */\r
#easymd tr:first-child th {\r
  background-color: #ff3af2;\r
  background: linear-gradient(135deg, #ff3af2 0%, #7b2fff 100%);\r
}\r
\r
#easymd th,\r
#easymd td {\r
  padding: 0.65em 0.9em;\r
  border: 3px solid #7b2fff;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  font-weight: 800;\r
  color: #ffffff;\r
  text-transform: uppercase;\r
  /* 简化 text-shadow，保留单层深色投影提升可读性 */\r
  text-shadow: 1px 1px 0 #0d0d1a;\r
}\r
\r
#easymd td {\r
  color: rgba(255, 255, 255, 0.92);\r
  background-color: rgba(45, 27, 78, 0.55);\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background-color: rgba(123, 47, 255, 0.15);\r
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
  padding: 0.35em 0.85em 0.35em 0;\r
  border: none;\r
  vertical-align: top;\r
  background-color: transparent;\r
}\r
\r
#easymd .frontmatter-key {\r
  font-weight: 800;\r
  color: #ff3af2;\r
  white-space: nowrap;\r
  text-transform: uppercase;\r
  text-shadow: 0 0 4px rgba(255, 58, 242, 0.3);\r
}\r
\r
#easymd .frontmatter-key::after {\r
  content: ':';\r
  color: #00f5d4;\r
}\r
\r
#easymd .frontmatter-value {\r
  color: rgba(255, 255, 255, 0.88);\r
}\r
\r
/* ============================================\r
   分割线 - 霓虹彩虹渐变\r
   ============================================ */\r
\r
#easymd hr {\r
  margin: 1.85em 0;\r
  border: none;\r
  height: 8px;\r
  background-color: #ff3af2;\r
  background: linear-gradient(90deg, #ff3af2, #ffe600, #00f5d4, #7b2fff, #ff6b35, #ff3af2);\r
  background-size: 200% 100%;\r
  box-shadow:\r
    0 0 10px rgba(255, 58, 242, 0.35),\r
    0 0 20px rgba(0, 245, 212, 0.2);\r
}\r
\r
/* ============================================\r
   图片与媒体 - 霓虹框架+多层阴影\r
   ============================================ */\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  border: 5px solid #ff3af2;\r
  box-shadow:\r
    0 0 12px rgba(255, 58, 242, 0.3),\r
    4px 4px 0 #00f5d4,\r
    8px 8px 0 #ffe600;\r
  margin: 1.1em 0;\r
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
  margin: 1.3em 0;\r
  text-align: center;\r
}\r
\r
#easymd figure img {\r
  margin: 0 auto;\r
}\r
\r
#easymd figcaption {\r
  margin-top: 0.65em;\r
  font-size: 0.875em;\r
  color: #0d0d1a;\r
  font-weight: 800;\r
  padding: 0.4em 0.8em;\r
  background: linear-gradient(135deg, #ffe600 0%, #ff6b35 100%);\r
  display: inline-block;\r
  border: 4px solid #0d0d1a;\r
  box-shadow:\r
    0 0 6px rgba(255, 230, 0, 0.35),\r
    2px 2px 0 #ff3af2,\r
    4px 4px 0 #00f5d4;\r
  text-transform: uppercase;\r
}\r
\r
/* ============================================\r
   脚注 - 霓虹分隔\r
   ============================================ */\r
\r
#easymd .footnotes {\r
  margin-top: 2.1em;\r
  padding-top: 1.3em;\r
  border-top: 8px double #7b2fff;\r
  font-size: 0.875em;\r
  color: rgba(255, 255, 255, 0.78);\r
  /* 顶部渐变装饰 */\r
  background: linear-gradient(180deg, rgba(123, 47, 255, 0.1) 0%, transparent 40px);\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 1.55em;\r
}\r
\r
#easymd .footnote-ref {\r
  font-size: 0.75em;\r
  vertical-align: super;\r
  color: #0d0d1a;\r
  font-weight: 800;\r
  background: linear-gradient(135deg, #ff3af2 0%, #7b2fff 100%);\r
  padding: 0.18em 0.5em;\r
  border: 3px solid #00f5d4;\r
  box-shadow:\r
    0 0 5px rgba(255, 58, 242, 0.35),\r
    1px 1px 0 #ffe600;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #0d0d1a;\r
  text-decoration: none;\r
  font-weight: 800;\r
  background: linear-gradient(135deg, #00f5d4 0%, #ffe600 100%);\r
  padding: 0.15em 0.45em;\r
  border: 3px solid #0d0d1a;\r
  box-shadow:\r
    0 0 5px rgba(0, 245, 212, 0.35),\r
    1px 1px 0 #ff3af2;\r
}\r
\r
/* ============================================\r
   定义列表\r
   ============================================ */\r
\r
#easymd dl {\r
  margin: 1.1em 0;\r
}\r
\r
#easymd dt {\r
  font-weight: 900;\r
  color: #0d0d1a;\r
  margin-top: 0.65em;\r
  padding: 0.28em 0.55em;\r
  background: linear-gradient(135deg, #ff3af2 0%, #ffe600 100%);\r
  border: 4px solid #0d0d1a;\r
  display: inline-block;\r
  box-shadow:\r
    0 0 6px rgba(255, 58, 242, 0.3),\r
    2px 2px 0 #00f5d4;\r
  text-transform: uppercase;\r
}\r
\r
#easymd dt:first-child {\r
  margin-top: 0;\r
}\r
\r
#easymd dd {\r
  margin-left: 1.6em;\r
  margin-top: 0.35em;\r
  color: rgba(255, 255, 255, 0.92);\r
  padding-left: 0.7em;\r
  border-left: 6px solid #7b2fff;\r
  background: linear-gradient(90deg, rgba(123, 47, 255, 0.12) 0%, transparent 100%);\r
}\r
\r
/* ============================================\r
   键盘按键 - 霓虹按钮风格\r
   ============================================ */\r
\r
#easymd kbd {\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\r
  font-size: 0.8125em;\r
  display: inline-block;\r
  padding: 0.28em 0.65em;\r
  background: linear-gradient(180deg, #2d1b4e 0%, #0d0d1a 100%);\r
  border: 4px solid #00f5d4;\r
  box-shadow:\r
    0 0 6px rgba(0, 245, 212, 0.3),\r
    3px 3px 0 #ff3af2;\r
  color: #00f5d4;\r
  font-weight: 700;\r
  text-transform: uppercase;\r
  text-shadow: 0 0 4px rgba(0, 245, 212, 0.3);\r
}\r
\r
/* ============================================\r
   警告框 - 霓虹色块风格+多层阴影\r
   ============================================ */\r
\r
#easymd .markdown-alert {\r
  margin: 1.3em 0;\r
  padding: 1.05em 1.3em;\r
  border: 5px solid #7b2fff;\r
  border-top: 8px solid #7b2fff;\r
  box-shadow:\r
    0 0 10px rgba(123, 47, 255, 0.25),\r
    3px 3px 0 #ff3af2;\r
  background-color: rgba(45, 27, 78, 0.85);\r
  /* 内部点阵装饰 */\r
  background-image: radial-gradient(circle, rgba(123, 47, 255, 0.05) 1px, transparent 1px);\r
  background-size: 14px 14px;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.5em;\r
  font-weight: 900;\r
  margin-bottom: 0.55em;\r
  text-transform: uppercase;\r
}\r
\r
/* Alert 图标增强可见性 */\r
#easymd .markdown-alert-title svg {\r
  color: #ffffff;\r
  filter: drop-shadow(0 0 3px currentColor);\r
}\r
\r
/* Note - 青绿 */\r
#easymd .markdown-alert-note {\r
  border-color: #00f5d4;\r
  border-top: 8px solid #00f5d4;\r
  box-shadow:\r
    0 0 10px rgba(0, 245, 212, 0.25),\r
    3px 3px 0 #7b2fff;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #4fffea;\r
  text-shadow: 0 0 8px rgba(0, 245, 212, 0.5);\r
}\r
\r
/* Tip - 黄色 */\r
#easymd .markdown-alert-tip {\r
  border-color: #ffe600;\r
  border-top: 8px solid #ffe600;\r
  box-shadow:\r
    0 0 10px rgba(255, 230, 0, 0.25),\r
    3px 3px 0 #00f5d4;\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #fff04d;\r
  text-shadow: 0 0 8px rgba(255, 230, 0, 0.5);\r
}\r
\r
/* Important - 紫色 */\r
#easymd .markdown-alert-important {\r
  border-color: #7b2fff;\r
  border-top: 8px solid #c792ea;\r
  box-shadow:\r
    0 0 10px rgba(123, 47, 255, 0.3),\r
    3px 3px 0 #ff3af2;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #d4a8f0;\r
  text-shadow: 0 0 8px rgba(199, 146, 234, 0.5);\r
}\r
\r
/* Warning - 橙色 */\r
#easymd .markdown-alert-warning {\r
  border-color: #ff6b35;\r
  border-top: 8px solid #ff6b35;\r
  box-shadow:\r
    0 0 10px rgba(255, 107, 53, 0.3),\r
    3px 3px 0 #ffe600;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #ff9066;\r
  text-shadow: 0 0 8px rgba(255, 107, 53, 0.5);\r
}\r
\r
/* Caution - 洋红 */\r
#easymd .markdown-alert-caution {\r
  border-color: #ff3af2;\r
  border-top: 8px solid #ff3af2;\r
  box-shadow:\r
    0 0 10px rgba(255, 58, 242, 0.3),\r
    3px 3px 0 #ff6b35;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #ff6bf5;\r
  text-shadow: 0 0 8px rgba(255, 58, 242, 0.5);\r
}\r
\r
/* ============================================\r
   数学公式\r
   ============================================ */\r
\r
#easymd .math-inline {\r
  font-size: 1em;\r
  padding: 0 0.28em;\r
  color: #00f5d4;\r
  text-shadow: 0 0 4px rgba(0, 245, 212, 0.25);\r
}\r
\r
#easymd .math-display {\r
  margin: 1.3em 0;\r
  overflow-x: auto;\r
  text-align: center;\r
  padding: 1.1em;\r
  background: linear-gradient(135deg, rgba(45, 27, 78, 0.92) 0%, rgba(13, 13, 26, 0.96) 100%);\r
  border: 5px solid #7b2fff;\r
  box-shadow:\r
    0 0 12px rgba(123, 47, 255, 0.25),\r
    4px 4px 0 #ff3af2,\r
    8px 8px 0 #00f5d4;\r
  color: #ffffff;\r
}\r
\r
/* ============================================\r
   折叠详情 - 霓虹可展开\r
   ============================================ */\r
\r
#easymd details {\r
  margin: 1.3em 0;\r
  padding: 0.7em 1.1em;\r
  background: linear-gradient(135deg, rgba(45, 27, 78, 0.85) 0%, rgba(13, 13, 26, 0.92) 100%);\r
  border: 5px solid #00f5d4;\r
  box-shadow:\r
    0 0 10px rgba(0, 245, 212, 0.25),\r
    3px 3px 0 #ff3af2;\r
}\r
\r
#easymd summary {\r
  font-weight: 900;\r
  cursor: pointer;\r
  color: #00f5d4;\r
  padding: 0.35em 0;\r
  text-transform: uppercase;\r
  text-shadow: 0 0 6px rgba(0, 245, 212, 0.3);\r
}\r
\r
#easymd summary::marker {\r
  color: #ff3af2;\r
}\r
\r
#easymd details[open] summary {\r
  margin-bottom: 0.65em;\r
  border-bottom: 5px solid #ff3af2;\r
  padding-bottom: 0.55em;\r
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
  margin: 1.3em 0;\r
  border: 5px solid #ff3af2;\r
  box-shadow:\r
    0 0 12px rgba(255, 58, 242, 0.3),\r
    4px 4px 0 #00f5d4,\r
    8px 8px 0 #ffe600;\r
}\r
\r
/* ============================================\r
   元信息与时间\r
   ============================================ */\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 0.875em;\r
  color: #0d0d1a;\r
  padding: 0.28em 0.65em;\r
  background: linear-gradient(135deg, #00f5d4 0%, #7b2fff 100%);\r
  border: 4px solid #0d0d1a;\r
  font-weight: 700;\r
  text-transform: uppercase;\r
  box-shadow:\r
    0 0 5px rgba(0, 245, 212, 0.3),\r
    2px 2px 0 #ff3af2;\r
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
