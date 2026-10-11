import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const portal = resolve(fileURLToPath(new URL('..', import.meta.url)));
const source = resolve(process.argv[2] || 'D:/easymd');
const require = createRequire(realpathSync(resolve(source, 'node_modules/vite/package.json')));
const { build } = require('esbuild');
await build({
  absWorkingDir: source,
  entryPoints: [resolve(portal, 'easymd/wechat/entry.ts')],
  outfile: resolve(portal, 'easymd/wechat/server.mjs'),
  bundle: true, format: 'esm', platform: 'node', target: 'es2022',
  packages: 'bundle', external: ['node:*'],
  alias: {
    '@/env': resolve(portal, 'easymd/wechat/environment.mjs'),
    '@/lib/wechat-draft/persistence': resolve(portal, 'easymd/wechat/persistence.mjs'),
    '@': resolve(source, 'src'),
  },
  plugins: [{ name: 'wechat-private-storage', setup(build) {
    build.onResolve({ filter: /^\.\/persistence$/ }, args => {
      if (args.importer.replaceAll('\\', '/').includes('/lib/wechat-draft/')) {
        return { path: resolve(portal, 'easymd/wechat/persistence.mjs') };
      }
    });
  } }],
  logLevel: 'warning',
});
console.log('ScanSci WeChat service built from existing EasyMD handlers.');
