# Phase 6 — quiz learning module / isolated release — 2026-11-02

## Scope and release
- Only `candidatory-miniapp-integration` Worker was changed.
- Verified release deployment: `43c97f92-5f72-4466-bb50-89267218ab0b`.
- Isolated D1: `candidatory-integration-test-20261101` UUID `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`.
- Existing secret named `TELEGRAM_BOT_TOKEN` preserved as secret; never exported or logged.
- Exact deployed Worker JS snapshot: `phase6/integration-deployed-snapshot-2026-11-02.mjs` (51,419 characters, full closing module confirmed).
- No production miniapp / channel Worker, Telegram news bot or user data altered.

## Feature and content
- Two new quizzes in isolated D1: `91001` media literacy, `91002` public transparency; five questions each.
- Four-option questions are nonpartisan and educational. Topics include source attribution, misinformation, evaluating data, accountability and privacy.
- Educational references: UNESCO media literacy (https://www.unesco.org/mil4teachers/en/module3/unit3), OECD integrity (https://www.oecd.org/en/publications/oecd-public-integrity-handbook_ac8ed8e8-en/full-report/participation_4dc32420.html) and open government guidance (https://legalinstruments.oecd.org/en/instruments/OECD-LEGAL-0438).
- Existing tables reused: `quizzes`, `quiz_questions`, `quiz_attempts`; only `quiz_guidance_v1` and an attempt index added in isolated DB.
- User enters through dashboard → `تمرین و آمادگی` → `آزمون‌های آموزشی و سنجش دانش`.
- Catalog, start, submit, history, review. Answer keys and rationales are not sent until grading after submission; each attempt is scored by server.
- User history and attempt review query by signed Telegram user ID; max 20 submissions per quiz per 24h; last 50 attempts in history.
- Question banks in `phase6/quiz-bank.mjs` with 10 rationales and official references.
- The content does not provide country-specific legal election instructions. Check current official law before expanding legal questions.

## Validation completed
- Full GitHub Action: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41389778554
- Local SQLite using real worker handler, two synthetic Telegram identities, tamper rejection, server-side grading, answer-key privacy, attempt ownership: PASS.
- Playwright 320, 375, 430 px on built HTML and fetched live HTML: PASS for quiz start, submit, score, history review and navigation. Network API responses are mocked for browser tests.
- Live health test and unsigned/forged `/api/quiz` calls rejected (401): PASS.
- D1 test synthetic attempt create/owner lookup/cross-user exclusion/delete and cleanup: PASS.
- Valid authenticated *real* Telegram-account quiz completion/reopen was not tested through the user's Telegram client.

## Gates / followups
- User should test a non-sensitive quiz attempt within the configured test bot and confirm result after reopening.
- Before promoting to production: reconfirm official source/legal content currency, backup D1, source parity, user-flow end-to-end, private-data boundaries and admin release approval.
- Add course progress aggregation and accessible keyboard focus in future phases; keep quizzes neutral.
