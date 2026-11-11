# Main mini-app cutover readiness — 2026-11-11

## User intent
User requests latest changes on the existing main Telegram mini-app, followed by incremental development. This is authorization to prepare a release, not evidence that safety gates passed. Do not change the news Worker.

## Verified live Cloudflare baseline
- Production Worker: candidatory-miniapp-api; current deployment 3d172eb9-eca1-45e5-9070-760970d1f8c1; version 32d33109-8e48-4c9e-a38a-4dd91012967b at 100%.
- Previous production deployment: 16b9096b-ab61-4005-a5c6-98d0e3fec0f8; version 96ca3adc-1207-47b5-ac2c-a91691bd5af1.
- Production bindings: DB -> 48b3c86b-45ea-492b-96e1-334dfafa2097; REVIEW_DB -> 2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0. Preserve both and their separation.
- Integration Worker: candidatory-miniapp-integration; deployment c5c6482d-2daa-4862-a62b-8c4cc2720141; version 7489532d-a4a8-4f4f-8924-e12096e6c548 at 100%; both DB and REVIEW_DB bind only isolated D1 2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0.
- News Worker: candidatory-news-bot; version 1c080a9a-e7b6-420a-81ae-14821608a1aa; must remain untouched.
- Development branch head: e17e62c6332da304fa32887293e8f731fc93bfb0.

## Decision: NO-GO pending evidence
The source branch has new accessibility and release-guard changes not evidenced as deployed to integration. Do not promote a GitHub commit as a Worker build artifact without byte-level artifact parity and source/metadata/binding verification.

## Required before production change
1. Confirm green CI for exact release SHA and all security, API, mobile and deployment guard suites.
2. Build exact artifact and deploy to isolated integration; verify /health, signed Telegram initData including forged/expired negatives, task/report owner isolation and 320/375/430px WebView.
3. Test two consenting real Telegram accounts, admin permission boundaries, private receipts, opt-in and payment/AI-disabled behavior.
4. Capture restorable production Worker artifact/settings and production D1 backup; rehearse restore in isolated staging. No real D1 migration or mixing.
5. Produce release diff and staged rollout/rollback plan; verify news Worker unchanged.
6. Reconfirm the exact release/version with user before production cutover once gates are green.

## Rollback
On production regression, restore 100% traffic to verified prior production version 32d33109-8e48-4c9e-a38a-4dd91012967b using Cloudflare Workers Deployments API. This only rolls back Worker code, NOT database mutations. No database migration is approved. Verify root UI, Telegram auth, task/report API, and news Worker after rollback.

## This checkpoint
Read-only Cloudflare inspection and GitHub documentation only. No deployment, production DB mutation, payment activation, AI activation or notification sent. Re-evaluate against live state before acting.
