CREATE TABLE IF NOT EXISTS journal_search (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  issn TEXT NOT NULL DEFAULT '',
  eissn TEXT NOT NULL DEFAULT '',
  cn_number TEXT NOT NULL DEFAULT '',
  if_2023 REAL,
  if_year TEXT NOT NULL DEFAULT '',
  jcr_quartile TEXT NOT NULL DEFAULT '',
  cas_2025 TEXT NOT NULL DEFAULT '',
  is_top INTEGER,
  hq_level TEXT NOT NULL DEFAULT '',
  pku_core INTEGER NOT NULL DEFAULT 0,
  cssci_type TEXT NOT NULL DEFAULT '',
  cscd_type TEXT NOT NULL DEFAULT '',
  warning_latest TEXT NOT NULL DEFAULT '',
  xuankan_2026 TEXT NOT NULL DEFAULT '',
  xuankan_warning INTEGER NOT NULL DEFAULT 0,
  ni_journal INTEGER,
  ni_new INTEGER,
  tags_json TEXT NOT NULL DEFAULT '[]',
  abbrs TEXT NOT NULL DEFAULT '',
  quality_score REAL NOT NULL DEFAULT 0,
  search_text TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_search_issn ON journal_search(issn);
CREATE INDEX IF NOT EXISTS idx_journal_search_eissn ON journal_search(eissn);
CREATE INDEX IF NOT EXISTS idx_journal_search_cn_number ON journal_search(cn_number);
CREATE INDEX IF NOT EXISTS idx_journal_search_if ON journal_search(if_2023 DESC);
CREATE INDEX IF NOT EXISTS idx_journal_search_quality ON journal_search(quality_score DESC);

CREATE VIRTUAL TABLE IF NOT EXISTS journal_search_fts USING fts5(
  title,
  issn,
  eissn,
  cn_number,
  tags,
  search_text
);
