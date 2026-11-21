# Production release evidence snapshot — 2026-11-14 18:57 UTC

This is a **read-only observation**, not authorization to deploy. Do not treat it as current on later runs.

## Observed
- Worker: `candidatory-miniapp-api` only.
- Deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, created 2026-11-11T20:05:53Z, 100% version `3c35231f-36f0-4bad-b786-9a4309d8e868`.
- Compatibility date: `2026-10-27`.
- Bindings (names/types only): `ADMIN_TELEGRAM_IDS` secret_text; `ADMIN_TELEGRAM_IDS_MAHDI` secret_text; `AI` ai; `AVALAI_API_KEY` secret_text; `DB` d1 (`48b3c86b-45ea-492b-96e1-334dfafa2097`); `REVIEW_DB` d1 (`2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`); `TELEGRAM_BOT_TOKEN` secret_text.
- Worker subdomain enabled; previews disabled.
- Previous Git commit `45f21611d3a033aa2e53344b0051f078f2a217ef`: 15 associated PR-filtered workflow runs returned success, including offline auth, multipart artifact, binding parity and Mini App checks. **This is not proof of all push-triggered checks or current head.**
- Existing architecture file `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` explicitly describes itself as a compressed rewrite, **not** the verbatim 18-chapter source.

## Release blockers (must be independently resolved)
1. Re-read current Git branch SHA and collect complete CI results for exact candidate SHA (PR-only connector results are incomplete).
2. Fetch active multi-module Worker content and hash every module; compare with independently built candidate package.
3. Verify routes and actual canonical production URL; perform read-only GET only, never production auth/write probes.
4. Inspect D1 schema read-only and verify workspace/RBAC and binding compatibility using offline synthetic fixtures.
5. Obtain verified rollback package for **all modules** with compatible metadata/bindings and documented operator procedure.
6. Archive exact original 18 chapters only from the original user text; never label the compressed rewrite verbatim.

## Status matrix
| Area | Status | Evidence |
|---|---|---|
| Production deployment metadata | سالم (snapshot only) | Cloudflare GET deployments |
| Binding names/types | سالم (snapshot only) | Cloudflare GET settings and secrets names |
| 18-chapter verbatim archive | ناقص | Existing file self-identifies as condensed |
| Module parity / D1 schema / RBAC | نیازمند اصلاح | No complete independent evidence |
| Rollback verified and canonical URL smoke | ناقص | No validated rollback/URL in this run |
| Five-tab RTL release candidate | جدید | Candidate not yet built or deployed |

**Decision: NO RELEASE.** Never create staging/preview/secondary Worker. Never touch `candidatory-news-bot` or `@candidatoryiran`. No real payments, paid AI, bulk notifications, destructive migrations, or admin privilege changes.
