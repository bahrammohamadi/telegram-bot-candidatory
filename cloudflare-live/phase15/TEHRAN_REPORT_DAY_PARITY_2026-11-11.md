# Phase 15 — Tehran calendar-day overdue parity (staging candidate only)

## Incident and scope
The standalone owner-scoped task performance report previously evaluated `date('now')` (UTC), while the assembled `/api/progress` endpoint uses `date('now','+210 minutes')` (Tehran UTC+03:30). This produced inconsistent overdue counts from 00:00 through 03:29 Tehran time. The report SQL now uses the same calendar-day cutoff as the API. No D1 migration or Worker deployment is required for this SQL-only correction.

## Security and test
- Preserve the `WHERE telegram_id = ?1` bind; owner must come from verified Telegram initData, never from client input.
- `test_task_performance_due_date_boundaries.py` now tests the 20:29:59 UTC / 20:30:00 UTC transition using deterministic SQL and a synthetic owner.
- Other SQL owner-isolation, query-plan and read-only regressions must remain green.
- This SQL file is an offline report query artifact, not evidence that the deployed Worker has changed. Actual signed real-account staging acceptance remains BLOCKED.

## Deployment and rollback
No Cloudflare deployment, D1 writes, payments, production changes or news Worker modifications were performed.
For rollback, revert commits `cdb8ba655853a93f3eca57650f967e9a202237f7` and `e767c3f2cd8a120c42b94d1b32e5b8c0017e94f9` in reverse order; restore only this SQL and its test. No D1 restore or Worker rollback is necessary.
Do not ship to production without security, backup, CI, and separate explicit approval.
