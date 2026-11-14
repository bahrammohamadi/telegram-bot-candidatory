# Phase 15 evidence URL hardening — 2026-11-10

Scope: offline release-evidence validation only. No Worker, D1, production, news Worker, payments or Telegram publishing changes.

Commits: d30e87f5ebd530d0f161cbef372b5f8317540c7c (validator), 182de94d56d483d8cc575f9c0354f61c539ca74f (tests).

The evidence URL syntax gate now rejects internal/local hostnames, single-label hosts and explicit placeholder path segments (example-org, placeholder, todo, dummy, fake, sample). The regression fixture uses a real repository-shaped URL, not a placeholder path. A syntactically accepted URL does NOT establish that a resource exists, belongs to the correct run or commit, or has passed review. Manual independent verification of each of the 15 gates and exact-commit production approval remains mandatory.

Verify locally: `node cloudflare-live/phase15/release-evidence-gate.test.mjs`.
Verify remotely: check the GitHub Actions workflow `Isolated task progress integration` for the exact commit. Do not mark this step passed until it reports success.

Rollback (branch only, in reverse order):
`git revert 182de94d56d483d8cc575f9c0354f61c539ca74f`
`git revert d30e87f5ebd530d0f161cbef372b5f8317540c7c`
No Worker deployment or D1 migration was performed, so neither requires rollback.

NO-GO for production until signed Telegram account tests, isolation, admin permissions, private receipts, sandbox payments, AI consent/budget, accessibility, security, backup restore, rollback rehearsal and explicit exact-commit approval all have independently verified evidence.
