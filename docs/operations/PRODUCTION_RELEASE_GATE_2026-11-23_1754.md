# Production release gate — candidatory-miniapp-api
Recorded: 2026-11-23 17:54 Europe/Sofia. Read-only evidence, no deployment.

## Observed current state
- Live deployment: `1c3e297c-435f-497d-ba71-6efd4fe88bf4` at 100% traffic (historical release v111); re-query before any release.
- Multipart modules: `entrypoint.mjs`, `legacy.mjs`, `preview.mjs` (482708-character API multipart response).
- Compatibility date: `2026-10-27`.
- Bindings (names/types only): `ADMIN_TELEGRAM_IDS` secret_text; `ADMIN_TELEGRAM_IDS_MAHDI` secret_text; `AI` ai; `AVALAI_API_KEY` secret_text; `DB` d1; `REVIEW_DB` d1; `TELEGRAM_BOT_TOKEN` secret_text. Secret values must never be recorded.
- Most recently observed repository commit (search results, branch association not independently established): `b504f917607e00b6d98b8abe91415bc283bf4f0a`.
- GitHub combined status on that SHA: `telegram-bot (kandidatory-bot)` success (Appwrite target); GitHub Actions PR workflow-run query returned zero runs. This is **not** evidence of complete Cloudflare release CI.
- Public main URL, actual font loading, D1 schema/health, script routes, and source-byte parity: **unverified**.

## Executable acceptance checklist for the next safe slice
1. Capture the branch HEAD SHA using the Git refs API, and separately record deployed version and multipart module hashes (exclude secrets).
2. Compare all three production modules against GitHub source, with a documented map from repository paths to bundle filenames. Do not overwrite unknown production changes.
3. Ensure the exact original 18-chapter user document is archived verbatim; the existing architecture markdown is a condensed reconstruction only.
4. Build an explicit test for all five RTL tabs (امروز، مسیر من، کارها، یادگیری، حساب), route transitions, and form state persistence using synthetic fixtures, with no live D1 writes.
5. Verify every authorization check on the server, including role denial, ownership, and no trust in client-supplied Telegram IDs. Use static/unit tests only; no live authentication test.
6. For font: bundle a licensed Vazirmatn WOFF2 file with the **existing** Worker; serve a same-origin asset with font/woff2, suitable CSP, immutable cache; add a static assertion for @font-face, all global selectors, and an actual read-only font HTTP smoke test. A Google Fonts link or CSS family declaration alone is insufficient.
7. Require successful CI checks explicitly covering bundle syntax, CSS/HTML parse, binding names/types, no secret literals, CSP, API contract, and role permissions. Do not infer this from unrelated Appwrite status.
8. Capture original deployment ID as rollback target and verify that the deployment API can restore it before any publish.
9. Only then publish the tested multi-module package to **the existing** `candidatory-miniapp-api` production Worker, and verify the same primary URL read-only, including font response and the five-tab shell.
10. Log time, source SHA, new deployment version, tests and rollback in the operations journal.

## Decision
**NO-GO** for production deployment on this run. Missing verified source parity, relevant CI, same-origin font bytes, and primary-URL smoke test. No second environment, staging, preview Worker, bot, or D1 mutation is authorized.

## Gap matrix
| Area | State | Rationale |
|---|---|---|
| Existing three-module production deployment | سالم | Verified by Cloudflare API |
| Five-tab UI and RTL rendering | ناقص | Existing code, device checks outstanding |
| Global font loading | نیازمند اصلاح | Screenshot failure; no verified same-origin font asset |
| Bundled font and deterministic font checks | جدید | Release prerequisite |
| RBAC, AI controls and D1 contracts | ناقص | Production safety gates not demonstrated |
| GitHub/Cloudflare source parity and relevant CI | ناقص | Appwrite status is not a release gate |
| Verbatim architecture document | ناقص | Condensed GitHub file only |
