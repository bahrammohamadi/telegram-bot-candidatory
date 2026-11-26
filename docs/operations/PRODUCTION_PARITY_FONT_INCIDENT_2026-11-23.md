# Production parity & font incident — 2026-11-23

Scope: **only** existing Telegram bot/miniapp and production Worker `candidatory-miniapp-api`. This document makes **no deployment**.

## Verified production snapshot
- Live version ID: `1c3e297c-435f-497d-ba71-6efd4fe88bf4` (100% traffic; previously designated v111).
- Production source multipart modules: `entrypoint.mjs`, `legacy.mjs`, `preview.mjs`; size of returned multipart source 482708 characters.
- Compatibility date: `2026-10-27`.
- Bindings (names/types only): `ADMIN_TELEGRAM_IDS` secret_text; `ADMIN_TELEGRAM_IDS_MAHDI` secret_text; `AI` ai; `AVALAI_API_KEY` secret_text; `DB` d1; `REVIEW_DB` d1; `TELEGRAM_BOT_TOKEN` secret_text. **No secret values read or recorded.**
- Route discovery using account-level `/workers/routes` returned HTTP 404; routes are **unverified**, not absent.
- Account workers.dev subdomain reported `lasvaram-candidatory`; script-specific public URL and HTTP smoke test **not yet verified**.
- No D1 queries or mutations performed. D1 binding existence is not schema or health verification.

## Architecture traceability
The versioned file `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` contains a structured **abridgment** of the adopted 18-chapter document, **not** a verbatim archive. Do not present it as the original full user text. Preserve all previous code/data until reconciled.

| Area | State | Evidence / next step |
|---|---|---|
| Existing production Worker and multipart bundle | سالم | Three modules and deployment verified |
| Five-tab UI / RTL | ناقص | Existing implementation observed, mobile WebView and interaction smoke tests missing |
| Unified Vazirmatn font | نیازمند اصلاح | User screenshot reports unchanged font; Google Fonts loading not proven in Telegram WebView |
| Same-origin font hosting | جدید | No verified WOFF2 asset endpoint or font-response test |
| Workspace RBAC / authorization | ناقص | No server-side permission contract tests this run |
| D1 migrations and recovery | ناقص | Two D1 bindings; schemas/backups not verified |
| GitHub-to-production parity and CI | ناقص | Source snapshot not yet matched byte-for-byte to a branch SHA; CI not proven |
| Original full 18-chapter verbatim archive | ناقص | Only condensed reference file verified |

## Safe next implementation slice (not deployed)
1. Capture exact production bundle hashes and repository branch SHA; compare without secrets.
2. Add versioned licensed font WOFF2 files to **existing** Worker bundle or approved static asset path, with `@font-face` and correct CSP. Avoid runtime Google Fonts dependency; do not proxy external URLs without security review.
3. Add static contract checks for HTML/CSS parsing, five tabs, bundle modules, binding names/types, CSP/font response, and access controls using synthetic data only.
4. Publish to **same** production Worker only after green CI, security review, rollback version and real read-only smoke-test plan; no second environment.
5. Verify typography in actual Telegram iOS/Android WebView before claiming user-visible success.

## Rollback
Previously verified live version ID before this record: `1c3e297c-435f-497d-ba71-6efd4fe88bf4`. No deployment in this audit; no rollback action required. Record deployment ID before the next release.
