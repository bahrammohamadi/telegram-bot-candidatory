# Phase 15 — second signed owner D1 outage regression

Change: `e95ff548dda08e8aa6a70a82ec8e07541f4069d5` adds a second-account outage probe to `progress-tasks-e2e.mjs`. Both identities are synthetic; no live account or secret is used.

## Verification

From repository root run:

```sh
node cloudflare-live/phase15/build-progress-tasks.mjs
node cloudflare-live/phase15/progress-tasks-e2e.mjs
```

Require both signed owners to fail with HTTP 5xx on unavailable D1, and require no synthetic driver error string in responses. CI must be checked before marking the change passing. This is a local Worker mock regression, **not** a live Worker/D1 or mobile test.

## Environment and release gate

Read-only Cloudflare inspection on 2026-11-07 found integration deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` (2026-11-06T07:58:50Z). No deployment or D1 migration is needed for this test-only change. Production remains NO-GO until signed live E2E, two-account isolation, backup/restore, security and mobile QA, and separate production approval.

## Rollback

Revert only commit `e95ff548dda08e8aa6a70a82ec8e07541f4069d5` on the feature branch and rerun the above commands. No Worker or D1 rollback is necessary. Never modify `candidatory-news-bot` or the main channel for this change.
