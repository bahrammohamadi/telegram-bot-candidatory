# Phase 15 — staging D1 read-only ownership/schema audit (2026-11-10 UTC)

Scope: **staging only**. No row values, Telegram IDs, signed initData, secrets, receipts, or bookmarks are recorded. This is an API-observed metadata check, **not** a successful two-account acceptance test or an authorization proof.

## Verified via Cloudflare D1 API
- Database: `candidatory-integration-test-20261101` (requested isolated D1). Metadata reports 55 tables.
- Read-only table-name query found `candidate_tasks_v1`, `workspace_tasks`, and `lesson_progress` matching task/progress/report naming filters; absence of a separately named report table does not prove reporting is absent.
- `candidate_tasks_v1`: primary key `id`; required `telegram_id INTEGER` owner column; `title`, `details`, `priority`, `status`, `due_date`, `created_at`, `updated_at`, `done_at`.
- Owner/due index `idx_candidate_tasks_owner_due` exists; foreign key `telegram_id` -> `candidate_users.telegram_id` with ON DELETE CASCADE exists.
- `workspace_tasks` has `workspace_id`, `assignee_id`, `created_by`, and task status/priority fields. This is a distinct task model; cross-workspace authorization must be tested independently.
- Current D1 time-travel bookmark endpoint responded successfully. **No bookmark value is published and recoverability has not been tested.**
- All PRAGMA / SELECT calls reported `changed_db=false`; no staging rows were modified.

## Release blockers and next executable checks
1. Verify current branch SHA and GitHub Actions checks for **that SHA**; combined commit statuses alone do not establish Actions success.
2. Inspect Worker handlers for owner-scoped queries on **every** task/report read and write, and workspace membership checks. Schema-level foreign keys/indexes do not enforce read authorization.
3. Test valid signed Telegram initData, altered signature, missing/expired auth_date, and concurrent cross-user requests against staging; assert no D1 access before rejected authentication.
4. Test task-completion -> performance-report update with two consenting independent real accounts and narrow mobile viewports. Capture only redacted evidence in private storage.
5. Before any staging write or schema migration, create and verify a restorable staging-only backup; do not assume a bookmark alone is a validated restore.

## Rollback and scope
This document is metadata-only: revert its Git commit to remove it. No Worker deployment or D1 rollback is needed. For future staging changes, pin the previously verified Worker version and restore **only** the staging D1 backup after explicit scope verification. No production, payment, AI, notifications, or news Worker changes are authorized here.
