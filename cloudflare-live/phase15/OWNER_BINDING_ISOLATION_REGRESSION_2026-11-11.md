# Phase 15 — Owner binding and report isolation regression (2026-11-11)

Change: extend `test_task_report_read_only_authorizer.py` with two synthetic SQLite regression cases: missing owner bind parameter must fail, and another owner's tasks must not affect the requested owner's report. These tests do **not** prove Telegram signature verification, live API isolation or mobile UX.

Run: `python -m unittest discover -s cloudflare-live/phase15 -p 'test_task_report_read_only_authorizer.py' -v`. Review the exact commit's GitHub Actions results before marking this control PASS.

Deployment: no Worker/D1 deployment; test-only change. Confirm the integration Worker binding and staging database independently before any later staging deployment. Do not modify the news Worker.

Rollback: revert code commit `c80ab9706e82f104d980b69b0f745ec2d583811b` and this documentation commit (newest first) on the development branch. No D1 restoration or Worker rollback is needed.

Release gate remains BLOCKED until signed two-account staging tests, security review, private evidence, verified backup, CI, and explicit production approval are complete.
