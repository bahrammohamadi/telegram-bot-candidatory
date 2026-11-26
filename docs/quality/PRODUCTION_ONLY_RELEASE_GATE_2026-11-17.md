# Production-only release gate — 2026-11-17

Scope: existing Telegram bot / mini-app and **candidatory-miniapp-api** only. This file is a release-control artifact, **not** deployment authorization.

## Fresh Cloudflare read (UTC 2026-11-16/17)
- Active deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed` (100%).
- Active version: `3c35231f-36f0-4bad-b786-9a4309d8e868` (version 104; deployed 2026-11-11T20:05:53Z).
- Previous deployed version in history: `32d33109-8e48-4c9e-a38a-4dd91012967b`; **not** a verified rollback bundle.
- Settings compatibility date: `2026-10-27`.
- Bindings by name/type only: `DB:d1`, `REVIEW_DB:d1`, `AI:ai`, `ADMIN_TELEGRAM_IDS:secret_text`, `ADMIN_TELEGRAM_IDS_MAHDI:secret_text`, `AVALAI_API_KEY:secret_text`, `TELEGRAM_BOT_TOKEN:secret_text`. Never export secret values.
- Cloudflare versions list reports `has_preview: true` for version 104; this metadata is **not** permission to create/use a preview environment.

## Release blockers (fail closed)
1. Confirm latest branch commit SHA and all relevant GitHub Actions jobs successful **for that SHA**, not a prior commit.
2. Recover and version the verbatim 18-chapter architecture document from the original user message; current partial summaries are insufficient.
3. Retrieve and hash **all** modules of the active multipart Worker; compare against candidate build, metadata, routes, bindings, D1 identifiers, compatibility flags, and secret names/types.
4. Test task/case ownership and RBAC using synthetic data only; verify mobile RTL and five-tab navigation offline.
5. Obtain a restorable exact snapshot of active multi-module code and metadata; document a non-destructive rollback command and verify completeness offline.
6. Read-only smoke-check the known canonical production URL before and after release; do not infer it from Worker name.
7. No second Worker, staging, preview, test deployment, live authentication test, live D1 write, destructive migration, paid AI, payment, mass messaging, or permission change.

## Decision
**NO DEPLOY** until every gate has explicit evidence. News Worker `candidatory-news-bot` and channel `@candidatoryiran` are out of scope.

## Gap matrix
| Area | State | Next evidence |
|---|---|---|
| Active deployment identification | سالم | Cloudflare deployments/versions read |
| Task workflow offline policy | سالم (source only) | GitHub CI result for current SHA |
| Verbatim architecture archive | ناقص | Original 18 chapters |
| Multipart source parity | ناقص | Module hash manifest |
| RBAC case/task execution | نیازمند اصلاح | Synthetic executable tests |
| Mobile RTL five tabs | نیازمند اصلاح | Offline UI assertions |
| Rollback package | ناقص | Full verified snapshot |
| Release-control artifact | جدید | This versioned file |

Do not treat historical status as current.