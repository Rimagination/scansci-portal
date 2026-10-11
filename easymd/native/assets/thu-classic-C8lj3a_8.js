var r=`/**\r
 * THU Classic - 清华紫风格\r
 * 微信兼容：使用 border-left 替代 ::before 伪元素\r
 */\r
\r
#easymd {\r
  color: #1f1630;\r
}\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  color: #5c307d;\r
}\r
\r
#easymd h1 {\r
  padding: 14px 28px;\r
  border: 1px solid rgba(92, 48, 125, 0.14);\r
  background:\r
    linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0)) padding-box,\r
    linear-gradient(135deg, #5c307d, #7a4d9a) border-box;\r
  box-shadow:\r
    4px 10px 22px rgba(92, 48, 125, 0.14),\r
    inset 0 1px 0 rgba(255, 255, 255, 0.22);\r
  letter-spacing: 0.08em;\r
  text-transform: none;\r
  color: #fff;\r
}\r
\r
/* h2：左侧紫色条 + 黑色文字 */\r
#easymd h2 {\r
  margin: 36px 0 18px;\r
  padding: 2px 0 2px 12px;\r
  border: none;\r
  border-left: 6px solid #5c307d;\r
  background: none;\r
  font-size: 18px;\r
  font-weight: 700;\r
  letter-spacing: normal;\r
  line-height: 1.5;\r
  color: #23142f;\r
}\r
\r
#easymd h2[data-easymd-inline-bar] {\r
  display: flex;\r
  align-items: center;\r
  padding: 0;\r
  border-left: none;\r
}\r
\r
#easymd h2[data-easymd-inline-bar] > span:first-child {\r
  display: block;\r
  flex: 0 0 6px;\r
  width: 6px;\r
  min-height: 31px;\r
  height: auto;\r
  margin-right: 12px;\r
  background: #5c307d;\r
  align-self: stretch;\r
}\r
\r
#easymd h2[data-easymd-inline-bar] > span:nth-child(2) {\r
  display: block;\r
  min-width: 0;\r
  flex: 1 1 auto;\r
}\r
\r
/* h3：空心菱形 + 文字 (由渲染器插入真实字符，避免微信伪元素重复) */\r
#easymd h3 {\r
  display: flex;\r
  align-items: center;\r
  gap: 0.35em;\r
  margin: 20px 0 14px;\r
  padding: 0;\r
  border: none;\r
  background: none;\r
  color: #45245f;\r
  font-size: 19px;\r
  font-weight: 700;\r
  line-height: 1.5;\r
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
  border-left: 3px solid rgba(92, 48, 125, 0.45);\r
  padding-left: 12px;\r
  color: #51306d;\r
}\r
\r
#easymd strong,\r
#easymd b,\r
#easymd em,\r
#easymd i,\r
#easymd del,\r
#easymd s,\r
#easymd strike,\r
#easymd var,\r
#easymd samp,\r
#easymd tt,\r
#easymd code,\r
#easymd a,\r
#easymd abbr[title],\r
#easymd li::marker,\r
#easymd .footnote-ref,\r
#easymd .footnote-backref {\r
  color: #5c307d;\r
}\r
\r
#easymd a {\r
  border-bottom-color: #5c307d;\r
}\r
\r
#easymd a:hover {\r
  color: #45245f;\r
  border-bottom-color: #45245f;\r
}\r
\r
#easymd ins {\r
  background: rgba(92, 48, 125, 0.09);\r
}\r
\r
#easymd mark {\r
  background: #ece2f6;\r
  color: #2d193d;\r
}\r
\r
#easymd q {\r
  color: #6d5b7a;\r
}\r
\r
#easymd blockquote {\r
  margin: 18px 0;\r
  padding: 16px 20px;\r
  border-left: 4px solid #7a4d9a;\r
  background: linear-gradient(180deg, rgba(92, 48, 125, 0.06), rgba(92, 48, 125, 0.035));\r
  border-radius: 0 12px 12px 0;\r
}\r
\r
#easymd blockquote blockquote {\r
  border-left-color: #5c307d;\r
  background: rgba(92, 48, 125, 0.08);\r
}\r
\r
#easymd blockquote p {\r
  color: #564666;\r
}\r
\r
#easymd .markdown-alert {\r
  border-radius: 10px;\r
  background: #fbf9fd;\r
  box-shadow: inset 0 0 0 1px rgba(92, 48, 125, 0.08);\r
}\r
\r
#easymd .markdown-alert-title {\r
  color: #5c307d;\r
}\r
\r
#easymd .markdown-alert-note,\r
#easymd .markdown-alert-tip {\r
  border-left-color: #7a4d9a;\r
  background: linear-gradient(180deg, rgba(92, 48, 125, 0.08), rgba(92, 48, 125, 0.04));\r
}\r
\r
#easymd .markdown-alert-note .markdown-alert-title,\r
#easymd .markdown-alert-tip .markdown-alert-title {\r
  color: #5c307d;\r
}\r
\r
#easymd table {\r
  border-color: rgba(92, 48, 125, 0.28);\r
  box-shadow: 0 12px 26px rgba(46, 27, 63, 0.1);\r
}\r
\r
#easymd .figure-table {\r
  border-radius: 14px;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  border-right-color: rgba(92, 48, 125, 0.2);\r
  border-bottom-color: rgba(92, 48, 125, 0.18);\r
}\r
\r
#easymd th {\r
  border-color: #5c307d;\r
  background: #5c307d;\r
  color: #fff;\r
}\r
\r
#easymd td {\r
  border-color: rgba(92, 48, 125, 0.26);\r
}\r
\r
#easymd tbody tr:nth-child(even) td {\r
  background: #faf7fc;\r
}\r
\r
#easymd .frontmatter-table {\r
  border-color: rgba(92, 48, 125, 0.3);\r
  box-shadow: 0 12px 26px rgba(46, 27, 63, 0.1);\r
}\r
\r
#easymd .frontmatter-table td {\r
  border-bottom-color: rgba(92, 48, 125, 0.18);\r
}\r
\r
#easymd .frontmatter-key {\r
  background: rgba(92, 48, 125, 0.08);\r
  color: #5c307d;\r
}\r
\r
#easymd .footnotes {\r
  border-top-color: rgba(92, 48, 125, 0.22);\r
}\r
\r
#easymd .footnote-backref,\r
#easymd .data-footnote-backref,\r
#easymd dt,\r
#easymd .math-inline,\r
#easymd summary {\r
  color: #5c307d;\r
}\r
\r
#easymd hr {\r
  border: none;\r
  background-color: #7a4d9a;\r
  background: linear-gradient(to right, transparent, #7a4d9a, transparent);\r
}\r
\r
/* 图片阴影柔化 */\r
#easymd img,\r
#easymd [data-easymd-image-crop='free'] {\r
  border-color: #ece5f2 !important;\r
  box-shadow: 0 8px 24px rgba(46, 27, 63, 0.08) !important;\r
}\r
\r
#easymd details {\r
  border-color: rgba(92, 48, 125, 0.2);\r
  background: #fcfafe;\r
}\r
\r
#easymd details[open] summary {\r
  border-bottom-color: rgba(92, 48, 125, 0.16);\r
}\r
\r
#easymd figcaption {\r
  color: #6d5b7a;\r
}\r
`;export{r as default};
