# Phase 3 isolated WebApp API and form deployment — 2026-11-01

- Worker: `candidatory-miniapp-integration`
- Isolated D1: `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`
- Latest deployment: `6b8945f5-1a74-43fc-adcb-3c9304cf2daf`
- URL: `https://candidatory-miniapp-integration.lasvaram-candidatory.workers.dev/`
- Test bot Secret: bound as `TELEGRAM_BOT_TOKEN`; value never read or committed.
- Public URL is enabled. No production D1 or token is connected.
- Source: `cloudflare-live/phase3/integration-auth-worker.mjs`
- Mobile RTL WebApp test form for council/parliament/other profile fields.
- Server requires HMAC-SHA256 Telegram WebApp initData with max age 3600 seconds, rejects anonymous and forged requests, derives telegram ID from verified signed data, and uses D1 batch to atomically save profile records and details.
- GitHub Actions live run `41288744683` passed: schema/secret health check, anonymous+forged 401 denial, unknown route 404, HTML/WebApp SDK serving.
- Real Telegram-signed login, actual save/read from test bot, two-user isolation through Worker, and accessibility/device tests **still require confirmation**.

To test in Telegram, set the test bot's Menu Button Web App URL in BotFather to the isolated URL above. Do not use the production bot or its credentials. Open that bot's Web App in Telegram, fill synthetic fields, Save and Reload, then report success or the specific error. Do not enter real personal data into the test service.
