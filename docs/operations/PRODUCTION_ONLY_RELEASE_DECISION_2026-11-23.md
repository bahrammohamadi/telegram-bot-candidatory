# Candidatory production-only release decision — 2026-11-23 (UTC)

Status: **BLOCKED / NO DEPLOY**. This is a read-only evidence snapshot, not authorization to release.

## Verified live Cloudflare evidence
- Worker: `candidatory-miniapp-api` only.
- Latest returned deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, created `2026-11-11T20:05:53.015284Z`.
- Traffic: 100% on version `3c35231f-36f0-4bad-b786-9a4309d8e868`.
- Compatibility date: `2026-10-27`.
- Bindings (names/types only): `ADMIN_TELEGRAM_IDS` secret_text; `ADMIN_TELEGRAM_IDS_MAHDI` secret_text; `AVALAI_API_KEY` secret_text; `TELEGRAM_BOT_TOKEN` secret_text; `AI` ai; `DB` d1; `REVIEW_DB` d1. No secret values accessed.
- Deployment rollback candidate exists in history (`3d172eb9-eca1-45e5-9070-760970d1f8c1`), but **rollback execution and compatibility are not verified**.

## GitHub evidence
- Repository: `bahrammohamadi/telegram-bot-candidatory`.
- Target branch: `feature/cloudflare-parity-audit-2026-10-29`.
- Prior commit `f36e52407825fb82bf4fab35245a73ae2ec8cf02` has successful offline workflow runs, including release validator [45096849657](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/45096849657), task RBAC [45096849684](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/45096849684), multipart parity [45096849736](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/45096849736), and Mini App checks [45096849740](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/45096849740). These are historical SHA-scoped checks, not a pass for this documentation commit or live deployment.

## Gap matrix
| Scope | State | Acceptance blocker |
|---|---|---|
| Worker deployment and binding inventory | سالم / verified | Recheck at actual release time |
| Offline RBAC and release checks on prior SHA | سالم / verified for that SHA | Confirm exact release SHA and required checks |
| Versioned live-evidence decision record | جدید / new | This document |
| Exact original 18-chapter 2026-11-12 architecture text | ناقص / incomplete | Recover verbatim source; do not substitute summary |
| Handler-level authorization and D1 contract parity | ناقص / incomplete | Inspect deployed modules and enforce owner/role scope |
| Live route/homepage read-only smoke test | ناقص / incomplete | Determine canonical URL and GET/HEAD only |
| Operational rollback verification | نیازمند اصلاح / needs correction | Validate restoration artifact, bindings and rollback procedure without touching live data |

## Mandatory next safe slice
1. Identify branch HEAD SHA and corresponding required CI checks (never infer HEAD from a historic commit).
2. Read existing task handlers and tests, add a narrowly scoped synthetic RBAC contract regression, and run CI without deploying a new environment.
3. Inspect full production multipart module inventory, routes and D1 schema **read-only**, then compare against release artifact and metadata.
4. Confirm original architecture document verbatim and version it in GitHub with provenance.
5. Only after a green exact-SHA gate, secure binding parity, valid rollback artifact and read-only homepage smoke test may a small change be considered for **the same existing production Worker**.

Forbidden: any second Worker/bot/mini-app, staging/preview/test deployment, live write/auth test, paid AI call, D1 migration, payment, bulk notification, admin access change. Keep `candidatory-news-bot` and `@candidatoryiran` untouched.
