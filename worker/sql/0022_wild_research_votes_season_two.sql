CREATE TABLE IF NOT EXISTS wild_research_votes_season_two (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_number INTEGER NOT NULL CHECK (entry_number >= 66),
  vote_slot INTEGER NOT NULL CHECK (vote_slot IN (1, 2, 3)),
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, entry_number),
  UNIQUE (user_id, vote_slot)
);

CREATE INDEX IF NOT EXISTS idx_wild_research_votes_season_two_entry
ON wild_research_votes_season_two(entry_number);
