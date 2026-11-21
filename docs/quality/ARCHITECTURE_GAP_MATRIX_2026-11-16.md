# Candidatory v1.0 — architecture gap matrix (2026-11-16)

Scope: existing Telegram bot and candidatory-miniapp-api Production only. This document is NOT a release authorization. No new environment, deployment, or data mutation is permitted.

Source authority: user-supplied 18-chapter architecture, dated 1405-08-21. The exact original full text has not yet been independently recovered; chapter numbers and verbatim requirements MUST NOT be invented. The following mapping is thematic and provisional pending exact archival.

| Capability / architecture area | Status | Evidence / acceptance gate |
|---|---|---|
| Existing production Worker and deployment inventory | سالم | Cloudflare deployment 860f813c-baf4-4cff-bfc7-bb4120b910ed; version 3c35231f-36f0-4bad-b786-9a4309d8e868, 100% at read time |
| Five mobile RTL tabs: امروز، مسیر من، کارها، یادگیری، حساب | نیازمند اصلاح | Screenshot-independent source review, keyboard/accessibility tests, mobile viewport static checks and user-flow contract tests |
| Candidate profile and journey | ناقص | API/schema mapping and permission checks per state transition |
| Tasks and milestones | ناقص | Offline lifecycle tests, ownership and idempotency cases |
| RBAC and data isolation | نیازمند اصلاح | Explicit deny-by-default role-action matrix, negative tests with synthetic identities |
| Modular Monolith and versioned API | ناقص | Module manifest, route contract snapshot and backward compatibility checks |
| D1 data model | ناقص | Read-only schema introspection; migration forbidden without separate authorization |
| Controlled AI | نیازمند اصلاح | Human approval, no political persuasion/profiling, no paid calls without authorization |
| Subscription/payment | جدید | Design only; no real payment or charge without authorization |
| Security and privacy | نیازمند اصلاح | Offline signed initData regression, secret-name-only inventory, no production auth writes |
| CI / release gates | ناقص | All checks must pass for exact candidate SHA and full multi-module artifact |
| Production rollback | ناقص | Exact current source + metadata + bindings (without secret values), validated restoration instructions |
| Verbatim 18-chapter reference archival | ناقص | Retrieve full user-authored text, checksum, commit to versioned docs without paraphrase |
| Independent public URL read-only smoke | جدید | Confirm actual configured route, then GET/HEAD without credentials or mutation |

## Mandatory pre-deployment decision

BLOCK until: exact source parity (entrypoint.mjs, legacy.mjs, preview.mjs and MIME/main-module), D1 and route compatibility, complete RBAC regression, successful CI for the candidate SHA, archived rollback bundle, and independently verified public URL. A CI green status alone is insufficient. Never use production data for write tests. Never touch candidatory-news-bot or @candidatoryiran.

## Next implementable slice

Prepare an offline role-action contract for candidate-owned tasks and profile views using synthetic principals; first identify the actual routes from the existing source and D1 schema. Do not create speculative production endpoints. After tests and release gates pass, publish only to the existing Worker.
