var r=`/*\r
  Josh's Custom CSS Reset (Scoped for #easymd)\r
  https://www.joshwcomeau.com/css/custom-css-reset/\r
*/\r
\r
#easymd *,\r
#easymd *::before,\r
#easymd *::after {\r
  box-sizing: border-box;\r
}\r
\r
#easymd * {\r
  margin: 0;\r
}\r
\r
#easymd {\r
  line-height: 1.5;\r
  -webkit-font-smoothing: antialiased;\r
  text-autospace: normal;\r
  font-family: sans-serif;\r
  text-align: left;\r
}\r
\r
#easymd img,\r
#easymd picture,\r
#easymd video,\r
#easymd canvas,\r
#easymd svg {\r
  display: block;\r
  max-width: 100%;\r
}\r
\r
#easymd input,\r
#easymd button,\r
#easymd textarea,\r
#easymd select {\r
  font: inherit;\r
}\r
\r
#easymd p,\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  overflow-wrap: break-word;\r
}\r
\r
#easymd figure.figure-table {\r
  overflow-x: auto;\r
  -webkit-overflow-scrolling: touch;\r
}\r
\r
#easymd figure.figure-table table {\r
  margin: 0;\r
}\r
\r
/* ========================================\r
   Print Styles - 打印/导出 PDF 分页优化\r
   ======================================== */\r
@media print {\r
  #easymd {\r
    padding: 4em;\r
  }\r
\r
  /* 防止块级元素被分页切割 */\r
  #easymd p,\r
  #easymd li,\r
  #easymd blockquote,\r
  #easymd pre,\r
  #easymd img,\r
  #easymd figure,\r
  #easymd table,\r
  #easymd tr,\r
  #easymd dl,\r
  #easymd details,\r
  #easymd .markdown-alert,\r
  #easymd .math-display {\r
    break-inside: avoid;\r
    page-break-inside: avoid;\r
  }\r
\r
  /* 标题后不分页，保持与内容连贯 */\r
  #easymd h1,\r
  #easymd h2,\r
  #easymd h3,\r
  #easymd h4,\r
  #easymd h5,\r
  #easymd h6 {\r
    break-after: avoid;\r
    page-break-after: avoid;\r
  }\r
}\r
`;export{r as default};
