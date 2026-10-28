"""Run with: python -B check_overall.py"""
import json
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest.mock import patch
import update_overall

path = Path(__file__).parent / 'overall-data.js'
text = path.read_text(encoding='utf8')
data = json.loads(text.removeprefix('window.OVERALL_DATA = ').removesuffix(';\n'))
groups = data['groups']
assert {'aihot', 'arena'} <= groups.keys()
for name in ('aihot', 'arena'):
    group = groups[name]
    assert group['updatedAt'] and len(group['rows']) >= 10
    assert all(r['source'].startswith('https://') and r['rank'] >= 1 for r in group['rows'])
    assert [r['rank'] for r in group['rows']] == sorted(r['rank'] for r in group['rows'])
assert all(0 <= r['coveragePercent'] <= 100 and r['benchmarkCount'] > 0 for r in groups['aihot']['rows'])
assert all(r['cost'] is None or abs(r['cost'] - (7 * r['cachePrice'] + 2 * r['inputPrice'] + r['outputPrice']) / 10) < 1e-9 for r in groups['aihot']['rows'])
assert all(r['ratingLower'] <= r['score'] <= r['ratingUpper'] and r['votes'] >= 0 for r in groups['arena']['rows'])

header = ['名次', '模型', '上线日期', '评测覆盖', '缓存价格', '输入价格', '输出价格', 'AIHOT 评分']
table = '<table><tr>' + ''.join('<th>' + x + '</th>' for x in header) + '</tr>'
for i in range(1, 11):
    cache = '无官方价' if i == 2 else '未知新格式' if i == 3 else '¥1'
    prices = f'<td>{cache}</td><td>¥2</td><td>¥3</td>'
    table += f'<tr><td>{i}</td><td><a href="/leaderboard/model-{i}"><strong>Model {i}</strong></a><small>OpenAI</small></td><td>2026-10-01</td><td>4 项评测 覆盖 80 %</td>{prices}<td><strong>{80-i}</strong></td></tr>'
html = table + '</table><script>"generatedAt","2026-10-27T00:05:59Z"</script>'
update_overall.fetch = lambda _: html
fixture = update_overall.aihot()
assert len(fixture['rows']) == 10 and fixture['rows'][0]['benchmarkCount'] == 4
assert fixture['rows'][0]['cost'] == 1.4
assert fixture['rows'][1]['score'] == 78 and fixture['rows'][1]['cachePrice'] is None and fixture['rows'][1]['cost'] is None
assert fixture['rows'][1]['cachePriceRaw'] == '无官方价'
assert fixture['rows'][2]['cachePriceRaw'] == '未知新格式' and fixture['rows'][2]['cost'] is None
assert fixture['rows'][0]['source'] == 'https://aihot.news/leaderboard/model-1'

try:
    import pyarrow.parquet as parquet
except ImportError:
    parquet = None
if parquet:
    records = [{'category': 'overall', 'model_name': row['model'], 'organization': row['provider'],
                'rating': row['score'], 'rating_lower': row['ratingLower'], 'rating_upper': row['ratingUpper'],
                'rank': row['rank'], 'vote_count': row['votes'], 'leaderboard_publish_date': groups['arena']['updatedAt']}
               for row in groups['arena']['rows'][:10]]
    table = SimpleNamespace(to_pylist=lambda: records)
    with patch.object(update_overall, 'urlopen', side_effect=lambda *a, **k: BytesIO(b'parquet')) as download, \
         patch.object(parquet, 'read_table', side_effect=[ValueError('truncated snapshot'), table]):
        assert len(update_overall.arena()['rows']) == 10 and download.call_count == 2
    with patch.object(update_overall, 'urlopen', side_effect=lambda *a, **k: BytesIO(b'parquet')), \
         patch.object(parquet, 'read_table', side_effect=ValueError('truncated snapshot')), \
         patch.object(update_overall, 'arena_page', return_value={'num_rows_total': 10, 'rows': [{'row': row} for row in records]}):
        assert len(update_overall.arena()['rows']) == 10

with TemporaryDirectory() as temp:
    update_overall.TARGET = Path(temp) / 'overall-data.js'
    update_overall.TARGET.write_text(text, encoding='utf8')
    def fail(): raise ValueError('source unavailable')
    update_overall.aihot = fail
    update_overall.arena = lambda: groups['arena']
    assert update_overall.main() == 1
    saved = json.loads(update_overall.TARGET.read_text(encoding='utf8').removeprefix('window.OVERALL_DATA = ').removesuffix(';\n'))
    assert saved['groups']['aihot'] == groups['aihot'] and saved['failed'] == ['aihot']
print('Overall leaderboards preserve source ranks, attribution, coverage and previous data on failure')
