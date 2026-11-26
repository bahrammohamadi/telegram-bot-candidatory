# Task API authorization integration checklist — 2026-11-22 18:53 UTC

Scope: existing `candidatory-miniapp-api` only. This is a **design and review artifact**, not a claim of deployed enforcement or passing tests. No second environment or deployment authorized.

## Handler acceptance criteria (fail closed)
1. Every task read/list/create/update/complete/delete handler resolves identity from **server-validated** Telegram initData (or an already verified server-side session), never client-supplied user IDs, role, or workspace.
2. Missing, expired, malformed, or invalid identity returns unauthorized before any database query or mutation.
3. Derive workspace membership and active role from trusted persisted state; reject unknown/inactive membership, role, or workspace. Do not infer authority from a numeric Telegram ID alone.
4. Scope task lookup and mutation to both task ID and authorized workspace; require task ownership or explicit role-based permission. Cross-workspace IDs must be indistinguishable from missing IDs where feasible.
5. Validate positive safe integer IDs (reject NaN, Infinity, zero, negative, arrays, objects, empty strings, coercion tricks); normalize before comparing.
6. Reject mass assignment of owner, workspace, role, status, or audit fields. For task creation, bind ownership/workspace server-side.
7. Enforce permission before any side effects; use parameterized SQL and atomic conditional updates where applicable.
8. Preserve audit fields and idempotency semantics. No permission bypass through bulk or alternate task endpoints.

## Synthetic CI contract cases
- Anonymous/invalid identity denied; no DB writes.
- Inactive or unknown role denied.
- Owner in workspace A allowed only the documented operation; same ID in workspace B denied.
- Valid task ID but wrong workspace denied, with no information leakage.
- Forged workspace/owner/role in payload ignored or rejected.
- Invalid ID types and coercion edge cases denied.
- Concurrent mutation and stale ownership must not bypass authorization.
- All task API aliases/routes use the same policy; explicit route inventory required.

## Release gate / evidence still needed
- Record exact current branch SHA and CI results **on the candidate SHA**.
- Map each live task route to handler, policy call, SQL query and synthetic test.
- Compare full multipart module manifest, metadata, routes, bindings, D1 schema (read-only), and secret **names only** with the active Worker.
- Read-only homepage smoke test; confirm version/deployment ID and rollback procedure with evidence.
- Do not deploy if any evidence is absent; no production auth/write tests, migrations, paid AI, payments, or notifications.

## Gap matrix
| Scope | State | Evidence |
|---|---|---|
| Offline RBAC policy/tests | سالم (historical) | Prior CI evidence in `CI_VERIFIED_RELEASE_BLOCKERS_2026-11-22_1757Z.md`; recheck on current SHA |
| Handler-level RBAC enforcement | ناقص | Handler-to-policy map absent |
| Trusted identity and workspace scoping | نیازمند اصلاح/تأیید | Must be traced in actual code |
| Synthetic handler-contract cases | جدید (specified, not implemented) | This document |
| Verbatim 18-chapter architecture | ناقص | Source message not yet recovered |
| Production rollback validation | ناقص | No operational rollback evidence |

Rollback of this documentation-only change: revert its Git commit. This artifact changes no runtime behavior.
