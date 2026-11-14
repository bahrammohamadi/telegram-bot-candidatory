# Phase 15 — signed Telegram initData missing user (2026-11-07)

## Change
Commit `096a4a624364e7e1310fa2c6470b1935cb5630e2` adds a synthetic negative test to `progress-tasks-e2e.mjs`: a valid HMAC over `auth_date` without `user` must return 401 and never access D1. This is test-only, with no real Telegram credentials.

## Verify
On `feature/cloudflare-parity-audit-2026-10-29`, run:

```sh
node cloudflare-live/phase15/build-progress-tasks.mjs
node cloudflare-live/phase15/progress-tasks-e2e.mjs
```

Confirm Actions checks on the new commit. Synthetic identity tests do not replace live Telegram signed initData or live Worker/D1 tests.

## Deploy and rollback
No Worker upload or D1 migration is required for this test-only change. To revert, revert commit `096a4a624364e7e1310fa2c6470b1935cb5630e2` on the feature branch, rerun CI, and keep the integration Worker deployment unchanged. Previously observed integration deployment: `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` (2026-11-06). Do not change production/news Worker or send channel notifications.

## Release gate
NO-GO pending signed real-account isolation, Worker-D1 end-to-end, accessibility/mobile QA, backup restoration and explicit production approval.
