var n=`/**
 * Coral Notes - warm label headings and soft editorial body text.
 */

#easymd {
  margin: 0;
  padding: 0 10px;
  background: transparent;
  color: #000;
  font-family: Optima, 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', serif;
  font-size: 16px;
  line-height: 1.5em;
  letter-spacing: 0;
  word-spacing: 0;
  text-align: left;
  word-break: break-word;
  overflow-wrap: break-word;
}

#easymd h1,
#easymd h2,
#easymd h3,
#easymd h4,
#easymd h5,
#easymd h6 {
  font-family: Optima, 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', serif;
  font-weight: 700;
  text-align: left;
  color: #111;
}

#easymd > h1:first-child,
#easymd > h2:first-child,
#easymd > h3:first-child,
#easymd > h4:first-child,
#easymd > h5:first-child,
#easymd > h6:first-child {
  margin-top: 0;
}

#easymd h1 {
  margin: 0 0 24px;
  padding: 12px 10px;
  border-bottom: 3px solid #ef7060;
  font-size: 28px;
  line-height: 1.35;
  text-align: center;
  color: #111;
}

#easymd h2 {
  display: flex;
  align-items: flex-end;
  position: relative;
  margin: 30px 0 15px;
  padding: 0;
  border-bottom: 2px solid #ef7060;
  background: transparent;
  font-size: 0;
  line-height: 1.1em;
  color: #fff;
}

#easymd h2 > span:first-child {
  display: inline-block;
  flex: none;
  margin: 0 5px 0 0;
  padding: 3px 10px 1px;
  border-radius: 3px 3px 0 0;
  background: #ef7060;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.5em;
  text-align: left;
}

#easymd h2::after {
  content: '';
  display: inline-block;
  flex: none;
  width: 0;
  height: 0;
  border-bottom: 36px solid #efebe9;
  border-right: 20px solid transparent;
}

#easymd h3 {
  margin: 26px 0 12px;
  padding-left: 10px;
  border-left: 3px solid #ef7060;
  font-size: 20px;
  line-height: 1.45;
  color: #222;
}

#easymd h4,
#easymd h5,
#easymd h6 {
  margin: 22px 0 10px;
  font-size: 17px;
  line-height: 1.45;
  color: #333;
}

#easymd p {
  margin: 0;
  padding: 8px 0;
  color: #000;
  font-size: 16px;
  line-height: 1.8em;
  letter-spacing: 0;
  text-align: left;
  text-indent: 0;
  word-break: break-word;
}

#easymd p:last-child {
  margin-bottom: 0;
}

#easymd strong,
#easymd b {
  color: #000;
  font-weight: 700;
}

#easymd em,
#easymd i {
  color: #333;
  font-style: italic;
}

#easymd a {
  color: #ef7060;
  font-weight: 700;
  text-decoration: none;
  border-bottom: 1px solid #ef7060;
}

#easymd mark {
  padding: 1px 4px;
  border-radius: 3px;
  background: #fff0ec;
  color: #000;
}

#easymd del,
#easymd s,
#easymd strike {
  color: #777;
  text-decoration: line-through;
}

#easymd blockquote {
  margin: 20px 0;
  padding: 10px 10px 10px 20px;
  border-left: 3px solid #ef7060;
  background: #fff9f9;
  color: #000;
  overflow: auto;
}

#easymd blockquote p {
  padding: 8px 0;
  color: #000;
  font-size: 15px;
  line-height: 1.8em;
  font-weight: 400;
  text-align: left;
}

#easymd ul,
#easymd ol {
  margin: 8px 0;
  padding: 0 0 0 25px;
  color: #000;
}

#easymd ul {
  list-style-type: disc;
}

#easymd ol {
  list-style-type: decimal;
}

#easymd li {
  margin: 5px 0;
  padding: 0;
  color: #010101;
  font-size: 16px;
  line-height: 1.8em;
  font-weight: 400;
  text-align: left;
}

#easymd li::marker {
  color: #ef7060;
}

#easymd code {
  padding: 2px 5px;
  border-radius: 3px;
  background: #fff0ec;
  color: #c24135;
  font-family: Consolas, Monaco, 'SF Mono', monospace;
  font-size: 0.9em;
}

#easymd pre {
  margin: 16px 0;
  padding: 14px 16px;
  border-left: 3px solid #ef7060;
  background: #fff9f9;
  overflow-x: auto;
}

#easymd pre code {
  padding: 0;
  background: transparent;
  color: inherit;
}

#easymd hr {
  height: 1px;
  margin: 24px 0;
  border: none;
  background: #efebe9;
}

#easymd img {
  display: block;
  max-width: 100%;
  margin: 16px auto;
}

#easymd table {
  width: 100%;
  margin: 16px 0;
  border-collapse: collapse;
  font-size: 15px;
}

#easymd th,
#easymd td {
  padding: 9px 10px;
  border: 1px solid #f3d5cf;
  text-align: left;
}

#easymd th {
  background: #fff0ec;
  color: #8a332c;
  font-weight: 700;
}
`;export{n as default};
