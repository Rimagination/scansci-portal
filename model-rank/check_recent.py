"""Run with: python -B check_recent.py"""
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import update_recent
from source_tables import Tables

root = Path(__file__).parent
raw = (root / 'recent-data.js').read_text(encoding='utf8')
data = json.loads(raw.removeprefix('window.RECENT_DATA = ').removesuffix(';\n'))
groups = data['groups']
expected = {'swescience', 'paperbench-science', 'scifigure-image', 'scifigure-caption', 'english-writing', 'sciconbench', 'terminal-science'}
assert expected <= groups.keys()
for key in expected:
    group = groups[key]
    assert group['updatedAt'] and group['dateLabel'] and len(group['rows']) >= 5
    assert all(row['source'].startswith('https://') and 0 <= row['scoreRaw'] <= 100 for row in group['rows'])
    assert all(a['scoreRaw'] >= b['scoreRaw'] for a, b in zip(group['rows'], group['rows'][1:]))
assert all('篇综述' in row['agent'] for row in groups['sciconbench']['rows'])

html = '<time datetime="2026-10-09">Updated</time><table><tr><th>Rank</th><th>LLM</th></tr><tr><td>1</td><td><a href="/source">Model &amp; Co</a></td></tr></table>'
parser = Tables()
parser.feed(html)
assert parser.times == ['2026-10-09']
assert update_recent.rows_for(parser, ['Rank', 'LLM']) == [['1', 'Model & Co']]
assert parser.tables[0]['rows'][1][1]['links'] == ['/source']

with TemporaryDirectory() as temporary:
    update_recent.TARGET = Path(temporary) / 'recent-data.js'
    update_recent.TARGET.write_text(raw, encoding='utf8')
    for name in ('swescience', 'scifigure', 'writing', 'scicon', 'terminal_science'):
        setattr(update_recent, name, lambda: {})
    def fail(): raise ValueError('source unavailable')
    update_recent.paperbench = fail
    assert update_recent.main() == 1
    saved = json.loads(update_recent.TARGET.read_text(encoding='utf8').removeprefix('window.RECENT_DATA = ').removesuffix(';\n'))
    assert saved['groups']['paperbench-science'] == groups['paperbench-science']
    assert saved['failed'] == ['paperbench-science']
print('Recent sources retain prior data on failure and expose source-specific dates and scores')
