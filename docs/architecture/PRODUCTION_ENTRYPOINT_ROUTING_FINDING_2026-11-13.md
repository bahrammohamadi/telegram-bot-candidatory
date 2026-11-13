# Production entrypoint routing finding — 2026-11-13 (read-only evidence)

Scope: existing Cloudflare Worker `candidatory-miniapp-api` only. **No deployment or data mutation performed.**

## Verified against live Worker

- Deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic, deployed 2026-11-11T20:05:53Z (GET deployments).
- GET `/accounts/{account_id}/workers/scripts/candidatory-miniapp-api/content/v2` returned a multipart response (~455701 characters) with exactly three named source parts: `entrypoint.mjs`, `legacy.mjs`, `preview.mjs`.
- **Critical architectural discrepancy:** live `entrypoint.mjs` imports `preview` and routes normal requests to `preview.fetch(...)` using an environment override `{DB: env.REVIEW_DB, TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN, AI_ENABLED:'false'}`. It checks `REVIEW_DB` and token availability before responding. Thus the *main production Worker* currently appears to use the **REVIEW_DB D1 binding**, not `DB`, for the app's normal requests. This is a source-code observation, **not** proof of data correctness or actual database writes.
- The entrypoint returns HTTP 410 for `/legacy` and redirects `/review` to `/`. The names `preview.mjs` and `REVIEW_DB` are historical code/binding names; they do not imply that a separate Worker or runtime was created in this run.
- GET Worker settings confirms compatibility date `2026-10-27`; seven bindings: four secret_text, one ai, two d1 (`DB`, `REVIEW_DB`). No secret values accessed. GET subdomain confirms enabled=true and previews_enabled=false.

## Risk / classification

**نیازمند اصلاح — HIGH:** The canonical live entrypoint's use of `REVIEW_DB` conflicts with the requested single production data architecture until the intended canonical D1 is established. Do not silently switch `REVIEW_DB` to `DB`: schemas, ownership, record locations, and migration implications have not been verified. Preserve all existing user records. No production write tests.

**ناقص:** Multipart module SHA-256 hashes, canonical production HTTP URL and read-only smoke, complete route/RBAC parity, D1 schema comparison, exact rollback artifact and restore validation.

## Next non-destructive work

1. Read-only inspect D1 schema metadata and repository D1 configuration; map actual canonical data ownership and compare with the 18-chapter reference.
2. Build a byte-accurate multipart module manifest with per-part hashes and compare to repository source. Keep secrets and user data out of artifacts.
3. Run offline unit/contract/security tests with synthetic fixtures; verify CI on exact SHA.
4. Identify actual canonical route and perform read-only GET/HEAD smoke. Prepare rollback bundle. **Block deployment until all release gates pass.**

Sources: direct Cloudflare read-only GETs on 2026-11-13 UTC; GitHub branch `feature/cloudflare-parity-audit-2026-10-29`, pre-change SHA `bde1eaeb062b002bb2f56bb84cbb8f2c7d7ac343`. No staging or preview deployment was created.
