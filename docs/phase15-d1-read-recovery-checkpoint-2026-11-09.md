# Phase 15 — isolated D1 read-quota recovery checkpoint (2026-11-09 22:53 UTC)

## Verified evidence (read-only)
- Branch HEAD at inspection: `d85ec79033dd2a6f522d27f1d04eff04ad93b182`.
- Offline health-probe safety GitHub Actions run `42706762999` concluded **success** on that SHA: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42706762999 . This proves the offline tests only, not HTTP readiness.
- Cloudflare integration Worker latest deployment `c5c6482d-2daa-4862-a62b-8c4cc2720141` serves version `7489532d-a4a8-4f4f-8924-e12096e6c548` at **100%** (deployed 2026-11-09 11:04 UTC).
- **One** read-only query against isolated D1 `candidatory-integration-test-20261101` succeeded: `SELECT name FROM sqlite_master WHERE type='table' AND name='candidate_users' LIMIT 1`. Cloudflare reported success, 1 returned row, 18 rows read, 0 rows written. Unlike `SELECT 1`, this establishes that table reads were available at this checkpoint; the earlier error 7500 is **not currently reproduced**.
- No D1 write, Worker deployment, production change, real user identity, payment, or channel post occurred.

## Remaining release gates
- A successful D1 control-plane table read **does not prove Worker /health readiness**. Run the isolated `integration-http-auth-smoke.yml` once, checking health 200, unsigned API 401, forged and malformed initData 401; a failure is a blocker. Its current source uses one health sample to limit D1 reads; do not assume older documentation's three-sample requirement describes the current workflow.
- Valid signed Telegram session and two distinct users' data isolation, mobile UX, accessibility, backup restoration and admin authorization remain unverified by this checkpoint.
- If HTTP 503 recurs, correlate sanitized CF-Ray with Worker traces and D1 quota; do not repeatedly poll a quota-exhausted DB.

## Deployment and rollback
This is **documentation only**; no deployment or database migration. To revert, revert the commit adding this file. The latest observed isolated Worker version is `7489532d-a4a8-4f4f-8924-e12096e6c548`; any future rollback must first verify the intended isolated target and bindings in Cloudflare deployment history. Never touch the news Worker or production without separate approval.
