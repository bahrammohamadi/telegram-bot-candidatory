# Phase 7 — integrated progress report / isolated Mini App release
Date: 2026-11-02

## Environment
- Worker: `candidatory-miniapp-integration` (test only).
- Deployment verified in Cloudflare: `a75d6d68-7393-4e4c-bdb1-588e401f292d`.
- Independent D1: `candidatory-integration-test-20261101`, UUID `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`.
- Telegram bot secret preserved as a `secret_text` binding; no secret copied to code or GitHub.
- Deployed full Worker snapshot: `phase7/integration-deployed-snapshot-2026-11-02.mjs`, 62,752 characters. Existing profile, calendar, goals, practice and quiz routes remain.
- **No changes to production miniapp or news bot.**

## Feature
- From the six-card dashboard, choose **گزارش عملکرد**, then **مشاهده گزارش یکپارچه پیشرفت**.
- Signed owner-only API: `POST /api/progress` with `{action:"overview",initData:<Telegram signed initData>}`.
- Read-only aggregates:
  - Profile present flag
  - Goals: total, completed, open overdue (UTC date check)
  - Calendar: total, completed, scheduled
  - Practice: count by kind, summed timer seconds, mean *self-reported* rating
  - Quizzes: attempts, distinct quizzes completed, available quizzes, total correct / total answers, ratio across all attempts
- Charts using native progress bars, 8 summary cards, a selectable Persian-language text report, copy and refresh actions.
- Explicitly disclaims AI-scored or predictive value: these are recorded activity metrics only.
- Browser report generation does not upload report contents to another service.

## Verification
- E2E signed Synthetic Telegram ID / real integrated Worker handler / SQLite regression: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41394240607
- Browser Playwright at 320, 375 and 430 px on built HTML and **fetched live HTML**: all succeeded.
- Live Worker GET /health, rendered report and 401 response to invalid or forged signed identity: succeeded.
- Direct isolated D1 synthetic user test: created and read 1 each from profile, goals, calendar, practice and quiz attempts; other user retrieved zero records for each; all synthetic records deleted and confirmed cleaned.
- Cloudflare live source parity and existing staging HTTP smoke continued to pass.
- Direct sign-in and refresh from an actual Telegram account was not tested by the automated suite.

## Release gate / followups
- Ask user to test from `@Iranfashion_bot`: Open -> saved profile -> dashboard -> گزارش عملکرد -> مشاهده گزارش یکپارچه پیشرفت. Confirm counts and report refresh, and verify following reopen.
- Other dashboard cards (AI assistant and content studio) still lack real functionality in this isolated test app.
- Do not promote to production without backup, privacy assessment, end-to-end user validation and explicit release approval.
- Before adding legally binding election facts, verify official current jurisdiction-specific legal sources.
