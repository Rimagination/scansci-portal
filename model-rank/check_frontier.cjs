// Run with: node check_frontier.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(require('node:path').join(__dirname, 'app.js'), 'utf8');
const start = code.indexOf('function paretoFrontier(rows){');
const end = code.indexOf('function drawChart(){', start);
assert.ok(start >= 0 && end > start);
const frontier = vm.runInNewContext(code.slice(start, end) + '\nparetoFrontier');
const points = [
  {cost: 1, score: 3}, {cost: 1, score: 4}, {cost: 1, score: 4},
  {cost: 2, score: 4}, {cost: 3, score: 5}, {cost: 4, score: 2},
];
assert.deepEqual(Array.from(frontier(points), p => [p.cost, p.score]), [[1, 4], [3, 5]]);
assert.equal(frontier([]).length, 0);
console.log('Pareto frontier handles equal prices, equal scores and dominated results');
