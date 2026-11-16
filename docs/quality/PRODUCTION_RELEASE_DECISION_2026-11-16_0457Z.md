# Production release decision record — 2026-11-16 04:57 UTC

Scope: **only** existing Telegram bot / mini-app and Cloudflare Worker `candidatory-miniapp-api`. This record is documentation, **not deployment authorization**.

## Read-only Cloudflare evidence (queried 2026-11-16)
- Active deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`
- Active version: `3c35231f-36f0-4bad-b786-9a4309d8e868` (100% traffic)
- Created: `2026-11-11T20:05:53.015284Z`
- Binding names/types only: `DB` (d1), `REVIEW_DB` (d1), `AI` (ai); `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN` (secret_text).
- No secret values inspected, no D1 queries, no mutations.

## Decision: BLOCK PRODUCTION RELEASE
The following evidence is still required for any change:
1. Exact multipart payload from active version, per-module hashes and comparison to proposed bundle; preserve all entrypoint, legacy and preview modules.
2. Verified metadata/routes/compatibility/bindings and D1 schema compatibility, without destructive migration.
3. Passing CI on the **candidate SHA** (not a previous commit), including auth, RBAC ownership, API contract and regression tests using synthetic fixtures.
4. Verified production URL with read-only smoke checks and a documented, validated rollback package/procedure.
5. No new Worker, environment, staging/preview deployment, bot or mini-app.

## Architecture source fidelity
The repository contains a **condensed** 18-chapter architecture at `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md`. This must not be represented as a literal archive of the user-provided original dated 21 Aban 1405. Exact source text is not yet verified in the repository. Preserve this gap explicitly.

## Next implementation slice
Extract actual candidate/profile/task handler paths and authorization checks from the existing source, write negative ownership tests against the handlers using synthetic records, and run CI. Do not deploy until every gate above passes.

Protected assets: `candidatory-news-bot`, `@candidatoryiran`. No writes authorized to either.
