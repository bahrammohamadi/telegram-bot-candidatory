# Candidatory — Product Research, Gap Audit & Implementation Blueprint
Date: 2026-10-27 | Status: PROPOSED, NOT DEPLOYED
Repository: bahrammohamadi/telegram-bot-candidatory
Current platform: Telegram Mini App + Cloudflare Workers + D1
Scope: neutral, non-manipulative educational, operational, administrative, accountability and compliance features. Campaign persuasion targeting by sensitive personal characteristics and automated political profiling are out of scope.

## 1. Findings (confirmed from code + active D1 deployments)
Legacy main branch: src/flows/educational.js, src/constants/questions.js, src/flows/admin.js, src/utils/admin-auth.js, src/flows/analysis/{readiness,swot}.js, src/flows/campaign/{promises,rivals,crisis}.js, src/flows/content/generator.js, src/flows/dashboard.js, src/constants/plans.js. Legacy workflows rely on Appwrite, conversation state and plan gates; they are not migrated by simply copying the UI.
Current mini app: 12 public lessons, 2 general-knowledge quizzes (10 questions), Telegram initData verification, bookmarks, notes, daily goal and attempts in Cloudflare D1, plus public read-only catalog. No true admin authorization, multi-tenant candidate workspaces, content CMS, billing, secure file uploads, scheduling, or independent E2E test suite.

## 2. Product modules (desired, not claims of implementation)
P0 — Core integrity:
1. Dedicated workspace for each candidate or organization with immutable workspace_id on every owned row.
2. Membership invitations, role approval and revocation; owner, platform admin, workspace admin, editor, trainer, learner, finance viewer, auditor and support roles.
3. Permissions enforced on EVERY Worker endpoint with default-deny, not merely hidden frontend buttons.
4. Audit trail: actor, workspace, action, record, timestamp, change summary; no sensitive token/plaintext secrets.
5. Privacy: informed consent, purpose-limited data, export/correction/deletion requests, field minimization, retention rules, encrypted sensitive fields as appropriate.
6. Backup and tested restore, schema migrations, staging, rollback, error reporting, accessibility.
7. Admin MFA/step-up authentication for destructive privileged actions; Telegram initData alone is not sufficient for unrestricted platform root access.
P1 — Education and assessments:
8. Courses, modules, lessons, attachments, video/audio links, prerequisites, progress tracking.
9. Question bank tagged by topic/difficulty, time limits, randomized ordering, explanations, retakes, pass thresholds.
10. Distinguish objective knowledge quizzes from self-assessment surveys; clearly label self-reported scores as not validated predictions.
11. Learning paths, daily goals, reminders (opt-in), notes, bookmarks, badges, certificates (non-accredited unless approved), resource library.
12. Candidate knowledge areas: legal compliance, ethical conduct, public service responsibilities, communications clarity, cybersecurity, accessibility, budgets, transparent reporting, media literacy.
13. Instructor/editor CMS with draft/review/approved/published states, version history, publication windows, question quality checks.
P1 — Candidate operations:
14. Candidate workspace profile with jurisdiction, election type and timeline; avoid requiring national ID until justified and secured.
15. Project/task management: ownership, priorities, checklists, dependencies, due dates, calendars.
16. Team/volunteer roster with consent, availability, role training, safe task assignment, incident reporting.
17. Meeting/event manager with calendar, attendance, venue, accessibility requirements, operational checklists and post-event notes.
18. Policy proposal/promise tracker: subject, owner, milestones, evidence, budget feasibility, publication status, progress; do not suggest targeting voters.
19. Knowledge center for official regulations with jurisdiction/date/source/last-verified labels and manual legal review.
20. Document center with categories, review approvals, metadata, versioning, retention and controlled downloads.
21. Budget/expense ledger with receipts, category, approval, reconciliation and audit exports; jurisdiction-specific legal rules configurable, NOT presumed.
22. Public inquiry / citizen issue intake with consent, categories, case status and aggregate, privacy-preserving reporting; no sensitive-profile political persuasion.
23. Issue transparency and evidence-based public progress reporting.
24. Crisis and security incident playbooks: incident register, escalation, contacts, status, verified public notice and post-mortem.
25. Public events and newsroom/content repository with factual verification, source attribution, content approval and correction logs.
P2 — Reporting and integrations:
26. Candidate and team home dashboard, task completion, learning outcomes and budget reporting.
27. Reporting builder with filters, PDF/CSV exports and permission-aware aggregation.
28. Controlled Telegram notices for opt-in users; message delivery, quiet hours and opt-out controls.
29. Calendar feed/ICS, secure file uploads (Cloudflare R2 if quota permits), optional storage-provider integrations.
30. AI for neutral document summarization, training explanations, proofreading, administrative meeting minutes and regulatory source retrieval; no unreviewed claims, no manipulative demographic targeting or auto-posting.
31. Multi-language Persian RTL + English LTR, accessibility, local dates/timezones.
32. User-facing privacy center, notices and account/data deletion process.

## 3. Platform-admin console (separate from candidate workspace admin)
Platform admin dashboard:
- Overview of workspaces, active users, login failures, Worker/D1 quota status, content publication queue, incidents, app versions.
- Workspace lifecycle: create, suspend, archive, ownership transfer with two-person approval for high-risk operations.
- RBAC policy manager: scoped grants, no self-privilege escalation, default-deny, no implicit 'all data' superuser impersonation.
- User management: approved invitations, suspend/reinstate, membership history, credential/session invalidation.
- Content admin: courses/questions/media/tags/localization/draft approval/version diff, rollback.
- Billing/plan management as separate future module: product access levels, manual entitlements, invoice trails; never store card numbers.
- Audit/exceptions: immutable append-only audit log, sensitive data access reasons, export logs.
- Configuration: feature flags, bot status/webhook checks, secret presence only (never secret values), integrations, legal jurisdictions.
- Data governance: retention/deletion queue, backups/restore tests, export and access requests.
- Support: tickets, error contexts with redacted personally identifiable information, no unrestricted access to candidate private notes by default.

Workspace admin: manage only members, lessons/tasks/documents/budgets/events within its own workspace.
Editors: only publish if approved under workflow.
Finance viewer: budget read-only, no unnecessary access to private lessons or personal fields.
Learner/candidate: only own course progress/notes and workspace records explicitly granted.
Auditor: scoped, read-only, time-bounded access, audited.
Support: temporary access only with consent and expiry.

## 4. Initial data model
workspaces(id,name,jurisdiction,status,created_at)
memberships(workspace_id,telegram_id,role,status,invited_by,joined_at)
roles(id,scope,name), permissions(id,key), role_permissions(role_id,permission_id)
admin_audit_events(id,workspace_id,actor_id,action,entity_type,entity_id,metadata_redacted,created_at)
courses(id,workspace_id,title,status,version), modules(id,course_id,position,title)
lessons + course_lessons or curriculum_placements; progress keyed by (workspace_id,member_id,lesson_id)
question_banks, questions, quiz_forms, quiz_attempts, attempt_answers
tasks, task_comments, task_attachments
events, event_registrations, attendance
public_proposals, proposal_milestones, proposal_evidence
budgets, expense_entries, expense_attachments, approvals
content_items, revisions, approvals, citations
support_tickets, incident_reports, consent_records, privacy_requests
notification_preferences, notification_outbox, delivery_attempts
feature_flags, integration_status, legal_sources, release_versions
Use foreign keys, indexed tenant/workspace columns, prepared parameterized queries, server-side entitlement gates. Public resources must be explicit and narrowly defined. Existing candidate_users/lessons/quizzes require additive migration and tenant policy design, not destructive rewrites.

## 5. Security hazards in existing prototype
- The mini app currently has no true RBAC or admin API; frontend gates cannot substitute backend authorization.
- Public catalog and read-only lesson and question endpoints intentionally expose published material, including all quiz questions; acceptable only for openly accessible courses.
- request_limits may grow without a cleanup job; once-per-minute writes on authenticated requests consume D1 write quota.
- Telegram initData HMAC protection is implemented; further validate token identity and secret handling; rate limit malformed/unauthed requests at edge before DB.
- Dynamic rich content needs safe Markdown rendering/sanitization and file upload verification.
- Do not migrate legacy national ID and phone data by default: establish necessity, consent and secure storage.
- Avoid exposing quiz answer keys, admin session secrets or private notes to other workspaces.
- Cloudflare D1 Free is limited, including 500 MB MAX PER DATABASE and 5 GB aggregate storage (confirmed 2026-10-24), 5m rows read/day, 100k rows written/day; add retention, indexes and monitoring.
- Do not assume campaign-advertising requirements are uniform. Legal regimes vary by country, election, date and platform; human legal review needed.

## 6. Phased delivery & acceptance checks
Phase A — hardening foundation: establish workspaces + scoped membership + platform admin bootstrap from secure ADMIN_TELEGRAM_IDS secret + admin audit events + tests for cross-tenant isolation. No privileged endpoint before tests.
Phase B — genuine content management: add CRUD for courses/lessons/quizzes/drafts, publishing workflow and permission checks; preserve 12 current lessons and attempts.
Phase C — assessment upgrade: explanations, tagged question bank, records, export, question-level review; distinguish non-objective self-assessment.
Phase D — productivity: tasks, calendars, team role management, meeting notes, user notifications.
Phase E — transparency and compliance: document management, budgets, proposal tracker, public inquiry intake with minimal data and legal configurations.
Phase F — reporting / optional AI: analytics dashboards, CSV/PDF, admin audit views, source-grounded neutral AI features.
For each phase: seed/recovery migration, API test including 401/403 cross-tenant and authorization regression, accessibility/mobile test, browser Telegram test, audit + quota review, rollback plan.
Do not merge the existing draft branch or claim production readiness before true E2E checks.

## 7. Research references
Telegram signed initData: https://core.telegram.org/bots/webapps
NationBuilder feature categories: https://support.nationbuilder.com/en
Action Network features: https://help.actionnetwork.org/hc/en-us/articles/203853025-What-type-of-actions-do-you-offer
Security advice to political candidates: https://www.cyber.gc.ca/en/guidance/cyber-security-advice-political-candidates
CISA campaign cyber checklist: https://www.cisa.gov/sites/default/files/publications/dhs_campaign_checklist_final_october.pdf
Cloudflare D1 limits: https://developers.cloudflare.com/d1/platform/limits/
Cloudflare D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
