import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { queryJournalSearch } from '../src/journal-search.js';

test('abbreviation search includes legacy rows missing from the FTS abbreviation index', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(readFileSync(new URL('../sql/0006_journal_search.sql', import.meta.url), 'utf8'));
    const records = [
      [1, 'PHYSICAL REVIEW LETTERS', '0031-9007', 9.1, 'prl pr physrevlett', 91],
      [2, 'PATTERN RECOGNITION LETTERS', '0167-8655', 4, 'prl pr patrecoglet', 40],
      [3, 'PROCEEDINGS OF THE NATIONAL ACADEMY OF SCIENCES OF THE UNITED STATES OF AMERICA', '0027-8424', 12, 'pnasusa pn pnatlacadsciusa', 120],
      [4, 'PNAS Nexus', '2752-6542', 4.8, 'pn pnasnexus', 48],
      [5, 'Nature Communications', '2041-1723', 18.1, 'nc natcommun', 181],
    ];
    for (const row of records) {
      database.prepare("INSERT INTO journal_search(id,title,issn,if_2023,abbrs,quality_score,updated_at) VALUES(?,?,?,?,?,?,'2026-10-11')").run(...row);
      // Legacy FTS data has the full title and identifiers, but no abbreviation.
      database.prepare('INSERT INTO journal_search_fts(rowid,title,issn,search_text) VALUES(?,?,?,?)').run(row[0], row[1], row[2], row[1]);
    }
    const env = { DB: { prepare(sql) {
      const statement = database.prepare(sql);
      return { bind: (...values) => ({ all: async () => ({ results: statement.all(...values) }) }) };
    } } };
    const search = async (query, options = {}) => (await queryJournalSearch(env, { query, ...options })).items;
    assert.deepEqual((await search('PRL')).map(row => row.id), [1, 2]);
    assert.deepEqual((await search('prl')).map(row => row.id), [1, 2]);
    assert.deepEqual((await search('P.R.L.')).map(row => row.id), [1, 2]);
    assert.deepEqual((await search('PNAS')).map(row => row.id), [3, 4]);
    assert.deepEqual((await search('Nat Commun')).map(row => row.id), [5]);
    assert.equal((await search('PNAS Nexus'))[0].id, 4);
    assert.equal((await search('2041-1723'))[0].id, 5);
    assert.deepEqual(await search('PRL', { minIF: 10 }), []);
    assert.deepEqual((await search('PRL', { limit: 1 })).map(row => row.id), [1]);
    assert.deepEqual(await search('Q1'), []);
    assert.equal('abbrs' in (await search('PRL'))[0], false);
  } finally { database.close(); }
});
