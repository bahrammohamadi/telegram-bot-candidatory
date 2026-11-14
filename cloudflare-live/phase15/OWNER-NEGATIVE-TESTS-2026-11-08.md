# Phase 15 — owner parameter negative tests (2026-11-08)

Scope: development branch only. Added two SQLite regression cases to `test_task_performance_sql.py`: SQL-injection-like owner values and a missing (NULL) owner must return zero counts. These are **synthetic local tests**, not a substitute for signed Telegram initData or live Worker-to-D1 isolation.

## Verification gates
- CI must run the phase15 workflow and pass **eight** tests. A GitHub commit alone is not proof of test success.
- Reproduce locally: `python cloudflare-live/phase15/test_task_performance_sql.py`.
- Prior live HTTP `DB_UNAVAILABLE` / 503 remains a blocker; confirm Worker health, signed initData, cross-user isolation and mobile before any isolated deployment.
- Do not enable production, paid AI, payments or mass notifications.

## Rollback
Revert commit `9e46ed53ea6a732542c12096106714eeadc0757c` with `git revert 9e46ed53ea6a732542c12096106714eeadc0757c` on the development branch. No D1 migration or Worker deployment was performed for these tests, so no data restore or Worker rollback is required. If a later test-only CI run fails, inspect its logs and fix before proceeding.

## Isolation
Only `candidatory-miniapp-integration` and `candidatory-integration-test-20261101` are approved as test targets. Never touch `candidatory-news-bot` or the live channel without separate approval.
