import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import workerSource from '../src/index.js';

const worker = process.env.SESSION_TEST_WORKER ? (await import(pathToFileURL(process.env.SESSION_TEST_WORKER))).default : workerSource;
const secret = 'shared-session-test-secret';
function token() {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const input = encode({ alg:'HS256', typ:'JWT' }) + '.' + encode({ sub:'17', exp:Math.floor(Date.now()/1000)+300 });
  return input + '.' + createHmac('sha256', secret).update(input).digest('base64url');
}
function bindings() {
  return { JWT_SECRET:secret, PUBLIC_ORIGIN:'https://www.scansci.com', SESSION_COOKIE_DOMAIN:'.scansci.com', DB:{
    prepare(sql) { return { bind() { return this; }, async first() { return sql.includes('FROM users') ? {id:17,login:'Session test',github_id:null,email:'test@example.com',avatar_url:null} : null; }, async all() { return {results:[]}; } }; },
  } };
}
const request = cookie => new Request('https://www.scansci.com/api/me', {headers:{Cookie:cookie}});

test('a valid legacy login is migrated to a secure shared session before returning the user', async () => {
  const response = await worker.fetch(request('__Host-scansci_session='+token()), bindings());
  assert.equal(response.status,200);
  assert.equal((await response.json()).user.id,17);
  const cookies = response.headers.get('Set-Cookie');
  assert.match(cookies,/__Secure-scansci_session=/);
  for (const attribute of ['Domain=.scansci.com','Path=/','HttpOnly','Secure','SameSite=Lax']) assert.ok(cookies.includes(attribute), attribute);
  assert.match(cookies,/__Host-scansci_session=;[^,]*Max-Age=0/);
});

test('an existing shared login is not reissued on every account read', async () => {
  const response = await worker.fetch(request('__Secure-scansci_session='+token()), bindings());
  assert.equal(response.status,200);
  assert.equal(response.headers.get('Set-Cookie'),null);
});

test('invalid legacy sessions cannot mint a shared cookie', async () => {
  const response = await worker.fetch(request('__Host-scansci_session=invalid'), bindings());
  assert.equal(response.status,401);
  assert.equal(response.headers.get('Set-Cookie'),null);
});
