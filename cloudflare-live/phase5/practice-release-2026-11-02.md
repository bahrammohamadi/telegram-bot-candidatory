# Phase 5 — Civic speaking and Q&A practice release (2026-11-02)

## Deployment boundary
- Only Worker: `candidatory-miniapp-integration`.
- Verified deployed Worker version: `2572b265-be9b-4e23-9359-bd5878ee9c59`.
- Isolated database: `candidatory-integration-test-20261101` (`2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`).
- Cloudflare retains D1 and the `TELEGRAM_BOT_TOKEN` secret binding. Never include secret values in GitHub.
- Full exact deployed source snapshot: `phase5/integration-deployed-snapshot-2026-11-02.mjs`, 36,146 characters.
- Reproducible builder: `phase5/build-practice.mjs`.
- No modifications to production Worker or news bot.

## User feature
- Six-card dashboard: `تمرین و آمادگی` opens practice panel.
- Four neutral, factual prompts: two public-speaking and two Q&A exercises about transparency and public-service explanations.
- Timer starts/stops, max 15 minutes; only elapsed duration is saved, never audio.
- Written response or reflections, self-assessed score 1–5.
- View last 100 attempts, average **self-assessed** rating, and delete own attempts.
- No AI-generated scores, voice recording, persuasion optimization or automatic coaching in this release.
- Do not enter real or sensitive information in the isolated test environment.

## Data and authorization
- Migration `phase5/practice-migration.sql` applied only to isolated D1.
- `practice_sessions_v1` primary key, authenticated Telegram owner, exercise key/kind, response/reflection/score/duration and timestamps.
- Owner-scoped list/delete and server-side validation.
- Signed Telegram WebApp initData is verified by existing bot-token HMAC before the endpoint executes.
- 200 stored records per user limit; last 100 listed.
- Test-only synthetic D1 insert/read/delete completed; fixtures removed, counts verified clean.

## Tests
- GitHub Action `Civic practice module validation`:
  https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41388579230
- Real Worker handler, synthetic signed Telegram initData, SQLite foreign keys, create/list/delete, malformed inputs, forgery and cross-user isolation: PASS.
- Playwright flow on 320/375/430 px against built HTML and **deployed HTML**: PASS. Tests use mocked API responses, not real Telegram credentials.
- Live unauthenticated request to `POST /api/practice`: returns HTTP 401 as required.
- Live `GET /health`: isolated mode and DB configured.
- Real Telegram-account create/reopen/list not independently verified yet. Manual test is needed before wider rollout.

## Next safe steps
1. User verifies the test bot flow from Telegram, creating a synthetic practice record and seeing it after reopening.
2. Develop evidence-based quiz module with published civic-knowledge questions (separate next phase).
3. Add accessibility and usability improvements; retain privacy/security gating.
4. No production promotion without a backup, parity audit and release gate.
