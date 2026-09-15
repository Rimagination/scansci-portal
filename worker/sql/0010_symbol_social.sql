-- Static catalog IDs and published submission IDs share this namespace.
-- Application allowlisting gates every write; static IDs have no symbols row.
CREATE TABLE IF NOT EXISTS symbol_reactions (
  symbol_id TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('like','save')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (symbol_id,kind,user_id)
);
CREATE INDEX IF NOT EXISTS symbol_reactions_user ON symbol_reactions(user_id,kind,symbol_id);
CREATE TABLE IF NOT EXISTS symbol_downloads (
  symbol_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  day TEXT NOT NULL,
  PRIMARY KEY (symbol_id,actor,day)
);
