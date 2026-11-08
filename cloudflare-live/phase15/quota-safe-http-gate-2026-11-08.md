# Phase 15 — quota-safe HTTP gate and release boundary (2026-11-08)

## Verified before this change
- Branch HEAD before work: `44d439c86c48d1bf91b08fc1617cfb513354b990`.
- Phase15 signed-user, task progress and SQL CI: **success**, run [42482638097](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42482638097).
- Integration HTTP auth smoke: **failure**, run [42482642350](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42482642350): shell 200, D1-backed health 200 then 503 then 503; 14 invalid-auth probes rejected (zero unexpected/unverified responses). This is an **availability failure**, not evidence of authentication bypass.
- Separate staging HTTP/mobile smoke: **failure**, run [42482642424](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42482642424), synthetic health HTTP 500.
- Source parity: **success**, run [42482642445](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42482642445).
- Cloudflare integration deployment remains `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`; `DB` binds to isolated D1 `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`. A read-only sqlite_master query confirms `candidate_tasks_v1` exists. This does not prove HTTP health stability.

## Change
Commit `cc4bdc4be22e610dd3ba8d8cadf98f89df7e0d5d` changes only `.github/workflows/integration-http-auth-smoke.yml`: one D1-backed health request per run instead of three. Every failed health response still fails the gate; all independent 14 unauthenticated/forged/malformed probes continue. No masking, retries that silently pass, D1 writes, or secret exposure.

## Explicit blockers / safe next actions
1. Inspect Cloudflare Worker traces and D1 row-read quota for the exact failing CF-Ray; distinguish quota exhaustion from runtime errors. Do not infer health from D1 admin SQL success.
2. If availability is stable, re-run HTTP auth smoke and the separate staging mobile smoke. Do not promote while either is red.
3. Phase15 candidate SQL fix for NULL status and timestamp due dates is in GitHub only. Before deploying to isolated integration, verify current live script equals pinned expected source, run signed two-user E2E, take isolated D1 backup, and preserve old Worker source/version.
4. Real Telegram WebView with two authorized test accounts, mobile 320/375/430, accessibility, admin permissions, receipt privacy, payment/AI opt-in and final production checklist remain pending.

## Rollback
Revert `cc4bdc4be22e610dd3ba8d8cadf98f89df7e0d5d` to restore three health samples. No Cloudflare or D1 rollback is needed because this change is CI-only. Production, news Worker, and channel untouched. **Production NO-GO** pending explicit approval and passing release gates.
