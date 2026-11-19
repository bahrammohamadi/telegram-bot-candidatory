# Production release parity evidence ledger — 2026-11-19 19:54 UTC

Scope: **only** existing Telegram bot/Mini App and Cloudflare Worker `candidatory-miniapp-api`. Read-only observations; **not release approval**. No second Worker, preview, staging, test deployment or environment is permitted.

## Current Cloudflare evidence (GET, 2026-11-19)
- Deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`; version `3c35231f-36f0-4bad-b786-9a4309d8e868` (100%), deployed `2026-11-11T20:05:53.015284Z`.
- Compatibility date `2026-10-27`; usage model standard; logpush false; observability null.
- Bindings: D1 `DB` (database ID `48b3c86b-45ea-492b-96e1-334dfafa2097`), D1 `REVIEW_DB` (database ID `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`), AI `AI`, secrets `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN`. Secret **values were not retrieved**.
- Worker subdomain enabled, preview disabled. Canonical hostname, routes, D1 schema and homepage HTTP status **not yet verified**.
- Historical deployments exist, but they are **not** a verified, reconstructible rollback artifact.

## Release-blocking evidence matrix
| Requirement | Status | Proof still needed |
|---|---|---|
| Live deployment/settings/binding inventory | سالم | Fresh GET at release time |
| This evidence ledger | جدید | Commit URL |
| Original verbatim 18-chapter owner manuscript | ناقص | Retrieve original text and provenance; condensed GitHub rewrite is not equivalent |
| GitHub HEAD and CI for exact release SHA | ناقص | Resolve HEAD and successful required workflows |
| Full multipart module parity | نیازمند اصلاح | Fetch all live module bytes, enumerate modules and SHA-256, compare exact build artifact |
| RBAC / ownership / Telegram initData negative tests | نیازمند اصلاح | Offline unit/contract tests with synthetic fixtures |
| D1 read-only schema + routes + canonical homepage | ناقص | Read-only verification; no writes to live data |
| Reproducible rollback | ناقص | Verified code bundle, metadata, binding types, route manifest, checksum and documented restore sequence |

## Mandatory release decision
**NO DEPLOY** until every gate is evidenced. Do not infer live state from historical identifiers. Do not touch `candidatory-news-bot` or `@candidatoryiran`. Do not perform live auth/write tests, D1 migrations, real payments, paid AI, bulk messages, or admin access changes. If safe offline validation is insufficient, retain block without creating another environment.

Next executable work: resolve branch HEAD and corresponding CI; collect read-only full multipart content manifest and routes; generate offline SHA-256 parity/rollback bundle; test RBAC with synthetic data; only then consider a small direct Production change.
