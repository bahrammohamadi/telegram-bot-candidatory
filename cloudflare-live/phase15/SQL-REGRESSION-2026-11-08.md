# Phase 15 SQL regression test — 2026-11-08

Scope: isolated SQLite regression test for `task-performance-owner-scoped.sql`. It is **not** Telegram HMAC validation, a live D1 test, or an HTTP/mobile integration test.

Run from repository root: `python3 cloudflare-live/phase15/test_task_performance_sql.py`.

Six cases: owner 101 counts, owner 202 isolation, null due date, missing owner, mandatory bound parameter, and read-only execution. Fixtures are synthetic and kept only in memory.

**Deployment:** None. No Worker upload, D1 schema change, production action, or news publication. The existing staging Worker-to-D1 `DB_UNAVAILABLE` HTTP issue remains a blocker; do not claim this test resolves it.

**Rollback:** revert the commit adding `cloudflare-live/phase15/test_task_performance_sql.py` (or delete this file in a new commit). The SQL query, database, Worker and live deployments remain untouched. Re-run the test and existing CI before any later integration deployment.

**Release gate:** require passing CI, signed Telegram test identities, two-user API isolation, mobile UX, D1/Worker HTTP health, backup and explicit approval before production.
