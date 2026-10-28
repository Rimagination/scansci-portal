"""Check the delivered literature results and source-failure preservation."""
import contextlib
import io
import json
import tempfile
from pathlib import Path
from unittest.mock import patch

import update_literature_extra as updater


def read(path):
    text = path.read_text(encoding='utf8')
    assert text.startswith(updater.PREFIX) and text.rstrip().endswith(';')
    return json.loads(text[len(updater.PREFIX):].rstrip()[:-1])


data = read(updater.TARGET)
expected = {key for keys, _ in updater.LOADERS for key in keys}
assert set(data['groups']) == expected
for key, group in data['groups'].items():
    rows = group['rows']
    assert len(rows) >= (18 if key.startswith('researchqa-') else 10 if key.startswith('litreview-') else 13)
    assert group['source'].startswith('https://') and group['updatedAt'] and group['dateLabel']
    assert all(row['model'] and row['agent'] and row['source'].startswith('https://') for row in rows)
    assert len({(row['model'], row['agent']) for row in rows}) == len(rows)
    assert all(row['score'] == row['scoreRaw'] for row in rows)
    assert [row['scoreRaw'] for row in rows] == sorted((row['scoreRaw'] for row in rows), reverse=True)

for key in (k for k in expected if k.startswith('litreview-')):
    rows = data['groups'][key]['rows']
    assert len([r for r in rows if r['isHuman'] and '人工参考' in r['agent']]) == 1
    assert not any(r['model'] == 'Average' for r in rows)
utility = data['groups']['litreview-utility']['rows']
assert next(r for r in utility if r['model'] == 'GPT-5.2')['score'] == 1449.1
coverage = data['groups']['researchqa-coverage']['rows']
assert next(r for r in coverage if r['model'] == 'sonar-deep-research')['score'] == 75.29
assert '20%' in next(r for r in coverage if r['model'] == 'o4-mini-deep-research')['agent']
assert {r['agent'].split(' · ')[0] for r in coverage if r['model'] == 'gpt-4.1'} == {'参数模型', '基础检索'}
assert {'enAf', 'enIl', 'zhAf', 'zhIl'} <= data['groups']['scidocbench']['rows'][0].keys()

# A failed source must retain its preceding data while successful sources refresh.
def broken():
    raise ValueError('unavailable')

def fresh():
    return {'new': {'rows': [{'model': 'new'}]}}

with tempfile.TemporaryDirectory() as directory:
    target = Path(directory) / 'data.js'
    old = {'groups': {'broken': {'rows': [{'model': 'previous'}]}}, 'failed': []}
    target.write_text(updater.PREFIX + json.dumps(old) + ';\n', encoding='utf8')
    with patch.object(updater, 'TARGET', target), patch.object(updater, 'LOADERS', [(('broken',), broken), (('new',), fresh)]):
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            assert updater.main() == 1
    result = read(target)
    assert result['failed'] == ['broken']
    assert result['groups']['broken'] == old['groups']['broken']
    assert result['groups']['new']['rows'][0]['model'] == 'new'

print('Literature benchmark data and source-failure preservation: OK')
