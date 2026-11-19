# Immutable live-version metadata inventory — 2026-11-19 21:50 UTC

**Read-only Cloudflare API evidence; NO DEPLOY.** Existing Worker only: `candidatory-miniapp-api`.

## Active deployment and script identity
- Deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`; created `2026-11-11T20:05:53.015284Z`; 100% traffic.
- Version: `3c35231f-36f0-4bad-b786-9a4309d8e868`; **version number 104**.
- Script ETag from the *version resources*: `28b40213e4adde2156bceab3ff6ae07536921d99937de15cc3bfaf6a70920eb3`.
- Handler list: `fetch`. Last deployed from API.
- Compatibility date `2026-10-27`, standard usage model, compatibility flags `[]`.
- Bindings (name/type only): `ADMIN_TELEGRAM_IDS` secret_text; `ADMIN_TELEGRAM_IDS_MAHDI` secret_text; `AVALAI_API_KEY` secret_text; `TELEGRAM_BOT_TOKEN` secret_text; `AI` ai; `DB` d1 (`48b3c86b-45ea-492b-96e1-334dfafa2097`); `REVIEW_DB` d1 (`2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`).
- Cloudflare GET endpoints: `/accounts/{account_id}/workers/scripts/candidatory-miniapp-api/deployments`, `/settings`, `/script-settings`, and `/versions/3c35231f-36f0-4bad-b786-9a4309d8e868`.
- Version metadata reports `has_preview: true`; **this field is not evidence that a preview deployment was created or used**. Do not conflate it with Worker preview URL settings.

## Release gate (blocked)
The version ETag is an identity clue, **not a hash manifest for each source module or a recovery bundle**. Full multi-module source, routes, D1 schema, exact branch SHA/CI, public homepage URL/HTTP smoke, and independently verified rollback are outstanding. Do not deploy. Never replace the script using a single-file upload.

## Architecture alignment
Canonical owner document: 18 chapters, v1.0, 1405-08-21. Existing `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` is condensed, **not verbatim**. Do not label it the full owner text.

## Gap classification
| Area | Status |
|---|---|
| Active version number / script ETag / bindings / D1 IDs | سالم |
| Version-specific read-only evidence inventory | جدید |
| Verbatim architecture text | ناقص |
| Multi-module source manifest / route and D1 schema parity | ناقص |
| RBAC real-handler offline synthetic contract coverage | نیازمند اصلاح |
| Exact-SHA CI, public URL smoke, validated rollback | ناقص |

No secret values fetched. No D1 queries, writes, Worker updates, new environments, or changes to `candidatory-news-bot` / `@candidatoryiran`.
