# Full main Mini App v103 — isolated deployment QA (2026-11-09)

## Verified live state
- Branch before this document: `12df27148d41a5034ff5d1933edc0362ad3dcc77`.
- Isolated Worker `candidatory-miniapp-integration`: current deployment **`c5c6482d-2daa-4862-a62b-8c4cc2720141`**, version `7489532d-a4a8-4f4f-8924-e12096e6c548` (#32), 100%. Initial clone deployment: `7edb0aab-9061-4734-9509-1e74e6e4bd0d`.
- Test D1 `candidatory-integration-test-20261101`: bindings `DB` and `REVIEW_DB`, not production.
- All three deployed integration modules (`entrypoint.mjs`, `legacy.mjs`, `preview.mjs`) were verified byte-for-byte identical to the main Worker's current multipart source. The environment bindings differ.
- Main Worker `candidatory-miniapp-api`: deployment `3d172eb9-eca1-45e5-9070-760970d1f8c1`, active version `32d33109-8e48-4c9e-a38a-4dd91012967b` (#102), unchanged. Candidate #103 `14e9e89a-d81f-4cb3-9e02-bdf7f3d793d1` is staged but NOT deployed.
- News Worker `candidatory-news-bot`: deployment `3be80a6c-437b-44e3-ba38-bd779538f63c`, unchanged.

## CI evidence for SHA 12df2714
- [Isolated Chromium UI smoke](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42604705041) PASS: 320/375/390/430/768px, RTL, responsive viewport, accessible buttons, touch target >=44px, no horizontal overflow, actual onboarding/dashboard/review/steps/modules, and legacy routing.
- [HTTP auth](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42604711957) PASS; [task progress](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42604705070) PASS.
- [Mini App checks](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42604711967) PASS; [source parity](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42604711912) PASS; [staging HTTP](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42604711927) PASS; [target guard](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42604705121) PASS.
- Browser checks are **anonymous**, not genuine signed Telegram WebView or two-account isolation evidence.

## Rollback / safety
Before further staging changes, recheck Cloudflare deployment IDs and D1 bindings and abort on mismatch. To restore previous **integration-only** version #31, POST `/accounts/{account_id}/workers/scripts/candidatory-miniapp-integration/deployments` with `{"strategy":"percentage","versions":[{"version_id":"5e11406e-12a0-49d8-95cb-a7df9120fc51","percentage":100}]}`. Verify test D1 binding and active version afterward. Do not use this endpoint for main production. No D1 migration occurred in this UI clone; a code rollback is not a database restore.

## Outstanding production NO-GO gates
Real signed Telegram WebView with two consenting accounts; least-privilege two-admin authorization with securely supplied IDs; private receipts; trial subscriptions and sandbox payment ledger; opt-in notifications; explicit AI opt-in and budget (AI remains off); D1 backup/restore rehearsal; final security/accessibility review; immutable release diff and explicit user approval for exact production deployment. Never commit secrets, personal receipts, or real initData.

**Decision: isolated anonymous UI QA PASS; production NO-GO.**

## Additional QA and rehearsal on 2026-11-09

- Full main miniapp clone deployed and byte-for-byte module parity with **candidate** main version #103 confirmed (all three modules). Production remained on #102 throughout.
- [Synthetic-state visual QA (CI run 42605295318)](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42605295318): 320, 375, 390, 430 and 768px passed; synthetic profile, review and dashboard states were revealed locally inside the browser **without bypassing API authentication or writing data**. Screenshots in artifact `isolated-miniapp-mobile-rtl` (#13667517221). Anonymous real WebView session is still blocked without signed Telegram initData; synthetic screenshots are **not authenticated E2E**.
- [Production-like anonymous UI route and mobile QA (CI run 42604705041)](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42604705041): CSS, RTL, focus naming, screen overflow, touch height, `/review` redirect and `/legacy` archive all passed.
- **Actual Cloudflare rollback rehearsal (test only) PASSED**: from test clone #32 to previous test version #31 via deployment `bc850c0c-56ee-4076-82b2-84025d2ad293`, then restored #32 via deployment `c5c6482d-2daa-4862-a62b-8c4cc2720141`. Cloudflare readback verified #32 at 100%. This validates **code deployment rollback only**, not D1 backup/restore.
- Post-restore test DB bindings were read back: both `DB` and `REVIEW_DB` point to **isolated D1** `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`; one secret binding remains configured without exposing its value. Main Worker remains deployment `3d172eb9-eca1-45e5-9070-760970d1f8c1` / version #102.
- Post-restore GitHub Actions smoke jobs were rerun to re-verify the restored version. See the most recent run attempts for [mobile visual run 42605792246](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42605792246) and [HTTP auth run 42605792249](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42605792249); both **completed successfully on attempt #2** after the rollback rehearsal, verified through GitHub Actions. This verifies the restored test environment, not production.

**Remaining deployment prohibition:** no production UI deployment until the separately required security/backup/two-real-Telegram-account evidence is verified for the exact release. UI styling permission is acknowledged but does not waive those gates.
