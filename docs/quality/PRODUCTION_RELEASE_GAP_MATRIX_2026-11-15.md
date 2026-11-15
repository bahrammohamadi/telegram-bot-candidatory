# Candidatory — evidence-based release gap matrix (2026-11-15)

Scope: existing Telegram bot / Mini App and production Worker `candidatory-miniapp-api` ONLY. This document is non-deployable. Do not create any second runtime, preview, staging or test deployment. Do not touch `candidatory-news-bot` or `@candidatoryiran`.

Reference: 18-chapter architecture v1.0 dated 1405/08/21. The repository's `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` explicitly identifies itself as a *compressed rewrite*, **not** a verbatim archival copy. Do not falsely label it as verbatim.

| Area / chapter | Classification | Evidence and next action |
|---|---|---|
| 1–4 Product, principles, roles, journey | ناقص | Compressed architecture exists; verify exact original and server-side workspace RBAC before changing permissions. |
| 5 Five-tab mobile RTL | نیازمند اصلاح | `miniapp/public/app.js` currently guards `switchTab` against missing/invalid panels. Verify five-tab HTML correspondence and mobile accessibility with synthetic tests. |
| 6–9 Modular monolith, modules, data, API | ناقص | Must compare full production multipart module hashes and D1 schema with repo before deployment; no live write or migration. |
| 10–12 AI, subscription, security | نیازمند اصلاح | No paid AI calls, payment, or access change without separate authorization; validate server-side entitlements and privacy with static/contract tests. |
| 13–16 DevOps, quality, operations | ناقص | GitHub commit status endpoint may return empty statuses, which does not establish successful Actions checks. Inspect workflow runs independently. Require verified rollback artifact. |
| 17–18 Phases and acceptance | جدید | Define per-slice acceptance evidence: passing CI, security/RBAC, production parity, rollback, read-only smoke. |
| Verbatim 18-chapter archival record | ناقص | Recover exact original user message and commit a separately named verbatim file with provenance; never replace original with summary. |
| Production bindings presence | سالم (existence only) | Cloudflare read 2026-11-15: 2 D1 bindings `DB`, `REVIEW_DB`; 4 secret_text bindings (names only); 1 AI binding. This does not prove DB schema or secret correctness. |
| Production deployment | سالم (observed state only) | Cloudflare read 2026-11-15: deployment `860f813c-baf4-4cff-bfc7-bb4120b910ed`, version `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic, created 2026-11-11T20:05:53Z. Not authorization to deploy. |
| Live URL read-only smoke / rollback | ناقص | Exact production URL and tested rollback bundle must be independently verified. Historical version ID alone is not a recovery plan. |

## Mandatory production gate
No deploy until (1) latest branch SHA and ALL relevant Actions checks pass; (2) multipart code and metadata/bindings/routes/D1 are reconciled; (3) synthetic static/unit/contract/RBAC tests pass; (4) immutable rollback bundle and restoration procedure are verified; (5) only the existing production Worker is targeted. Never test writes/auth against real production data. If sufficient confidence is impossible without a second environment, **do not deploy**.

## Current action
This documentation commit is the only intended mutation; no Worker deployment, D1 migration, real payment, AI consumption, broadcast or RBAC modification is authorized.
