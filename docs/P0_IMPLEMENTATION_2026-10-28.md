# P0 implementation notes (2026-10-28)

Implemented on isolated feature branch only:
- Verify `X-Telegram-Bot-Api-Secret-Token` with constant-time comparison; fail closed when unconfigured.
- Ensure grammY bot info initialization before serverless update handling.
- Remove dead HTTP adapter simulation.
- Return 500 when processing fails, to allow Telegram retry.
- Add the `candidateProfile` field to Appwrite bootstrap schema.
- Add lightweight static regression assertions.

## Required before deployment
1. Configure `TELEGRAM_WEBHOOK_SECRET` in Appwrite Function secrets.
2. Set the **same** secret in Telegram `setWebhook(secret_token=...)`; otherwise all inbound updates will be rejected.
3. Confirm live Appwrite schema has `candidateProfile` (schema definition in git does **not** migrate production data).
4. Run `node tests/p0-safety.test.cjs`, npm install, syntax checks, and webhook integration test in isolated staging.
5. Verify repeated Telegram updates, user onboarding, and authorization; then approve production release.

No Cloudflare production or Appwrite production changes were made.
