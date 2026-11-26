# Phase 15 — signed zero-task owner regression (2026-11-11)

## Verified starting point
- Branch before this change: `491e87cb6e73cb0691cace9c976c552ebf54155a`.
- Previous branch CI had eight sampled successful runs at that HEAD.
- Isolated integration Worker deployment `c5c6482d-2daa-4862-a62b-8c4cc2720141`, version `7489532d-a4a8-4f4f-8924-e12096e6c548` (100%).
- News Worker deployment `1d14f941-dc04-40ba-9f19-1cdd5831024c`, version `1c080a9a-e7b6-420a-81ae-14821608a1aa` (100%); not modified.
- Isolated D1 `candidatory-integration-test-20261101`: read-only PRAGMA confirmed `candidate_tasks_v1` schema. `SELECT status,COUNT(*) GROUP BY status` returned no rows. Invalid non-null due dates: 0. All three D1 queries were read-only.

## Change
`progress-tasks-e2e.mjs` now exercises a third, freshly signed synthetic Telegram owner with no task rows. It requires HTTP 200, explicit numeric zero metrics, exactly one SQL query bound to that owner, then rechecks a populated owner to prevent cached cross-account response. Existing invalid-HMAC, signed-owner, delayed-read and mobile checks are not replaced.

## Test / release boundaries
- Commit: `1a4a65aa2bac3aa8152838deda13d49fbab06534`.
- CI run initiated: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43032990288 — inspect final conclusion before claiming success.
- This is a **synthetic test**, not real Telegram account acceptance.
- No Worker upload, D1 mutation, news publication, payments, AI or notifications.
- **Rollback:** revert commit `1a4a65aa2bac3aa8152838deda13d49fbab06534` (and this documentation commit). Worker deployment and D1 require no rollback.
- Real signed Telegram accounts, real mobile WebView screenshots, and end-to-end task creation remain mandatory release blockers.
