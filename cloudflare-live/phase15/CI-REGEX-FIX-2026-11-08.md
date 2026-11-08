# Phase 15 — SQL regression CI regex correction (2026-11-08)

Scope: **development branch only**. No Worker deployment, D1 migration, production change, payment, AI or notification.

## Observed failure
GitHub Actions run 42448768270 failed at **Owner-scoped task performance SQL regression (six cases)**, while the earlier signed-user integration step passed. In `test_task_performance_sql.py`, the regular expression was `r"(?im)^SELECT\\b"` (two literal backslashes in the raw Python string), which does not match a word boundary after SELECT. The parser consequently raised `RuntimeError: Task performance SQL SELECT statement missing` before executing the six test cases.

## Change
Use `r"(?im)^SELECT\b"` (one backslash in the Python raw string). This matches a line beginning with SELECT followed by a word boundary, and preserves the owner-bound parameterized SQL. No application runtime code or schema changed.

## Verification gates
1. Check the GitHub Actions workflow run for the new commit; require all six regression tests green. Do not equate a successful commit write with successful CI.
2. Independently run `python -m unittest cloudflare-live/phase15/test_task_performance_sql.py -v` from the repository root, or `python cloudflare-live/phase15/test_task_performance_sql.py`.
3. Before any isolated Worker deploy, separately verify HTTP Worker-to-D1 health, signed Telegram initData, owner isolation, and mobile smoke tests. Previous HTTP 503 / DB_UNAVAILABLE remains a release blocker until independently cleared.

## Rollback
If this parser change regresses CI, revert commit `a94bfc32ee66ae931cdf1141538953e6435cd0ef` on the development branch with `git revert a94bfc32ee66ae931cdf1141538953e6435cd0ef` and push; do not force-push. No D1 restore or Worker rollback is needed because no deployment or database write was performed. The prior version itself fails SQL parsing, so reverting is containment only, not a fix.

## Isolation
Worker `candidatory-miniapp-integration` and test D1 `candidatory-integration-test-20261101` are the only permitted deployment targets; production Worker `candidatory-news-bot` and channel `@candidatoryiran` are excluded. Production remains NO-GO pending explicit separate approval.
