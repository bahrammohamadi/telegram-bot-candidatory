# Production parity evidence and release-blocking task test plan — 2026-11-22 11:57 UTC

Scope: existing `candidatory-miniapp-api` ONLY. Read-only Cloudflare verification; no production write or second environment.

## Fresh Cloudflare evidence
- GET existing Worker deployments: active deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, active version `3c35231f-36f0-4bad-b786-9a4309d8e868` (100%), created `2026-11-11T20:05:53Z`.
- Historical deployment `3d172eb9-eca1-45e5-9070-760970d1f8c1`, version `32d33109-8e48-4c9e-a38a-4dd91012967b`. Historical != safe rollback.
- GET script settings: compatibility_date `2026-10-27`; binding inventory: `ADMIN_TELEGRAM_IDS` secret_text, `ADMIN_TELEGRAM_IDS_MAHDI` secret_text, `AI` ai, `AVALAI_API_KEY` secret_text, `DB` d1, `REVIEW_DB` d1, `TELEGRAM_BOT_TOKEN` secret_text. No secret values retrieved.
- GitHub combined commit status for prior `31c2b8aed78a7f3b4dc77622da31e2d014c65e85` returned an empty statuses array. This **does not mean CI passed or failed**; workflow/check runs require separate verification.
- Canonical production URL was not established or smoke-tested during this pass.

## Concrete implementation plan (not yet proof of passing tests)
Implement the 12 cases in `SYNTHETIC_TASK_RBAC_CONTRACT_2026-11-22.md` against **actual source modules**, after identifying their exported authorization and task functions. Mock repositories and fabricate users, workspace IDs and tasks. Each deny case must assert: HTTP status, no sensitive response fields, no repository write, no cross-tenant row/count leakage. Verify task creation idempotency scope includes principal AND workspace. Never treat client role or owner IDs as authority. Telegram initData hash and freshness must be checked server-side before DB access.

For each case record: source module, handler, route, test path, fixture ID, expected and observed result, CI URL, release SHA. An isolated policy *model* test that is not wired to actual production authorization is not sufficient for a release gate.

## Gap matrix
| Requirement | Status | Next proof |
|---|---|---|
| Existing production deployment and settings | سالم | Fresh GET recorded above |
| Secret names and binding types | سالم | Settings GET; no values |
| Full verbatim 18-chapter original | ناقص | Recover user-authored original; do not pass off abridgement |
| Actual task/role code coverage | نیازمند اصلاح | Wire 12 synthetic contract cases to production modules |
| Multipart source parity, routes and D1 schema | ناقص | Compare actual modules, routes, both D1 schemas read-only |
| Verified green CI on release SHA | ناقص | Fetch Actions/check runs for exact head SHA |
| Rollback compatibility and artifact digest | ناقص | Validate immutable bundle + prior-version schema compatibility |
| Release evidence record | جدید | This document; does not authorize release |

**Decision: BLOCK production deployment.** Do not create a Worker, preview, staging, test deployment, or second bot; do not modify D1, news Worker or channel. No live auth tests, paid AI, payments, mass messages or admin-role changes.
