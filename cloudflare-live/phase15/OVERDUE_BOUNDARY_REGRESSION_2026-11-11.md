# Phase 15 — overdue boundary regression (2026-11-11)

Scope: isolated, offline regression only. The test file `test_task_performance_due_date_boundaries.py` reads the exact owner-scoped SQL candidate and executes it in an in-memory SQLite database with synthetic users 101 and 202. No Cloudflare deployment, D1 mutation, Telegram token, or real user record is involved.

## Run
```bash
python3 cloudflare-live/phase15/test_task_performance_due_date_boundaries.py
```

The four assertions cover: overdue and NULL status; completed status aliases; NULL, invalid, and future due dates; a separate owner; missing owner binding (must raise); and unknown owner returning zero. The test is deliberately independent of signed Telegram initData and does not prove Worker API wiring or production behavior.

## Deployment gate
Do not deploy for this test-only change. Before enabling the performance report in the isolated Worker, require a verified CI run, signed-initData binding tests, two-account isolation against the actual endpoint, mobile QA, and a recorded Worker version for rollback.

## Rollback
Revert the test and this document's commits on the development branch. No Worker rollback, D1 restore, or data migration is needed. If future Worker changes are deployed, use the previously recorded isolated Worker version and verify its response before release.
