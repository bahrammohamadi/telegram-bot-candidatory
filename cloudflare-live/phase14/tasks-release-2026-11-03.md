# Phase 14 — Personal task tracking (isolated Telegram Mini App)
Release date: 2026-11-03

## Deployed scope
- Test Worker: `candidatory-miniapp-integration` ONLY.
- Test URL: https://candidatory-miniapp-integration.lasvaram-candidatory.workers.dev/
- Latest verified deployment: `fa1cf6c7-aa15-4aef-96ab-3951d9c011f6`.
- Independent D1 `candidatory-integration-test-20261101`, ID `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`.
- Full **exact deployed source** snapshot: `phase14/integration-deployed-snapshot-2026-11-03.mjs` (146,315 characters).
- Cloudflare test Worker `TELEGRAM_BOT_TOKEN` remained secret. Prior 11 API modules and UI sections preserved.
- Production Mini App `candidatory-miniapp-api` and news bot unchanged by this phase.

## Features available
- Main dashboard → **برنامه و پیگیری وظایف**.
- Create personal tasks with title, details, priority (low/normal/high) and optional Gregorian due date.
- Read and filter all/open/in progress/done/overdue, edit details and priority, update status, delete.
- Five summary metrics: total/open/doing/done/overdue; show owner-specific subscription quota and remaining slots.
- Overdue cutoff is the current date in Tehran time (+03:30); the app explicitly labels test context.
- Owner-only API: authenticated `POST /api/tasks`, actions `list`, `summary`, `create`, `update`, `status`, `delete`.
- All writes/reads scoped by HMAC-verified Telegram user ID; never trust a user-supplied owner ID.
- No push reminders/Telegram messages sent from task actions yet, no automated campaign outreach.

## Quotas and reversible schema changes
- Free demo plan: max **10 saved tasks**.
- Simulated Professional plan: max **100 saved tasks** while status=active and expiration is in future.
- Existing tasks remain available for reading, editing, completion and deletion when plan expires, but inserts are limited.
- Server checks before insert and SQLite BEFORE INSERT trigger enforce the quota under concurrent/direct writes.
- Isolated D1 migration: `phase14/tasks-migration.sql`; quota-only non-destructive rollback `phase14/tasks-rollback.sql`.
- Verified actual D1 contains `candidate_tasks_v1`, `idx_candidate_tasks_owner_due` and `trg_candidate_tasks_quota_v1`.
- A direct isolated D1 synthetic quota overflow was correctly rejected with `TASK_QUOTA_LIMIT` SQLite trigger error; temporary synthetic user and task fixtures were cleaned up.

## Test evidence
- GitHub Actions: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41590979872
- All 3 jobs PASS:
  1. The actual assembled Worker fetch handler with signed synthetic Telegram identities and SQLite D1 proxy: full CRUD, cross-user data isolation, overdue flags, invalid date/priority rejection, signed identity forgery rejection, premium expiry, direct trigger quota bypass.
  2. Chromium Playwright at 320/375/430 px with mocked task API: create, overdue filter, complete, edit and delete, navigate to dashboard, no console errors/overflow, using both built HTML and **fetched live Worker HTML**.
  3. Live HTTP smoke of isolated Worker: `/health`, all prior module markup, `/api/tasks` rejecting invalid/forged identity with HTTP 401.
- This **does not** replace real user Telegram WebApp testing: signed session, persistence after reopen and device-specific date-picker behavior remain for manual smoke.

## Official Telegram channel verification (no new post)
- The one-time phase-13 development notice in `@candidatoryiran` remains **published** under message ID **3997**, attempted only once, no error: https://t.me/candidatoryiran/3997.
- News worker deployment is unchanged `3925b0e8-a88a-4235-bdbe-26cc744169b2`.
- Cron remains `*/5 * * * *` for scheduled news. Phase 14 adds **no repeated channel announcement**.

## Next release gates
- Real user sign-in via `@Iranfashion_bot`, test task create/edit/close/reopen and verify user-owned persistence.
- Consider integrating task completion metrics into the progress report and daily reminders, only after testing user preferences and opt-in notification setup.
- Decide final commercial plan limits; currently provisional simulated packages, not paid entitlements.
- Configure two real admin IDs and private receipt storage separately when available; AI model still off by default.
- Do not promote any test Worker/D1 data into production without backup, security review and explicit approval.
