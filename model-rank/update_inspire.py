"""Read the fixed INSPIRE paper's Table 2. Scores are a paper snapshot, not a live leaderboard."""
import json, math, sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen

URL = 'https://arxiv.org/html/2609.33233v1'
SOURCE = URL + '#S4.T2'

class ResultsTable(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_figure = False
        self.figure_depth = 0
        self.in_row = False
        self.in_cell = False
        self.cell = []
        self.row = []
        self.rows = []
    def handle_starttag(self, tag, attrs):
        if tag == 'figure':
            if self.in_figure:
                self.figure_depth += 1
            elif dict(attrs).get('id') == 'S4.T2':
                self.in_figure = True
                self.figure_depth = 1
        if not self.in_figure:
            return
        if tag == 'tr':
            self.in_row = True
            self.row = []
        elif self.in_row and tag in ('th', 'td'):
            self.in_cell = True
            self.cell = []
    def handle_data(self, data):
        if self.in_cell:
            self.cell.append(data)
    def handle_endtag(self, tag):
        if not self.in_figure:
            return
        if self.in_cell and tag in ('th', 'td'):
            self.row.append(''.join(self.cell).strip())
            self.in_cell = False
        elif self.in_row and tag == 'tr':
            self.rows.append(self.row)
            self.in_row = False
        elif tag == 'figure':
            self.figure_depth -= 1
            if self.figure_depth == 0:
                self.in_figure = False

def parse(html):
    parser = ResultsTable()
    parser.feed(html)
    if not parser.rows or len(parser.rows[0]) < 3 or parser.rows[0][:3] != ['Model', 'nDCG@10', 'Recall@10']:
        raise ValueError('INSPIRE Table 2 or its metric headers have changed')
    result = []
    seen = set()
    for cells in parser.rows[1:]:
        if len(cells) != 8 or not cells[0] or cells[0] in seen:
            raise ValueError('Invalid or duplicate INSPIRE result row')
        score, recall = float(cells[1]), float(cells[2])
        if not all(math.isfinite(n) and 0 <= n <= 1 for n in (score, recall)):
            raise ValueError('Invalid INSPIRE score')
        seen.add(cells[0])
        result.append({'model': cells[0], 'agent': 'INSPIRE · 统一检索设置', 'score': score, 'scoreRaw': score, 'recall': recall, 'source': SOURCE})
    if len(result) < 5:
        raise ValueError('Incomplete INSPIRE result table')
    return sorted(result, key=lambda r: -r['score'])

def main():
    with urlopen(Request(URL, headers={'User-Agent':'ScanSci-ResearchIndex/1.0'}), timeout=45) as response:
        rows = parse(response.read().decode('utf8'))
    data = {'source': SOURCE, 'publishedAt': '2026-09-27', 'capturedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'rows': rows}
    target = Path(__file__).parent / 'inspire-data.js'
    temp = target.with_suffix('.js.tmp')
    temp.write_text('window.INSPIRE_DATA = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n', encoding='utf8')
    temp.replace(target)
    print(f'INSPIRE: {len(rows)} results from Table 2 of the 2026-09-27 preprint')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        sys.exit(f'Update failed; existing snapshot was not replaced: {error}')
