# Phase 15 — missing Telegram initData hash regression (2026-11-07)

## Scope
Commit b989b6afbaa64490871c8c6b9686c39c192df56d adds a synthetic negative test to progress-tasks-e2e.mjs. A payload with a plausible user and auth_date but no hash must return HTTP 401 before accessing D1, including when D1 is unavailable. No production identity or token is used.

## Verify
On feature/cloudflare-parity-audit-2026-10-29 run:

```sh
node cloudflare-live/phase15/build-progress-tasks.mjs
node cloudflare-live/phase15/progress-tasks-e2e.mjs
```

Review CI for this commit and the following documentation commit. This synthetic test does not establish real Telegram identity or live Worker-to-D1 connectivity.

## Deployment and rollback
Test-only change: do not upload Workers or migrate D1. To undo the test, revert commit b989b6afbaa64490871c8c6b9686c39c192df56d on the feature branch and rerun CI. Last observed integration deployment before this change: f1eb351c-c3ee-4e46-bb58-b8cadb6e769b (2026-11-06T07:58:50Z). Do not roll back that deployment for this test-only change.

## Release gate
NO-GO pending live signed Telegram checks, isolation, Worker-D1 integration, security, accessibility, mobile QA, backup restore and separate production approval.
