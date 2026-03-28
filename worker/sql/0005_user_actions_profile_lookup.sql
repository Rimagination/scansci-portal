PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_user_actions_user_app_action_created
ON user_actions(user_id, app_id, action_type, created_at DESC);
