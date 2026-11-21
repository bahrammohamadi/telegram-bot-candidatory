# Verified release gate snapshot — 2026-11-18 15:50 UTC

Scope: **production-only** `candidatory-miniapp-api`; no deployment, preview, staging, new worker, database mutation, or secret access is authorized by this document.

## Fresh evidence
- GitHub branch HEAD before this documentation commit: `f2e0d2b46ad2f1a524cb6dcd1430277fe22ce5a0`.
- Same-SHA GitHub Actions succeeded (these are **offline CI checks, not production validation**):
  - [Production release validator offline regression](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44329652676)
  - [Production release evidence gate](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44329652705)
  - [Worker binding parity guard](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44329652903)
  - [Candidate main-only offline auth regression](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44329652904)
- Cloudflare production deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, created `2026-11-11T20:05:53Z`, serving 100% via version `3c35231f-36f0-4bad-b786-9a4309d8e868` (version number 104).
- Production binding names/types read without values: `DB` and `REVIEW_DB` (D1), `AI` (AI), `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN` (secret_text). Compatibility date `2026-10-27`.
- Version metadata `has_preview=true` is **not proof** that a second environment is deployed. Do not enable or create preview environments.
- GitHub branch protection was reported disabled at inspection; successful Actions alone are not a mandatory enforced release gate.

## Release decision: BLOCKED
The original 18-chapter user-authored architecture text has not been recovered and verified verbatim; existing architecture documents must not be represented as its complete replacement. The deployed multi-module content has not been hashed and matched against the GitHub source package; rollback artifact and exact restoration procedure are unverified; production homepage read-only smoke test and route inventory are not recorded here. CI success is necessary but insufficient. **No production upload/deploy**.

## Gap matrix
| Area | Status | Required evidence |
|---|---|---|
| Same-SHA offline CI | سالم | Four linked successful Actions above |
| Production deployment identity and binding-name inventory | سالم | Fresh read-only Cloudflare API response |
| Explicit production-only release gate snapshot | جدید | This versioned document |
| Full verbatim 18-chapter canonical architecture | ناقص | Recover original user message and verify completeness |
| Multi-module deployed source/hash parity | ناقص | Read-only extraction and SHA-256 comparison |
| Rollback artifact and tested restoration procedure | ناقص | Non-destructive verified recovery plan |
| RBAC handler coverage | نیازمند اصلاح | Offline tests against actual handlers using fabricated fixtures |
| Five-tab RTL mobile journey | نیازمند اصلاح | Accessibility and contract coverage before any deployment |
| Production URL read-only smoke test and routes | ناقص | Confirm exact live URL, then GET-only probe |

Do not modify `candidatory-news-bot` or `@candidatoryiran`. No real payments, paid AI calls, bulk messages, access changes, or destructive D1 operations. The next useful work is read-only module extraction/parity, followed by an offline rollback-manifest gate.
