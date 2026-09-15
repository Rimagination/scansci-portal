-- SVG bodies are capped at 200 KiB by the application; no change to auth tables.
CREATE TABLE IF NOT EXISTS symbols (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  license TEXT NOT NULL CHECK (license IN ('CC0-1.0', 'CC-BY-4.0')),
  source_url TEXT NOT NULL DEFAULT '',
  svg TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected')),
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  published_at TEXT,
  reviewed_at TEXT,
  reviewer_id INTEGER REFERENCES users(id),
  UNIQUE(user_id, sha256)
);
CREATE INDEX IF NOT EXISTS symbols_public ON symbols(status, published_at DESC, id);
CREATE INDEX IF NOT EXISTS symbols_owner ON symbols(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS symbol_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol_id TEXT NOT NULL REFERENCES symbols(id),
  reviewer_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
