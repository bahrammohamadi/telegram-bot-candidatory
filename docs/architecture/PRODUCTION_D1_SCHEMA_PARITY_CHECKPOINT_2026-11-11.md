# Read-only production D1 schema parity checkpoint — 2026-11-11 20:56 UTC

## Live source and deployment
- GitHub branch HEAD at start: f6a46b8a22ebca15c580879c26ae466e3e4c92e1.
- Cloudflare Worker: candidatory-miniapp-api, version 3c35231f-36f0-4bad-b786-9a4309d8e868, deployment 860f813c-baf4-4cff-bfc7-bb4120b910ed, 100% traffic.
- Worker multipart modules: entrypoint.mjs, legacy.mjs, preview.mjs. Settings retain DB, REVIEW_DB, TELEGRAM_BOT_TOKEN, AI and admin secrets.
- Prior verified entrypoint routes root to preview module with env.DB mapped to env.REVIEW_DB and AI_ENABLED=false. The production URL is not proof of production data integration.

## Read-only SQLite schema inspection
Queried sqlite_master with `SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name` on both databases; no rows of user tables were read and no writes performed.
- Production DB ID 48b3c86b-45ea-492b-96e1-334dfafa2097: 51 tables including internal _cf_KV.
- REVIEW_DB ID 2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0: 56 tables including internal _cf_KV.
- Five tables absent from production: assistant_usage_v1, candidate_tasks_v1, practice_sessions_v1, public_content_drafts_v1, quiz_guidance_v1.
- No tables exclusive to production.
- For the 51 shared tables, sqlite_master SQL strings matched exactly in this query. This does NOT verify index/trigger parity, foreign key enforcement, row-level data, or compatibility of application code.

## Decision and next implementation
Do not blindly switch the root router to production DB: five feature endpoints may reference absent tables and return errors. Next read-only inventory: index/trigger definitions, preview API route-to-table map, and safe migration scripts for five missing tables. Prepare backup and rollback before additive production D1 migration. Confirm signed Telegram identity and owner isolation before exposing production records. Preserve news Worker.

## Verification limits
This checkpoint was produced from Cloudflare read-only API inspection; it is not a CI pass, browser smoke test, deployment, or restore test. Production Worker was unchanged.