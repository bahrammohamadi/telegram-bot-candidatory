# Production release gate — 2026-11-22 (read-only evidence)

Scope: existing Telegram bot / miniapp and **only** `candidatory-miniapp-api`. This is a release-blocking checklist, **not** authorization to deploy.

## Verified at 2026-11-22
- Cloudflare GET deployments: newest returned deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868` receiving 100%, created 2026-11-11T20:05:53Z.
- Previous listed deployment `3d172eb9-eca1-45e5-9070-760970d1f8c1`, version `32d33109-8e48-4c9e-a38a-4dd91012967b` (historical; **not** proven safe for rollback).
- GET script-settings: logpush=false; observability=null. This is not proof that all telemetry is absent.
- GET secrets: four secret **names/types only**: ADMIN_TELEGRAM_IDS, ADMIN_TELEGRAM_IDS_MAHDI, AVALAI_API_KEY, TELEGRAM_BOT_TOKEN. No values retrieved.
- GitHub architecture document `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` is a **condensed structural rewrite**, explicitly not the original verbatim 18 chapters.

## Gap matrix (evidence-based)
| Requirement | State | Evidence / release gate |
|---|---|---|
| Existing production deployment identified | سالم | Cloudflare deployments GET, timestamp above |
| Secret inventory by name | سالم | Cloudflare secrets GET; values not inspected |
| Verbatim original 18 chapters | ناقص | Existing document declares abridgement; retrieve original before asserting full traceability |
| GitHub HEAD/CI for target branch | ناقص | Branch-specific current HEAD and checks not verified in this record |
| Multipart module parity, metadata, routes, bindings, D1 | ناقص | Full production-to-source comparison and read-only D1 schema inspection required |
| Task ownership and workspace RBAC | نیازمند اصلاح/اعتبارسنجی | Synthetic fixtures: deny cross-workspace read/write, revoked member, forged initData, role escalation; no real-user tests |
| Mobile RTL five-tab user flows | جدید/نیازمند بررسی | Test against actual existing UI before implementing; no assumptions about absent features |
| Rollback procedure | ناقص | Prior version ID exists; compatibility with D1/bindings and safe redeploy not verified |
| Observability release checks | نیازمند بررسی | Script settings returned observability=null; assess alternate monitoring |

## Non-negotiable release gate
1. Verify target branch HEAD SHA and relevant successful CI checks on **that exact SHA**.
2. Obtain full production multipart modules and compare source, routes, bindings, D1 schema, compatibility metadata and secret names/types (never values).
3. Run static, unit and contract tests with synthetic fixtures **without creating a second runtime**; test auth, tenant isolation, idempotency and data validation.
4. Record immutable release artifact digest and verified rollback procedure; confirm prior version compatibility without mutating D1.
5. Only then consider a small production-only release; capture deployed version/time and read-only smoke checks of canonical URL.
6. Do not touch `candidatory-news-bot` or `@candidatoryiran`; no real payment, paid AI, bulk notifications, destructive migration or admin-access changes without separate approval.

## Decision
**BLOCK PRODUCTION DEPLOYMENT** pending missing evidence. No new worker, preview, staging or test deployment is authorized. This document changes GitHub documentation only.
