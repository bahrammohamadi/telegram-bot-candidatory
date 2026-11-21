# Candidatory architecture v1.0 — evidence and gap ledger (2026-11-18)

Status: **BLOCKED for production release**. This ledger is not the authoritative 18-chapter text and must not be substituted for it.

## Authority and scope
- Authority: user-authored «سند جامع معماری نهایی کاندیداتوری، نسخه ۱.۰، ۲۱ آبان ۱۴۰۵», supplied 2026-11-12; full verbatim text has **not** been recovered in this run. Do not invent missing chapters.
- Only existing Telegram bot, mini-app and production Worker `candidatory-miniapp-api`. Do not create any staging, preview, test deployment, second Worker or bot.
- Do not modify `candidatory-news-bot` or @candidatoryiran. No production write tests, D1 migrations, payments, paid AI, mass notifications or access changes.

## Gap matrix
| Area | Classification | Evidence / required action |
|---|---|---|
| Production deployment identity | سالم | Cloudflare read 2026-11-18: deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`; version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic, created 2026-11-11T20:05:53Z |
| Bindings inventory | سالم | Cloudflare settings: D1 `DB`, `REVIEW_DB`; AI `AI`; secret names `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN`. Values intentionally not accessed. |
| Offline production evidence checker | سالم | `tools/check-production-evidence.mjs` exists; syntactic evidence completeness is not independent verification. |
| Offline CI for previous SHA | سالم | Workflow `44255119077` and `44255118925` completed successfully for SHA `76349de8f5cdd0e191ec60f1934433a407cb473e`; these do not certify a later SHA or production readiness. |
| Full 18-chapter verbatim architecture archive | ناقص | Retrieve original user-authored text before versioned archival; no invented replacement. |
| GitHub HEAD / CI of this documentation commit | ناقص | Resolve branch HEAD and new SHA CI after commit. |
| Worker multi-module source and manifest parity | ناقص | Compare each production module hash, main module, compatibility metadata, bindings and routes to intended release artifact. |
| RBAC real handler tests with synthetic data | نیازمند اصلاح | Unit/contract tests for actual handlers, tenant ownership, fail-closed behavior and authorization. No real production write. |
| RTL mobile five tabs: امروز، مسیر من، کارها، یادگیری، حساب | نیازمند اصلاح | Compare implementation to authoritative document, then make small independently reviewable slices. |
| Rollback artifact and rehearsed procedure | ناقص | Capture verified module bundle, immutable hashes and recovery procedure without creating deployment. |
| Release evidence ledger | جدید | This file tracks observed facts and explicit blockers, not a release authorization. |

## Release decision
**NO DEPLOY.** Passing offline CI is necessary but not sufficient. Before deployment require complete authoritative text, source parity, real-handler synthetic tests, successful CI for exact release SHA, binding/D1/security checks, rollback artifact, and read-only URL smoke plan. Never use a test environment or unsafe production writes.

## Next action
Locate the original 18 chapters and archive them verbatim, then implement actual-handler synthetic tests and a reproducible production module manifest. Preserve existing code and data pending review.
