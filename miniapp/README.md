# Candidatory Telegram Mini App — Supabase edition
This is a new isolated **prototype**, not a deployed replacement for the existing bot. The existing Telegram webhook and Appwrite data are untouched.

## Architecture
- `web/`: static RTL/mobile-first Telegram Mini App; no Supabase keys in browser.
- `supabase/schema.sql`: PostgreSQL tables for candidates, lessons, quizzes, questions, attempts. All public tables have RLS enabled; no anon/authenticated access.
- `supabase/functions/miniapp-api/index.ts`: single API validating signed Telegram `initData` on **every** request, using service role only on the server.
- Existing `src/` bot is not modified in this branch.

## Setup (not yet executed)
1. Create a dedicated Supabase project. Do **not** reuse Hirka or Tarazoo.
2. Apply `supabase/schema.sql` once; inspect tables and verify RLS.
3. Set Edge Function secrets `TELEGRAM_BOT_TOKEN` (rotate if ever shared) and `MINIAPP_ORIGIN` (the exact web app HTTPS origin); Supabase supplies `SUPABASE_URL` and the service-role key in supported environments.
4. Deploy function `miniapp-api` with JWT gateway verification **disabled**, because Telegram initData is authenticated by the function itself. Never disable its own HMAC signature verification.
5. Host `web/` on a public HTTPS URL (e.g. Cloudflare Pages). In `web/index.html`, insert `<meta name="miniapp-api" content="https://YOUR_PROJECT.supabase.co/functions/v1/miniapp-api">` in head.
6. Add approved lessons and quizzes in Supabase. New lessons default to unpublished.
7. Register the HTTPS Mini App URL in BotFather for your Telegram bot using the **new rotated bot token**, after testing. Keep current bot running until manual cutover.
8. Run integration tests from inside Telegram: auth reject tampered/expired initData; lessons visibility; quiz correctness; user isolation; retry failures; Persian/RTL; mobile; no personal data in logs.

## Limits and follow-ups
- This MVP has lessons, quizzes, attempts, and a dashboard; existing SWOT, campaign, AI, admin flows are not migrated yet.
- Do not publish while there is no durable rate limiting, admin CMS, or data protection review.
- Sensitive candidate details (national IDs, phone numbers) are intentionally NOT copied.
- Production needs a rate limiter, monitoring, backups, and operational retention policies.
- Telegram initData is trusted only after server-side signature and age checks. `initDataUnsafe` is never trusted.
