# Phase 15 — owner report SQL regression assertion repair (2026-11-11)

Baseline: branch head 2c0b98d85daddef2ed7ebcf180096a29d2770d1a. Existing test_task_report_query_plan.py contained raw regex strings with double-escaped backslashes for SELECT, UNION and owner predicate checks. As a result these three assertions did not match SQL tokens correctly; the SELECT-count assertion would fail on a normal query, while the UNION negative assertion could miss malicious additions. The existing query parser and owner-scope check already used correctly escaped expressions.

Change: corrected those three regex literals in the test only (commit 10b42fb1726bce54eb182f325bc40107f3744d5f). No SQL, Worker, D1, secrets, news bot or production changes.

Verification: local Python regex smoke check on a synthetic UNION query detected two SELECT tokens, one UNION and one owner predicate. This is NOT a full repository test run. Run from repository root: `python -m unittest cloudflare-live/phase15/test_task_report_query_plan.py -v`. Verify the task-progress GitHub Actions workflow on the exact commit SHA; do not claim CI success before completion. Staging Worker baseline version 7489532d (100%); news Worker baseline 1c080a9a (100%); integration D1 name/ID checked read-only.

Rollback: revert commit 10b42fb1726bce54eb182f325bc40107f3744d5f on the development branch. No Cloudflare or database rollback is needed. The previous test assertions are defective, so prefer fixing any CI failures instead of restoring them. Production release remains NO-GO until all gates and explicit approval.
