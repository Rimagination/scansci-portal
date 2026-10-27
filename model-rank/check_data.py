"""Run with: python check_data.py"""
import json
from pathlib import Path
import update_asta

sample = {
    'suite_config': {'version': '1.0.0'}, 'split': 'test',
    'submission': {'agent_name': 'Sample agent', 'submit_time': '2026-01-01'},
    'results': [
        {'task_name': 'PaperFindingBench_test', 'eval_spec': {'model': 'openai/sample'},
         'metrics': [{'name': 'score_paper_finder/adjusted_f1_micro_avg', 'value': .42}]},
        {'task_name': 'LitQA2_FullText_test', 'eval_spec': {},
         'metrics': [{'name': 'is_correct/accuracy', 'value': None}]},
    ],
}
update_asta.load = lambda _url: sample
rows = update_asta.parse('1.0.0/test/sample.json')
assert len(rows) == 1 and rows[0][0] == 'literature'
assert rows[0][1]['score'] == 42 and rows[0][1]['model'] == 'openai/sample'
assert rows[0][1]['source'].endswith('/1.0.0/test/sample.json')
sample['split'] = 'validation'
try:
    update_asta.parse('1.0.0/test/sample.json')
    raise AssertionError('Validation split must be rejected')
except ValueError:
    pass

text = (Path(__file__).parent / 'asta-data.js').read_text(encoding='utf8')
data = json.loads(text.removeprefix('window.ASTA_DATA = ').removesuffix(';\n'))
assert data['suite'] == '1.0.0' and data['split'] == 'test'
for name, group in data['groups'].items():
    assert group, name
    assert all(0 <= row['scoreRaw'] <= 1 and row['score'] == round(row['scoreRaw'] * 100, 2) for row in group)
    assert all(a['scoreRaw'] >= b['scoreRaw'] for a, b in zip(group, group[1:]))
    assert all(row['source'].startswith(update_asta.BASE) for row in group)
print('AstaBench parser and snapshot checks passed')
