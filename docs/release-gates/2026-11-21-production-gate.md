# Production release gate — 2026-11-21 (read-only evidence)
Repository branch: `feature/cloudflare-parity-audit-2026-10-29`
Scope: existing Telegram bot/miniapp and ONLY `candidatory-miniapp-api`. Never create staging/preview/test Worker. Never modify `candidatory-news-bot` or `@candidatoryiran`.

## Evidence observed at capture time
- Branch head before this document: `6363cdc94141670cb6a92eaa33cc749a1880e26e`.
- Cloudflare latest deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed` (2026-11-11T20:05:53Z).
- Active version: `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic; version number 104.
- Compatibility date: `2026-10-27`.
- Binding names/types only: `DB` D1; `REVIEW_DB` D1; `AI` AI; `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN` secret_text. No secret values captured.
- Prior version `32d33109-8e48-4c9e-a38a-4dd91012967b` appears in deployment history, but **is not a verified rollback candidate**.
- A GitHub commit status context for a different recent commit was successful, but that is not proof that the branch head passed the required complete CI checks.

## Release gate (all must be independently evidenced)
1. Obtain the full authoritative 18-chapter architecture document verbatim and version it; compare implementation to each chapter.
2. Verify current branch SHA and all required GitHub Actions jobs successful for the exact candidate SHA.
3. Reconstruct and compare the **complete multi-module** deployed Worker bundle and metadata to source; verify routes, compatibility flags, bindings, D1 schema and secret **names only**.
4. Run offline unit, static, contract, RBAC/IDOR, invalid-JSON and D1-outage tests with synthetic data only; no authenticated/write tests on Production.
5. Verify read-only homepage URL and HTTP response; do not infer URL or health from deployment existence.
6. Prepare exact pre-change artifact, version ID, traffic allocation, immutable hashes and rollback commands; validate permissions and rollback procedure without executing rollback.
7. Obtain explicit authorization for any real payment, paid AI, mass notification, destructive migration or admin permission change.
8. Only then deploy the reviewed multi-module package to the existing Production Worker; record UTC time, deployment/version, read-only smoke-test and rollback evidence. If any gate is missing: **NO DEPLOY**.

## Gap matrix (status: سالم / ناقص / نیازمند اصلاح / جدید)
| Area | Status | Evidence / missing |
|---|---|---|
| Existing Worker identity and current deployment | سالم | Cloudflare deployment list |
| Binding names and types | سالم | Cloudflare settings and secrets list, no values |
| This release-gate record | جدید | This commit |
| Full original 18-chapter document | ناقص | Not retrieved verbatim |
| CI for exact release candidate | ناقص | Must verify complete Actions checks |
| GET and invalid POST write prevention | نیازمند اصلاح | Code changes exist in GitHub; full behavioral and deployed parity evidence missing |
| RBAC / IDOR coverage | نیازمند اصلاح | Partial synthetic tests only |
| Multi-module package parity | ناقص | No verified deployed-bundle diff |
| Main URL read-only smoke test | ناقص | Canonical URL not established |
| Proven rollback | ناقص | Historical versions are not sufficient |

**Decision: BLOCK Production deployment.** This record is documentation only and does not claim a Production change.
