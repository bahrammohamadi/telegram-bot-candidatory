# Isolated D1/Worker evidence — 2026-11-07

## Verified read-only observations
- GitHub CI for commit `fa08d78b5681323516ab300d9c2453c7f792e682`: all three workflows completed successfully: HTTP auth (42353199402), source parity (42353199393), staging HTTP smoke (42353199425).
- Cloudflare isolated Worker `candidatory-miniapp-integration`: latest deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`, version `fc7588b9-979c-4d51-a7a2-8e99effe0fd4`, created 2026-11-06T07:58:50Z. No new deployment in this check.
- Isolated D1 `candidatory-integration-test-20261101` read-only `SELECT 1 AS health` returned `health=1`, success=true, SQL duration 0.3877 ms. This **does not prove Worker-to-D1 end-to-end health**.

## Release-blocking distinction
GitHub synthetic HTTP smoke, direct Cloudflare D1 SQL and source parity are independent checks. None proves signed Telegram initData E2E, cross-user isolation on deployed Worker, stable Worker-to-D1 calls, or backup restore. Production gate remains **NO-GO**.

## Next safe verification
1. Record current staging Worker version and D1 binding without secret values.
2. Probe existing non-mutating staging health route from outside Cloudflare and record HTTP status/time; never create a new public database diagnostic endpoint.
3. Test authenticated E2E only with authorized consenting test identities and properly signed initData, plus forged/expired rejection and cross-account access checks.
4. Rehearse D1 restore only into a **new isolated database**, never overwrite staging or production data.

## Rollback / isolation
No Worker or D1 writes were performed for this evidence note. To undo this documentation-only change, revert its commit on the feature branch after checking for newer commits. The current isolated Worker deployment ID above is a reference snapshot, **not** a production rollback target. Do not touch `candidatory-news-bot`, live webhook/channel, payments, AI or production data without separate explicit approval.
