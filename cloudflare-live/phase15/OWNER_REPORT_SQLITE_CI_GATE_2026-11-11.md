# Phase 15 — owner-scoped report SQL CI gate (2026-11-11)

Added `.github/workflows/phase15-owner-report-sqlite-safety.yml` in commit `c7d9b6720d1df6d40e9172fefc59a1bad54e98f7`. It executes the four synthetic SQLite tests from `test_task_report_read_only_authorizer.py` on SQL/test/workflow changes and via manual dispatch. The checks cover read-only SQL authorization, mutation rejection, required owner binding, and cross-owner exclusion.

Verification: inspect the workflow run on the exact commit; a green unrelated workflow does not prove this new job. If no run appears, mark CI **NOT VERIFIED** and trigger workflow_dispatch only after confirming workflow visibility. Do not treat synthetic SQLite results as proof of Telegram signed initData, live API isolation, mobile usability or real-user acceptance.

Deployment: no Worker/D1 change is required for this CI-only gate. Keep `candidatory-miniapp-integration` bound to `candidatory-integration-test-20261101` and leave `candidatory-news-bot` untouched. Production remains BLOCKED pending the signed two-account staging acceptance protocol, security and backup evidence, and separate explicit approval.

Rollback: revert this documentation commit and `c7d9b6720d1df6d40e9172fefc59a1bad54e98f7` (newest first) on the development branch. No Worker rollback or D1 restore is necessary. Never revert unrelated concurrent commits.
