# Production-only gate evidence — 2026-11-23 08:51 UTC

Scope: existing `candidatory-miniapp-api` only. READ-ONLY verification; **NO DEPLOY**.

## Evidence gathered this run
- GitHub workflow runs queried for historical commit `51281fc8bd2d59874f25705dd965e224cdd2a1b0`. Offline release validator [45134131597](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/45134131597), task RBAC [45134131438](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/45134131438), multipart parity [45134131620](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/45134131620), and Mini App checks [45134131410](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/45134131410) each returned `completed/success`. These are **not** proof that the new commit or active Worker code passed.
- Live Cloudflare deployments GET: current deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, created `2026-11-11T20:05:53.015284Z`, serving 100% version `3c35231f-36f0-4bad-b786-9a4309d8e868`.
- Live Worker settings GET: compatibility date `2026-10-27`; bindings (name/type only): `ADMIN_TELEGRAM_IDS` secret_text, `ADMIN_TELEGRAM_IDS_MAHDI` secret_text, `AVALAI_API_KEY` secret_text, `TELEGRAM_BOT_TOKEN` secret_text, `AI` ai, `DB` d1, `REVIEW_DB` d1. No secret values accessed.
- Live subdomain GET: enabled true; previews_enabled false.
- Versioned 18-chapter document `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` read. Its own header identifies it as a **compressed structural rewrite**, NOT verbatim original. Do not present it as verbatim archival evidence.

## Gap matrix
| Scope | Status | Release requirement |
|---|---|---|
| Live deployment and binding name/type inventory | سالم (read-only snapshot) | Recheck immediately before any release |
| Offline CI on historical commit | سالم (that SHA only) | Confirm branch HEAD and exact release SHA |
| Verbatim 18-chapter original | ناقص | Recover source message and preserve provenance |
| Active multipart source / routes / D1 schema and authorization parity | ناقص | Read-only inspection and contract verification |
| Canonical homepage GET/HEAD smoke test | ناقص | Determine canonical URL and test read-only |
| Operational rollback artifact and schema compatibility | نیازمند اصلاح | Verify exact previous bundle, bindings and rollback plan |
| This timestamped release-gate record | جدید | Documentation only |

## Mandatory gate (fail closed)
Do not deploy unless exact-SHA CI, multipart bundle, route/binding/metadata/D1 compatibility, authorization/security checks, read-only homepage smoke test, and viable rollback are all verified. No live write/auth tests, D1 migration, paid AI, payments, bulk notifications, admin changes, new Worker/bot/Mini App, staging, preview, test deployment or second runtime. Keep `candidatory-news-bot` and `@candidatoryiran` unchanged.

Next safe slice: inspect actual tasks handlers and D1 contracts read-only, add synthetic owner/workspace RBAC contract test, then verify new SHA CI.