# Tasks RBAC executable-test implementation gate — 2026-11-23 11:58 UTC

Status: **NOT EXECUTED / NOT DEPLOYED**. This is an implementation-ready mapping checklist, not a claim that the API passes.

## Verified production facts (read-only Cloudflare API, 2026-11-23)
- Target script: `candidatory-miniapp-api`; deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`; active version `3c35231f-36f0-4bad-b786-9a4309d8e868` at 100%, created 2026-11-11 20:05:53 UTC.
- Compatibility date: `2026-10-27`; bindings: `DB` and `REVIEW_DB` (D1), `AI` (AI), and four secret_text names: `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN`. Values not read.
- Worker subdomain enabled, preview subdomains disabled. Routes, module content, D1 schema and canonical homepage URL **not yet verified**.
- This record does not authorize a production deployment.

## Concrete next code slice (offline only)
1. Locate the *actual* task route registration, handler exports, auth middleware, role resolver and repository adapter in the checked-in Worker source. Record file paths and export names before writing assertions; never invent endpoint paths.
2. Introduce a pure test adapter with fabricated users A/B, workspaces W1/W2, tasks T1/T2 and a write-call counter; do not import Cloudflare production bindings or connect to live D1.
3. Implement the ten cases in `docs/contracts/TASKS_RBAC_SYNTHETIC_CONTRACT_V0_1_2026-11-23.md`. Assert cross-workspace access denial, role enforcement, immutable owner/workspace, scoped listing, and **zero writes on every denied request**.
4. Add a CI job that runs static checks and these tests without publishing artifacts to a Worker or invoking a deployment action.
5. Attach exact SHA, passing workflow URLs, handler mapping, module manifest, security review and a verified rollback recipe before considering a direct Production deployment.

## Release decision
**NO-GO** until the verbatim 18-chapter architecture, actual task handlers and D1 schema, current branch HEAD/CI, full multi-module bundle, read-only homepage smoke test, and executable rollback procedure are verified. No second environment is permitted. No production writes/auth tests, D1 migrations, paid AI or messaging are permitted.

## Gap matrix
| Area | State |
|---|---|
| Production deployment/binding metadata | سالم (read-only snapshot only) |
| Tasks security contract specification | سالم (specification exists, not executable) |
| Executable synthetic RBAC tests | جدید / not implemented |
| Verbatim 18-chapter architecture | ناقص |
| Handler/route/schema parity and homepage | ناقص |
| Operational rollback verification | نیازمند اصلاح |
