# Production release evidence — 2026-11-18 14:54 UTC

Status: **NO DEPLOY / BLOCKED**. This is a read-only evidence snapshot, not a release approval.

## Verified current production (Cloudflare API read)
- Worker: `candidatory-miniapp-api`
- Active deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`
- Active version: `3c35231f-36f0-4bad-b786-9a4309d8e868`, traffic 100%
- Deployment created: 2026-11-11T20:05:53.015284Z
- Compatibility date: 2026-10-27
- Binding names/types only: D1 `DB`, `REVIEW_DB`; AI `AI`; secret_text `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN`. No secret values accessed.
- Route and homepage health: **NOT VERIFIED**. No production write or auth probes were performed.

## GitHub CI evidence (not a release authorization)
For commit `3feaa63458fa11dabec61c071785bce26da0f185`, GitHub Actions returned completed/success, including:
- Offline structural evidence: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44319190388
- Worker multipart artifact parity: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44319190383
- Worker binding parity guard: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44319190877
These are workflow results for the named SHA only, not proof of production artifact parity or current branch HEAD readiness.

## Gap classification
| Scope | Status | Reason |
|---|---|---|
| Deployment identity and binding inventory | سالم | Direct read from Cloudflare API this run |
| CI evidence for specified prior SHA | سالم | Three completed successful workflow runs linked above |
| Exact verbatim authoritative 18-chapter document | ناقص | Original user-authored text unavailable; summarized GitHub file must not be represented as verbatim |
| Exact current branch HEAD CI and source parity | ناقص | Not proven against production multipart module hashes |
| Real RBAC handler synthetic contract tests | نیازمند اصلاح | No verified handler-level release evidence |
| Five-tab mobile RTL and user journey | نیازمند اصلاح | No verified parity against full original document |
| Reproducible rollback artifact | ناقص | Historical deployment IDs are not a validated recovery bundle |
| Immutable dated release-evidence snapshot | جدید | This file |

## Non-negotiable gate
No new environment, worker, bot, staging, preview or test deployment. Only the existing production worker may be deployed after: exact-source parity, valid multipart artifact and binding/D1/metadata/secrets name/type matching, synthetic security/RBAC tests, successful CI for release SHA, read-only homepage check and validated rollback plan. Otherwise **do not deploy**. Never modify `candidatory-news-bot` or `@candidatoryiran`, nor perform production write tests, D1 migration, paid AI, payments, bulk notifications or access changes.

Next: recover the original 18 chapters verbatim; establish production module hash manifest and a verified rollback bundle; then validate exact release SHA in existing GitHub CI.
