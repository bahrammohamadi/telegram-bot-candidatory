# Full main Mini App v103 — isolated deployment QA (2026-11-09)

## Verified live state
- Branch before this document: `12df27148d41a5034ff5d1933edc0362ad3dcc77`.
- Isolated Worker `candidatory-miniapp-integration`: deployment `7edb0aab-9061-4734-9509-1e74e6e4bd0d`, version `7489532d-a4a8-4f4f-8924-e12096e6c548` (#32), 100%.
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
