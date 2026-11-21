# Phase 15 — signed Telegram owner boundary regression (2026-11-07)

## Scope
Test-only change `f25bcd1b651ceecbced233cc55f6435581aeb606` extends `progress-tasks-e2e.mjs` with eight invalid signed `user.id` shapes: zero, negative, fractional, null, boolean, empty string, array, object. Each must return HTTP 401 without querying D1, even during simulated D1 outage. Synthetic token and IDs only; no production data.

## Verify
Run from repository root:

```sh
node cloudflare-live/phase15/build-progress-tasks.mjs
node cloudflare-live/phase15/progress-tasks-e2e.mjs
```

Inspect GitHub Actions for the commit and capture job conclusions. The test is not considered passing until executed successfully. If it fails, fix the underlying validation in the integration branch and rerun; do not weaken the expected rejection.

## Environment evidence
Read-only Cloudflare inspection on 2026-11-07 found latest `candidatory-miniapp-integration` deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` from 2026-11-06. Test-only change requires no deployment and no D1 migration. Worker-to-D1 signed live E2E and two real Telegram accounts remain release blockers.

## Rollback
Revert test commit `f25bcd1b651ceecbced233cc55f6435581aeb606` on the feature branch and rerun CI. No Worker or D1 rollback is necessary. Never touch `candidatory-news-bot` or the production bot/channel as part of this test rollback.

## Release gate
NO-GO pending confirmed CI, real signed-user isolation, Worker/D1 end-to-end, backups and restore drill, security/mobile/accessibility QA, and explicit separate approval for production.
