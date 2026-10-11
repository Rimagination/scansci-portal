const r=`/**\r
 * GreenSimple Theme - Clean and simple green accent style\r
 */\r
\r
#easymd {\r
  padding: 1em;\r
  font-family:\r
    PingFang SC,\r
    system-ui,\r
    -apple-system,\r
    BlinkMacSystemFont,\r
    'Helvetica Neue',\r
    'Hiragino Sans GB',\r
    'Microsoft YaHei UI',\r
    'Microsoft YaHei',\r
    Arial,\r
    sans-serif;\r
  font-size: 16px;\r
  line-height: 1.75;\r
  word-wrap: break-word;\r
  color: #2c2c2c;\r
}\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #2bae85;\r
  font-weight: 700;\r
  line-height: 1.4em;\r
  word-break: break-all;\r
  font-family:\r
    PingFang SC,\r
    system-ui,\r
    -apple-system,\r
    BlinkMacSystemFont,\r
    'Helvetica Neue',\r
    'Hiragino Sans GB',\r
    'Microsoft YaHei UI',\r
    'Microsoft YaHei',\r
    Arial,\r
    sans-serif;\r
}\r
\r
#easymd h1 {\r
  font-size: 32px;\r
  margin-top: 0;\r
  margin-bottom: 24px;\r
}\r
\r
#easymd h2 {\r
  font-size: 24px;\r
  margin-top: 36px;\r
  margin-bottom: 24px;\r
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
#easymd h3 {\r
  font-size: 20px;\r
  margin-top: 28px;\r
  margin-bottom: 20px;\r
}\r
\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  font-size: 18px;\r
  margin-top: 24px;\r
  margin-bottom: 16px;\r
  color: #25936c;\r
}\r
\r
#easymd p {\r
  margin: 5px 0 20px;\r
  line-height: 1.75em;\r
  text-align: start;\r
  font-size: 16px;\r
  font-weight: 400;\r
  color: #2c2c2c;\r
  word-break: break-all;\r
}\r
\r
#easymd p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
#easymd strong,\r
#easymd b {\r
  font-weight: 700;\r
  color: #2bae85;\r
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
  text-decoration: line-through;\r
  color: #999;\r
}\r
\r
#easymd mark {\r
  background: #fff3cd;\r
  padding: 2px 4px;\r
  border-radius: 2px;\r
}\r
\r
#easymd small {\r
  font-size: 0.875em;\r
  color: #666;\r
}\r
\r
#easymd sup {\r
  vertical-align: super;\r
  font-size: 0.75em;\r
  line-height: 0;\r
}\r
\r
#easymd sub {\r
  vertical-align: sub;\r
  font-size: 0.75em;\r
  line-height: 0;\r
}\r
\r
#easymd ins {\r
  text-decoration: underline;\r
  background: #d4edda;\r
  padding: 2px 4px;\r
}\r
\r
#easymd q {\r
  quotes: '「' '」' '『' '』';\r
  font-style: italic;\r
  color: #666;\r
}\r
\r
#easymd q::before {\r
  content: open-quote;\r
}\r
\r
#easymd q::after {\r
  content: close-quote;\r
}\r
\r
#easymd var {\r
  font-family: 'SF Mono', Consolas, Monaco, 'Courier New', monospace;\r
  background: rgba(0, 0, 0, 0.05);\r
  padding: 2px 4px;\r
  border-radius: 2px;\r
  font-size: 0.9em;\r
}\r
\r
#easymd samp,\r
#easymd tt {\r
  font-family: 'SF Mono', Consolas, Monaco, 'Courier New', monospace;\r
  background: rgba(0, 0, 0, 0.05);\r
  padding: 2px 4px;\r
  border-radius: 2px;\r
  font-size: 0.9em;\r
}\r
\r
#easymd abbr[title] {\r
  text-decoration: underline dotted;\r
  cursor: help;\r
}\r
\r
#easymd a {\r
  color: #2bae85;\r
  text-decoration: none;\r
  border-bottom: 1px solid #2bae85;\r
}\r
\r
#easymd a:hover {\r
  border-bottom-color: #23956b;\r
}\r
\r
#easymd ruby,\r
#easymd rt,\r
#easymd rp {\r
  line-height: 1.4;\r
}\r
\r
#easymd ul,\r
#easymd ol {\r
  margin: 8px 0;\r
  padding-left: 20px;\r
  list-style-type: disc;\r
  color: #2bae85;\r
}\r
\r
#easymd ol {\r
  list-style-type: decimal;\r
}\r
\r
#easymd li {\r
  margin: 0;\r
  line-height: 1.6;\r
  padding-left: 0;\r
  font-family:\r
    PingFang SC,\r
    system-ui,\r
    -apple-system,\r
    BlinkMacSystemFont,\r
    'Helvetica Neue',\r
    'Hiragino Sans GB',\r
    'Microsoft YaHei UI',\r
    'Microsoft YaHei',\r
    Arial,\r
    sans-serif;\r
}\r
\r
#easymd li > p {\r
  margin: 6px 0;\r
}\r
\r
#easymd li > ul,\r
#easymd li > ol {\r
  margin: 4px 0;\r
}\r
\r
#easymd ul ul,\r
#easymd ul ul ul {\r
  color: #25936c;\r
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
  gap: 8px;\r
  margin: 6px 0;\r
}\r
\r
#easymd input[type='checkbox'] {\r
  margin-top: 4px;\r
  cursor: pointer;\r
}\r
\r
#easymd blockquote {\r
  margin: 20px 0;\r
  padding: 16px 20px;\r
  border-left: 4px solid #2bae85;\r
  background: rgba(43, 174, 133, 0.05);\r
  border-radius: 0 4px 4px 0;\r
}\r
\r
#easymd blockquote p {\r
  margin: 8px 0;\r
  color: #666;\r
}\r
\r
#easymd blockquote p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
#easymd blockquote blockquote {\r
  margin-top: 12px;\r
  border-left-color: #25936c;\r
  background: rgba(37, 147, 108, 0.05);\r
}\r
\r
#easymd code {\r
  font-family: 'SF Mono', Consolas, Monaco, 'Courier New', monospace;\r
  font-size: 14px;\r
  padding: 2px 4px;\r
  background-color: rgba(0, 0, 0, 0.05);\r
  border-radius: 2px;\r
  color: #2c2c2c;\r
}\r
\r
#easymd pre {\r
  margin: 20px 0;\r
  padding: 0;\r
  background: #f6faf8;\r
  border: 1px solid #d4e5de;\r
  border-left: 3px solid #2bae85;\r
  border-radius: 4px;\r
  overflow: hidden;\r
}\r
\r
#easymd pre code {\r
  display: block;\r
  padding: 16px 20px;\r
  background: transparent;\r
  color: #2c2c2c;\r
  font-family: 'SF Mono', Consolas, Monaco, 'Courier New', monospace;\r
  font-size: 14px;\r
  line-height: 1.6;\r
  border: none;\r
  border-radius: 0;\r
  overflow-x: auto;\r
}\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 16px 0;\r
  border-collapse: collapse;\r
  font-size: 15px;\r
}\r
\r
/* 表头首行样式（替代 thead） */\r
#easymd tr:first-child th {\r
  background: #f8f9fa;\r
  border-bottom: 2px solid #2bae85;\r
}\r
\r
#easymd th {\r
  padding: 12px;\r
  text-align: left;\r
  font-weight: 700;\r
  color: #2c2c2c;\r
  border-bottom: 1px solid #e0e0e0;\r
}\r
\r
#easymd td {\r
  padding: 12px;\r
  border-bottom: 1px solid #e0e0e0;\r
  color: #2c2c2c;\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background: #f8f9fa;\r
}\r
\r
#easymd tbody tr:hover {\r
  background: rgba(43, 174, 133, 0.05);\r
}\r
\r
#easymd .frontmatter-table {\r
  margin: 16px 0;\r
  border: 1px solid #e0e0e0;\r
  border-radius: 4px;\r
  overflow: hidden;\r
}\r
\r
#easymd .frontmatter-table td {\r
  padding: 10px 16px;\r
  border: none;\r
  border-bottom: 1px solid #e0e0e0;\r
}\r
\r
#easymd .frontmatter-table tr:last-child td {\r
  border-bottom: none;\r
}\r
\r
#easymd .frontmatter-key {\r
  font-weight: 700;\r
  color: #2bae85;\r
  background: rgba(43, 174, 133, 0.05);\r
  width: 140px;\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #2c2c2c;\r
}\r
\r
#easymd hr {\r
  border: none;\r
  height: 2px;\r
  background-color: #2bae85;\r
  background: linear-gradient(to right, transparent, #2bae85, transparent);\r
  margin: 32px 0;\r
}\r
\r
#easymd img {\r
  max-width: 100%;\r
  height: auto;\r
  display: block;\r
  border-radius: 4px;\r
  margin: 20px 0;\r
}\r
\r
#easymd picture {\r
  display: block;\r
  max-width: 100%;\r
}\r
\r
#easymd picture img {\r
  display: block;\r
  width: 100%;\r
  height: auto;\r
}\r
\r
#easymd figure {\r
  margin: 20px 0;\r
}\r
\r
#easymd figure img {\r
  display: block;\r
  width: 100%;\r
  height: auto;\r
  border-radius: 4px;\r
}\r
\r
#easymd figcaption {\r
  text-align: center;\r
  margin-top: 8px;\r
  font-size: 14px;\r
  color: #666;\r
  font-style: italic;\r
}\r
\r
#easymd .footnotes {\r
  margin-top: 32px;\r
  padding-top: 16px;\r
  border-top: 1px solid #e0e0e0;\r
}\r
\r
#easymd .footnotes ol {\r
  list-style: decimal;\r
  padding-left: 24px;\r
  color: #2c2c2c;\r
}\r
\r
#easymd .footnote-ref {\r
  color: #2bae85;\r
  text-decoration: none;\r
  border-bottom: 1px dotted #2bae85;\r
  cursor: pointer;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #2bae85;\r
  text-decoration: none;\r
  font-size: 0.875em;\r
}\r
\r
#easymd dl {\r
  margin: 16px 0;\r
}\r
\r
#easymd dt {\r
  font-weight: 700;\r
  color: #2bae85;\r
  margin: 8px 0 4px;\r
}\r
\r
#easymd dd {\r
  margin: 4px 0 16px 20px;\r
  color: #2c2c2c;\r
  line-height: 1.6;\r
}\r
\r
#easymd kbd {\r
  display: inline-block;\r
  padding: 2px 6px;\r
  font-family: 'SF Mono', Consolas, Monaco, 'Courier New', monospace;\r
  font-size: 12px;\r
  line-height: 1.4;\r
  color: #2c2c2c;\r
  background: #f8f9fa;\r
  border: 1px solid #e0e0e0;\r
  border-radius: 3px;\r
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);\r
}\r
\r
#easymd .markdown-alert {\r
  margin: 16px 0;\r
  padding: 16px;\r
  border-left: 4px solid;\r
  border-radius: 4px;\r
  background: #f8f9fa;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 8px;\r
  font-weight: 700;\r
  margin-bottom: 8px;\r
  font-size: 16px;\r
}\r
\r
#easymd .markdown-alert p {\r
  margin: 8px 0;\r
  font-size: 14px;\r
}\r
\r
#easymd .markdown-alert-note {\r
  border-left-color: #2bae85;\r
  background: rgba(43, 174, 133, 0.05);\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title {\r
  color: #2bae85;\r
}\r
\r
#easymd .markdown-alert-tip {\r
  border-left-color: #35cd4b;\r
  background: rgba(53, 205, 75, 0.05);\r
}\r
\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #35cd4b;\r
}\r
\r
#easymd .markdown-alert-important {\r
  border-left-color: #fdbc40;\r
  background: rgba(253, 188, 64, 0.05);\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #fdbc40;\r
}\r
\r
#easymd .markdown-alert-warning {\r
  border-left-color: #fc625d;\r
  background: rgba(252, 98, 93, 0.05);\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #fc625d;\r
}\r
\r
#easymd .markdown-alert-caution {\r
  border-left-color: #e57373;\r
  background: rgba(229, 115, 115, 0.05);\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #e57373;\r
}\r
\r
#easymd .math-inline {\r
  font-family: 'SF Mono', Consolas, Monaco, 'Courier New', monospace;\r
  background: rgba(0, 0, 0, 0.03);\r
  padding: 2px 6px;\r
  border-radius: 3px;\r
  font-size: 0.9em;\r
}\r
\r
#easymd .math-display {\r
  display: block;\r
  margin: 16px 0;\r
  padding: 16px;\r
  background: #f8f9fa;\r
  border-radius: 4px;\r
  overflow-x: auto;\r
  font-size: 1em;\r
}\r
\r
#easymd details {\r
  margin: 16px 0;\r
  border: 1px solid #e0e0e0;\r
  border-radius: 4px;\r
  background: #f8f9fa;\r
}\r
\r
#easymd summary {\r
  padding: 12px 16px;\r
  cursor: pointer;\r
  font-weight: 700;\r
  color: #2bae85;\r
  user-select: none;\r
}\r
\r
#easymd summary:hover {\r
  background: rgba(43, 174, 133, 0.05);\r
}\r
\r
#easymd details[open] summary {\r
  border-bottom: 1px solid #e0e0e0;\r
}\r
\r
#easymd details > div {\r
  padding: 16px;\r
}\r
\r
#easymd iframe,\r
#easymd video {\r
  display: block;\r
  max-width: 100%;\r
  border-radius: 4px;\r
  margin: 16px 0;\r
}\r
\r
#easymd .meta {\r
  font-size: 12px;\r
  color: #999;\r
  margin: 8px 0;\r
  text-align: center;\r
}\r
\r
#easymd time {\r
  color: #999;\r
  font-size: 12px;\r
}\r
\r
#easymd.indent-first-line p {\r
  text-indent: 2em;\r
}\r
\r
#easymd.indent-first-line p:first-of-type {\r
  text-indent: 0;\r
}\r
`;export{r as default};
