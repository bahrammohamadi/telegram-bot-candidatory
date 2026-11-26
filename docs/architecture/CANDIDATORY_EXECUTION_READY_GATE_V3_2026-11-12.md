# Candidatory — Execution-Ready Architecture Gate v3 (2026-11-12)
Status: CONDITIONAL GO for implementation on development branch; NO-GO for unverified production data cutover.

## Critical corrections to v2
1. Distinguish product specification from implementation evidence. Each feature must be tagged EXISTING_VERIFIED, EXISTING_UNVERIFIED, REPAIR, REBUILD, NEW or DEFER.
2. Specify a vertical-slice MVP: verified Telegram sign-in -> resumable election context -> user-controlled needs assessment -> one contextual roadmap -> one task create/complete -> persisted progress -> return visit. No dependency on paid AI.
3. Treat election eligibility, filing deadlines and official requirements as jurisdiction- and election-cycle-specific, versioned content with human source owners and review dates. Never give automated definitive eligibility determinations.
4. Model state transitions explicitly with event history, pause/resume, withdrawal, disqualification, election postponement, workspace switch and new cycle. Make transitions idempotent and reversible where legally permissible.
5. Design migration by expand/migrate/verify/contract: read-only schema and API contract diff; backup; additive migrations; dual-read only if safe; feature-flagged route migration; per-user parity checks; restore rehearsal. Never copy real personal data into review DB.
6. Every process has RACI owner, trigger, preconditions, input schema, output, persisted entities, side effects, failure recovery, authorization, privacy classification, metrics, test cases and rollback.
7. Define nonfunctional SLO targets as proposed until measured: availability 99.5% monthly, API p95 under 800ms excluding AI, error rate below 1%, onboarding completion under 3 minutes in usability test; monitor and adjust after baseline.
8. Accessibility, localization, privacy and support are core platform capabilities, not optional late phases. Test Persian RTL 320/375/430 px, screen readers, keyboard, dark theme, reduced motion, and graceful offline/retry.
9. Establish explicit consent, opt-out, retention/deletion/export and least privilege for media, contacts, team and receipts. No voter microtargeting, profiling, unsolicited campaign messages or fabricated political claims.
10. Separate AI recommendations from deterministic legal, billing, permissions and task state transitions. AI must have consent, quotas, citations, human review and safe provider failure.
11. Preserve existing Telegram bot, Worker and news service boundaries. News Worker must not be touched.
12. Require measurable release gates: pinned commit/build artifact, CI, D1 schema compatibility, two signed Telegram user tests, authorization negatives, backups/restore, canary and rollback evidence. A live URL with REVIEW_DB is not production-data parity.

## Decisions and ownership register
Product owner: user; approves scope, UX and priorities.
Engineering owner: implementation agent/developer; owns code, tests, deploy/rollback.
Election-law content owner: to be appointed per jurisdiction; approves source registry and deadlines.
Privacy/security owner: to be appointed; reviews data collection, access and retention.
Support/content operator: to be appointed; maintains educational content and incidents.
Unassigned owners are blockers for publishing authoritative legal guidance or processing sensitive media at scale, not blockers for building a safe MVP with placeholder verified-source states.

## MVP process contract
Actor: candidate/explorer with signed Telegram identity.
Trigger: opens main mini-app.
Flow: verify initData -> load/create account -> disclose privacy -> select election type/area or skip -> select stage -> optional quick needs check -> compute deterministic roadmap from approved templates -> select next action -> create/complete task -> persist owner-scoped progress -> reopen and resume.
Outputs: profile, election context, roadmap version, task and audit events.
Failure modes: invalid initData 401, DB outage 503 with retry, no official date -> label unverified, partial save -> idempotent retry, permission failure 403, plan change -> new version retaining history.
Acceptance: two distinct signed accounts cannot cross-read/write; task persists across sessions; onboarding is skippable and resumable; no AI or payment required; mobile RTL usable.

## Phase-by-phase implementation
Phase 0: produce route-to-feature inventory and D1 column/index/FK diff; inventory existing Telegram menu URL and production Worker. Establish a canonical code tree and baseline backups. Deliver feature disposition matrix.
Phase 1: shared identity/auth, RBAC, schema migration ledger, privacy/consent, structured errors, audit and feature flags.
Phase 2: vertical MVP journey and contextual Today dashboard on existing Worker behind reversible feature flag.
Phase 3: tasks, goals, calendar, progress, assessments and learning with canonical data contracts.
Phase 4: speech practice, content studio, team, documents and budgets with consent and scoped access.
Phase 5: AI assistant, entitlements, payments and notifications with explicit operational approvals.
Phase 6: performance, disaster recovery, accessibility and operational acceptance.

## No-go gates
No live schema write without verified backup/restore and additive migration review.
No DB switch from REVIEW_DB to DB until schema and route contracts pass and signed two-account test is recorded.
No live payment or outbound mass notification without separate explicit authorization.
No claims of completed implementation based solely on documentation or CI file existence.

## Definition of Done per vertical slice
Requirement traced to process contract and UX state; code reviewed; automated unit/integration/auth tests pass; D1 schema tested; privacy and accessibility checked; two-user real Telegram WebView acceptance recorded; rollback verified; exact deployment version and URL smoke-tested; monitoring observed; release note includes known limitations.

## Open decision register
Confirm first election type and jurisdiction; legal content reviewer; whether team collaboration belongs in first paid tier; migration scope from legacy Appwrite; retention periods; billing provider; production menu URL. Default: start with a single configurable election cycle and no irreversible changes.

## Immediate engineering next action
Read-only D1 PRAGMA schema comparison, map current /review/api routes and production auth behavior, and implement first safe tested code change in canonical source. Do not present this document as a production release.