# Tasks API ownership/RBAC contract — synthetic-only v0.1

Date: 2026-11-23. Target: existing candidatory-miniapp-api only. **Specification, not evidence of passing tests.**

## Preconditions
- Resolve actual route names and request/response shapes from the checked-in multi-module Worker before implementing tests; do not invent live endpoints.
- Use pure mocked repository/auth adapters and fabricated identities, workspace IDs, task IDs and records. Never connect to production D1 or call the production authentication endpoint.
- Verify exact branch HEAD and CI at implementation time; no deployment until full release gate is met.

## Required negative/positive contract cases
1. Unauthenticated request to a protected tasks handler is rejected without repository mutation.
2. Authenticated user A can read their own task within authorized workspace W only when role grants read.
3. User B cannot read, update or delete A's task even if the task ID is known; response must not disclose task contents.
4. A member of workspace W1 cannot access a task in W2, including by modifying path/body workspace IDs.
5. A read-only role cannot create/update/delete tasks; admin privileges must be derived server-side, never trusted from client claims.
6. A malformed/empty task identifier is rejected before storage access.
7. Changing task ownership/workspace in request body cannot bypass server-side authorization.
8. Failed authorization produces zero write calls in the mocked repository.
9. Valid authorized update changes only allowlisted fields; immutable owner/workspace IDs remain unchanged.
10. Pagination and filters never include tasks outside authorized scope.

## Acceptance and release gates
- Turn these into executable unit/contract tests after mapping real handler exports and roles; assert exact statuses only after reading actual API contract.
- CI must succeed for the exact proposed release SHA; static/security checks and a reproducible multi-module bundle are mandatory.
- Reconcile current Cloudflare routes, metadata, compatibility date, seven binding name/types, D1 schema, secrets presence (not values), and prior version rollback artifact.
- Only a read-only homepage smoke check is allowed on production before deployment; no live write/auth testing or schema migrations.
- No second Worker, bot, Mini App, staging, preview, test deployment or isolated runtime. News Worker and channel remain untouched.

## Open gaps
- Original verbatim 18-chapter source message not recovered; compressed GitHub document is not the original.
- Actual task handler route/role mapping and D1 schema unverified.
- Canonical homepage URL and operational rollback procedure unverified.
