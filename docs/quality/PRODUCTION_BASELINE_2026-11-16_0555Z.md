# Production deployment baseline — 2026-11-16 05:55 UTC

Scope: **candidatory-miniapp-api** only. Source: read-only Cloudflare Workers deployments and settings API, checked 2026-11-16. This is a release-blocking evidence record, **not** a deployable rollback artifact.

## Active deployment
- deployment_id: `860f813c-baf4-4cff-bfc7-bb4120b910ed`
- version_id: `3c35231f-36f0-4bad-b786-9a4309d8e868`
- traffic_percentage: 100
- deployed_at_utc: `2026-11-11T20:05:53.015284Z`
- deployment_source: api; strategy: percentage
- compatibility_date: `2026-10-27`

## Bindings (names/types only)
- `DB`: d1
- `REVIEW_DB`: d1
- `AI`: ai
- `ADMIN_TELEGRAM_IDS`: secret_text
- `ADMIN_TELEGRAM_IDS_MAHDI`: secret_text
- `AVALAI_API_KEY`: secret_text
- `TELEGRAM_BOT_TOKEN`: secret_text

No secret values were retrieved. Route inventory, D1 schema, full multipart bytes and independent public URL HTTP health were **not** verified in this check. The earlier version `32d33109-8e48-4c9e-a38a-4dd91012967b` (deployment `3d172eb9-eca1-45e5-9070-760970d1f8c1`) is historical only, **not** a verified rollback package.

## Required before any production write
1. Capture and checksum exact active multipart module bytes and metadata; verify proposed manifest matches all expected modules.
2. Confirm D1 schema, binding IDs/types, route configuration and secret **names**; never expose values.
3. Pass exact-commit CI including offline negative RBAC/ownership tests and security/static checks with synthetic data.
4. Verify read-only public URL response and record UTC timestamp, response status and content signature.
5. Prepare an exact recoverable prior package and document restoration procedure; do not equate a deployment ID with proven rollback.
6. Do not create any alternate Worker, preview/staging deployment or test environment; block unsafe changes instead.

## Architecture alignment status
| Area | Status | Evidence needed |
|---|---|---|
| Active deployment and binding names | سالم | Cloudflare read-only API 2026-11-16 |
| Full 18-chapter verbatim master archive | ناقص | Original full user text; existing summary is not verbatim |
| Mobile RTL five tabs | نیازمند اصلاح | Existing UI/source-derived acceptance tests |
| Candidate profile/path/tasks | ناقص | Real handler inventory and ownership contract tests |
| RBAC and D1 ownership enforcement | نیازمند اصلاح | Offline tests against actual handlers |
| Exact multipart and recovery artifact | ناقص | Hash manifest and recoverable bytes |
| Release evidence record | جدید | This file |

No changes to production, D1, news Worker, or Telegram channel are authorized by this record.
