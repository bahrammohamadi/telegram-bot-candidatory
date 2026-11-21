-- Phase 15: owner-scoped task counts for performance reporting (integration only).
-- Bind ?1 to the telegram_id obtained ONLY after server-side Telegram initData HMAC verification.
-- Never accept owner ID from query strings, request bodies or display names.
-- Read-only: no migrations, no cross-user aggregation.
-- Calendar-day overdue cutoff uses Tehran UTC+03:30, matching /api/progress.
-- This is date-based semantics, not a per-minute deadline; future migrations
-- must review timezone handling if due_date becomes a timestamp deadline.
-- NULL status is counted as open (fail-safe); date() normalizes timestamp due dates.
SELECT
  COUNT(*) AS total_tasks,
  COALESCE(SUM(CASE WHEN status IN ('done', 'completed') THEN 1 ELSE 0 END), 0) AS completed_tasks,
  COALESCE(SUM(CASE WHEN status IS NULL OR status NOT IN ('done', 'completed') THEN 1 ELSE 0 END), 0) AS open_tasks,
  COALESCE(SUM(CASE WHEN (status IS NULL OR status NOT IN ('done', 'completed')) AND due_date IS NOT NULL AND date(due_date) < date('now','+210 minutes') THEN 1 ELSE 0 END), 0) AS overdue_tasks
FROM candidate_tasks_v1
WHERE telegram_id = ?1;
-- Integration validation 2026-11-08: read-only D1 CTE fixture for owner 101
-- (done, NULL overdue, open future) plus owner 202 (done) yielded 3/1/2/1.
-- This checks SQL semantics and synthetic owner separation, NOT real Telegram auth.
-- API/identity/mobile/CI and Worker->D1 health remain unvalidated.
-- Rollback: revert this commit to restore the previous SQL file; no D1 schema
-- or Worker deployment changed. Re-run fixture and CI before any deployment.
