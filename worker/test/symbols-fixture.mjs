import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';

// Local-only test adapter: executes the real migration and SQL against SQLite.
export function createSymbolsFixture() {
  const sqlite = new DatabaseSync(':memory:');
  for (const name of ['0001_init.sql', '0002_auth_methods.sql', '0008_symbols.sql', '0009_symbols_official.sql']) sqlite.exec(readFileSync(new URL(`../sql/${name}`, import.meta.url), 'utf8'));
  sqlite.exec("INSERT INTO users (id,github_id,login,email,created_at,updated_at) VALUES (1,'test:1','本地投稿者','author@example.test','2026-09-07','2026-09-07'),(2,'test:2','本地审核员','review@example.test','2026-09-07','2026-09-07'),(3,'test:3','其他用户','other@example.test','2026-09-07','2026-09-07')");
  const DB = {
    prepare(sql) {
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async first() { return sqlite.prepare(sql).get(...args) || null; },
        async all() { return { results: sqlite.prepare(sql).all(...args) }; },
        async run() { return { meta: sqlite.prepare(sql).run(...args) }; },
      };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { const result = []; for (const statement of statements) result.push(await statement.run()); sqlite.exec('COMMIT'); return result; }
      catch (e) { sqlite.exec('ROLLBACK'); throw e; }
    },
  };
  const env = { DB, JWT_SECRET: 'local-test-only-symbols-not-a-production-secret', SYMBOLS_ENABLED: '1', ADMIN_USER_EMAILS: 'review@example.test', PUBLIC_ORIGIN: 'https://www.scansci.com' };
  const cookie = (id) => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: String(id), exp: Math.floor(Date.now()/1000) + 3600 })).toString('base64url');
    const signature = createHmac('sha256', env.JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
    return `__Secure-scansci_session=${header}.${payload}.${signature}`;
  };
  return { env, sqlite, cookie };
}
