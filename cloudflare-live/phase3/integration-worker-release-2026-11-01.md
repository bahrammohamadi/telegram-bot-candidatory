# Isolated Integration Worker — 2026-11-01

## Infrastructure established
- Worker: `candidatory-miniapp-integration`
- Deployment: `315e20d2-c374-45d9-8a78-736e7dfbd1ca`
- Cloudflare binding: `DB` → D1 `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`
- Public workers.dev subdomain: **disabled** (previews disabled).
- Telegram bot token: **not configured** (do not reuse production key).
- Production Worker `candidatory-miniapp-api`: unchanged.
- Preview Worker `candidatory-miniapp-staging`: unchanged.

## Initial locked deployment
The deployed Worker exposes only a GET `/health` handler which queries schema presence and returns a sanitized `schemaReady` boolean; all other requests return HTTP 403 `INTEGRATION_LOCKED`. It performs no user mutations and currently cannot be accessed publicly, since subdomain is disabled.

Cloudflare API inspection verified the separate D1 binding and deployment ID. No real Telegram E2E tests were run.

## Next release gate
1. Create a separate test bot using BotFather and save its token as Cloudflare Secret `TELEGRAM_BOT_TOKEN` on the integration Worker. Never paste that value into chat or GitHub.
2. Build and review a deployable **integration-only** candidate incorporating the Phase 3 transaction and functional navigation changes. Preserve the production source snapshot and Phase 2 preview.
3. Do not expose private routes before signed Telegram initData verification is tested. Use exclusively synthetic accounts.
4. Run real Worker-to-D1 profile create/edit/read, rollback, cross-user denial and WebView mobile smoke tests.
5. Only after tests pass, review candidate for eventual Production release; do not silently promote.

This integration Worker is an infrastructure gate, not the complete app deployment.
