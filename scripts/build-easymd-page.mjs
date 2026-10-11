import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Generate the direct entry from the shared portal shell so navigation stays in sync.
const siteRoot = resolve(process.argv[2] || fileURLToPath(new URL('../', import.meta.url)));
const portal = readFileSync(resolve(siteRoot, 'index.html'), 'utf8');
if (!portal.includes('id="easymdView"')) throw new Error('The portal is missing its EasyMD workspace.');
const page = portal
  .replace('<title>ScanSci | 学术工具门户</title>', '<title>EasyMD | ScanSci</title>')
  .replace('rel="canonical" href="https://www.scansci.com/"', 'rel="canonical" href="https://www.scansci.com/easymd/"')
  .replace('property="og:url" content="https://www.scansci.com/"', 'property="og:url" content="https://www.scansci.com/easymd/"')
  .replace('<body>', '<body class="is-easymd">')
  .replace(/(<section id="easymdView"[^>]*?) hidden>/, '$1>')
  .replace(/(<section id="onlineToolsView"[^>]*?)>/, '$1 hidden>');
mkdirSync(resolve(siteRoot, 'easymd'), { recursive: true });
writeFileSync(resolve(siteRoot, 'easymd/index.html'), page);
for (const route of ['about', 'docs/mcp', 'docs/skill']) {
  mkdirSync(resolve(siteRoot, 'easymd', route), { recursive: true });
  writeFileSync(resolve(siteRoot, 'easymd', route, 'index.html'), page);
}
console.log(`EasyMD page generated in ${siteRoot}`);
