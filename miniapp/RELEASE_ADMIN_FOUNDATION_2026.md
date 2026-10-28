# Candidatory — Release 2026-10-27: Workspace/Admin Foundation
Status: DEPLOYED TO CLOUDFLARE (platform acceptance tests pending)
Cloudflare Worker: candidatory-miniapp-api
Deployment: e6198dd699d74ec0872862d78eb5c184
D1: candidatory-miniapp (48b3c86b-45ea-492b-96e1-334dfafa2097)
Bot: @candidatoryiran_bot — secret remains in Cloudflare, not repository

## Deployed now
- Existing Telegram Mini App retains 12 published lessons, 2 quizzes (10 questions), private notes, bookmarks, daily goals, progress.
- Tenant/workspace create and switch; membership record with owner/admin/editor/member/auditor roles; invite-by-Telegram ID requires the invitee to open the app and accept.
- Workspace task creation/priority/status updates; events with dates and location; basic public-commitment record, expense log.
- Workspace content drafts and review/approval flow (not public publishing), scoped change audit log.
- Platform-admin endpoints for global statistics, workspace metadata, lesson creation/editing/publication, quiz creation/question addition/publication, gated by explicit ADMIN_TELEGRAM_IDS secret.
- Server-side role authorization and workspace membership check on all operations; default deny for nonmembers, restricted finances/drafts.
- ALL sensitive member actions use signed Telegram initData (HMAC) at Worker entry.
- D1 tables and indexes applied by migration_workspace_admin.sql, verified after deployment.

## REQUIRED: platform super-admin bootstrap
1. Open Mini App inside Telegram, visit Profile, copy your numeric Telegram user ID.
2. In Cloudflare Worker candidatory-miniapp-api > Settings > Variables and Secrets, add **ADMIN_TELEGRAM_IDS** of type **Secret** whose value is the numeric user ID (comma-separated for multiple admins). Do not put bot token or admin IDs in GitHub, screenshots or messages.
3. Reopen Mini App. Tap Management. The platform admin buttons appear only for IDs validated against Telegram-signed session data and the server-side allowlist.
4. For a higher-risk production deployment, add phishing-resistant MFA/step-up auth for privileged updates, dual approval for destructive operations, and admin access telemetry. Current bootstrap by Telegram ID + signed initData is a foundation, not a final high-assurance admin identity system.

## Tenant admin quick start
- Inside Telegram, tap Management > Create Workspace.
- Add tasks, sessions, draft content, proposals/commitments and expense records.
- Team member must first open Mini App; manager sends invitation to that member's numeric Telegram ID. Invitee accepts in their own Management tab.
- No automatic user enrollment from knowledge of an ID.
- Editors can draft content; only manager roles can approve. Members/auditors cannot write and cannot access privileged financial or draft data.

## Verified
- Cloudflare API reported deployment success.
- Existing D1 binding and TELEGRAM_BOT_TOKEN (secret_text) are preserved.
- Queried D1 after deployment: workspaces, workspace_members, workspace_invitations, workspace_tasks, workspace_events, workspace_expenses, public_commitments, content_revision_requests and admin_audit tables present.
- Existing public content counts unchanged: 12 lessons, 2 quizzes, 10 questions.

## NOT verified / NOT completed
- Browser/Telegram authenticated end-to-end create/edit/reload flows; environment cannot access the public workers.dev hostname.
- External admin security testing, invitation concurrency test, multi-tenant penetration test, load testing, backups & recovery drills, release monitoring.
- File storage, advanced reporting exports, billing, payments, SMS, AI integration, legal case documentation and full legacy bot migration.
- Full-database restoration from the old Appwrite project has NOT been performed.
- Platform Super Admin remains disabled until ADMIN_TELEGRAM_IDS is configured; do NOT add a hardcoded ID as a workaround.
- Before commercial launch, legal and privacy review for relevant jurisdiction and collection of sensitive personal info.

## Acceptance checklist
[ ] Admin numeric ID secret configured; no other account can open platform administration.
[ ] Workspace A owner cannot read/workspace B even with manually modified workspaceId.
[ ] Workspace member cannot read finance ledger or draft CMS contents; auditor cannot write.
[ ] Editor cannot grant admin roles or approve drafts.
[ ] Invitation can be accepted only by named Telegram ID within expiry.
[ ] Reopen Telegram after task/expense/lesson-note save and confirm durable persistence.
[ ] Admin can create unpublished lesson, approve then publish. Public catalog reflects publication.
[ ] Admin can create unpublished quiz, add two options or more, then publish.
[ ] Existing 12 lessons, 2 quizzes, quiz attempts & previous notes remain intact.
[ ] Mobile, desktop Telegram Web, accessibility, safe-area layouts, notifications and error states.
[ ] Backup/export and data deletion requests fully tested prior to public production.

Notes: this platform can assist with neutral educational and administrative duties; no demographic persuasion targeting or profiling is implemented.

## 2026-10-27 continuation release
Latest Worker deployment verified via Cloudflare API: `11519130e5824a659aa528ad455b4a88`.
- Tenant-scoped JSON operational report and permissions-filtered expense totals.
- Workspace invitation acceptance required for team membership; expires after seven days.
- Admin lesson CMS: create/edit/publish/unpublish; admin quiz bank: create/add question/publish/unpublish; both require `ADMIN_TELEGRAM_IDS`.
- Regression fix to Telegram bot-token HMAC: **exclude only hash**; keep third-party `signature` in HMAC data-check string, as Telegram documentation requires. Regression test: `miniapp/tests/telegram-hmac.test.mjs`.
- Verified Cloudflare D1 remains connected; Telegram token is `secret_text`, old lessons/quizzes unchanged.
- Operator must configure numeric `ADMIN_TELEGRAM_IDS` Secret and test login from Telegram. No owner identity inferred automatically.
- Browser/network E2E testing remains unverified due to sandbox restrictions. Do not claim all original bot capabilities are migrated.
