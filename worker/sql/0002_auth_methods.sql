-- scanSci auth extension: email code login + github link mapping
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS github_links (
  github_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_unix INTEGER NOT NULL,
  consumed_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  ip TEXT,
  created_unix INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_email_verifications (
  user_id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_codes_lookup
ON email_verification_codes(email, purpose, created_unix DESC);

CREATE INDEX IF NOT EXISTS idx_email_codes_ip
ON email_verification_codes(ip, created_unix DESC);
