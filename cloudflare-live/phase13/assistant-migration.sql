-- Isolated assistant usage ledger (no prompts, chat messages, profile, or output saved).
CREATE TABLE IF NOT EXISTS assistant_usage_v1 (
  id TEXT PRIMARY KEY,
  telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,
  day_utc TEXT NOT NULL CHECK(length(day_utc)=10),
  mode TEXT NOT NULL CHECK(mode IN ('ai')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assistant_usage_owner_day ON assistant_usage_v1(telegram_id,day_utc);
CREATE INDEX IF NOT EXISTS idx_assistant_usage_day ON assistant_usage_v1(day_utc);
-- Strict account-wide safeguard before any AI request.
CREATE TRIGGER IF NOT EXISTS trg_assistant_global_daily_v1 BEFORE INSERT ON assistant_usage_v1
WHEN (SELECT COUNT(*) FROM assistant_usage_v1 WHERE day_utc=NEW.day_utc) >= 20
BEGIN SELECT RAISE(ABORT,'ASSISTANT_GLOBAL_DAILY_LIMIT'); END;
-- User-specific safeguards. Professional only when active and not expired in test D1.
CREATE TRIGGER IF NOT EXISTS trg_assistant_user_daily_v1 BEFORE INSERT ON assistant_usage_v1
WHEN (SELECT COUNT(*) FROM assistant_usage_v1 WHERE telegram_id=NEW.telegram_id AND day_utc=NEW.day_utc)
  >= CASE WHEN EXISTS(SELECT 1 FROM candidate_subscriptions_v2 WHERE telegram_id=NEW.telegram_id AND plan_id='professional' AND status='active' AND expires_at>datetime('now')) THEN 6 ELSE 2 END
BEGIN SELECT RAISE(ABORT,'ASSISTANT_USER_DAILY_LIMIT'); END;
