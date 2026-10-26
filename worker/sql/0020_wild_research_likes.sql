CREATE TABLE IF NOT EXISTS wild_research_likes (
  entry_number INTEGER NOT NULL CHECK (entry_number BETWEEN 1 AND 65),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (entry_number, user_id)
);

CREATE INDEX IF NOT EXISTS idx_wild_research_likes_user
ON wild_research_likes(user_id, entry_number);
