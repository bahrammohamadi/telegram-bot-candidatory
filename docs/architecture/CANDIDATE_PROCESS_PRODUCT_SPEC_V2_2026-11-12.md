# Candidatory — Candidate Lifecycle, Process Architecture and Audit-Ready Product Specification v2
Date: 2026-11-12 | Status: Proposed baseline; requires user and legal review before implementation.

## Product purpose and boundaries
Provide a neutral, user-directed election-readiness and operations workspace: official legal information, personal learning, skills practice, task/calendar/team/budget management, transparency and records. Do not score likelihood of election victory, infer voter political preferences, microtarget voters, automate persuasion, fabricate endorsements or send unsolicited campaign messages. The app is not a substitute for legal advice.

## Actors and access
Visitor/explorer, candidate, invited collaborator, advisor/reviewer, organization workspace owner, platform support, platform administrator. A person may hold multiple workspace roles; permissions are scoped per workspace and feature, never inferred from Telegram username. Candidate owns their personal record. Invitations expire and can be revoked. Admin access uses explicit least-privilege RBAC and audited elevation.

## Candidate lifecycle state machine
EXPLORING -> PREPARING -> ELIGIBILITY_REVIEW -> REGISTRATION_PLANNED -> REGISTERED -> ACTIVE_PERIOD -> ELECTION_DAY -> POST_ELECTION -> ARCHIVED.
Branches: PAUSED, WITHDRAWN, NOT_ELIGIBLE, DISQUALIFIED, ELECTION_DELAYED, CANCELLED. Transition rules must be configurable by jurisdiction/election type and verified official events; candidate self-report is clearly distinguished from official confirmation. Re-entry and election-cycle cloning preserve history. Do not assume the same calendar applies to every election.

## End-to-end process contracts
P01 Entry: Telegram initData verification, account matching, disclosure, language/accessibility, consent; output session and resumable profile; failures: expired signature, missing Telegram context, offline.
P02 Context: election type, geography, intended election cycle, current phase, experience, time availability, team size and optional budget band; output ElectionContext; fields skippable unless required for a specific service.
P03 Eligibility and rules: jurisdiction-specific source registry with URL, authority, effective date, retrieval date, verification status and legal disclaimer; output a checklist, never an unsupported eligibility verdict.
P04 Needs diagnostic: user-reported capabilities and objective knowledge checks separately; output uncertainty-aware gaps, not a victory prediction.
P05 Roadmap: configurable phase templates plus user capacity, prerequisites, deadlines, dependencies, accessibility, cost and opt-in reminders; output weekly priorities and next action.
P06 Execution: tasks, milestones, meetings, shared documents, approval states, workload limits, calendar conflict detection and rescheduling; output traceable work evidence.
P07 Learning: courses, official source references, quizzes, practice history, revision; output competency progress with provenance.
P08 Speech practice: explicit consent for recording/storage, locally processed where feasible, optional AI feedback with limitations, user deletion; output private skill feedback.
P09 Team: invitation, workspace roles, task assignment, review and offboarding; output permission-scoped collaboration history.
P10 Finance: budgets, expenses, document attachments, reconciliation, exports and jurisdictional compliance warnings; output auditable ledger, not automated legal certification.
P11 Public information content: factual drafts, citation checks, accessibility, human review, version history and approval; no automated mass messaging, voter profiling or targeted persuasion.
P12 AI assistant: bounded retrieval from dated sources, consent, budget/quotas, refusal on unsupported legal claims, human approval for consequential actions; output explanation and cited evidence.
P13 Progress and weekly review: distinguish task completion, skill improvement, legal checklist and financial status; output progress with denominators and missing-data warnings.
P14 Election-period operations: deadline reminders, official guidance links, contingency checklist, incident records and accessibility; do not make unverified procedural claims.
P15 Closure: archival/export, retention choices, access revocation, financial reconciliation, post-election learning and next-cycle transition.
P16 Support/privacy: issue reports, correction, export, deletion/retention policy, security incident escalation and user consent history.

## Navigation and UX
Primary tabs: Today, Roadmap, Work, Learn, Account. Today: stage, verified deadline, up to 3 priorities, blockers and one next action. Work: tasks, calendar, team, expenses, files, approvals. Learn: diagnostics, lessons, quizzes, speech, official rules. Contextual entry to AI and studio; avoid a grid of disconnected features. Design Persian RTL, Telegram theme/viewport, 320/375/430 px, keyboard and screen-reader accessibility, loading/empty/error/offline states, autosave and resumable onboarding.

## Core data model
User, IdentityLink, ConsentRecord, CandidateProfile, ElectionCycle, ElectionContext, StageTransition, LegalSource, LegalRequirement, Assessment, AssessmentAttempt, Competency, Goal, RoadmapVersion, Milestone, Task, TaskEvent, CalendarEvent, TeamWorkspace, Membership, RoleGrant, Invitation, LearningModule, LearningProgress, PracticeSession, MediaAsset, Expense, Budget, Receipt, Document, ContentDraft, ContentApproval, AIUsage, Entitlement, NotificationPreference, AuditEvent, SupportTicket, PrivacyRequest. Each private record has owner/workspace and retention classification. Use additive D1 migrations with rollback and backups.

## Cross-cutting controls
Signed Telegram initData on sensitive APIs; server-side authorization on each row and workspace; input schema validation; idempotency for writes; pagination; optimistic concurrency; rate limits; CSRF/CORS and CSP as applicable; audit logging without secret/PII leakage; consent and retention; encryption and access policy for sensitive files; payment state machine and no live charges without authorization; backup/restore; feature flags; structured errors; observability; deployment rollback.

## Exceptional flows
Expired initData, duplicate Telegram accounts, no official election date, contradictory laws, change of constituency, election postponement, ineligibility, withdrawal, user switching workspace, collaborator revocation, missed deadlines, offline use, D1 outage, failed AI provider, partial write, exhausted quota, payment dispute, receipt exposure, account export/deletion, data migration conflict, notification opt-out, and backup restore. Each must have user-visible safe state and operational runbook.

## Acceptance gates
G0 Source and legal provenance verified per jurisdiction; outdated or unverified rules labeled.
G1 New user completes optional onboarding and receives a useful first task within 3 minutes; no forced payment.
G2 Returning user reaches next action within 2 taps; can pause/resume/replan.
G3 Two signed Telegram users cannot access each other's records, files, tasks, receipts or workspace without invitation.
G4 Every write is authenticated, authorized, validated, idempotent where necessary and auditable.
G5 Task/goal/calendar progress reflects actual persisted state; no invented progress percentages.
G6 Accessibility and RTL pass on 320/375/430 px, keyboard, reduced-motion, loading/error/empty states.
G7 Legal guidance shows jurisdiction, official source, effective/review date and uncertainty.
G8 AI is optional, consented, quota-limited, traceable and safe on provider failure.
G9 Payments remain disabled until separately approved and tested; receipts private; admin actions audited.
G10 Backup restore rehearsed; production deployment has pinned artifact, rollback, health checks and owner approval for destructive actions.
G11 Candidate post-election export/archive and collaborator offboarding work without data loss.

## Build program
Phase A: route/API and full schema/column/index inventory; feature disposition matrix KEEP/REPAIR/MERGE/REBUILD/RETIRE; establish canonical source.
Phase B: auth, roles, consent, source registry, election context and resumable onboarding.
Phase C: lifecycle state engine, roadmap rules, Today dashboard, tasks/calendar/progress integration.
Phase D: education, assessments, speech practice and official legal checklist.
Phase E: team, budgets, documents, public-information studio, reporting.
Phase F: bounded AI, subscriptions/admin, notifications, support and privacy controls.
Phase G: operational hardening, data reconciliation, E2E signed two-account acceptance, monitoring and staged production rollout.

## Decisions to confirm
First launch election type and jurisdiction; whether invited collaborators are in MVP; applicable legal sources and content owners; legacy Appwrite migration scope; media retention; subscription billing provider; privacy policy owner. Defaults: start with one election type and jurisdiction, modular expansion later, and no irreversible production data migration without verified backup.

## Audit method
For every process maintain an evidence table: actor, trigger, prerequisites, inputs, decisions, source-of-truth, data writes, outputs, exceptions, permissions, privacy, KPIs, tests, owner and rollback. Label evidence as VERIFIED, PARTIAL, UNVERIFIED or PROPOSED. A green CI check is not evidence of live Telegram WebView acceptance.

## Current production caution
Live main Worker previously verified to serve preview module against REVIEW_DB. This specification does not claim those features are already production-integrated. Do not swap DB bindings blindly. Keep news Worker separate.