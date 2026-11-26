# Candidate task ownership contract — offline acceptance specification (2026-11-13)

Scope: the existing production Worker `candidatory-miniapp-api` only. This file is a test specification, **not evidence of passing tests or authorization to deploy**.

## Existing D1 facts to preserve
- `REVIEW_DB` contains `candidate_tasks_v1`; `DB` does not, according to the previous read-only schema inspection. Do not switch bindings or migrate data.
- `idx_candidate_tasks_owner_due` has ordered keys `telegram_id`, `status`, `due_date` in `REVIEW_DB`.
- The module name `preview.mjs` does not authorize a preview environment. Preserve the live entrypoint until a verified replacement is ready.

## Synthetic contract cases (offline only)
| ID | Given | When | Expected |
|---|---|---|---|
| TASK-01 | Valid signed Telegram initData for synthetic user A | List tasks | Only user A's tasks are returned |
| TASK-02 | Valid signed initData for synthetic user B | Fetch user A's task by ID | Denied without revealing task contents |
| TASK-03 | Missing or tampered initData | Read or mutate tasks | Rejected before D1 query |
| TASK-04 | User A owns an open task | Mark task complete | Only A's task state changes; repeat request is idempotent |
| TASK-05 | User A submits an invalid status or due date | Create/update | Validation error; no write |
| TASK-06 | Existing tasks include null due dates | List sorted tasks | Stable documented ordering without data loss |
| TASK-07 | Synthetic DB schema lacks `candidate_tasks_v1` | Execute contract checks | Explicit compatibility failure, never silent fallback to a different database |
| TASK-08 | User without administrative role | Attempt privileged task operation | Denied regardless of client-side UI state |

## Release gate
1. Locate actual route handlers and SQL statements for task list, detail, creation and completion in all production modules.
2. Assert owner scoping in SQL and RBAC in handler logic; validate signed Telegram initData on the server.
3. Run unit/static/contract tests with synthetic fixtures in GitHub CI only, without staging, preview, test Worker or live D1 writes.
4. Record exact commit SHA, successful CI run URLs, live module hashes, binding/secret **names and types only**, read-only URL smoke result, and rollback package.
5. If any gate is missing, **do not deploy**. Never change the news Worker or channel.

Classification: **ناقص** until each acceptance case is implemented and verified. No user data, secrets, production schema or deployment was changed by this document.
