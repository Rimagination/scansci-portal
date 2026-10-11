# Reader researchers

The default researcher directory uses the attributed Stanford / Elsevier 2026
V9 snapshot (DOI 10.17632/btchxktzyw.9). It contains 243,949 career-list rows and
249,310 annual-list rows; the 2025 citation metrics exclude self-citations.
This source is **CC BY-NC 3.0**. Public commercial deployment needs permission;
this implementation and local preview do not grant that permission.

The official files contain no ORCID, author identifiers, portraits or websites.
`researcher-profiles.json` holds a small, verified enrichment set, with evidence
URLs for every portrait, position, biography and external account. Missing data
stays missing. A ResearchGate contributions page is labelled separately from an
author profile. Photo credits are preserved in the person page.

An edition-specific `roster_id` combines the original name, institution, country,
publication counts/years and field evidence. It identifies a source row, not a
global person. The two lists merge only when that evidence agrees. These IDs are
not suitable for connecting identities across future source editions.

From the repository root, with Python, requests and lxml installed:

```powershell
python -X utf8 worker/scripts/import-reader-scientists.py --download
python -X utf8 worker/scripts/import-reader-scientists.py --profiles-only
node worker/scripts/preview-reader.mjs
```

The first command downloads both official files, verifies the published SHA-256
once, and streams the worksheets into `worker/data/reader-scientists/scientists.sqlite`.
That folder is ignored by Git. The preview binds only to 127.0.0.1:8766, serves
the Reader and read-only researcher API, and does not load account secrets.
The production route uses the same queries through D1, with bounded pagination.

The dataset's available fields are used for researcher filtering. Article
classification and journal rankings remain separate. Chinese institution aliases
from the verified profiles apply to all roster records at that institution.

Person pages show only sourced positions and dated experiences. Works are fetched
by the verified ORCID filter, with newest/most-cited sorting and pagination.
The displayed work count covers records linked by that ORCID; recent coauthors
are derived from the loaded works. It does not represent the person's entire
career or a complete coauthor network. No yearly citation chart is invented.

For a reviewable D1 import, the additive schema is `worker/sql/0012_reader_scientists.sql`.
Generate SQL with `--export-sql`; follow its explicit `manifest.json` in order.
`start.sql` replaces an existing directory snapshot and temporarily disables the
API until `finish.sql` completes. Back up / validate on a staging D1 database
first. No migration or data write is performed on production by this script.

The importer currently maps the V9/2025 metric columns. Update those mappings
and the source metadata for a future edition; unexpected columns fail explicitly.

Checks:

```powershell
node worker/test/reader-scientists.test.mjs
python -X utf8 worker/test/reader-scientists-import.test.py
```
