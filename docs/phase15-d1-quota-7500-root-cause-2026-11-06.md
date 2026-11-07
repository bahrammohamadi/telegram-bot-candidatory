# Phase 15 — confirmed D1 daily read quota blocker (2026-11-06)

## Evidence (isolated environment only)
- Worker: `candidatory-miniapp-integration`; deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`.
- Cloudflare settings read confirms binding `DB` points to integration D1 `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`; compatibility date `2026-10-01`.
- A control-plane `SELECT 1 AS ok` succeeded, but this constant query does **not** read table rows and cannot establish available daily row-read quota.
- A read-only schema query against the **same isolated D1** returned Cloudflare HTTP 400, error **7500**: "Your account has exceeded D1's free tier daily row read limit. Upgrade to a paid plan or wait until tomorrow (midnight UTC) to continue."
- Therefore the free-tier daily read quota is a **confirmed current blocker** for D1-backed readiness; it explains the observed `DB_UNAVAILABLE` response more directly than a missing binding. It does not prove that no additional bug exists after reset.

## Safe recovery and validation
1. **Do not upgrade billing, change production, rotate secrets, or mutate D1.** Wait until the next midnight UTC quota reset.
2. After reset, perform one bounded read-only query on the integration D1 that actually accesses a table (e.g. `SELECT name FROM sqlite_master WHERE type='table' AND name='candidate_users'`). Confirm no error 7500.
3. Run the isolated HTTP auth workflow once. Require 3/3 `/health` HTTP 200, 10/10 unsigned API HTTP 401, and forged Telegram hash HTTP 401. Keep the gate failed on any 503/500/429.
4. If 503 persists with quota available, inspect Cloudflare traces using the sanitized CF-Ray and then the D1 query / schema path.
5. Assess row-read volume and query plans before any further deployment; avoid polling `/health` frequently during quota exhaustion. Never use real user data in diagnostics.

## Rollback / scope
This document has no runtime impact. Revert its commit to remove it. No Worker or D1 rollback is needed. If a future isolated deployment is defective, restore isolated Worker version `fc7588b9-979c-4d51-a7a2-8e99effe0fd4` from Cloudflare deployment history after verifying bindings. Production/news Worker and Telegram channel are out of scope.

## Release gate
**BLOCKED** until the quota resets and the end-to-end readiness and signed identity tests pass. A direct `SELECT 1` is not a release acceptance test.
