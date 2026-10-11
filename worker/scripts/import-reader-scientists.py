"""Import the official XLSX lists into the local SQLite / D1 directory.

python worker/scripts/import-reader-scientists.py --download
python worker/scripts/import-reader-scientists.py --profiles-only
python worker/scripts/import-reader-scientists.py --export-sql

The public source is CC BY-NC 3.0. Check deployment licensing before publishing.
No identity accounts or portraits are inferred from a person's name.
"""
import argparse
import hashlib
import json
import re
import sqlite3
from collections import Counter
from pathlib import Path

from lxml import etree
import requests
import zipfile

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'worker/data/reader-scientists'
SOURCE_PATH = ROOT / 'reader/data/top-scientists-source.json'
PROFILE_PATH = ROOT / 'reader/data/researcher-profiles.json'
DATABASE = DATA / 'scientists.sqlite'
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def download(file):
    target = DATA / file['filename']
    if target.exists() and target.stat().st_size == file['bytes']:
        return target
    partial = target.with_suffix('.xlsx.part')
    start = partial.stat().st_size if partial.exists() else 0
    response = requests.get(file.get('assetUrl', file['url']), headers={'Range': f'bytes={start}-'} if start else {}, stream=True, timeout=(20, 60))
    response.raise_for_status()
    if start and response.status_code != 206:
        start = 0
    print(f"Downloading {file['list']} list ({file['bytes']:,} bytes)", flush=True)
    with partial.open('ab' if start else 'wb') as stream:
        for chunk in response.iter_content(1024 * 1024):
            stream.write(chunk)
    if partial.stat().st_size != file['bytes']:
        raise ValueError('Official file size does not match; partial download retained.')
    # Transport integrity: verify each newly downloaded official file once.
    with partial.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    if digest != file['sha256']:
        raise ValueError('Official file checksum does not match; import stopped.')
    partial.replace(target)
    return target


def read_rows(path):
    # Stream the 600+ MB worksheet inside each XLSX; do not load it into memory.
    with zipfile.ZipFile(path) as archive:
        workbook = etree.fromstring(archive.read('xl/workbook.xml'))
        sheets = workbook.find(NS + 'sheets')
        rels = etree.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
        targets = {r.get('Id'): r.get('Target') for r in rels}
        sheet = next(s for s in sheets if s.get('name') == 'Data')
        target = targets[sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')]
        target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
        with archive.open(target) as stream:
            headers = None
            for _, row in etree.iterparse(stream, events=('end',), tag=NS + 'row'):
                values = {}
                for cell in row:
                    column = re.sub(r'\d+', '', cell.get('r', ''))
                    text = ''.join(cell.itertext()) if cell.get('t') == 'inlineStr' else cell.findtext(NS + 'v', '')
                    values[column] = text
                if headers is None:
                    headers = values
                    if 'authfull' not in headers.values():
                        raise ValueError('Unsupported official worksheet schema')
                else:
                    yield {name: values.get(column, '') for column, name in headers.items()}
                row.clear()
                while row.getprevious() is not None:
                    del row.getparent()[0]


def integer(value):
    return int(float(value)) if value not in ('', None) else None


def display_name(name):
    family, separator, given = name.partition(',')
    return f'{given.strip()} {family.strip()}' if separator else name.strip()


def fingerprint(row):
    # Same-release records can share both lists only when all source identity
    # evidence agrees. This hash is a roster key, never a verified person ID.
    keys = ['authfull', 'inst_name', 'cntry', 'np6025', 'firstyr', 'lastyr', 'sm-field', 'sm-subfield-1', 'sm-subfield-2']
    return hashlib.sha256(json.dumps([row.get(key, '') for key in keys], ensure_ascii=False).encode()).hexdigest()[:32]


def checked_profiles():
    profiles = json.loads(PROFILE_PATH.read_text(encoding='utf-8')) if PROFILE_PATH.exists() else []
    for profile in profiles:
        if not profile.get('rosterName') or not profile.get('institution'):
            raise ValueError('Profiles need the exact official roster name and institution')
        if profile.get('rosterId') is not None and not re.fullmatch(r'[0-9a-f]{32}', str(profile['rosterId'])):
            raise ValueError('Invalid official roster key')
        for key, evidence in [('photoUrl', 'photoSource'), ('orcid', 'orcidSource'), ('researchgate', 'researchgateSource'), ('bio', 'bioSource'), ('role', 'roleSource'), ('currentInstitution', 'currentInstitutionSource'), ('scopusAuthorId', 'scopusSource'), ('googleScholar', 'googleScholarSource'), ('institutionLogo', 'institutionLogoSource'), ('currentInstitutionLogo', 'currentInstitutionLogoSource')]:
            if profile.get(key) and not str(profile.get(evidence, '')).startswith('https://'):
                raise ValueError(f'Missing identity evidence for {key}')
        for key in ['photoUrl', 'photoSource', 'profileUrl', 'orcidSource', 'researchgate', 'researchgateSource', 'institutionLogo']:
            if profile.get(key) and not profile[key].startswith('https://'):
                raise ValueError(f'Unsupported profile URL: {key}')
        if profile.get('orcid') and not re.fullmatch(r'\d{4}-\d{4}-\d{4}-\d{3}[\dX]', profile['orcid']):
            raise ValueError('Invalid curated ORCID format')
    return profiles


def apply_profiles(db):
    profiles = checked_profiles()
    verified = []
    for profile in profiles:
        # An explicit roster key narrows repeated names without relaxing name/institution evidence.
        identifier = profile.get('rosterId')
        candidates = db.execute('SELECT roster_id FROM reader_scientists WHERE roster_name=? AND institution=? AND (? IS NULL OR roster_id=?)', (profile['rosterName'], profile['institution'], identifier, identifier)).fetchall()
        if len(candidates) != 1:
            raise ValueError(f"Profile record is missing or ambiguous: {profile['rosterName']}")
        verified.append((json.dumps(profile, ensure_ascii=False), candidates[0][0]))
    # The curated file is authoritative: removing an erroneous link also removes
    # it from storage. Check every mapping before clearing the previous set.
    db.execute("UPDATE reader_scientists SET profile_json='{}' WHERE profile_json!='{}'")
    db.executemany('UPDATE reader_scientists SET profile_json=? WHERE roster_id=?', verified)
    db.execute('DELETE FROM reader_scientists_search')
    db.execute("INSERT INTO reader_scientists_search (roster_id,name,institution,field,subfield,aliases) SELECT roster_id,name,institution,field,subfield,coalesce(json_extract(profile_json,'$.localName'),'') || ' ' || coalesce(json_extract(profile_json,'$.institutionLocalName'),'') FROM reader_scientists")
    institution_aliases = {p['institution']:p['institutionLocalName'] for p in profiles if p.get('institutionLocalName')}
    for institution, alias in institution_aliases.items():
        # An institution alias applies to all its roster records, not just the
        # small subset with curated portraits and external person identifiers.
        db.execute('UPDATE reader_scientists_search SET aliases=aliases || ? WHERE institution=?', (' ' + alias, institution))
    db.execute("INSERT INTO reader_scientists_search(reader_scientists_search) VALUES('optimize')")
    stored = db.execute("SELECT value FROM reader_scientists_metadata WHERE key='source'").fetchone()
    if stored:
        metadata = json.loads(stored[0])
        metadata['fields'] = [r[0] for r in db.execute("SELECT DISTINCT field FROM reader_scientists WHERE field != '' ORDER BY field")]
        db.execute("UPDATE reader_scientists_metadata SET value=? WHERE key='source'", (json.dumps(metadata, ensure_ascii=False),))
    db.commit()
    print(f'Verified profiles linked: {len(profiles)}', flush=True)


def build(source):
    building = DATABASE.with_suffix('.building.sqlite')
    if building.exists():
        building.unlink()
    db = sqlite3.connect(building)
    db.executescript((ROOT / 'worker/sql/0012_reader_scientists.sql').read_text(encoding='utf-8'))
    db.execute('PRAGMA synchronous=OFF')
    counts = {}
    for file in source['files']:
        path = DATA / file['filename']
        if not path.exists() or path.stat().st_size != file['bytes']:
            raise ValueError('Official files missing; run with --download')
        kind = file['list']
        seen = Counter()
        count = 0
        for row in read_rows(path):
            if not row.get('authfull'):
                continue
            key = fingerprint(row)
            seen[key] += 1
            # Keep indistinguishable duplicate source rows separate.
            roster_id = key if seen[key] == 1 else f'{key}-{seen[key]}'
            rank = integer(row['rank (ns)'])
            cites_key = 'nc9625 (ns)' if kind == 'career' else 'nc2525 (ns)'
            if cites_key not in row:
                raise ValueError(f'Citation column changed: {cites_key}')
            base = (roster_id, row['authfull'], display_name(row['authfull']), row['inst_name'], row['cntry'], row['sm-field'], row['sm-subfield-1'], integer(row['np6025']), integer(row['firstyr']), integer(row['lastyr']))
            db.execute('INSERT OR IGNORE INTO reader_scientists (roster_id,roster_name,name,institution,country,field,subfield,publications,first_year,last_year) VALUES (?,?,?,?,?,?,?,?,?,?)', base)
            db.execute(f'UPDATE reader_scientists SET {kind}_rank=?,{kind}_citations=?,{kind}_h_index=?,{kind}_score=? WHERE roster_id=?', (rank, integer(row[cites_key]), integer(row['h25 (ns)']), float(row['c (ns)']) if row['c (ns)'] else None, roster_id))
            count += 1
            if count % 25000 == 0:
                db.commit()
                print(f'{kind}: {count:,} records', flush=True)
        db.commit()
        counts[kind] = count
        print(f'{kind}: complete ({count:,} records; duplicate fingerprints: {sum(n-1 for n in seen.values())})', flush=True)
    metadata = {**{key:value for key,value in source.items() if key != 'files'}, 'counts': counts, 'recordCount': db.execute('SELECT count(*) FROM reader_scientists').fetchone()[0], 'fields':[r[0] for r in db.execute("SELECT DISTINCT field FROM reader_scientists WHERE field != '' ORDER BY field")], 'identity':'source-record; no inferred ORCID, Scopus or social accounts', 'metricsExcludeSelfCitations':True}
    db.execute('INSERT INTO reader_scientists_metadata VALUES (?,?)', ('source', json.dumps(metadata, ensure_ascii=False)))
    apply_profiles(db)
    db.close()
    building.replace(DATABASE)
    print(f'Directory ready: {DATABASE}', flush=True)


def export_sql():
    # Export is separate from deployment; importing it requires a D1 database.
    db = sqlite3.connect(DATABASE)
    out = DATA / 'import-sql'
    out.mkdir(exist_ok=True)
    with (out / 'start.sql').open('w', encoding='utf-8') as stream:
        stream.write("-- Temporarily disable directory queries until this complete snapshot is imported.\nDELETE FROM reader_scientists_metadata WHERE key='source';\nDELETE FROM reader_scientists_search;\nDELETE FROM reader_scientists;\n")
    columns = [row[1] for row in db.execute('PRAGMA table_info(reader_scientists)')]
    quote = lambda value: 'NULL' if value is None else str(value) if isinstance(value, (int,float)) else "'" + str(value).replace("'", "''") + "'"
    part, stream = 0, None
    for index,row in enumerate(db.execute('SELECT * FROM reader_scientists ORDER BY roster_id')):
        if index % 3000 == 0:
            if stream: stream.close()
            part += 1
            stream = (out / f'{part:03d}.sql').open('w', encoding='utf-8')
        stream.write('INSERT OR REPLACE INTO reader_scientists (' + ','.join(columns) + ') VALUES (' + ','.join(map(quote,row)) + ');\n')
    if stream: stream.close()
    with (out / 'finish.sql').open('w', encoding='utf-8') as stream:
        metadata = db.execute("SELECT value FROM reader_scientists_metadata WHERE key='source'").fetchone()[0]
        stream.write("DELETE FROM reader_scientists_search;\n")
        stream.write("INSERT INTO reader_scientists_search (roster_id,name,institution,field,subfield,aliases) SELECT roster_id,name,institution,field,subfield,coalesce(json_extract(profile_json,'$.localName'),'') || ' ' || coalesce(json_extract(profile_json,'$.institutionLocalName'),'') FROM reader_scientists;\n")
        for institution,alias in {p['institution']:p['institutionLocalName'] for p in checked_profiles() if p.get('institutionLocalName')}.items():
            stream.write('UPDATE reader_scientists_search SET aliases=aliases || ' + quote(' ' + alias) + ' WHERE institution=' + quote(institution) + ';\n')
        stream.write("INSERT OR REPLACE INTO reader_scientists_metadata VALUES('source'," + quote(metadata) + ");\n")
    # Follow the explicit manifest, never glob stale files from an earlier export.
    (out / 'manifest.json').write_text(json.dumps({'files':['start.sql'] + [f'{i:03d}.sql' for i in range(1,part+1)] + ['finish.sql'], 'warning':'Import into a backed-up/staging D1 database first. start.sql replaces the existing public directory snapshot.'},indent=2)+'\n',encoding='utf-8')
    db.close()
    print(f'D1 import files ready: {out} ({part} data files + finish.sql)', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--profiles-only', action='store_true')
    parser.add_argument('--export-sql', action='store_true')
    args = parser.parse_args()
    DATA.mkdir(parents=True, exist_ok=True)
    source = json.loads(SOURCE_PATH.read_text(encoding='utf-8'))
    if args.profiles_only:
        with sqlite3.connect(DATABASE) as db: apply_profiles(db)
    elif args.export_sql:
        export_sql()
    else:
        if args.download:
            for file in source['files']: download(file)
        build(source)
