# Phase 15 — empty owner and NULL-status regression (2026-11-11)

Change: add `test_empty_owner_and_null_status_are_scoped` to `test_task_report_read_only_authorizer.py` (commit `82c9546cca07b21e3c43866a0382aedff04aadb4`). Synthetic fixture checks an owner with no tasks returns (0,0,0,0), a NULL-status overdue task belongs only to its owner, and a completed task belonging to a different owner does not leak.

CI: `.github/workflows/phase15-owner-report-sqlite-safety.yml` runs this test on branch pushes. Check the run on the exact test commit or this documentation commit before marking it verified. Prior gate on `f51e01b7` completed successfully (run 42961847825), which does not prove the new test.

Scope: offline SQLite fixture only; not proof of signed Telegram initData, live HTTP API isolation, mobile UX or real-user acceptance. No Worker deployment or D1 mutation required. News Worker untouched.

Rollback: revert this documentation commit then `82c9546cca07b21e3c43866a0382aedff04aadb4` on the development branch after checking for newer dependent changes. No Worker rollback or D1 restore. Production stays blocked until independent release approval.
