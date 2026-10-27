// Run with: node check_chart_layout.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const start = code.indexOf('function placeChartLabels(points, bounds){');
const end = code.indexOf('function drawChart(){', start);
assert.ok(start >= 0 && end > start);
const layout = vm.runInNewContext(code.slice(start, end) + '\nplaceChartLabels');
const points = Array.from({length: 80}, (_, i) => ({index:i, x:110, y:200, label:`Model ${i}`}));
const obstacle = {x:92, y:182, width:36, height:36};
const boxes = layout(points, {x:65, y:28, width:1005, height:1187, obstacles:[obstacle]});
assert.equal(boxes.length, points.length);
const visible = boxes.filter(box => !box.hidden);
assert.ok(visible.length > 0 && visible.length < boxes.length);
for(let i=0;i<visible.length;i++){
 const a=visible[i];
 assert.ok(a.x>=obstacle.x+obstacle.width || a.x+a.width<=obstacle.x || a.y>=obstacle.y+obstacle.height || a.y+a.height<=obstacle.y);
 assert.ok(a.x>=65 && a.y>=28 && a.x+a.width<=1070 && a.y+a.height<=1215);
 assert.ok(Math.hypot(Math.max(a.x-110,110-a.x-a.width,0),Math.max(a.y-200,200-a.y-a.height,0))<=30);
 for(let j=0;j<i;j++){
  const b=visible[j];
  assert.ok(a.x>=b.x+b.width || a.x+a.width<=b.x || a.y>=b.y+b.height || a.y+a.height<=b.y);
 }
}
console.log('Chart labels stay close to markers without overlap; dense points defer names to hover');
const markerSizes = vm.runInNewContext(code.slice(start, end) + '\nsizeChartMarkers');
const nearby = [{x:100,y:100,onFront:true},{x:100,y:124,onFront:true},{x:200,y:200,onFront:false}];
const sizes = markerSizes(nearby);
assert.ok((sizes[0]+sizes[1])/2 <= 22);
assert.equal(sizes[2], 24);
console.log('Nearby markers shrink without moving their data coordinates');
