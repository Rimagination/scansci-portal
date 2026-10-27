import json, math, sys, time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

API = 'https://huggingface.co/api/datasets/allenai/asta-bench-results/tree/main?recursive=true&expand=false'
BASE = 'https://huggingface.co/datasets/allenai/asta-bench-results/resolve/main/'
TASKS = {
    'PaperFindingBench_test': ('literature', 'score_paper_finder/adjusted_f1_micro_avg'),
    'LitQA2_FullText_test': ('reading', 'is_correct/accuracy'),
    'ScholarQA_CS2_test': ('writing', 'global_avg/mean'),
    'DiscoveryBench_test': ('discovery', 'score_discoverybench/mean'),
    'CORE_Bench_Hard_test': ('reproduction', 'score_with_stderr/accuracy'),
    'ArxivDIGESTables_Clean_test': ('tables', 'score_tables/mean'),
}
def load(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={'User-Agent': 'ScanSci-ResearchIndex/1.0'}), timeout=60) as f:
                return json.load(f)
        except (OSError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(1 + attempt * 2)
def parse(path):
    source = BASE + quote(path, safe='/')
    d = load(source)
    if d.get('split') != 'test' or d.get('suite_config', {}).get('version') != '1.0.0':
        raise ValueError(f'Unexpected suite or split: {path}')
    submission = d.get('submission') or {}
    agent = submission.get('agent_name') or '未标注智能体'
    found = []
    for result in d.get('results', []):
        task = TASKS.get(result.get('task_name'))
        if not task:
            continue
        metrics = {m.get('name'): m.get('value') for m in result.get('metrics', [])}
        value = metrics.get(task[1])
        if not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= 1:
            continue
        spec = result.get('eval_spec') or {}
        model = spec.get('model') or '未公开模型'
        found.append((task[0], {'model': model, 'agent': agent, 'score': round(value * 100, 2), 'scoreRaw': value, 'metric': task[1], 'source': source, 'submittedAt': submission.get('submit_time'), 'modelArgs': spec.get('model_args') or '{}'}))
    return found

def main():
    files = [x['path'] for x in load(API) if x.get('type') == 'file' and x.get('path', '').startswith('1.0.0/test/') and x['path'].endswith('.json')]
    if len(files) < 5:
        raise ValueError('Too few result files; existing snapshot was not replaced')
    groups = {name: [] for name, _ in TASKS.values()}
    with ThreadPoolExecutor(max_workers=6) as pool:
        for rows in pool.map(parse, files):
            for name, row in rows:
                groups[name].append(row)
    if any(len(group) < 2 for group in groups.values()):
        raise ValueError('Missing core benchmark results; existing snapshot was not replaced')
    for rows in groups.values():
        rows.sort(key=lambda x: -x['scoreRaw'])
    output = {'source': 'https://huggingface.co/datasets/allenai/asta-bench-results', 'suite': '1.0.0', 'split': 'test', 'capturedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'fileCount': len(files), 'groups': groups}
    target = Path(__file__).parent / 'asta-data.js'
    temporary = target.with_suffix('.js.tmp')
    temporary.write_text('window.ASTA_DATA = ' + json.dumps(output, ensure_ascii=False, indent=2) + ';\n', encoding='utf8')
    temporary.replace(target)
    print('AstaBench test records:', {name: len(rows) for name, rows in groups.items()})
if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        sys.exit(f'Update failed; existing snapshot was not replaced: {e}')
