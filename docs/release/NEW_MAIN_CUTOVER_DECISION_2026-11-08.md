# Main-bot cutover decision — 2026-11-08

## Product decision
The new Candidatory mini-app is the intended default/main experience for @candidatoryiran_bot. The legacy experience must be preserved as a rollback archive, not used as the long-term default. Do not create a parallel bot or treat the review page as the finished product.

## Verified current state
- Production Worker: candidatory-miniapp-api.
- Current deployment: 16b9096b-ab61-4005-a5c6-98d0e3fec0f8, version 96ca3adc-1207-47b5-ac2c-a91691bd5af1.
- Current root is still legacy UI with opt-in /review; therefore cutover has NOT happened.
- New UI uses REVIEW_DB isolated D1 2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0; legacy DB is separate. Do not point the new UI at the legacy DB without an explicit migration, backup and schema verification.
- Last known legacy rollback version: 117dbec8-e994-491b-9020-1d3c8ee862d3.
- Latest branch CI: task-progress SQL regression, isolated HTTP auth, mobile Playwright, source parity and deployment-target guard all green. These do not prove live Telegram WebView or production-data compatibility.
- Staging D1 had a documented error 7500 daily row-read quota and HTTP DB_UNAVAILABLE; verify actual table reads and signed API response after quota reset.

## Cutover acceptance gates
1. Archive exact current main Worker source, binding names/types, deployment and version IDs; preserve original legacy DB untouched.
2. Restore isolated D1 table-read health, run signed Telegram initData tests in the actual WebView, verify two-account isolation, and test profile/task/calendar API read/write with synthetic accounts.
3. Validate 320/375/430 px mobile UX, RTL, navigation, keyboard and accessibility.
4. Create a production-safe data strategy for existing users: no implicit overwrite, no mixing REVIEW_DB and production DB, no destructive migration.
5. Keep paid AI, real payment, receipt uploads and bulk notifications disabled unless separately approved and tested.
6. Build exact new-main Worker artifact; run source parity, security, integration and mobile CI, then canary smoke.
7. Cut over root to new app only after these checks pass; retain old Worker version for immediate rollback.
8. Verify live Telegram WebView and production health; if any gate fails, restore the prior deployment immediately.

## Rollback
Use Cloudflare Workers Deployments API to route 100% back to version 96ca3adc-1207-47b5-ac2c-a91691bd5af1 (current preview + legacy root), or older 117dbec8-e994-491b-9020-1d3c8ee862d3 only if necessary and verified. Never delete or migrate databases during rollback.

## Status
NO-GO for default production cutover as of this document. User explicitly wants new app as main, but tests, production-data strategy and safe artifact verification remain prerequisites. No production deployment or database mutation was performed by this document.
