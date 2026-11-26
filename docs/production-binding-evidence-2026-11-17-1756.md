# Production-only release evidence — 2026-11-17 15:56 UTC

Scope: existing `candidatory-miniapp-api` only. Read-only Cloudflare API inspection; no deployments, test workers, D1 writes, auth probes, or secret values.

## Verified deployment
- Deployment ID: `860f813c-baf4-4cff-bfc7-bb4120b910ed`
- Version ID: `3c35231f-36f0-4bad-b786-9a4309d8e868`
- Traffic: 100%
- Created: `2026-11-11T20:05:53.015284Z`
- Compatibility date: `2026-10-27`
- Usage model: `standard`

## Verified bindings (names/types only)
- `DB`: D1, ID `48b3c86b-45ea-492b-96e1-334dfafa2097`
- `REVIEW_DB`: D1, ID `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`
- `AI`: AI binding
- `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN`: secret_text bindings; values NOT retrieved.

## Release gate — blocked
- [ ] Archive verbatim 18-chapter architecture with provenance
- [ ] Match production multipart module names/hashes to release manifest
- [ ] Verify routes and public shell read-only health
- [ ] Verify D1 schema compatibility without writes
- [ ] Verify CI success for exact candidate SHA, including RBAC/ownership tests with fixtures
- [ ] Verify immutable rollback artifact and deployment procedure
- [ ] Confirm no CI job references a secondary worker, staging, preview, or test deployment

Prior deployment ID `3d172eb9-eca1-45e5-9070-760970d1f8c1` exists in deployment history, but is NOT a verified rollback package. Do not infer successful restoration.

## Gap matrix
| Area | Status | Evidence |
| --- | --- | --- |
| Production deployment identity | سالم | Cloudflare deployments GET |
| Binding inventory | سالم | Cloudflare settings and secrets GET |
| Release evidence note | جدید | This document |
| Full architecture archival | ناقص | Source text not yet recovered |
| Multi-module manifest and routes | ناقص | Not verified |
| RBAC/ownership and mobile RTL | نیازمند اصلاح | No verified full acceptance evidence |
| Rollback package | ناقص | Historical deployment alone insufficient |

No changes to `candidatory-news-bot` or `@candidatoryiran` are authorized.
