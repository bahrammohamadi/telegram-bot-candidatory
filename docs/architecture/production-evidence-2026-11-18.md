# Production binding and CI evidence — 2026-11-18 (read-only snapshot)

Scope: `candidatory-miniapp-api` ONLY. This file is evidence, not a deploy manifest or authorization to deploy. No second environment is permitted.

## Cloudflare observations (2026-11-18)
- Active deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`
- Active version (100% traffic): `3c35231f-36f0-4bad-b786-9a4309d8e868`
- Deployed at: `2026-11-11T20:05:53.015284Z`
- Compatibility date: `2026-10-27`; usage model: standard; compatibility flags: none.
- Bindings: `DB` (D1, `48b3c86b-45ea-492b-96e1-334dfafa2097`), `REVIEW_DB` (D1, `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`), `AI` (Workers AI), and secret names `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN`. Secret values were not accessed.
- Source: Cloudflare Workers GET deployments/settings/script-settings. No deployment performed.

## GitHub evidence
- Last specifically inspected SHA: `45c65d3a7ea6092e12e572d4dbf86a2330d97cb9` (not asserted to be current HEAD).
- Candidate task contract static gate: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44185435327 — success (read 2026-11-18).
- Worker multipart artifact parity: https://github.com/bahrammohamadi/telegram-bot-candidatory/actions/runs/44185435752 — success (read 2026-11-18).
- GitHub combined commit status endpoint returned no statuses; absence of statuses does not invalidate observed workflow conclusions, nor prove complete release readiness.
- `tests/offline/candidate-ownership-contract.test.mjs` is a **synthetic harness**, explicitly not testing production handlers. Passing it does NOT prove production RBAC.

## Release blockers
1. Full verbatim 18-chapter architecture source has not been recovered and versioned.
2. Verify latest branch HEAD, current workflow coverage, full deployed multi-module bundle and module hashes.
3. Verify routes, domain/entrypoint, D1 schema compatibility, secret names and metadata before release.
4. Test real handler RBAC/ownership logic with synthetic fixtures, not production writes.
5. Produce a verified restorable multi-module rollback bundle and evidence of restore procedure.
6. Read-only health probe of the exact canonical production URL remains unverified.

## Gap classification
- سالم: observed active deployment and binding names; recorded offline workflow success.
- ناقص: verbatim architecture, HEAD reconciliation, real-handler tests, deployed module hash parity, canonical URL health, rollback artifact.
- نیازمند اصلاح: treating synthetic tests as evidence of production handler security.
- جدید: dated evidence snapshot and explicit no-release blockers.

**Decision: NO DEPLOY.** No database mutation, production authentication test, paid AI call, notification, or secret disclosure authorized.
