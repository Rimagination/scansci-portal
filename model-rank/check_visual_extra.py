"""Run with: python -B check_visual_extra.py"""
import json
from pathlib import Path
from tempfile import TemporaryDirectory

import update_visual_extra as update

raw = (Path(__file__).parent / 'visual-extra-data.js').read_text(encoding='utf8')
data = json.loads(raw.removeprefix('window.VISUAL_EXTRA_DATA = ').removesuffix(';\n'))
groups = data['groups']
counts = {'figcode-python': 24, 'figcode-matlab': 24, 'figcode-r': 24, 'figcode-latex': 24,
          'charttide-high': 18, 'charttide-low': 18, 'chart2code-direct': 29,
          'chart2code-custom-raw': 29, 'chart2code-custom-figure': 27,
          'chart2code-edit': 29, 'chart2code-longtable': 5}
assert set(data['failed']) <= {'figcode-python', 'figcode-matlab', 'figcode-r', 'figcode-latex', 'charttide-high', 'charttide-low', 'tablebench-viz'}
for key, count in counts.items():
    assert len(groups[key]['rows']) == count
for group in groups.values():
    assert group['updatedAt'] and group['dateLabel']
    assert all(row['model'] and row['agent'] and row['source'].startswith('https://') and 0 <= row['score'] <= 100 for row in group['rows'])
    assert all(a['scoreRaw'] >= b['scoreRaw'] for a, b in zip(group['rows'], group['rows'][1:]))

def row(group, model):
    return next(item for item in groups[group]['rows'] if item['model'] == model)

assert row('figcode-r', 'Kimi-K2.5')['score'] == 72.52
assert row('charttide-high', 'GPT-5')['score'] == 94.7
assert row('charttide-low', 'GPT-5')['score'] == 82.1
assert row('charttide-high', 'GPT-5')['executionRate'] == 96.8
assert row('chart2code-edit', 'GPT-5.2')['score'] == 33.03
assert row('chart2code-edit', 'GPT-5.2')['codeScore'] == 75.66
assert row('chart2code-edit', 'Gemini-3-Pro')['score'] == 33.41
assert row('chart2code-longtable', 'GPT-5.2')['executionRate'] == 20.13
html = '<table id="ex-table"><tr><th></th><th>Model</th><th>FC</th><th>NR</th><th>DA</th><th>VIZ</th><th>Overall</th></tr>'
for index in range(10):
    name, affiliation = ('AskRUI', 'Dipeak') if index == 0 else ('GPT-5 + DP', 'baseline')
    html += f'<tr><td>October 13, 2026</td><td>{name}<br><span class="affiliation">{affiliation}</span></td><td>98</td><td>97</td><td>77</td><td>94</td><td>84</td></tr>'
html += '</table>'
update.fetch = lambda url: html
parsed = update.tablebench()['tablebench-viz']['rows']
assert parsed[0]['model'] == 'AskRUI' and parsed[0]['score'] == 94
assert '方法或系统 · Dipeak' in parsed[0]['agent']
assert parsed[1]['agent'].startswith('TableBench 模型与方法')

# A temporary source outage must retain the last successfully fetched paper rows.
with TemporaryDirectory() as directory:
    update.TARGET = Path(directory) / 'snapshot.js'
    update.TARGET.write_text(raw, encoding='utf8')
    def unavailable():
        raise OSError('offline')
    update.figcode = unavailable
    update.charttide = update.tablebench = lambda: {}
    assert update.main() == 1
    saved = json.loads(update.TARGET.read_text(encoding='utf8').removeprefix('window.VISUAL_EXTRA_DATA = ').removesuffix(';\n'))
    assert saved['groups']['figcode-r'] == groups['figcode-r']
    assert saved['failed'] == ['figcode-python', 'figcode-matlab', 'figcode-r', 'figcode-latex']

print('Visualization snapshots preserve source scores, execution rates, configuration labels, and failed-source data')
