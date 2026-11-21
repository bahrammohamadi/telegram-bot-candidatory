# Phase 15 — task status parity, isolated integration only (2026-11-08)

## Baseline and evidence
- Development branch before change: `b42a0d4b8874986532bcb2f7af41892799d98c22`.
- Previous isolated phase15 CI: [42492394435](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42492394435) success. Integration HTTP [42492399886](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42492399886) failure, staging HTTP [42492399885](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42492399885) failure. Source parity [42492399889](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42492399889) success.
- Cloudflare integration Worker deployment remains `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`; its `DB` binding points only to isolated D1 `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`.
- Read-only D1 `PRAGMA table_info(candidate_tasks_v1)` confirms owner `telegram_id`, `status`, `due_date` columns exist. No task records, identities, or private data exported.

## Corrected discrepancy
- The standalone owner-scoped report SQL already counted both `done` and `completed` as finished; the assembled phase15 Worker counted only `done`. Thus `completed` tasks were incorrectly counted overdue.
- Builder now recognizes both completed statuses in the task summary; existing `doing` count and owner-bound `WHERE telegram_id=?` remain unchanged.
- Edge-case SQL regression adds a `completed` task with an old due date, verifies completed increases and overdue does not. Existing null-status, timestamp, and cross-owner checks remain.

## Deployment and rollback
- This is GitHub-only source and test change; no Worker deployment, D1 write, production change, payment, AI or notification.
- Require phase15 CI success plus stable isolated HTTP health, auth, and mobile gates before isolated deployment. Current HTTP/staging blockers are **NO-GO**.
- To revert this change, revert commits `84a20eaf7cafc0c1ad0f8633e760796103c2de98` and `a267f311d5132db0fc34fdb3f3e40068e8630df5` on the development branch. No Cloudflare rollback required because nothing was deployed.
- After safe integration deployment, retain previous Worker source/version and bindings, verify read-back and synthetic signed two-owner task summary, and restore previous isolated script on failure. Production requires separate explicit approval.
