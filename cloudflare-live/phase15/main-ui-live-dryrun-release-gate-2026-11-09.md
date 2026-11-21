# Main Telegram Mini App visual refresh — live source dry run (2026-11-09)

**Decision: production deployment NOT performed.** User approved the visual change, but the previously agreed release prerequisites (verified backup/rollback, signed real-account Telegram WebView tests, complete production integration QA) are not yet evidenced. This file is a verifiable review checkpoint, not a claim of deployment.

## Evidence

- Main Worker: `candidatory-miniapp-api`; previous deployment ID `3d172eb9-eca1-45e5-9070-760970d1f8c1` (observed before any change).
- Test Worker: `candidatory-miniapp-integration`; previous deployment ID `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`.
- Read-only Cloudflare Worker source analysis: multipart source length 450295 characters, embedded main HTML 89531 characters.
- CSS-only dry run against the **actual current main Worker source**: resulting multipart source length 453826 characters; non-UI bytes preserved exactly (`nonUiUnchanged=true`); no duplicate refresh found.
- Phase15 GitHub CI `42591049184` successful, including main miniapp patch safety regression. This is not a real Telegram account/browser test.

## Remaining release gates

1. Capture and verify a secure restorable backup of the exact current production Worker version and bindings without committing secrets.
2. Confirm an actual production build artifact can be deployed without changing multipart metadata, environment bindings, routes, or other script files.
3. Perform real signed Telegram WebView smoke tests on two authorized test accounts and verify cross-account isolation, admin boundaries, and mobile layout.
4. Run end-to-end staging and final security/backup checklist; explicitly record pass/fail before production change.
5. Apply **only** the approved CSS visual patch to the original main Worker, verify deployment ID and live UI, then monitor and roll back to the recorded previous deployment on regression.

## Rollback

For source-only changes, revert `fd2f0dcb`, `f2095f30` and `f179ffb4` as appropriate. If a future main Worker deployment occurs, use Cloudflare deployment rollback to the exact previously recorded deployment, then verify signed auth, UI and all original API routes. Do not touch `candidatory-news-bot` or its Telegram channel.
