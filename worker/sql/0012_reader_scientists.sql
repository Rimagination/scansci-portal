-- Read-only public directory; imported from the attributed official source.
-- These are edition-specific roster records, not global person identifiers.
CREATE TABLE IF NOT EXISTS reader_scientists (
  roster_id TEXT PRIMARY KEY,
  roster_name TEXT NOT NULL,
  name TEXT NOT NULL,
  institution TEXT NOT NULL,
  country TEXT NOT NULL,
  field TEXT NOT NULL,
  subfield TEXT NOT NULL,
  publications INTEGER,
  first_year INTEGER,
  last_year INTEGER,
  career_rank INTEGER,
  career_citations INTEGER,
  career_h_index INTEGER,
  career_score REAL,
  annual_rank INTEGER,
  annual_citations INTEGER,
  annual_h_index INTEGER,
  annual_score REAL,
  profile_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_reader_scientists_career ON reader_scientists(career_rank);
CREATE INDEX IF NOT EXISTS idx_reader_scientists_annual ON reader_scientists(annual_rank);
CREATE INDEX IF NOT EXISTS idx_reader_scientists_field_career ON reader_scientists(field, career_rank);
CREATE INDEX IF NOT EXISTS idx_reader_scientists_field_annual ON reader_scientists(field, annual_rank);
CREATE VIRTUAL TABLE IF NOT EXISTS reader_scientists_search USING fts5(
  roster_id UNINDEXED, name, institution, field, subfield, aliases,
  tokenize = 'unicode61 remove_diacritics 2'
);
CREATE TABLE IF NOT EXISTS reader_scientists_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
