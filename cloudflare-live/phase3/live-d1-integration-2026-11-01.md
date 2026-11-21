# Isolated live D1 integration baseline — 2026-11-01

## Environment
- Dedicated database: `candidatory-integration-test-20261101`
- D1 ID: `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`
- Created independently of the public preview Staging D1 (`d698f87c-fd9a-439a-86c9-de78330c6ebf`) and Production D1 (`48b3c86b-45ea-492b-96e1-334dfafa2097`).
- This database is not yet bound to a Worker and has no Telegram signing secret.

## Verified execution
1. Imported only `cloudflare-live/integration-schema.sql`, with no user rows. Schema inventory: 51 tables including Cloudflare internal metadata; 34 explicit indexes.
2. Inserted two synthetic accounts (IDs 9000000011 and 9000000022), each with a profile and distinct JSON details.
3. Queried and verified per-ID profile and details values.
4. Executed a multi-statement D1 request that first updated a synthetic profile and then inserted an invalid checklist status (`not-valid`). D1 rejected it with `SQLITE_CONSTRAINT_CHECK`.
5. Read both synthetic profiles and the invalid checklist item afterward; confirmed the first update was rolled back and no invalid checklist item was stored.
6. Deleted all synthetic records and checked `candidate_users`, `candidate_profiles`, and `candidate_profile_details`: each has zero rows.

## Scope limitations and release gate
- This was a real D1 schema/write/transaction smoke test, **not** an authenticated Worker API or Telegram WebView test.
- The six-card integration candidate is still undeployed. Keep the deployed public preview untouched until an isolated integration Worker, non-production signing key, and authenticated end-to-end validation are available.
- Never reuse or reveal the production Telegram bot token; never attach the Production D1 to integration code.
- The schema snapshot is a baseline, not a migration approved for Production.
- CI browser tests at commit `fde9e3c` passed; commit `6e877db` adds an anonymous-home guard and requires a separate CI result.
