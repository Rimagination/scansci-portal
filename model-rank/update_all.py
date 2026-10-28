"""Refresh all snapshots independently. Safe to run from Windows Task Scheduler."""
import json, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCES = {'science': 'update_data.py', 'asta': 'update_asta.py', 'chart': 'update_chart.py', 'inspire': 'update_inspire.py', 'recent': 'update_recent.py', 'overall': 'update_overall.py', 'literature': 'update_literature_extra.py', 'visual': 'update_visual_extra.py', 'extended': 'update_extended.py'}

def main():
    requested = sys.argv[1:] or list(SOURCES)
    if any(name not in SOURCES for name in requested):
        raise SystemExit('Unknown source')
    path = ROOT / 'update-status.js'
    try:
        text = path.read_text(encoding='utf8')
        status = json.loads(text.removeprefix('window.UPDATE_STATUS = ').removesuffix(';\n'))
    except (OSError, ValueError):
        status = {}
    for name in requested:
        script = SOURCES[name]
        attempted = datetime.now(timezone.utc).isoformat(timespec='seconds')
        try:
            result = subprocess.run([sys.executable, '-B', str(ROOT / script)], cwd=ROOT, capture_output=True, text=True, encoding='utf8', errors='replace', timeout=900)
            ok = result.returncode == 0
            message = (result.stdout if ok else result.stderr or result.stdout).strip()[-500:]
        except Exception as error:
            ok, message = False, str(error)[-500:]
        status[name] = {'ok': ok, 'attemptedAt': attempted, 'message': message}
        if sys.stdout is not None:
            print(name, 'OK' if ok else 'FAILED', message, flush=True)
    tmp = path.with_suffix('.js.tmp')
    tmp.write_text('window.UPDATE_STATUS = ' + json.dumps(status, ensure_ascii=False, indent=2) + ';\n', encoding='utf8')
    tmp.replace(path)
    return 0 if all(status[name]['ok'] for name in requested) else 1

if __name__ == '__main__':
    sys.exit(main())
