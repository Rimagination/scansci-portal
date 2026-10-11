CREATE TABLE IF NOT EXISTS wechat_records (
  object_key TEXT PRIMARY KEY,
  encrypted_value TEXT NOT NULL,
  expires_at INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wechat_records_expiry ON wechat_records(expires_at);
