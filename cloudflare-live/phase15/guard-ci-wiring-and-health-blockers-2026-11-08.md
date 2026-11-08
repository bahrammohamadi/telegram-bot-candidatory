# Phase 15: guard CI wiring and current blocker (2026-11-08)

## Verified baseline
Branch prior head: 066884de2e23ed9a550d3d76118ff0802ea4b82e.
Cloudflare integration Worker latest deployment: f1eb351c-c3ee-4e46-bb58-b8cadb6e769b (2026-11-06 07:58:50 UTC).
Integration D1 SELECT 1 AS ok: successful via Cloudflare API, but **this does not establish Worker-to-D1 health**.

## Change
Added .github/workflows/integration-target-guard.yml (commit 3d67a6efc3f8fb5fcd8d074125b08af260ca6b9f).
It executes seven existing unit tests, the exact integration allowlist and two negative probes on development-branch changes to phase15 or the workflow. No secrets, deployment permissions, Cloudflare API calls or database writes.
**Important:** This CI is an independent preflight check, not yet a mandatory prerequisite in all deployment entrypoints. Never infer deployment safety solely from a green check.

## Existing failing gates, observed before change
GitHub Actions on 066884de:
- Cloudflare live source parity: SUCCESS (run 42423130202).
- Isolated integration HTTP auth smoke: FAILURE (run 42423130196): Worker D1-backed health returned 503 DB_UNAVAILABLE. Auth probes reported 0 unexpected responses, but health gate correctly failed.
- Staging HTTP smoke: FAILURE (run 42423130215): staging health HTTP 500, mobile visual dashboard KPI timeout.
Investigate Worker D1 binding, runtime logs and D1 quota before any redeploy. A direct D1 query passing is insufficient to clear runtime failures.

## Verification
Inspect the workflow run at GitHub Actions for commit 3d67a6e and confirm each step's conclusion. Do not claim it passed before observing the completed run.
Run locally:
```sh
node --test cloudflare-live/phase15/assert-integration-target.test.mjs
TARGET_WORKER=candidatory-miniapp-integration TARGET_D1_NAME=candidatory-integration-test-20261101 TARGET_D1_ID=2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0 node cloudflare-live/phase15/assert-integration-target.mjs
```
The same command with TARGET_WORKER=candidatory-news-bot must exit nonzero.

## Rollback
No Worker/D1/production resources were modified by this change. Revert the documentation commit and 3d67a6efc3f8fb5fcd8d074125b08af260ca6b9f on the development branch to remove this CI. No data restore needed.

## Release gate
NO-GO until runtime health, signed Telegram identity, cross-user isolation, mobile QA, backups, deployment guard enforcement, payment/AI opt-in, and explicit separate production approval are verified.
