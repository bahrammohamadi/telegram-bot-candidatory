# Phase 15 — SQLite read-only report guard (2026-11-11)

Scope: new offline regression test `test_task_report_read_only_authorizer.py` on development branch only. It uses an in-memory synthetic SQLite table, checks the owner-scoped performance report query under an SQLite authorizer permitting only SELECT/READ/FUNCTION, and verifies DELETE is denied. No live user, Telegram signature, Worker or D1 request is exercised.

Local smoke verification: 2 equivalent synthetic SQLite authorizer checks passed in Python 3. This does not establish a successful repository-wide CI run or signed Telegram isolation.

Run the exact committed test with: `python -m unittest discover -s cloudflare-live/phase15 -p 'test_task_report_read_only_authorizer.py' -v`. Also run `python -m unittest discover -s cloudflare-live/phase15 -p 'test_task_report_query_plan.py' -v`. CI must be verified against the new commit SHA before considering the gate satisfied.

Staging-only deployment: none required; test-only change. Staging Worker deployment baseline version `7489532d` (100%), D1 `candidatory-integration-test-20261101` verified by Cloudflare read-only GET. News Worker `1c080a9a` (100%) not modified.

Rollback: revert test commit `542d17aff47b3c70064e7f295d8983bf16ba533d` and this documentation commit on development branch, newest first. No Worker or D1 rollback needed. Production release remains NO-GO pending signed two-account staging acceptance, backup, security and explicit approval.
