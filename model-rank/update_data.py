import json, re, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode, urlsplit, unquote
from source_tables import Tables

URL = 'https://hal.cs.princeton.edu/scienceagentbench'
page = urllib.request.urlopen(urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30).read().decode('utf-8')
match = re.search(r"const scatter_plot_data = JSON.parse\('(.*?)'\);", page)
if not match:
    raise SystemExit('HAL page format changed; existing snapshot was not replaced.')
plot = json.loads(match.group(1))
rows = []
for item in plot['data']:
    if not item.get('customdata') or not item.get('x') or not item.get('y'):
        continue
    agent = item['customdata'][0][0]
    if not agent.startswith('SAB Self-Debug ('):
        continue
    name = agent[len('SAB Self-Debug ('):-1]
    rows.append({'model': name, 'provider': item['legendgroup'], 'score': item['y'][0], 'cost': item['x'][0], 'agent': 'SAB Self-Debug'})
if len(rows) < 5 or any(not isinstance(r['score'], (float, int)) or not isinstance(r['cost'], (float, int)) for r in rows):
    raise SystemExit('HAL data incomplete; existing snapshot was not replaced.')
rows.sort(key=lambda r: -r['score'])
try:
    tables = Tables()
    tables.feed(page)
    traces = {}
    for table in tables.tables:
        for cells in table['rows']:
            if len(cells) >= 8 and cells[1]['text'].startswith('SAB Self-Debug'):
                links = [link for cell in cells for link in cell['links'] if link.startswith('https://huggingface.co/datasets/agent-evals/hal_traces/resolve/main/')]
                if len(links) == 1:
                    traces[cells[2]['text']] = (links[0], unquote(urlsplit(links[0]).path.split('/resolve/main/', 1)[1]))
    if len(traces) == len(rows) and all(r['model'] in traces for r in rows):
        payload = urlencode([('paths', value[1]) for value in traces.values()] + [('expand', 'true')]).encode()
        req = urllib.request.Request('https://huggingface.co/api/datasets/agent-evals/hal_traces/paths-info/main', data=payload, headers={'User-Agent': 'ScanSci-ResearchIndex/1.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            info = json.load(response)
        commits = {item['path']: item.get('lastCommit', {}).get('date') for item in info}
        if all(commits.get(path) for _, path in traces.values()):
            for row in rows:
                row['traceUrl'], path = traces[row['model']]
                row['traceUploadedAt'] = commits[path]
except (OSError, ValueError, KeyError, IndexError) as error:
    print(f'Trace upload dates unavailable: {error}')
out = {'source': URL, 'capturedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'rows': rows}
path = Path(__file__).parent / 'data.js'
temporary = path.with_suffix('.js.tmp')
temporary.write_text('window.BENCHMARK_DATA = ' + json.dumps(out, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
temporary.replace(path)
print(f'Updated {len(rows)} ScienceAgentBench results from {URL}')
