# Production binding contract — 2026-11-22 19:51 UTC

Scope: **existing** Cloudflare Worker `candidatory-miniapp-api` only. Read-only Cloudflare API evidence, not an authorization to deploy.

## Observed active deployment (fresh API read)
- Deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`
- Version: `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic
- Deployment created: `2026-11-11T20:05:53.015284Z`
- Compatibility date: `2026-10-27`

## Binding manifest (names/types only)
| Name | Type |
|---|---|
| ADMIN_TELEGRAM_IDS | secret_text |
| ADMIN_TELEGRAM_IDS_MAHDI | secret_text |
| AI | ai |
| AVALAI_API_KEY | secret_text |
| DB | d1 |
| REVIEW_DB | d1 |
| TELEGRAM_BOT_TOKEN | secret_text |

The secrets endpoint confirmed **four secret names**; no values were requested or recorded. This manifest alone does not establish D1 schema parity, routes, source-module parity, or secret compatibility.

## Candidate release acceptance (fail closed)
1. Retrieve branch HEAD SHA and CI checks for **that exact SHA**; confirm all relevant checks green.
2. Inspect active Worker multipart source modules, metadata, routes and compatibility flags; compare to a complete candidate bundle. Never replace a multi-module upload with a partial file.
3. Read D1 schemas and binding IDs without writes; verify API queries and authorization policy match schema.
4. Map every task endpoint to server-verified Telegram identity, workspace scoping, RBAC policy, and synthetic handler tests.
5. Verify read-only homepage HTTP response and capture exact URL, status and timestamp.
6. Document an operational rollback to a previously validated compatible version; do not execute rollback as a test.
7. Deploy only to existing `candidatory-miniapp-api` if all gates pass. Never create staging, preview, test Worker or bot.

## Gap matrix
| Domain | Status | Evidence |
|---|---|---|
| Active deployment identification | سالم | Read-only deployments API at timestamp above |
| Seven binding names/types and four secret names | سالم | Read-only settings/secrets API |
| Release contract pinned in repository | جدید | This file |
| Full architecture 18 chapters verbatim | ناقص | Original message not recovered in this run |
| SHA-specific CI, source bundle, routes, D1 and homepage | ناقص | Not verified in this run |
| Live handler authorization and rollback compatibility | نیازمند اصلاح/تأیید | No end-to-end evidence |

No production changes were performed. Rollback for this documentation change: revert this commit only. Preserve news Worker `candidatory-news-bot` and channel `@candidatoryiran` unchanged.
