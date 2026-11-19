# Production-only release evidence gate — 2026-11-19 20:56 UTC

Status: **BLOCKED / NO DEPLOY**. This document is evidence, not authorization to deploy. Scope: existing Telegram bot and existing Cloudflare Worker `candidatory-miniapp-api` only. Never create staging, preview, a second Worker, or a test deployment.

## Verified live baseline (Cloudflare GET, 2026-11-19 20:56 UTC)
- Deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, created `2026-11-11T20:05:53.015284Z`
- Version: `3c35231f-36f0-4bad-b786-9a4309d8e868` at 100% traffic
- Compatibility date: `2026-10-27`
- Binding names/types (no values): `ADMIN_TELEGRAM_IDS` secret_text; `ADMIN_TELEGRAM_IDS_MAHDI` secret_text; `AVALAI_API_KEY` secret_text; `TELEGRAM_BOT_TOKEN` secret_text; `AI` ai; `DB` d1; `REVIEW_DB` d1
- workers.dev subdomain enabled; previews disabled.
- GitHub head before this commit: `7d62a0b9b71e035565a39caf50482f0ca6642d8a`.
- Latest observed CI on that SHA: [offline production-release policy run 44603208208](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44603208208) = success. A successful offline job does **not** establish deployability.

## Required gates before production-only release
1. Recover and version the **verbatim** 18-chapter owner document. `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` is explicitly a condensed rewrite; do not mislabel it as verbatim.
2. Download the **full current multi-module Worker code** and record module names, content hashes, entry module, routes, D1 identifiers and schemas, metadata, binding types, compatibility flags, and nonsecret secret-name inventory. No partial single-file overwrite.
3. Match release bundle to the live baseline and document all intentional differences; check RBAC, workspace ownership and denial cases using synthetic offline fixtures.
4. Confirm CI for the **exact proposed commit**, not a previous SHA. Run unit/static/contract tests without any environment deployment.
5. Record exact immutable recovery artifact, module hashes, original metadata/bindings and verified rollback procedure; do not assert a prior version ID alone is sufficient.
6. Only after gates pass, deploy to the **existing** `candidatory-miniapp-api` Worker; perform read-only public URL smoke test and record HTTP result, timestamp, version, deployment, and rollback outcome.

## Gap matrix
| Area | Classification | Evidence / action |
|---|---|---|
| Production deployment/version inventory | سالم | Cloudflare GET above |
| Binding type/name inventory | سالم | Cloudflare GET above; values never captured |
| Verbatim 18 chapters | ناقص | Condensed reference exists; exact user source missing |
| Full multi-module code parity and route/D1 schema | ناقص | Not established |
| Real-handler RBAC coverage | نیازمند اصلاح | Require offline synthetic fixtures |
| Immutable rollback bundle | ناقص | No verified artifact |
| This release-evidence gate | جدید | New versioned document |
| Public home URL smoke | ناقص | No verified URL/HTTP response |

## Prohibitions
Do not touch `candidatory-news-bot` or `@candidatoryiran`. No live payment, paid AI, mass notifications, destructive D1 changes, role changes, token disclosure, production write tests or authentication probes without separate authorization. Political manipulation, sensitive profiling and unsolicited messaging are prohibited.
