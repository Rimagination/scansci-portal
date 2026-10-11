PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_openalex_credentials (
  user_id INTEGER PRIMARY KEY,
  key_ciphertext TEXT NOT NULL,
  key_iv TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_openalex_usage_limits (
  user_id INTEGER PRIMARY KEY,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
