# Candidatory Mini App — Cloudflare Workers + D1

## Current deployment (2026-10-27)
- Cloudflare Worker: `candidatory-miniapp-api`
- D1: `candidatory-miniapp`, binding `DB`
- Telegram bot `TELEGRAM_BOT_TOKEN` is a Cloudflare **secret_text** binding; never store the token in GitHub.
- Hosted at https://candidatory-miniapp-api.lasvaram-candidatory.workers.dev/
- Public UI: Persian RTL dashboard, learning cards, searchable lessons, one-question-at-a-time multiple-choice tests, progress/history, basic Telegram profile.
- Content: 12 **public** summary/key-point lessons from the previous bot; 2 new general-education quizzes (10 questions) about media literacy and public accountability.
- API: Telegram-signed initData HMAC authentication on every POST, 1h freshness check, user-scoped progress/attempts, 60 requests/minute per signed Telegram user; no public D1 endpoint.
- SQL: `schema.sql`, `seed_public_lessons.sql`, `seed_neutral_quizzes.sql` are the reproducible source of schema/content (seeds idempotent).
- Existing Appwrite bot on `main` has not been modified. This change is an unmerged draft PR.

## Verification
- Cloudflare deployment API acknowledged the active Worker upload.
- Independently queried D1: 12 published lessons, 2 quizzes, 10 questions.
- Confirmed Cloudflare secret binding type `secret_text` and D1 binding after upload.
- External public-network smoke test is **unverified** from the tool environment. Test inside Telegram with a real bot session and verify lesson completion/quiz score.
- No simulated user results were inserted.

## Remaining work
- Full end-to-end tests from real Telegram clients (mobile and web).
- Generic teacher/editor dashboard and moderation workflow (not yet implemented).
- Advanced legacy bot functions (campaign analysis, SWOT, AI content creation, plan restrictions and purchases) have **not been migrated**.
- Legacy candidate self-assessment is not an objective scored quiz. It needs a separate, privacy-reviewed flow; do not auto-import national ID or phone information.
- Improve abuse controls before broader launch: unauthenticated rate limits, retention/cleanup of request_limits, observability, accessibility tests.
- Confirm usage stays within Cloudflare Free quotas; AI provider charges would be separate.

## Deploy
The static assets (`miniapp/web/`) are bundled with API source (`miniapp/cloudflare/worker.js`) into `site-worker.js`.
Deploy as a module Worker with the D1 binding and **preserve** the Cloudflare Secret named `TELEGRAM_BOT_TOKEN`.
Use the existing workers.dev route; never rotate/remove a production secret as part of a source update.

## Enhanced learning release (2026-10-27)
- Deployed Cloudflare Worker deployment `c2eb3d4f70674eee93b81b61982e0435`.
- Added user-scoped lesson bookmarks, private notes (max 2000 characters), daily learning goal 1–5, and four progress badges computed from completed lessons.
- Schema migration: `migration_user_features.sql`; verified four tables including lesson_progress and the two new user resources.
- Verified D1 and `TELEGRAM_BOT_TOKEN` secret_text bindings after deploy. Existing public content remains 12 lessons and 2 quizzes with 10 questions.
- Internet smoke-test endpoint was inaccessible from execution environment; do not claim actual authenticated user E2E success until tested from Telegram.
- This is NOT the entire legacy chatbot functionality; SWOT, AI, payments, privileged editor/admin workflows require independent designs and tests.
