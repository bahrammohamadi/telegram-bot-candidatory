# Production D1 index and foreign-key parity — 2026-11-13

Scope: existing `candidatory-miniapp-api`, read-only D1 metadata queries only. No user rows queried, no DDL, no new environments.

| Table | DB | REVIEW_DB | Classification |
|---|---|---|---|
| `candidate_profiles` | No secondary index; FK `telegram_id -> candidate_users.telegram_id`, ON DELETE CASCADE | Identical | سالم (metadata parity) |
| `workspace_tasks` | `idx_tasks_ws` nonunique, PK autoindex; FKs `assignee_id -> candidate_users.telegram_id` NO ACTION and `workspace_id -> workspaces.id` CASCADE | Identical | سالم (metadata parity) |
| `candidate_tasks_v1` | Table absent | `idx_candidate_tasks_owner_due` nonunique, PK autoindex; FK `telegram_id -> candidate_users.telegram_id` CASCADE | نیازمند اصلاح (schema divergence) |

Source: Cloudflare D1 query API, `PRAGMA index_list` and `PRAGMA foreign_key_list` on the two already-bound databases, 2026-11-13. These checks do not verify index columns/order, actual foreign-key enforcement, row ownership, access controls or data parity. `PRAGMA` returning an empty list for a missing table is not evidence of an existing table; absence was independently established in prior column-parity audit.

Current deployment read from Cloudflare: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868` at 100% traffic (created 2026-11-11T20:05:53Z). Seven bindings present; secret names only, values not retrieved.

**Release gate: BLOCKED.** Do not rebind DB/REVIEW_DB, migrate, or deploy. Next: inspect `PRAGMA index_info('idx_candidate_tasks_owner_due')`, compare repository references to `candidate_tasks_v1`, verify current branch SHA/CI, HTTP smoke and rollback before considering any release.
