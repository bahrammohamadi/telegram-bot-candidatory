# Candidatory Mini App — staging instructions

## What currently works
- Five-tab mobile layout: Dashboard, Profile, Tasks, Assessment status, More.
- Secure Telegram initData signature validation on all API routes.
- User-scoped D1 profile and task storage with no mock results.
- Real assessment data is **not connected** to existing Appwrite records; no false score is shown.

## Deployment prerequisites
1. Use a separate Cloudflare **staging** environment, not the production bot Worker.
2. In `miniapp/`, create a staging D1 database (free-tier eligibility must be verified), paste its database ID into `wrangler.toml` and enable the commented `[[d1_databases]]` binding.
3. Apply `schema.sql` to the staging D1 database.
4. Add `BOT_TOKEN` via `wrangler secret put BOT_TOKEN`. Never commit the token.
5. Execute `npm test`, `npm run dev`, test inside Telegram, then `npm run deploy`.
6. Register HTTPS Mini App URL using BotFather (menu button or Web App).
7. Confirm login, duplicate update handling, profile read/write and task isolation across two Telegram accounts.
8. For legacy data, build a verified backend Appwrite adapter and get approval for migration. **Do not migrate sensitive records automatically.**

## Remaining work
- Import existing educational content, assessment questions, and scores from the legacy bot with authorization.
- Real campaign modules, media library, admin RBAC, migrations, full E2E tests, accessibility/performance audits.
- Existing Appwrite Function webhook secret must match Telegram's registered webhook before P0 bot changes can deploy.
- CI requires GitHub Actions to be enabled; a workflow file does not prove a passing run.
