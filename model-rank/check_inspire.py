"""Run with python -B check_inspire.py."""
import io, json, tempfile
from pathlib import Path
import update_inspire

header = '<tr><th>Model</th><th>nDCG@10</th><th>Recall@10</th><th>MRR</th><th>Any</th><th>3</th><th>5</th><th>Calls</th></tr>'
rows = ''.join(f'<tr><th>Model {i}</th><td>0.{i}</td><td>0.2</td><td>0.3</td><td>0.4</td><td>0.5</td><td>0.6</td><td>2.0</td></tr>' for i in range(1, 6))
html = '<figure id="S4.T2"><table>' + header + rows + '</table></figure>'
parsed = update_inspire.parse(html)
assert len(parsed) == 5 and parsed[0]['model'] == 'Model 5' and parsed[0]['score'] == 0.5
assert parsed[0]['source'] == update_inspire.SOURCE
for invalid in [html.replace('nDCG@10', 'unrelated'), html.replace('0.1', 'nan', 1), html.replace('Model 2', 'Model 1')]:
    try:
        update_inspire.parse(invalid)
        raise AssertionError('Invalid source must be rejected')
    except ValueError:
        pass
with tempfile.TemporaryDirectory() as directory:
    path = Path(directory) / 'inspire-data.js'
    path.write_text('previous snapshot', encoding='utf8')
    update_inspire.__file__ = str(Path(directory) / 'update_inspire.py')
    update_inspire.urlopen = lambda *_args, **_kwargs: io.BytesIO(b'<html>wrong page</html>')
    try:
        update_inspire.main()
        raise AssertionError('Invalid source must not replace the snapshot')
    except ValueError:
        pass
    assert path.read_text(encoding='utf8') == 'previous snapshot'
print('INSPIRE source, metric, ordering, and snapshot preservation checks passed')
