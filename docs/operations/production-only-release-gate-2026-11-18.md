# Production-only release gate — Candidatory (2026-11-18)

Status: **BLOCKED / NO DEPLOY**. Scope: existing Telegram bot and `candidatory-miniapp-api` only. Branch: `feature/cloudflare-parity-audit-2026-10-29`.

## Immutable constraints
- Never create or deploy a second Worker, bot, Mini App, staging, preview, test environment or isolated runtime.
- Never run write, auth probing, or destructive migration against real D1/Production. CI uses synthetic data without deployment.
- Do not touch `candidatory-news-bot` or `@candidatoryiran`.
- No real payments, paid AI, bulk messaging, destructive D1 migration, admin-permission changes or secrets disclosure without separate authorization.
- AI must not be used for political persuasion manipulation, sensitive profiling or unsolicited outreach.

## Release acceptance checklist (all required; otherwise STOP)
1. Retrieve current branch HEAD and **commit-specific** GitHub Actions conclusions; all required checks green.
2. Read current Cloudflare Production deployment, version(s), multi-module script content, metadata, routes and bindings. Compare each module byte/hash to an archived build manifest. Never assume a historical ID is current.
3. Inventory D1 bindings and schema read-only; verify secret **names/types only**, never values. Record expected bindings and migration compatibility.
4. Run static/unit/contract/security tests with synthetic users: Telegram initData signature and expiry; workspace isolation; deny-by-default RBAC for owner/member/consultant/support/admin; cross-workspace IDOR; idempotency; validation and rate limiting. No live authentication tests.
5. Verify mobile RTL five tabs (امروز/مسیر من/کارها/یادگیری/حساب), loading/error/empty states and keyboard accessibility in non-deployed checks where feasible.
6. Archive a complete, hash-verified multi-module rollback artifact and current metadata/bindings/route map; verify restore procedure without writing Production.
7. Read-only GET smoke check on the **actual** canonical Mini App URL before and after any permitted direct Production release; log UTC time, HTTP result, deployment/version, and rollback decision.
8. Only then publish a minimal compatible change directly to the existing Worker; never a second environment.

## Evidence as of 2026-11-18 21:55 UTC
- Cloudflare read-only deployments API returned current deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, 100% version `3c35231f-36f0-4bad-b786-9a4309d8e868`, created `2026-11-11T20:05:53Z`.
- GitHub compressed 18-chapter document exists at `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` and explicitly states it is **not verbatim**. Verbatim archival remains blocked pending retrieval of full original.
- GitHub combined status API for historical commit `ae0209e920e60d375961e8b822e9956a4b288367` returned zero statuses; this is **not evidence of successful CI**.
- Full current HEAD/check runs, actual source parity, canonical URL smoke check, secrets/routes/D1 parity, and rollback artifact **not verified this run**.

## Gap matrix
| Area | Status | Evidence / exit criterion |
| --- | --- | --- |
| Existing Production deployment identified | سالم | Cloudflare read-only deployments response above |
| Written release gate | جدید | This document |
| Verbatim 18-chapter architecture | ناقص | Recover exact original and hash/version it |
| HEAD-specific CI and security checks | ناقص | Obtain green required checks for HEAD |
| Production multi-module parity and rollback | ناقص | Verified manifest and restore bundle |
| RBAC and workspace isolation | نیازمند اصلاح | Executable synthetic-data tests of real handlers |
| Five-tab mobile RTL | نیازمند اصلاح | Implement and verify against source/UI |
| Main URL smoke check | ناقص | Canonical URL and read-only result |

Next work: make HEAD-specific CI verifiable, retrieve multi-module Production source read-only, generate manifest and rollback artifact, then address actual product features. **No deployment authorized by this document.**
