"""One small check for safe replacement of curated public profile evidence."""
import importlib.util
import json
import sqlite3
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('scientist_import', root / 'worker/scripts/import-reader-scientists.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
with tempfile.TemporaryDirectory() as folder:
    profile_file = Path(folder) / 'profiles.json'
    module.PROFILE_PATH = profile_file
    db = sqlite3.connect(':memory:')
    db.executescript((root / 'worker/sql/0012_reader_scientists.sql').read_text(encoding='utf-8'))
    for identifier, name in [('a'*32,'Lu, Jiwen'),('b'*32,'Other, Scientist')]:
        db.execute('INSERT INTO reader_scientists (roster_id,roster_name,name,institution,country,field,subfield) VALUES (?,?,?,?,?,?,?)', (identifier,name,name,'Tsinghua University','chn','Engineering','Computer Vision'))
    profile_file.write_text(json.dumps([{'rosterName':'Lu, Jiwen','institution':'Tsinghua University','institutionLocalName':'清华大学','orcid':'0000-0002-6121-5529','orcidSource':'https://example.edu/jiwen'}]),encoding='utf-8')
    module.apply_profiles(db)
    assert '0000-0002-6121-5529' in db.execute('SELECT profile_json FROM reader_scientists WHERE roster_id=?',('a'*32,)).fetchone()[0]
    assert db.execute('SELECT count(*) FROM reader_scientists_search WHERE reader_scientists_search MATCH ?', ('"清华大学"',)).fetchone()[0] == 2
    profile_file.write_text('[]',encoding='utf-8')
    module.apply_profiles(db)
    assert db.execute("SELECT count(*) FROM reader_scientists WHERE profile_json!='{}'").fetchone()[0] == 0
    assert db.execute('SELECT count(*) FROM reader_scientists').fetchone()[0] == 2
    profile_file.write_text(json.dumps([{'rosterName':'Missing, Author','institution':'Tsinghua University'}]),encoding='utf-8')
    try:
        module.apply_profiles(db)
        raise AssertionError('An unverified person was linked')
    except ValueError:
        pass
    assert db.execute('SELECT count(*) FROM reader_scientists_search').fetchone()[0] == 2
    db.execute('INSERT INTO reader_scientists (roster_id,roster_name,name,institution,country,field,subfield) VALUES (?,?,?,?,?,?,?)', ('c'*32,'Lu, Jiwen','Jiwen Lu','Tsinghua University','chn','Engineering','Computer Vision'))
    verified = {'rosterName':'Lu, Jiwen','institution':'Tsinghua University','rosterId':'a'*32,'photoUrl':'https://example.edu/jiwen.jpg','photoSource':'https://example.edu/jiwen'}
    profile_file.write_text(json.dumps([verified]),encoding='utf-8')
    module.apply_profiles(db)
    assert json.loads(db.execute('SELECT profile_json FROM reader_scientists WHERE roster_id=?',('a'*32,)).fetchone()[0]) == verified
    assert db.execute('SELECT profile_json FROM reader_scientists WHERE roster_id=?',('c'*32,)).fetchone()[0] == '{}'
    before = db.execute('SELECT roster_id,profile_json FROM reader_scientists ORDER BY roster_id').fetchall()
    for invalid in [
        {key:value for key,value in verified.items() if key != 'rosterId'},
        {**verified,'rosterId':'b'*32},
        {**verified,'rosterId':'d'*32},
        {**verified,'rosterId':'invalid'},
        {**verified,'institution':'Another University'},
    ]:
        profile_file.write_text(json.dumps([invalid]),encoding='utf-8')
        try:
            module.apply_profiles(db)
            raise AssertionError('An ambiguous, mismatched or invalid roster key was linked')
        except ValueError:
            pass
        assert db.execute('SELECT roster_id,profile_json FROM reader_scientists ORDER BY roster_id').fetchall() == before
        assert db.execute('SELECT count(*) FROM reader_scientists_search').fetchone()[0] == 3
    db.close()
print('Passed: profile replacement, institutional aliases, explicit roster disambiguation, and rejection without data loss.')
