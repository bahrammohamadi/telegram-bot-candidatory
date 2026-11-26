# Production release readiness — evidence snapshot (2026-11-19 06:54 UTC)

Scope: existing Telegram mini-app and `candidatory-miniapp-api` only. **NO DEPLOYMENT AUTHORIZED BY THIS DOCUMENT.** This snapshot is evidence, not a claim of live source parity.

## GitHub
- Observed branch HEAD before this document: `fba85ae15c78f68325f6aec9837f69f340ea3519`.
- GitHub Actions API query filtered by `head_sha=fba85ae15c78f68325f6aec9837f69f340ea3519` returned **26 completed/success** runs. This supersedes the earlier unverified statement that the new commit had no CI runs.
- Relevant: [Production binding contract](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44467924892), [Offline module manifest](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44467924801), [Multipart completeness](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44467924699), [Read-only homepage gate](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44467924855), [Worker binding parity guard](https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44467930881).
- These CI results cover the *previous* SHA, not the commit that introduces this document. They do not prove runtime/source equality.

## Cloudflare read-only evidence
- Worker: `candidatory-miniapp-api`.
- Latest deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, created `2026-11-11T20:05:53.015284Z`.
- Serving version: `3c35231f-36f0-4bad-b786-9a4309d8e868` (100%).
- Compatibility date: `2026-10-27`.
- Binding names/types: `DB` D1 (`48b3c86b-45ea-492b-96e1-334dfafa2097`), `REVIEW_DB` D1 (`2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`), `AI` ai, `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN` secret_text. **No secret values retrieved.**
- Script settings: logpush false, observability null, tail_consumers null.

## Release-blocking gap matrix
| Area | Classification | Evidence / next action |
| --- | --- | --- |
| GitHub offline CI for previous SHA | سالم | 26 successful runs, links above |
| Worker deployment and binding inventory | سالم | Read-only Cloudflare API responses above |
| Current-turn evidence snapshot | جدید | This document |
| Original full 18-chapter architecture text | ناقص | Recover exact user-authored source before claiming canonical archive |
| Full multipart runtime source + per-module SHA parity | ناقص | Read active Worker content, inventory all parts, compare to reproducible GitHub artifact; no upload |
| Runtime routes and live homepage URL probe | ناقص | Resolve canonical URL, perform GET-only health check |
| RBAC handler authorization tests with synthetic data | نیازمند اصلاح | Execute offline contract tests on actual handler implementation |
| Verified rollback package | ناقص | Preserve full multipart content + metadata, validate restoration without touching production |

## Hard release stop
Do not publish unless current SHA CI passes, multipart artifact and metadata are complete, bindings/D1 match, RBAC and security checks pass, read-only homepage check passes, and rollback evidence is independently validated. Never create a second Worker, staging, preview, test deployment or environment. Never write to production D1 for testing. Leave `candidatory-news-bot` and `@candidatoryiran` unchanged.
