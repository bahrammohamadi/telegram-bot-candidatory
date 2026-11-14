# Production read-only baseline — 2026-11-14

Scope: existing Telegram bot / miniapp and **candidatory-miniapp-api** only. No test/staging/preview deployment permitted. Do not touch candidatory-news-bot or @candidatoryiran.

## Verified directly from Cloudflare API in this run
- Active deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`
- Active version: `3c35231f-36f0-4bad-b786-9a4309d8e868` (100% traffic)
- Deployment creation: `2026-11-11T20:05:53.015284Z`
- Compatibility date: `2026-10-27`
- Bindings: `ADMIN_TELEGRAM_IDS` (secret_text), `ADMIN_TELEGRAM_IDS_MAHDI` (secret_text), `AI` (ai), `AVALAI_API_KEY` (secret_text), `DB` (d1), `REVIEW_DB` (d1), `TELEGRAM_BOT_TOKEN` (secret_text). Values of secrets were not read or recorded.
- D1 binding IDs: DB `48b3c86b-45ea-492b-96e1-334dfafa2097`, REVIEW_DB `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`. **No queries or mutations were executed.**
- Script-settings returned logpush=false; observability=null.

## Architecture source fidelity
`docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` explicitly declares itself a structured compressed rewrite of the 18 chapters, **not a verbatim transcript**. Do not claim the full original was archived verbatim until compared with the source message.

## Gap matrix (evidence status, not feature acceptance)
| Area | Classification | Evidence / missing gate |
| --- | --- | --- |
| Existing Production Worker deployment | سالم | Deployment/version and 100% traffic verified read-only |
| Binding names and types | سالم | Seven binding descriptors verified; no secret values |
| Verbatim original architecture archive | ناقص | Existing archive is explicitly compressed |
| Source-to-Production multipart code parity | نیازمند اصلاح | Bundle/module manifest and hashes not yet compared |
| CI current HEAD and task contract | ناقص | Fresh SHA/run result not established in this baseline |
| D1 schema and RBAC behavior | ناقص | Read-only schema/contract evidence still needed |
| Main URL read-only smoke check | ناقص | URL/HTTP response not verified in this run |
| Reproducible rollback package and preflight | جدید | Historic deployment exists but safe rollback not proven |
| RTL mobile five-tab UX acceptance | ناقص | No verified acceptance screenshots/contracts |

## Release gate
**NO DEPLOY** until current HEAD/CI, exact multipart Worker bundle, metadata/routes/bindings, D1 schema compatibility, authorization tests with synthetic fixtures, main URL read-only smoke check and rollback readiness are all verified. No production write tests, paid AI, real payments, mass notifications, or destructive migrations.

## Next smallest action
Compare current branch HEAD with successful CI runs; inventory the actual multipart modules of the live Worker (without exposing secrets), then add an offline parity check using synthetic fixtures. Preserve existing code and data.
