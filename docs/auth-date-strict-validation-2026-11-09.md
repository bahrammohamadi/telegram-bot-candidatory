# Telegram auth_date strict parsing — 2026-11-09

Scope: isolated development branch only. No Worker, D1 or production deployment in this change.

## Why
`Number(null)`, scientific notation and hexadecimal input can coerce to integers. Telegram `auth_date` is required to be an explicit decimal Unix timestamp. Reject missing and non-decimal values before HMAC verification, while preserving existing expiry, future-skew, duplicate-field and signature checks.

## Evidence
- Code commit: 588e09af27f046dc182af5b214b247e707b2e3a7
- Synthetic regression test: 5100d490c7f4b3c5d8b327d70b131bcb6363e90a
- CI status must be checked separately; no successful CI/deployment is claimed here.

## Acceptance
Run `node --test miniapp/tests/auth-boundaries.test.mjs` under Node 22; then run all miniapp tests, HTTP authentication tests, user-isolation tests and mobile QA. Deploy only to `candidatory-miniapp-integration` after all applicable checks pass. Do not use production Telegram credentials in CI.

## Rollback
Revert the two commits above in reverse order on the development branch if a regression is detected. No D1 migration or Worker rollback is necessary because this change was not deployed. Production deployment requires separate explicit approval.
