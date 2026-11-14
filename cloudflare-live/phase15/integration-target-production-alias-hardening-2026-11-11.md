# Phase 15 — isolated target guard: production alias hardening (2026-11-11)

Scope: development branch only. No Worker deployment, no D1 writes, no changes to the news Worker or Telegram channel.

## Finding
The existing integration-only target guard compared `ALLOW_PRODUCTION` to the exact lowercase string `true`. Alternate common opt-in representations (`TRUE`, `1`, `yes`, `on`) and other production flags were not explicitly rejected. The exact Worker and D1 allowlist remained in place, but defense in depth was incomplete.

## Change
The guard now rejects truthy values for `ALLOW_PRODUCTION`, `PRODUCTION_DEPLOY`, `DEPLOY_PRODUCTION` and any `production` value (case/whitespace-insensitive) in `TARGET_ENV`, `CLOUDFLARE_ENV`, `WRANGLER_ENV`. It still requires exact integration Worker and D1 names and ID. Regression tests cover the aliases and a valid integration environment.

## Verification
Run `node --test cloudflare-live/phase15/assert-integration-target.test.mjs`; check the existing integration-target-guard GitHub Actions workflow for the exact commit. A passing static guard is not a live Telegram account, API, or mobile acceptance test. The last independently observed staging deployment before this change was `7489532d-a4a8-4f4f-8924-e12096e6c548` (100%); D1 bindings `DB` and `REVIEW_DB` both targeted the isolated D1. No deployment performed.

## Rollback
Before deployment: revert the two code/test commits and this documentation commit in reverse order, or restore the previous file versions on the development branch. No Cloudflare rollback required. Do not use this rollback to weaken the production release approval gate.

## Remaining gates
Signed Telegram initData on two real accounts, cross-owner isolation, actual mobile accessibility, receipts/private storage, sandbox payments, opt-in AI budgets, backup restore, and explicit per-action production approval remain pending. This change does not authorize production.

## Follow-up: fail-closed unknown opt-in values (2026-11-11)

Observed remaining bypass of the alias check: non-empty values such as `enabled`, `approved`, `deploy` and `false,true` were not recognized by the previous truthy allowlist and therefore passed. The guard now accepts only unset, empty, `false`, `0`, `off` or `no` (case/whitespace-insensitive) for each production opt-in variable; any other value is rejected. The exact integration Worker/D1 allowlist remains unchanged. No credentials are logged.

**Verification:** `node --test cloudflare-live/phase15/assert-integration-target.test.mjs`. Check the GitHub Actions integration target guard for commit `77ea582cafe21663294cbc7f658fb1dc288540ab` or newer; this is a static safety check, not live signed-account or mobile acceptance.

**Deployment:** no Worker or D1 deployment required: this guard runs in development/CI. Production deployment is still forbidden without separate explicit approval.

**Rollback:** revert this documentation commit, then test commit `77ea582cafe21663294cbc7f658fb1dc288540ab`, then code commit `3d61ed81cc2804aa388254856e8421c16afdcabd` (in that order), but only after security review; doing so reopens the unknown-value bypass. No Cloudflare rollback is required.
