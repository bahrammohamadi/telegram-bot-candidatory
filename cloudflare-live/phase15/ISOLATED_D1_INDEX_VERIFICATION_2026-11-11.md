# Phase 15 — isolated D1 index verification (2026-11-11)

Scope: **read-only** schema inspection of D1 `candidatory-integration-test-20261101` (database ID `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`). No production access or data mutation.

## Verified evidence
Executed:
```sql
SELECT name, tbl_name, sql FROM sqlite_master
WHERE type='index'
  AND (lower(tbl_name) LIKE '%task%' OR lower(tbl_name) LIKE '%report%')
ORDER BY tbl_name,name LIMIT 60;
```
Result (2026-11-11): `idx_candidate_tasks_owner_due` on `candidate_tasks_v1(telegram_id,status,due_date)`; `idx_tasks_ws` on `workspace_tasks(workspace_id,status,due_date)`; two SQLite automatic unique indexes. Cloudflare D1 reported `success=true`, `changes=0`, `rows_written=0`, `changed_db=false`.

**Important limitation:** the synthetic SQLite index regression test does **not** prove the actual report SQL uses the D1 index. A composite index beginning with `telegram_id` is available, but actual use depends on query predicates and planner. Follow-up: inspect exact report SQL and execute `EXPLAIN QUERY PLAN` against the isolated D1 only; compare owner filtering and index use without reading private rows.

## CI / deployment status
Earlier GitHub Actions run 42976256691, job `report-sqlite-safety`, concluded success (previous test commit). No claim is made that this run tests the current documentation commit. The GitHub combined status endpoint for branch head `8134952` returned no statuses; latest Actions conclusion remains unverified. Integration Worker deployment version `7489532d-a4a8-4f4f-8924-e12096e6c548` 100%; news Worker version `1c080a9a-e7b6-420a-81ae-14821608a1aa` 100%. Deployment presence is not proof of end-to-end health.

## Safe reproduction
Use Cloudflare D1 **read-only query API** with the SQL above, against the exact isolated database ID. Never run migrations or write statements in this audit. Do not log owner IDs, Telegram initData, receipts or tokens.

## Rollback
Documentation-only change. Revert this commit if the evidence or conclusions need correction. No D1 restore, Worker rollback, or production action required. Do not deploy to production without separate explicit approval.
