# Staging D1 diagnostic and release blocker — 2026-11-07

## Scope and verified observations
- Target: isolated Worker `candidatory-miniapp-integration` and isolated D1 `candidatory-integration-test-20261101`.
- Cloudflare deployment history read on 2026-11-07: latest integration Worker deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`, version `fc7588b9-979c-4d51-a7a2-8e99effe0fd4`, deployed 2026-11-06T07:58:50Z. No deployment was performed during this check.
- Direct read-only Cloudflare D1 API probe `SELECT 1 AS probe` returned `probe=1`, success=true, duration=0.29 ms (reported API metadata).
- CI for previous commit `b56d6446f25563ce9700a6485b9c8cfdcad8c960`: isolated integration HTTP auth smoke, Cloudflare live source parity and staging HTTP smoke all completed successfully.
- **Important limitation:** Direct D1 API availability is NOT proof of Worker binding connectivity or end-to-end application availability. Earlier intermittent HTTP 503 / D1 error 7500 remains an open release blocker until verified end to end.

## Safe next verification sequence
1. Capture current staging Worker version and nonsecret binding names; ensure the D1 binding references only the isolated staging database. Do not display secret values.
2. From an external client, request the staging public `/health` endpoint repeatedly at bounded rate; record HTTP status, timestamps, and request IDs without user data.
3. Add a read-only, staging-only diagnostic path **only after** checking current routing and authentication semantics; avoid exposing database details publicly. Probe through the actual Worker D1 binding with `SELECT 1` and compare with the direct API probe.
4. Exercise invalid/missing/expired Telegram initData and verify rejection occurs before any private database access. Signed real-account tests require authorized consenting test identities.
5. Confirm backup and a restoration rehearsal on a separate isolated database before any schema migration. Never test restoration against production.
6. Do not promote to production until Worker-to-D1 and auth tests pass at the exact release SHA and separate approval is received.

## Rollback and isolation
This document is non-runtime documentation; revert its commit on the development branch if incorrect. For any future staging deployment, retain the prior Worker deployment ID and version, D1 bookmark or backup, exact release SHA, and nonsecret binding manifest. Worker code rollback does not undo D1 migrations.

## Release gate
Status: **NO-GO** (end-to-end Worker/D1, real signed Telegram identity, cross-user isolation, restore rehearsal and final security checklist not yet verified).
