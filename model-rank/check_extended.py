"""Run with: python -B check_extended.py"""
import json
import update_extended as update

nature_rows = [
    {'name': f'Model {i}', 'harness': 'Agent', 'surpassSota': i * 5, 'matchSota': i * 10}
    for i in range(6)
]
nature_rows.append({'name': '25-task subset', 'harness': 'Agent', 'tracks': ['naturebench-25'], 'surpassSota': 99, 'matchSota': 99})
nature_data = {'benchmark': {'taskCount': 90}, 'leaderboard': nature_rows}
tasks = [{'task': f'task-{i}'} for i in range(48)]
models = [{'model_id': f'm{i}', 'candidate_name': f'Model {i}'} for i in range(5)]
runs = [{'model_id': m['model_id'], 'task': t['task'], 'verdict': 'PASS' if n < 12 else 'FAIL'}
        for m in models for n, t in enumerate(tasks)]
frontier_data = {'schema_version': 'fcs2-release-formal-results/v1-public', 'tasks': tasks,
                 'models': models, 'runs': runs, 'generated_at': '2026-10-27T07:09:52+00:00'}
api_data = {'data': [{'name': f'Model {i}', 'slug': f'model-{i}', 'evaluations': {'artificial_analysis_intelligence_index': i},
                      'model_creator': {'name': 'Provider'}} for i in range(5)]}


def fake_fetch(url, headers=None):
    if url == update.NATURE_URL:
        return 'window.NATUREBENCH_DATA = ' + json.dumps(nature_data) + ';', {'Last-Modified': 'Tue, 20 Oct 2026 07:03:09 GMT'}
    if url == update.FRONTIER_URL:
        return json.dumps(frontier_data), {}
    assert url == update.AA_URL and headers == {'x-api-key': 'example'}
    return json.dumps(api_data), {}


update.fetch = fake_fetch
nature = update.nature()['naturebench']
assert len(nature['rows']) == 6 and nature['rows'][0]['score'] == 25
assert nature['rows'][0]['matchRate'] == 50 and nature['dateLabel'] == '源文件修改'
frontier = update.frontier()['frontiercs2']
assert len(frontier['rows']) == 5 and all(row['score'] == 25 for row in frontier['rows'])
assert all(row['passed'] == 12 for row in frontier['rows'])
frontier_data['runs'][-1] = frontier_data['runs'][-2]
try:
    update.frontier()
    raise AssertionError('Duplicate task records must be rejected')
except ValueError:
    pass
aa = update.artificial_analysis('example')['aa-index']
assert aa['rows'][0]['model'] == 'Model 4' and aa['rows'][0]['score'] == 4
print('Extended source checks passed')
