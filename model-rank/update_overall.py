"""Fetch general leaderboards independently, retaining prior snapshots on failure."""
import json, math, re, sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen
from source_tables import Tables

TARGET = Path(__file__).resolve().parent / 'overall-data.js'
HEADERS = {'User-Agent': 'ScanSci-ResearchIndex/1.0'}

def fetch(url):
    with urlopen(Request(url, headers=HEADERS), timeout=45) as response:
        return response.read().decode('utf8')

def price(text):
    if not re.fullmatch(r'¥\d+(?:\.\d+)?', text): return None
    value = float(text[1:])
    return value if math.isfinite(value) else None

def aihot():
    url = 'https://aihot.news/leaderboard'
    html = fetch(url)
    match = re.search(r'"generatedAt"\s*,\s*"([^"\\]+)"', html.replace('\\"', '"'))
    if not match: raise ValueError('AIHOT source generation date missing')
    updated = match.group(1)
    datetime.fromisoformat(updated.replace('Z', '+00:00'))
    parser = Tables()
    parser.feed(html)
    table = next((t for t in parser.tables if t['rows'] and len(t['rows'][0]) == 8 and 'AIHOT 评分' in t['rows'][0][-1]['text']), None)
    if not table: raise ValueError('AIHOT overall leaderboard table missing')
    if any(label not in cell['text'] for cell, label in zip(table['rows'][0][4:7], ('缓存价格', '输入价格', '输出价格'))):
        raise ValueError('AIHOT price columns changed')
    rows = []
    for cells in table['rows'][1:]:
        if len(cells) != 8 or not cells[1]['strongs'] or not cells[1]['smalls'] or not cells[7]['strongs']:
            raise ValueError('Incomplete AIHOT row')
        model, org = cells[1]['strongs'][0], cells[1]['smalls'][0]
        link = next((x for x in cells[1]['links'] if re.fullmatch(r'/leaderboard/[a-z0-9-]+', x)), None)
        coverage = re.search(r'(\d+)\s*项评测.*?覆盖\s*(\d+)\s*%', cells[3]['text'])
        if not link or not coverage or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', cells[2]['text']):
            raise ValueError('AIHOT model link, release date or coverage missing')
        value = float(cells[7]['strongs'][0])
        if not math.isfinite(value) or not 0 <= int(coverage.group(2)) <= 100:
            raise ValueError('Invalid AIHOT score or coverage')
        raw_prices = [cell['text'] for cell in cells[4:7]]
        cache, input_price, output = map(price, raw_prices)
        cost = (cache * 7 + input_price * 2 + output) / 10 if None not in (cache, input_price, output) else None
        rows.append({'rank': int(cells[0]['text']), 'model': model, 'agent': 'AIHOT 综合', 'provider': org, 'score': value, 'scoreRaw': value, 'releaseDate': cells[2]['text'], 'benchmarkCount': int(coverage.group(1)), 'coveragePercent': int(coverage.group(2)), 'cachePrice': cache, 'inputPrice': input_price, 'outputPrice': output, 'cachePriceRaw': raw_prices[0], 'inputPriceRaw': raw_prices[1], 'outputPriceRaw': raw_prices[2], 'cost': cost, 'source': urljoin(url, link)})
    if len(rows) < 10 or len({r['rank'] for r in rows}) != len(rows) or rows != sorted(rows, key=lambda r:r['rank']):
        raise ValueError('AIHOT overall ranking incomplete or inconsistent')
    return {'source': url, 'updatedAt': updated, 'dateLabel': '原榜更新', 'rows': rows}

def arena_page(offset):
    args = {'dataset':'lmarena-ai/leaderboard-dataset', 'config':'text_style_control', 'split':'latest', 'where':'"category"=\'overall\'', 'offset':offset, 'length':100}
    return json.loads(fetch('https://datasets-server.huggingface.co/filter?' + urlencode(args)))

def arena():
    try:
        import pyarrow.parquet as parquet
    except ImportError:
        parquet = None
    records = None
    if parquet:
        url = 'https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/main/text_style_control/latest-00000-of-00001.parquet'
        for attempt in range(2):
            try:
                with urlopen(Request(url, headers=HEADERS), timeout=60) as response:
                    blob = response.read(20_000_001)
                if len(blob) > 20_000_000: raise ValueError('Arena snapshot unexpectedly large')
                records = parquet.read_table(BytesIO(blob), filters=[('category', '=', 'overall')]).to_pylist()
                break
            except (OSError, ValueError):
                pass
    if records is None:
        first = arena_page(0)
        total = first['num_rows_total']
        if not isinstance(total, int) or not 10 <= total <= 5000: raise ValueError('Unexpected Arena row count')
        with ThreadPoolExecutor(max_workers=4) as pool:
            pages = [first] + list(pool.map(arena_page, range(100, total, 100)))
        if any(page['num_rows_total'] != total for page in pages): raise ValueError('Arena snapshot changed during pagination')
        records = [item['row'] for page in pages for item in page['rows']]
        if len(records) != total: raise ValueError('Arena snapshot incomplete')
    if not 10 <= len(records) <= 5000: raise ValueError('Unexpected Arena row count')
    dates = {item.get('leaderboard_publish_date') for item in records}
    if len(dates) != 1 or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', next(iter(dates)) or ''):
        raise ValueError('Arena records have inconsistent publication dates')
    url = 'https://arena.ai/leaderboard/chat/text'
    rows = []
    for item in records:
        value, low, high = (float(item[key]) for key in ('rating','rating_lower','rating_upper'))
        if item.get('category') != 'overall' or not item.get('model_name') or not all(math.isfinite(x) for x in (value, low, high)) or not low <= value <= high:
            raise ValueError('Invalid Arena record')
        rank = item.get('rank')
        if not isinstance(rank, (int, float)) or not math.isfinite(rank) or rank < 1 or not float(rank).is_integer(): raise ValueError('Invalid Arena rank')
        votes = item.get('vote_count')
        if not isinstance(votes, (int, float)) or not math.isfinite(votes) or votes < 0: raise ValueError('Invalid Arena votes')
        rows.append({'rank': int(rank), 'model': item['model_name'], 'agent': 'Arena · 文本盲选', 'provider': item.get('organization') or '', 'score': value, 'scoreRaw': value, 'ratingLower': low, 'ratingUpper': high, 'votes': int(votes), 'source': 'https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset'})
    rows.sort(key=lambda r:r['rank'])
    return {'source': url, 'updatedAt': next(iter(dates)), 'dateLabel': '原榜发布', 'rows': rows}

def main():
    try:
        old = json.loads(TARGET.read_text(encoding='utf8').removeprefix('window.OVERALL_DATA = ').removesuffix(';\n'))
    except (OSError, ValueError):
        old = {}
    groups = old.get('groups', {})
    failed = []
    for name, loader in [('aihot', aihot), ('arena', arena)]:
        try:
            groups[name] = loader()
            print(name, 'OK', len(groups[name]['rows']), flush=True)
        except (OSError, ValueError, KeyError, TypeError, IndexError, StopIteration) as error:
            failed.append(name)
            print(name, 'FAILED:', error, file=sys.stderr, flush=True)
    if not groups: raise ValueError('No valid general leaderboard; snapshot not replaced')
    out = {'capturedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'groups': groups, 'failed': failed}
    temp = TARGET.with_suffix('.js.tmp')
    temp.write_text('window.OVERALL_DATA = ' + json.dumps(out, ensure_ascii=False, indent=2) + ';\n', encoding='utf8')
    temp.replace(TARGET)
    return 1 if failed else 0

if __name__ == '__main__':
    try: sys.exit(main())
    except Exception as error: sys.exit(f'Update failed; existing snapshot was not replaced: {error}')
