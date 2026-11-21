# Phase 15 — D1 row-read recovery checkpoint (2026-11-07 UTC)

## Verified baseline
- Development branch: `feature/cloudflare-parity-audit-2026-10-29`; HEAD before this document: `44adb1718a718fbb1e7d69f8737d03e305e0379b`.
- Previous integration auth run [42315148507](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42315148507): completed **failure** at HTTP probe step. Source parity/navigation run [42315148492](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42315148492): both jobs **success**.
- Cloudflare API confirmed isolated D1 name and UUID match the expected test database. A **read-only row-reading query** (`SELECT name FROM sqlite_master WHERE type = ? LIMIT 1`, param `table`) returned success, 1 row and `rows_read=1`, `rows_written=0`. This is stronger evidence of quota recovery than `SELECT 1` but does **not** establish Worker-to-D1 health.
- Cloudflare deployment listing still shows integration Worker deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` dated 2026-11-06 07:58:50 UTC. No new deployment performed.
- Previous D1 quota error 7500 is **not reproduced by this single read**. Do not claim sustained recovery or signed-user functionality without HTTP and end-to-end tests.

## Next acceptance gate
1. Re-run isolated `/health` and integration HTTP auth workflow after quota recovery; require HTTP 200 and all 14 negative auth checks to pass.
2. Check actual signed Telegram identity using an authorized test account, user isolation, and mobile UX; never store raw initData or private receipts in CI logs.
3. Confirm Worker traces and D1 metrics if `/health` remains 503; inspect query cost and avoid repeated quota-consuming probes.
4. Only after all gates pass proceed to tasks-to-performance integration. Production, news Worker, public channel, paid AI, payment and bulk notifications remain untouched.

## Rollback / safety
This commit is documentation-only and has no runtime or schema effect. Revert this single document commit if obsolete; no Cloudflare rollback or database restore is needed. If future isolated deployment needs rollback, use the previously observed integration deployment/version only after checking current state. Never target production without separate explicit approval.
