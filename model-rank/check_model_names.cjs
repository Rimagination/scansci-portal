// Run with: node check_model_names.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const start = code.indexOf('function modelDisplayName(raw){');
const end = code.indexOf('function submissionDate(row){', start);
assert.ok(start >= 0 && end > start);
const display = vm.runInNewContext(code.slice(start, end) + '\nmodelDisplayName');
for(const [input, expected] of [
  ['anthropic/claude-opus-4-7', 'Claude Opus 4.7'],
  ['anthropic/claude-3-5-haiku-20241022', 'Claude 3.5 Haiku (2024-10-22)'],
  ['anthropic/claude-sonnet-4-20250514', 'Claude Sonnet 4 (2025-05-14)'],
  ['openai/gpt-5.5-2026-04-23', 'GPT-5.5 (2026-04-23)'],
  ['openai/gpt-5-mini-2025-08-07', 'GPT-5 Mini (2025-08-07)'],
  ['openai/o3-2025-04-16', 'o3 (2025-04-16)'],
  ['google/gemini-3.1-pro-preview', 'Gemini 3.1 Pro Preview'],
  ['together/meta-llama/Llama-4-Scout-17B-16E-Instruct', 'Llama-4-Scout-17B-16E-Instruct'],
  ['Claude-3.7 Sonnet High (February 2025)', 'Claude 3.7 Sonnet High (February 2025)'],
  ['Claude-3-opus', 'Claude 3 Opus'],
  ['Claude-Opus-5 (max)', 'Claude Opus 5 (max)'],
  ['Fable 5.1', 'Claude Fable 5.1'],
  ['Claude Opus 5', 'Claude Opus 5'],
  ['GPT-5.6-Sol', 'GPT-5.6-Sol'],
  ['unknown-lab/new-model-v2', 'unknown-lab/new-model-v2'],
  ['openai/unrecognized-2026-04-23', 'openai/unrecognized-2026-04-23'],
]) assert.equal(display(input), expected, input);
console.log('Model display names preserve identifiers, versions and model snapshot dates');
