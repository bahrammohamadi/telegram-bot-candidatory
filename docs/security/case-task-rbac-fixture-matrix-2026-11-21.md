# Case/task RBAC executable fixture matrix — 2026-11-21

Scope: existing production-only candidatory-miniapp-api; **offline test specification, not evidence of passed tests**. No staging/preview/test Worker, no live D1 write, no real Telegram identities. Authoritative 18-chapter source text remains unverified; this is a provisional security contract, not a substitute.

## Synthetic fixture
- Accounts A=1001, B=1002; cases CA owned by A, CB owned by B; tasks TA linked to CA, TB linked to CB. All IDs synthetic.
- Roles: anonymous, owner A, non-owner B, admin. Admin privileges must be verified against actual RBAC implementation; do not assume all-admin access.
- Mock DB instruments prepare/bind/first/all/run/batch and captures SQL operations, without connecting to Cloudflare.
- Mock Telegram initData signed using a disposable in-memory test key, never a production bot token.

## Required table-driven tests (run locally or in GitHub CI only)
| Actor | Request | Expected | D1 mutation count |
|---|---|---|---|
| anonymous | GET /case/CA | 401/403 (contract-specific) | 0 |
| A | GET /case/CA | own record only | 0 |
| B | GET /case/CA | 403/404, no existence leak | 0 |
| A | GET /case/CB | 403/404, no existence leak | 0 |
| A | PATCH /tasks/TB | 403/404 | 0 |
| B | PATCH /tasks/TA | 403/404 | 0 |
| A | PATCH /tasks/TA invalid JSON | 400-class | 0 |
| A | POST /tasks missing required fields | 400-class | 0 |
| anonymous | POST /tasks malformed initData | 401/403 | 0 |
| A | unknown POST route | 404/405 | 0 |
| A | GET dashboard with D1 exception | sanitized 500 | 0 |

Replace route placeholders with actual handler paths discovered from code before implementing. For valid owner mutation, assert ownership check occurs **before** write, and verify only the owned row changes in mock DB. Do not test mutations against production.

## CI gate
1. Parse every route from the actual Worker entrypoint and map each case/task route to an authorization test; fail CI if coverage is missing.
2. Assert response body excludes SQL, stack traces, bot token, secret values, and another user's private fields.
3. Confirm CI workflows contain no wrangler deploy, Cloudflare upload, production D1 execute, preview, or paid AI steps.
4. Require a fresh multipart manifest, bindings/compatibility parity and verified restorable snapshot before any production deployment.

## Evidence status
- On 2026-11-21 read-only Cloudflare deployment check: deployment 860f813c-baf4-4cff-bfc7-bb4120b910ed, version 3c35231f-36f0-4bad-b786-9a4309d8e868 at 100%; no production deployment performed in this task.
- CI for this specification is not asserted successful; URL smoke test and rollback restore remain unverified.
