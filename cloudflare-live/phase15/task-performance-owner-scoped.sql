-- Phase 15: owner-scoped task counts for performance reporting (integration only).
-- Bind ?1 to the telegram_id obtained ONLY after server-side Telegram initData HMAC verification.
-- Never accept owner ID from query strings, request bodies or display names.
-- Read-only: no migrations, no cross-user aggregation.
SELECT
  COUNT(*) AS total_tasks,
  COALESCE(SUM(CASE WHEN status IN ('done', 'completed') THEN 1 ELSE 0 END), 0) AS completed_tasks,
  COALESCE(SUM(CASE WHEN status NOT IN ('done', 'completed') THEN 1 ELSE 0 END), 0) AS open_tasks,
  COALESCE(SUM(CASE WHEN status NOT IN ('done', 'completed') AND due_date IS NOT NULL AND due_date < date('now') THEN 1 ELSE 0 END), 0) AS overdue_tasks
FROM candidate_tasks_v1
WHERE telegram_id = ?1;
-- Integration validation 2026-11-08: actual D1 table/columns inspected via PRAGMA;
-- a read-only equivalent query with nonexistent owner -1 returned zero totals.
-- API/identity/mobile/CI not validated by this SQL-only check.
-- Rollback: revert the commit adding this file; no D1 schema or Worker deployment changed.
