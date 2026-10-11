-- Each portal collection has its own account-owned order.
CREATE TABLE IF NOT EXISTS user_card_orders (
  user_id INTEGER NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('online', 'materials', 'open-source')),
  app_ids_json TEXT NOT NULL CHECK (json_valid(app_ids_json) AND json_type(app_ids_json) = 'array'),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, section),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
