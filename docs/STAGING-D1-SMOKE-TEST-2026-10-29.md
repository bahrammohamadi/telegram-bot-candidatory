# Staging D1 smoke-test report — 2026-10-29

## Isolation
- D1 database: `candidatory-miniapp-staging`
- ID: `d698f87c-fd9a-439a-86c9-de78330c6ebf`
- Separate from production D1 `candidatory-miniapp` (confirmed different UUID).
- Tables created: `staging_test_users`, `staging_test_tasks`.
- Synthetic users: 900001 (two tasks, one done), 900002 (one task, none done).
- Cross-owner overlap query returned zero rows.
- **This is not an authenticated tenant-isolation test.** It tests only the sample dataset and query.

## Reachability
- Web open of staging `/` and `/api/catalog`: inaccessible from this tool.
- Container HTTP request: DNS/network resolution error.
- Cloudflare script is deployed, script workers.dev URL enabled, no bindings.
- Browser-based screenshot and accessibility audits remain blocked pending external reachability.

## Important restrictions
The UI preview Worker intentionally has **zero** database and secret bindings, and denies private `/api/*` requests. The staging D1 test database is not yet bound to it. The public staging instance is therefore a UI shell, not a fully working API environment.

## Next gates
1. Verify reachability from a browser/network where workers.dev resolves. Do not misstate Cloudflare API availability as external HTTP success.
2. Set up a separate functional staging Worker connected **only** to staging D1, with migrations and generated non-sensitive seed data.
3. Use a dedicated Telegram test bot, not the production bot secret.
4. Implement auth and cross-account E2E plus mobile responsive/RTL screenshot test suites.
5. Keep live production and staging secrets/databases isolated.

Production Worker and production D1 were not changed by this staging database setup.
