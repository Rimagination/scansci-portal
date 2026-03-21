PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS journal_submission_stats_external (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issn_key TEXT NOT NULL,
  issn_display TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  review_time_days REAL,
  review_time_label TEXT,
  first_decision_days REAL,
  accept_rate_pct REAL,
  sample_size INTEGER,
  overall_score REAL,
  source_url TEXT NOT NULL,
  updated_at TEXT,
  fetched_at TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  raw_json TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  UNIQUE (issn_key, source_name, source_url)
);

CREATE INDEX IF NOT EXISTS idx_submission_external_issn_type
ON journal_submission_stats_external(issn_key, source_type, status, fetched_at DESC);

CREATE TABLE IF NOT EXISTS journal_user_ratings (
  user_id INTEGER NOT NULL,
  issn_key TEXT NOT NULL,
  issn_display TEXT NOT NULL,
  speed_score INTEGER NOT NULL CHECK (speed_score BETWEEN 1 AND 5),
  editor_score INTEGER NOT NULL CHECK (editor_score BETWEEN 1 AND 5),
  recommend_score INTEGER NOT NULL CHECK (recommend_score BETWEEN 1 AND 5),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, issn_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_journal_user_ratings_issn
ON journal_user_ratings(issn_key, updated_at DESC);
