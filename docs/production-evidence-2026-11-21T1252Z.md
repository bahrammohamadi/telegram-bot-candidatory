# Production release evidence — 2026-11-21 12:52 UTC

Scope: existing candidatory-miniapp-api only. Evidence is read-only; this is not authorization to deploy.

## GitHub baseline
- Branch: feature/cloudflare-parity-audit-2026-10-29
- Inspected HEAD: 7cf4bdb8b90c80b8a7127ca3ffa85f1fb6b6e183
- CI on this exact SHA: 25 returned workflow runs, all completed successfully, including Mini App checks (44901595918), Worker multipart artifact parity (44901595888), production release evidence gate (44901595880), and signed initData regression (44901595837). Note: these are offline checks, not proof of live parity.

## Cloudflare read-only baseline
- Active deployment: 860f813c-baf4-4cff-bfc7-bb4120b910ed (2026-11-11T20:05:53Z)
- Active version: 3c35231f-36f0-4bad-b786-9a4309d8e868 at 100% traffic.
- compatibility_date: 2026-10-27; usage_model: standard.
- Bindings: DB and REVIEW_DB (D1), AI, ADMIN_TELEGRAM_IDS, ADMIN_TELEGRAM_IDS_MAHDI, AVALAI_API_KEY, TELEGRAM_BOT_TOKEN (secret values never read).
- Workers subdomain enabled; previews disabled.

## Release decision: BLOCKED
- GitHub SHA is not proven equivalent to deployed multi-part Worker code.
- Exact 18-chapter canonical architecture document is not yet recovered and verified verbatim.
- Live homepage URL read-only HTTP smoke test and validated rollback procedure not completed in this evidence capture.
- No production writes, D1 migrations, deployment or other environment creation authorized by this file.

## Gap matrix
| Area | Status | Evidence / next action |
|---|---|---|
| Branch HEAD and offline CI | سالم | Exact SHA and run IDs above |
| Worker deployment and binding names | سالم | Cloudflare GET deployment/settings/secrets |
| Time-stamped evidence snapshot | جدید | This file |
| Original full architecture text | ناقص | Retrieve original 2026-11-12 message verbatim |
| Live multipart code parity | ناقص | Compare active version modules and manifest read-only |
| RBAC coverage for cross-owner records | نیازمند اصلاح | Run negative authorization tests using fixtures only |
| Homepage and rollback validation | ناقص | Read-only probe and verified restore artifact |

Do not change candidatory-news-bot or @candidatoryiran. No secondary Worker, bot, preview, staging or test deployment.
