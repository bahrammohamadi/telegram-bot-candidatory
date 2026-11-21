# Production release gate — 2026-11-21 (read-only verification)

## Scope
Only existing Telegram bot/mini-app and Cloudflare Worker `candidatory-miniapp-api`. No staging, preview, new Worker or isolated environment. No production D1 writes, auth probes, billing, AI spend or destructive changes. News worker and @candidatoryiran excluded.

## Verified Cloudflare read-only evidence (2026-11-21)
- Deployment ID: `860f813c-baf4-4cff-bfc7-bb4120b910ed` created `2026-11-11T20:05:53.015284Z`; traffic 100% on version `3c35231f-36f0-4bad-b786-9a4309d8e868`.
- Compatibility date `2026-10-27`; standard usage model.
- Binding names/types: `DB` D1, `REVIEW_DB` D1, `AI` AI, four secret_text names `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN`. Secret values deliberately not retrieved.
- Historical deployments are available but rollback has **not** been validated.

## Architecture-source integrity
`docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` explicitly identifies itself as a **compressed structured rewrite**, not the verbatim 18-chapter original supplied on 2026-11-12. Do not label it an exact archival copy. Obtain the original full text before claiming verbatim version control.

## Gap matrix
| Area | Status | Release gate |
| --- | --- | --- |
| Existing Production deployment identity | سالم | Verified read-only |
| Binding inventory (names/types) | سالم | Verify version-specific metadata and route mapping before release |
| Verbatim original 18-chapter source | ناقص | Preserve and compare against exact original |
| Multi-module code parity with deployed version | ناقص | Verify all modules and hashes |
| RBAC/tenant isolation and negative tests | نیازمند اصلاح | Must pass offline contract/security tests |
| Read-only D1 regression tests | جدید | Confirm successful CI at candidate SHA |
| CI success for release candidate | ناقص | Require green CI, not historical success |
| Reproducible rollback artifact and procedure | ناقص | Confirm compatible previous version, metadata and bindings |
| Main URL safe GET smoke-test | ناقص | Verify canonical URL then read-only request |

## Deployment decision
**NO DEPLOY.** Candidate CI, complete multi-module parity, version-specific bindings, security evidence, canonical URL and safe rollback are not yet fully proven. No second environment may be created to bypass these gates.

## Next implementation slice
Verify branch SHA and CI for latest candidate; add offline D1 failure-path regression and RBAC tests with fabricated data; package a reproducible multi-module artifact and exact rollback manifest before considering direct production deployment.
