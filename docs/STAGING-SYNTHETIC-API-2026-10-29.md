# Staging synthetic API release — 2026-10-29

- Worker: `candidatory-miniapp-staging`
- Deployment: `47d0a4d864de4e72b9e60146caed2d1a`
- Only binding: D1 `DB` → `d698f87c-fd9a-439a-86c9-de78330c6ebf` (independent staging database).
- No secret_text bindings and no Production credentials.
- `GET /api/staging/health`: aggregate synthetic user/task counts, read only.
- `GET /api/staging/dashboard`: synthetic dashboard data, read only.
- Other private endpoints intentionally return `STAGING_PREVIEW_ONLY`.
- Synthetic database currently contains two users and three tasks.

## Verification
Read back Cloudflare Worker and settings, confirmed only isolated D1 binding, route strings present and private API guard present. Worker deployment accepted. Public HTTP GET through external browser tool failed with inaccessible URL; **no real response-level E2E pass claimed**.

## Next
1. Check staging URL on user-enabled browser/network; capture screenshots at 320/375/430px, dark mode, reduced motion, RTL.
2. Add authenticated staging with *separate* test Telegram bot and seed-only D1 schema if functional profile/quiz E2E is required.
3. Add Cloudflare HTTP smoke-test job when external connectivity is demonstrably available.
4. Keep production untouched.
