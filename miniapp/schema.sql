CREATE TABLE IF NOT EXISTS accounts (
 telegram_id TEXT PRIMARY KEY,
 first_name TEXT NOT NULL DEFAULT '',
 last_name TEXT NOT NULL DEFAULT '',
 username TEXT NOT NULL DEFAULT '',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS profile (
 telegram_id TEXT PRIMARY KEY REFERENCES accounts(telegram_id),
 full_name TEXT NOT NULL DEFAULT '',
 election_type TEXT NOT NULL DEFAULT '',
 constituency TEXT NOT NULL DEFAULT '',
 occupation TEXT NOT NULL DEFAULT '',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tasks (
 id TEXT PRIMARY KEY,
 telegram_id TEXT NOT NULL REFERENCES accounts(telegram_id),
 title TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(telegram_id,created_at);
CREATE TABLE IF NOT EXISTS assessments (
 id TEXT PRIMARY KEY,
 telegram_id TEXT NOT NULL REFERENCES accounts(telegram_id),
 score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assessments_owner ON assessments(telegram_id,created_at);

CREATE TABLE IF NOT EXISTS learning_progress (
 telegram_id TEXT NOT NULL REFERENCES accounts(telegram_id),
 course_id TEXT NOT NULL,
 passed INTEGER NOT NULL DEFAULT 0 CHECK (passed IN (0,1)),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (telegram_id,course_id)
);

CREATE TABLE IF NOT EXISTS assessment_attempts_v2 (
 id TEXT PRIMARY KEY,
 telegram_id TEXT NOT NULL REFERENCES accounts(telegram_id),
 assessment_type TEXT NOT NULL,
 answers_json TEXT NOT NULL,
 breakdown_json TEXT NOT NULL,
 score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
 submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_v2_owner ON assessment_attempts_v2(telegram_id,submitted_at);
