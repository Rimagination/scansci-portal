"""Refresh newer source-backed research leaderboards without discarding a failed source."""
import json, math, re, sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from source_tables import Tables

ROOT = Path(__file__).resolve().parent
TARGET = ROOT / 'recent-data.js'

def fetch(url):
    with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0 ScanSci-ResearchIndex/1.0'}), timeout=35) as response:
        return response.read().decode('utf8')

def table_page(url):
    parser = Tables()
    parser.feed(fetch(url))
    return parser

def rows_for(parser, header):
    for table in parser.tables:
        if table['rows'] and [cell['text'] for cell in table['rows'][0]][:len(header)] == header:
            return [[cell['text'] for cell in row] for row in table['rows'][1:]]
    raise ValueError('Leaderboard headers not found: ' + str(header))

def score(value):
    result = float(value.strip().removesuffix('%'))
    if not math.isfinite(result) or not 0 <= result <= 100:
        raise ValueError('Invalid score')
    return result

def pack(source, date, label, rows):
    if not date or len(rows) < 5:
        raise ValueError('Missing source date or incomplete leaderboard')
    rows.sort(key=lambda row: -row['scoreRaw'])
    return {'source': source, 'updatedAt': date, 'dateLabel': label, 'rows': rows}

def swescience():
    url = 'https://swescience.github.io/'
    page = table_page(url)
    result = []
    for row in rows_for(page, ['Rank', 'LLM', 'Harness', 'Public', 'Private', 'Fail2Pass', 'Pass2Pass', 'Overall ↓']):
        if len(row) < 8: raise ValueError('Incomplete SWE-bench Science row')
        value = score(row[7])
        result.append({'model': row[1], 'agent': row[2], 'score': value, 'scoreRaw': value, 'source': url})
    return {'swescience': pack(url, page.times[0], '原榜更新', result)}

def paperbench():
    url = 'https://pipelinelab.ai/blog/paperbench-expanded/'
    page = table_page(url)
    result = []
    for row in rows_for(page, ['Agent', 'Full rate', 'Partial score', 'Modeling', 'Execution', 'Validation', 'Avg turns']):
        if len(row) < 3: raise ValueError('Incomplete PaperBench Science row')
        value = score(row[2])
        result.append({'model': row[0], 'agent': 'PaperBench Science', 'score': value, 'scoreRaw': value, 'fullRate': score(row[1]), 'source': url})
    return {'paperbench-science': pack(url, page.times[0], '原文发布', result)}

def scifigure():
    url = 'https://arxiv.org/html/2609.08155v1'
    page = table_page(url)
    result = {}
    for key, table_id, anchor in [('scifigure-image', 'S6.T3.6', 'S6.T3'), ('scifigure-caption', 'S6.T4.6', 'S6.T4')]:
        table = next((t for t in page.tables if t['id'] == table_id), None)
        if not table: raise ValueError('SciFigure2Code table missing: ' + table_id)
        table_rows = [[c['text'] for c in row] for row in table['rows']]
        if table_rows[0] != ['Model', 'Valid', 'Visual', 'Type', 'Layout', 'Comp.', 'Legend', 'Clarity', 'Overall']:
            raise ValueError('SciFigure2Code headers changed')
        rows = []
        for row in table_rows[1:]:
            if len(row) == 1: continue
            if len(row) != 9: raise ValueError('Incomplete SciFigure2Code row')
            value = score(row[8])
            rows.append({'model': row[0], 'agent': 'SciFigure2Code', 'score': value, 'scoreRaw': value, 'source': url + '#' + anchor})
        result[key] = pack(url + '#' + anchor, '2026-09-08', '论文发布', rows)
    return result

def writing():
    url = 'https://aiwritingbenchmark.com/data/leaderboard-page.json'
    source = 'https://aiwritingbenchmark.com/leaderboard/'
    data = json.loads(fetch(url))
    rows = []
    for row in data['rows']:
        if row.get('lifecycle_key') not in ('current', 'previous') or row.get('duel_score_100') is None: continue
        value = score(str(row['duel_score_100']))
        model = row['base_name']
        setting = row.get('reasoning_level') or row.get('reasoning_mode') or '未列出'
        rows.append({'model': model, 'agent': '英文写作 · ' + setting, 'provider': row.get('publisher_name') or '', 'score': value, 'scoreRaw': value, 'source': source})
    return {'english-writing': pack(source, data['stats']['updated_at'], '原榜更新', rows)}

def scicon():
    source = 'https://sciconbench.cs.princeton.edu/'
    data = json.loads(fetch(source + 'data/dashboard.json'))
    month = data['summary']['latest_run_month']
    rows = []
    for item in data['leaderboard']:
        if item.get('run_month') != month or item.get('f1') is None: continue
        value = score(str(float(item['f1']) * 100))
        rows.append({'model': item['display_name'], 'agent': 'SciConBench · ' + str(item['reviews']) + ' 篇综述', 'provider': item.get('provider_label', ''), 'score': round(value, 2), 'scoreRaw': value, 'source': source})
    return {'sciconbench': pack(source, month, '最近评测月份', rows)}

def terminal_science():
    url = 'https://vals-ai.com/benchmarks/terminal-bench-science'
    html = fetch(url)
    page = Tables()
    page.feed(html)
    updated = re.search(r'Updated\s+(\d{1,2})/(\d{1,2})/(\d{4})', html)
    if not updated: raise ValueError('Terminal-Bench Science update date missing')
    month, day, year = map(int, updated.groups())
    date = datetime(year, month, day).date().isoformat()
    rows = []
    for row in rows_for(page, ['Rank', 'Model', 'Harness', 'Score']):
        if len(row) < 4: raise ValueError('Incomplete Terminal-Bench Science row')
        if row[2] != 'Mini-SWE-agent': continue
        value = score(row[3])
        rows.append({'model': row[1], 'agent': row[2], 'score': value, 'scoreRaw': value, 'source': url})
    return {'terminal-science': pack(url, date, '原榜更新', rows)}

def main():
    try:
        old = json.loads(TARGET.read_text(encoding='utf8').removeprefix('window.RECENT_DATA = ').removesuffix(';\n'))
    except (OSError, ValueError):
        old = {}
    groups = old.get('groups', {})
    failed = []
    for keys, load in [(('swescience',), swescience), (('paperbench-science',), paperbench), (('scifigure-image','scifigure-caption'), scifigure), (('english-writing',), writing), (('sciconbench',), scicon), (('terminal-science',), terminal_science)]:
        try:
            groups.update(load())
            print(load.__name__, 'OK', flush=True)
        except (OSError, ValueError, KeyError, IndexError, StopIteration) as error:
            failed.extend(keys)
            print(load.__name__, 'FAILED:', error, file=sys.stderr, flush=True)
    out = {'capturedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'groups': groups, 'failed': failed}
    if not groups: raise ValueError('No valid recent leaderboard; snapshot not replaced')
    temp = TARGET.with_suffix('.js.tmp')
    temp.write_text('window.RECENT_DATA = ' + json.dumps(out, ensure_ascii=False, indent=2) + ';\n', encoding='utf8')
    temp.replace(TARGET)
    return 1 if failed else 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        sys.exit(f'Update failed; existing snapshot was not replaced: {error}')
