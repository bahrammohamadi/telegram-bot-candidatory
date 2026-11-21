# CI and branch-protection evidence — 2026-11-20 00:53 UTC

Scope: existing production Worker `candidatory-miniapp-api` only. This is an evidence record, not a release authorization. No new environment or deployment is permitted.

## Verified source state
- Branch: `feature/cloudflare-parity-audit-2026-10-29`
- Head before this documentation commit: `afb88aa577695fd6e8db8943eed06768df7eb850` (GitHub branch API, observed 2026-11-20 UTC).
- GitHub Actions API: 25 workflow runs for that exact SHA among the latest 100 branch runs; all 25 reported `completed/success`. This does **not** prove all possible workflows or production parity.
- Example: [Production release evidence gate](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44642107838), [signed initData regression](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44642107925), [candidate task static gate](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44642107928).
- Branch API reports `protected: false` and required status checks `enforcement_level: off`, with empty required checks. **Gap:** green workflows are not enforced before direct pushes or merges. Changing branch protection requires separate authorization; none was performed.

## Verified Cloudflare read-only state
- Worker: `candidatory-miniapp-api`.
- Latest deployment returned: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, active version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100%, created 2026-11-11T20:05:53Z.
- Bindings by type: 2 D1 (`DB`, `REVIEW_DB`), 4 secret_text, 1 AI. Secret values were not read. Compatibility date 2026-10-27; previews disabled.
- This read did not establish module-by-module parity, live homepage health, route inventory, or an executable rollback artifact.

## Release decision: NO-GO
- Required before release: exact 18-chapter source, multipart module hash parity, verified current bindings/routes/D1 compatibility, synthetic negative RBAC tests, successful CI for **release commit**, read-only smoke check of canonical URL, and complete rollback artifact with a validated restoration procedure.
- CI alone and the existence of historical deployment versions are insufficient. No production write, D1 migration, new environment, or news Worker change authorized.

## Gap matrix
| Domain | Status | Evidence / action |
| --- | --- | --- |
| Existing Worker identity and bindings | سالم | Cloudflare GET settings and deployments |
| 25 CI runs for previous head | سالم | GitHub Actions API, exact SHA |
| Enforced branch protection | نیازمند اصلاح | Branch is unprotected; do not change permissions without authorization |
| Exact 18-chapter canonical architecture | ناقص | Recover original user-authored text, not summary |
| Multipart source and rollback verification | ناقص | Hash all modules, verify recovery package |
| This evidence snapshot | جدید | Documentation only; not deployable |

This document intentionally contains no secret values, personal data, or claims of production release.
