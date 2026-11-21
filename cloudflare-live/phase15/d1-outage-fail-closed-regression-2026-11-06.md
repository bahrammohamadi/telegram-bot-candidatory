# Phase 15 — D1 outage fail-closed regression (2026-11-06)

## Verified baseline
- Development branch prior to this test: `1dacd15316c3eeb53a07b4791c298975134cb861`.
- Isolated integration Worker remains deployed at `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`. No deployment or D1 migration in this change.
- Latest HTTP-auth smoke [42221150479](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42221150479) recorded three `/health` HTTP 503 responses, while its 11 unauthenticated/forged requests returned the expected 401. The overall gate failed correctly.
- Read-only `SELECT 1 AS healthy` succeeded on **both** isolated integration and preview D1 databases at the time of this run. This confirms query access had recovered, but does **not** establish the cause of the Worker HTTP 503 or prove service availability.

## Change
- Extended `cloudflare-live/phase15/progress-tasks-e2e.mjs` with a synthetic D1 exception. Checks that invalid and forged Telegram initData return 401 **without touching D1**, while valid signed initData encountering a D1 failure returns a 5xx rather than fabricated progress and does not disclose the synthetic private driver marker.
- CI entry point: `.github/workflows/candidatory-task-progress-validation.yml`; `node cloudflare-live/phase15/build-progress-tasks.mjs` followed by `node cloudflare-live/phase15/progress-tasks-e2e.mjs`.
- All identities, database failures, and signing tokens in the test are synthetic; no real user data or credentials are used.

## Release gates and next action
- This is an offline regression, **not** proof that Cloudflare HTTP, mobile WebView or real Telegram signed sessions work.
- Re-run live isolated HTTP probes and investigate Cloudflare Worker logs for the persistent 503; do not mark the outage resolved from successful D1 `SELECT 1` alone.
- Keep production and news Workers unchanged; do not promote until end-to-end Telegram, D1 isolation, backups, and explicit approval.

## Rollback
- Revert only the GitHub test commit `35e99818af5e6556ac43293f6d7d37d319323e1f` if the new regression proves incompatible. There is no Cloudflare/D1 rollback because neither was changed.
