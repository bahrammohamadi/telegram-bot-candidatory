# Production binding contract — read-only snapshot (2026-11-19 01:59 UTC)

Scope: **existing** `candidatory-miniapp-api` only. This is an observed contract, **not** authorization to deploy. Source: authenticated Cloudflare Workers GET `/deployments`, `/settings`, `/script-settings`. No secret values read.

## Active deployment
- Deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`
- Version: `3c35231f-36f0-4bad-b786-9a4309d8e868`, traffic 100%
- Created: `2026-11-11T20:05:53.015284Z`
- Compatibility date: `2026-10-27`; usage model: `standard`
- Observability: null; logpush: false; tail_consumers: null (as reported)

## Binding names and types (no values)
| Name | Type |
| --- | --- |
| ADMIN_TELEGRAM_IDS | secret_text |
| ADMIN_TELEGRAM_IDS_MAHDI | secret_text |
| AI | ai |
| AVALAI_API_KEY | secret_text |
| DB | d1 |
| REVIEW_DB | d1 |
| TELEGRAM_BOT_TOKEN | secret_text |

## Deployment blocker and acceptance criteria
- **NO DEPLOY** until exact current multipart module bytes and hashes are archived, D1 schema/IDs and route mapping read-only verified, HEAD-specific CI green, synthetic-data RBAC/auth tests green, canonical URL read-only GET checked, and complete rollback bundle + restore procedure verified.
- Never upload a single-module replacement over an existing multi-module Worker. Never print secrets or write to Production D1.
- No second Worker, preview/staging/test deployment, or changes to `candidatory-news-bot` / `@candidatoryiran`.
- This snapshot does not establish source parity, URL health, rollback viability, or security readiness.

## Gap matrix
| Item | Classification |
| --- | --- |
| Active deployment and seven binding names/types | سالم |
| Dated binding-contract snapshot | جدید |
| Verbatim architecture (18 chapters) | ناقص |
| Exact multipart source hashes and restore bundle | ناقص |
| HEAD-specific CI, D1 schema and canonical URL GET | ناقص |
| Real-handler synthetic RBAC tests and five-tab RTL UI | نیازمند اصلاح |
