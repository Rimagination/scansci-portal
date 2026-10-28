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

headers = ['Agent', 'Full rate', 'Partial score', 'Modeling', 'Execution', 'Validation', 'Avg turns']
paper_html = '<time datetime="2026-10-08">Published</time><table><tr>' + ''.join(f'<th>{cell}</th>' for cell in headers) + '</tr>'
for i in range(5):
    paper_html += f'<tr><td>Model {i}</td><td>13.98</td><td>{90-i}</td><td>72.7</td><td>69.4</td><td>52.8</td><td>348.7</td></tr>'
paper_html += '</table>'
update_recent.fetch = lambda _: paper_html
paper_rows = update_recent.paperbench()['paperbench-science']['rows']
assert (paper_rows[0]['fullRate'], paper_rows[0]['modeling'], paper_rows[0]['execution'], paper_rows[0]['validation']) == (13.98, 72.7, 69.4, 52.8)

writing_data = {'stats': {'updated_at': '2026-10-28T15:20:29Z'}, 'rows': [
    {'base_name': 'Model A', 'duel_score_100': 95, 'rank': 1, 'lifecycle_key': 'current'},
    {'base_name': 'Model B', 'duel_score_100': 90, 'rank': 2, 'lifecycle_key': 'older'},
    {'base_name': 'Model C Q4', 'duel_score_100': 80, 'rank': 3, 'lifecycle_key': 'current', 'lm_studio_icon': 'local'},
    {'base_name': 'Model D', 'duel_score_100': 80, 'rank': 3, 'lifecycle_key': 'previous'},
    {'base_name': 'Model E', 'duel_score_100': 70, 'rank': 5, 'lifecycle_key': 'current'},
    {'base_name': 'Unranked', 'duel_score_100': None, 'rank': None, 'lifecycle_key': 'current'},
]}
update_recent.fetch = lambda _: json.dumps(writing_data)
writing_rows = update_recent.writing()['english-writing']['rows']
assert [row['rank'] for row in writing_rows] == [1, 2, 3, 3, 5]
assert writing_rows[1]['model'] == 'Model B' and '本地运行' in writing_rows[2]['agent']
writing_data['rows'][2]['rank'] = 4
try:
    update_recent.writing()
    raise AssertionError('Inconsistent source rank must reject the snapshot')
except ValueError:
    pass

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
