# Candidatory — production release gap register (2026-11-14, 17:54 Europe/Sofia)

Reference: «سند جامع معماری نهایی کاندیداتوری»، v1.0, 1405/08/21 (18 chapters). This register is **not** a replacement for the full original document. Exact chapter text must be recovered and committed separately before claiming archival completion.

## Verified read-only evidence
- GitHub branch `feature/cloudflare-parity-audit-2026-10-29` at `2647389fcfe349a2919d22ba6bd06ebb72f22706` before this register commit.
- Cloudflare active deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed` (created 2026-11-11T20:05:53Z), 100% on version `3c35231f-36f0-4bad-b786-9a4309d8e868`, read 2026-11-14.
- Existing historical module manifest: `docs/architecture/production-worker-module-manifest-2026-11-14.json` (entrypoint.mjs, legacy.mjs, preview.mjs). Hashes in that manifest are historical evidence, **not** independently validated against a newly built release in this run.
- Current settings: seven bindings: `ADMIN_TELEGRAM_IDS` (secret_text), `ADMIN_TELEGRAM_IDS_MAHDI` (secret_text), `AI` (ai), `AVALAI_API_KEY` (secret_text), `DB` (d1), `REVIEW_DB` (d1), `TELEGRAM_BOT_TOKEN` (secret_text). Secret values were not accessed. DB IDs omitted intentionally.

## Gap matrix
| Area | Status | Evidence / release requirement |
| --- | --- | --- |
| Existing production Worker and deployment | سالم | Active deployment/version read directly from Cloudflare |
| Three-module historical manifest | سالم (historical artifact only) | Repository manifest available; no fresh build parity proof |
| Full verbatim 18-chapter architecture archive | ناقص | Exact original text not yet retrieved and committed |
| Five-tab mobile RTL UI / پرونده / مسیر / وظایف | نیازمند اصلاح | No verified UI acceptance evidence for current release |
| RBAC and data ownership across DB/REVIEW_DB | ناقص | Require static access matrix and read-only schema mapping |
| Independent build artifact parity | جدید | Generate deterministic proposed manifest; compare against source and metadata |
| Production URL read-only smoke test | ناقص | No successful fresh URL GET verified in this run |
| Rollback drill and verified artifact | ناقص | Previous deployment listed, but rollback not executed or proven |
| Release authorization | نیازمند اصلاح | Block until CI green, bindings/D1/metadata/security and rollback verified |

## Hard release gate
Do not deploy or modify production data until all independent checks pass. Do not create staging, preview, test Worker or second bot. Offline tests with synthetic fixtures only; no live auth POST or write test. No payment, paid AI, bulk messages, D1 migration, admin access change or secret exposure. Leave `candidatory-news-bot` and `@candidatoryiran` untouched.

## Next implementable slice
Prepare an isolated **source-code diff only** for mobile RTL five-tab navigation on the authorized branch; validate using static/unit/contract checks with synthetic data, then compare complete production multipart modules, metadata and bindings and verify rollback before a production-only deployment. Source-code isolation is not a second runtime environment.
