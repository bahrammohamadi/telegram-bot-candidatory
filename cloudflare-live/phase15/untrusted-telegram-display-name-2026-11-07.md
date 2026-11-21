# Phase 15 — untrusted Telegram display name and task ownership

Change `d6f69b28b0483750f64ae00a0a3a83005267d019` extends `progress-tasks-e2e.mjs` with a synthetic, validly signed Telegram identity whose display name contains SQL-like characters. It asserts that task metrics still use the authenticated numeric owner ID via a `WHERE telegram_id=?` binding, and that the other account's data is not returned.

## Verification

From the repository root:

```sh
node cloudflare-live/phase15/build-progress-tasks.mjs
node cloudflare-live/phase15/progress-tasks-e2e.mjs
```

Require the new `PASS phase15 untrusted display name` line and successful exit. Inspect GitHub Actions before treating this as passed. This is a **synthetic local Worker test**, not a live D1/Worker, mobile, or real Telegram account test.

## Deployment and rollback

No deployment or D1 schema migration is needed for this test-only change. Revert commit `d6f69b28b0483750f64ae00a0a3a83005267d019` on the development branch and rerun the commands above to roll back the regression. Keep the integration Worker and D1 isolated; do not modify the news Worker or production. Production release remains blocked pending live signed two-account isolation, mobile QA, backup/restore, security review, and separate approval.
