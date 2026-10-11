# Paper thumbnails

`media.js` loads visible paper cards through `GET /api/reader/media?doi=...` or `?arxiv=...`.
The lookup order is graphical abstract, article figure, then the first page of an actual PDF.
Without an available asset, the card displays its text and journal ratings without an empty preview box.

Sources include semantic figures on supported publisher pages, Crossref PDF links, PMC's official
versioned public files, and arXiv. OpenAlex Content is the last PDF fallback and uses the signed-in
account's existing encrypted credential through the same-origin proxy. The key never appears in
an asset URL. `READER_UNPAYWALL_EMAIL` optionally enables Unpaywall; it must be a real contact email.
This addition requires no D1 migration or persistent object-storage bucket.

Browser storage retains up to 200 small WebP thumbnails for seven days; failures are briefly cached.
Only two visible-card jobs run concurrently. PDF.js and its worker/fonts load only when a PDF must
be rendered. Public metadata/assets can use Cloudflare's transient response cache for one day;
account-backed PDFs return private cache headers. Full PDFs are not retained in IndexedDB.

The proxy accepts publication identifiers and asset indices, validates every redirect against exact
HTTPS host allowlists, limits images to 4 MiB and PDFs to 20 MiB, and rejects invalid media responses.
Public PMC version metadata determines filenames, figure association, license and NLM/PMC credit.
Unsupported hosts, access challenges or unavailable assets leave the card in its compact text layout.

Run the focused backend checks from the repository root:

```powershell
node --test worker/test/reader-media.test.mjs worker/test/reader-openalex.test.mjs
```

Local preview: `node worker/scripts/preview-reader.mjs`, then `http://127.0.0.1:8766/reader/`.
The local public preview does not load real account credentials.

Primary documentation:

- [PMC public file structure and version metadata](https://pmc-oa-opendata.s3.amazonaws.com/README.txt)
- [PMC AWS access](https://pmc.ncbi.nlm.nih.gov/tools/pmcaws/)
- [PDF.js examples](https://mozilla.github.io/pdf.js/examples/index.html)
- [Unpaywall API](https://unpaywall.org/products/api)

PDF.js 6.4.299 is vendored with its Apache-2.0 license in `vendor/pdfjs/`.
