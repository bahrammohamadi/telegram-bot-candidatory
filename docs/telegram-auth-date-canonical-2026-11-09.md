# Canonical Telegram auth_date hardening — 2026-11-09

Scope: development branch only; no Worker or D1 deployment.

## Change
The Telegram initData HMAC validator now rejects leading-zero/noncanonical positive timestamps before signature verification. Telegram-generated Unix seconds use plain positive decimal notation. Signed synthetic regression cases cover zero and leading zeros, including a timestamp otherwise within the valid clock window.

Code commit: 3cd5afd4f5e2c7a0cbbf35bcce22cea60355684a
Test commit: 62de15366b463f87c5f30e4dbe09d952206606fb

## Acceptance gates
Run `node --test miniapp/tests/auth-boundaries.test.mjs` on Node 22, then full miniapp tests, signed Telegram identity tests, API user isolation, mobile QA and staging HTTP health. Verify GitHub Actions success for this HEAD before any isolated deployment. Never use real Telegram credentials or personal receipts in CI. No production deployment is authorized.

## Rollback
Revert test commit 62de153 then code commit 3cd5afd on the development branch; re-run CI. No database migration or Worker rollback is required because neither was modified in this run. If deployed to staging later, first restore its previously verified Worker version after checking version history. Production release requires independent explicit approval.
