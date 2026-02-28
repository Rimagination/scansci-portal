-- Elsevier cache table for stable CiteScore responses
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS elsevier_cache (
  issn_key TEXT PRIMARY KEY,              -- compact ISSN, e.g. 00280836
  issn_display TEXT NOT NULL,             -- dashed ISSN, e.g. 0028-0836
  payload_json TEXT NOT NULL,             -- full Elsevier JSON payload
  source TEXT,                            -- elsevier-live / secondary-proxy-primary / gha-sync
  updated_unix INTEGER NOT NULL,          -- unix seconds
  expires_unix INTEGER NOT NULL,          -- unix seconds
  updated_at TEXT NOT NULL                -- ISO datetime
);

CREATE INDEX IF NOT EXISTS idx_elsevier_cache_expires
ON elsevier_cache(expires_unix);
