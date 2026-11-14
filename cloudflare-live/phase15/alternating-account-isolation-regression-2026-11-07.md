# Phase 15 — sequential account isolation regression (2026-11-07)

## Change
Commit `96b6e245f80d1cc9a59fd6727a46c37141930162` extends the synthetic `progress-tasks-e2e.mjs` test with alternating signed accounts A→B→A→B. It asserts each response contains only the current authenticated account's task metrics and every SQL query binds the current account ID. This guards against stale request-scoped owner state across successive requests in one Worker isolate.

## Verification
Run `node cloudflare-live/phase15/build-progress-tasks.mjs && node cloudflare-live/phase15/progress-tasks-e2e.mjs` on a clean checkout; independently confirm the GitHub Actions results for this commit and the documentation commit. On 2026-11-07, read-only Cloudflare D1 query `SELECT 1 AS health_check` returned 1 against the isolated integration database. This proves D1 query availability only, **not** end-to-end Worker↔D1 health or real Telegram identity isolation.

## Deployment and rollback
Test-only changes: **no Worker deployment or D1 migration**. If this assertion is incorrect, revert the test commit on the feature branch and rerun CI. Do not touch the deployed Worker or D1. Before any future integration deployment, capture the current deployment ID, version, bindings and rollback artifact; deploy only the isolated integration Worker and verify signed identities and D1 with two authorized test accounts.

## Release gate
NO-GO: live signed Telegram WebView tests, independent Worker↔D1 verification, mobile accessibility, safe backup/restore, and security review remain mandatory. Production, payment, paid AI, mass messaging and news Worker are out of scope.