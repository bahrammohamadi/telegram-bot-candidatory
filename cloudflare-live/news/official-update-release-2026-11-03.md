# Candidatory — verified official Telegram development announcement
Date: 2026-11-03 (UTC)

## Outcome
- Channel: https://t.me/candidatoryiran
- Telegram message ID: **3997**
- Public link: https://t.me/candidatoryiran/3997
- Independent Cloudflare D1 outbox record: `candidatory-development-2026-11-03`.
- Verified state: `published`, `attempts=1`, `message_id=3997`, `last_error=NULL`, `sent_at=2026-11-03 06:00:52 UTC`.
- This is a neutral progress notice for the development/test environment, **not** a public launch or payment announcement.

## Existing bot reused
- Cloudflare production news Worker `candidatory-news-bot`.
- Existing secret `TELEGRAM_BOT_TOKEN` used by Worker, not copied, logged, or shared.
- Existing NEWS_DB UUID `5f5e3a65-ed02-4c5a-bbf3-472eac9edd7f`.
- Worker deployment ID `3925b0e8-a88a-4235-bdbe-26cc744169b2`.
- Cron schedule remains `*/5 * * * *` (every five minutes); existing RSS, daily content, special content and Bale bindings preserved.
- The separate Composio connection to `@Hirka_Bot` was **not** used.
- No modification of the main Mini App; only the existing official *news* Worker got the one-shot outbox addition.

## Change and safeguards
- Pre-change complete code snapshot: `cloudflare-live/news/manual-publish-prechange-2026-11-03.mjs` (40,744 characters).
- New handler: `cloudflare-live/news/manual-outbox-handler.mjs`.
- Build and safety regression: `cloudflare-live/news/build-manual-outbox.mjs` and `manual-outbox-e2e.mjs`.
- Database schema: `cloudflare-live/news/manual-outbox-schema.sql`; added separate `manual_publish_outbox` and index, leaving existing news tables intact.
- Notice text: `cloudflare-live/news/official-update-2026-11-03.txt`.
- Source update appends exactly one `runManualPublishOutbox(env)` callback to existing `Promise.allSettled` scheduled tasks.
- Atomic `UPDATE ... WHERE status='queued' AND attempts=0` before Telegram send makes concurrent cron executions claim once.
- Ambiguous / failed sends are not automatically retried, preventing duplicate posts; operator should inspect records manually.
- No public unauthenticated manual publish HTTP endpoint was added.
- All existing Cloudflare binding names and types verified after deploy; 3 secret bindings preserved.

## Verification
- Pre-deploy safety CI passed:
  https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/41586879584
- Live deployment checked with Cloudflare Worker settings.
- D1 outbox sent state and Telegram message ID recorded as proof of delivery.
- Public notice is informational about test progress; AI inference, secure receipts, and real payments are not represented as launched.
- No additional automatic re-sending is scheduled for this notice.
