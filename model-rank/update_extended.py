"""Refresh independent scientific and general benchmark sources."""
import json
import math
import os
import sys
from collections import Counter
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
TARGET = ROOT / 'extended-data.js'
NATURE_URL = 'https://frontisai.github.io/NatureBench/naturebench-data.js'
FRONTIER_URL = 'https://huggingface.co/datasets/FrontierCS2/FrontierCS-2-runs/resolve/main/metadata/formal-results.json'
AA_URL = 'https://artificialanalysis.ai/api/v2/language/models/free'


def fetch(url, headers=None):
    request = Request(url, headers={'User-Agent': 'ScanSci-ResearchIndex/1.0', **(headers or {})})
    with urlopen(request, timeout=40) as response:
        return response.read().decode('utf8'), dict(response.headers)


def numeric(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= 100:
        raise ValueError('Invalid benchmark score')
    return float(value)


def nature():
    text, headers = fetch(NATURE_URL)
    data = json.loads(text.strip().removeprefix('window.NATUREBENCH_DATA = ').removesuffix(';'))
    if data['benchmark']['taskCount'] != 90:
        raise ValueError('NatureBench task count changed; review before refreshing')
    source = 'https://frontisai.github.io/NatureBench/'
    rows = []
    for item in data['leaderboard']:
        tracks = item.get('tracks')
        if tracks and 'full' not in tracks:
            continue
        value = numeric(item['surpassSota'])
        rows.append({'model': item['name'], 'agent': item['harness'], 'score': round(value, 2),
                     'scoreRaw': value, 'matchRate': numeric(item['matchSota']), 'source': source})
    if len(rows) < 5 or not headers.get('Last-Modified'):
        raise ValueError('Incomplete NatureBench data or missing file date')
    rows.sort(key=lambda row: -row['scoreRaw'])
    date = parsedate_to_datetime(headers['Last-Modified']).isoformat()
    return {'naturebench': {'source': source, 'updatedAt': date, 'dateLabel': '源文件修改',
                            'metric': '超越论文 SOTA 比例 %',
                            'description': '90 个科学机器学习任务；仅包含完整赛道。超过论文基准 10% 的有效任务计为超越，达标比例包含超越的任务。模型、智能体与执行预算共同影响成绩。',
                            'rows': rows}}


def frontier():
    text, _ = fetch(FRONTIER_URL)
    data = json.loads(text)
    if data.get('schema_version') != 'fcs2-release-formal-results/v1-public':
        raise ValueError('Unknown FrontierCS result schema')
    tasks = {item['task'] for item in data['tasks']}
    models = data['models']
    if len(tasks) != 48 or len(models) < 5:
        raise ValueError('FrontierCS task set changed; review before refreshing')
    runs = data['runs']
    counts = Counter(item['model_id'] for item in runs)
    by_model = {}
    for item in runs:
        by_model.setdefault(item['model_id'], []).append(item)
    source = 'https://frontier-cs.org/'
    rows = []
    for item in models:
        model_id = item['model_id']
        entries = by_model.get(model_id, [])
        if counts[model_id] != len(tasks) or {row['task'] for row in entries} != tasks:
            raise ValueError('Incomplete or duplicated FrontierCS task results')
        passed = sum(row.get('verdict') == 'PASS' for row in entries)
        value = passed * 100 / len(tasks)
        rows.append({'model': item['candidate_name'], 'agent': 'FrontierCS 2 · 48 项',
                     'score': round(value, 2), 'scoreRaw': value, 'passed': passed, 'source': source})
    rows.sort(key=lambda row: -row['scoreRaw'])
    return {'frontiercs2': {'source': source, 'updatedAt': data['generated_at'], 'dateLabel': '结果文件生成',
                            'metric': '超过参考实现的任务比例 %',
                            'description': '48 个计算机科学研究任务；每项通过需在所有隐藏测试中超过论文参考实现。结果反映模型与编程智能体组合。',
                            'rows': rows}}


def artificial_analysis(key):
    page = 1
    total_pages = None
    index_version = None
    seen = set()
    rows = []
    while total_pages is None or page <= total_pages:
        text, _ = fetch(f'{AA_URL}?page={page}', {'x-api-key': key})
        data = json.loads(text)
        pagination = data.get('pagination')
        if not isinstance(pagination, dict):
            raise ValueError('Artificial Analysis pagination missing')
        current_page = pagination.get('page')
        page_total = pagination.get('total_pages')
        has_more = pagination.get('has_more')
        if (isinstance(current_page, bool) or current_page != page
                or isinstance(page_total, bool) or not isinstance(page_total, int)
                or not 1 <= page_total <= 100 or not isinstance(has_more, bool)):
            raise ValueError('Invalid Artificial Analysis pagination')
        if total_pages is None:
            total_pages = page_total
        elif page_total != total_pages:
            raise ValueError('Artificial Analysis page count changed during refresh')
        if has_more != (page < total_pages):
            raise ValueError('Inconsistent Artificial Analysis pagination')

        version = data.get('intelligence_index_version')
        if (isinstance(version, bool) or not isinstance(version, (int, float))
                or not math.isfinite(version) or version <= 0):
            raise ValueError('Artificial Analysis index version missing or invalid')
        if index_version is None:
            index_version = float(version)
        elif float(version) != index_version:
            raise ValueError('Artificial Analysis index version changed during refresh')

        models = data.get('data')
        if not isinstance(models, list) or not models:
            raise ValueError('Artificial Analysis model page is empty or invalid')
        for item in models:
            if not isinstance(item, dict):
                raise ValueError('Invalid Artificial Analysis model row')
            model_id = item.get('id')
            if not isinstance(model_id, str) or not model_id or model_id in seen:
                raise ValueError('Missing or duplicate Artificial Analysis model ID')
            seen.add(model_id)
            slug = item.get('slug')
            name = item.get('name')
            creator = item.get('model_creator')
            evaluations = item.get('evaluations')
            if (not isinstance(slug, str) or not slug or not isinstance(name, str) or not name
                    or not isinstance(creator, dict) or not isinstance(evaluations, dict)):
                raise ValueError('Incomplete Artificial Analysis model metadata')
            value = evaluations.get('artificial_analysis_intelligence_index')
            if value is None:
                continue
            value = numeric(value)
            rows.append({'model': name, 'provider': creator.get('name', ''),
                         'agent': 'Artificial Analysis', 'score': round(value, 2), 'scoreRaw': value,
                         'source': 'https://artificialanalysis.ai/models/' + slug})
        page += 1
    if len(rows) < 5:
        raise ValueError('Incomplete Artificial Analysis API results')
    rows.sort(key=lambda row: -row['scoreRaw'])
    return {'aa-index': {'source': 'https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index',
                         'updatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
                         'dateLabel': '数据采集', 'metric': 'Intelligence Index',
                         'indexVersion': index_version,
                         'description': f'Artificial Analysis 的独立 Intelligence Index；API 指数版本 v{index_version:.1f}（不含补丁版本），以原榜当前方法为准。',
                         'rows': rows}}


def main():
    try:
        old = json.loads(TARGET.read_text(encoding='utf8').removeprefix('window.EXTENDED_DATA = ').removesuffix(';\n'))
    except (OSError, ValueError):
        old = {}
    groups = old.get('groups', {})
    failed = []
    sources = [(('naturebench',), nature), (('frontiercs2',), frontier)]
    key = os.environ.get('ARTIFICIAL_ANALYSIS_API_KEY', '').strip()
    if key:
        sources.append((('aa-index',), lambda: artificial_analysis(key)))
    elif 'aa-index' in groups:
        failed.append('aa-index')
    for keys, load in sources:
        try:
            groups.update(load())
            print(', '.join(keys), 'OK', flush=True)
        except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
            failed.extend(keys)
            print(', '.join(keys), 'FAILED:', error, file=sys.stderr, flush=True)
    out = {'capturedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'groups': groups, 'failed': failed}
    if not groups:
        raise ValueError('No valid extended leaderboard; snapshot not replaced')
    temp = TARGET.with_suffix('.js.tmp')
    temp.write_text('window.EXTENDED_DATA = ' + json.dumps(out, ensure_ascii=False, indent=2) + ';\n', encoding='utf8')
    temp.replace(TARGET)
    return 1 if any(name != 'aa-index' or key for name in failed) else 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        sys.exit(f'Update failed; existing snapshot was not replaced: {error}')
