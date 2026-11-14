# Production release gate — 2026-11-13 17:58 Europe/Sofia

Scope: **only** existing Telegram mini-app and Cloudflare Worker `candidatory-miniapp-api`. This is a non-deployment release-control artifact; it does not authorize a release.

## Freshly observed evidence
- Target branch: `feature/cloudflare-parity-audit-2026-10-29`.
- Previous recorded commit: `f36fe6b2726855c9d34da392b55c2bb36dcc08e1` (not asserted to be current branch HEAD).
- GitHub Actions for that commit: **14/14 completed successfully**, including Candidate task contract static gate run [43447187507](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/43447187507). This does **not** establish that the tests ran against the production deployment.
- Production deployment read from Cloudflare: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic; deployed 2026-11-11T20:05:53Z.
- Bindings read from Cloudflare (names/types only): `ADMIN_TELEGRAM_IDS` secret_text, `ADMIN_TELEGRAM_IDS_MAHDI` secret_text, `AI` ai, `AVALAI_API_KEY` secret_text, `DB` d1, `REVIEW_DB` d1, `TELEGRAM_BOT_TOKEN` secret_text.
- Compatibility date: `2026-10-27`.
- The synthetic task test `cloudflare-live/phase14/tasks-e2e.mjs` imports `./dist/integration-tasks-worker.mjs`; that generated artifact was **not** found at that repository path. Do not claim this specific E2E test executed based on the static gate alone.

## Blocking release checks (all must pass before any production deployment)
1. Confirm branch HEAD SHA and successful required checks **for that exact SHA**.
2. Retrieve and compare every module of the currently deployed Worker against a reproducible multi-module artifact, including metadata, routes, compatibility, bindings, D1 identity and secret **names/types** (never values).
3. Execute offline contract and security tests with synthetic identities and in-memory SQLite; verify task owner scoping, Telegram initData signature and RBAC.
4. Confirm actual production root URL using read-only HTTP GET/HEAD, recording status and timestamp; do not exercise live authentication or write endpoints.
5. Record immutable artifact digest and the exact prior deployment/version; document a supported Cloudflare rollback procedure and verify permissions without executing a rollback on live traffic.
6. No D1 migration, production writes, payment, paid AI, mass notification, or administrator permission change without separate approval.

## Gap classifications
| Area | Classification | Evidence / blocker |
|---|---|---|
| Existing production Worker | سالم (existence only) | Deployment/version read directly; application health unverified |
| CI for previously recorded SHA | سالم (that SHA only) | 14 completed successful runs |
| Task ownership static checks | ناقص | Static gate passes, runtime E2E artifact/build and execution not established |
| Multi-module source parity | نیازمند اصلاح | Current production modules and branch HEAD not fully reconciled |
| Root URL health | ناقص | No direct read-only HTTP result recorded |
| Rollback readiness | ناقص | Historical deployment exists, rollback capability unverified |
| Full 18-chapter source-of-truth | ناقص | Must recover full original text and version it verbatim before claiming parity |

No second Worker, preview, staging or test deployment is permitted. Do not change `candidatory-news-bot` or `@candidatoryiran`.
