# Phase 15 — Telegram initData type-confusion probe (2026-11-07)

Scope: isolated GitHub Actions HTTP security gate only. No Worker, D1, production, news bot, payment, AI or broadcast changes.

## Baseline evidence
- Development branch: feature/cloudflare-parity-audit-2026-10-29.
- Previous workflow commit: cf954bd44b9aa9234167600a86bcdd8219633408 (documentation).
- Previous auth workflow run: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42315148507 — completed **failure** (job integration-http-auth).
- Cloudflare integration deployment read via API: f1eb351c-c3ee-4e46-bb58-b8cadb6e769b, 2026-11-06T07:58:50Z. This is NOT a new deployment.
- Prior D1 quota failure and /health 503 are unresolved until independently retested; a 401 from an unsigned request is not proof of a valid signed session.

## Change
Commit f14d7b896f4189b146905a721275e29a4634ca37 adds a synthetic POST /api/progress with initData supplied as a JSON object instead of the required signed string. It must return 401; 500, 503, 429, 200 and connection failures fail the security gate. Existing ten unsigned-route, one forged hash, and two malformed-string checks remain. No credentials, personal identities or response bodies are logged.

## Verification / acceptance
- Confirm GitHub Actions workflow run for commit f14d7b8 has finished. It must report all 14 synthetic auth checks passing and /health 200; otherwise mark FAIL and investigate.
- Independently validate actual signed Telegram identity, user isolation, mobile UX, and D1 readiness in isolated staging before any release.
- Re-check D1 row-read quota and Cloudflare Worker logs before deploying new runtime code.
- Do not interpret workflow edits as runtime fixes.

## Rollback
If this new assertion is incorrect, revert only commit f14d7b896f4189b146905a721275e29a4634ca37 on the development branch after checking subsequent changes. No Cloudflare rollback or D1 restore is necessary because this change did not deploy or migrate anything. For future integration Worker deployment rollback, preserve the currently observed deployment ID and verify its version is still available before applying an explicit rollback; never target production.

## Authorization boundary
No production deployment, real payment, paid AI, bulk notifications, real-data migration, or public release without separate user approval and completed release gates.
