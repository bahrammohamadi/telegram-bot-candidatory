-- Isolated D1 only. Training session records; never apply to production without review.
CREATE TABLE IF NOT EXISTS practice_sessions_v1 (
  id TEXT PRIMARY KEY,
  telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,
  exercise_key TEXT NOT NULL CHECK(exercise_key IN ('speech_clear','speech_evidence','qa_unknown','qa_followup')),
  kind TEXT NOT NULL CHECK(kind IN ('speech','qa')),
  response_text TEXT NOT NULL DEFAULT '' CHECK(length(response_text) <= 3000),
  reflection TEXT NOT NULL DEFAULT '' CHECK(length(reflection) <= 1000),
  self_score INTEGER NOT NULL CHECK(self_score BETWEEN 1 AND 5),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK(duration_seconds BETWEEN 0 AND 900),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_practice_owner_date ON practice_sessions_v1(telegram_id,created_at DESC);
