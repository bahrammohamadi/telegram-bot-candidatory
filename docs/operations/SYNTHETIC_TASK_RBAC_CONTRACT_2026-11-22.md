# Synthetic RBAC and task-isolation contract — 2026-11-22

Status: **specification only; not passing tests; deployment blocked**. Scope: existing `candidatory-miniapp-api` only. This file does not create an environment, change runtime permissions, or authorize production writes.

## Verified baseline (read-only, 2026-11-22)
- GitHub target branch: `feature/cloudflare-parity-audit-2026-10-29`; head observed via PR workflow: `d97d7a3ecca565554e4c19a33e867bf48e6f3372`.
- Workflow `Worker binding parity guard`, run 45009994169: success on that SHA; **other required checks not proven**.
- Cloudflare active deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868` at 100%, created 2026-11-11T20:05:53Z.
- Worker binding names/types: `ADMIN_TELEGRAM_IDS` secret_text; `ADMIN_TELEGRAM_IDS_MAHDI` secret_text; `AI` ai; `AVALAI_API_KEY` secret_text; `DB` d1; `REVIEW_DB` d1; `TELEGRAM_BOT_TOKEN` secret_text. Secret values not retrieved.

## Implement these unit/contract cases using fabricated users, workspaces, and tasks only

| Case | Fixture | Expected invariant |
|---|---|---|
| T01 | user A member workspace X, task X owned by A | read allowed only if policy grants |
| T02 | user A workspace X, task Y belongs to workspace Y | read denied, no task content or existence leaked |
| T03 | user A workspace X, task Y belongs to workspace Y | update/delete denied, no mutation |
| T04 | user B member workspace X, task X owned by A | unauthorized edit denied, irrespective of client-supplied owner |
| T05 | user A membership revoked from X | previously valid session cannot read/write X |
| T06 | user A role viewer in X, client sends admin role | server-side authorization remains viewer |
| T07 | Telegram initData with invalid hash, changed user ID, or expired auth_date | reject before database access |
| T08 | duplicate task-create idempotency key for same principal | at most one task created |
| T09 | same idempotency key reused by another principal/workspace | cannot disclose or overwrite prior request |
| T10 | malformed task ID, invalid state transition, oversized text | validation error, no write |
| T11 | task list pagination/filter on workspace X | no Y task in results/count/cursor |
| T12 | unauthenticated request to private task endpoint | deny, no sensitive data |

Use local pure-function tests and mock repositories. No network calls, live Telegram auth, D1 mutations, Worker deployment, staging, preview, or second environment. Match actual API routes and role semantics only after reading the current source; this is a contract inventory, not a claim that the endpoints exist.

## Release gate / rollback
1. Map each case to actual module, handler, route, role matrix, and test file.
2. Confirm full multipart Worker parity with GitHub; inspect D1 schema read-only and compare both D1 bindings, routes, and metadata.
3. Require green CI **on release SHA**, not only an older SHA; retain immutable artifact digest.
4. Verify previous deployment compatibility with current schema and bindings before treating it as rollback.
5. Only then consider a small direct production-only change and read-only canonical-URL smoke test.
6. Never touch `candidatory-news-bot` or `@candidatoryiran`.

## Architecture traceability
Canonical reference: `CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` is a condensed structural rewrite; the original verbatim 18 chapters are **not yet verified**. Traceability to original chapter clauses remains incomplete.
