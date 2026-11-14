# Production release decision — 2026-11-14 (read-only preflight)

## Explicit owner direction
Owner authorized applying safe changes **only** to existing Telegram bot/miniapp and `candidatory-miniapp-api` Production. This is not permission to bypass CI, source parity, access control, D1 compatibility or rollback gates.

## Live Cloudflare evidence (re-queried 2026-11-14)
- Active deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`
- Active version: `3c35231f-36f0-4bad-b786-9a4309d8e868` (100% traffic)
- Compatibility date: `2026-10-27`
- Bindings (names/types only): `ADMIN_TELEGRAM_IDS` secret_text, `ADMIN_TELEGRAM_IDS_MAHDI` secret_text, `AI` ai, `AVALAI_API_KEY` secret_text, `DB` d1, `REVIEW_DB` d1, `TELEGRAM_BOT_TOKEN` secret_text.
- `previews_enabled=false`. No preview/staging/other Worker created.

## CI/source evidence
- Branch: `feature/cloudflare-parity-audit-2026-10-29`
- Last independently observed workflow SHA: `364d89417c70a317be07e16f9f3cb49e6f670277` (not necessarily HEAD at publication time).
- Workflow `candidate-task-static-gate.yml` builds `cloudflare-live/phase14/dist/integration-tasks-worker.mjs` from `cloudflare-live/phase13/integration-deployed-snapshot-2026-11-02.mjs`.
- This synthetic artifact is **NOT** proven equal to the active multipart Production source.
- CI success for this new document commit is not yet established.

## Release decision: BLOCKED
Do not upload synthetic task bundle or mutate Production until all of the following have independently verifiable evidence:
1. Exact current GitHub HEAD and successful required CI for that SHA.
2. Download and inventory active multipart Worker modules, preserving main module and module MIME types.
3. Compare actual Production modules against proposed patch; preserve unrelated modules and behavior.
4. Verify bindings, routes, compatibility metadata, secret *names/types only*, and D1 schema using read-only methods.
5. Offline authorization/RBAC/ownership tests with synthetic fixtures; no live write/auth tests.
6. Non-mutating smoke check of canonical main URL.
7. Record immutable release artifact hash, current version, tested rollback target, and rollback procedure.
8. Publish only to existing `candidatory-miniapp-api` if all checks pass; record new deployment/version and smoke result.

## Gap matrix
| Area | Classification | Evidence |
|---|---|---|
| Existing Production Worker | سالم | Active version/deployment queried |
| Binding descriptors | سالم | Seven names/types queried; no values |
| Synthetic task CI source | نیازمند اصلاح | Uses 2026-11-02 snapshot |
| Live multipart code parity | ناقص | Not yet compared |
| D1 schema and RBAC runtime | ناقص | No live read-only schema evidence |
| Main URL smoke | ناقص | Canonical URL unverified |
| Safe rollback | جدید | Prior deployment exists; executable rollback unverified |
| Verbatim 18-chapter source | ناقص | Existing architecture archive is compressed |

No changes to `candidatory-news-bot`, `@candidatoryiran`, production D1, payments, AI spend, administrator privileges or bulk messaging.
