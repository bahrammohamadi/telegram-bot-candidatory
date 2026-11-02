-- ISOLATED TEST D1 ONLY. Existing quizzes, quiz_questions and quiz_attempts tables are reused.
CREATE TABLE IF NOT EXISTS quiz_guidance_v1 (
  question_id INTEGER PRIMARY KEY REFERENCES quiz_questions(id) ON DELETE CASCADE,
  rationale TEXT NOT NULL CHECK(length(rationale) BETWEEN 15 AND 1500),
  source_url TEXT NOT NULL CHECK(length(source_url) BETWEEN 12 AND 800)
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_owner_date ON quiz_attempts(telegram_id,submitted_at DESC);
