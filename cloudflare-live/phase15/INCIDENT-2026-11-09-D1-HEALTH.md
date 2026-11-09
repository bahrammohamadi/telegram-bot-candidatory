# Phase 15 — isolated D1 availability incident (2026-11-09)

## Verified observations
- GitHub Actions run 42648910943: signed initData synthetic regression **passed** after commit 4faa4036.
- Run 42648910635: integration auth gate **failed** because `/api/health` returned HTTP 503 with `DB_UNAVAILABLE`. Public shell returned 200; 14 unauthenticated auth checks had zero unexpected responses; 3 malformed initData probes had zero failures. This is **not** a readiness pass.
- Run 42648910538: staging HTTP smoke **failed** (health HTTP 500); visual job also failed.
- Cloudflare D1 API direct read-only `SELECT 1 AS ok` on the **isolated** database returned `ok=1`.
- Worker `candidatory-miniapp-integration` settings show both `DB` and `REVIEW_DB` as D1 bindings to the expected isolated database. Active deployment remains version `7489532d-a4a8-4f4f-8924-e12096e6c548` at 100%.

## New direct Cloudflare evidence (2026-11-09, later diagnostic)
- A read-only D1 metadata query (`SELECT name, type FROM sqlite_master ... LIMIT 60`) was rejected by Cloudflare API with **HTTP 400, code 7500**: `Your account has exceeded D1's free tier daily row read limit. Upgrade to a paid plan or wait until tomorrow (midnight UTC) to continue.`
- This is **direct evidence of a D1 daily read quota exhaustion**, not a schema or binding mismatch. The earlier `SELECT 1` success is compatible with this: it reported `rows_read: 0`. The quota error is a strong explanation for the Worker health failure, but a fresh Worker health check after quota reset is still required to establish causality.
- Do not retry database-reading health probes in a loop while the quota is exhausted. Do not upgrade billing or enable paid resources without explicit authorization.

## Release gate and recovery
1. Wait for the next **midnight UTC quota reset**; run exactly one low-cost read-only D1 query and one isolated Worker `/api/health` request. If still failing, inspect sanitized runtime errors; do not assume quota was the only issue.
2. Identify high-row-read queries using `EXPLAIN QUERY PLAN` and relevant indexes only after quota recovery; avoid scans of personal records. Review CI frequency and health handler for unnecessary DB reads. Rate-limit or reduce health polling; prefer a DB-independent liveness endpoint and a separate low-frequency readiness check.
3. Preserve failing CI as a release blocker until isolated integration and staging HTTP checks are green; run signed Telegram auth, isolation, mobile and security gates after health is restored.
4. Before any integration redeploy, record deployment `c5c6482d-2daa-4862-a62b-8c4cc2720141`, version `7489532d-a4a8-4f4f-8924-e12096e6c548` and known prior version `5e11406e-12a0-49d8-95cb-a7df9120fc51`. Rollback is **integration-only**, and neither version may be called healthy without passing the readiness gate.
5. No production deployment, payment activation, paid AI, bulk notifications, real-data migration, or news-worker change is authorized.
