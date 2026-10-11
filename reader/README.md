# ScanSci Reader

Reader is independently served at `https://reader.scansci.com/`. The portal only
links to it from the online tools catalog. Its layout, fonts and navigation are
maintained in `reader/index.html`, independently of the portal and EasyMD.

From the repository root:

```sh
node scripts/build-reader.mjs
npx wrangler deploy --config reader/wrangler.toml
```

The build publishes only Reader HTML, its media module and PDF.js vendor assets.
It excludes credentials, database dumps, tests and the main portal. Cloudflare
manages the custom domain and HTTPS certificate. The former main-site
`/reader/` path redirects to this origin and preserves queries; browsers retain
the fragment used for paper and settings routes.

The `ACCOUNT_API` binding calls the existing account Worker for session status,
logout and the account's encrypted OpenAlex credentials. The gateway validates
the Reader origin before forwarding a write and only permits these specific
account endpoints. Shared sessions use a Secure, HttpOnly cookie with
`Domain=.scansci.com`. The account service upgrades a valid legacy host-only
session when `/api/me` is read; login stays on the main site and returns to the
exact Reader origin.

`DB` reuses the journal classification database. `SCIENTISTS_DB` is the separate
`scansci_reader_scientists` directory database. Updating this directory leaves
account records unchanged. The initial directory has 347,131 distinct roster
records, with both annual and career metrics and a complete search index. Source
attribution and the snapshot's CC BY-NC 3.0 terms are documented in
`data/RESEARCHERS.md` and returned with the directory metadata. Future snapshot
imports should use a new staging database, verify row/index/metadata counts,
and then switch this binding.

Focused checks:

```sh
node --test reader/*.test.mjs worker/test/shared-session.test.mjs
node --test worker/test/reader-*.test.mjs worker/test/orcid-profile.test.mjs
```
