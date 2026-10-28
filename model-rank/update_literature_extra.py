"""Refresh literature benchmarks; preserve each source's last valid snapshot on failure."""
import json
import math
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from urllib.request import Request, urlopen

from source_tables import Tables

ROOT = Path(__file__).resolve().parent
TARGET = ROOT / 'literature-extra-data.js'
PREFIX = 'window.LITERATURE_EXTRA_DATA = '
AUTO_URL = 'https://cheryou.github.io/autoresearchbench.github.io/'
SCIDOC_RAW = 'https://raw.githubusercontent.com/InternLM/SciDocBench/main/README.md'
SCIDOC_URL = 'https://github.com/InternLM/SciDocBench#leaderboard'
LIT_URL = 'https://arxiv.org/html/2608.21374v2'
RQA_URL = 'https://arxiv.org/html/2509.00496v2'


def fetch(url):
    with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0 ScanSci-ResearchIndex/1.0'}), timeout=35) as response:
        return response.read().decode('utf8')


def number(value, lower=0, upper=None):
    result = float(value)
    if not math.isfinite(result) or result < lower or (upper is not None and result > upper):
        raise ValueError('Invalid score: ' + str(value))
    return result


def group(source, date, label, metric, description, rows, minimum):
    if len(rows) < minimum or len({(r['model'], r['agent']) for r in rows}) != len(rows):
        raise ValueError('Incomplete or duplicate results: ' + source)
    return {'source': source, 'updatedAt': date, 'dateLabel': label, 'metric': metric,
            'description': description, 'rows': sorted(rows, key=lambda row: -row['scoreRaw'])}


def autoresearch():
    html = fetch(AUTO_URL)
    match = re.search(r'\bconst\s+LB_DATA\s*=\s*\[(.*?)\];', html, re.S)
    if not match:
        raise ValueError('AutoResearchBench model table missing')
    objects = re.findall(r'\{([^{}]*)\}', match.group(1))
    data = []
    for obj in objects:
        pairs = re.findall(r'\b([a-z_]+)\s*:\s*("(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?|null)', obj)
        fields = {key: json.loads(value) for key, value in pairs}
        if not fields.get('name') or fields.get('type') not in ('open', 'closed'):
            raise ValueError('Invalid AutoResearchBench model')
        data.append(fields)
    out = {}
    for key, prefix, field, metric, description in [
        ('autoresearch-deep', 'ds', 'ds_acc', '准确率 %', '面向计算机科学文献定位指定论文；统一 ReAct 智能体与 DeepXiv 检索工具。'),
        ('autoresearch-wide', 'ws', 'ws_iou', 'IoU %', '面向计算机科学文献收集符合条件的论文集合；统一 ReAct 智能体与 DeepXiv 检索工具。')]:
        rows = []
        for item in data:
            if item.get(field) is None:
                continue
            # The source stores a ratio and displays it as a percentage.
            value = float(Decimal(str(number(item[field], upper=1))) * 100)
            row = {'model': item['name'], 'agent': 'ReAct · DeepXiv', 'score': value, 'scoreRaw': value,
                   'source': AUTO_URL + '#leaderboard', 'modelType': item['type']}
            for field_name, suffix in [('timeSeconds', 'time'), ('tokens', 'tok'), ('turns', 'turns'), ('calls', 'tc')]:
                if item.get(prefix + '_' + suffix) is not None:
                    row[field_name] = number(item[prefix + '_' + suffix])
            rows.append(row)
        out[key] = group(AUTO_URL + '#leaderboard', '2026-04-28', '相关论文 v1 发布（原榜未列更新日期）',
                         metric, description, rows, 13)
    return out


def scidoc():
    readme = fetch(SCIDOC_RAW)
    section = re.search(r'(?ms)^## Leaderboard\s*\n(.*?)(?=^## |\Z)', readme)
    if not section:
        raise ValueError('SciDocBench leaderboard missing')
    lines = [line.strip() for line in section.group(1).splitlines() if line.strip().startswith('|')]
    parse_line = lambda line: [cell.strip().strip('*') for cell in line.strip('|').split('|')]
    if len(lines) < 3 or parse_line(lines[0]) != ['Rank', 'Model', 'Overall', 'EN-AF', 'EN-IL', 'ZH-AF', 'ZH-IL']:
        raise ValueError('SciDocBench leaderboard headers changed')
    rows = []
    for line in lines[2:]:
        cells = parse_line(line)
        if len(cells) != 7 or not cells[0].isdigit() or not cells[1]:
            raise ValueError('Invalid SciDocBench row')
        values = [number(x, upper=100) for x in cells[2:]]
        rows.append({'model': cells[1], 'agent': 'SciDocBench · 496 个测评实例', 'score': values[0],
                     'scoreRaw': values[0], 'enAf': values[1], 'enIl': values[2], 'zhAf': values[3],
                     'zhIl': values[4], 'source': SCIDOC_URL})
    return {'scidocbench': group(SCIDOC_URL, '2026-09-28', '相关论文 v2 发布（原榜未列更新日期）',
             '综合分 / 100', '124 道底题衍生 496 个中英文及文档呈现实例；规则、模型和执行评估混合，失败或不可用回答计零。', rows, 13)}


def table(url, table_id):
    parser = Tables()
    parser.feed(fetch(url))
    item = next((t for t in parser.tables if t['id'] == table_id), None)
    if item is None:
        raise ValueError('Missing table ' + table_id)
    return [[c['text'] for c in row] for row in item['rows']]


def litreview():
    data = table(LIT_URL, 'S4.T1.3')
    header = ['Category', 'Methods', 'Token Cost/Query', 'Literature Coverage', 'Claim Support', 'Paper Structure', 'Research Suggestions', 'Overall Utility']
    if not data or data[0] != header:
        raise ValueError('LitReview Arena Table 1 headers changed')
    # The paper puts each category name on its final Average row.
    classified, pending = [], []
    for cells in data[1:]:
        if len(cells) != 8:
            raise ValueError('Invalid LitReview Arena row')
        if cells[0] == 'Human':
            classified.append((cells, '人工参考 · 人类作者综述'))
        elif cells[1] == 'Average':
            category = {'Agentic Models': '智能体系统', 'Language Models': '语言模型'}.get(cells[0])
            if not category or not pending:
                raise ValueError('Invalid LitReview Arena category')
            classified.extend((row, category) for row in pending)
            pending = []
        else:
            pending.append(cells)
    if pending or len(classified) != 10 or sum(kind.startswith('人工参考') for _, kind in classified) != 1:
        raise ValueError('Incomplete LitReview Arena results')
    source = LIT_URL + '#S4.T1'
    result = {}
    for index, key, metric in [(3, 'litreview-coverage', '文献覆盖 · 专家偏好 Elo'),
                               (4, 'litreview-support', '论据支持 · 专家偏好 Elo'),
                               (5, 'litreview-structure', '论文结构 · 专家偏好 Elo'),
                               (6, 'litreview-suggestions', '研究建议 · 专家偏好 Elo'),
                               (7, 'litreview-utility', '总体效用 · 专家偏好 Elo')]:
        rows = []
        for cells, kind in classified:
            value = number(cells[index])
            rows.append({'model': cells[1], 'agent': kind, 'isHuman': cells[0] == 'Human', 'score': value,
                         'scoreRaw': value, 'tokensPerQuery': cells[2], 'source': source})
        result[key] = group(source, '2026-09-28', '论文 v2 发布（固定结果）', metric,
                            'AI 领域综述草稿经专家匿名两两比较，Bradley–Terry/Elo 聚合；人类综述为参考，均值行不计入排名。', rows, 10)
    return result


def pair(value):
    match = re.match(r'^\s*(\d+(?:\.\d+)?)\s*±(?:\\pm)?\s*(\d+(?:\.\d+)?)', value)
    if not match:
        raise ValueError('Invalid ResearchQA score: ' + value)
    return tuple(number(part) for part in match.groups())


def researchqa():
    data = table(RQA_URL, 'S3.T3.2')
    if not data or data[0][0] != 'System' or 'Coverage' not in data[0][2] or 'Leaderboard' not in data[0][4]:
        raise ValueError('ResearchQA Table 3 headers changed')
    source = RQA_URL + '#S3.T3'
    # Superscript markers are concatenated into the model name by the HTML table reader.
    naive = {'openscholar-8bi': ('openscholar-8b', 'openscholar-retrieve + openscholar-reranker'),
             'gemini-2.5-proii': ('gemini-2.5-pro', 'text-embedding-004'),
             'qwen-3-32biii': ('qwen-3-32b', 'gte-qwen-2-7b-instruct'),
             'claude-4-sonnetiv': ('claude-4-sonnet', 'voyage-3-large'),
             'gpt-4.1v': ('gpt-4.1', 'text-embedding-3-large')}
    categories = {'Parametric': '参数模型', 'Retrieval (Naive)': '基础检索',
                  'Retrieval (Production)': '生产检索', 'Deep Research': '深度研究'}
    category = None
    rows_by_metric = {'researchqa-coverage': [], 'researchqa-preference': []}
    for cells in data[2:]:
        if len(cells) != 14:
            raise ValueError('Invalid ResearchQA Table 3 row')
        if cells[0] in categories and not cells[2]:
            category = cells[0]
            continue
        if category is None or not cells[0] or not cells[2]:
            raise ValueError('Missing ResearchQA system category or score')
        name, agent = cells[0], categories[category]
        if category == 'Retrieval (Naive)':
            if name not in naive:
                raise ValueError('Unknown ResearchQA retrieval configuration: ' + name)
            name, embed = naive[name]
            agent += ' · ' + embed
        if name.endswith('†'):
            name = name.removesuffix('†')
            agent += ' · 约 20% 测试集抽样'
        coverage, coverage_uncertainty = pair(cells[2])
        preference, preference_uncertainty = pair(cells[11])
        if coverage > 100:
            raise ValueError('Invalid ResearchQA coverage')
        domains = [number(value, upper=100) for value in cells[3:10]]
        base = {'model': name, 'agent': agent, 'source': source, 'coverageUncertainty': coverage_uncertainty,
                'preferenceUncertainty': preference_uncertainty, 'averageWords': number(cells[13]),
                'domainCoverage': dict(zip(['health', 'lifeEarth', 'engineeringCS', 'physical', 'social', 'humanities', 'economics'], domains))}
        for key, value in [('researchqa-coverage', coverage), ('researchqa-preference', preference)]:
            rows_by_metric[key].append({**base, 'score': value, 'scoreRaw': value})
    description = ('跨 75 个研究领域；回答要求约 250 词并受文献日期约束。gpt-4.1-mini 基于混合评分规则与两两比较评估；'
                   '参数模型、检索系统和深度研究系统配置不同；o4-mini 仅抽样约 20%。')
    return {key: group(source, '2025-12-19', '论文 v2 发布（固定结果）', metric, description, rows_by_metric[key], 18)
            for key, metric in [('researchqa-coverage', '评分规则覆盖率 %'), ('researchqa-preference', 'LLM 裁判偏好 Elo')]}


LOADERS = [
    (('autoresearch-deep', 'autoresearch-wide'), autoresearch),
    (('scidocbench',), scidoc),
    (('litreview-coverage', 'litreview-support', 'litreview-structure', 'litreview-suggestions', 'litreview-utility'), litreview),
    (('researchqa-coverage', 'researchqa-preference'), researchqa),
]


def main():
    try:
        text = TARGET.read_text(encoding='utf8')
        if not text.startswith(PREFIX) or not text.rstrip().endswith(';'):
            raise ValueError('Invalid existing data file')
        old = json.loads(text[len(PREFIX):].rstrip()[:-1])
    except (OSError, ValueError):
        old = {}
    groups = old.get('groups', {})
    failed = []
    with ThreadPoolExecutor(max_workers=len(LOADERS)) as executor:
        pending = [(keys, load, executor.submit(load)) for keys, load in LOADERS]
        for keys, load, future in pending:
            try:
                fresh = future.result()
                if set(fresh) != set(keys):
                    raise ValueError('Source returned incomplete groups')
                groups.update(fresh)
                print(load.__name__, 'OK', flush=True)
            except Exception as error:
                failed.extend(keys)
                print(load.__name__, 'FAILED:', error, file=sys.stderr, flush=True)
    if not groups:
        raise ValueError('No valid literature benchmark; snapshot not replaced')
    out = {'capturedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'groups': groups, 'failed': failed}
    temp = TARGET.with_suffix('.js.tmp')
    temp.write_text(PREFIX + json.dumps(out, ensure_ascii=False, indent=2) + ';\n', encoding='utf8')
    temp.replace(TARGET)
    return 1 if failed else 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        sys.exit(f'Update failed; existing snapshot was not replaced: {error}')
