# Phase 15 — assembled task SQL parity gate (2026-11-08)

## Baseline verified
- Branch HEAD before work: `6a7da3f238dd91bb320ca26942a22be909bef8fa`.
- Phase15 CI run [42496871531](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42496871531): success. Integration HTTP [42496875489](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42496875489): failure. Staging HTTP [42496875508](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42496875508): failure. Live source parity [42496875479](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42496875479): success.
- Integration deployment ID still `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`. `DB` points to isolated D1 `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`; `candidate_users` and `candidate_tasks_v1` exist. Admin D1 read succeeded, but does **not** prove Worker HTTP health.

## Change
- Added `test_assembled_task_sql_parity.py` to extract the **actual assembled Worker** task-count SQL and compare it with the SQL exercised by `test_live_task_count_edge_cases.py`.
- Requires exactly one owner-scoped task count query, one `?` owner parameter, and verifies a missing binding errors and an unknown owner returns all zeros. Fails CI on SQL drift rather than allowing an outdated copied fixture to pass.
- Wired to `candidatory-task-progress-validation.yml`, after candidate assembly and before quota-light D1 health regression.
- No database access, Worker deployment, secret, payment, AI, notification, or production change.

## Validation and rollback
- CI is the authoritative execution evidence. Do not claim passing until the new workflow run completes.
- Revert the parity test and CI wiring commits to restore the previous gate; no Worker/D1 rollback needed.
- Before isolated deployment: require green phase15 CI, exact source parity, stable integration HTTP health/auth, staging mobile QA and explicit deployment diff review. Production remains **NO-GO**.
