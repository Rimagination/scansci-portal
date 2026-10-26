CREATE TABLE IF NOT EXISTS wild_research_likes_season_two (
  entry_number INTEGER NOT NULL CHECK (entry_number >= 66),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (entry_number, user_id)
);

CREATE INDEX IF NOT EXISTS idx_wild_research_likes_season_two_user
ON wild_research_likes_season_two(user_id, entry_number);
