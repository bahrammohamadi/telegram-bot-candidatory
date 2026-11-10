# Isolated integration evidence checkpoint — 2026-11-10

Scope: `feature/cloudflare-parity-audit-2026-10-29` only. This is an evidence record, NOT production approval.

## Verified baseline before this commit
- Branch HEAD: `72c3aa381ed9bef49a9f7ef6f462d063b0267cfa`; comparison with this ref returned identical.
- GitHub Actions for baseline commit: 8 completed/successful runs:
  - Source parity: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42803638081
  - Staging HTTP smoke: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42803638293
  - Mini App checks: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42803638232
  - Signed Telegram initData regression: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42803637923
  - D1 budget regression: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42803637997
  - Isolated HTTP auth smoke: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42803638043
  - Health probe offline safety: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42803637970
  - Task progress integration: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42803638333
- Cloudflare integration Worker deployment `c5c6482d-2daa-4862-a62b-8c4cc2720141`, version `7489532d-a4a8-4f4f-8924-e12096e6c548`, 100% traffic (deployed 2026-11-09 11:04:06 UTC).
- Isolated D1 name `candidatory-integration-test-20261101` confirmed via Cloudflare read-only API.
- News Worker deployment `1d14f941-dc04-40ba-9f19-1cdd5831024c`, version `1c080a9a-e7b6-420a-81ae-14821608a1aa`, 100% traffic (deployed 2026-11-10 06:51:14 UTC). No writes made to it in this checkpoint.

## Release gates still unverified
- Two *real* independently authenticated Telegram accounts and cross-user isolation.
- Full API, mobile/accessibility and security QA against a pinned candidate.
- Two-admin permissions (never infer IDs), private receipt storage, subscription/payment ledger audit.
- D1 recovery/backup evidence, tested rollback of exact candidate, AI opt-in and strict budget.
- No real payments, bulk notifications, production migration or production deployment without separate explicit approval.

## Safe rollback of this checkpoint
This commit is documentation-only: revert the commit that introduced this file (or delete this file on the development branch). Do not roll back the Worker or D1 because neither was modified by this checkpoint.

## Evidence interpretation
GitHub workflow success proves those workflow executions passed; it does not establish real-account E2E coverage or production readiness. A successful Cloudflare deployment listing proves version routing, not endpoint health.
