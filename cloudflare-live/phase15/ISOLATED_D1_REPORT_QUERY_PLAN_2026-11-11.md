# Phase 15 — actual D1 query-plan verification (2026-11-11)

Scope: **read-only** EXPLAIN QUERY PLAN against the isolated D1 `candidatory-integration-test-20261101` only. This follows `ISOLATED_D1_INDEX_VERIFICATION_2026-11-11.md` and does not modify Worker, D1, news, or production.

## Reproduction
Use Cloudflare D1 query API on the isolated database, with parameter `params: [0]` (synthetic non-user owner). Prefix the exact SELECT in `cloudflare-live/phase15/task-performance-owner-scoped.sql` with `EXPLAIN QUERY PLAN`; omit comments. The SELECT aggregates total/completed/open/overdue tasks from `candidate_tasks_v1` with `WHERE telegram_id = ?1`. **Do not execute the aggregate SELECT with real user identifiers or log rows.**

## Observed result
Cloudflare returned `success=true` and one plan step:

```text
SEARCH candidate_tasks_v1 USING COVERING INDEX idx_candidate_tasks_owner_due (telegram_id=?)
```

D1 metadata: `changes=0`, `rows_written=0`, `changed_db=false`. The owner-leading composite index is used by the actual owner-scoped report query plan in the isolated D1. This is **not** proof of Worker API wiring, signed Telegram identity, latency at scale, two-account isolation, or mobile behavior. The query is a planner-only operation; no private task rows were fetched.

## CI and deployments
The prior documentation commit `a54e773179e9689feda3d314674ed7222a5e829f` had 10 completed successful associated workflow runs, including `Phase 15 owner-scoped report SQLite safety` run 42983373034. These are prior-commit checks, not evidence of this documentation commit. Cloudflare integration Worker latest deployment version `7489532d-a4a8-4f4f-8924-e12096e6c548`; news Worker version `1c080a9a-e7b6-420a-81ae-14821608a1aa` (both 100% at inspection). Deployment metadata alone is not a functional health check.

## Next gate
Verify server-side signed Telegram initData owner binding through the actual isolated Worker endpoint, then exercise two independent authorized test accounts, API security and mobile UX. Do not activate production, payments, paid AI or bulk notifications.

## Rollback
Documentation-only commit: revert this file's commit to remove the recorded evidence. No database restore or Worker rollback is needed. If later code is deployed, record exact deployment version and separately verify rollback before release.
