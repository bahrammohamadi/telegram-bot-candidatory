# Phase 15 — CF-Ray correlation for D1 readiness (2026-11-06)

## Scope and observed baseline
- Isolated integration Worker only; no deployment, D1 mutation, real user data, payment, AI or broadcast.
- Branch before change: bf94fa0acd11e40774d9b07d3b77d0ed27322055.
- Cloudflare isolated deployment observed: f1eb351c-c3ee-4e46-bb58-b8cadb6e769b, version fc7588b9-979c-4d51-a7a2-8e99effe0fd4.
- Isolated D1 direct read-only SELECT 1 AS ok succeeded; this does not prove Worker-to-D1 availability.
- GitHub Staging HTTP smoke run 42266514857 failed. No claim of stable readiness.

## Change
The GitHub Actions isolated integration HTTP auth smoke now records only the sanitized CF-Ray header from the first failing /health request. CF-Ray identifies an edge request for Cloudflare log correlation; no response bodies, cookies, tokens, identities or arbitrary headers are logged. All three health checks and all eleven auth checks remain release-blocking.

## Validation gate
Inspect the next GitHub Actions run for workflow syntax, CF-Ray output on failure, three /health 200 responses, ten unsigned API 401 responses and one forged-signature 401. If D1 readiness still returns DB_UNAVAILABLE, correlate CF-Ray with Cloudflare Worker traces and inspect runtime D1 quota/binding; direct control-plane D1 success is insufficient. CI status for this commit must not be assumed until observed.

## Rollback
Revert commit 6144c26a8dd1cef31eed2b8bd850cfacbbf9a77e on the feature branch to remove the header diagnostic. No Worker rollback is necessary for this CI-only change. If future isolated Worker deployment fails, verify bindings and restore isolated version fc7588b9-979c-4d51-a7a2-8e99effe0fd4 through Cloudflare deployment history. Never touch the news or production Worker without separate approval.
