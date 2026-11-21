# Phase 15 — negative Telegram authentication regression (2026-11-07)

## Scope
Test-only commit `0cf0d789311db5b3444aef7f70840be310717cbe` adds two negative cases to `progress-tasks-e2e.mjs`: a valid-looking payload signed by another synthetic bot token, and malformed `user` JSON signed with the expected synthetic token. Both must return HTTP 401 without accessing D1, including with a simulated D1 outage.

## Verify
On the feature branch, run `node cloudflare-live/phase15/build-progress-tasks.mjs && node cloudflare-live/phase15/progress-tasks-e2e.mjs`. Review GitHub Actions for both the test and documentation commits. These are synthetic checks and do not establish real Telegram account identity or live Worker↔D1 health. At writing, no CI success for this commit was verified.

## Deployment / rollback
No Worker upload, D1 migration or production changes are required or authorized for this test-only change. If regression fails, inspect the auth parser and test fixture; revert commit `0cf0d789311db5b3444aef7f70840be310717cbe` on the feature branch if needed, then rerun CI. The integration Worker deployment observed on 2026-11-07 remains `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` (2026-11-06T07:58:50Z). Do not roll back a deployed Worker for this test-only change.

## Release gate
NO-GO until CI, live signed Telegram tests, user isolation, Worker↔D1 verification, mobile/accessibility QA, backup restore, and security review are verified. Production release requires separate explicit approval.
