-- Educational Workers AI request budget. Applied to remote D1 2026-10-27.
-- AI prompts and responses are deliberately NOT persisted.
CREATE TABLE IF NOT EXISTS ai_daily_usage(telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id),day TEXT NOT NULL CHECK(length(day)=10),requests INTEGER NOT NULL DEFAULT 0 CHECK(requests>=0),PRIMARY KEY(telegram_id,day));
CREATE TABLE IF NOT EXISTS ai_global_usage(day TEXT PRIMARY KEY CHECK(length(day)=10),requests INTEGER NOT NULL DEFAULT 0 CHECK(requests>=0));
-- Schedule a future cleanup of daily usage rows; 30-90 day retention after privacy review.
