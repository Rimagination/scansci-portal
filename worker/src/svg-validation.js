import { DOMParser } from '@xmldom/xmldom';

export const MAX_SVG_BYTES = 200 * 1024;
const NS = 'http://www.w3.org/2000/svg';
const ELEMENTS = new Set('svg g defs title desc path rect circle ellipse line polyline polygon text tspan linearGradient radialGradient stop clipPath'.split(' '));
const ATTRS = new Set('id viewBox width height x y x1 y1 x2 y2 cx cy r rx ry dx dy d points transform fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity color font-family font-size font-weight font-style text-anchor dominant-baseline letter-spacing gradientUnits gradientTransform spreadMethod offset stop-color stop-opacity clip-path clip-rule clipPathUnits preserveAspectRatio vector-effect'.split(' '));
const STYLES = new Set('fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity color font-family font-size font-weight font-style text-anchor dominant-baseline letter-spacing stop-color stop-opacity'.split(' '));
const escape = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function invalid(message) { throw new Error(message); }

// A deliberately restricted static SVG profile. XML parsing is delegated to xmldom;
// every accepted node/attribute is reserialized, never returned as raw markup.
export function validateSvg(input) {
  if (typeof input !== 'string' || !input.trim()) invalid('请选择 SVG 文件。');
  if (new TextEncoder().encode(input).length > MAX_SVG_BYTES) invalid('SVG 不能超过 200 KiB。');
  if (/<!DOCTYPE|<!ENTITY/i.test(input)) invalid('不支持 DTD 或实体声明。');
  if ((input.match(/</g) || []).length > 10000) invalid('SVG 对象过多，请先简化。');
  let doc;
  try {
    doc = new DOMParser({ onError: () => { throw new Error('invalid XML'); } }).parseFromString(input, 'image/svg+xml');
  } catch { invalid('SVG XML 格式无效，请重新导出。'); }
  const root = doc.documentElement;
  if (!root || root.tagName !== 'svg' || root.namespaceURI !== NS) invalid('需要带 SVG 命名空间的有效 SVG 根元素。');
  for (const child of Array.from(doc.childNodes)) {
    if (child === root || child.nodeType === 8 || (child.nodeType === 3 && !child.data.trim())) continue;
    if (child.nodeType === 7 && child.target === 'xml') continue;
    invalid('不支持 SVG 外部声明或额外根元素。');
  }
  const ids = new Map(), refs = [];
  let count = 0, shapes = 0;
  function attrValue(name, value) {
    if (/[\\\u0000-\u001f\u007f]/.test(value)) invalid(`属性 ${name} 包含不支持的字符。`);
    if (name === 'id') {
      if (!/^[A-Za-z_][\w.-]{0,79}$/.test(value) || ids.has(value)) invalid('对象 ID 无效或重复。');
    }
    // No CSS escapes, functions, URLs or resource loads except bounded local paint/clip references.
    if (['fill', 'stroke', 'clip-path'].includes(name) && /^url\(#[A-Za-z_][\w.-]{0,79}\)$/.test(value)) {
      refs.push({ id: value.slice(5, -1), kind: name });
    } else if (name === 'transform' || name === 'gradientTransform') {
      if (!/^(?:\s*(?:matrix|translate|scale|rotate|skewX|skewY)\(\s*[-+\d.eE,\s]+\)\s*)+$/.test(value)) invalid('不支持该变换格式。');
    } else if (['fill','stroke','color','stop-color'].includes(name)) {
      if (!/^(?:#[\da-fA-F]{3,8}|[a-zA-Z]+|rgba?\([\d.% ,]+\)|hsla?\([\d.% ,]+\))$/.test(value)) invalid('不支持外部颜色资源或该颜色格式。');
    } else if (/[():;{}<>]/.test(value)) invalid(`不支持属性 ${name} 的资源或表达式。`);
    return escape(value);
  }
  function serialize(node, depth = 0, insideClip = false) {
    if (++count > 5000 || depth > 48) invalid('SVG 对象或嵌套层级过多。');
    if (node.nodeType === 8) return '';
    if (node.nodeType === 3 || node.nodeType === 4) {
      if (node.data.trim() && !['text', 'tspan', 'title', 'desc'].includes(node.parentNode.localName)) invalid('图形节点中含有无效文字。');
      return escape(node.data);
    }
    if (node.nodeType !== 1 || node.namespaceURI !== NS || !ELEMENTS.has(node.tagName) || (node !== root && node.tagName === 'svg')) {
      invalid(`不支持元素 ${node.nodeName}。请导出静态、无外链的纯 SVG。`);
    }
    if (['path','rect','circle','ellipse','line','polyline','polygon','text'].includes(node.tagName)) shapes++;
    insideClip ||= node.tagName === 'clipPath';
    const attrs = new Map();
    for (const attr of Array.from(node.attributes)) {
      if (attr.name === 'xmlns' && node === root && attr.value === NS) continue;
      if (attr.name === 'xml:space' && ['preserve','default'].includes(attr.value)) { attrs.set(attr.name, attr.value); continue; }
      if (attr.name === 'style') {
        for (const rule of attr.value.split(';').filter(s => s.trim())) {
          const colon = rule.indexOf(':');
          const name = rule.slice(0, colon).trim(), value = rule.slice(colon + 1).trim();
          if (colon < 0 || !STYLES.has(name)) invalid('内联样式含有不支持的属性，请使用 SVG 展示属性导出。');
          attrs.set(name, value);
        }
      } else {
        if (!ATTRS.has(attr.name) || attr.namespaceURI) invalid(`不支持属性 ${attr.name}，请移除脚本、外链或编辑器私有属性。`);
        // Inline style has higher specificity than presentation attributes regardless of XML order.
        if (!attrs.has(attr.name)) attrs.set(attr.name, attr.value);
      }
    }
    // Even acyclic branching clip references amplify render work exponentially.
    if (insideClip && attrs.has('clip-path')) invalid('裁剪定义内不能再引用裁剪路径，请展开为简单几何。');
    if (node === root) {
      if (!attrs.has('viewBox')) {
        const w = Number((attrs.get('width') || '').replace(/px$/, '')), h = Number((attrs.get('height') || '').replace(/px$/, ''));
        if (!(w > 0 && h > 0 && w <= 100000 && h <= 100000)) invalid('请提供 viewBox 或有效宽高。');
        attrs.set('viewBox', `0 0 ${w} ${h}`);
      }
      const box = attrs.get('viewBox').trim().split(/[\s,]+/).map(Number);
      if (box.length !== 4 || box.some(n => !Number.isFinite(n) || Math.abs(n) > 100000) || box[2] <= 0 || box[3] <= 0) invalid('viewBox 无效或过大。');
    }
    let markup = `<${node.tagName}${node === root ? ` xmlns="${NS}"` : ''}`;
    for (const [name, value] of attrs) markup += ` ${name}="${attrValue(name, value)}"`;
    if (attrs.has('id')) ids.set(attrs.get('id'), node.tagName);
    markup += '>';
    for (const child of Array.from(node.childNodes)) markup += serialize(child, depth + 1, insideClip);
    return markup + `</${node.tagName}>`;
  }
  const svg = serialize(root);
  if (!shapes) invalid('SVG 没有可用的图形或文字。');
  for (const ref of refs) {
    const target = ids.get(ref.id);
    if (ref.kind === 'clip-path' ? target !== 'clipPath' : !['linearGradient','radialGradient'].includes(target)) invalid('局部引用缺失或指向了不支持的元素。');
  }
  if (new TextEncoder().encode(svg).length > MAX_SVG_BYTES) invalid('规范化后的 SVG 超过 200 KiB。');
  return svg;
}
