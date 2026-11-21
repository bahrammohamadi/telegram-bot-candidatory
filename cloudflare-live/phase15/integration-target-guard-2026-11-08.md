# Phase 15 — isolated deployment target guard (2026-11-08)

Commits: `aeccd44ce2d55f00756d5547cbfa7f862f5076d2` (guard), `8941a94e5d6be2b55de9c0234a513203e3d23f8d` (tests).

## Scope
The guard refuses commands whose explicitly provided Worker name, D1 name or D1 ID differs from the designated **integration-only** resources. It also refuses `ALLOW_PRODUCTION=true`. It never invokes Cloudflare, deploys, or accesses D1. This is a preflight helper, **not** proof that a deployment workflow is wired to call it. A bypass remains possible until CI/deployment scripts enforce the gate.

## Verification
```sh
node --test cloudflare-live/phase15/assert-integration-target.test.mjs
TARGET_WORKER=candidatory-miniapp-integration TARGET_D1_NAME=candidatory-integration-test-20261101 TARGET_D1_ID=2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0 node cloudflare-live/phase15/assert-integration-target.mjs
```
A negative probe with `TARGET_WORKER=candidatory-news-bot` must exit nonzero. Inspect GitHub Actions for actual execution before marking CI green.

## Integration deployment procedure (not executed by this change)
Before any integration-only deploy, check current branch HEAD and passing CI; inspect Cloudflare integration Worker deployment and D1 schema; capture current deployment/version IDs and a tested D1 backup; run the guard with exact integration target variables; verify signed Telegram identity, owner isolation, HTTP errors, and mobile UX against the **integration** endpoint. Never use the production Worker or live payments.

## Rollback
No Worker or D1 changes occurred with these commits. To undo, revert `8941a94e5d6be2b55de9c0234a513203e3d23f8d` then `aeccd44ce2d55f00756d5547cbfa7f862f5076d2` on the development branch and rerun CI. No data restore is required.

## Open gates
Actual CI execution of these tests; wiring the guard into deployment pipeline; live signed two-account checks; mobile QA; backup/restore rehearsal; payment and AI consent gates; separate production approval.
