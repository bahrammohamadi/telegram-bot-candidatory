# Offline RBAC test vectors and production release gate

Status: acceptance specification only; not evidence of passing tests. Target: existing `candidatory-miniapp-api` ONLY. No second environment, preview deployment, D1 mutation or real Telegram authentication.

## Synthetic fixtures

- Principal A: verified synthetic Telegram ID `10001`, candidate case `case-A`, task `task-A` owned by `case-A`.
- Principal B: verified synthetic Telegram ID `10002`, candidate case `case-B`, task `task-B` owned by `case-B`.
- Anonymous principal: no verified identity.
- Use in-memory fixtures and stubbed D1 reads only. No production credentials or database connectivity.

## Contract tests to implement against real handler imports

| ID | Operation | Principal | Expected |
|---|---|---|---|
| AUTH-01 | GET case-A | A | 200, only A fields |
| AUTH-02 | GET case-B | A | 403/404, no B data |
| AUTH-03 | PATCH task-B with forged `owner_id=case-A` | A | denied, no mutation |
| AUTH-04 | PATCH task-A with forged `candidate_id=case-B` | B | denied, no mutation |
| AUTH-05 | GET case-A | anonymous | 401/403, no data |
| AUTH-06 | GET case-A with malformed/expired synthetic initData | anonymous | denied |
| AUTH-07 | PATCH task-A with unsupported state transition | A | 400/409, no mutation |
| AUTH-08 | Replay same mutation request | A | idempotent or rejected, no duplicate effect |
| AUTH-09 | GET case-B with case ID in query/body override | A | denied |
| AUTH-10 | Inspect response/logs for AUTH-02/03 | A | no secrets, tokens, private case fields |

Expected codes must be aligned to the actual documented API before tests are considered passing. Never accept a successful response solely because the UI hides controls. Enforce ownership server-side using verified principal and persisted relation; deny by default. Never trust user ID or ownership fields in client payload.

## Mandatory evidence before production release

- [ ] Map every test vector to the real route, handler, authorization function and test file at a pinned GitHub SHA.
- [ ] GitHub CI run URL, conclusion=success, and static/unit/contract security results for the same SHA.
- [ ] Compare complete multipart production code/module inventory and hashes, compatibility metadata, routes, D1 binding names and IDs, secret names/types (never values).
- [ ] Capture immutable previous bundle and verify rollback procedure without production writes.
- [ ] Read-only main URL smoke check; do not call auth, AI, Telegram, or write endpoints.
- [ ] Deploy only to existing production Worker when every gate is satisfied; record deployment/version/timestamp and read-only smoke evidence.

Current assessment: tests not implemented by this document; CI not asserted; release BLOCKED. Canonical architecture's complete 18-chapter original must be recovered verbatim and versioned separately; summaries are not authoritative replacements.
