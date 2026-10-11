import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = resolve(process.argv[2] || fileURLToPath(new URL('../', import.meta.url)));
const manifest = JSON.parse(readFileSync(resolve(siteRoot, 'easymd/native/.vite/manifest.json'), 'utf8'));
const entry = manifest['src/scansci-entry.tsx'];
if (!entry?.isEntry || !entry.file) throw new Error('The native EasyMD bundle has no entry.');
const styles = new Set();
const visited = new Set();
function collectStyles(key) {
  if (visited.has(key)) return;
  visited.add(key);
  for (const child of manifest[key].imports || []) collectStyles(child);
  for (const css of manifest[key].css || []) styles.add('/easymd/native/' + css);
}
collectStyles('src/scansci-entry.tsx');
const bootstrap = `import { mountEasyMD as mount } from ${JSON.stringify('/easymd/native/' + entry.file)};
const styles = ${JSON.stringify([...styles])};
export async function mountEasyMD(element) {
  await Promise.all(styles.map(href => new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = () => { link.remove(); reject(new Error('Editor stylesheet failed to load')); };
    document.head.insertBefore(link, document.querySelector('link[href^="/styles.css"]'));
  })));
  mount(element);
}
`;
writeFileSync(resolve(siteRoot, 'easymd/bootstrap.js'), bootstrap);
console.log(`Native EasyMD bootstrap generated: ${entry.file}, ${styles.size} stylesheets`);
