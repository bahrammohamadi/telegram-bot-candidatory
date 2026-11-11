# Phase 15 — assembled API task report semantic CI gate (2026-11-11)

## Change
Added `test_assembled_progress_sqlite.py` to validate the SQL extracted from the **assembled** integration Worker, not a separate report-only SQL artifact. Synthetic SQLite rows cover two owners, empty owner, done/completed/doing statuses, overdue/future/today dates, null status, alternating owner reads and rejection of missing SQL bind parameters. CI builds the Worker first, then runs this regression.

## Evidence and limitations
Development branch `feature/cloudflare-parity-audit-2026-10-29`; test commit `feec8f544ee293c31523d2c171d7edd7eb944a73`; workflow wiring `45ee8f5bdd34a79c99dc6c6c45b6f002b03b02df`; YAML correction `ddfdad6816ef4cb68de8f906b66ba41664385019`. The first workflow run failed due to literal escaped newlines in YAML; the follow-up commit corrected the workflow. Confirm the **latest** Actions run outcome before claiming tests passed. The test uses a deterministic UTC date mapped to Tehran calendar date, but is not evidence of live D1 or two real Telegram accounts.

## Deployment and rollback
No Worker or D1 deployment/migration is needed; all test fixtures are local synthetic data. Do not change the news Worker or production. To roll back, revert this document, the YAML correction, the workflow wiring, and the test commit in reverse order, resolving any concurrent changes before revert. No Cloudflare or database rollback is required.

## Release blockers
Two real consenting Telegram test accounts, real-device mobile acceptance, staging backup evidence, and final production security gate remain mandatory. Production remains blocked pending separate explicit approval.
