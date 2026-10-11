var r=`/**\r
 * Qing - a restrained WeChat article style.\r
 *\r
 * The visual direction follows the referenced article: white space, near-black\r
 * body copy, and a small teal rule for section headings.\r
 */\r
\r
#easymd {\r
  padding: 0 10px;\r
  color: #242424;\r
  background-color: #ffffff;\r
  font-family:\r
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial,\r
    sans-serif;\r
  font-size: 16px;\r
  line-height: 1.75;\r
  text-align: left;\r
  word-wrap: break-word;\r
}\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #18181b;\r
  font-family: inherit;\r
  font-weight: 700;\r
  line-height: 1.5;\r
  word-break: break-word;\r
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
#easymd h1 {\r
  display: block;\r
  margin: 0 0 24px;\r
  padding: 0;\r
  border: none;\r
  border-radius: 0;\r
  background: #ffffff;\r
  background-image: none;\r
  box-shadow: none;\r
  font-size: 28px;\r
  text-align: center;\r
}\r
\r
#easymd h1.svg-heading {\r
  margin: 24px 0 18px;\r
  padding: 0;\r
  text-align: left;\r
}\r
\r
#easymd > h1.svg-heading:first-child {\r
  margin-top: 0;\r
}\r
\r
#easymd h2 {\r
  margin: 36px 0 18px;\r
  padding: 2px 0 2px 12px;\r
  border: none;\r
  border-left: 4px solid #0f766e;\r
  background: transparent;\r
  font-size: 18px;\r
  font-weight: 700;\r
  text-align: left;\r
}\r
\r
#easymd h3 {\r
  display: block;\r
  margin: 28px 0 12px;\r
  padding: 0;\r
  border: none;\r
  background: transparent;\r
  color: #374151;\r
  font-size: 17px;\r
  text-align: left;\r
}\r
\r
#easymd h3::before {\r
  display: none;\r
  content: none;\r
}\r
\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  margin: 24px 0 12px;\r
  padding-left: 10px;\r
  border: none;\r
  border-left: 2px solid #cbd5e1;\r
  color: #374151;\r
  text-align: left;\r
}\r
\r
#easymd h4 {\r
  font-size: 16px;\r
}\r
\r
#easymd h5 {\r
  font-size: 15px;\r
}\r
\r
#easymd h6 {\r
  font-size: 14px;\r
}\r
\r
#easymd p {\r
  margin: 18px 0;\r
  padding: 0;\r
  color: #242424;\r
  font-size: 16px;\r
  line-height: 1.75;\r
  text-align: left;\r
  word-break: break-word;\r
}\r
\r
#easymd p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
#easymd strong,\r
#easymd b {\r
  color: #18181b;\r
  font-weight: 700;\r
}\r
\r
#easymd em,\r
#easymd i {\r
  color: #374151;\r
}\r
\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: #6b7280;\r
}\r
\r
#easymd mark {\r
  padding: 1px 4px;\r
  background: #fef3c7;\r
  color: #242424;\r
}\r
\r
#easymd small {\r
  font-size: 14px;\r
  color: #6b7280;\r
}\r
\r
#easymd sup,\r
#easymd sub {\r
  font-size: 0.75em;\r
  line-height: 0;\r
}\r
\r
#easymd ins {\r
  padding: 1px 4px;\r
  background: #e6f4f1;\r
  text-decoration: underline;\r
}\r
\r
#easymd q {\r
  color: #4b5563;\r
  font-style: italic;\r
}\r
\r
#easymd var,\r
#easymd samp,\r
#easymd tt {\r
  padding: 2px 4px;\r
  border-radius: 4px;\r
  background: #f3f4f6;\r
  font-family: Consolas, Monaco, Menlo, monospace;\r
  font-size: 14px;\r
  color: #115e59;\r
}\r
\r
#easymd abbr[title] {\r
  border-bottom: 1px dotted #0f766e;\r
  text-decoration: none;\r
  cursor: help;\r
}\r
\r
#easymd a {\r
  border-bottom: 1px solid rgba(15, 118, 110, 0.45);\r
  color: #0f766e;\r
  font-weight: 600;\r
  text-decoration: none;\r
}\r
\r
#easymd a:hover {\r
  border-bottom-color: #115e59;\r
  color: #115e59;\r
}\r
\r
#easymd ul,\r
#easymd ol {\r
  margin: 16px 0;\r
  padding-left: 26px;\r
  color: #242424;\r
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
  margin: 0;\r
  padding-left: 0;\r
  line-height: 1.75;\r
  color: #242424;\r
}\r
\r
#easymd li::marker {\r
  color: #0f766e;\r
}\r
\r
#easymd li > ul,\r
#easymd li > ol {\r
  margin: 8px 0;\r
}\r
\r
#easymd ul.contains-task-list {\r
  padding-left: 0;\r
  list-style: none;\r
}\r
\r
#easymd li.task-list-item {\r
  display: flex;\r
  align-items: flex-start;\r
  gap: 8px;\r
}\r
\r
#easymd input[type='checkbox'] {\r
  margin-top: 6px;\r
}\r
\r
#easymd blockquote {\r
  margin: 20px 0;\r
  padding: 12px 16px;\r
  border-left: 4px solid #0f766e;\r
  border-radius: 0 6px 6px 0;\r
  background: #f4f8f7;\r
  box-shadow: none;\r
}\r
\r
#easymd blockquote p {\r
  margin: 8px 0;\r
  padding: 0;\r
  color: #4b5563;\r
  text-align: left;\r
}\r
\r
#easymd blockquote blockquote {\r
  margin-top: 12px;\r
  border-left-color: #115e59;\r
  background: #e8f3f1;\r
}\r
\r
#easymd code {\r
  margin: 0 2px;\r
  padding: 2px 4px;\r
  border-radius: 4px;\r
  background: #f3f4f6;\r
  font-family: Consolas, Monaco, Menlo, monospace;\r
  font-size: 14px;\r
  line-height: 1.75;\r
  color: #115e59;\r
  word-break: break-all;\r
}\r
\r
#easymd pre {\r
  margin: 20px 0;\r
  padding: 0;\r
  border: 1px solid #e5e7eb;\r
  border-radius: 6px;\r
  background: #f7f7f7;\r
  box-shadow: none;\r
  overflow-x: auto;\r
  text-align: left;\r
}\r
\r
#easymd pre::before {\r
  display: none;\r
  content: none;\r
  background-image: none;\r
}\r
\r
#easymd pre code {\r
  display: block;\r
  margin: 0;\r
  padding: 14px 16px;\r
  border: none;\r
  border-radius: 0;\r
  background: transparent;\r
  font-family: Consolas, Monaco, Menlo, monospace;\r
  font-size: 13px;\r
  line-height: 1.7;\r
  color: #374151;\r
  overflow-x: auto;\r
  white-space: pre;\r
  word-break: normal;\r
}\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 20px 0;\r
  border: 1px solid #d9e4e1;\r
  border-collapse: collapse !important;\r
  border-spacing: 0 !important;\r
  border-radius: 6px;\r
  background: #ffffff;\r
  box-shadow: none;\r
  font-size: 15px;\r
  text-align: left;\r
}\r
\r
#easymd .figure-table {\r
  display: block;\r
  margin: 20px 0;\r
  overflow-x: auto;\r
  overflow-y: hidden;\r
  border-radius: 6px;\r
}\r
\r
#easymd .figure-table table {\r
  margin: 0;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  min-width: 85px;\r
  padding: 8px 10px;\r
  border: 1px solid #d9e4e1;\r
  color: #242424;\r
}\r
\r
#easymd th {\r
  background: #eef7f5;\r
  color: #184e49;\r
  font-weight: 700;\r
}\r
\r
#easymd tr:nth-child(even) td {\r
  background: #f8fbfa;\r
}\r
\r
#easymd table tr:first-child > th:first-child,\r
#easymd table tr:first-child > td:first-child {\r
  border-top-left-radius: 5px;\r
}\r
\r
#easymd table tr:first-child > th:last-child,\r
#easymd table tr:first-child > td:last-child {\r
  border-top-right-radius: 5px;\r
}\r
\r
#easymd table tr:last-child > th:first-child,\r
#easymd table tr:last-child > td:first-child {\r
  border-bottom-left-radius: 5px;\r
}\r
\r
#easymd table tr:last-child > th:last-child,\r
#easymd table tr:last-child > td:last-child {\r
  border-bottom-right-radius: 5px;\r
}\r
\r
#easymd .frontmatter-table {\r
  margin: 20px 0;\r
  border: 1px solid #d9e4e1;\r
  border-radius: 6px;\r
  box-shadow: none;\r
  overflow: hidden;\r
}\r
\r
#easymd .frontmatter-table td {\r
  border: none;\r
  border-bottom: 1px solid #e5eeec;\r
}\r
\r
#easymd .frontmatter-key {\r
  background: #eef7f5;\r
  color: #115e59;\r
  font-weight: 700;\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #242424;\r
}\r
\r
#easymd hr {\r
  height: 1px;\r
  margin: 32px 0;\r
  border: none;\r
  background: #d1d5db;\r
  background-image: none;\r
}\r
\r
#easymd .decorative-hr {\r
  display: none;\r
}\r
\r
#easymd img,\r
#easymd [data-easymd-image-crop='free'] {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  box-sizing: border-box;\r
  margin: 20px auto;\r
  padding: 0 !important;\r
  border: 1px solid #edf1f0 !important;\r
  border-radius: 6px !important;\r
  background: #ffffff !important;\r
  box-shadow: none !important;\r
}\r
\r
#easymd [data-easymd-image-crop='free'] img {\r
  width: inherit;\r
  height: auto;\r
  margin: 0 !important;\r
  padding: 0 !important;\r
  border: 0 !important;\r
  border-radius: 0 !important;\r
  background: transparent !important;\r
  box-shadow: none !important;\r
}\r
\r
#easymd picture {\r
  display: block;\r
  max-width: 100%;\r
}\r
\r
#easymd picture img {\r
  margin: 20px auto;\r
}\r
\r
#easymd figure {\r
  display: flex;\r
  flex-direction: column;\r
  align-items: center;\r
  margin: 20px 0;\r
}\r
\r
#easymd figure img {\r
  margin: 0 auto;\r
}\r
\r
#easymd figcaption {\r
  margin-top: 8px;\r
  font-size: 14px;\r
  line-height: 1.5;\r
  color: #6b7280;\r
  text-align: center;\r
}\r
\r
#easymd .footnotes {\r
  margin-top: 32px;\r
  padding-top: 12px;\r
  border-top: 1px solid #e5e7eb;\r
  font-size: 14px;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 22px;\r
  color: #4b5563;\r
}\r
\r
#easymd .footnote-ref,\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  border-bottom: none;\r
  color: #0f766e;\r
  font-weight: 600;\r
  text-decoration: none;\r
}\r
\r
#easymd dl {\r
  margin: 20px 0;\r
}\r
\r
#easymd dt {\r
  margin: 8px 0 4px;\r
  color: #115e59;\r
  font-weight: 700;\r
}\r
\r
#easymd dd {\r
  margin: 4px 0 16px 20px;\r
  color: #242424;\r
  line-height: 1.75;\r
}\r
\r
#easymd kbd {\r
  display: inline-block;\r
  padding: 2px 6px;\r
  border: 1px solid #d1d5db;\r
  border-radius: 3px;\r
  background: #f8f8f8;\r
  font-family: Consolas, Monaco, Menlo, monospace;\r
  font-size: 12px;\r
  color: #374151;\r
}\r
\r
#easymd .markdown-alert {\r
  margin: 20px 0;\r
  padding: 12px 16px;\r
  border-left: 4px solid;\r
  border-radius: 0 6px 6px 0;\r
  background: #f7f8f8;\r
  box-shadow: none;\r
}\r
\r
#easymd .markdown-alert-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 8px;\r
  margin-bottom: 8px;\r
  font-weight: 700;\r
}\r
\r
#easymd .markdown-alert p {\r
  margin: 8px 0;\r
  font-size: 14px;\r
  color: #374151;\r
}\r
\r
#easymd .markdown-alert-note,\r
#easymd .markdown-alert-tip {\r
  border-left-color: #0f766e;\r
  background: #f0f8f6;\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title,\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #0f766e;\r
}\r
\r
#easymd .markdown-alert-important {\r
  border-left-color: #2563eb;\r
  background: #eff6ff;\r
}\r
\r
#easymd .markdown-alert-important .markdown-alert-title {\r
  color: #1d4ed8;\r
}\r
\r
#easymd .markdown-alert-warning {\r
  border-left-color: #d97706;\r
  background: #fffbeb;\r
}\r
\r
#easymd .markdown-alert-warning .markdown-alert-title {\r
  color: #b45309;\r
}\r
\r
#easymd .markdown-alert-caution {\r
  border-left-color: #dc2626;\r
  background: #fef2f2;\r
}\r
\r
#easymd .markdown-alert-caution .markdown-alert-title {\r
  color: #b91c1c;\r
}\r
\r
#easymd .math-inline {\r
  display: inline-block;\r
  padding: 2px 6px;\r
  border-radius: 4px;\r
  background: #f3f4f6;\r
  font-family: Consolas, Monaco, Menlo, monospace;\r
  font-size: 0.95em;\r
  color: #115e59;\r
}\r
\r
#easymd .math-display {\r
  display: block;\r
  margin: 20px 0;\r
  padding: 8px 0;\r
  overflow-x: auto;\r
  text-align: center;\r
}\r
\r
#easymd details {\r
  margin: 20px 0;\r
  border: 1px solid #d9e4e1;\r
  border-radius: 6px;\r
  background: #fafdfc;\r
}\r
\r
#easymd summary {\r
  padding: 12px 16px;\r
  color: #115e59;\r
  font-weight: 700;\r
  cursor: pointer;\r
}\r
\r
#easymd details[open] summary {\r
  border-bottom: 1px solid #e5eeec;\r
}\r
\r
#easymd details > *:not(summary) {\r
  padding: 0 16px 12px;\r
}\r
\r
#easymd iframe,\r
#easymd video {\r
  display: block;\r
  max-width: 100%;\r
  margin: 20px 0;\r
}\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 12px;\r
  color: #9ca3af;\r
}\r
\r
#easymd .meta {\r
  margin: 8px 0;\r
  text-align: center;\r
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
