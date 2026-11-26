-- Phase 14: personal tasks. Apply ONLY to isolated D1 candidatory-integration-test-20261101.
CREATE TABLE IF NOT EXISTS candidate_tasks_v1 (
  id TEXT PRIMARY KEY,
  telegram_id INTEGER NOT NULL REFERENCES candidate_users(telegram_id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 180),
  details TEXT NOT NULL DEFAULT '' CHECK(length(details)<=1200),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','doing','done')),
  due_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  done_at TEXT,
  CHECK(due_date IS NULL OR (length(due_date)=10 AND due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'))
);
CREATE INDEX IF NOT EXISTS idx_candidate_tasks_owner_due ON candidate_tasks_v1(telegram_id,status,due_date);
CREATE TRIGGER IF NOT EXISTS trg_candidate_tasks_quota_v1 BEFORE INSERT ON candidate_tasks_v1
WHEN (SELECT COUNT(*) FROM candidate_tasks_v1 WHERE telegram_id=NEW.telegram_id) >= CASE
 WHEN EXISTS (SELECT 1 FROM candidate_subscriptions_v2 WHERE telegram_id=NEW.telegram_id AND plan_id='professional' AND status='active' AND expires_at>datetime('now')) THEN 100
 ELSE 10 END
BEGIN
 SELECT RAISE(ABORT,'TASK_QUOTA_LIMIT');
END;
