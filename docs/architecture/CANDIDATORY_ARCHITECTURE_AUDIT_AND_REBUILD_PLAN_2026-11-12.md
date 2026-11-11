# Candidatory Mini App — Architecture Audit and Rebuild Plan (2026-11-12)

## Evidence
Reviewed GitHub development HEAD 5fc213ae, miniapp source/auth/README, Cloudflare phase15 parity audit, live production Worker, and read-only sqlite_master table names for production and review D1 databases.

## Verified findings
1. Live main Worker version 3c35231f routes the home page to a preview module with REVIEW_DB, not production DB; the UI still says preview and calls /review/api endpoints.
2. Code is duplicated across candidatory-original, candidatory-patched, miniapp, and cloudflare-live phase snapshots. There is no verified single reproducible canonical production build.
3. miniapp/src/auth.mjs implements signed Telegram initData validation, but live API route-by-route enforcement has not been verified.
4. Review D1 has five tables missing from production D1: assistant_usage_v1, candidate_tasks_v1, practice_sessions_v1, public_content_drafts_v1, quiz_guidance_v1. Matching table names do not prove column/index parity.
5. CI regression suites exist, but live Telegram WebView two-user isolation and backup restoration remain unverified.

## Target architecture
Keep one existing production Telegram mini-app and one canonical Cloudflare Worker deployable, not a new bot. Adopt an evolutionary modular monolith: entrypoint/router, Telegram identity, owner/workspace authorization, validation/error contracts, D1 repositories and migrations, module services, and responsive RTL frontend. Organize features into profile/onboarding, readiness/assessment, learning/quiz, tasks/goals/calendar, progress/reporting, speech practice, assistant, content studio, entitlements/payments, notifications, admin/audit, privacy/support. Maintain API versioning (/api/v1), compatibility aliases, idempotent schema migrations, structured PII-safe logs, rate limits, monitoring and rollback. Keep news Worker isolated.

## Phases and acceptance gates
P0 — Inventory: compare every route, frontend call, database table/column/index and Worker binding. Deliver route-to-table matrix, schema diff, live artifact hashes, rollback baseline.
P1 — Foundation: reproducible build, one canonical source tree, extracted router/auth, error contracts, schema migration ledger and CI. Gate: exact artifact, bindings and compatibility proven.
P2 — Identity/data: align schema additively, preserve existing users, verify two signed Telegram accounts and cross-account denial, restore rehearsal. Gate: existing production records accessible only to owner.
P3 — Core modules: dashboard, profile, tasks, goals, calendar, assessment, quiz, learning, reporting. Gate: each journey read/write/edit/delete, authorization and 320/375/430 mobile QA.
P4 — Advanced modules: speech practice, assistant, studio, AI consent/budget, optional notifications, private file handling. Gate: privacy, cost and graceful failures verified.
P5 — Commercial/admin: subscriptions, entitlements, manual payments, admin RBAC, audit and receipts. Gate: secure payment state transitions; real payment requires separate authorization.
P6 — Operations: monitoring, incident playbook, backup/restore, release pipeline, performance budgets, documentation and acceptance.

## Immediate actionable backlog
1. Read-only PRAGMA table_info/index_list/foreign_key_list on both D1 databases; produce exact schema diff.
2. Export and hash the three live Worker modules, record settings and deployment, implement reproducible build without touching secrets.
3. Map every /review/api frontend request to handler, auth check, DB table and target production behavior.
4. Add regression tests for Telegram signature, ownership, schema compatibility, and current client routes.
5. Create additive migrations for five missing feature tables after checking column/index contracts; backup and restore before live write.
6. Move modules one at a time to production data with rollback, then retire preview labels and endpoints only when they are genuinely production-backed.

## Rules
User wants changes visible on the existing production mini-app. Do not create a replacement public bot. Never blindly replace REVIEW_DB with DB, execute destructive live migrations, expose secrets or private data, or modify candidatory-news-bot. Each iteration must report commit, tests, deployment/version if any, and remaining gaps. This document is a plan, not proof of completed features or deployment.