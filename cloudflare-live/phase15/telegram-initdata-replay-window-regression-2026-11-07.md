# Phase 15 — Telegram initData replay-window regression (2026-11-07)

## Scope
This change extends the existing synthetic integration E2E test `cloudflare-live/phase15/progress-tasks-e2e.mjs` without changing the deployed Worker, D1 schema, secrets, or production services.

## Regression contract
- Re-sign an expired `auth_date` (now − 3601 seconds), a future `auth_date` (now + 61 seconds), and zero timestamp using a synthetic token.
- All three must return HTTP 401 before any D1 query, including with a synthetic D1 outage.
- A freshly signed payload (now − 30 seconds) must still return HTTP 200 with owner-scoped task metrics.
- This covers replay protection beyond HMAC integrity; a valid HMAC alone must not bypass timestamp expiry.

## Validation and limits
Run `node cloudflare-live/phase15/build-progress-tasks.mjs && node cloudflare-live/phase15/progress-tasks-e2e.mjs` on a clean checkout. CI result for this commit must be checked independently. This test uses a synthetic token and mock D1; it does **not** establish live Worker↔D1 health, real Telegram account acceptance, or mobile WebView quality.

## Deployment and rollback
No deployment is needed for this test-only change. For rollback, revert the test commit on the feature branch if the assertion is incorrect; do not roll back the deployed Worker or touch D1. If a future code deployment is required, first confirm the exact live integration deployment and source hash, preserve its rollback artifact and bindings, deploy only `candidatory-miniapp-integration`, and independently verify API and identity. Never deploy to production without explicit separate approval.

## Release gate
Remain NO-GO until independent live Worker/D1 checks, two-account isolation, real Telegram signed WebView tests, mobile accessibility, backup/restore, and security review pass. No paid AI, payments, mass notifications, or news-bot changes are authorized.
