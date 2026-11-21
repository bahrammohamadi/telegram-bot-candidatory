# Phase 15 — invalid signed Telegram owner ID regression (2026-11-07)

## Change
Commit `9c4d249a6aed458e09e67cf631eb83b451b2197f` adds a synthetic negative test to `progress-tasks-e2e.mjs`. A payload with valid synthetic HMAC but `user.id='1 OR 1=1'` must return HTTP 401 before any D1 access. No real credentials or personal records are used.

## Verify
On `feature/cloudflare-parity-audit-2026-10-29` run:

```sh
node cloudflare-live/phase15/build-progress-tasks.mjs
node cloudflare-live/phase15/progress-tasks-e2e.mjs
```

Inspect GitHub Actions for the resulting commit. A test definition is not a passed test. Validate signed real Telegram accounts and live Worker-to-D1 separately before release.

## Integration environment
Cloudflare D1 test database read-only `SELECT 1 AS ok` succeeded on 2026-11-07; the integration Worker deployment was `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` (2026-11-06). No Worker upload or D1 migration is required for this test-only change.

## Rollback
Revert test commit `9c4d249a6aed458e09e67cf631eb83b451b2197f` on the feature branch and rerun CI. Do not touch the integration deployment, production Worker, news Worker, or channel. No data rollback needed.

## Release gate
NO-GO until CI confirms the new test, signed real-account isolation, Worker-D1 end-to-end, accessibility/mobile QA, backup restoration, and explicit production approval.
