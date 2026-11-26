# Production-only release contract: candidate case/task APIs (2026-11-21)

Status: **SPECIFICATION ONLY — NO DEPLOYMENT**. Branch: `feature/cloudflare-parity-audit-2026-10-29`. Applies solely to the existing `candidatory-miniapp-api` Worker and existing Telegram bot/mini-app. Do not create staging, preview, another Worker, or a test deployment. Do not modify `candidatory-news-bot` or `@candidatoryiran`.

## Provenance
The authoritative 18-chapter user-authored architecture (v1.0, 1405-08-21 / 2026-11-12) was referenced in prior conversation but **verbatim text has not been recovered**. `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` is a condensed derivative, NOT the original. Never label a reconstruction as verbatim.

## Minimum executable offline contract before releasing case/task changes
1. Test Telegram initData validation with synthetic signed fixtures: valid signature, tampered hash, expired auth_date, missing required fields, mismatched user ID, malformed encoding; assert fail closed without database writes. Never use a real Telegram credential or user identity in tests.
2. RBAC table-driven synthetic cases for unauthenticated user, owner, non-owner, and administrator: every case/task read and mutation must check resource ownership and least privilege; deny cross-user ID enumeration without leaking existence.
3. For malformed JSON, unknown route, unsupported method, invalid payload, and denied RBAC: assert zero D1 prepare/bind/run/all calls that mutate data, and no user account upsert side effect.
4. For D1 failures: assert safe non-sensitive response; no SQL text, stack trace, secrets, or private user fields in response; log only redacted diagnostics.
5. Validate multipart artifact completeness: manifest main module, all imported modules, deterministic digest, compatibility date, D1 binding names `DB` and `REVIEW_DB`, AI `AI`, secret binding names only; compare against **fresh** read-only Production metadata. Do not copy secret values.
6. Ensure GitHub CI runs purely unit/static/contract tests with synthetic data and has no deployment, staging, preview, Worker upload, real D1 mutation, or paid AI step.
7. Obtain a complete, restorable snapshot of the currently deployed multipart bundle and documented restoration steps. Merely knowing an old version ID is insufficient proof of rollback.
8. Confirm the actual public production URL from authoritative routing/configuration, then GET-only unauthenticated health check. Never probe live authentication or write endpoints.

## Current read-only evidence (2026-11-21)
- GitHub branch HEAD at review: `550c3c9e7bde7ec9ffa73cc72c4412299200c353`.
- Cloudflare latest deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`, 2026-11-11T20:05:53Z, 100% version `3c35231f-36f0-4bad-b786-9a4309d8e868`.
- Compatibility date: `2026-10-27`. Binding names/types: `DB` D1, `REVIEW_DB` D1, `AI` AI, four secret_text bindings `ADMIN_TELEGRAM_IDS`, `ADMIN_TELEGRAM_IDS_MAHDI`, `AVALAI_API_KEY`, `TELEGRAM_BOT_TOKEN`. No values requested.
- Current-HEAD Actions conclusions and public URL health not independently established in this record. No production change authorized.

## Gap matrix
| Scope | Classification | Required evidence |
|---|---|---|
| Existing Worker identity/deployment/binding names | سالم | Fresh read-only Cloudflare API evidence above |
| Explicit offline auth/RBAC test contract | جدید | This specification; implementation and CI still pending |
| Verbatim 18-chapter master document | ناقص | Recover original exact message, then version it without rewriting |
| Multi-module deployed bundle parity | ناقص | Byte-level manifest/digest and module comparison |
| Cross-user case/task authorization | نیازمند اصلاح | Table-driven negative tests and successful CI |
| Public GET-only smoke and rollback proof | ناقص | Confirmed URL, safe GET result, restorable complete bundle |

**Release decision: NO-GO** until every required gate is evidenced. No Worker, D1, route, bot, channel, secret, or deployment modified by this documentation commit.
