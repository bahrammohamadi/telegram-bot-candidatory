# Production multipart inventory — 2026-11-15 18:54 UTC

Scope: **existing** `candidatory-miniapp-api` only. Read-only Cloudflare GET `/accounts/{account_id}/workers/scripts/candidatory-miniapp-api/content/v2`. No staging, preview, alternate Worker, write, D1 query, or deployment.

## Verified live observations
- Current deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed` (2026-11-11T20:05:53Z), version `3c35231f-36f0-4bad-b786-9a4309d8e868`, traffic 100%.
- Multipart **response text** length: 455701 JavaScript UTF-16 code units (not an assertion of HTTP byte size).
- Multipart part names: `entrypoint.mjs`, `legacy.mjs`, `preview.mjs` (3 total). The filename `preview.mjs` is an existing source part, **not evidence of a preview deployment**; Cloudflare subdomain setting `previews_enabled=false`.
- SHA-256 of **UTF-8 encoding of the connector-returned multipart response string**, including its boundary/header text: `3074d1258313ecf5ab6ccf6aa493f6c4adcb6ec935bc1948e7e14372b50d912c`. This is **not** a raw HTTP response hash, a per-module hash, or proof of parity with GitHub.
- Compatibility date: `2026-10-27`. Binding names/types: `DB:d1`, `REVIEW_DB:d1`, `AI:ai`, `ADMIN_TELEGRAM_IDS:secret_text`, `ADMIN_TELEGRAM_IDS_MAHDI:secret_text`, `AVALAI_API_KEY:secret_text`, `TELEGRAM_BOT_TOKEN:secret_text`. Secret values never requested.
- GitHub commit `31b406c03bd9915246794a97480825503d9fdcf9`: 16 returned workflow runs, all completed/success; examples run 43744088581 (Mini App checks) and 43744088668 (multipart artifact parity). These offline tests do not prove live-source parity.

## Gaps and release decision
| Area | Status | Required before release |
|---|---|---|
| Live multipart part inventory | سالم | Preserve exact response bytes and compare per-part hashes to candidate bundle |
| Source-to-GitHub parity | ناقص | Deterministic per-part hash manifest and metadata comparison |
| D1 schema/routes | ناقص | Read-only inspection and compatibility proof |
| RBAC ownership | نیازمند اصلاح | Negative tests using synthetic data |
| Five-tab RTL | نیازمند اصلاح | Implementation audit and accessibility checks |
| Verbatim canonical 18-chapter architecture | ناقص | Retrieve and commit exact original, without invented wording |
| Rollback package | ناقص | Exact prior multipart + bindings metadata, rehearsed recovery procedure without production mutation |
| Production unauthenticated GET health | جدید | Identify canonical URL and perform safe read-only GET |

**NO DEPLOY.** This inventory is an evidence artifact, not release authorization. No action on `candidatory-news-bot` or `@candidatoryiran`.
