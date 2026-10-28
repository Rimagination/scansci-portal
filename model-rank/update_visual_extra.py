"""Refresh visualization leaderboards and retain each source's scoring protocol."""
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

from source_tables import Tables

ROOT = Path(__file__).resolve().parent
TARGET = ROOT / 'visual-extra-data.js'
FIG_URL = 'https://arxiv.org/html/2610.10066v1'
TIDE_URL = 'https://arxiv.org/html/2604.22192v2'
TABLE_URL = 'https://tablebench.github.io/'
ACL_URL = 'https://aclanthology.org/2026.acl-long.616.pdf'

# ACL 2026 tables 3–5, transcribed from the publication PDF. Each triplet is
# execution rate, code-level LLM score, chart-level LMM score, respectively.
# The ACL publication differs from the arXiv version and the project website.
ACL_L1 = '''Gemini-3-Pro|思考设置未列明|97.50|75.86|45.42|100.0|69.76|40.72|99.07|71.12|32.85
Claude-Sonnet-4|思考设置未列明|96.52|70.69|32.36|100.0|55.03|40.63|93.52|65.99|26.44
GPT-5.2|思考设置未列明|97.08|77.88|43.73|97.22|65.51|39.26|99.07|71.42|35.40
Seed-1.5-VL|思考设置未列明|87.34|53.84|26.40|97.22|58.73|34.74|79.63|64.19|19.53
Seed-1.6-VL|思考设置未列明|82.61|50.85|26.16|94.44|57.87|28.44|79.63|63.12|25.51
LLaVA-OV-Qwen2-7B-SI|非思考|82.48|16.81|2.58|19.44|35.93|15.14|0.00|-|-
LLaVA-OV-Qwen2-7B-OV|非思考|72.60|54.85|3.42|8.33|15.67|6.00|0.00|-|-
DeepSeek-VL-7B|非思考|36.44|22.02|3.37|55.56|29.28|9.25|4.63|25.20|5.60
kimi-VL-A3B|论文表格标注非思考；checkpoint 名称含 Thinking|70.79|40.36|14.15|66.67|46.85|33.04|64.81|45.36|16.41
Qwen2-VL-7B|非思考|62.45|28.74|7.02|77.78|44.50|19.61|31.48|41.03|8.65
Qwen2-VL-72B|非思考|74.97|38.27|12.75|86.11|46.89|28.23|64.81|56.41|15.81
InternVL-2.5-8B|非思考|67.73|27.49|7.80|69.44|42.80|25.88|37.04|38.81|12.85
InternVL-2.5-38B|非思考|85.67|39.83|15.18|86.11|47.98|24.71|77.78|55.51|22.88
InternVL-3-8B|非思考|29.49|55.68|9.20|36.11|31.38|6.23|12.96|35.61|3.14
InternVL-3-38B|非思考|85.26|42.85|16.68|86.11|51.10|34.00|36.11|60.42|18.56
GLM-4V-9B|非思考|54.24|23.12|4.80|75.00|42.91|19.70|41.67|12.84|1.00
GLM-4.6v-Flash|非思考|54.52|55.38|31.70|61.11|52.75|32.45|55.56|60.23|22.57
Intern-VL-3.5-8B|非思考|72.18|41.29|15.41|69.44|14.58|1.68|49.07|48.85|10.87
Intern-VL-3.5-38B|非思考|84.01|42.54|19.78|86.11|53.16|38.83|24.07|60.69|21.84
MiMo-VL-7B-RL|非思考|43.12|49.82|21.43|66.67|52.21|25.38|42.59|57.68|21.44
MiMo-VL-7B-SFT|非思考|51.74|49.07|22.61|75.00|37.80|22.74|32.41|54.74|22.83
Qwen2.5-VL-7B|非思考|69.26|35.46|10.54|83.33|46.72|20.14|44.44|41.78|7.81
Qwen2.5-VL-72B|非思考|63.84|47.95|20.97|94.44|50.97|27.53|47.22|61.37|24.48
Molmo-7B-D|非思考|4.31|11.48|2.42|2.78|40.00|4.00|1.85|24.00|0.00
Qwen3-VL-30B-A3B|非思考|72.18|50.84|15.03|69.44|52.26|23.28|74.07|60.23|23.56
Qwen3-VL-32B|非思考|76.91|54.87|18.44|77.78|52.64|36.79|80.56|65.27|25.84
MiMo-VL-7B-RL|思考|21.14|60.00|30.04|75.00|57.96|24.96|37.96|64.38|29.83
MiMo-VL-7B-SFT|思考|41.03|54.33|16.95|77.78|53.89|29.93|37.96|56.04|23.29
Qwen3-VL-30B-A3B|思考|76.08|55.48|23.83|61.11|57.63|35.00|80.56|62.86|26.34'''
ACL_L2 = '''Gemini-3-Pro|思考设置未列明|97.23|72.21|33.41
Claude-Sonnet-4|思考设置未列明|90.20|66.45|25.40
GPT-5.2|思考设置未列明|96.04|75.66|33.03
Seed-1.5-VL|思考设置未列明|60.20|65.45|18.30
Seed-1.6-VL|思考设置未列明|70.00|65.40|17.43
LLaVA-OV-Qwen2-7B-SI|非思考|2.57|37.40|6.40
LLaVA-OV-Qwen2-7B-OV|非思考|1.68|35.44|7.35
DeepSeek-VL-7B|非思考|30.46|26.87|4.20
kimi-VL-A3B|论文表格标注非思考；checkpoint 名称含 Thinking|50.69|44.43|9.01
Qwen2-VL-7B|非思考|24.55|34.82|5.27
Qwen2-VL-72B|非思考|57.23|39.88|10.02
InternVL-2.5-8B|非思考|24.06|41.14|7.48
InternVL-2.5-38B|非思考|30.30|52.90|10.67
InternVL-3-8B|非思考|4.55|38.02|5.48
InternVL-3-38B|非思考|69.80|56.98|13.32
GLM-4V-9B|非思考|10.50|34.78|3.87
GLM-4.6V-Flash|非思考|18.22|63.25|17.91
InternVL-3.5-8B|非思考|37.52|49.52|9.71
InternVL-3.5-38B|非思考|4.26|57.48|8.28
MiMo-VL-7B-RL|非思考|17.23|56.95|14.54
MiMo-VL-7B-SFT|非思考|30.40|53.97|15.23
Qwen2.5-VL-7B|非思考|31.98|44.35|9.44
Qwen2.5-VL-72B|非思考|74.55|49.02|16.69
Molmo-7B-D|非思考|0.59|29.92|15.50
Qwen3-VL-30B-A3B|非思考|38.91|45.77|17.46
Qwen3-32B|非思考|63.76|64.15|18.27
MiMo-VL-7B-RL|思考|26.14|61.04|17.81
MiMo-VL-7B-SFT|思考|30.50|59.33|16.38
Qwen3-VL-30B-A3B|思考|13.76|63.04|14.37'''
ACL_L3 = '''Gemini-3-Pro|思考设置未列明|30.03|77.90|35.97
Claude-Sonnet-4|思考设置未列明|46.65|62.04|16.60
GPT-5.2|思考设置未列明|20.13|68.40|16.29
Seed-1.5-VL|思考设置未列明|10.86|75.59|22.85
Seed-1.6-VL|思考设置未列明|26.52|76.35|25.77'''


def fetch(url):
    with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0 ScanSci-ResearchIndex/1.0'}), timeout=35) as response:
        return response.read().decode('utf8')


def numeric(value):
    value = float(value)
    if not math.isfinite(value) or not 0 <= value <= 100:
        raise ValueError('Invalid score: ' + str(value))
    return value


def table(html, table_id, parser=Tables):
    page = parser()
    page.feed(html)
    return next(t['rows'] for t in page.tables if t['id'] == table_id)


def pack(source, date, date_label, rows):
    if not date or not rows:
        raise ValueError('Missing source date or rows')
    rows.sort(key=lambda row: -row['scoreRaw'])
    return {'source': source, 'updatedAt': date, 'dateLabel': date_label, 'rows': rows}


def figcode():
    raw = table(fetch(FIG_URL), 'S4.T7.4.1')
    if [c['text'] for c in raw[0]] != ['Model', 'Python', 'Matlab', 'R', 'Latex']:
        raise ValueError('FigCodeBench table header changed')
    if [c['text'] for c in raw[1]][3::4] != ['MMOS'] * 4:
        raise ValueError('FigCodeBench MMOS columns changed')
    source = FIG_URL + '#S4.T7'
    columns = [('figcode-python', 'Python', 4), ('figcode-matlab', 'MATLAB', 8),
               ('figcode-r', 'R', 12), ('figcode-latex', 'LaTeX', 16)]
    results = {key: [] for key, _, _ in columns}
    for row in raw[2:]:
        values = [c['text'] for c in row]
        if values[0] in ('Proprietary Models', 'Open-Source Models'):
            continue
        if len(values) != 17 or not values[0]:
            raise ValueError('Incomplete FigCodeBench row')
        for key, language, column in columns:
            score = numeric(values[column])
            results[key].append({'model': values[0], 'agent': 'FigCodeBench · ' + language, 'score': score, 'scoreRaw': score, 'source': source})
    if any(len(rows) != 24 for rows in results.values()):
        raise ValueError('Unexpected FigCodeBench result count')
    return {key: pack(source, '2026-10-07', '论文发布（固定结果）', rows) for key, rows in results.items()}


def charttide():
    raw = table(fetch(TIDE_URL), 'S3.T1.4.1')
    if [c['text'] for c in raw[0]] != ['Model', 'ChartMimic', 'Plot2Code*', 'ChartX'] or [c['text'] for c in raw[1]][:3] != ['Exec Rate', 'Low Level', 'High Level']:
        raise ValueError('CharTide table header changed')
    source = TIDE_URL + '#S3.T1'
    results = {'charttide-low': [], 'charttide-high': []}
    for row in raw[3:]:
        values = [c['text'] for c in row]
        if len(values) == 1 and values[0] in ('Proprietary Models', 'Open-Source General-Domain', 'Open-Source Chart-Domain'):
            continue
        if len(values) != 8 or not values[0]:
            raise ValueError('Incomplete CharTide row')
        execution = numeric(values[1])
        for key, column in [('charttide-low', 2), ('charttide-high', 3)]:
            score = numeric(values[column])
            results[key].append({'model': values[0], 'agent': f'CharTide 统一重测 · 执行率 {execution:g}%', 'score': score, 'scoreRaw': score, 'executionRate': execution, 'source': source})
    if any(len(rows) != 18 for rows in results.values()):
        raise ValueError('Unexpected CharTide result count')
    return {key: pack(source, '2026-06-09', '论文 v2 发布（固定结果）', rows) for key, rows in results.items()}


class AffiliationTables(Tables):
    """Preserve the source's method affiliation in addition to the name."""
    def __init__(self):
        super().__init__()
        self.affiliation = False

    def handle_starttag(self, tag, attrs):
        if tag == 'span' and 'affiliation' in dict(attrs).get('class', '').split() and self.cell is not None:
            self.affiliation = True
            super().handle_starttag('small', [])
        else:
            super().handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag == 'span' and self.affiliation:
            super().handle_endtag('small')
            self.affiliation = False
        else:
            super().handle_endtag(tag)


def tablebench():
    raw = table(fetch(TABLE_URL), 'ex-table', AffiliationTables)
    if [c['text'] for c in raw[0]] != ['', 'Model', 'FC', 'NR', 'DA', 'VIZ', 'Overall']:
        raise ValueError('TableBench methodology table changed')
    rows, dates = [], []
    for record in raw[1:]:
        values = [cell['text'] for cell in record]
        if values[1] == 'Human Performance':
            continue
        if len(values) != 7 or len(record[1]['smalls']) != 1:
            raise ValueError('Incomplete TableBench methodology row')
        affiliation = record[1]['smalls'][0]
        if not affiliation or not values[1].endswith(affiliation):
            raise ValueError('TableBench affiliation missing')
        name = values[1][:-len(affiliation)].strip()
        date = None
        for form in ('%B %d, %Y', '%b %d, %Y'):
            try:
                date = datetime.strptime(values[0], form).date().isoformat()
                break
            except ValueError:
                pass
        if not date or not name:
            raise ValueError('TableBench name or source date missing')
        score = numeric(values[5])
        kind = '模型与方法' if affiliation == 'baseline' or ' + ' in name else '方法或系统'
        rows.append({'model': name, 'agent': f'TableBench {kind} · {affiliation}', 'score': score, 'scoreRaw': score, 'sourceDate': date, 'source': TABLE_URL})
        dates.append(date)
    if len(rows) < 10:
        raise ValueError('TableBench results incomplete')
    return {'tablebench-viz': pack(TABLE_URL, max(dates), '原榜所列最新日期', rows)}


def chart2code():
    definitions = [
        ('chart2code-direct', ACL_L1, 0, 7), ('chart2code-custom-raw', ACL_L1, 3, 7),
        ('chart2code-custom-figure', ACL_L1, 6, 7), ('chart2code-edit', ACL_L2, 0, 8),
        ('chart2code-longtable', ACL_L3, 0, 8),
    ]
    results = {}
    for key, data, start, page in definitions:
        source = ACL_URL + '#page=' + str(page)
        rows = []
        for line in data.splitlines():
            name, mode, *values = line.split('|')
            if values[start + 2] == '-':
                continue
            execution, code_score, score = map(numeric, values[start:start + 3])
            rows.append({'model': name, 'agent': f'Chart2Code · {mode} · 执行率 {execution:g}%', 'score': score, 'scoreRaw': score, 'codeScore': code_score, 'executionRate': execution, 'source': source})
        expected = {'chart2code-direct': 29, 'chart2code-custom-raw': 29, 'chart2code-custom-figure': 27, 'chart2code-edit': 29, 'chart2code-longtable': 5}[key]
        if len(rows) != expected:
            raise ValueError('Unexpected ACL table row count: ' + key)
        results[key] = pack(source, '2026-07', 'ACL 论文出版（固定结果）', rows)
    return results


def main():
    try:
        old = json.loads(TARGET.read_text(encoding='utf8').removeprefix('window.VISUAL_EXTRA_DATA = ').removesuffix(';\n'))
    except (OSError, ValueError):
        old = {}
    groups = old.get('groups', {})
    groups.update(chart2code())
    failed = []
    for keys, loader in [(('figcode-python', 'figcode-matlab', 'figcode-r', 'figcode-latex'), figcode),
                         (('charttide-low', 'charttide-high'), charttide), (('tablebench-viz',), tablebench)]:
        try:
            groups.update(loader())
            print(loader.__name__, 'OK', flush=True)
        except (OSError, ValueError, KeyError, IndexError, StopIteration) as error:
            failed.extend(keys)
            print(loader.__name__, 'FAILED:', error, file=sys.stderr, flush=True)
    output = {'capturedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'groups': groups, 'failed': failed}
    temporary = TARGET.with_suffix('.js.tmp')
    temporary.write_text('window.VISUAL_EXTRA_DATA = ' + json.dumps(output, ensure_ascii=False, indent=2) + ';\n', encoding='utf8')
    temporary.replace(TARGET)
    return 1 if failed else 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        sys.exit(f'Update failed; existing snapshot was not replaced: {error}')
