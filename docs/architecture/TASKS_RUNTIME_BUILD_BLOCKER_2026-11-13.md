# Task runtime E2E release blocker — 2026-11-13

Status: **BLOCKED / NO PRODUCTION DEPLOY**. This is a source-control-only artifact, not permission to run D1 migrations.

## Verified repository evidence

- `.github/workflows/candidate-task-static-gate.yml` checks for `cloudflare-live/phase14/dist/integration-tasks-worker.mjs` and fails closed if absent; it does **not** build the file.
- `package.json` has only `start: node src/main.js`, with no Worker multi-module build script.
- The Workflow's SQLite checks use `node:sqlite` and `:memory:`; their success cannot substitute for runtime Worker E2E or production parity.
- `cloudflare-live/phase14/tasks-migration.sql` is explicitly marked isolated-only; do not apply it to production D1.

## Verified Cloudflare configuration (read-only, 2026-11-13)

- Production script: `candidatory-miniapp-api`.
- Most recent deployment in the API response: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic, created `2026-11-11T20:05:53Z`.
- Binding names/types: `DB` (D1), `REVIEW_DB` (D1), `AI` (AI), and secret_text names `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN`. No secret values captured.
- D1 schema, routes, module parity, live HTTP health and rollback execution have **not** been verified in this record.

## Required next implementation slice

1. Identify the **exact existing production multi-module entrypoint and imports** from the repository and Cloudflare module metadata. Do not invent a replacement entrypoint.
2. Add a deterministic, pinned offline build command for `integration-tasks-worker.mjs` in the existing CI only. Use synthetic data; never call production services from the test.
3. Run the runtime E2E against that built artifact, verify authorization and owner isolation, and record its GitHub Actions run URL and commit SHA.
4. Before any deployment, compare module names, bindings, D1 schema (read-only), compatibility metadata and routes to the current production version; verify read-only HTTP health and an actionable rollback path.
5. Deploy **only** to the existing `candidatory-miniapp-api` after all release gates pass. No staging, preview, new Worker or alternate bot.

## Gap classification

| Area | Classification | Evidence |
|---|---|---|
| Synthetic SQLite contract checks | سالم (source present; latest CI result unverified) | workflow source |
| Runtime E2E artifact generation | ناقص | no build step |
| Production module parity | نیازمند اصلاح/تأیید | no verified manifest |
| Verified rollback and read-only HTTP smoke test | جدید / فاقد شاهد | no run evidence |

No production writes, migration, secret exposure, paid AI calls or news Worker changes are authorized by this document.
