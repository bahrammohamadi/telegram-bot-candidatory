# ADR-001 — Remove implicit account writes from authenticated GET (proposal, not deployed)

Date: 2026-11-20. Scope: existing `candidatory-miniapp-api` only. Status: **PROPOSED / RELEASE BLOCKED**. Source baseline: `miniapp/src/worker.mjs` blob `d91af0ac6bf842f34a7e0557eced52284c2604c7`.

## Observed behavior
The current repository handler validates Telegram initData, then unconditionally executes `INSERT INTO accounts ... ON CONFLICT ... DO UPDATE` before dispatching any authenticated `/api/*` path. Thus GET `/api/overview`, `/api/courses`, `/api/assessment-v2/history` and even unknown authenticated API paths mutate the accounts table. This is a **repository finding**, not a claim about the deployed multipart Worker.

## Proposed implementation (no code change authorized by this ADR)
1. Keep signed initData verification and user identity derivation exactly as-is.
2. Move account upsert into an explicit, intentional, authenticated onboarding/write flow. Do **not** automatically upsert on GET or on invalid POST.
3. Audit every existing write handler for dependence on an accounts row (foreign keys, triggers, joins, first-use experience). Preserve existing rows and ensure new users can intentionally create their account before submitting profile/tasks/assessment.
4. On GET with no account row, return a documented non-mutating response (or an explicit onboarding-required response); preserve the existing response schema for enrolled users.
5. Enforce owner-scoped queries using authenticated Telegram identity, never caller-supplied telegram_id.

## Offline acceptance cases — synthetic D1 only
- Valid signed GET to overview, courses, assessment history: no SQL INSERT/UPDATE/DELETE/REPLACE, for both existing and absent synthetic accounts.
- Invalid/expired/replayed-as-applicable initData: 401 and **zero** D1 calls.
- Valid signed GET to unknown /api path: 404 and zero writes.
- Invalid POST payload: no account creation and no other write.
- Explicit authenticated onboarding: one intentional account write; repeat is idempotent; user identity cannot be overridden by request body.
- Profile/task/assessment writes for enrolled users preserve prior behavior and ownership; no cross-user reads or writes.
- Synthetic DB adapter records each prepared statement and bound arguments; assertions reject all write SQL for read routes. No real D1, no deployed test environment.

## Mandatory release gates
Exact SHA CI green; full multipart module and asset hash parity; Worker metadata/routes/bindings/D1 and secret **names/types** verified without values; static and behavioral security checks; verified existing-version rollback procedure; verified canonical URL for **unauthenticated** read-only smoke only. No authenticated production smoke, production DB writes, migration, paid AI, mass notification, payment or role change. Do not create staging/preview/second Worker.

## Gap classification
| Requirement | Status |
|---|---|
| Existing production Worker identified | سالم |
| Source-level implicit-write defect identified | نیازمند اصلاح |
| Implementation + offline behavioral regression | ناقص |
| Explicit onboarding design decision | جدید |
| Verbatim 18-chapter architecture recovered | ناقص |
| Multipart parity, rollback and release evidence | ناقص |

This ADR is not proof of deployed behavior and does not authorize deployment. Worker `candidatory-news-bot` and channel `@candidatoryiran` remain out of scope.
