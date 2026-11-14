# Candidatory — Audit V5: Live D1 Schema Object Parity (2026-11-12)

## Read-only verification
Queried sqlite_master for types table/index/view/trigger on live Cloudflare D1 bindings, excluding sqlite_% names. No user rows read, no schema or Worker writes.
Production DB: 48b3c86b-45ea-492b-96e1-334dfafa2097. REVIEW_DB: 2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0.
Production objects: 85. Review objects: 106. All 85 production objects have a matching name/type and normalized SQL definition in review. Review has 21 additional objects. SQL normalization only collapses whitespace; does not verify table data, FK integrity or query plans.

## Review-only tables (5)
- assistant_usage_v1
- candidate_tasks_v1
- practice_sessions_v1
- public_content_drafts_v1
- quiz_guidance_v1

## Review-only indexes (8)
- idx_assistant_usage_day
- idx_assistant_usage_owner_day
- idx_candidate_tasks_owner_due
- idx_demo_payment_requests_status_date
- idx_demo_pending_subscription
- idx_practice_owner_date
- idx_public_drafts_owner_date
- idx_quiz_attempt_owner_date

## Review-only triggers (8)
- trg_assistant_global_daily_v1
- trg_assistant_user_daily_v1
- trg_candidate_tasks_quota_v1
- trg_demo_quota_calendar_v1
- trg_demo_quota_goals_v1
- trg_demo_quota_practice_v1
- trg_demo_quota_quiz_daily_v1
- trg_demo_quota_studio_v1

## Root-cause and design consequences
Review-only tables/indexes/triggers are feature and quota machinery, not merely presentation changes. Copying them blindly could enable experimental feature paths, unexpected quotas, or payment-related index semantics on production. A staged migration needs explicit feature dependency graph, trigger effect review, verified restore point and compatibility tests.

## Mandatory fix sequence
1. Read exact SQL for the 21 objects and map each to route/feature and business rule. Identify quota, payment and privacy effects.
2. Inspect PRAGMA table_info, foreign_key_list and index_list for affected parent tables. Confirm migration ordering and duplicate-name safety.
3. Create additive, idempotent migration scripts in canonical source, with per-step verification and rollback/restore instructions.
4. Run migrations against isolated test D1, test quota triggers, user isolation, and realistic failure cases. No production write yet.
5. Verify real signed Telegram users and route parity. Release a reversible feature flag for one module at a time.
6. Before production cutover, obtain backup/restore evidence and approve exact migration and deployment. Do not claim 10/10 before evidence.

## Scoring consequence
Data architecture score remains 5/10 (better diagnostic confidence, unresolved migration). Operational production-readiness remains NO-GO. Documentation quality can improve without changing the production score.

## Follow-up evidence needed
Live API route inventory, schema dependencies, migration rehearsal, user journey tests, official legal source owner, accessibility and incident drills.