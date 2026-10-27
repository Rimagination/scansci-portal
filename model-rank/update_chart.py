import json, math, sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from xml.etree import ElementTree

ROOT = 'https://chartmimic.github.io/'
SOURCES = {'direct': ROOT + 'static/data/benchmark.json', 'custom': ROOT + 'static/data/eurus_code_sr_vs_k_series.json'}

def parse(items, source):
    if not isinstance(items, list) or len(items) < 5:
        raise ValueError('ChartMimic results are incomplete')
    rows = []
    for item in items:
        model, score, rate = item.get('Model'), item.get('Overall'), item.get('Exec_Rate')
        if not isinstance(model, str) or not model.strip() or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or not 0 <= v <= 100 for v in (score, rate)):
            raise ValueError('Unexpected ChartMimic result format')
        rows.append({'model': model, 'agent': 'ChartMimic', 'score': score, 'scoreRaw': score, 'executionRate': rate, 'source': source})
    return sorted(rows, key=lambda row: -row['scoreRaw'])

def main():
    groups, updated = {}, {}
    target = Path(__file__).parent / 'chart-data.js'
    try:
        previous = json.loads(target.read_text(encoding='utf8').removeprefix('window.CHART_DATA = ').removesuffix(';\n'))
    except (OSError, ValueError):
        previous = {}
    for name, url in SOURCES.items():
        with urlopen(Request(url, headers={'User-Agent': 'ScanSci-ResearchIndex/1.0'}), timeout=30) as response:
            raw = json.load(response)
        groups[name] = parse(raw, url)
        file = url.removeprefix(ROOT)
        try:
            base = 'https://github.com/ChartMimic/ChartMimic.github.io/commits/main/' + file
            with urlopen(Request('https://raw.githubusercontent.com/ChartMimic/ChartMimic.github.io/main/' + file, headers={'User-Agent': 'ScanSci-ResearchIndex/1.0'}), timeout=20) as response:
                repo_data = json.load(response)
            with urlopen(Request(base + '.atom', headers={'User-Agent': 'ScanSci-ResearchIndex/1.0'}), timeout=20) as response:
                feed = ElementTree.fromstring(response.read())
            date = feed.findtext('{http://www.w3.org/2005/Atom}entry/{http://www.w3.org/2005/Atom}updated')
            if repo_data == raw and date:
                updated[name] = {'date': date, 'url': base}
        except (OSError, ValueError, ElementTree.ParseError) as error:
            print(f'ChartMimic {name} commit metadata unavailable: {error}')
        if name not in updated and previous.get('groups', {}).get(name) == groups[name] and name in previous.get('updated', {}):
            updated[name] = previous['updated'][name]
    output = {'source': ROOT, 'capturedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'groups': groups, 'updated': updated}
    temporary = target.with_suffix('.js.tmp')
    temporary.write_text('window.CHART_DATA = ' + json.dumps(output, ensure_ascii=False, indent=2) + ';\n', encoding='utf8')
    temporary.replace(target)
    print('ChartMimic records:', {name: len(rows) for name, rows in groups.items()})

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        sys.exit(f'Update failed; existing snapshot was not replaced: {error}')
