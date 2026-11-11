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
