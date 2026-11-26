# Production-only release gate — 2026-11-17 02:52 UTC

Scope: existing Telegram bot and mini-app, **only** Cloudflare Worker `candidatory-miniapp-api`. Do not deploy or create any other worker, preview, staging or isolated environment. Do not modify `candidatory-news-bot` or `@candidatoryiran`.

## Fresh read-only evidence
- Worker deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed` (2026-11-11T20:05:53Z), version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic.
- Compatibility date: `2026-10-27`.
- Binding names/types: `DB` (D1), `REVIEW_DB` (D1), `AI` (AI), `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN` (secret_text). No secret values collected.
- Prior deployment `3d172eb9-eca1-45e5-9070-760970d1f8c1`, version `32d33109-8e48-4c9e-a38a-4dd91012967b`, is **historical only**; not a verified rollback artifact.
- Existing workflow `.github/workflows/candidatory-tasks-validation.yml` builds task bundle and runs synthetic offline tests. Its triggers are limited to `cloudflare-live/phase14/**` and its own workflow path; this documentation-only commit is not guaranteed to trigger it.

## Release blockers and gap matrix

| Area | Status | Required evidence |
|---|---|---|
| Production deployment identity and binding names | سالم | Fresh read-only Cloudflare query |
| This release-gate evidence | جدید | Version-controlled record |
| Exact 18-chapter canonical architecture | ناقص | Recover original user text verbatim, no reconstruction |
| Branch head SHA and full CI conclusion | ناقص | GitHub ref and completed relevant workflow checks |
| Production multipart source hash manifest | ناقص | Verify all modules against current Worker |
| Routes, homepage URL and safe GET smoke test | ناقص | Resolve canonical URL and read-only response |
| Case ownership RBAC | نیازمند اصلاح | Offline synthetic handler tests |
| Mobile RTL five-tab UX | نیازمند اصلاح | Static/browser checks without deployment |
| Rollback package | ناقص | Verified deployable multipart backup and configuration match |

## Hard release gate
No production write until: complete multipart module inventory and hashes; current metadata/routes/bindings/D1 and secret **names** reconciled; green relevant CI; synthetic authorization and ownership checks; static security scan; verified rollback bundle and documented procedure; safe GET smoke-test plan. Never run authentication tests, write tests, paid AI, payments, bulk messaging, or destructive D1 operations against production. If these requirements cannot be established offline, do not release.

Next deliverable: implement an offline production-only release-manifest validator that compares expected module names, hashes, binding types and required tests, without contacting or deploying any Worker.
