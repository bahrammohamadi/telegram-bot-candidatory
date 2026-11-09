# Candidatory UI refresh — Cloudflare staged version and test deployment (2026-11-09)

## Status
- **Main Worker `candidatory-miniapp-api`: candidate version 103 UPLOADED, NOT deployed.** Version ID: `14e9e89a-d81f-4cb3-9e02-bdf7f3d793d1`.
- **Main live deployment unchanged**: `3d172eb9-eca1-45e5-9070-760970d1f8c1`, 100% on prior version `32d33109-8e48-4c9e-a38a-4dd91012967b` (#102). That prior version is the rollback target.
- **Integration Worker `candidatory-miniapp-integration`: visual patch DEPLOYED to test only**. Deployment ID `578480c4-2c69-41bd-97ac-ab77a7aba185`; 100% on version `5e11406e-12a0-49d8-95cb-a7df9120fc51` (#31). Previous test deployment `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` on version `fc7588b9-979c-4d51-a7a2-8e99effe0fd4`.
- No D1 migrations, real customer data changes, Telegram bot API calls, bulk notifications, AI activity, or production deployment occurred.

## Verified change scope
- Read the real main Worker's three multipart modules (`entrypoint.mjs`, `legacy.mjs`, `preview.mjs`).
- Existing `entrypoint.mjs` directs / to preview and uses REVIEW_DB with AI_DISABLED. Only the serialized HTML string `TEST_PAGE` in `preview.mjs` was updated with `mobile-ui-refresh.css`. The other two modules remained unchanged.
- Main candidate vs live versions: 7 binding **names/types** and script runtime configuration are identical: auth/admin secrets, D1, AI, compatibility date 2026-10-27. Actual secret values were neither exported nor committed. The version was uploaded with `keep_bindings` for secret_text, d1, ai.
- Integration candidate retains the existing D1/test Telegram token bindings and current compatibility date.
- Earlier tests on branch `a64b74d60954b138c5c0b19aefed8fa0dcafe9b9` succeeded: Mini App checks (42592268389), task integration (42592262447), HTTP auth (42592268256), source parity (42592268333), staging HTTP smoke (42592268328). These do **not** constitute an E2E mobile browser test of deployed version 103.

## Remaining gates for main deployment
1. Real Telegram WebView smoke test of the exact candidate with at least two authorized test accounts, including signed session isolation and mobile layout on iOS/Android.
2. **Completed for the deployed test Worker (anonymous mode)**: GitHub Actions [42593378806](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42593378806) loaded the actual isolated Worker with Chromium and passed HTTP 200, RTL, injected CSS marker, no horizontal overflow, and minimum touch target checks at 320px, 375px, and 430px. Anonymous screenshot artifact `isolated-miniapp-mobile-rtl` (artifact ID `13662597763`). This does not validate authenticated Telegram WebView behavior; direct requests from the assistant's connector remain restricted by outbound policy.
3. Final review of release checklist and rollback. The explicit approval to change the *visual design* was provided, but security/testing prerequisites are not waived.
4. Deploy exactly main version `14e9e89a-d81f-4cb3-9e02-bdf7f3d793d1` after gates, and immediately verify version percentage, static HTML/CSS presence, signed-user APIs and cross-account isolation. No production D1 change.

## Rollback commands (Cloudflare deployments API)
If test UI has a problem, POST `/accounts/{account_id}/workers/scripts/candidatory-miniapp-integration/deployments` with `{"strategy":"percentage","versions":[{"version_id":"fc7588b9-979c-4d51-a7a2-8e99effe0fd4","percentage":100}]}`. Do not guess a version ID.
For any future main deployment, restore version `32d33109-8e48-4c9e-a38a-4dd91012967b` to 100% using the corresponding main Worker deployment endpoint. Confirm that deployed version and handlers/bindings match the previous snapshot.
Do not change `candidatory-news-bot` or the channel.

## Latest source branch validation

At branch SHA `47c7cb491f4dfed58ef5df8d1c845a7ffc990245`, [Mini App checks](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42593386908), [HTTP auth](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42593386959), [Cloudflare parity](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42593386813), and [Staging HTTP](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42593386816) all passed. Nevertheless, the full 15-item production release evidence gate remains NO-GO: private receipts, admin permission review, payment sandbox, AI consent, backup-restore exercise, and two real-account Telegram WebView evidence have not all been supplied. Do not mark them complete or deploy production.
