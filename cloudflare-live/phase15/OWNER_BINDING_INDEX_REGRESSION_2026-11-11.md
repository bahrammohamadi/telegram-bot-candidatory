# Phase 15 — owner binding and indexed report regression (2026-11-11)

Scope: synthetic SQLite only. New `test_task_report_owner_binding_and_index.py` verifies that bound owner values resembling SQL injection do not expand report scope or mutate rows; it also checks that `EXPLAIN QUERY PLAN` uses the synthetic owner index instead of a full scan. CI workflow now discovers both `test_task_report*.py` files and triggers on either test file.

Code commits: `4901b235caf4489706fc155f4c845021f973ce26` (test), `248d30a937ce17e35222666284a5742741253f95` (CI). Review CI for the exact workflow commit; do not claim successful execution before the job concludes. The fixture's index does NOT prove that the live D1 schema has an equivalent index. No API authentication, real Telegram user, or mobile device was tested.

Deployment: none; no Worker or D1 change is necessary for test-only commits. Keep `candidatory-news-bot` untouched.

Rollback: first revert this documentation commit, then `248d30a` and `4901b23` in reverse dependency order, checking for subsequent changes. No Worker rollback or D1 restore is required. Production release remains blocked pending separate explicit approval.
