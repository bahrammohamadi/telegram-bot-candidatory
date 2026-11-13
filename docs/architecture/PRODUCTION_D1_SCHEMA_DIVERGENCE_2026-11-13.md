# Production D1 schema inventory — 2026-11-13 (read-only)

Scope: ONLY the existing `candidatory-miniapp-api` Worker. This evidence was collected using read-only `SELECT name,type FROM sqlite_master ...` on each existing D1 database; no row values, secrets, writes, migrations, or deployments.

## Verified schema divergence

- `DB`: database id `48b3c86b-45ea-492b-96e1-334dfafa2097`.
- `REVIEW_DB`: database id `2b5f5ef4-d2fa-4234-a62c-e568cb45e4b0`.
- Both queries returned success. Both contain tables for `candidate_users`, `candidate_profiles`, `candidate_profile_details`, `candidate_checklist_items`, `workspace_tasks`, `personal_action_plans_v1`, `lesson_progress`, `candidate_subscriptions_v2` and `admin_audit`.
- `REVIEW_DB` additionally contains at least these tables not present in the `DB` inventory: `assistant_usage_v1`, `candidate_tasks_v1`, `practice_sessions_v1`, `public_content_drafts_v1`, `quiz_guidance_v1`.
- The live entrypoint previously observed routes normal miniapp traffic to `preview.fetch` with `DB: env.REVIEW_DB`. Therefore blindly switching the binding to `DB` risks missing-table failures and/or apparently lost user state. This is **not** evidence that REVIEW_DB is a separate deployment: it is a binding on the one production Worker.

## Classification / release decision

- **سالم**: read-only metadata query access to both existing D1s.
- **نیازمند اصلاح**: naming/canonical ownership mismatch; live app points to REVIEW_DB while a distinct DB binding exists.
- **ناقص**: full schema columns/indexes/foreign keys, migration history, row-count-only comparison, repository SQL compatibility, HTTP smoke, exact multipart hashes and rollback proof.
- **جدید**: no new runtime or D1 is authorized or required by this finding.

**BLOCK RELEASE.** Do not change DB binding, copy rows, run login/write tests, or migrate until canonical ownership and data preservation are demonstrated. Next: compare `PRAGMA table_info`, `PRAGMA index_list` and `PRAGMA foreign_key_list` for task/profile tables read-only; compare repository queries and migrations; assess row counts without accessing row values. Preserve both existing databases.

Repository branch before this commit: `74df60528b66791ff6145cf08ed0abd505c95562`, verified by compare API (identical). Source: Cloudflare D1 query API, 2026-11-13 UTC. No production deployment performed.
