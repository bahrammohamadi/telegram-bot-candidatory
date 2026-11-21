# Phase 15 — Telegram signed-initData boundary regression (2026-11-09)

Scope: **test-only** change to `miniapp/tests/auth-boundaries.test.mjs` on `feature/cloudflare-parity-audit-2026-10-29`. It uses synthetic identities and a fake bot token; no real Telegram user data or credentials.

## Coverage
- Valid signatures at the inclusive freshness boundaries (one hour old and 60 seconds future).
- Reject expired/future timestamps outside the accepted window.
- Reject malformed JSON, missing, negative, zero, string and unsafe numeric user IDs.
- Reject duplicate signed fields, wrong bot tokens, tampered users and malformed hashes.
- Ensure a Telegram `signature` parameter does not replace the required HMAC `hash`.

## Verification
Run `cd miniapp && npm test`; the existing `test` script automatically includes `tests/*.test.mjs`. Require the **Mini App checks** workflow on the exact commit to pass before treating the test addition as accepted. Integration HTTP smoke, staging HTTP smoke, source parity and real-device/two-account Telegram tests remain separate release gates. Do not interpret this unit test as proof of user isolation or production readiness.

## Deployment / rollback
No runtime code, database migration, Worker deployment, production bot, news Worker, payments or channel changes are required for this test-only change. To revert, remove `miniapp/tests/auth-boundaries.test.mjs` in a new commit and rerun `Mini App checks`. The integration Worker remains on its independently verified deployment; do not roll it forward merely to apply tests.

Production cutover, paid AI, real payments, real-data migration and bulk notifications remain explicitly blocked pending dedicated approvals and release evidence.
