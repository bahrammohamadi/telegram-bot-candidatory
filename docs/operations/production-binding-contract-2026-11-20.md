# Production binding contract and release blocker — 2026-11-20 UTC

Scope: existing `candidatory-miniapp-api` only. Read-only Cloudflare API inspection; **NO DEPLOY**. Never create staging/preview/test Worker. No changes to `candidatory-news-bot` or `@candidatoryiran`.

## Current production deployment (Cloudflare GET 2026-11-20)
- Deployment: `860f813c-baf4-4cff-bfc7-bb4120b910ed`
- Version: `3c35231f-36f0-4bad-b786-9a4309d8e868`, 100% traffic, created 2026-11-11T20:05:53.015284Z
- Compatibility date: `2026-10-27`; flags: none; usage model: standard.

## Exact nonsecret binding contract
| Binding | Type | Identifier (nonsecret) |
|---|---|---|
| DB | d1 | `48b3c86b-45ea-492b-96e1-334dfafa2097` |
| REVIEW_DB | d1 | `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0` |
| AI | ai | existing catalog |
| ADMIN_TELEGRAM_IDS | secret_text | value must never be read or committed |
| ADMIN_TELEGRAM_IDS_MAHDI | secret_text | value must never be read or committed |
| AVALAI_API_KEY | secret_text | value must never be read or committed |
| TELEGRAM_BOT_TOKEN | secret_text | value must never be read or committed |

## Offline release contract (must fail closed)
1. Compare all seven binding names/types, both D1 IDs, compatibility date/flags, entry module and routes against a fresh Cloudflare GET. Never upload partial metadata or a single module.
2. Require immutable full multipart module inventory, hashes, source archive, verified recovery instructions, and CI success on **exact** candidate SHA.
3. Test authorization denial and cross-workspace ownership on synthetic fixtures only. Never perform authentication probes or write tests on production.
4. Read-only smoke on verified original public URL only; log timestamp, HTTP status and version. No inferred URL.
5. Verbatim original 18 chapters are **not yet recovered**; condensed `docs/architecture/CANDIDATORY_MASTER_ARCHITECTURE_V1_2026-11-12.md` is not the authoritative original.

## Gap matrix
| Area | Status | Reason |
|---|---|---|
| Production deployment and seven binding identities | سالم | Fresh Cloudflare GET |
| Exact D1 ID contract in GitHub | جدید | This document |
| Original 18-chapter verbatim architecture | ناقص | Not retrieved |
| Multipart module hashes and route/schema parity | ناقص | Not verified |
| RBAC real handler synthetic tests | نیازمند اصلاح | Not demonstrated |
| CI on proposed deploy SHA | ناقص | Not verified |
| Immutable rollback artifact and recovery | ناقص | Not verified |
| Public URL smoke | ناقص | Not performed |

**Release decision: BLOCKED.** Historical version IDs are not rollback artifacts. Re-check live configuration before any later release.
