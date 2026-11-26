# Phase 15 — malformed Telegram initData gate (2026-11-07)

Scope: isolated integration CI only. No Worker deployment, D1 migration, production or news bot change.

## Baseline
- Branch head before change: 1d6eb70d2529ed5b8e382cff7c89cb2bdcd4b197.
- Prior isolated auth run: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42308757794 — FAILED because /health returned HTTP 503 with minimal DB_UNAVAILABLE.
- Its log confirmed public shell HTTP 200 and 11/11 unsigned/forged checks returned 401. These do **not** establish signed-user isolation or D1 readiness.
- Cloudflare D1 daily read quota exhaustion was documented in prior phase 15 evidence; do not interpret SELECT 1 as quota recovery.

## Change
Workflow .github/workflows/integration-http-auth-smoke.yml now sends two additional synthetic, unsigned malformed Telegram initData payloads to /api/progress: invalid digest encoding and invalid JSON user. Both must return 401. The checks run even after /health 503 and cannot mask health failure. Only aggregate counts are logged; no credentials or real identities are used.

## Acceptance
1. Workflow syntax valid and run completes.
2. Both malformed payloads return 401; existing 11 auth probes still pass.
3. /health returns 200 consistently after D1 quota reset; HTTP staging smoke passes.
4. Real signed Telegram initData, cross-user isolation and mobile UX must be tested separately before release. No release decision based on this test alone.

## Rollback
Revert commit c6fabab8d163832275f149d6f1ba1177d1476c99 on the development branch, after verifying no intervening workflow edits. No Cloudflare rollback required because no deployment was performed.

## Guardrails
No production deploy, payments, AI spend, broadcast, or user-data migration authorized by this change.
