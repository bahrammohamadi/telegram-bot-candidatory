# Phase 15 — production evidence gate (2026-11-08)

This is a **non-deploying, fail-closed** evidence validator for the eventual release package. It cannot authorize a production deployment on its own.

## Baseline and observed blockers
- Branch before work: `cf958334ea0b22e8a6d9b0e1536b8d449d01ac03`.
- Phase15 CI [42502714381](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42502714381) success; integration HTTP [42502718723](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42502718723) failure; staging HTTP [42502718599](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42502718599) failure; parity [42502718598](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/42502718598) success.
- Cloudflare integration deployment readback `f1eb351c-c3ee-4e46-bb58-b8cadb6e769b`; no deployment made.
- No user approval to deploy production has been granted.

## Use
`node cloudflare-live/phase15/release-evidence-gate.mjs /path/to/private-evidence.json`

The JSON must pin a 40-hex commit, target `production`, and supply `gates` containing all 15 named gate keys in the source, each with `passed: true` and an HTTPS evidence URL. The approval gate additionally needs `approval_scope: "deploy this exact commit"` and `approved_commit` equal to the pinned commit. Keep private approval details and personal evidence outside GitHub; use links to access-controlled audit records rather than credentials or user data. Never fabricate passing gates or an approval.

The validator checks **shape and presence** of evidence, not its authenticity. An authorized human must independently review the linked evidence, verify current deployment diffs, confirm backups and rollback, and grant separate explicit approval before production. Run the negative regression with `node cloudflare-live/phase15/release-evidence-gate.test.mjs`.

## Rollback and boundaries
Revert commits `ede9ea096d9fa07cf45fb9d1f6b35892a0a71322`, `483a75771c1beebc456fc22deeddb1a06dc2126e`, and `86184fc7ec35cfb6d5ea6b8d0766d3bd6e9a3cdc` to remove the validator and CI hook. No Worker, D1, payment, AI, news bot or channel rollback is necessary because this change is GitHub-only. **Production NO-GO**.
