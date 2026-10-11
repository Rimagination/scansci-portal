var r=`/**\r
 * Qingying - MDNice Classic with calm image cards\r
 */\r
\r
#easymd h1,\r
#easymd h2,\r
#easymd h3,\r
#easymd h4,\r
#easymd h5,\r
#easymd h6 {\r
  margin-top: 16px;\r
  margin-bottom: 16px;\r
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
  padding-top: 16px;\r
  padding-bottom: 16px;\r
}\r
\r
#easymd h1.svg-heading {\r
  margin: 16px 0;\r
  padding: 0;\r
}\r
\r
#easymd > h1.svg-heading:first-child {\r
  margin-top: 0;\r
}\r
\r
#easymd table {\r
  width: 100%;\r
  margin: 14px 0;\r
  overflow: hidden;\r
  border: 1px solid rgba(0, 150, 136, 0.32);\r
  border-collapse: separate !important;\r
  border-spacing: 0 !important;\r
  border-radius: 14px;\r
  background: #ffffff;\r
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.1);\r
}\r
\r
#easymd .figure-table {\r
  display: block;\r
  margin: 18px 0;\r
  overflow-x: auto;\r
  overflow-y: hidden;\r
  border-radius: 14px;\r
}\r
\r
#easymd .figure-table table {\r
  margin: 0;\r
}\r
\r
#easymd th,\r
#easymd td {\r
  border: none;\r
  border-right: 1px solid rgba(0, 150, 136, 0.24);\r
  border-bottom: 1px solid rgba(0, 150, 136, 0.2);\r
}\r
\r
#easymd tr > th:last-child,\r
#easymd tr > td:last-child {\r
  border-right: none;\r
}\r
\r
#easymd tr:last-child > th,\r
#easymd tr:last-child > td {\r
  border-bottom: none;\r
}\r
\r
#easymd tbody tr:nth-child(even) td {\r
  background: #f6fbfa;\r
}\r
\r
#easymd table tr:first-child > th:first-child,\r
#easymd table tr:first-child > td:first-child {\r
  border-top-left-radius: 13px;\r
}\r
\r
#easymd table tr:first-child > th:last-child,\r
#easymd table tr:first-child > td:last-child {\r
  border-top-right-radius: 13px;\r
}\r
\r
#easymd table > tbody > tr:last-child > td:first-child,\r
#easymd table > tr:last-child > td:first-child {\r
  border-bottom-left-radius: 13px;\r
}\r
\r
#easymd table > tbody > tr:last-child > td:last-child,\r
#easymd table > tr:last-child > td:last-child {\r
  border-bottom-right-radius: 13px;\r
}\r
\r
#easymd .frontmatter-table {\r
  overflow: hidden;\r
  border-radius: 14px;\r
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.1);\r
}\r
\r
#easymd img {\r
  display: block;\r
  max-width: 100%;\r
  height: auto;\r
  box-sizing: border-box;\r
  margin: 18px auto;\r
  padding: 8px !important;\r
  border: 1px solid #f1f3f5 !important;\r
  border-radius: 18px !important;\r
  background: #ffffff !important;\r
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.18) !important;\r
}\r
\r
#easymd [data-easymd-image-crop='free'] {\r
  display: block;\r
  max-width: 100%;\r
  box-sizing: border-box;\r
  margin: 18px auto;\r
  padding: 8px !important;\r
  border: 1px solid #f1f3f5 !important;\r
  border-radius: 18px !important;\r
  background: #ffffff !important;\r
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.18) !important;\r
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
  margin: 18px auto;\r
}\r
\r
#easymd figure {\r
  display: flex;\r
  flex-direction: column;\r
  align-items: center;\r
  margin: 18px 0;\r
}\r
\r
#easymd figure img {\r
  margin: 0 auto;\r
}\r
\r
#easymd figcaption {\r
  margin-top: 8px;\r
}\r
`;export{r as default};
