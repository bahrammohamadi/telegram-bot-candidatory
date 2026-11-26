# Phase 11 — isolated demo-plan server enforcement
Date: 2026-11-02

## Deployment
- Only test Worker changed: `candidatory-miniapp-integration`.
- Live isolated deployment: `0af7c47b-8860-4e55-9dbb-70047e1bdfa5`.
- Independent D1 database: `candidatory-integration-test-20261101` (`2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`).
- Existing Cloudflare `TELEGRAM_BOT_TOKEN` remains secret; actual two-admin secret **not configured**.
- Complete deployed source: `phase11/integration-deployed-snapshot-2026-11-02.mjs` (105,553 characters), not generated from a truncated copy.
- No production application, production database, or Telegram news bot changed.

## Provisional free vs professional limits (test-only)

| Resource | Free | Professional simulated |
|---|---:|---:|
| Saved goals | 5 | 100 |
| Saved calendar events | 10 | 100 |
| Saved speaking/Q&A attempts | 10 | 200 |
| Saved editorial drafts | 3 | 100 |
| Quiz submissions per rolling 24 hours (across quizzes) | 2 | 20 |

- Both plans can read, edit and delete **their own** existing records when the creation quota is reached. New records can be created after deletion where the quota is a stored count.
- Quiz cap counts submissions in the past 24h. A declined attempt is not recorded.
- The plan is derived only from `candidate_subscriptions_v2` where plan is professional, status is active and expiration is in the future; client-submitted plan names and self-declared admin fields are ignored.
- If a professional test subscription expires, the account immediately receives free-plan limits on its next request. Existing data stays readable and deletable; new writes remain capped.
- Quotas are enforced on authenticated write operations of `/api/goals`, `/api/calendar`, `/api/practice`, `/api/studio`, and `/api/quiz`. Authenticated read-only `/api/entitlements` returns current usage, remaining quota and the effective plan.
- Five SQLite BEFORE INSERT triggers enforce quota invariants at the database layer, including concurrent/direct insert attempts. Migration: `phase11/demo-quotas-migration.sql`; reversible trigger-only rollback in `phase11/demo-quotas-rollback.sql`.
- Quota-denied API requests return HTTP 429 and `code='PLAN_LIMIT_REACHED'` with Persian explanation; direct concurrent database constraint violations may still surface as a generic write failure. Improve mapping and conflict handling before production.
- The subscription UI now displays all five usage counters and remaining quotas, refreshed from the signed owner-only endpoint.
- Existing premium "approval" remains a demo/manual test action. **No actual payments are accepted.** No receipts are uploaded; Cloudflare R2 is disabled.

## Verification
- GitHub workflow: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41411468496
- All 3 CI jobs PASS: signed-user end-to-end free/pro/expiry/forgery tests; mobile UI at 320/375/430 px on built and downloaded live HTML; live unsigned/forged requests rejected with 401.
- SQLite integration includes 5-goal free cap, expired downgrade, 10 calendar cap, 10 practices, 3 studio drafts, 2 quizzes/day across quizzes, owner data isolation, delete/edit access under cap, and trigger direct-write bypass rejection.
- Direct isolated Cloudflare D1 check used two synthetic users, confirmed free cap and pro rights, then expiry downgrade; cleaned all temporary fixtures.
- Existing prior endpoints and modules confirmed present in complete live Worker snapshot.

## Remaining release gates
1. Real Telegram session smoke (user should open test Mini App, test counters and save/reopen).
2. Configure actual two Telegram admin IDs in `CANDIDATORY_TEST_ADMIN_IDS` via secure Cloudflare secret; do not place IDs in public repository.
3. Implement authenticated secure receipt storage (Cloudflare R2 currently unavailable); no real payment flows until verified.
4. Add billing and entitlements authorization review; current quotas/pro assignments are provisional test policy, not approved final packaging or live charging.
5. Develop AI assistant on authorized provider with privacy review; keep factual neutral civic content, no fabricated results.
6. Formal production release requires explicit approval, backup, validated parity, audit and fallback plan.
