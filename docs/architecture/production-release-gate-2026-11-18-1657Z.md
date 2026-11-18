# Production release gate — evidence snapshot (2026-11-18 16:57 UTC)

Scope: **only** existing Telegram mini app and Cloudflare Worker `candidatory-miniapp-api`. This document is read-only evidence; it does not authorize deployment.

## GitHub baseline
- Repository: `bahrammohamadi/telegram-bot-candidatory`
- Branch: `feature/cloudflare-parity-audit-2026-10-29`
- Observed HEAD before this document: `e748bcfc0c284d48f8b1a11c7d905c3b49bf0fb2`.
- Same-SHA successful checks: [offline auth](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44340511142), [multipart parity](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44340511268), [mini app](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44340510925), [production release evidence](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44340511351), [binding parity](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44340511246).
- These successful runs apply to the **previous SHA**, not necessarily this documentation commit.

## Cloudflare observed (read-only API)
- Worker: `candidatory-miniapp-api`.
- Deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed` (2026-11-11 20:05:53 UTC), 100% traffic.
- Version: `3c35231f-36f0-4bad-b786-9a4309d8e868` (#104).
- Compatibility date: `2026-10-27`.
- Binding names/types only: `DB` and `REVIEW_DB` (D1); `AI` (AI); `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN` (secret_text). Secret values were not requested.
- Version metadata says `has_preview=true`: not proof of an active second environment. Investigate without creating or deploying one.

## Release gate: BLOCKED
- Full verbatim 18-chapter architecture document not yet independently recovered and committed.
- Live multipart source/module SHA-256 parity with repository not demonstrated.
- Routes, read-only D1 metadata, production homepage response, and rollback restoration not verified in this snapshot.
- Existing workflow files include names containing `preview` and `staging`; **do not run these** until audited for compliance with the single-production constraint.
- No production writes, auth probes, D1 migration, new environments, or deployment permitted by this snapshot.

## Gap matrix
| Area | Classification | Evidence / next action |
| --- | --- | --- |
| Existing deployment and binding inventory | سالم | Cloudflare GET observations above |
| Same-SHA offline CI on baseline | سالم | Linked runs above |
| Current evidence snapshot | جدید | This document |
| Full architecture v1.0 verbatim | ناقص | Recover source text and version it |
| Live source and rollback package parity | ناقص | Read-only extraction and hashing |
| Actual RBAC handler tests | نیازمند اصلاح | Fake-data offline handler tests |
| Five-tab RTL UI parity | نیازمند اصلاح | Review against canonical architecture |

Rollback: previous deployment identifiers are visible, but restore viability is **not** verified. No release is approved.
