# Candidate-owned profile and tasks — offline authorization contract v0.1
Date: 2026-11-16. Scope: existing candidatory-miniapp-api only. **Design/test specification, not proof of implementation or deployment approval.**
Reference: user architecture v1.0 (1405-08-21), 18 chapters; original verbatim text still awaiting retrieval. This document does not invent endpoint names or database columns.

## Decision rules (deny by default)
- Every protected request must have server-verified Telegram signed initData, with bounded age, canonical parsing, constant-time signature comparison, and rejection of missing, duplicated, malformed or expired fields. Never trust client-provided role or user ID.
- Determine actor ID and role from trusted server-side identity mapping, not from request JSON/query parameters. A valid signature does not by itself grant administrator privileges.
- For profile/task read and mutation, derive resource ownership from the authoritative D1 record. Enforce `resource.owner_id == actor.id` for candidates, before returning data or changing state. A guessed ID, another candidate's ID, or a stale client-side role must never bypass this.
- Roles: candidate (own resources), administrator (only explicitly granted administrative operations), anonymous (public information only). No inferred broad admin bypass; map actual existing roles and capabilities before implementation.
- Unauthorized access must not leak existence, owner, title, contents, status, or timing of other users' resources. Use a consistent response policy after examining existing API compatibility.
- Mutations require explicit allowed state transition, validated payload, and idempotency/concurrency safeguards. No cross-user reassignment through user-controlled fields.
- All SQL operations use parameter binding; never concatenate actor/resource identifiers into SQL. Logging must omit signed initData, tokens, PII, and secret values.

## Synthetic-only negative contract cases
| Case | Synthetic actor | Resource | Expected |
|---|---|---|---|
| 01 | anonymous | candidate profile | deny |
| 02 | candidate A, valid signed identity | own profile | allow only documented fields |
| 03 | candidate A | candidate B profile | deny without disclosure |
| 04 | candidate A | own task | allow only permitted action/state |
| 05 | candidate A | candidate B task | deny read/write |
| 06 | candidate A, role=admin supplied in JSON | candidate B task | deny |
| 07 | candidate A, expired or malformed initData | own task | deny |
| 08 | candidate A, duplicated signed fields | own task | deny |
| 09 | candidate A | task with forged owner_id in payload | deny reassignment |
| 10 | administrator without explicit task capability | candidate B task | deny |
| 11 | candidate A | invalid task status transition | deny; no D1 mutation |
| 12 | candidate A | duplicate mutation request | deterministic idempotent result |

## Implementation gates
1. Read actual Worker multipart modules and route dispatch; inventory real endpoints and existing authorization logic. No speculative production routes.
2. Read D1 schema metadata only; identify authoritative owner keys and role grants. **No migration, write query, or auth smoke against Production.**
3. Implement these cases as isolated in-process/unit/contract tests with fake D1 and synthetic principals; do not create a Worker, preview deployment, staging service or second environment.
4. Run CI on the exact proposed commit; record source parity, complete multipart manifest, metadata/binding compatibility, secrets by name only, verified public URL read-only smoke, and a recoverable rollback artifact.
5. If any gate is missing, block production deployment. Keep candidatory-news-bot and @candidatoryiran unchanged.

## Status matrix
| Area | Status | Next evidence |
|---|---|---|
| Authorization deny-by-default contract | جدید | This versioned specification |
| Existing API route/ownership mapping | ناقص | Source-derived route list |
| Actual RBAC enforcement | نیازمند اصلاح | Offline negative tests against existing handlers |
| Current Worker deployment inventory | سالم | Cloudflare read-only metadata |
| Verbatim 18-chapter source archive | ناقص | Recover exact user message and checksum |
| Rollback readiness | ناقص | Exact artifact plus validated restoration process |
