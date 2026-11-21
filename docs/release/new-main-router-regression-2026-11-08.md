# New-main cutover reconciliation and isolated regression — 2026-11-08

## Readback
- Branch feature/cloudflare-parity-audit-2026-10-29 was at 6fb0ec072aca569adbd7cef7c09969926cf964e3 when this run began.
- Main production Worker deployment 3d172eb9-eca1-45e5-9070-760970d1f8c1 (version 32d33109-8e48-4c9e-a38a-4dd91012967b) had already been switched to the new dashboard by an explicit user request in an interactive conversation. This automation did not deploy to production.
- Isolated integration Worker deployment f1eb351c-c3ee-4e46-bb58-b8cadb6e769b (2026-11-06) is unchanged.
- Five pre-existing checks were green at branch 6fb0ec0: staging HTTP smoke, source parity, isolated HTTP auth, preview unit/mobile. The old main preview canary run 42472289909 failed HTTP 404 on its first curl. That canary tests an outdated preview-specific hostname and old-root expectations; its failure is not evidence that the new main UI passed or failed.
- Cloudflare settings readback confirmed main Worker still has both D1 bindings, original secret bindings and AI binding. New main router passes only REVIEW_DB and Telegram bot token to new module, and forces AI off.
- Isolated D1 query `SELECT name FROM sqlite_master WHERE type='table' LIMIT 1` succeeded (1 row read), but full authenticated profile/task API health and in-Telegram mobile tests are still pending.

## Actual changes this run
1. Reconciled `cloudflare-live/review/new-main-entrypoint.mjs` to match the 2026-11-08 deployed new-only root router (commit 9f768125).
2. Added deterministic tests for root dashboard, removed preview banner, legacy route denial, redirect, isolated API mapping, AI disabled, and missing database fail-closed (commit 47220c43).
3. Added independent GitHub Actions workflow `candidatory-new-main-router.yml` to run the above tests on each router/test change (commit f478da90).
4. No Worker or D1 writes. No payment, AI, news bot or channel actions.

## Remaining risks and gates
- New-main Worker live source was updated manually through Cloudflare API in the interactive session; canonical GitHub build and deployment scripts still need exact artifact parity verification and non-secret binding audit.
- CI canary workflow `candidatory-main-canary-http.yml` is stale and points to a 404 preview canary hostname. Replace with new-main-specific canary before using as release gate.
- The current UI still uses the isolated test database; real user-data migration and production billing must not be inferred or performed without separate authorization.
- Run signed initData user-isolation and actual Telegram WebView navigation tests.
- Keep previous production version 96ca3adc-1207-47b5-ac2c-a91691bd5af1 as first rollback target; preserve both D1 databases.
- Production rollout, migration, real payments, cost-bearing AI, and mass notifications are outside this automation's authorization.

## Rollback
GitHub changes can be reverted by reverting their commits. Main Worker is not changed by this run. If the interactive production cutover needs emergency rollback, deploy the previously verified Cloudflare version 96ca3adc-1207-47b5-ac2c-a91691bd5af1 to 100% traffic after checking current deployment/version and notifying the operator. Never delete either database.
