# Phase 15 — integration-only health patch candidate (2026-11-08)

## Verified baseline
- Branch baseline before this work: `213c421651970ad1a27b02bb2f2f154f2db9440c`.
- Integration Worker deployment remains `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`, bound to isolated D1 `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0` under binding `DB`.
- Last CI at baseline: phase15 progress tests [42482932969](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42482932969) success; integration HTTP [42482937287](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42482937287) failure; staging HTTP [42482937354](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42482937354) failure.
- Prior intermittent integration health 200/503 and separate staging HTTP 500 remain blockers; a successful admin D1 query does not prove HTTP availability.

## Candidate change
- Builder `cloudflare-live/phase15/build-progress-tasks.mjs` replaces health's `sqlite_master` count with a direct read-only `SELECT 1 AS ready FROM candidate_users LIMIT 1`. A successful query means the table exists even when empty; a missing table or unavailable D1 must yield minimal `DB_UNAVAILABLE` HTTP 503.
- Worker E2E `cloudflare-live/phase15/health-worker-e2e.mjs` tests ready, empty-table, and D1 exception behavior.
- Existing signed-user task progress and owner isolation regression still required. No D1 migration, secrets, receipts, notifications, payments, AI, or production changes.

## Safe isolated deployment checklist — NOT YET DEPLOYED
1. Require successful `Isolated task progress integration` CI including health Worker E2E, signed-user E2E, task SQL and Python readiness checks.
2. Re-fetch exact integration Worker source and compare to the pinned phase14/phase15 baseline; abort on mismatch or changed deployment/version. Preserve current Worker script, deployment ID, and bindings inventory for rollback. Do not print secret values.
3. Back up **isolated D1 only** if a schema/data change is proposed; none is proposed here. Avoid exporting private data to GitHub.
4. Deploy assembled candidate to `candidatory-miniapp-integration` ONLY, preserving existing `DB` and signing-secret bindings; never modify news or production Workers.
5. Verify source read-back, bindings, `/health`, all 14 invalid-auth probes, two signed synthetic owners, and mobile 320/375/430. Test with real Telegram WebView accounts separately.
6. On failure, restore exact prior integration script with the original bindings; recheck deployment ID and API behavior. Note that previous deployment already had intermittent 503 and is not a known-good health baseline.

## Release decision
**Production NO-GO** until stable HTTP health, staging mobile checks, real-account isolation, accessibility, private receipts, permissions, backup, and explicit production approval.
