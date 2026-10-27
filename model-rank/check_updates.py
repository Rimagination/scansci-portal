"""Run with: python -B check_updates.py"""
import io, json, tempfile
from pathlib import Path
from types import SimpleNamespace
import update_all, update_chart

sample = [{'Model': f'm{i}', 'Overall': 80-i, 'Exec_Rate': 90} for i in range(5)]
rows = update_chart.parse(sample, update_chart.SOURCES['direct'])
assert [r['score'] for r in rows] == [80, 79, 78, 77, 76]
assert rows[0]['source'] == update_chart.SOURCES['direct']
try:
    update_chart.parse(sample[:1], 'source')
    raise AssertionError('An incomplete source must be rejected')
except ValueError:
    pass

with tempfile.TemporaryDirectory() as directory:
    previous = Path(directory) / 'chart-data.js'
    previous.write_text('previous snapshot', encoding='utf8')
    update_chart.__file__ = str(Path(directory) / 'update_chart.py')
    calls = []
    def fake_open(request, **_kwargs):
        calls.append(request.full_url)
        if request.full_url != update_chart.SOURCES['direct']:
            raise OSError('upstream unavailable')
        return io.BytesIO(json.dumps(sample).encode())
    update_chart.urlopen = fake_open
    try:
        update_chart.main()
        raise AssertionError('A source failure must stop the update')
    except OSError:
        pass
    assert previous.read_text(encoding='utf8') == 'previous snapshot'

with tempfile.TemporaryDirectory() as directory:
    update_all.ROOT = Path(directory)
    calls = []
    def run(args, **kwargs):
        calls.append(args[-1])
        return SimpleNamespace(returncode=1 if 'update_asta' in args[-1] else 0, stdout='updated', stderr='upstream unavailable')
    update_all.subprocess.run = run
    assert update_all.main() == 1
    status = json.loads((Path(directory) / 'update-status.js').read_text(encoding='utf8').removeprefix('window.UPDATE_STATUS = ').removesuffix(';\n'))
    assert len(calls) == len(update_all.SOURCES) and status['science']['ok'] and not status['asta']['ok'] and status['chart']['ok'] and status['inspire']['ok'] and status['recent']['ok'] and status['overall']['ok']
print('ChartMimic validation and independent source failure checks passed')
