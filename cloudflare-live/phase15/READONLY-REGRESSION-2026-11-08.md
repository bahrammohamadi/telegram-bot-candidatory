# Phase 15 — read-only regression strengthening (2026-11-08)

Scope: development branch only; no Worker deployment or D1 mutation.

Commit f8f488332fcedc81478b9ad62029f329766ced54 strengthens the local SQLite task-performance SQL suite:
- Runs the owner-scoped query under `PRAGMA query_only = ON`, so writes fail even when row counts stay constant.
- Adds an old completed task with timestamp due date and checks it is counted as completed but not overdue.
- The suite now has **nine** tests (previously eight); any CI step label still saying eight is stale metadata, not evidence of test count.

## Verification gate
`python3 cloudflare-live/phase15/test_task_performance_sql.py` must report **Ran 9 tests / OK**. Inspect GitHub Actions on this branch and do not infer success from a pushed commit. Separately validate Worker HTTP -> D1, signed Telegram initData, owner isolation, and mobile UI; the previously reported DB_UNAVAILABLE is unresolved until a passing live check.

## Rollback
Revert commit `f8f488332fcedc81478b9ad62029f329766ced54` on the development branch if tests regress. No database rollback, production deployment, payment, paid AI, notification, or news Worker operation is involved.
