# Phase 12 — Isolated two-admin operational console
Date: 2026-11-02

## Deployment isolation and exact release
- Test Worker ONLY: `candidatory-miniapp-integration`.
- Verified Cloudflare deployment: `686c28ed-84dc-4cb2-ab6f-3e6373881713`.
- Isolated D1: `candidatory-integration-test-20261101` (`2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`).
- Existing bot token remains `secret_text`. No new credentials added or exposed.
- `CANDIDATORY_TEST_ADMIN_IDS` is NOT configured, so live privileged functions correctly remain CLOSED for everyone. Never invent Telegram admin IDs or expose them in source.
- Exact complete deployed source snapshot: `phase12/integration-deployed-snapshot-2026-11-02.mjs` (117,990 characters).
- No changes to production Mini App, the news bot, or production databases.
- This phase requires no D1 schema changes; existing `manual_payment_requests_v2`, `candidate_subscriptions_v2`, `candidate_users`, `admin_audit` verified to exist in isolated D1.

## Features
- The existing subscription test panel reveals the read-only admin console ONLY when `demoAdminAllowed` confirms signed Telegram initData matches one of exactly two distinct IDs in a private server binding.
- Authenticated admin-only `POST /api/admin-console`: `overview`, `requests`, `audit`, `verify`.
- Overview: total/pending/approved/rejected simulation-only requests; logged decisions; active professional simulation subscriptions; test-account count.
- Request listing: filter by status and paginate up to 50 rows, with a bounded offset.
- Audit log: recent accept/reject entries with actor identifier, request identifier and timestamp; no receipt contents.
- Diagnostic: count reviewed simulated requests missing an audit entry. Read-only—nothing is silently repaired.
- After a demo request decision via the prior membership API, both the queue and summary are reloaded.
- Every query involving requests filters `receipt_file_id='SIMULATED_NO_FILE'`; this console does not process actual payments, uploads, bank details or receipts.
- This release does not enable two real admin accounts because their ID secret is not set; the admin panel stays hidden for ordinary users.

## Validation
- GitHub CI action (API signed synthetic accounts, mobile browser, deployed live HTML, live anonymous/forged request denial):
  https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41415016561 — PASS.
- Also: Cloudflare live source parity action `41415023428` — PASS.
- In-memory SQLite tests created two synthetic admins plus nonadmins and simulated requests; checked the fail-closed behavior for absent/one/duplicate/three-ID secret, cross-user denial, filter accuracy, audit consistency, prevention of mutation and HMAC signature tampering.
- Playwright at 320, 375, 430 px for both authorized admin and ordinary user, including live HTML fetched from the test Worker: PASS. API responses mocked only in browser tests, real Worker handler exercised in the SQLite suite.
- Live /health and `POST /api/admin-console` without a valid signature: HTTP 401 as expected. Real Telegram account end-to-end has not been performed.
- Direct read-only D1 schema check confirmed the four prerequisite tables exist; no real user data was changed.

## Deployment requirements for actual admin use
1. Obtain the two legitimate admins' Telegram numeric user IDs, then store them privately as comma-separated `CANDIDATORY_TEST_ADMIN_IDS` secret on the isolated Worker only. Do not create fake IDs and do not commit real IDs.
2. Validate each account's Telegram WebApp signed login and authorized request/queue view. Confirm non-admin denied 403.
3. Test demo request review; still no real payments or uploaded receipts.
4. Real receipts require an approved, access-controlled storage provider (Cloudflare R2 was unavailable at last check). Do not enable payment acceptance before verification, privacy review, backup and explicit production approval.
5. The AI assistant and production migration remain separate future phases.
