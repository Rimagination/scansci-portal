CREATE TABLE IF NOT EXISTS journal_detail (
  id INTEGER PRIMARY KEY,
  detail_json TEXT NOT NULL,
  related_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);
