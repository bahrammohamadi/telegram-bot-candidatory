# Phase 15 — isolated D1 availability incident (2026-11-09)

## Verified observations
- GitHub Actions run 42648910943: signed initData synthetic regression **passed** after commit 4faa4036.
- Run 42648910635: integration auth gate **failed** because `/api/health` returned HTTP 503 with `DB_UNAVAILABLE`. Public shell returned 200; 14 unauthenticated auth checks had zero unexpected responses; 3 malformed initData probes had zero failures. This is **not** a readiness pass.
- Run 42648910538: staging HTTP smoke **failed** (health HTTP 500); visual job also failed.
- Cloudflare D1 API direct read-only `SELECT 1 AS ok` on the **isolated** database returned `ok=1`.
- Worker `candidatory-miniapp-integration` settings show both `DB` and `REVIEW_DB` as D1 bindings to the expected isolated database. Active deployment remains version `7489532d-a4a8-4f4f-8924-e12096e6c548` at 100%.

## Interpretation and release gate
Direct D1 API connectivity works, but the deployed Worker-to-D1 request path is failing. This does **not** establish whether the cause is a transient quota/availability limit, runtime error, schema issue, or other Worker-specific failure. Do not redeploy blindly, reset the database, or promote to production. Existing CI failure is correctly blocking release.

## Next safe diagnostic sequence
1. Re-run read-only direct D1 `SELECT 1 AS ok` and a **non-sensitive** schema metadata query; avoid querying real or personal records.
2. Inspect Cloudflare Worker invocation error metrics and sanitized logs for `/api/health` (no token, initData, receipt, or private payload).
3. Compare Worker binding configuration and active deployment version with the committed source. Verify whether the health handler uses `DB` or `REVIEW_DB`.
4. Only after a cause is identified, patch the integration branch, run local tests, deploy to **integration only**, then require both staging HTTP and isolated integration CI gates green.
5. Before any staging redeploy, record current deployment ID `c5c6482d-2daa-4862-a62b-8c4cc2720141` and version `7489532d-a4a8-4f4f-8924-e12096e6c548`. Roll back the integration deployment to this known prior version only if verified safe; a previously failing health endpoint must **not** be described as healthy after rollback.

## Strict scope
No production release, payment activation, paid AI, bulk notifications, live-data migration, or news-worker changes are authorized by this diagnostic record. No real admin IDs or private secrets should be placed in this file.
