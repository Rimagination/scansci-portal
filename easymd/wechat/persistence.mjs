import { env } from './environment.mjs';
import { decryptWechatJson, encryptWechatJson, hashWechatValue } from '@/lib/wechat-draft/crypto';

const prefix = 'easymd-private/wechat';
export function isWechatStateStorageConfigured() {
  return Boolean(env.WECHAT_DATA && (env.EASYMD_WECHAT_DATA_KEY?.trim().length ?? 0) >= 32);
}
function database() {
  if (!isWechatStateStorageConfigured()) throw new Error('WeChat storage is not configured.');
  return env.WECHAT_DATA;
}
export const wechatObjectKeys = {
  account: browserId => `${prefix}/accounts/${hashWechatValue(browserId)}.txt`,
  component: () => `${prefix}/component.txt`,
  oauthState: state => `${prefix}/oauth/${hashWechatValue(state)}.txt`,
};
async function readEncrypted(key) {
  return database().prepare('SELECT encrypted_value FROM wechat_records WHERE object_key = ? AND (expires_at IS NULL OR expires_at > ?)')
    .bind(key, Date.now()).first('encrypted_value');
}
export async function readWechatRecord(key) {
  const value = await readEncrypted(key);
  return value ? decryptWechatJson(value) : undefined;
}
export async function writeWechatRecord(key, value) {
  await database().batch([
    database().prepare('DELETE FROM wechat_records WHERE object_key IN (SELECT object_key FROM wechat_records WHERE expires_at <= ? LIMIT 100)').bind(Date.now()),
    database().prepare('INSERT INTO wechat_records (object_key, encrypted_value, expires_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(object_key) DO UPDATE SET encrypted_value = excluded.encrypted_value, expires_at = excluded.expires_at, updated_at = excluded.updated_at')
      .bind(key, encryptWechatJson(value), Number.isFinite(value?.expiresAt) ? value.expiresAt : null, Date.now()),
  ]);
}
export async function deleteWechatRecord(key) {
  await database().prepare('DELETE FROM wechat_records WHERE object_key = ?').bind(key).run();
}
export async function consumeWechatRecord(key, validate) {
  const encrypted = await readEncrypted(key);
  if (!encrypted) return undefined;
  const record = decryptWechatJson(encrypted);
  if (!validate(record)) return undefined;
  // Comparing the encrypted row makes consume single-use even when two callbacks race.
  const deleted = await database().prepare('DELETE FROM wechat_records WHERE object_key = ? AND encrypted_value = ? RETURNING object_key').bind(key, encrypted).first('object_key');
  return deleted ? record : undefined;
}

export async function updateWechatRecord(key, previous, value) {
  const encrypted = await readEncrypted(key);
  if (!encrypted || JSON.stringify(decryptWechatJson(encrypted)) !== JSON.stringify(previous)) return false;
  const result = await database().prepare('UPDATE wechat_records SET encrypted_value = ?, expires_at = ?, updated_at = ? WHERE object_key = ? AND encrypted_value = ?')
    .bind(encryptWechatJson(value), Number.isFinite(value?.expiresAt) ? value.expiresAt : null, Date.now(), key, encrypted).run();
  return result.meta.changes === 1;
}
