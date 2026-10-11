import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'reader');
const output = path.join(root, '.local/reader-site');
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'media.js', 'vendor']) {
  await cp(path.join(source, name), path.join(output, name), { recursive: true });
}
const html = await readFile(path.join(output, 'index.html'), 'utf8');
if (!html.includes('https://reader.scansci.com/') || html.includes('href="https://www.scansci.com/reader/"')) {
  throw new Error('Reader canonical URL must use its own subdomain');
}
await writeFile(path.join(output, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
console.log('Reader static assets ready in .local/reader-site');
