# Candidatory: opt-in preview inside the actual main Telegram bot
Release date: 2026-11-08

## Result
- Main Telegram bot identity was read back **from the live Worker signing token** via authenticated Cloudflare endpoint: `@candidatoryiran_bot`.
- Main Worker: `candidatory-miniapp-api`.
- **New deployment:** `16b9096b-ab61-4005-a5c6-98d0e3fec0f8`.
- **New version ID:** `96ca3adc-1207-47b5-ac2c-a91691bd5af1`.
- Main entry `/`: unchanged original app plus the visible link **🧪 پیش‌نمایش امکانات جدید — برای دریافت نظر**.
- Review entry: `/review`; associated authenticated isolated endpoints `/review/api/*`.
- Original `/app.js` is **byte-for-byte identical** to the baseline legacy Worker. Existing production APIs and static assets still dispatch to the original Worker module.
- Legacy Worker source SHA-256: `79d3c4780bb58637b7c9a9202ca19da1ff50e12608c486378cf187ebe3acd543`, 300672 characters.
- Review is based on a pinned integration Worker snapshot 2026-11-08 (147178 characters); the HTML API calls were rewritten from `/api/*` to `/review/api/*` and a visible preview-only warning added.
- Production D1 `48b3c86b-45ea-492b-96e1-334dfafa2097` remains bound as `DB` to the legacy module only.
- Isolated D1 `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0` is bound as `REVIEW_DB`; review router passes it as `DB` to the new module.
- Original four secret-text bindings and AI binding were preserved; original compatibility date `2026-10-27` unchanged.
- No production data migrated, overwritten or shared into the review D1.
- For review mode, `AI_ENABLED=false` is enforced by the router, and no AI binding is passed to the review module; real billing and receipt upload are unavailable in this preview.
- The preview entry link is visible to users who open the original app, but reads/writes of preview private data require Telegram-signed initData and are isolated by account. Treat the preview as public **test UI**, do not enter sensitive or real personal data.

## Safety tests
- Local GitHub CI: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42461378122 — PASS: byte parity of main JS, synthetic main-bot signed requests, two-user private data isolation, blocked forged credentials, AI forced off, mobile 320/375/430 Chromium end-to-end home → review → profile → tasks.
- Cloudflare live canary deployment: `candidatory-main-review-smoke`, isolated D1 only, dummy bot token. GitHub real Cloudflare HTTP smoke: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42461610959 — PASS.
- Production live HTTP smoke: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42461791696 — PASS: root review link, byte-identical original app JS, actual review page and API, HMAC rejection 401 and bot token public identity `candidatoryiran_bot`.
- Cloudflare deployment/read-back confirmed all six original dependencies plus `REVIEW_DB`, with no lost secrets.
- Real in-Telegram WebView interactions on a person's phone still require human smoke (including launch parameters surviving in-app navigation); synthetic tests cannot certify that.

## Operator instructions
1. Open https://t.me/candidatoryiran_bot and launch its existing Mini App.
2. At the top of the original Mini App, tap **🧪 پیش‌نمایش امکانات جدید — برای دریافت نظر**.
3. If prompted, fill **only test information** in the profile wizard, then continue to the test dashboard.
4. Review profile, calendar, goals, tasks, practice, quizzes, printable reports, subscriptions demo, content studio and free guided assistant.
5. Use **بازگشت به نسخه اصلی** at the top to return to legacy app.
6. Report any broken navigation or unexpected permission/authentication behavior. Do not pay or upload private receipts.

## Recovery / rollback (not executed)
- Previous original deployment: `173dfdec-d73f-44d5-af2a-e6bde5be3ed9`.
- Previous original version: `117dbec8-e994-491b-9020-1d3c8ee862d3`.
- Cloudflare Worker Deployments API can restore 100% traffic to prior version if the preview changes cause an issue:
  `POST /accounts/{accountId}/workers/scripts/candidatory-miniapp-api/deployments`
  body `{"strategy":"percentage","versions":[{"version_id":"117dbec8-e994-491b-9020-1d3c8ee862d3","percentage":100}]}`.
- Previous production exact source is reconstructible from the 31 canonical `cloudflare-live/snapshot-parts` files and hash-checked with `node cloudflare-live/reconstruct.mjs`.
- Rollback does not delete review D1 records. Do not copy them into production.

## Ongoing development
- Future hourly integration releases do not automatically replace this opt-in preview. Refresh the main-bot review bundle only after new CI, isolation checks, and a reviewed release.
- This is **not full production launch** of phases 3–14. The original main app remains the default, while the review path is separately served with isolated data.
