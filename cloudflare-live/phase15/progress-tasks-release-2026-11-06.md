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
**Not deployed.** This is a reproducible, CI-tested integration candidate only. Neither `candidatory-miniapp-integration` nor production `candidatory-miniapp-api`, the news Worker or D1 were changed. Do not claim authenticated real-device Telegram WebView E2E.

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
