# Candidatory — Zero-Cost Operating & Deployment Policy
Date: 2026-10-27. Development branch: feature/telegram-miniapp-supabase.

## No payment activation
This project remains on existing Cloudflare Workers Free + D1 Free. No billing plan, paid subscription, payment gateway, chargeable AI provider or R2 storage was created by this work.
- R2: Cloudflare API returns HTTP 403 code 10042 ("Please enable R2 through the Cloudflare Dashboard"). Use HTTPS document references only. Do not create paid R2.
- Workers AI: the existing Cloudflare Worker already has an AI binding. `studyAssistant` uses the Cloudflare free allocation, with 3 requests/user/day and 40 requests globally/day in D1. Exceeding that limit shows an error instead of calling the model. The account must remain Workers Free to avoid overage charges. AI responses are for neutral educational/admin assistance; they are not regulated legal advice or personalized voter persuasion.
- Plans `basic/team/organization` represent **manual access entitlements only**, not real payments or auto-renewing subscriptions. `service_plans` and `workspace_entitlements` exist in D1; no checkout integration.
- Tasks/events/docs and notes use D1 only. File references are user-provided HTTPS links; content isn't mirrored into private storage.

## Source of truth and release automation
- The source files are `miniapp/web/` and `miniapp/cloudflare/worker.js`.
- Build locally or with GitHub Actions by running `node miniapp/scripts/build-worker.mjs`. This generates `miniapp/cloudflare/site-worker.js`.
- `miniapp/cloudflare/wrangler.json` names the **existing** Worker and binds existing `DB` and `AI`. It has no secret values.
- `.github/workflows/miniapp-check.yml` validates code on the development branch **without deployment**. Its first run succeeded.
- `.github/workflows/miniapp-deploy.yml` is **disabled by default**. No production deployment runs until the repository owner explicitly enables the variable.
- To opt in to automated deployment: in this GitHub repository > Settings > Secrets and variables > Actions, create a repository secret named `CLOUDFLARE_API_TOKEN` with a narrowly scoped token authorizing the existing Worker script and required D1/AI bindings. Under Variables, create `ENABLE_MINIAPP_DEPLOY` with value `true`. Do not provide token values in conversations, issue comments or tracked files.
- Enabling the variable does not immediately deploy: the workflow is triggered only by an eligible new push (or a manual workflow_dispatch if GitHub displays it for the branch). To avoid accidental deployment, don't enable until the admin verifies a current test pass.
- A GitHub Actions deploy may replace the currently live Worker. Run full authenticated end-to-end tests and keep rollback version before enabling.
- The original Telegram bot's code is still on main and has not been merged over. Do not merge the draft PR without checking differences.

## Essential security acceptance tests
- Telegram HMAC verified server-side; account mismatch rejected; expired data rejected.
- Access to workspace A must not grant access to B; member/auditor roles must not see private finance data.
- Invitation accepted only by invited Telegram ID; member cap enforced at invitation acceptance.
- All D1 writes use parameterized SQL; no tokens or sensitive content committed.
- AI capped per user globally; monitor Workers AI free quota separately in Cloudflare dashboard.
- Verify iOS Telegram file exports: JSON, CSV and ICS may depend on the embedded browser.
- Verify platform admins only from `ADMIN_TELEGRAM_IDS` Cloudflare Secret.
- R2: disabled; don't enable if the user wants zero billing verification.

## Remaining / external dependencies
- Actual encrypted file upload+download needs a storage provider and security review; don't label file link registry as private upload storage.
- Paid checkout, SMS, e-mail and external AI APIs require credentials or providers; they are deliberately not configured.
- Operational financial compliance and privacy deletion workflows need further design and testing.
- Live UI auth/admin/report testing must be completed in Telegram; Github code checks alone are not enough.
