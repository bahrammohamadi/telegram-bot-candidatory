# RBAC synthetic contract matrix — 2026-11-20

Scope: existing candidatory-miniapp-api; **offline only**, no new Worker or deployment. This is a test specification, not evidence that handlers pass.

## Required fixtures
- User A: authenticated member, workspace A, owns case A and task A.
- User B: authenticated member, workspace B, owns case B and task B.
- Manager A: scoped manager of workspace A, no authority in workspace B.
- Anonymous: no valid Telegram initData.
- Expired/forged identity: invalid signature or expired auth_date.
- IDs must be random synthetic values, not real Telegram IDs, and no production DB connection.

## Contract assertions (deny by default)
| Operation | Actor | Target | Expected |
|---|---|---|---|
| GET own case | User A | case A | 200 only with valid authentication |
| GET foreign case | User A | case B | 403/404, no sensitive body |
| PATCH foreign case | User A | case B | 403/404, no mutation |
| GET own task | User A | task A | 200 |
| PATCH foreign task | User A | task B | 403/404, no mutation |
| Manager read same workspace | Manager A | case A | allowed only if explicit permission |
| Manager cross-workspace read | Manager A | case B | 403/404 |
| Admin-only action | User A | synthetic admin resource | 403 |
| Any protected endpoint | Anonymous | any | 401/403 |
| Any protected endpoint | Forged/expired | any | 401/403 |
| Subscription privilege | User A | forged client-side plan | no privilege escalation |
| AI tool call | User A | foreign case context | reject, no disclosure |

## Test implementation gate
1. Discover actual handler paths, auth middleware, permissions, and D1 query scoping in current GitHub and full live multipart package.
2. Implement parameterized tests against **actual handler imports** with injected synthetic in-memory data and mocked bindings; do not use real network, real bot token, AI, or D1.
3. Assert negative cases do not invoke DB write or external side-effect mocks.
4. Add exact SHA CI checks and record run URL, coverage and failures.
5. Until actual handlers pass, mark RBAC as **نیازمند اصلاح**, not سالم.

## Release decision
BLOCKED: live multipart parity, complete 18-chapter original, exact-SHA CI, immutable rollback archive, routes, and read-only public URL smoke are unverified. Historical deployment identifiers are not proof of rollback.

## Additional adversarial assertions (2026-11-20)
These are **requirements, not passing tests**. Execute only with imported real handlers, synthetic principals, mocked D1 and network calls; never invoke production endpoints.

| Attack | Synthetic fixture | Required assertion |
|---|---|---|
| IDOR by changing path ID | User A requests case B by UUID | deny before any case B payload is serialized |
| IDOR by changing JSON owner/workspace | User A PATCHes case A with workspace B/owner B | immutable ownership; reject or ignore forged fields |
| Mass assignment of role | User A submits role=admin and permissions array | no privilege change, no privileged downstream call |
| Cross-tenant list enumeration | User A requests list with workspace=B filter | results scoped server-side to A; no B rows |
| Nested task under foreign case | User A creates task with case_id=B | reject; no write mock invoked |
| Expired Telegram initData replay | fixed synthetic auth_date outside tolerance | deny; no DB read of private records |
| Forged Telegram initData hash | single-byte tampering in signed payload | deny regardless of client-provided user id |
| Missing role / unknown role | valid identity with undefined role | deny by default |
| AI prompt requesting foreign context | User A requests summary of case B | tool authorization denies before AI invocation |
| Subscription spoofing | User A sets plan=premium in request | server entitlement authoritative; deny upgrade |

Acceptance evidence: record exact GitHub SHA, CI run URL, handler import paths, number of executed tests, and assertion results. A markdown matrix alone is **not** proof of security. No production release until multipart parity and immutable rollback are independently verified.
