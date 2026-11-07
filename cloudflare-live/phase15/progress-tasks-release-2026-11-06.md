# Phase 15 — task completion metrics in progress report (integration candidate)
Date: 2026-11-06

## Change and scope
- Builder: `cloudflare-live/phase15/build-progress-tasks.mjs`.
- Test: `cloudflare-live/phase15/progress-tasks-e2e.mjs`.
- Base: exact checked-in deployed phase-14 integration snapshot, not historical Appwrite or production Mini App.
- Adds owner-scoped task counts (total, done, doing, overdue) to the existing `POST /api/progress` `overview` response.
- Adds a personal-task summary card and a line in the copyable progress export; no fabricated readiness/competency score.
- Uses the same `telegram_id=?` authorization boundary as other progress metrics, with Tehran-local overdue date.
- No schema migration and no new permissions, bindings, secrets, user data, payments, AI calls or notifications.

## Test evidence
- GitHub Actions phase15 validation: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42177672845 — success.
- Tests: Node syntax check, signed synthetic Telegram identities, rejection of invalid/forged identity, two-user task-summary isolation, server-side owner SQL, Tehran date logic, UI/export inclusion, preserved existing routes.
- Earlier failed run https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42177627681 was caused by an overstrict test-builder assertion counting existing task routes. Corrected before passing CI.

## Release boundary
**Deployed to isolated integration Worker on 2026-11-06; NOT production.** Deployment ID `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` (previous `fa1cf6c7-aa15-4aef-96ab-3951d9c011f6`). Cloudflare `/content` endpoint replaced only the module script without touching Worker metadata or bindings. Exact live source read-back matched the assembled phase15 candidate, 147,178 characters; bindings remained `DB` D1 `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0` and `TELEGRAM_BOT_TOKEN` secret_text. No D1 migration or production/news Worker changes. External HTTP smoke was attempted but the tool network blocked workers.dev with HTTP 403 before reaching Worker; do not claim live HTTP or real-device Telegram WebView E2E. The separate older `Staging HTTP smoke` workflow remains RED (staging synthetic health returned HTTP 500 and visual dashboard timed out), and is not evidence of a phase15 failure; investigate separately.

## Safe staging promotion
1. Confirm branch HEAD, the passing phase15 CI, and that the live integration Worker still matches the pinned phase-14 snapshot.
2. Assemble `node cloudflare-live/phase15/build-progress-tasks.mjs` and `node --check cloudflare-live/phase15/dist/integration-progress-tasks-worker.mjs`.
3. Compare output against exact phase-14 baseline; only the progress API and progress UI/export should differ.
4. Preserve Cloudflare deployment ID, exact source, D1 binding and secret binding inventory for rollback; never print secret values.
5. Deploy candidate **only** to the isolated integration Worker using the already configured D1 and signing secret; no D1 migration required.
6. Smoke `/health`, forged and missing initData 401, two real test Telegram accounts, progress/task round trip and mobile screenshots 320/375/430.
7. Roll back by redeploying the pinned `cloudflare-live/phase14/integration-deployed-snapshot-2026-11-03.mjs` artifact with the same bindings. D1 schema/data remain unchanged.
8. Do not promote to production without separate final approval and full cross-version feature parity.

## Next
Add live integration staging deployment and real Telegram WebView tests. Later reconcile the main Mini App's 195 questions and 27 lessons with the isolated test app before production promotion.


## 2026-11-06 — integration deployment verification and rollback
- GitHub source HEAD before deployment: `87838dc8ca8982110e46f0583a2c5058b073a5bf`.
- CI phase15: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42177718538 — success.
- Exact previous live Worker source was compared byte-for-byte to checked-in phase14 snapshot before upload; mismatch would abort. New candidate was assembled with the same replacements as `build-progress-tasks.mjs` and uploaded via Cloudflare `PUT /workers/scripts/candidatory-miniapp-integration/content` (script content only).
- Cloudflare deployment ID after upload: `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`; live script read-back matched assembled source exactly, 147178/147178 characters; binding names/types and D1 database ID were rechecked.
- Rollback: redeploy the exact `cloudflare-live/phase14/integration-deployed-snapshot-2026-11-03.mjs` to **integration only** using the same content-only endpoint; ensure current deployment ID is still `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` before rollback and recheck bindings and read-back. Do not modify D1; no schema migration occurred.
- **Pending acceptance:** independent HTTP `/health`, unsigned/forged `/api/progress` 401, real signed Telegram WebView account persistence and isolation, 320/375/430 mobile QA. These remain release blockers despite CI and source parity passing.
- Separate CI failure: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42177722835 — staging preview health returned 500 and visual test timed out. Do not mark overall CI green.
