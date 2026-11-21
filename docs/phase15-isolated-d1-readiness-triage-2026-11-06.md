# Phase 15 — isolated D1 readiness triage (2026-11-06)

## Verified evidence
- Target branch: `feature/cloudflare-parity-audit-2026-10-29`.
- Isolated Worker: `candidatory-miniapp-integration`.
- Latest deployment observed via Cloudflare deployments API: `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b` (2026-11-06 07:58:50 UTC), version `fc7588b9-979c-4d51-a7a2-8e99effe0fd4`.
- Worker binding `DB` points to isolated D1 `candidatory-integration-test-20261101`; a `TELEGRAM_BOT_TOKEN` secret binding exists (value not read).
- Cloudflare D1 API read-only query `SELECT 1 AS ok` succeeded with `ok=1` on 2026-11-06. This proves direct control-plane access, **not** Worker-to-D1 readiness.
- The existing HTTP smoke workflow distinguishes 503/DB_UNAVAILABLE and separately checks unsigned/forged Telegram requests. Its historical intermittent failures remain a release blocker. No HTTP success is asserted by this note.

## Next executable triage
1. In Cloudflare Worker logs for the isolated script, correlate timestamps of `/health` 503 responses with D1 errors, quotas and CPU exceptions. Redact request data and secrets.
2. Inspect account D1 daily read quota and reset window. A direct `SELECT 1` is insufficient to exclude quota exhaustion on the Worker query against `candidate_users`.
3. Run the existing `Isolated integration HTTP auth smoke` workflow and require three 200 health samples, 10 unsigned API 401 responses and one forged-signature 401. Do not mark skipped/unavailable checks successful.
4. Only after stable health, run signed Telegram test identities in isolated D1 and mobile UI tests. Never copy production user data.
5. Confirm staging-only binding before any deployment. Do not touch `candidatory-news-bot`, production Worker, payment, AI billing, or broadcast.

## Rollback / safety
This commit is **documentation-only**, requiring no Worker or D1 deployment. Revert this documentation commit to undo it. If a subsequent isolated Worker deployment fails, use Cloudflare deployment history to restore the previously verified isolated version `fc7588b9-979c-4d51-a7a2-8e99effe0fd4`, after verifying its bindings. Do not roll back production.
