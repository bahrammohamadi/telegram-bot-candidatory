# Phase 15 — SQL regression wired to CI (2026-11-08)

Branch: `feature/cloudflare-parity-audit-2026-10-29`. This change adds execution of the existing six-case `test_task_performance_sql.py` to `.github/workflows/candidatory-task-progress-validation.yml` after the signed-user integration regression. The workflow's `cloudflare-live/phase15/**` path trigger already covers the SQL and test files; this change additionally ensures they run when the workflow executes. This is a SQLite in-memory fixture only; it does not prove live D1 or Telegram identity behavior.

## Verify

1. Inspect the GitHub Actions **Isolated task progress integration** workflow run for this branch/commit. Confirm the `Owner-scoped task performance SQL regression (six cases)` step reports six passing tests; inspect individual job steps, not only the workflow conclusion.
2. Locally: `python3 cloudflare-live/phase15/test_task_performance_sql.py` and `node cloudflare-live/phase15/progress-tasks-e2e.mjs` after building the candidate.
3. Before any isolated deployment, recheck target guard, live Worker-to-D1 health, Telegram signed initData and two-user API isolation. Known HTTP `DB_UNAVAILABLE` blocker remains unresolved until proven otherwise.

## Rollback

Revert the CI workflow commit that added the Python step (or remove only that step with a reviewed commit), then rerun the same workflow. No database schema, Worker version, secrets, production bot, or news channel changed. No deployment was requested in this phase.

## Release gate

Production remains NO-GO until Worker HTTP/D1 health, identity isolation, mobile checks, security, backups, payment safety and explicit user approval are verified. Never infer success from the existence of a CI step alone.
