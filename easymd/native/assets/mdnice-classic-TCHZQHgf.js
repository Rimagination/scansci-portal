const r=`/**\r
 * MDNice Classic Theme - Teal-accented WeChat article style\r
 */\r
\r
#easymd {\r
  padding: 0 10px;\r
  font-family: Optima, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', serif;\r
  font-size: 16px;\r
  line-height: 1.5;\r
  word-wrap: break-word;\r
  color: #000;\r
  background: transparent;\r
}\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  margin-top: 30px;\r
  margin-bottom: 15px;\r
  font-family: Optima, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', serif;\r
  font-weight: 700;\r
  line-height: 1.5em;\r
  color: #009688;\r
  word-break: break-all;\r
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
  display: table;\r
  margin-right: auto;\r
  margin-left: auto;\r
  padding: 12px 24px;\r
  border: none;\r
  border-radius: 18px;\r
  background: linear-gradient(135deg, #009688, #20b3a5);\r
  box-shadow: 0 10px 24px rgba(0, 150, 136, 0.18);\r
  font-size: 22px;\r
  text-align: center;\r
  color: #fff;\r
}\r
\r
#easymd h1.svg-heading {\r
  margin: 24px 0 18px;\r
  padding: 0;\r
  border: none;\r
  text-align: left;\r
}\r
\r
#easymd > h1.svg-heading:first-child {\r
  margin-top: 0;\r
}\r
\r
#easymd h1.svg-heading svg {\r
  display: block;\r
  width: 100%;\r
  height: auto;\r
}\r
\r
#easymd h2 {\r
  padding-left: 10px;\r
  border-left: 3px solid #009688;\r
  font-size: 20px;\r
  text-align: left;\r
}\r
\r
#easymd h3 {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.35em;\r
  padding-left: 0;\r
  border-left: none;\r
  font-size: 18px;\r
  color: #222;\r
  text-align: left;\r
}\r
\r
#easymd h3::before {\r
  content: '◈';\r
  flex: none;\r
  color: #009688;\r
  font-size: 0.85em;\r
  line-height: 1;\r
}\r
\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  padding-left: 8px;\r
  border-left: 2px solid rgba(0, 150, 136, 0.6);\r
  color: #444;\r
  text-align: left;\r
}\r
\r
#easymd h4 {\r
  font-size: 17px;\r
}\r
\r
#easymd h5 {\r
  font-size: 16px;\r
}\r
\r
#easymd h6 {\r
  font-size: 15px;\r
}\r
\r
#easymd p {\r
  margin: 0;\r
  padding: 8px 0;\r
  font-size: 16px;\r
  line-height: 1.8em;\r
  text-align: justify;\r
  color: #000;\r
  word-break: break-word;\r
}\r
\r
#easymd p:last-child {\r
  margin-bottom: 0;\r
}\r
\r
#easymd strong,\r
#easymd b {\r
  font-weight: 700;\r
  color: #009688;\r
}\r
\r
#easymd em,\r
#easymd i {\r
  font-style: italic;\r
  color: #009688;\r
}\r
\r
#easymd del,\r
#easymd s,\r
#easymd strike {\r
  color: #009688;\r
  text-decoration: line-through;\r
}\r
\r
#easymd mark {\r
  padding: 1px 4px;\r
  background: #fff4c2;\r
  color: #000;\r
}\r
\r
#easymd small {\r
  font-size: 14px;\r
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
  padding: 1px 4px;\r
  background: rgba(0, 150, 136, 0.08);\r
  text-decoration: underline;\r
}\r
\r
#easymd q {\r
  quotes: '“' '”' '‘' '’';\r
  color: #666;\r
  font-style: italic;\r
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
  padding: 2px 4px;\r
  border-radius: 4px;\r
  background: rgba(27, 31, 35, 0.05);\r
  font-family: Consolas, Monaco, Menlo, monospace;\r
  font-size: 14px;\r
  color: #009688;\r
}\r
\r
#easymd samp,\r
#easymd tt {\r
  padding: 2px 4px;\r
  border-radius: 4px;\r
  background: rgba(27, 31, 35, 0.05);\r
  font-family: Consolas, Monaco, Menlo, monospace;\r
  font-size: 14px;\r
  color: #009688;\r
}\r
\r
#easymd abbr[title] {\r
  border-bottom: 1px dotted #009688;\r
  text-decoration: none;\r
  cursor: help;\r
}\r
\r
#easymd a {\r
  color: #009688;\r
  font-weight: 700;\r
  text-decoration: none;\r
  border-bottom: 1px solid #009688;\r
}\r
\r
#easymd a:hover {\r
  color: #00796b;\r
  border-bottom-color: #00796b;\r
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
  padding-left: 25px;\r
  color: #000;\r
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
  line-height: 1.8em;\r
  color: #010101;\r
}\r
\r
#easymd li::marker {\r
  color: #009688;\r
}\r
\r
#easymd li > ul,\r
#easymd li > ol {\r
  margin: 8px 0;\r
}\r
\r
#easymd ul ul,\r
#easymd ul ul ul {\r
  color: #000;\r
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
  padding: 16px 20px;\r
  border-left: 4px solid #2bae85;\r
  background: rgba(43, 174, 133, 0.05);\r
  border-radius: 0 4px 4px 0;\r
}\r
\r
#easymd blockquote p {\r
  margin: 8px 0;\r
  padding: 8px 0;\r
  color: #666;\r
  text-align: left;\r
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
  margin: 0 2px;\r
  padding: 2px 4px;\r
  border-radius: 4px;\r
  background: rgba(27, 31, 35, 0.05);\r
  font-family: 'Operator Mono', Consolas, Monaco, Menlo, monospace;\r
  font-size: 14px;\r
  line-height: 1.8em;\r
  color: #009688;\r
  word-break: break-all;\r
}\r
\r
#easymd pre {\r
  margin: 10px 0;\r
  padding: 0;\r
  border: none;\r
  border-radius: 5px;\r
  background: #282c34;\r
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);\r
  overflow: hidden;\r
  text-align: left;\r
}\r
\r
#easymd pre::before {\r
  content: '';\r
  display: block;\r
  height: 30px;\r
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\r
  background-color: #282c34;\r
  background-image:\r
    radial-gradient(circle at 18px 15px, #fc625d 0 4px, transparent 4.5px),\r
    radial-gradient(circle at 32px 15px, #fdbc40 0 4px, transparent 4.5px),\r
    radial-gradient(circle at 46px 15px, #35cd4b 0 4px, transparent 4.5px);\r
  background-repeat: no-repeat;\r
}\r
\r
#easymd pre code {\r
  display: block;\r
  margin: 0;\r
  padding: 15px 16px 16px;\r
  border: none;\r
  border-radius: 0;\r
  background: transparent;\r
  font-family: Consolas, Monaco, Menlo, monospace;\r
  font-size: 12px;\r
  line-height: 1.7;\r
  color: #abb2bf;\r
  overflow-x: auto;\r
  white-space: pre;\r
  word-break: normal;\r
}\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 8px 0;\r
  border-collapse: collapse;\r
  font-size: 16px;\r
  text-align: left;\r
}\r
\r
#easymd th {\r
  min-width: 85px;\r
  padding: 5px 10px;\r
  border: 1px solid #009688;\r
  background: #009688;\r
  color: #fff;\r
  font-weight: 700;\r
}\r
\r
#easymd td {\r
  min-width: 85px;\r
  padding: 5px 10px;\r
  border: 1px solid #009688;\r
  color: #000;\r
}\r
\r
#easymd tbody tr:nth-child(even) {\r
  background: #f8f8f8;\r
}\r
\r
#easymd .frontmatter-table {\r
  margin: 16px 0;\r
  border: 1px solid #009688;\r
  overflow: hidden;\r
}\r
\r
#easymd .frontmatter-table td {\r
  padding: 10px 16px;\r
  border: none;\r
  border-bottom: 1px solid rgba(0, 150, 136, 0.25);\r
}\r
\r
#easymd .frontmatter-key {\r
  width: 140px;\r
  background: rgba(0, 150, 136, 0.08);\r
  color: #009688;\r
  font-weight: 700;\r
}\r
\r
#easymd .frontmatter-value {\r
  color: #000;\r
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
#easymd .decorative-hr {\r
  display: none;\r
}\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  margin: 10px auto;\r
  border: none;\r
  box-shadow: none;\r
}\r
\r
#easymd picture {\r
  display: block;\r
  max-width: 100%;\r
}\r
\r
#easymd picture img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  margin: 10px auto;\r
}\r
\r
#easymd figure {\r
  display: flex;\r
  flex-direction: column;\r
  justify-content: center;\r
  align-items: center;\r
  margin: 10px 0;\r
}\r
\r
#easymd figure img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  margin: 0 auto;\r
}\r
\r
#easymd figcaption {\r
  margin-top: 5px;\r
  font-size: 14px;\r
  line-height: 1.5em;\r
  color: #888;\r
  text-align: center;\r
}\r
\r
#easymd .footnotes {\r
  margin-top: 30px;\r
  padding-top: 10px;\r
  border-top: 1px solid rgba(0, 0, 0, 0.12);\r
  font-size: 14px;\r
}\r
\r
#easymd .footnotes ol {\r
  padding-left: 20px;\r
  color: #000;\r
}\r
\r
#easymd .footnote-ref {\r
  color: #009688;\r
  font-weight: 700;\r
  text-decoration: none;\r
  border-bottom: none;\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref {\r
  color: #009688;\r
  text-decoration: none;\r
  border-bottom: none;\r
  font-size: 0.875em;\r
}\r
\r
#easymd dl {\r
  margin: 16px 0;\r
}\r
\r
#easymd dt {\r
  margin: 8px 0 4px;\r
  color: #009688;\r
  font-weight: 700;\r
}\r
\r
#easymd dd {\r
  margin: 4px 0 16px 20px;\r
  color: #000;\r
  line-height: 1.8em;\r
}\r
\r
#easymd kbd {\r
  display: inline-block;\r
  padding: 2px 6px;\r
  border: 1px solid #d9d9d9;\r
  border-radius: 3px;\r
  background: #f8f8f8;\r
  font-family: Consolas, Monaco, Menlo, monospace;\r
  font-size: 12px;\r
  color: #444;\r
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);\r
}\r
\r
#easymd .markdown-alert {\r
  margin: 16px 0;\r
  padding: 12px 16px;\r
  border-left: 4px solid;\r
  border-radius: 4px;\r
  background: #f8f9fa;\r
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
  color: #2c2c2c;\r
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
  display: inline-block;\r
  padding: 2px 6px;\r
  border-radius: 4px;\r
  background: rgba(27, 31, 35, 0.05);\r
  font-family: Consolas, Monaco, Menlo, monospace;\r
  font-size: 0.95em;\r
  color: #009688;\r
}\r
\r
#easymd .math-display {\r
  display: block;\r
  margin: 16px 0;\r
  padding: 8px 0;\r
  overflow-x: auto;\r
  text-align: center;\r
}\r
\r
#easymd details {\r
  margin: 16px 0;\r
  border: 1px solid rgba(0, 150, 136, 0.2);\r
  background: #fafafa;\r
}\r
\r
#easymd summary {\r
  padding: 12px 16px;\r
  color: #009688;\r
  font-weight: 700;\r
  cursor: pointer;\r
}\r
\r
#easymd details[open] summary {\r
  border-bottom: 1px solid rgba(0, 150, 136, 0.15);\r
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
  margin: 16px 0;\r
}\r
\r
#easymd .meta,\r
#easymd time {\r
  font-size: 12px;\r
  color: #999;\r
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
