# Phase 10 — test-only membership and gated admin review
Release date: 2026-11-02

## Scope / deployment
- Deployed ONLY Worker `candidatory-miniapp-integration`. No production Mini App or Telegram news bot changes.
- Cloudflare deployment ID: `815473d1-4dbe-4b5c-9879-1202ef7139bf`.
- Isolated D1 UUID: `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0` (`candidatory-integration-test-20261101`).
- Telegram bot secret retained as `secret_text` Cloudflare binding and never exposed.
- Complete exact source snapshot: `phase10/integration-deployed-snapshot-2026-11-02.mjs`, 99,872 characters.
- Previous features retained: signed profile, calendar, goals, public-content studio, speech/Q&A practice, quizzes, progress analytics and print/PDF.

## User functionality: simulation only
- On test dashboard: **اشتراک و مدیریت درخواست آزمایشی**.
- Free and conceptual Professional plans displayed. Target professional price: 6,900,000 tomans for 30 days, **informational only**.
- Read plan status and last 10 simulation-only requests.
- Create at most one pending simulated professional request; at most three demo requests per day.
- Simulated requests have `receipt_file_id='SIMULATED_NO_FILE'`; no bank transfer, card details, payment provider, real invoice, screenshot or receipt upload is involved.
- Only an authorized admin can accept/reject simulated requests. Demo approval records a 30-day `professional` status in independent D1; demo rejection leaves free status. This is *not* a verified payment or live entitlement.
- Subsequent current-plan reads automatically treat expired subscriptions as free.
- No paywall or actual subscription feature allocation is enabled in this release. No user should send real funds.

## Admin restrictions / unfinished prerequisites
- `CANDIDATORY_TEST_ADMIN_IDS` is a **private Cloudflare secret** containing **exactly two distinct positive Telegram user IDs** comma-separated. Only accounts whose **HMAC-validated Telegram identity** matches one of those IDs get admin review access.
- **The secret is NOT configured on the live test Worker**. Therefore admin queue and manual approvals are deliberately inaccessible to everyone in the deployed test environment. No temporary admin IDs were invented, and no user can self-promote.
- For real admin test, obtain the actual two admin Telegram IDs via secure operator setup and save secret; do not put IDs in GitHub.
- Cloudflare R2 is not enabled on this account (R2 bucket listing returned 10042). Therefore **real receipt-image uploads are not implemented**. Set up isolated private R2 bucket with authenticated user-only access if later enabled, or another authorized private storage provider.
- After secure receipt storage is available, implement verified-payment workflows separately. Neither test data nor demo approval means funds were received.

## Checks
- GitHub CI: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41408461782 — all three jobs PASS (membership-security, membership-mobile, membership-live-security).
- Real Worker handler + signed synthetic Telegram auth + SQLite tested: signed identity requirements, two-admin allowlist fail-closed, pending request creation, duplicate rejection, cross-user privacy, admin decision audit, demo approval/rejection, replay conflict and plan expiry.
- Playwright mobile 320 / 375 / 430 pixels with both built and downloaded live HTML: PASS.
- Live `/api/membership` unsigned/forged calls rejected with HTTP 401.
- Direct isolated D1 synthetic user/request created, read and deleted, no test records remaining.
- Real signed Telegram user/manual test has not been performed. The live admin panel remains gated until operator config.

## Next phase
1. Verify real user's test request and persistence in Telegram (no payment).
2. Configure actual two admin IDs as Cloudflare secret only when authorized.
3. Enable private receipt upload after an approved secure storage solution exists; no real money until verified.
4. Define explicit subscription feature entitlements and consistently enforce them server-side (not merely hiding UI).
5. Add AI helper only if a provider/budget/privacy configuration is agreed; do not mislabel deterministic text templates as AI.
6. Production release needs data backup, security/parity audit and explicit user approval.
