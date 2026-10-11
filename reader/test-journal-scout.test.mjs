import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import worker, { journalScoutRedirect } from './cloud-worker.mjs';

const origin = 'https://reader.scansci.com';
const row = { id: 12993, title: 'Nature Communications', issn: '2041-1723', eissn: '2041-1723', if_2023: 18.1, if_year: '2025', jcr_quartile: 'Q1', cas_2025: '1区', xuankan_2026: '1区' };

test('Reader searches the shared journal database without crossing the account gateway', async () => {
  const bindings = { DB: { prepare: sql => ({ bind: (...args) => ({ all: async () => {
    if (sql.includes('journal_search_fts')) assert.equal(args[3], 'nc');
    else assert.equal(args[0], '% nc%');
    assert.equal(args.at(-1), 20);
    return { results: [row] };
  } }) }) } };
  const response = await worker.fetch(new Request(origin + '/api/reader/journals/search?q=NC&limit=999'), bindings);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=60, s-maxage=300');
  const payload = await response.json();
  assert.equal(payload.items[0].id, row.id);
  assert.equal(payload.items[0].if_year, '2025');
  assert.equal((await worker.fetch(new Request(origin + '/api/reader/journals/search?q=NC', { headers: { Origin: 'https://evil.example' } }), bindings)).status, 403);
  assert.equal((await worker.fetch(new Request(origin + '/api/reader/journals/search', { method: 'POST', headers: { Origin: origin } }), bindings)).status, 405);
  const unavailable = await worker.fetch(new Request(origin + '/api/reader/journals/search?q=NC'), {});
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get('Cache-Control'), 'no-store');
});

test('Scout links resolve the exact ISSN or title and preserve unknown queries at the independent site', async () => {
  const unrelated = { ...row, id: 5, title: 'Other journal', issn: '0000-0001', eissn: '' };
  for (const query of ['20411723', '2041-1723', 'nature communications']) {
    const response = journalScoutRedirect({ ok: true, query, items: [unrelated, row] });
    const url = new URL(response.headers.get('Location'));
    assert.equal(response.status, 302);
    assert.equal(url.origin, 'https://journal.scansci.com');
    assert.equal(url.pathname, '/journal.html');
    assert.equal(url.searchParams.get('id'), '12993');
  }
  const bindings = { DB: { prepare: () => ({ bind: () => ({ all: async () => ({ results: [unrelated, row] }) }) }) } };
  const lookup = await worker.fetch(new Request(origin + '/api/reader/journals/lookup?q=2041-1723'), bindings);
  assert.equal(new URL(lookup.headers.get('Location')).searchParams.get('id'), '12993');
  const fallback = journalScoutRedirect({ ok: false, query: '未知期刊 https://evil.example/', items: [] });
  const url = new URL(fallback.headers.get('Location'));
  assert.equal(url.origin, 'https://journal.scansci.com');
  assert.equal(url.searchParams.get('q'), '未知期刊 https://evil.example/');
  assert.equal(fallback.headers.get('Cache-Control'), 'no-store');
});

test('Reader uses stable subscription identifiers and displays the actual metric year', async () => {
  const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
  function source(name) {
    const start = html.indexOf(`    function ${name}(`);
    assert.ok(start >= 0, name);
    return html.slice(start, html.indexOf('\n    function ', start + 1));
  }
  const context = vm.createContext({ URLSearchParams, classifyField: () => '综合与未分类', getJournalPartitions: () => ({ jcrMask: 0, casZone: 0, xinruiZone: 0 }), jcrQuartileLabels: () => [] });
  for (const name of ['normalizeIssn', 'normalizeJournalRecord', 'escapeHtml', 'journalScoutUrl', 'journalScoutButton', 'renderJournalMetrics']) vm.runInContext(source(name), context);
  context.row = row;
  const record = vm.runInContext('normalizeJournalRecord(row, "journal-scout")', context);
  assert.equal(record.id, 'issn:20411723');
  assert.deepEqual([...record.issn], ['2041-1723']);
  assert.equal(record.count, null);
  context.record = record;
  const metrics = vm.runInContext('renderJournalMetrics(record)', context);
  assert.match(metrics, /IF 18.1（2025）/);
  assert.match(metrics, /JCR Q1/);
  assert.match(metrics, /中科院 1区/);
  assert.match(metrics, /新锐 1区/);
  const button = vm.runInContext('journalScoutButton(record)', context);
  assert.match(button, /https:\/\/journal\.scansci\.com\/journal\.html\?id=12993/);
  assert.match(button, /target="_blank"/);
  assert.match(button, /rel="noopener noreferrer"/);
  assert.equal(vm.runInContext('journalScoutUrl({issn:["0028-0836"],name:"Nature"})', context), '/api/reader/journals/lookup?q=0028-0836');
  assert.doesNotMatch(vm.runInContext('renderJournalMetrics({issn:[], metrics:{if_2023:null}})', context), /IF /);
});

test('existing OpenAlex subscriptions survive Scout search and the curated directory', async () => {
  const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
  function source(name) {
    const start = html.indexOf(`    function ${name}(`);
    const end = Math.min(...['\n    function ', '\n    async function '].map(token => html.indexOf(token, start + 1)).filter(index => index > 0));
    return html.slice(start, end);
  }
  const id = 'https://openalex.org/S1', issn = '2041-1723';
  const old = { id, sourceId: id, name: row.title, issn: [issn], count: 25 };
  const followedJournals = new Set([id]), followedJournalRecords = new Map([[id, old]]);
  const context = vm.createContext({ followedJournals, followedJournalRecords, activeJournal: null, journals: [], defaultJournals: [], history: { state: {} }, localStorage: { setItem() {} }, normalizeIssn: value => value.replace('-', '') });
  for (const name of ['journalIdentifiers', 'followedJournalId', 'journalFromId', 'saveFollowedJournals', 'rememberFollowedJournals']) vm.runInContext(source(name), context);
  context.scout = { id: 'issn:20411723', name: row.title, sourceId: '', issn: [issn], scoutId: row.id, metrics: row, count: null };
  assert.equal(vm.runInContext('followedJournalId(scout)', context), id);
  vm.runInContext('rememberFollowedJournals([scout]); journals = [{id:"issn:20411723", name:"Nature Communications", issn:["2041-1723"], count:null}]; rememberFollowedJournals(journals);', context);
  assert.equal(followedJournals.size, 1);
  const restored = vm.runInContext('journalFromId("issn:20411723")', context);
  assert.equal(restored.scoutId, row.id);
  assert.equal(restored.metrics.if_year, '2025');
  assert.equal(restored.sourceId, id);
  assert.equal(restored.count, 25);
});
