# Phase 15 — quota-safe integration smoke (2026-11-06)

## Scope and reason
Cloudflare D1 isolated integration database reached free-tier daily row-read quota (error 7500). The integration HTTP smoke workflow previously made three D1-backed /health requests even when the first returned HTTP 503. This change avoids two redundant reads on an already failing readiness check; it does **not** mask failures or change production code.

## Change
- Commit cc42c349dc64399d36a06392e23ec8ae5d69c2fd updates `.github/workflows/integration-http-auth-smoke.yml`.
- If first /health is HTTP 503, mark readiness failed, skip the second and third health calls, and still execute all 10 unsigned API probes and the forged Telegram signature probe.
- If first /health is anything else (including 200), retain three independent health samples. Any failed sample fails the workflow.
- The final gate still fails for any health failure or any failed/unverified auth probe.

## Verification and outstanding gates
- Source-level review: the shell branch is fail-closed because `availability_failures` is set to 1 before the conditional for an initial 503, and the final gate checks it.
- Do not treat a GitHub commit as evidence that Actions passed; inspect the workflow run for this commit.
- Once D1 quota resets at midnight UTC, run one bounded real table-read against the **isolated** D1 and one isolated HTTP smoke; verify 3/3 health 200, 10/10 unsigned 401, forged Telegram 401.
- Signed valid Telegram identity, per-user isolation, mobile UX, accessibility and backup remain independent release gates. No real Telegram identities were used in this change.

## Deployment / rollback
- CI-only change: **no Worker or D1 deployment required**. Production/news Worker and Telegram channel must remain untouched.
- Roll back by reverting commit cc42c349dc64399d36a06392e23ec8ae5d69c2fd on the feature branch (or restoring the previous workflow blob). No Cloudflare rollback required.
- Last inspected isolated Worker deployment: f1eb351c-c3ee-4e46-bb58-b8cadb6e769b, version fc7588b9-979c-4d51-a7a2-8e99effe0fd4.
- Do not deploy to production, enable payments/paid AI/bulk notifications or migrate real data without separate explicit approval.
