# Production release decision ledger — 2026-11-21 13:53 UTC

This is a **read-only evidence record**, not a release authorization. Only existing `candidatory-miniapp-api` is an eligible deployment target; no second environment may be created.

## Exact GitHub evidence
- Repository: bahrammohamadi/telegram-bot-candidatory
- Branch: feature/cloudflare-parity-audit-2026-10-29 (exists).
- Last inspected commit: `f622b563971121a6d2635ef346b11fed404ecce6`.
- Its GitHub Actions PR-filtered workflow results include completed/success:
  - Production evidence structural gate regressions: run 44906103982
  - Candidate task contract static gate: run 44906103864
  - Production release validator offline regression: run 44906103820
  - Production-only offline integration policy guard: run 44906103834
  - Telegram signed initData regression: run 44906103942
- A successful offline workflow is **not** evidence of deployed module parity or live authorization correctness.

## Cloudflare read-only recheck (2026-11-21)
- Worker: `candidatory-miniapp-api`
- Active deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed` (2026-11-11T20:05:53Z).
- Active version: `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic.
- Historical previous deployment: `3d172eb9-eca1-45e5-9070-760970d1f8c1` with version `32d33109-8e48-4c9e-a38a-4dd91012967b` (2026-11-08T10:42:46Z). **Historical does not mean rollback-ready.**
- No live URL smoke test performed in this record.
- Settings endpoint was read; no mutation or secret-value access.

## Release blockers / executable next gates
1. Recover the user's original 18-chapter 2026-11-12 architecture text verbatim; do not mislabel summaries as canonical.
2. Retrieve deployed active-version multipart modules and metadata, then compare entrypoints, module names, imports, bindings, D1 identifiers and compatibility settings with the exact candidate artifact.
3. Add and run fixture-only negative RBAC tests for cross-owner read/update, forged/expired Telegram initData and D1 failure; assert no D1 mutation on rejected requests.
4. Verify canonical live homepage URL and perform read-only GET/HEAD smoke test.
5. Build a rollback manifest with verified multipart source, module hashes, metadata/bindings and the restore procedure. A version ID alone is insufficient.
6. Require CI success on the exact candidate SHA before any production deployment.

## Gap matrix
| Area | Classification |
|---|---|
| Exact prior SHA CI sample | سالم |
| Active deployment identification | سالم |
| This time-stamped decision ledger | جدید |
| Verbatim 18 chapters | ناقص |
| Deployed multipart parity | ناقص |
| Cross-owner RBAC regression proof | نیازمند اصلاح |
| Live URL smoke test | ناقص |
| Validated rollback artifact | ناقص |

**Decision: NO DEPLOY.** No Worker, D1, secrets, admin roles, news bot or channel writes. No staging/preview/test deployment.
