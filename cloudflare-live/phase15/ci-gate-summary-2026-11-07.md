# Isolated CI gate diagnostic update — 2026-11-07

Scope: `.github/workflows/integration-http-auth-smoke.yml` on `feature/cloudflare-parity-audit-2026-10-29`. No Worker deployment, D1 mutation, payment, AI or production change.

## Baseline evidence
- Prior commit `8c79b24019a6a255502c8f083ccea888356ecea2`: integration HTTP auth run 42301028483 **failure**, staging HTTP run 42301028583 **failure**, source parity run 42301028418 **success**.
- Cloudflare D1 metadata read confirmed isolated database name and 55 tables; metadata read does **not** prove Worker readiness or restore exhausted row-read quota.
- Prior reported D1 error 7500 requires revalidation after quota reset. Do not assume recovered.

## Change
The CI workflow writes only HTTP status codes and aggregate pass/fail counts to the GitHub Actions step summary, even on failure. It also corrects two misleading log messages: a short-circuited 503 health check is not three actual samples, and independent authentication probes still run after unexpected health responses. This does not relax any security assertion or turn failures green.

## Verification gate
1. Inspect the Actions run for commit `91beb9b781d4fc6173efc871676d45669758128c`; require both isolated auth and staging HTTP workflows to succeed before treating staging as ready.
2. Validate that the summary has no signed Telegram initData, cookies, secrets or user identifiers.
3. Run signed Telegram identity, cross-user isolation, mobile UX, and D1 quota tests separately; this workflow only checks unsigned and forged identity.
4. Never deploy to production without separate explicit approval.

## Rollback
Revert only commit `91beb9b781d4fc6173efc871676d45669758128c` on the development branch (or restore the previous workflow file from its parent), then rerun the CI workflow. No Cloudflare rollback is needed because this change is CI-only.
