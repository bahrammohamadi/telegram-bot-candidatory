# Goals release — isolated integration Worker (2026-11-01)

## Deployment
- Worker: `candidatory-miniapp-integration` only; **production and news bot unchanged**
- Live URL: https://candidatory-miniapp-integration.lasvaram-candidatory.workers.dev/
- D1: `candidatory-integration-test-20261101` (`2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`)
- Latest verified deployment: `d5dd9d90-e17d-44ff-add4-ac971b5719d1`
- Worker preserved D1 binding and `TELEGRAM_BOT_TOKEN` as `secret_text`.
- Exact deployed JavaScript snapshot: `phase4/integration-deployed-snapshot-2026-11-01.mjs`; future changes must be reproducibly built from sources, then compared with live before rollout.

## Available features
- Authenticated `POST /api/goals` with actions `list`, `create`, `status`, `delete`.
- User identity solely derived from Telegram WebApp signed initData; HMAC verification preserved.
- Ownership enforced on goal read/update/delete by `telegram_id`.
- Goals panel attached to **گزارش عملکرد** card in test dashboard; progress summary, add, update, delete.
- No user-supplied HTML rendered via innerHTML; content is written with textContent.
- Existing profile and calendar routes preserved.

## Verification
- Live integration smoke: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41292831545 — PASS.
- Isolated goals module with synthetic signed Telegram initData and SQLite D1 schema, including cross-user denial: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41293147270 — PASS.
- Live-page mobile Playwright smoke including create/status/delete UI at 320,375,430 px: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41293147286 — PASS.
- Direct D1 insert/read/status/delete using synthetic user and synthetic goal: PASS; records deleted and absence verified.

## Known limits and release gate
- Real Telegram-account end-to-end save/reload has **not** yet been independently validated; user should verify in Telegram. Synthetic test passing does not replace real client validation.
- Other cards (AI assistant, speech training, content studio) remain placeholders in this standalone integration mini-app.
- No production release without production parity review, approval, backup, migration plan and account-based smoke tests.
