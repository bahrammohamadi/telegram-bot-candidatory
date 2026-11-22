# Production release decision — 2026-11-22 17:57 UTC

Scope: existing Telegram bot, Mini App, and Cloudflare Worker `candidatory-miniapp-api` ONLY. No second environment, staging, preview, new Worker, or deployment.

## Verified observations (read-only)
- GitHub branch HEAD before this evidence commit: `6bd9bd48660d43be85555108cf4c453eda93aa51`.
- Branch protection endpoint metadata reports `protected: false`, required checks empty. **A successful workflow does not enforce merge/release protection.**
- Exact-head workflow results on 2026-11-22: Task RBAC offline policy gate **success** https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/45046286928 ; Candidate task contract static gate **success** https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/45046286962 ; Worker multipart artifact parity **success** https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/45046286941 ; Production Worker homepage read-only gate **success** https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/45046283299 . These prove only their respective jobs, not production release readiness.
- Cloudflare active deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic, created 2026-11-11 20:05:53 UTC.
- Worker settings: compatibility date 2026-10-27; bindings: `DB` and `REVIEW_DB` (D1), `AI`, and four secret names `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN`. No secret values accessed or stored. Worker subdomain enabled; previews disabled.

## Release decision: BLOCKED
- Full verbatim user-authored 18-chapter architecture from 2026-11-12 is **not recovered**. Existing condensed document must not be presented as verbatim.
- Current deployed multipart source/module list and live routes not yet reconciled with GitHub artifact; D1 schema and safe rollback not freshly verified.
- Offline RBAC tests passing do not establish authorization enforcement by the live API handlers.
- CI is successful on previous SHA, but release requires success on **candidate SHA** after all changes, plus binding/metadata parity, authorization checks, no risky D1 writes, and rollback evidence.
- No authenticated or write tests against Production; no production deployment. No change to news Worker or Telegram news channel.

## Next smallest useful slice
Inspect task API handler entrypoints and their authorization calls, add synthetic fail-closed handler-contract tests, and gate them in existing CI (no deployed test environment). Keep the release blocked until multipart source, routes, D1, and rollback are proven. Revert this documentation commit to undo this change; it does not change runtime behavior.

## Gap matrix
| Area | Status | Reason |
|---|---|---|
| Current Worker deployment identification | سالم | Read-only Cloudflare response |
| Synthetic RBAC CI | سالم | Exact-head successful run |
| CI enforcement / branch protection | نیازمند اصلاح | Branch unprotected |
| Verbatim 18-chapter source | ناقص | Exact original not recovered |
| Production API RBAC parity | ناقص | Handler integration not proven |
| Multipart source, routes and D1 parity | ناقص | No fresh complete comparison |
| Verified rollback | ناقص | No validated restoration plan |
| This timestamped release evidence | جدید | GitHub versioned document |
