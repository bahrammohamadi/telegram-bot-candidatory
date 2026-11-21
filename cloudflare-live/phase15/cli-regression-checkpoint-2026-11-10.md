# Phase 15 — D1 budget CLI regression checkpoint (2026-11-10)

Scope: isolated `candidatory-miniapp-integration` only. No production deployment, schema change, real user data, or D1 query is part of this change.

## Change
`tests/test_d1_budget_cli.py` checks the subprocess contract of `cloudflare-live/phase15/check_d1_read_budget.py`: successful bounded read, malformed JSON, Cloudflare quota error 7500, and empty input. Negative cases must fail closed and must not echo private response text.

## Verify
```sh
python3 -m unittest discover -s tests -p 'test_d1_budget_cli.py' -v
python3 -m unittest discover -s tests -p 'test_d1_read_budget.py' -v
```
The tests run offline and do not spend D1 quota. CI status must be verified separately; a committed test is not proof of a passing run.

## Rollback
If the new CLI tests prove faulty, revert **only** the test commit (recorded in Git history) on `feature/cloudflare-parity-audit-2026-10-29` using `git revert <test-commit-sha>`; rerun the two commands above. No Cloudflare rollback is needed because no Worker or D1 change was deployed.

## Production release gate
Keep production blocked pending signed Telegram initData tests with two distinct real test accounts, cross-user isolation, HTTP/mobile QA, backups, privacy/security review, and explicit per-action user approval. Do not touch `candidatory-news-bot` or send channel announcements.
