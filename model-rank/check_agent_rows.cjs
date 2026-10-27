// Run with: node check_agent_rows.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const start = code.indexOf('function submissionDate(row){');
const end = code.indexOf('function renderNav()', start);
assert.ok(start >= 0 && end > start);
const {submissionDate, modelBenchmarkRows} = vm.runInNewContext(code.slice(start, end) + '\n({submissionDate, modelBenchmarkRows})');
assert.equal(submissionDate({submittedAt:'2026-08-04T17:59:47.177719Z'}), '2026/08/05 01:59:47');
assert.equal(submissionDate({submittedAt:'invalid'}), '');
const rows = [
  {agent:'ReAct',model:'openai/gpt-4o'}, {agent:'ReAct',model:'none/none'},
  {agent:'ReAct',model:'mockllm/model'}, {agent:'ReAct',model:'未公开模型'},
  {agent:'ReAct',model:''}, {agent:'RoboPhD',model:'openai/gpt-4o'},
];
assert.deepEqual(Array.from(modelBenchmarkRows(rows), r=>r.model), ['openai/gpt-4o']);
assert.equal(rows.length, 6);
console.log('Model leaderboard filters unknown models and other agent setups; submission times use Beijing time');
