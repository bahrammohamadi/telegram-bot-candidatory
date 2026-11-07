# Phase 15 — fail-closed health contract and continued auth probing (2026-11-06)

Scope: isolated integration Worker only. No production deploy or D1 write.

## Incident and correction

The isolated HTTP auth smoke workflow previously used Python assertions to verify the minimal HTTP 503 health payload. A malformed or extra-field 503 JSON response raised an unhandled AssertionError under bash `set -e`, aborting the job **before** its 10 unsigned API checks and forged Telegram signature check. This masked independent security evidence during a D1 outage.

Commit 8c79b24019a6a255502c8f083ccea888356ecea2 changes the health-contract check to a guarded Python command. Invalid/non-minimal JSON records `health_payload_failures=1`; all eleven independent auth checks still execute; the final job fails when readiness, health contract, or authentication is not verified. It does not relax HTTP 401 requirements or authorize a deployment.

## Verification

Inspect the push-triggered workflow `.github/workflows/integration-http-auth-smoke.yml`. Confirm (a) health HTTP 503 still fails readiness, (b) invalid payload sets a failure flag without skipping auth probes, (c) all 10 unsigned routes and forged Telegram hash receive 401, and (d) the final exit is nonzero if any failure flag is set. A failed CI run while D1 quota is exhausted is expected, not a pass. Inspect GitHub Actions job logs before declaring verification.

## Deployment / rollback

No Worker or D1 changes required. Roll back only this workflow change by reverting commit 8c79b24019a6a255502c8f083ccea888356ecea2 on the development branch; avoid resetting unrelated commits. Existing isolated Worker deployment remains unchanged. Never deploy to production without explicit approval.
